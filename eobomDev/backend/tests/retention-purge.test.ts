// 파기 스크립트 신규 단계(10-06, 00-20 §8.1-3 · 00-19 제4조·제8조)의 순수 규칙 — DB를 쓰지 않는다.
// 통지 관문(getReconfirmGate) · 통지 provider 경계(deliverNotice) · 마스킹 값·끝난 시각 · 통지 문구.
// 🔴 첫 줄 import는 testEnv여야 한다(서비스 파일이 Prisma를 불러오므로 전용 테스트 DB 가드를 먼저 건다).
import './helpers/testEnv';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getReconfirmGate, calculateMemorialPurgeAt, calculateMemorialReconfirmDate } from '../src/utils/memorialLifecycle';
import { buildMemorialNoticeMessage, deliverNotice } from '../src/services/memorialNoticeService';
import { NoticeSendError } from '../src/services/noticeProvider';
import { getEndedAt, maskApplicantName, maskApplicantPhone } from '../src/services/retentionPurgeService';

const DAY = 24 * 60 * 60 * 1000;
const at = (iso: string) => new Date(iso);

describe('동결·파기 시각 계산', () => {
  it('purgeAt = 동결 + 3년, 재확인 가능 시점 = purgeAt − 30일', () => {
    const frozen = at('2026-10-06T00:00:00.000Z');
    const purgeAt = calculateMemorialPurgeAt(frozen);
    assert.equal(purgeAt.toISOString(), '2029-10-06T00:00:00.000Z');
    assert.equal(calculateMemorialReconfirmDate(purgeAt).getTime(), purgeAt.getTime() - 30 * DAY);
  });
});

describe('파기 통지 관문 getReconfirmGate — 통지가 닿지 않으면 파기하지 않는다', () => {
  const purgeAt = at('2029-10-06T00:00:00.000Z');
  const windowStart = purgeAt.getTime() - 30 * DAY;
  const now = new Date(purgeAt.getTime() + 1 * DAY);

  it('재확인 통지를 안 보냈으면 막는다', () => {
    const g = getReconfirmGate(purgeAt, [], now);
    assert.equal(g.passed, false);
  });

  it('마지막 재확인 시도가 실패면 막는다(통지 실패 기록)', () => {
    const g = getReconfirmGate(purgeAt, [{ kind: 'RECONFIRM', result: 'FAILED', createdAt: new Date(windowStart + DAY) }], now);
    assert.equal(g.passed, false);
    assert.match(g.reason, /실패/);
  });

  it('실패 뒤에 다시 보내 SENT가 되면(30일 경과) 통과한다', () => {
    const g = getReconfirmGate(
      purgeAt,
      [
        { kind: 'RECONFIRM', result: 'FAILED', createdAt: new Date(windowStart + DAY) },
        { kind: 'RECONFIRM', result: 'SENT', createdAt: new Date(windowStart + 2 * DAY) },
      ],
      new Date(windowStart + 2 * DAY + 30 * DAY),
    );
    assert.equal(g.passed, true);
  });

  it('SENT 뒤에 FAILED가 더 최근이면 막는다', () => {
    const g = getReconfirmGate(
      purgeAt,
      [
        { kind: 'RECONFIRM', result: 'SENT', createdAt: new Date(windowStart + DAY) },
        { kind: 'RECONFIRM', result: 'FAILED', createdAt: new Date(windowStart + 2 * DAY) },
      ],
      now,
    );
    assert.equal(g.passed, false);
  });

  it('늦게 보냈으면 보낸 날부터 30일을 기다린다(통지 직후 파기 금지)', () => {
    const lateSent = new Date(purgeAt.getTime() + 0.5 * DAY);
    const g = getReconfirmGate(purgeAt, [{ kind: 'RECONFIRM', result: 'SENT', createdAt: lateSent }], now);
    assert.equal(g.passed, false);
    const later = new Date(lateSent.getTime() + 30 * DAY + 1);
    assert.equal(getReconfirmGate(purgeAt, [{ kind: 'RECONFIRM', result: 'SENT', createdAt: lateSent }], later).passed, true);
  });

  it('지난 사이클(purgeAt − 30일 이전)의 SENT와 EXPIRY 통지는 세지 않는다', () => {
    const g = getReconfirmGate(
      purgeAt,
      [
        { kind: 'RECONFIRM', result: 'SENT', createdAt: new Date(windowStart - DAY) },
        { kind: 'EXPIRY', result: 'SENT', createdAt: new Date(windowStart + DAY) },
      ],
      now,
    );
    assert.equal(g.passed, false);
  });
});

