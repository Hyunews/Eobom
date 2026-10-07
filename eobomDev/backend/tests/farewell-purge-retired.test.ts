// 06-05 §8 D-12 #71 — 어드민 파기 화면의 "밀려난 음성(FarewellMediaRetired)" 만료분.
//  · 만료 전(30일 안 지남) 행은 목록에 없다 · 실행하면 원장 1행 + purgedAt 기록(행은 지우지 않음) + 감사 로그
//  · 건수 불일치는 거절 · 만료 전 행을 보내면 서버 재검증(409)이 막는다
// 🔴 첫 줄 import는 testEnv여야 한다 — 전용 테스트 DB 가드가 앱보다 먼저여야 한다. 데이터는 전부 가짜.
import './helpers/testEnv';
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import type { AddressInfo } from 'node:net';
import app from '../src/app';
import prisma from '../src/config/prisma';

const DAY = 24 * 60 * 60 * 1000;
const PASSWORD = 'test-pass-1234';
const tag = `rt-${Date.now()}`;
let server: ReturnType<typeof app.listen>;
let base = '';
let adminId = '';
let token = '';
let expiredId = '';
let youngId = '';
const keys = { expired: `voice/${tag}-expired`, young: `voice/${tag}-young` };

const api = (path: string, init: RequestInit = {}) =>
  fetch(`${base}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(init.headers ?? {}) },
  });

const execute = (items: { id: string; type: string }[], expectedCount: number, password = PASSWORD) =>
  api('/api/admin/farewell-purge/execute', { method: 'POST', body: JSON.stringify({ items, expectedCount, password }) });

before(async () => {
  const rows = await prisma.$queryRaw<{ db: string }[]>`SELECT current_database() AS db`;
  assert.ok(rows[0].db.endsWith('_test'), `연결된 DB가 _test가 아닙니다: ${rows[0].db} — 테스트를 중단합니다.`);
  // R2 꺼짐(testEnv) — 버킷 이름만 있으면 원장 쓰기까지 탄다. -dev로 끝나지 않아 원장 행이 생긴다.
  process.env.R2_BUCKET_FAREWELL_VOICE = 'test-voice-bucket';

  const admin = await prisma.admin.create({
    data: { email: `purge-${tag}@example.test`, passwordHash: await bcrypt.hash(PASSWORD, 4), name: '파기시험운영자' },
  });
  adminId = admin.id;
  expiredId = (await prisma.farewellMediaRetired.create({
    data: { messageId: `m-${tag}-1`, mediaKey: keys.expired, deletedAt: new Date(Date.now() - 31 * DAY) },
  })).id;
  youngId = (await prisma.farewellMediaRetired.create({
    data: { messageId: `m-${tag}-2`, mediaKey: keys.young, deletedAt: new Date(Date.now() - 10 * DAY) },
  })).id;

  server = app.listen(0);
  await new Promise<void>((r) => server.once('listening', () => r()));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const login = await fetch(`${base}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: admin.email, password: PASSWORD }),
  });
  assert.equal(login.status, 200);
  token = (await login.json()).accessToken;
});

after(async () => {
  server?.close();
  await prisma.farewellMediaRetired.deleteMany({ where: { messageId: { in: [`m-${tag}-1`, `m-${tag}-2`] } } });
  await prisma.archivePurgeQueue.deleteMany({ where: { mediaKey: { in: [keys.expired, keys.young] } } });
  await prisma.farewellPurgeAuditLog.deleteMany({ where: { adminId } });
  if (adminId) await prisma.admin.deleteMany({ where: { id: adminId } });
  await prisma.$disconnect();
});

