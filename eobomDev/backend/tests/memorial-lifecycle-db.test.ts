// 추모관 동결·통지 관문·연장·원본 마스킹(10-06, 00-20 §8.1-3~5 · 00-19 제4조·제8조) — DB·HTTP 시험.
// 순수 규칙은 tests/retention-purge.test.ts. 여기는 "실제 질의가 의도한 행만 잡는가"를 본다.
// 🔴 첫 줄 import는 testEnv여야 한다(전용 테스트 DB 가드). 만든 행은 끝나면 id로 지운다(전용 테스트 DB).
import { TEST_JWT_SECRET } from './helpers/testEnv';
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import jwt from 'jsonwebtoken';
import app from '../src/app';
import prisma from '../src/config/prisma';
import { findFreezeTargets, freezeMemorial, findNoticeDue } from '../src/services/memorialLifecycleService';
import { findMemorialExpiredWithSkips } from '../src/services/memorialPurgeService';
import { generateExtendToken } from '../src/services/memorialExtendService';
import {
  findLeadMaskTargets,
  findConsultMaskTargets,
  maskLeads,
  maskConsultRequests,
  countSocialUnlinkedExpired,
  purgeSocialUnlinkedExpired,
  countGuestbookDeletedExpired,
  purgeGuestbookDeletedExpired,
  MASKED_CONTENT_TEXT,
} from '../src/services/retentionPurgeService';

const DAY = 24 * 60 * 60 * 1000;
const now = new Date();
const ago = (days: number) => new Date(now.getTime() - days * DAY);
const ahead = (days: number) => new Date(now.getTime() + days * DAY);

let server: Server;
let base = '';
const userIds: string[] = [];
const deceasedIds: string[] = [];
const leadIds: string[] = [];
const consultIds: string[] = [];
const expertIds: string[] = [];

async function makeOwner(tag: string) {
  const user = await prisma.user.create({ data: { name: `수명주기-${tag}`, email: `life-${tag}-${Date.now()}@example.test` } });
  userIds.push(user.id);
  const token = jwt.sign({ id: user.id, name: user.name, provider: 'kakao', aud: 'user' }, TEST_JWT_SECRET!, { expiresIn: '5m' });
  return { user, token };
}

