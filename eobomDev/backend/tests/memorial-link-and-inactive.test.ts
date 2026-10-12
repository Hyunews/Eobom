// 00 1회차 코드 일(10-12) — ① 따로 만든 추모관 잇기(00-13 §4.5-4-2) ② 추모관 단독 개설 재전파 고지(00-13 §8 #6)
// ③ 비활성 계정 회원 토큰 403(00-12 §5.3). 🔴 첫 줄 import는 testEnv여야 한다(전용 테스트 DB 가드). 만든 행은 끝나면 지운다.
import { TEST_JWT_SECRET } from './helpers/testEnv';
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import jwt from 'jsonwebtoken';
import app from '../src/app';
import prisma from '../src/config/prisma';

const DAY = 24 * 60 * 60 * 1000;

let server: Server;
let base = '';
const userIds: string[] = [];

async function makeUser(tag: string) {
  const user = await prisma.user.create({ data: { name: `잇기-${tag}`, email: `link-${tag}-${Date.now()}@example.test` } });
  userIds.push(user.id);
  const token = jwt.sign({ id: user.id, name: user.name, provider: 'kakao', aud: 'user' }, TEST_JWT_SECRET!, { expiresIn: '5m' });
  return { user, token };
}

const call = (method: string, url: string, token: string, body?: unknown) =>
  fetch(base + url, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: body === undefined ? undefined : JSON.stringify(body) });

const obituaryBody = (extra: Record<string, unknown> = {}) => ({
  deceasedName: '故잇기',
  chiefMournerName: '상주',
  funeralHall: '시험장례식장',
  funeralAt: new Date(Date.now() + 3 * DAY).toISOString(),
  falseReportAgreed: true,
  resharedNoticeAck: true,
  ...extra,
});

const memorialBody = (extra: Record<string, unknown> = {}) => ({ deceasedName: '故추모', falseReportAgreed: true, resharedNoticeAck: true, ...extra });

async function newObituary(token: string, extra: Record<string, unknown> = {}) {
  const res = await call('POST', '/api/obituaries', token, obituaryBody(extra));
  assert.equal(res.status, 201);
  const { data } = (await res.json()) as { data: { obituaryId?: string; obituarySlug: string } };
  return prisma.obituary.findFirstOrThrow({ where: { slug: data.obituarySlug } });
}

