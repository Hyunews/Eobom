// 운영자 로그인 잠금 회귀 테스트 — 00-37 §7 #5·#7.
//
// 불변 규칙: 같은 계정 연속 5회 실패 → 15분 잠금 / 잠긴 동안은 비밀번호가 맞아도 거부 /
// 잠금 응답은 한 가지 문구뿐 / 성공하면 카운터 0 / refresh 만료는 1일.
// 🔴 첫 줄 import는 testEnv여야 한다 — 전용 테스트 DB 가드(_test·localhost)가 앱보다 먼저여야 한다.
// 가짜 운영자만 만들고, 끝나면 자기 id만 지운다(전용 테스트 DB).
import { TEST_JWT_SECRET } from './helpers/testEnv';
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import app from '../src/app';
import prisma from '../src/config/prisma';

let server: Server;
let base = '';
const createdIds: string[] = [];
const PASSWORD = 'correct-horse-battery';
const LOCKED_MESSAGE = '잠시 후 다시 시도해 주세요.';
const WRONG_MESSAGE = '이메일 또는 비밀번호가 올바르지 않습니다.';

async function makeAdmin(tag: string) {
  const admin = await prisma.admin.create({
    data: { email: `lock-${tag}-${Date.now()}@example.test`, passwordHash: await bcrypt.hash(PASSWORD, 4), name: `잠금테스트-${tag}` },
  });
  createdIds.push(admin.id);
  return admin;
}

async function login(email: string, password: string) {
  const res = await fetch(`${base}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return { status: res.status, json: (await res.json().catch(() => null)) as any };
}

const row = (id: string) => prisma.admin.findUniqueOrThrow({ where: { id } });

before(async () => {
  const rows = await prisma.$queryRaw<{ db: string }[]>`SELECT current_database() AS db`;
  assert.ok(rows[0].db.endsWith('_test'), `연결된 DB가 _test가 아닙니다: ${rows[0].db} — 테스트를 중단합니다.`);
  server = app.listen(0);
  await new Promise<void>((r) => server.once('listening', () => r()));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(async () => {
  if (createdIds.length) await prisma.admin.deleteMany({ where: { id: { in: createdIds } } });
  await new Promise<void>((r) => (server ? server.close(() => r()) : r()));
  await prisma.$disconnect();
});

describe('운영자 로그인 잠금', () => {
  it('4회 실패까지는 잠기지 않고 5회째에 잠긴다(잠금 응답은 6번째 시도부터)', async () => {
    const admin = await makeAdmin('five');
    for (let i = 1; i <= 5; i++) {
      const r = await login(admin.email, 'wrong');
      assert.equal(r.status, 401, `${i}회차`);
      assert.equal(r.json.message, WRONG_MESSAGE, `${i}회차는 남은 횟수를 알리지 않는다`);
    }
    const after = await row(admin.id);
    assert.equal(after.failedLoginCount, 5);
    assert.ok(after.lockedUntil && after.lockedUntil.getTime() > Date.now() + 14 * 60 * 1000, '약 15분 뒤까지 잠긴다');
    const r6 = await login(admin.email, 'wrong');
    assert.equal(r6.status, 429);
    assert.equal(r6.json.message, LOCKED_MESSAGE);
  });

  it('잠긴 동안은 비밀번호가 맞아도 거부하고 토큰을 주지 않는다', async () => {
    const admin = await makeAdmin('locked-correct');
    for (let i = 0; i < 5; i++) await login(admin.email, 'wrong');
    const r = await login(admin.email, PASSWORD);
    assert.equal(r.status, 429);
    assert.equal(r.json.message, LOCKED_MESSAGE);
    assert.equal(r.json.accessToken, undefined);
    assert.equal(r.json.refreshToken, undefined);
  });

  it('15분이 지나면 성공하고 카운터·잠금이 초기화된다', async () => {
    const admin = await makeAdmin('expired');
    for (let i = 0; i < 5; i++) await login(admin.email, 'wrong');
    await prisma.admin.update({ where: { id: admin.id }, data: { lockedUntil: new Date(Date.now() - 1000) } }); // 15분 경과를 흉내
    const r = await login(admin.email, PASSWORD);
    assert.equal(r.status, 200);
    assert.ok(r.json.accessToken);
    const after = await row(admin.id);
    assert.equal(after.failedLoginCount, 0);
    assert.equal(after.lockedUntil, null);
  });

  it('잠금이 풀린 뒤 첫 실패는 1부터 다시 센다(바로 재잠금되지 않는다)', async () => {
    const admin = await makeAdmin('recount');
    for (let i = 0; i < 5; i++) await login(admin.email, 'wrong');
    await prisma.admin.update({ where: { id: admin.id }, data: { lockedUntil: new Date(Date.now() - 1000) } });
    const r = await login(admin.email, 'wrong');
    assert.equal(r.status, 401);
    const after = await row(admin.id);
    assert.equal(after.failedLoginCount, 1);
    assert.equal(after.lockedUntil, null);
  });

  it('성공하면 쌓인 실패 횟수가 0으로 돌아간다', async () => {
    const admin = await makeAdmin('reset');
    for (let i = 0; i < 4; i++) await login(admin.email, 'wrong');
    assert.equal((await row(admin.id)).failedLoginCount, 4);
    assert.equal((await login(admin.email, PASSWORD)).status, 200);
    assert.equal((await row(admin.id)).failedLoginCount, 0);
    // 초기화됐으니 다시 4번 틀려도 잠기지 않는다
    for (let i = 0; i < 4; i++) await login(admin.email, 'wrong');
    assert.equal((await row(admin.id)).lockedUntil, null);
  });

  it('없는 계정은 기존 401 문구 그대로이고 DB에 아무것도 만들지 않는다', async () => {
    const r = await login(`nobody-${Date.now()}@example.test`, 'wrong');
    assert.equal(r.status, 401);
    assert.equal(r.json.message, WRONG_MESSAGE);
  });
});

describe('운영자 refresh 만료', () => {
  it('로그인으로 발급된 refreshToken의 유효기간은 1일이다', async () => {
    const admin = await makeAdmin('ttl');
    const r = await login(admin.email, PASSWORD);
    const decoded = jwt.verify(r.json.refreshToken, TEST_JWT_SECRET!) as jwt.JwtPayload;
    assert.equal(decoded.exp! - decoded.iat!, 24 * 60 * 60);
  });
});
