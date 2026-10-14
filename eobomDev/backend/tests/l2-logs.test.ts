// 00-42 §5.3 L-2 — 동의 이력(D) · 사후개봉 열람 기록(E) · 파기 기록(F) 시험.
//  · D: 동의 칸이 바뀌는 곳(재동의·마이페이지 마케팅·가입 중첩 쓰기)에서 같은 트랜잭션으로 한 줄. 이력 쓰기가 실패하면 User 칸도 그대로(롤백).
//  · E: GET /api/ending-note/family-view — 엔딩노트마다 한 줄(섹션 종류만, 내용 아님) · 기록을 못 쓰면 503이고 내용을 내보내지 않는다 · 엔딩노트가 지워지면 함께 삭제.
//  · F: PurgeRunLog 실행자·대상 id · 기록 실패는 throw하지 않고 false · 동의 이력(파기 후 1년)·파기 기록(2년) 보관 파기.
// 🔴 첫 줄 import는 testEnv여야 한다 — 전용 테스트 DB 가드가 앱보다 먼저여야 한다. 데이터는 전부 가짜, 끝나면 자기가 만든 행만 id로 지운다.
import { TEST_JWT_SECRET } from './helpers/testEnv';
import { after, before, describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import jwt from 'jsonwebtoken';
import app from '../src/app';
import prisma from '../src/config/prisma';
import { POLICY } from '../src/config/policy';
import { encryptNoteField } from '../src/utils/crypto';
import { signupConsentNested } from '../src/services/consentLogService';
import { recordPurgeRun, purgeConsentLogExpired, purgeRunLogExpired } from '../src/services/retentionPurgeService';
import { purgeOpsLogExpired } from '../src/services/opsLogPurgeService';

let server: Server;
let base = '';
const userIds: string[] = [];
const purgeRunIds: string[] = [];
const DAY = 24 * 60 * 60 * 1000;
const tag = `l2-${Date.now()}`;

// DB 실패 주입 — Prisma $use(ops-log.test.ts와 같은 방식). Prisma 모델 위임 객체는 mock.method로 못 바꾼다.
//  · failing: 'Model.action'을 던지게 한다(기록을 못 쓰는 상황).
//  · breakConsentLogFk: ConsentLog 삽입을 **실제 DB 제약 위반**(없는 회원 id)으로 바꿔 같은 트랜잭션 안에서 실패시킨다 —
//    User 갱신이 먼저 실행된 뒤 터지므로 롤백을 진짜로 시험한다(미들웨어에서 던지면 아무것도 실행되기 전에 끝나 시험이 되지 않는다).
const failing = new Set<string>();
let breakConsentLogFk = false;
prisma.$use(async (params, next) => {
  if (failing.has(`${params.model}.${params.action}`)) throw new Error('주입된 DB 실패');
  if (breakConsentLogFk && params.model === 'ConsentLog' && params.action === 'createMany') {
    params.args = {
      data: [{ userId: '00000000-0000-4000-8000-0000000000ff', kind: 'TERMS', action: 'AGREE', version: 'x', source: 'RECONSENT' }],
    };
  }
  return next(params);
});

const tokenOf = (id: string) => jwt.sign({ id, name: 'L2시험', provider: 'kakao', aud: 'user' }, TEST_JWT_SECRET!, { expiresIn: '5m' });

async function makeUser(label: string, data: object = {}) {
  const user = await prisma.user.create({ data: { name: `L2시험-${label}`, email: `${tag}-${label}@example.test`, ...data } });
  userIds.push(user.id);
  return { user, token: tokenOf(user.id) };
}

const call = async (method: string, path: string, token: string, body?: unknown) => {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  return { status: res.status, requestId: res.headers.get('x-request-id'), json: (await res.json().catch(() => null)) as any };
};

const logsOf = (userId: string) => prisma.consentLog.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } });
const kinds = (rows: { kind: string; action: string }[]) => rows.map((r) => `${r.kind}:${r.action}`).sort();