async function newMemorial(token: string) {
  const res = await call('POST', '/api/memorials', token, memorialBody());
  assert.equal(res.status, 201);
  const { data } = (await res.json()) as { data: { id: string } };
  return prisma.memorial.findUniqueOrThrow({ where: { id: data.id } });
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
  await prisma.obituary.deleteMany({ where: { createdByUserId: { in: userIds } } });
  await prisma.memorial.deleteMany({ where: { createdByUserId: { in: userIds } } });
  await prisma.deceased.deleteMany({ where: { registeredBy: { in: userIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  await prisma.$disconnect();
});

describe('추모관 단독 개설 — 재전파 고지(00-13 §8 #6)', () => {
  it('확인 없이 만들면 400, 확인하면 201 + resharedNoticeAckAt 기록', async () => {
    const { token } = await makeUser('ack');
    const bad = await call('POST', '/api/memorials', token, memorialBody({ resharedNoticeAck: false }));
    assert.equal(bad.status, 400);
    const missing = await call('POST', '/api/memorials', token, { deceasedName: '故추모', falseReportAgreed: true });
    assert.equal(missing.status, 400);
    const m = await newMemorial(token);
    assert.ok(m.resharedNoticeAckAt);
  });

  it('부고장 체크박스로 만든 추모관은 부고장의 확인 시각을 그대로 적는다', async () => {
    const { token } = await makeUser('copy');
    const o = await newObituary(token, { createMemorial: true });
    const m = await prisma.memorial.findUniqueOrThrow({ where: { id: o.memorialId! } });
    assert.equal(m.resharedNoticeAckAt?.getTime(), o.resharedNoticeAckAt.getTime());
  });

  it('수정 화면에서 새로 만든 추모관도 부고장 확인 시각을 복사한다', async () => {
    const { token } = await makeUser('copy2');
    const o = await newObituary(token);
    const res = await call('PATCH', `/api/obituaries/${o.id}`, token, { createMemorial: true, falseReportAgreed: true });
    assert.equal(res.status, 200);
    const after = await prisma.obituary.findUniqueOrThrow({ where: { id: o.id }, include: { memorial: true } });
    assert.equal(after.memorial?.resharedNoticeAckAt?.getTime(), o.resharedNoticeAckAt.getTime());
  });
});

describe('따로 만든 추모관 잇기(00-13 §4.5-4-2)', () => {
  it('성공: 부고장 쪽 Deceased를 남기고 추모관을 옮기며 옛 행은 지운다', async () => {
    const { token } = await makeUser('ok');
    const o = await newObituary(token);
    const m = await newMemorial(token);
    assert.notEqual(m.deceasedId, o.deceasedId);

    const res = await call('PATCH', `/api/obituaries/${o.id}`, token, { memorialId: m.id });
    assert.equal(res.status, 200);
    const body = (await res.json()) as { data: { memorialSlug: string; memorialUrl: string } };
    assert.equal(body.data.memorialSlug, m.slug);

    assert.equal((await prisma.obituary.findUniqueOrThrow({ where: { id: o.id } })).memorialId, m.id);
    assert.equal((await prisma.memorial.findUniqueOrThrow({ where: { id: m.id } })).deceasedId, o.deceasedId);
    assert.equal(await prisma.deceased.count({ where: { id: m.deceasedId } }), 0, '고아 Deceased 행이 남았다');
  });

  it('추모관 쪽에만 userId가 있으면 부고장 쪽으로 옮긴다', async () => {
    const { token } = await makeUser('uid');
    const member = await makeUser('uid-member');
    const o = await newObituary(token);
    const m = await newMemorial(token);
    await prisma.deceased.update({ where: { id: m.deceasedId }, data: { userId: member.user.id } });

    assert.equal((await call('PATCH', `/api/obituaries/${o.id}`, token, { memorialId: m.id })).status, 200);
    assert.equal((await prisma.deceased.findUniqueOrThrow({ where: { id: o.deceasedId } })).userId, member.user.id);
  });

  it('양쪽 userId가 다르면 409이고 아무것도 바뀌지 않는다', async () => {
    const { token } = await makeUser('conf');
    const a = await makeUser('conf-a');
    const b = await makeUser('conf-b');
    const o = await newObituary(token);
    const m = await newMemorial(token);
    await prisma.deceased.update({ where: { id: o.deceasedId }, data: { userId: a.user.id } });
    await prisma.deceased.update({ where: { id: m.deceasedId }, data: { userId: b.user.id } });

    assert.equal((await call('PATCH', `/api/obituaries/${o.id}`, token, { memorialId: m.id })).status, 409);
    assert.equal((await prisma.obituary.findUniqueOrThrow({ where: { id: o.id } })).memorialId, null);
    assert.equal((await prisma.memorial.findUniqueOrThrow({ where: { id: m.id } })).deceasedId, m.deceasedId);
    assert.equal(await prisma.deceased.count({ where: { id: m.deceasedId } }), 1);
  });

  it('거절: createMemorial과 함께 400 · 이미 추모관 있음 409 · 남의 추모관 404 · 다른 부고장에 이어짐 409 · 내려진 추모관 409', async () => {
    const { token } = await makeUser('rej');
    const other = await makeUser('rej-other');
    const o = await newObituary(token);
    const m = await newMemorial(token);

    assert.equal((await call('PATCH', `/api/obituaries/${o.id}`, token, { memorialId: m.id, createMemorial: true, falseReportAgreed: true })).status, 400);

    const theirs = await newMemorial(other.token);
    assert.equal((await call('PATCH', `/api/obituaries/${o.id}`, token, { memorialId: theirs.id })).status, 404);
    assert.equal((await call('PATCH', `/api/obituaries/${o.id}`, token, { memorialId: '00000000-0000-0000-0000-000000000000' })).status, 404);

    const o2 = await newObituary(token);
    const taken = await newMemorial(token);
    assert.equal((await call('PATCH', `/api/obituaries/${o2.id}`, token, { memorialId: taken.id })).status, 200);
    assert.equal((await call('PATCH', `/api/obituaries/${o.id}`, token, { memorialId: taken.id })).status, 409);

    await prisma.memorial.update({ where: { id: m.id }, data: { hiddenAt: new Date() } });
    assert.equal((await call('PATCH', `/api/obituaries/${o.id}`, token, { memorialId: m.id })).status, 409);

    const fresh = await newMemorial(token);
    assert.equal((await call('PATCH', `/api/obituaries/${o2.id}`, token, { memorialId: fresh.id })).status, 409, '이미 추모관이 있는 부고장');
  });

  it('GET /api/me/memorials 가 obituaryId를 싣는다(잇기 목록용)', async () => {
    const { token } = await makeUser('list');
    const o = await newObituary(token);
    const m = await newMemorial(token);
    const free = await newMemorial(token);
    await call('PATCH', `/api/obituaries/${o.id}`, token, { memorialId: m.id });
    const res = await call('GET', '/api/me/memorials', token);
    const { data } = (await res.json()) as { data: { id: string; obituaryId: string | null }[] };
    assert.equal(data.find((x) => x.id === m.id)?.obituaryId, o.id);
    assert.equal(data.find((x) => x.id === free.id)?.obituaryId, null);
  });
});

describe('비활성 계정(00-12 §5.3)', () => {
  it('memorializedAt이 있으면 이미 받은 회원 토큰도 403, 없는 회원·토큰 없는 요청은 그대로', async () => {
    const live = await makeUser('live');
    const dead = await makeUser('dead');
    await prisma.user.update({ where: { id: dead.user.id }, data: { memorializedAt: new Date() } });

    const blocked = await call('GET', '/api/me/memorials', dead.token);
    assert.equal(blocked.status, 403);
    assert.match(((await blocked.json()) as { message: string }).message, /사용할 수 없는 계정/);

    assert.equal((await call('GET', '/api/me/memorials', live.token)).status, 200);
    assert.equal((await fetch(`${base}/api/memorials/does-not-exist`)).status, 404, '공개 열람은 토큰이 없으니 영향 없다');
  });
});

describe('카톡 카드용 이름 조회(07-03 §3.4)', () => {
  it('이름만 내려주고 조회수를 올리지 않는다 · 종료된 부고장은 404', async () => {
    const { token } = await makeUser('og');
    const o = await newObituary(token);
    const res = await fetch(`${base}/api/obituaries/${o.slug}/og`);
    assert.equal(res.status, 200);
    const body = (await res.json()) as { data: Record<string, unknown> };
    assert.deepEqual(body.data, { deceasedName: '故잇기' });
    assert.equal((await prisma.obituary.findUniqueOrThrow({ where: { id: o.id } })).viewCount, 0);

    await prisma.obituary.update({ where: { id: o.id }, data: { closedAt: new Date() } });
    assert.equal((await fetch(`${base}/api/obituaries/${o.slug}/og`)).status, 404);
    assert.equal((await fetch(`${base}/api/obituaries/nope/og`)).status, 404);
  });
});