describe('통지 발송 deliverNotice — 이메일 → 알림톡 → 실패 기록', () => {
  const msg = { subject: 's', body: 'b' };
  const okEmail = { send: async () => {} };
  const badEmail = { send: async () => { throw new NoticeSendError('EMAIL_NOT_CONFIGURED'); } };
  const okTalk = { send: async () => {} };

  it('이메일이 있고 켜져 있으면 이메일로 보낸다', async () => {
    const r = await deliverNotice({ email: 'a@b.c', contactPhone: '01012345678' }, msg, { email: okEmail, alimtalk: okTalk });
    assert.deepEqual(r, { result: 'SENT', channel: 'EMAIL', failReason: null });
  });

  it('이메일이 없으면 알림톡', async () => {
    const r = await deliverNotice({ email: null, contactPhone: '01012345678' }, msg, { email: okEmail, alimtalk: okTalk });
    assert.deepEqual(r, { result: 'SENT', channel: 'ALIMTALK', failReason: null });
  });

  it('이메일이 실패하면 연락처가 있을 때 알림톡으로 넘어간다', async () => {
    const r = await deliverNotice({ email: 'a@b.c', contactPhone: '01012345678' }, msg, { email: badEmail, alimtalk: okTalk });
    assert.equal(r.result, 'SENT');
    assert.equal(r.channel, 'ALIMTALK');
  });

  it('기능이 꺼져 있으면(provider null) 보내지 않고 통지 실패로 남긴다 — 실패 코드만, 연락처는 안 남는다', async () => {
    const r = await deliverNotice({ email: 'a@b.c', contactPhone: '01012345678' }, msg, { email: null, alimtalk: null });
    assert.equal(r.result, 'FAILED');
    assert.equal(r.failReason, 'EMAIL_DISABLED,ALIMTALK_DISABLED');
    assert.ok(!JSON.stringify(r).includes('a@b.c'));
    assert.ok(!JSON.stringify(r).includes('01012345678'));
  });

  it('연락처가 아무것도 없으면 NO_CONTACT 실패', async () => {
    const r = await deliverNotice({ email: null, contactPhone: null }, msg, { email: okEmail, alimtalk: okTalk });
    assert.deepEqual(r, { result: 'FAILED', channel: null, failReason: 'NO_CONTACT' });
  });

  it('업체 미연결(켜졌지만 구현체 없음)이면 SENT로 기록하지 않는다', async () => {
    const r = await deliverNotice({ email: 'a@b.c', contactPhone: null }, msg, { email: badEmail, alimtalk: null });
    assert.equal(r.result, 'FAILED');
    assert.equal(r.failReason, 'EMAIL_NOT_CONFIGURED');
  });
});

describe('통지 문구', () => {
  it('만료·삭제 예정 날짜를 한국 날짜로 적고, 주소는 개설자 목록 화면이다', () => {
    const m = { deceasedName: '홍길동', expiresAt: at('2026-10-06T16:00:00.000Z'), purgeAt: at('2029-10-06T00:00:00.000Z') };
    const expiry = buildMemorialNoticeMessage('EXPIRY', m, 'https://example.test/');
    assert.match(expiry.body, /2026-10-07/); // UTC 16시 = KST 다음 날 01시
    assert.match(expiry.body, /https:\/\/example\.test\/my-obituaries-memorials/);
    const reconfirm = buildMemorialNoticeMessage('RECONFIRM', m, 'https://example.test');
    assert.match(reconfirm.body, /2029-10-06/);
  });
});

describe('DB 원본 마스킹 값', () => {
  it('이름: 홍길동 → 홍*동 · 두 글자 → 홍* · 한 글자 → *', () => {
    assert.equal(maskApplicantName('홍길동'), '홍*동');
    assert.equal(maskApplicantName('남궁민수'), '남**수');
    assert.equal(maskApplicantName('이순'), '이*');
    assert.equal(maskApplicantName('김'), '*');
  });

  it('연락처: 하이픈이 섞여 있어도 숫자만 뽑아 가린다 · 규칙 밖은 고정 표기', () => {
    assert.equal(maskApplicantPhone('010-1234-5678'), '010-****-5678');
    assert.equal(maskApplicantPhone('01012345678'), '010-****-5678');
    assert.equal(maskApplicantPhone('02-123-4567'), '02-***-4567');
    assert.equal(maskApplicantPhone('1234'), '****');
    assert.equal(maskApplicantPhone('abc'), '****');
  });
});

describe('끝난 시각 getEndedAt', () => {
  const updatedAt = at('2026-09-30T00:00:00.000Z');

  it('상태 이력에서 현재 상태로 들어간 마지막 기록의 시각을 쓴다', () => {
    const history = [
      { status: 'REQUESTED', at: '2026-06-01T09:00:00.000+09:00', by: 'user' },
      { status: 'LOST', at: '2026-06-10T09:00:00.000+09:00', by: 'admin' },
      { status: 'RESPONDED', at: '2026-06-12T09:00:00.000+09:00', by: 'partner' },
      { status: 'LOST', at: '2026-06-20T09:00:00.000+09:00', by: 'admin' },
    ];
    const t = getEndedAt({ status: 'LOST', statusHistory: history, updatedAt });
    assert.equal(t.toISOString(), '2026-06-20T00:00:00.000Z');
  });

  it('이력이 비었거나 현재 상태 기록이 없으면 updatedAt', () => {
    assert.equal(getEndedAt({ status: 'LOST', statusHistory: [], updatedAt }).getTime(), updatedAt.getTime());
    assert.equal(getEndedAt({ status: 'LOST', statusHistory: [{ status: 'REQUESTED', at: '2026-06-01T00:00:00Z' }], updatedAt }).getTime(), updatedAt.getTime());
    assert.equal(getEndedAt({ status: 'LOST', statusHistory: null, updatedAt }).getTime(), updatedAt.getTime());
  });

  it('시각을 못 읽는 기록은 건너뛴다', () => {
    const t = getEndedAt({ status: 'COMPLETED', statusHistory: [{ status: 'COMPLETED', at: '엉터리' }], updatedAt });
    assert.equal(t.getTime(), updatedAt.getTime());
  });
});
