// 부고 경로로 만든 추모관의 expiresAt(10-07, 00-20 §8.1 "expiresAt 계산") — 작성 시 함께 개설 · 사후 연결 · 기존 행 채우기 SQL.
// 🔴 첫 줄 import는 testEnv여야 한다(전용 테스트 DB 가드). 만든 행은 끝나면 지운다(전용 테스트 DB).
import { TEST_JWT_SECRET } from './helpers/testEnv';
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import jwt from 'jsonwebtoken';
import app from '../src/app';
import prisma from '../src/config/prisma';

const DAY = 24 * 60 * 60 * 1000;

let server: Server;
let base = '';
const userIds: string[] = [];
const deceasedIds: string[] = [];

async function makeOwner(tag: string) {
  const user = await prisma.user.create({ data: { name: `부고만료-${tag}`, email: `obit-exp-${tag}-${Date.now()}@example.test` } });
  userIds.push(user.id);
  const token = jwt.sign({ id: user.id, name: user.name, provider: 'kakao', aud: 'user' }, TEST_JWT_SECRET!, { expiresIn: '5m' });
  return { user, token };
}

const call = (method: string, url: string, token: string, body: unknown) =>
  fetch(base + url, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });

const obituaryBody = (extra: Record<string, unknown> = {}) => ({
  deceasedName: '故시험',
  chiefMournerName: '상주',
  funeralHall: '시험장례식장',
  funeralAt: new Date(Date.now() + 3 * DAY).toISOString(),
  falseReportAgreed: true,
  resharedNoticeAck: true,
  ...extra,
});

const assertOpened395 = (m: { createdAt: Date; expiresAt: Date | null }) => {
  assert.ok(m.expiresAt, 'expiresAt이 비어 있다');
  assert.equal(m.expiresAt!.getTime() - m.createdAt.getTime(), 395 * DAY, 'expiresAt이 개설+395일이 아니다');
};

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
  if (deceasedIds.length) await prisma.deceased.deleteMany({ where: { id: { in: deceasedIds } } });
  await prisma.deceased.deleteMany({ where: { registeredBy: { in: userIds } } });
  if (userIds.length) await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  await prisma.$disconnect();
});

describe('부고 경로 추모관 expiresAt', () => {
  it('부고 작성 + 추모관 체크 → expiresAt = 개설 + 395일', async () => {
    const { user, token } = await makeOwner('create');
    const res = await call('POST', '/api/obituaries', token, obituaryBody({ createMemorial: true }));
    assert.equal(res.status, 201);
    const m = await prisma.memorial.findFirstOrThrow({ where: { createdByUserId: user.id } });
    assertOpened395(m);
  });

  it('부고 사후 연결 → expiresAt = 연결(개설) + 395일 · 이미 연결된 건 다시 만들지 않는다', async () => {
    const { user, token } = await makeOwner('link');
    const res = await call('POST', '/api/obituaries', token, obituaryBody());
    assert.equal(res.status, 201);
    assert.equal(await prisma.memorial.count({ where: { createdByUserId: user.id } }), 0, '체크 안 하면 추모관 없음');
    const obit = await prisma.obituary.findFirstOrThrow({ where: { createdByUserId: user.id } });

    const patch = await call('PATCH', `/api/obituaries/${obit.id}`, token, { createMemorial: true, falseReportAgreed: true });
    assert.equal(patch.status, 200);
    const m = await prisma.memorial.findFirstOrThrow({ where: { createdByUserId: user.id } });
    assertOpened395(m);
  });
});

describe('기존 행 채우기 SQL (20261007120000_backfill_memorial_expires_at)', () => {
  it('비어 있고 동결 전인 행만 createdAt+395일 · 동결 행·이미 채운 행은 그대로 · 빈 행 0건(동결 제외)', async () => {
    const { user } = await makeOwner('backfill');
    const mk = async (tag: string, data: Record<string, unknown>) => {
      const d = await prisma.deceased.create({ data: { name: `故${tag}`, registeredBy: user.id } });
      deceasedIds.push(d.id);
      return prisma.memorial.create({
        data: { slug: `bf-${tag}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, createdByUserId: user.id, deceasedId: d.id, deceasedName: d.name, falseReportAgreedAt: new Date(), createdAt: new Date(Date.now() - 50 * DAY), ...data },
      });
    };
    const empty = await mk('empty', {});
    const frozen = await mk('frozen', { frozenAt: new Date(Date.now() - DAY), purgeAt: new Date(Date.now() + 1000 * DAY) });
    const filledAt = new Date(Date.now() + 77 * DAY);
    const filled = await mk('filled', { expiresAt: filledAt });

    const sql = fs.readFileSync(path.join(__dirname, '../prisma/migrations/20261007120000_backfill_memorial_expires_at/migration.sql'), 'utf8');
    await prisma.$executeRawUnsafe(sql);
    await prisma.$executeRawUnsafe(sql); // 두 번 돌려도 같다

    assertOpened395(await prisma.memorial.findUniqueOrThrow({ where: { id: empty.id } }));
    assert.equal((await prisma.memorial.findUniqueOrThrow({ where: { id: frozen.id } })).expiresAt, null, '동결 행은 건드리지 않는다');
    assert.equal((await prisma.memorial.findUniqueOrThrow({ where: { id: filled.id } })).expiresAt!.getTime(), filledAt.getTime(), '이미 채운 행은 그대로');
    assert.equal(await prisma.memorial.count({ where: { expiresAt: null, frozenAt: null } }), 0, '동결이 아닌데 비어 있는 행이 남았다');
  });
});
