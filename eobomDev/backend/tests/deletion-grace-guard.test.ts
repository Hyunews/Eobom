// 탈퇴 유예 중 새 자산 생성 서버 차단 회귀 테스트 — 00-36 §4.3-1.
//
// 불변 규칙: ① 유예 중(purgedAt == null && deletionRequestedAt != null)이면 새 자산 생성은 403이다
// ② 조회는 막지 않는다 ③ 정상 회원·비로그인은 이 가드 때문에 달라지지 않는다.
// 🔴 첫 줄 import는 testEnv여야 한다 — 전용 테스트 DB 가드(_test·localhost)가 앱보다 먼저여야 한다.
// 가짜 회원만 만들고, 끝나면 자기가 만든 행만 id로 지운다(전용 테스트 DB). 정상 회원 쪽 요청은 빈 본문이라 400/404에서 멈춘다.
import { TEST_JWT_SECRET } from './helpers/testEnv';
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import jwt from 'jsonwebtoken';
import app from '../src/app';
import prisma from '../src/config/prisma';

let server: Server;
let base = '';
const createdIds: string[] = [];

async function makeUser(tag: string, data: { deletionRequestedAt?: Date; deletionScheduledAt?: Date; purgedAt?: Date }) {
  const user = await prisma.user.create({ data: { name: `유예테스트-${tag}`, email: `grace-${tag}-${Date.now()}@example.test`, ...data } });
  createdIds.push(user.id);
  const token = jwt.sign({ id: user.id, name: user.name, provider: 'kakao', aud: 'user' }, TEST_JWT_SECRET!, { expiresIn: '5m' });
  return { user, token };
}

async function call(method: string, path: string, token?: string): Promise<number> {
  const res = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: method === 'GET' ? undefined : '{}',
  });
  return res.status;
}

// 유예 중 계정이 만들 수 있으면 안 되는 경로 — 부고장·추모관·방명록·엔딩노트(+ 편지)·상담 신청·가족 지정.
const CREATE_ROUTES: { name: string; method: string; path: string }[] = [
  { name: '부고장', method: 'POST', path: '/api/obituaries' },
  { name: '추모관', method: 'POST', path: '/api/memorials' },
  { name: '방명록', method: 'POST', path: '/api/memorials/no-such-slug/guestbook' },
  { name: '엔딩노트 작성', method: 'PUT', path: '/api/ending-note/sections/NO_SUCH_SECTION' },
  { name: '유족 메시지(편지)', method: 'POST', path: '/api/farewell-messages' },
  { name: '상담 신청', method: 'POST', path: '/api/experts/00000000-0000-4000-8000-000000000000/consult-requests' },
  { name: '가족 지정', method: 'POST', path: '/api/family-designations' },
  { name: '업체 문의', method: 'POST', path: '/api/facilities/no-such-facility/quotes' }, // 01-05 §10-2(10-06)
];

const READ_ROUTES = ['/api/auth/me', '/api/ending-note', '/api/farewell-messages', '/api/family-designations'];

const DAY = 24 * 60 * 60 * 1000;

before(async () => {
  const rows = await prisma.$queryRaw<{ db: string }[]>`SELECT current_database() AS db`;
  assert.ok(rows[0].db.endsWith('_test'), `연결된 DB가 _test가 아닙니다: ${rows[0].db} — 테스트를 중단합니다.`);
  server = app.listen(0);
  await new Promise<void>((r) => server.once('listening', () => r()));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(async () => {
  if (createdIds.length) await prisma.user.deleteMany({ where: { id: { in: createdIds } } });
  await new Promise<void>((r) => (server ? server.close(() => r()) : r()));
  await prisma.$disconnect();
});

describe('탈퇴 유예 중 계정 — 새 자산 생성 403(00-36 §4.3-1)', () => {
  for (const r of CREATE_ROUTES) {
    it(`${r.name} ${r.method} ${r.path} → 403`, async () => {
      const { token } = await makeUser('grace', { deletionRequestedAt: new Date(), deletionScheduledAt: new Date(Date.now() + 30 * DAY) });
      assert.equal(await call(r.method, r.path, token), 403);
    });
  }

  it('조회는 막지 않는다 — 유예 중에도 403이 아니다', async () => {
    const { token } = await makeUser('grace-read', { deletionRequestedAt: new Date(), deletionScheduledAt: new Date(Date.now() + 30 * DAY) });
    for (const path of READ_ROUTES) {
      assert.notEqual(await call('GET', path, token), 403, path);
    }
  });

  it('GET /api/auth/me는 유예 상태를 그대로 내려준다', async () => {
    const { token } = await makeUser('grace-me', { deletionRequestedAt: new Date(), deletionScheduledAt: new Date(Date.now() + 30 * DAY) });
    const res = await fetch(`${base}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
    assert.equal(res.status, 200);
    assert.ok(((await res.json()) as any).user.deletionRequestedAt);
  });
});

describe('가드가 닿지 않아야 하는 경우', () => {
  it('유예 중이 아닌 회원은 403이 아니다(빈 본문이라 400·404에서 멈춘다)', async () => {
    const { token } = await makeUser('normal', {});
    for (const r of CREATE_ROUTES) {
      assert.notEqual(await call(r.method, r.path, token), 403, `${r.name} ${r.path}`);
    }
  });

  it('유예를 취소해 deletionRequestedAt이 비면 다시 403이 아니다', async () => {
    const { user, token } = await makeUser('cancelled', { deletionRequestedAt: new Date(), deletionScheduledAt: new Date(Date.now() + 30 * DAY) });
    assert.equal(await call('POST', '/api/obituaries', token), 403);
    await prisma.user.update({ where: { id: user.id }, data: { deletionRequestedAt: null, deletionScheduledAt: null } });
    assert.notEqual(await call('POST', '/api/obituaries', token), 403);
  });

  it('파기 완료(purgedAt) 계정은 가드가 아니라 컨트롤러가 처리한다 — 403이 아니다', async () => {
    const { token } = await makeUser('purged', { deletionRequestedAt: new Date(Date.now() - 40 * DAY), purgedAt: new Date() });
    assert.notEqual(await call('POST', '/api/obituaries', token), 403);
  });

  it('토큰 없음은 401 그대로다(403으로 바뀌지 않는다)', async () => {
    assert.equal(await call('POST', '/api/obituaries'), 401);
  });

  it('업체 문의는 비회원이면 401 — 직접 호출로 비회원 리드가 쌓이지 않는다(01-05 §10-2, 10-06)', async () => {
    const path = '/api/facilities/no-such-facility/quotes';
    assert.equal(await call('POST', path), 401);
    const before = await prisma.lead.count();
    const res = await fetch(base + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applicantName: '비회원', applicantPhone: '01012345678', thirdPartyConsent: true }),
    });
    assert.equal(res.status, 401);
    assert.equal(await prisma.lead.count(), before);
  });
});