describe('어드민 파기 — 밀려난 음성(D-12 #71)', () => {
  it('목록: 만료된 행만 retired에 나오고 만료 전 행은 없다(키는 내려주지 않는다)', async () => {
    const res = await api('/api/admin/farewell-purge/expired');
    assert.equal(res.status, 200);
    const text = await res.text();
    const retired = JSON.parse(text).data.retired as { id: string }[];
    assert.ok(retired.some((r) => r.id === expiredId), '만료된 행이 목록에 없다');
    assert.ok(!retired.some((r) => r.id === youngId), '만료 전 행이 목록에 있다');
    assert.ok(!text.includes(keys.expired), '목록 응답에 R2 키가 실렸다');
  });

  it('만료 전 행을 보내면 서버 재검증이 409로 막고 아무것도 쓰지 않는다', async () => {
    const res = await execute([{ id: youngId, type: 'RETIRED' }], 1);
    assert.equal(res.status, 409);
    assert.equal((await prisma.farewellMediaRetired.findUniqueOrThrow({ where: { id: youngId } })).purgedAt, null);
    assert.equal(await prisma.archivePurgeQueue.count({ where: { mediaKey: keys.young } }), 0);
  });

  it('건수가 다르면 거절한다(#57) — 아무것도 쓰지 않는다', async () => {
    const res = await execute([{ id: expiredId, type: 'RETIRED' }], 2);
    assert.equal(res.status, 400);
    assert.equal((await prisma.farewellMediaRetired.findUniqueOrThrow({ where: { id: expiredId } })).purgedAt, null);
  });

  it('실행: 원장 1행 + purgedAt 기록 + 감사 로그, 행은 지우지 않는다', async () => {
    const res = await execute([{ id: expiredId, type: 'RETIRED' }], 1);
    assert.equal(res.status, 200);

    const row = await prisma.farewellMediaRetired.findUniqueOrThrow({ where: { id: expiredId } });
    assert.ok(row.purgedAt, 'purgedAt이 기록되지 않았다');
    assert.equal(await prisma.archivePurgeQueue.count({ where: { mediaKey: keys.expired, purgedAt: null } }), 1);

    const audit = await prisma.farewellPurgeAuditLog.findFirstOrThrow({ where: { adminId } });
    assert.equal(audit.targetIds, `R:${expiredId}`);
    assert.equal(audit.count, 1);
    assert.equal(audit.mediaKeys, keys.expired);

    // 다시 보내면(이미 처리됨) 재검증이 막는다 — 같은 키가 원장에 두 번 올라가지 않는다
    const again = await execute([{ id: expiredId, type: 'RETIRED' }], 1);
    assert.equal(again.status, 409);
    assert.equal(await prisma.archivePurgeQueue.count({ where: { mediaKey: keys.expired } }), 1);
  });
});

// 06-05 §8 #74 — 파기 기록 보기(읽기 전용). 감사 로그 행을 직접 심어 종류 필터를 본다.
describe('어드민 파기 기록 — 종류별 보기(#74)', () => {
  const ids = { mixed: '', letter: '', legacy: '' };
  const logs = async (type?: string) => {
    const res = await api(`/api/admin/farewell-purge/logs?pageSize=100${type ? `&type=${type}` : ''}`);
    assert.equal(res.status, 200);
    return (await res.json()).data.logs as { id: string; counts: Record<string, number>; targets: string[] }[];
  };

  before(async () => {
    const mk = (targetIds: string, count: number) =>
      prisma.farewellPurgeAuditLog.create({ data: { adminId, adminName: '파기시험운영자', targetIds, mediaKeys: '', count } });
    ids.mixed = (await mk(`V:a-${tag},R:b-${tag},V:c-${tag}`, 3)).id;
    ids.letter = (await mk(`L:d-${tag}`, 1)).id;
    ids.legacy = (await mk(`e-${tag},f-${tag}`, 2)).id; // 접두 도입 전 옛 행
  });

  it('전체: 세 행이 모두 보이고 종류별 건수가 계산된다 · 옛 행은 구분 없음', async () => {
    const all = await logs();
    assert.deepEqual(all.find((l) => l.id === ids.mixed)?.counts, { V: 2, L: 0, R: 1, unknown: 0 });
    assert.ok(all.some((l) => l.id === ids.letter));
    assert.deepEqual(all.find((l) => l.id === ids.legacy)?.counts, { V: 0, L: 0, R: 0, unknown: 2 });
  });

  it('실행 1회에 V·R이 섞이면 V·R 필터에 모두 나오고 L 필터엔 안 나온다', async () => {
    assert.ok((await logs('V')).some((l) => l.id === ids.mixed));
    assert.ok((await logs('R')).some((l) => l.id === ids.mixed));
    const l = await logs('L');
    assert.ok(!l.some((x) => x.id === ids.mixed));
    assert.ok(l.some((x) => x.id === ids.letter));
  });

  it('접두 없는 옛 행은 어느 종류 필터에도 안 나온다', async () => {
    for (const t of ['V', 'L', 'R']) assert.ok(!(await logs(t)).some((l) => l.id === ids.legacy), `${t} 필터에 옛 행이 나왔다`);
  });

  it('잘못된 type은 400 · 응답에 R2 키 필드가 없다', async () => {
    assert.equal((await api('/api/admin/farewell-purge/logs?type=X')).status, 400);
    const text = await (await api('/api/admin/farewell-purge/logs')).text();
    assert.ok(!text.includes('mediaKeys'));
  });
});