async function makeMemorial(ownerId: string, tag: string, data: Record<string, unknown> = {}) {
  const deceased = await prisma.deceased.create({ data: { name: `故${tag}`, registeredBy: ownerId } });
  deceasedIds.push(deceased.id);
  return prisma.memorial.create({
    data: {
      slug: `life-${tag}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdByUserId: ownerId,
      deceasedId: deceased.id,
      deceasedName: deceased.name,
      falseReportAgreedAt: now,
      ...data,
    },
  });
}

before(async () => {
  const rows = await prisma.$queryRaw<{ db: string }[]>`SELECT current_database() AS db`;
  assert.ok(rows[0].db.endsWith('_test'), `연결된 DB가 _test가 아닙니다: ${rows[0].db} — 테스트를 중단합니다.`);
  server = app.listen(0);
  await new Promise<void>((r) => server.once('listening', () => r()));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(async () => {
  await new Promise<void>((r) => (server ? server.close(() => r()) : r()));
  // 추모관(→통지 기록 Cascade)은 개설자·고인 행보다 먼저 지운다
  await prisma.memorial.deleteMany({ where: { createdByUserId: { in: userIds } } });
  if (leadIds.length) await prisma.lead.deleteMany({ where: { id: { in: leadIds } } });
  if (consultIds.length) await prisma.consultRequest.deleteMany({ where: { id: { in: consultIds } } });
  if (expertIds.length) await prisma.expert.deleteMany({ where: { id: { in: expertIds } } });
  if (deceasedIds.length) await prisma.deceased.deleteMany({ where: { id: { in: deceasedIds } } });
  if (userIds.length) await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  await prisma.$disconnect();
});

describe('⑦ 동결 대상 — 닫힌·내려진·이미 동결된 추모관은 건드리지 않는다', () => {
  it('expiresAt 도래 + 열려 있는 것만 동결하고 purgeAt = 지금 + 3년', async () => {
    const { user } = await makeOwner('freeze');
    const target = await makeMemorial(user.id, 'f-target', { expiresAt: ago(1) });
    const notYet = await makeMemorial(user.id, 'f-notyet', { expiresAt: ahead(10) });
    const closed = await makeMemorial(user.id, 'f-closed', { expiresAt: ago(1), closedAt: ago(1), purgeAt: ahead(29) });
    const hidden = await makeMemorial(user.id, 'f-hidden', { expiresAt: ago(1), hiddenAt: ago(1) });
    const already = await makeMemorial(user.id, 'f-already', { expiresAt: ago(40), frozenAt: ago(5), purgeAt: ahead(1000) });

    const ids = new Set((await findFreezeTargets()).map((t) => t.id));
    assert.ok(ids.has(target.id));
    for (const m of [notYet, closed, hidden, already]) assert.ok(!ids.has(m.id), `대상이 아니어야 한다: ${m.slug}`);

    assert.equal(await freezeMemorial(target.id), true);
    const after = await prisma.memorial.findUniqueOrThrow({ where: { id: target.id } });
    assert.ok(after.frozenAt);
    const years = (after.purgeAt!.getTime() - after.frozenAt!.getTime()) / DAY / 365;
    assert.ok(years > 2.99 && years < 3.01, `purgeAt이 동결 +3년이 아니다: ${years}`);
    assert.equal(await freezeMemorial(target.id), false, '이미 동결된 건은 다시 동결하지 않는다');
    // 닫힌 추모관의 purgeAt(+30일)은 그대로다
    const closedAfter = await prisma.memorial.findUniqueOrThrow({ where: { id: closed.id } });
    assert.equal(closedAfter.purgeAt!.getTime(), closed.purgeAt!.getTime());
  });
});

describe('⑤ 파기 관문 — 통지가 닿지 않으면 동결 추모관은 지우지 않는다', () => {
  it('재확인 SENT(30일 경과)만 통과 · 실패/미발송은 건너뜀 · 닫힌 추모관은 관문 없음', async () => {
    const { user } = await makeOwner('gate');
    const purgeAt = ago(1);
    const frozenBase = { frozenAt: ago(1096), purgeAt, expiresAt: ago(1500) };
    const noNotice = await makeMemorial(user.id, 'g-none', frozenBase);
    const failed = await makeMemorial(user.id, 'g-failed', frozenBase);
    const sent = await makeMemorial(user.id, 'g-sent', frozenBase);
    const closed = await makeMemorial(user.id, 'g-closed', { closedAt: ago(40), purgeAt });

    await prisma.memorialNotice.create({ data: { memorialId: failed.id, kind: 'RECONFIRM', channel: 'EMAIL', result: 'FAILED', failReason: 'EMAIL_DISABLED', createdAt: ago(30.5) } });
    await prisma.memorialNotice.create({ data: { memorialId: sent.id, kind: 'RECONFIRM', channel: 'EMAIL', result: 'SENT', createdAt: ago(30.5) } });

    const { targets, skipped } = await findMemorialExpiredWithSkips();
    const targetIds = new Set(targets.map((t) => t.id));
    const skippedIds = new Set(skipped.map((s) => s.id));
    assert.ok(targetIds.has(sent.id), 'SENT + 30일 경과는 파기 대상');
    assert.ok(targetIds.has(closed.id), '닫힌 추모관은 관문 없이 대상');
    assert.ok(skippedIds.has(noNotice.id) && !targetIds.has(noNotice.id), '통지 미발송은 건너뜀');
    assert.ok(skippedIds.has(failed.id) && !targetIds.has(failed.id), '통지 실패는 건너뜀');
  });
});

describe('⑦ 통지 대상 선정', () => {
  it('통지일이 도래한 활성 추모관은 EXPIRY, 파기 30일 전이 된 동결 추모관은 RECONFIRM · 이번 사이클 SENT가 있으면 제외', async () => {
    const { user } = await makeOwner('due');
    // 개설 400일 전·만료 5일 뒤 → 통지일(createdAt+368일 → 만료−14일 가드)이 이미 지났다
    const expiry = await makeMemorial(user.id, 'd-expiry', { createdAt: ago(390), expiresAt: ahead(5) });
    const expirySent = await makeMemorial(user.id, 'd-expiry-sent', { createdAt: ago(390), expiresAt: ahead(5) });
    await prisma.memorialNotice.create({ data: { memorialId: expirySent.id, kind: 'EXPIRY', channel: 'EMAIL', result: 'SENT' } });
    const reconfirm = await makeMemorial(user.id, 'd-reconfirm', { frozenAt: ago(1060), purgeAt: ahead(20), expiresAt: ago(1500) });
    const tooEarly = await makeMemorial(user.id, 'd-early', { frozenAt: ago(100), purgeAt: ahead(900), expiresAt: ago(500) });

    const due = await findNoticeDue();
    const find = (id: string) => due.find((d) => d.id === id);
    assert.equal(find(expiry.id)?.kind, 'EXPIRY');
    assert.equal(find(expirySent.id), undefined);
    assert.equal(find(reconfirm.id)?.kind, 'RECONFIRM');
    assert.equal(find(tooEarly.id), undefined);
  });
});

describe('연장(00-20 §8.1-4)', () => {
  const post = (path: string, token?: string) =>
    fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) } });

  it('링크: GET은 조회뿐(연장 안 함) → POST가 연장 → 같은 토큰은 한 번뿐', async () => {
    const { user } = await makeOwner('ext-link');
    const m = await makeMemorial(user.id, 'e-link', { frozenAt: ago(1000), purgeAt: ahead(10), expiresAt: ago(1400) });
    const { token, tokenHash } = generateExtendToken();
    await prisma.memorialNotice.create({ data: { memorialId: m.id, kind: 'RECONFIRM', channel: 'EMAIL', result: 'SENT', tokenHash } });

    const get = await fetch(`${base}/api/memorials/extend/${token}`);
    assert.equal(get.status, 200);
    const body = await get.json();
    assert.equal(body.data.frozen, true);
    assert.deepEqual(Object.keys(body.data).sort(), ['deceasedName', 'expiresAt', 'frozen', 'purgeAt']); // 개설자 정보 없음
    const afterGet = await prisma.memorial.findUniqueOrThrow({ where: { id: m.id } });
    assert.ok(afterGet.frozenAt && afterGet.purgeAt, 'GET만으로 연장되면 안 된다');

    const ok = await post(`/api/memorials/extend/${token}`);
    assert.equal(ok.status, 200);
    const done = await prisma.memorial.findUniqueOrThrow({ where: { id: m.id } });
    assert.equal(done.frozenAt, null);
    assert.equal(done.purgeAt, null);
    const days = (done.expiresAt!.getTime() - Date.now()) / DAY;
    assert.ok(days > 394 && days <= 395.01, `expiresAt이 지금+395일이 아니다: ${days}`);
    const rec = await prisma.memorialNotice.findFirst({ where: { memorialId: m.id, kind: 'EXTEND' } });
    assert.equal(rec?.channel, 'LINK');

    assert.equal((await post(`/api/memorials/extend/${token}`)).status, 404, '1회용 — 두 번째는 거부');
    assert.equal((await fetch(`${base}/api/memorials/extend/${token}`)).status, 404);
  });

  it('링크: 닫힌 추모관은 409이고 토큰을 소모하지 않는다 · 엉터리 토큰은 404 · 기간 지난 토큰은 410', async () => {
    const { user } = await makeOwner('ext-closed');
    const closed = await makeMemorial(user.id, 'e-closed', { closedAt: ago(1), purgeAt: ahead(29), expiresAt: ahead(100) });
    const c = generateExtendToken();
    await prisma.memorialNotice.create({ data: { memorialId: closed.id, kind: 'EXPIRY', result: 'SENT', channel: 'EMAIL', tokenHash: c.tokenHash } });
    assert.equal((await post(`/api/memorials/extend/${c.token}`)).status, 409);
    const row = await prisma.memorialNotice.findUniqueOrThrow({ where: { tokenHash: c.tokenHash } });
    assert.equal(row.usedAt, null);
    const still = await prisma.memorial.findUniqueOrThrow({ where: { id: closed.id } });
    assert.ok(still.closedAt && still.purgeAt, '닫힌 추모관은 그대로');

    assert.equal((await post('/api/memorials/extend/not-a-real-token')).status, 404);

    const old = await makeMemorial(user.id, 'e-old', { frozenAt: ago(1200), purgeAt: ago(2), expiresAt: ago(1600) });
    const o = generateExtendToken();
    await prisma.memorialNotice.create({ data: { memorialId: old.id, kind: 'RECONFIRM', result: 'SENT', channel: 'EMAIL', tokenHash: o.tokenHash } });
    assert.equal((await post(`/api/memorials/extend/${o.token}`)).status, 410);
  });

  it('로그인: 개설자 본인만 연장 · 남의 추모관은 404 · 비로그인 401 · 연장 기록 LOGIN', async () => {
    const owner = await makeOwner('ext-owner');
    const other = await makeOwner('ext-other');
    const m = await makeMemorial(owner.user.id, 'e-owner', { expiresAt: ahead(3) });

    assert.equal((await post(`/api/memorials/${m.id}/extend`)).status, 401);
    assert.equal((await post(`/api/memorials/${m.id}/extend`, other.token)).status, 404);
    assert.equal((await post(`/api/memorials/${m.id}/extend`, owner.token)).status, 200);
    const after = await prisma.memorial.findUniqueOrThrow({ where: { id: m.id } });
    assert.ok(after.expiresAt!.getTime() - Date.now() > 394 * DAY);
    const rec = await prisma.memorialNotice.findFirst({ where: { memorialId: m.id, kind: 'EXTEND' } });
    assert.equal(rec?.channel, 'LOGIN');
  });

  // ⑥ 버튼 표시 시점(§8.1-4 ②-가) — 목록 canExtend와 연장 API가 같은 판정을 쓴다
  it('로그인: 통지 시점 전은 canExtend=false·연장 409 · 시점 후·동결은 true·연장 OK · 닫힘/내림은 false·409', async () => {
    const o = await makeOwner('ext-window');
    const active = { expiresAt: ahead(395) }; // 개설 직후 — 통지일(createdAt+368일)이 아직 멀다
    const before = await makeMemorial(o.user.id, 'w-before', active);
    const afterNotice = await makeMemorial(o.user.id, 'w-after', { createdAt: ago(390), expiresAt: ahead(5) });
    const frozen = await makeMemorial(o.user.id, 'w-frozen', { frozenAt: ago(10), purgeAt: ahead(1000), expiresAt: ago(10) });
    const closed = await makeMemorial(o.user.id, 'w-closed', { createdAt: ago(390), expiresAt: ahead(5), closedAt: ago(1), purgeAt: ahead(29) });
    const hidden = await makeMemorial(o.user.id, 'w-hidden', { createdAt: ago(390), expiresAt: ahead(5), hiddenAt: ago(1) });

    const res = await fetch(`${base}/api/me/memorials`, { headers: { Authorization: `Bearer ${o.token}` } });
    assert.equal(res.status, 200);
    const list = (await res.json()).data as { id: string; canExtend: boolean }[];
    const can = (id: string) => list.find((x) => x.id === id)?.canExtend;
    assert.equal(can(before.id), false);
    assert.equal(can(afterNotice.id), true);
    assert.equal(can(frozen.id), true);
    assert.equal(can(closed.id), false);
    assert.equal(can(hidden.id), false);

    const r = await post(`/api/memorials/${before.id}/extend`, o.token);
    assert.equal(r.status, 409);
    assert.equal((await r.json()).message, '아직 연장할 수 있는 기간이 아닙니다.');
    const untouched = await prisma.memorial.findUniqueOrThrow({ where: { id: before.id } });
    assert.equal(untouched.expiresAt!.getTime(), before.expiresAt!.getTime(), '거부된 연장은 아무것도 바꾸지 않는다');
    assert.equal((await post(`/api/memorials/${closed.id}/extend`, o.token)).status, 409);
    assert.equal((await post(`/api/memorials/${hidden.id}/extend`, o.token)).status, 409);
    assert.equal((await post(`/api/memorials/${afterNotice.id}/extend`, o.token)).status, 200);
    assert.equal((await post(`/api/memorials/${frozen.id}/extend`, o.token)).status, 200);
  });
});

describe('⑩ 원본 마스킹 — 이름·연락처·내용', () => {
  it('끝난 지 90일 지난 문의·상담만 가리고, 90일 안이거나 진행 중이거나 이미 처리된 건은 그대로', async () => {
    const mkLead = async (tag: string, data: Record<string, unknown>) => {
      const l = await prisma.lead.create({
        data: { leadNo: `TST-${tag}-${Date.now()}`, type: 'QUOTE', applicantName: '홍길동', applicantPhone: '010-1234-5678', payload: { message: '고인 가족 사정' }, ...data },
      });
      leadIds.push(l.id);
      return l;
    };
    const old = await mkLead('old', { status: 'LOST', statusHistory: [{ status: 'LOST', at: ago(100).toISOString(), by: 'admin' }] });
    const fresh = await mkLead('fresh', { status: 'LOST', statusHistory: [{ status: 'LOST', at: ago(10).toISOString(), by: 'admin' }] });
    const open = await mkLead('open', { status: 'REQUESTED', statusHistory: [{ status: 'REQUESTED', at: ago(200).toISOString(), by: 'user' }] });
    const done = await mkLead('done', { status: 'LOST', maskedAt: ago(5), statusHistory: [{ status: 'LOST', at: ago(200).toISOString(), by: 'admin' }] });

    const expert = await prisma.expert.create({
      data: { email: `life-expert-${Date.now()}@example.test`, passwordHash: 'x', category: 'LAWYER', name: '시험전문가', licenseNo: `L-${Date.now()}`, contactPhone: '01000000000' },
    });
    expertIds.push(expert.id);
    const mkConsult = async (tag: string, data: Record<string, unknown>) => {
      const c = await prisma.consultRequest.create({
        data: { requestNo: `TSC-${tag}-${Date.now()}`, expertId: expert.id, categorySnapshot: 'LAWYER', applicantName: '김철수', applicantPhone: '01098765432', channel: 'PHONE', content: '상속 빚 문의', ...data },
      });
      consultIds.push(c.id);
      return c;
    };
    const cOld = await mkConsult('old', { status: 'COMPLETED', statusHistory: [{ status: 'COMPLETED', at: ago(91).toISOString(), by: 'expert' }] });
    const cFresh = await mkConsult('fresh', { status: 'CANCELLED', statusHistory: [{ status: 'CANCELLED', at: ago(3).toISOString(), by: 'user' }] });

    const leadTargets = (await findLeadMaskTargets()).map((t) => t.id);
    assert.ok(leadTargets.includes(old.id));
    for (const l of [fresh, open, done]) assert.ok(!leadTargets.includes(l.id));
    const consultTargets = (await findConsultMaskTargets()).map((t) => t.id);
    assert.ok(consultTargets.includes(cOld.id) && !consultTargets.includes(cFresh.id));

    await maskLeads((await findLeadMaskTargets()).filter((t) => leadIds.includes(t.id)));
    await maskConsultRequests((await findConsultMaskTargets()).filter((t) => consultIds.includes(t.id)));

    const lead = await prisma.lead.findUniqueOrThrow({ where: { id: old.id } });
    assert.equal(lead.applicantName, '홍*동');
    assert.equal(lead.applicantPhone, '010-****-5678');
    assert.deepEqual(lead.payload, {});
    assert.ok(lead.maskedAt);
    assert.equal(lead.leadNo, old.leadNo, '접수번호는 그대로');
    const freshAfter = await prisma.lead.findUniqueOrThrow({ where: { id: fresh.id } });
    assert.equal(freshAfter.applicantName, '홍길동');
    assert.deepEqual(freshAfter.payload, { message: '고인 가족 사정' });

    const consult = await prisma.consultRequest.findUniqueOrThrow({ where: { id: cOld.id } });
    assert.equal(consult.applicantName, '김*수');
    assert.equal(consult.applicantPhone, '010-****-5432');
    assert.equal(consult.content, MASKED_CONTENT_TEXT);
    assert.ok(consult.maskedAt);
    assert.equal(consult.requestNo, cOld.requestNo);
    const cFreshAfter = await prisma.consultRequest.findUniqueOrThrow({ where: { id: cFresh.id } });
    assert.equal(cFreshAfter.content, '상속 빚 문의');

    // 한 번 처리한 건은 다시 대상이 되지 않는다(멱등)
    assert.ok(!(await findLeadMaskTargets()).some((t) => t.id === old.id));
  });
});

describe('⑧ 소셜 해제 1년 · ⑨ 삭제된 방명록 3개월', () => {
  it('소셜: 해제 1년 지난 행만 삭제 — 연동 중·최근 해제는 남는다', async () => {
    const { user } = await makeOwner('social');
    const mk = (tag: string, unlinkedAt: Date | null) =>
      prisma.socialAccount.create({ data: { userId: user.id, provider: 'KAKAO', providerId: `life-${tag}-${Date.now()}`, unlinkedAt } });
    const expired = await mk('exp', ago(400));
    const recent = await mk('rec', ago(30));
    const linked = await mk('lnk', null);
    assert.ok((await countSocialUnlinkedExpired()) >= 1);
    await purgeSocialUnlinkedExpired();
    assert.equal(await prisma.socialAccount.findUnique({ where: { id: expired.id } }), null);
    assert.ok(await prisma.socialAccount.findUnique({ where: { id: recent.id } }));
    assert.ok(await prisma.socialAccount.findUnique({ where: { id: linked.id } }));
  });

  it('방명록: 삭제 표시 3개월 지난 글만 삭제 — 최근 삭제·운영자가 내린(hiddenAt) 글·정상 글은 남는다', async () => {
    const { user } = await makeOwner('guestbook');
    const memorial = await makeMemorial(user.id, 'gb');
    const mk = (tag: string, data: Record<string, unknown>) =>
      prisma.memorialGuestbook.create({ data: { memorialId: memorial.id, authorName: tag, message: tag, ...data } });
    const byOwner = await mk('owner-old', { deletedByOwnerAt: ago(100) });
    const byAuthor = await mk('author-old', { deletedByAuthorAt: ago(100) });
    const recent = await mk('recent', { deletedByOwnerAt: ago(10) });
    const hidden = await mk('hidden', { deletedByOwnerAt: ago(100), hiddenAt: ago(100) });
    const normal = await mk('normal', {});
    assert.ok((await countGuestbookDeletedExpired()) >= 2);
    await purgeGuestbookDeletedExpired();
    assert.equal(await prisma.memorialGuestbook.findUnique({ where: { id: byOwner.id } }), null);
    assert.equal(await prisma.memorialGuestbook.findUnique({ where: { id: byAuthor.id } }), null);
    for (const g of [recent, hidden, normal]) assert.ok(await prisma.memorialGuestbook.findUnique({ where: { id: g.id } }), `남아야 한다: ${g.authorName}`);
  });
});