before(async () => {
  const rows = await prisma.$queryRaw<{ db: string }[]>`SELECT current_database() AS db`;
  assert.ok(rows[0].db.endsWith('_test'), `연결된 DB가 _test가 아닙니다: ${rows[0].db} — 테스트를 중단합니다.`);
  server = app.listen(0);
  await new Promise<void>((r) => server.once('listening', () => r()));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(async () => {
  mock.restoreAll();
  if (purgeRunIds.length) await prisma.purgeRunLog.deleteMany({ where: { id: { in: purgeRunIds } } });
  if (userIds.length) await prisma.user.deleteMany({ where: { id: { in: userIds } } }); // ConsentLog·EndingNote·열람 기록은 Cascade
  await new Promise<void>((r) => (server ? server.close(() => r()) : r()));
  await prisma.$disconnect();
});

describe('D 동의 이력 — 재동의(POST /api/me/consent)', () => {
  it('비어 있던 칸마다 한 줄 + 버전·경로가 찍힌다', async () => {
    const { user, token } = await makeUser('d-all');
    const r = await call('POST', '/api/me/consent', token, { terms: true, privacy: true, marketing: true });
    assert.equal(r.status, 200);
    const rows = await logsOf(user.id);
    assert.deepEqual(kinds(rows), ['MARKETING:AGREE', 'PRIVACY:AGREE', 'TERMS:AGREE']);
    for (const row of rows) {
      assert.equal(row.version, POLICY.consentVersion);
      assert.equal(row.source, 'RECONSENT');
    }
  });

  it('이미 값이 있는 칸은 이력을 늘리지 않는다(같은 요청 반복 · 한 칸만 비었을 때는 그 칸만)', async () => {
    const { user, token } = await makeUser('d-partial', { termsAgreedAt: new Date('2026-01-15T00:00:00.000Z') });
    await call('POST', '/api/me/consent', token, { terms: true, privacy: true });
    assert.deepEqual(kinds(await logsOf(user.id)), ['PRIVACY:AGREE']);
    await call('POST', '/api/me/consent', token, { terms: true, privacy: true });
    assert.equal((await logsOf(user.id)).length, 1);
  });

  it('필수 동의가 빠져 400이면 이력도 없다', async () => {
    const { user, token } = await makeUser('d-400');
    const r = await call('POST', '/api/me/consent', token, { terms: true });
    assert.equal(r.status, 400);
    assert.equal((await logsOf(user.id)).length, 0);
  });

  it('🔴 이력 쓰기가 실패하면 User 동의 칸도 바뀌지 않는다(같은 트랜잭션)', async () => {
    const { user, token } = await makeUser('d-rollback');
    breakConsentLogFk = true;
    try {
      const r = await call('POST', '/api/me/consent', token, { terms: true, privacy: true, marketing: true });
      assert.equal(r.status, 500);
    } finally {
      breakConsentLogFk = false;
    }
    const after = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    assert.equal(after.termsAgreedAt, null);
    assert.equal(after.privacyAgreedAt, null);
    assert.equal(after.marketingAgreedAt, null);
    assert.equal((await logsOf(user.id)).length, 0);
  });
});

describe('D 동의 이력 — 마이페이지 마케팅(PATCH /api/me/profile)', () => {
  it('없음→있음 AGREE · 같은 값 반복은 무기록 · 있음→없음 WITHDRAW', async () => {
    const { user, token } = await makeUser('d-mkt');
    await call('PATCH', '/api/me/profile', token, { marketingAgreed: true });
    await call('PATCH', '/api/me/profile', token, { marketingAgreed: true });
    assert.deepEqual(kinds(await logsOf(user.id)), ['MARKETING:AGREE']);
    assert.ok((await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).marketingAgreedAt);

    await call('PATCH', '/api/me/profile', token, { marketingAgreed: false });
    await call('PATCH', '/api/me/profile', token, { marketingAgreed: false });
    const rows = await logsOf(user.id);
    assert.deepEqual(kinds(rows), ['MARKETING:AGREE', 'MARKETING:WITHDRAW']);
    assert.ok(rows.every((r) => r.source === 'MYPAGE'));
    assert.equal((await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).marketingAgreedAt, null);
  });

  it('마케팅과 무관한 프로필 수정은 이력을 만들지 않는다', async () => {
    const { user, token } = await makeUser('d-name');
    await call('PATCH', '/api/me/profile', token, { name: '이름만 바꿈' });
    assert.equal((await logsOf(user.id)).length, 0);
  });
});

describe('D 동의 이력 — 가입(중첩 쓰기)', () => {
  it('User.create에 실은 이력은 같은 쿼리로 함께 생긴다(마케팅 체크 여부에 따라 3줄/2줄)', async () => {
    const withMkt = await prisma.user.create({
      data: { name: 'L2시험-signup-1', termsAgreedAt: new Date(), privacyAgreedAt: new Date(), marketingAgreedAt: new Date(), consentLogs: signupConsentNested(true) },
    });
    const noMkt = await prisma.user.create({
      data: { name: 'L2시험-signup-2', termsAgreedAt: new Date(), privacyAgreedAt: new Date(), consentLogs: signupConsentNested(false) },
    });
    userIds.push(withMkt.id, noMkt.id);
    const a = await logsOf(withMkt.id);
    assert.deepEqual(kinds(a), ['MARKETING:AGREE', 'PRIVACY:AGREE', 'TERMS:AGREE']);
    assert.ok(a.every((r) => r.source === 'SIGNUP' && r.version === POLICY.consentVersion));
    assert.deepEqual(kinds(await logsOf(noMkt.id)), ['PRIVACY:AGREE', 'TERMS:AGREE']);
  });
});

describe('E 사후개봉 열람 기록 — GET /api/ending-note/family-view', () => {
  let ownerId = '';
  let noteId = '';
  let viewerId = '';
  let viewerToken = '';

  before(async () => {
    const owner = await makeUser('e-owner');
    const viewer = await makeUser('e-viewer');
    ownerId = owner.user.id;
    viewerId = viewer.user.id;
    viewerToken = viewer.token;
    const note = await prisma.endingNote.create({ data: { userId: ownerId, status: 'RELEASED', releasedAt: new Date() } });
    noteId = note.id;
    await prisma.endingNoteEntry.create({
      data: { noteId, section: 'FUNERAL', releaseTiming: 'POSTMORTEM', bodyEnc: encryptNoteField(JSON.stringify({ memo: '비밀 본문' })) },
    });
    const designation = await prisma.familyDesignation.create({
      data: {
        userId: ownerId,
        name: '시험가족',
        phoneEnc: 'x',
        phoneHash: `h-${tag}`,
        relationship: 'CHILD',
        status: 'ACCEPTED',
        acceptedAt: new Date(),
        acceptedUserId: viewerId,
      },
    });
    await prisma.endingNoteGrant.create({ data: { noteId, designationId: designation.id, section: 'FUNERAL', timing: 'POSTMORTEM' } });
  });

  const viewLogs = () => prisma.endingNoteViewLog.findMany({ where: { noteId }, orderBy: { createdAt: 'asc' } });

  it('열람 응답마다 노트당 한 줄 — 섹션 종류·열람자·요청 번호만, 내용은 없다', async () => {
    const r = await call('GET', '/api/ending-note/family-view', viewerToken);
    assert.equal(r.status, 200);
    assert.equal(r.json.data[0].entries[0].section, 'FUNERAL');
    const rows = await viewLogs();
    assert.equal(rows.length, 1);
    assert.equal(rows[0].viewerId, viewerId);
    assert.deepEqual(rows[0].sections, ['FUNERAL']);
    assert.equal(rows[0].requestId, r.requestId);
    assert.ok(!JSON.stringify(rows[0]).includes('비밀 본문'));
  });

  it('다시 열람하면 한 줄이 더 쌓인다(추가만 — "누가 언제 처음 봤는가")', async () => {
    await call('GET', '/api/ending-note/family-view', viewerToken);
    assert.equal((await viewLogs()).length, 2);
  });

  it('🔴 기록을 못 쓰면 503이고 엔딩노트 내용을 내보내지 않는다', async () => {
    const before = (await viewLogs()).length;
    failing.add('EndingNoteViewLog.createMany');
    const errors = mock.method(console, 'error', () => undefined);
    try {
      const r = await call('GET', '/api/ending-note/family-view', viewerToken);
      assert.equal(r.status, 503);
      assert.equal(r.json.data, undefined);
      assert.ok(!JSON.stringify(r.json).includes('비밀 본문'));
      assert.ok(r.json.requestId);
      assert.ok(errors.mock.calls.some((c) => String(c.arguments[0]).includes('열람 기록 실패')));
    } finally {
      failing.delete('EndingNoteViewLog.createMany');
      mock.restoreAll();
    }
    assert.equal((await viewLogs()).length, before);
  });

  it('지정되지 않은 회원의 열람은 노트가 하나도 실리지 않아 기록도 없다', async () => {
    const stranger = await makeUser('e-stranger');
    const before = (await viewLogs()).length;
    const r = await call('GET', '/api/ending-note/family-view', stranger.token);
    assert.equal(r.status, 200);
    assert.deepEqual(r.json.data, []);
    assert.equal((await viewLogs()).length, before);
  });

  it('편지 음성 경로: 판정을 통과하지 못한 요청(404)은 열람 기록을 남기지 않는다', async () => {
    const before = (await viewLogs()).length;
    const r = await call('GET', '/api/ending-note/family-view/letters/00000000-0000-4000-8000-0000000000aa/audio', viewerToken);
    assert.equal(r.status, 404);
    assert.equal((await viewLogs()).length, before);
  });

  it('엔딩노트가 파기되면 열람 기록도 함께 삭제된다(Cascade)', async () => {
    assert.ok((await viewLogs()).length > 0);
    await prisma.endingNote.delete({ where: { id: noteId } });
    assert.equal((await viewLogs()).length, 0);
  });
});

describe('F 파기 기록 — PurgeRunLog', () => {
  it('실행자·대상 id 목록을 남기고, 안 주면 script·빈 목록', async () => {
    const before = await prisma.purgeRunLog.count();
    assert.equal(await recordPurgeRun('ACCOUNT_PURGE', 2, { targetIds: ['id-a', 'id-b'] }), true);
    assert.equal(await recordPurgeRun('SOCIAL_UNLINKED', 0, { executor: 'admin-1' }), true);
    const rows = await prisma.purgeRunLog.findMany({ orderBy: { createdAt: 'desc' }, take: 2 });
    assert.equal(rows.length, 2);
    purgeRunIds.push(...rows.map((r) => r.id));
    assert.equal(await prisma.purgeRunLog.count(), before + 2);
    const account = rows.find((r) => r.step === 'ACCOUNT_PURGE')!;
    assert.equal(account.executor, 'script');
    assert.deepEqual(account.targetIds, ['id-a', 'id-b']);
    assert.equal(account.affected, 2);
    const social = rows.find((r) => r.step === 'SOCIAL_UNLINKED')!;
    assert.equal(social.executor, 'admin-1');
    assert.deepEqual(social.targetIds, []);
  });

  it('🔴 기록이 실패해도 throw하지 않고 false를 돌려준다(이미 지운 파기를 되돌릴 수 없다)', async () => {
    failing.add('PurgeRunLog.create');
    const errors = mock.method(console, 'error', () => undefined);
    try {
      assert.equal(await recordPurgeRun('MEMORIAL_PURGE', 1, { targetIds: ['x'] }), false);
      assert.ok(errors.mock.calls.some((c) => String(c.arguments[0]).includes('파기 기록 실패')));
    } finally {
      failing.delete('PurgeRunLog.create');
      mock.restoreAll();
    }
  });

  it('운영 기록 보관 파기(opsLogPurgeService)도 접속·운영자 감사·에러 한 줄씩 남긴다', async () => {
    const since = new Date();
    await purgeOpsLogExpired();
    const rows = await prisma.purgeRunLog.findMany({ where: { createdAt: { gte: since }, step: { in: ['ACCESS_LOG', 'ADMIN_AUDIT_LOG', 'ERROR_LOG'] } } });
    purgeRunIds.push(...rows.map((r) => r.id));
    assert.deepEqual(rows.map((r) => r.step).sort(), ['ACCESS_LOG', 'ADMIN_AUDIT_LOG', 'ERROR_LOG']);
    assert.ok(rows.every((r) => r.executor === 'script' && r.targetIds.length === 0));
  });

  it('보관 파기: 파기 기록은 2년 지난 줄만 지운다', async () => {
    const old = await prisma.purgeRunLog.create({ data: { step: 'HEAVY_JOB_LOG', affected: 0, createdAt: new Date(Date.now() - 3 * 365 * DAY) } });
    const recent = await prisma.purgeRunLog.create({ data: { step: 'HEAVY_JOB_LOG', affected: 0, createdAt: new Date(Date.now() - 365 * DAY) } });
    purgeRunIds.push(old.id, recent.id);
    await purgeRunLogExpired();
    assert.equal(await prisma.purgeRunLog.findUnique({ where: { id: old.id } }), null);
    assert.ok(await prisma.purgeRunLog.findUnique({ where: { id: recent.id } }));
  });

  it('보관 파기: 동의 이력은 계정 파기(purgedAt) 후 1년 지난 회원 것만 지운다', async () => {
    const gone = await makeUser('f-purged-2y', { purgedAt: new Date(Date.now() - 2 * 365 * DAY) });
    const recentlyGone = await makeUser('f-purged-6m', { purgedAt: new Date(Date.now() - 180 * DAY) });
    const active = await makeUser('f-active');
    for (const u of [gone, recentlyGone, active]) {
      await prisma.consentLog.create({ data: { userId: u.user.id, kind: 'TERMS', action: 'AGREE', version: 'v0.9', source: 'SIGNUP' } });
    }
    await purgeConsentLogExpired();
    assert.equal((await logsOf(gone.user.id)).length, 0);
    assert.equal((await logsOf(recentlyGone.user.id)).length, 1);
    assert.equal((await logsOf(active.user.id)).length, 1);
  });
});
