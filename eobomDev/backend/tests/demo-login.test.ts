// 데모 로그인 production 차단 회귀 테스트 — 운영에서 소셜 인증 없이 데모 계정 토큰이 발급되면 안 된다.
//
// 불변 규칙: NODE_ENV=production이면 provider가 무엇이든(KAKAO·NAVER·GOOGLE·ADMIN·없음) 403이다.
// 🔴 첫 줄 import는 testEnv여야 한다 — 전용 테스트 DB 가드가 앱보다 먼저여야 한다.
// 개발 환경 대조는 DB에 쓰지 않는 경로만 쓴다(ADMIN 순수 토큰 · 동의 없는 소셜 400).
import './helpers/testEnv';
import { after, afterEach, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import app from '../src/app';
import prisma from '../src/config/prisma';

let server: Server;
let base = '';
const originalEnv = process.env.NODE_ENV;

async function demo(body: object) {
  const res = await fetch(`${base}/api/auth/demo-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: res.status, json: (await res.json().catch(() => null)) as any };
}

before(async () => {
  const rows = await prisma.$queryRaw<{ db: string }[]>`SELECT current_database() AS db`;
  assert.ok(rows[0].db.endsWith('_test'), `연결된 DB가 _test가 아닙니다: ${rows[0].db} — 테스트를 중단합니다.`);
  server = app.listen(0);
  await new Promise<void>((r) => server.once('listening', () => r()));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterEach(() => {
  process.env.NODE_ENV = originalEnv;
});

after(async () => {
  await new Promise<void>((r) => (server ? server.close(() => r()) : r()));
  await prisma.$disconnect();
});

describe('production — 데모 로그인 전면 403', () => {
  for (const provider of ['KAKAO', 'NAVER', 'GOOGLE', 'ADMIN', undefined]) {
    it(`provider=${provider ?? '(없음)'}`, async () => {
      process.env.NODE_ENV = 'production';
      // 동의까지 다 실어도 막혀야 한다 — 가드가 본문 검사보다 먼저다
      const r = await demo({ provider, termsAgreed: true, privacyAgreed: true });
      assert.equal(r.status, 403);
      assert.equal(r.json.message, '허용되지 않는 요청입니다.');
      assert.equal(r.json.token, undefined);
    });
  }
});

describe('개발 환경 — 기존 동작 그대로', () => {
  it('ADMIN은 토큰을 발급한다', async () => {
    const r = await demo({ provider: 'ADMIN' });
    assert.equal(r.status, 200);
    assert.ok(r.json.token);
  });
  it('소셜 데모는 동의가 없으면 400(가드를 통과해 기존 검사까지 간다)', async () => {
    const r = await demo({ provider: 'KAKAO' });
    assert.equal(r.status, 400);
  });
});
