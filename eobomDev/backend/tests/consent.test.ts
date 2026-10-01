// 동의 기록 없는 기존 회원 재동의 API 회귀 테스트 — 00-36 §4.5-1.
//
// 불변 규칙: ① 시각은 "지금"만 찍는다(과거 날짜 금지) ② 이미 값이 있는 칸은 덮어쓰지 않는다
// ③ 필수 2개가 true가 아니면 400이고 DB는 그대로다 ④ 마케팅은 체크+비어 있을 때만 찍는다.
// 🔴 첫 줄 import는 testEnv여야 한다 — 전용 테스트 DB 가드(_test·localhost)가 앱보다 먼저여야 한다.
// 가짜 회원만 만들고, 끝나면 자기가 만든 행만 id로 지운다(전용 테스트 DB).
import { TEST_JWT_SECRET } from './helpers/testEnv';
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import jwt from 'jsonwebtoken';
import app from '../src/app';
import prisma from '../src/config/prisma';
import { tokenFor } from './helpers/tokens';

let server: Server;
let base = '';
const createdIds: string[] = [];

const OLD = new Date('2026-01-15T00:00:00.000Z');

async function makeUser(tag: string, data: { termsAgreedAt?: Date | null; privacyAgreedAt?: Date | null; marketingAgreedAt?: Date | null }) {
  const user = await prisma.user.create({ data: { name: `동의테스트-${tag}`, email: `consent-${tag}-${Date.now()}@example.test`, ...data } });
  createdIds.push(user.id);
  const token = jwt.sign({ id: user.id, name: user.name, provider: 'kakao', aud: 'user' }, TEST_JWT_SECRET!, { expiresIn: '5m' });
  return { user, token };
}

async function post(token: string | undefined, body: unknown) {
  const res = await fetch(`${base}/api/me/consent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  return { status: res.status, json: (await res.json().catch(() => null)) as any };
}

async function me(token: string) {
  const res = await fetch(`${base}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
  return (await res.json()) as any;
}

const row = (id: string) => prisma.user.findUniqueOrThrow({ where: { id } });

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

describe('재동의 — 동의 필요 여부(GET /api/auth/me)', () => {
  it('두 칸 모두 비어 있으면 consentRequired=true', async () => {
    const { token } = await makeUser('both-null', {});
    assert.equal((await me(token)).user.consentRequired, true);
  });
  it('한 칸만 비어 있어도 true', async () => {
    const { token } = await makeUser('one-null', { termsAgreedAt: OLD });
    assert.equal((await me(token)).user.consentRequired, true);
  });
  it('두 칸이 다 있으면 false', async () => {
    const { token } = await makeUser('full', { termsAgreedAt: OLD, privacyAgreedAt: OLD });
    assert.equal((await me(token)).user.consentRequired, false);
  });
});

describe('재동의 기록(POST /api/me/consent)', () => {
  it('필수 2개가 true가 아니면 400이고 DB는 그대로다', async () => {
    const { user, token } = await makeUser('reject', {});
    for (const body of [{}, { terms: true }, { privacy: true }, { terms: true, privacy: false }, { terms: 'true', privacy: 'true' }]) {
      assert.equal((await post(token, body)).status, 400, JSON.stringify(body));
    }
    const after = await row(user.id);
    assert.equal(after.termsAgreedAt, null);
    assert.equal(after.privacyAgreedAt, null);
    assert.equal(after.marketingAgreedAt, null);
  });

  it('동의하면 지금 시각이 찍히고(가입일 아님) 마케팅은 체크 안 했으면 비어 있다', async () => {
    const { user, token } = await makeUser('agree', {});
    const before = Date.now();
    const r = await post(token, { terms: true, privacy: true, marketing: false });
    assert.equal(r.status, 200);
    assert.equal(r.json.data.consentRequired, false);
    const after = await row(user.id);
    for (const d of [after.termsAgreedAt, after.privacyAgreedAt]) {
      assert.ok(d, '시각이 찍혀야 한다');
      assert.ok(d!.getTime() >= before - 1000 && d!.getTime() <= Date.now() + 1000, '지금 시각이어야 한다');
    }
    assert.equal(after.marketingAgreedAt, null);
    assert.equal((await me(token)).user.consentRequired, false);
  });

  it('한 칸만 비어 있으면 그 칸만 찍고 기존 값은 덮어쓰지 않는다', async () => {
    const { user, token } = await makeUser('partial', { termsAgreedAt: OLD });
    assert.equal((await post(token, { terms: true, privacy: true })).status, 200);
    const after = await row(user.id);
    assert.equal(after.termsAgreedAt!.getTime(), OLD.getTime());
    assert.ok(after.privacyAgreedAt!.getTime() > OLD.getTime());
  });

  it('마케팅은 체크했고 비어 있을 때만 찍는다 — 이미 값이 있으면 그대로', async () => {
    const a = await makeUser('mk-new', {});
    assert.equal((await post(a.token, { terms: true, privacy: true, marketing: true })).status, 200);
    assert.ok((await row(a.user.id)).marketingAgreedAt);

    const b = await makeUser('mk-keep', { termsAgreedAt: OLD, privacyAgreedAt: OLD, marketingAgreedAt: OLD });
    assert.equal((await post(b.token, { terms: true, privacy: true, marketing: true })).status, 200);
    const after = await row(b.user.id);
    assert.equal(after.termsAgreedAt!.getTime(), OLD.getTime());
    assert.equal(after.privacyAgreedAt!.getTime(), OLD.getTime());
    assert.equal(after.marketingAgreedAt!.getTime(), OLD.getTime());
  });

  it('토큰 없음·다른 주체 토큰은 401', async () => {
    assert.equal((await post(undefined, { terms: true, privacy: true })).status, 401);
    for (const aud of ['partner', 'expert', 'admin'] as const) {
      assert.equal((await post(tokenFor(aud), { terms: true, privacy: true })).status, 401, aud);
    }
  });
});
