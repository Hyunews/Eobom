// 8단계 묶음 7 — ① GET /api/me/visited-memorials(헌화·방명록을 남긴 추모관, 00-36 §4.8-1) ② GET /api/me/memorials의 방명록 수·헌화 수 2칸(00-36 §4.8-3).
// 🔴 첫 줄 import는 testEnv여야 한다(전용 테스트 DB 가드). 만든 행은 끝나면 지운다(가짜 데이터만).
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
const userIds: string[] = [];

async function makeUser(tag: string) {
  const user = await prisma.user.create({ data: { name: `방문-${tag}`, email: `visit-${tag}-${Date.now()}@example.test` } });
  userIds.push(user.id);
  const token = jwt.sign({ id: user.id, name: user.name, provider: 'kakao', aud: 'user' }, TEST_JWT_SECRET!, { expiresIn: '5m' });
  return { user, token };
}

const get = (url: string, token?: string) => fetch(base + url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });

async function newMemorial(token: string, name: string) {
  const res = await fetch(base + '/api/memorials', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ deceasedName: name, falseReportAgreed: true, resharedNoticeAck: true }),
  });
  assert.equal(res.status, 201);
  const { data } = (await res.json()) as { data: { id: string } };
  return prisma.memorial.findUniqueOrThrow({ where: { id: data.id } });
}

const tribute = (memorialId: string, userId: string | null, at: Date) =>
  prisma.memorialTribute.create({ data: { memorialId, userId, visitorHash: `h-${Math.random()}`, createdAt: at } });
const entry = (memorialId: string, userId: string | null, at: Date, extra: Record<string, unknown> = {}) =>
  prisma.memorialGuestbook.create({ data: { memorialId, userId, authorName: '방문자', message: '시험 글', createdAt: at, ...extra } });

before(async () => {
  const rows = await prisma.$queryRaw<{ db: string }[]>`SELECT current_database() AS db`;
  assert.ok(rows[0].db.endsWith('_test'), `연결된 DB가 _test가 아닙니다: ${rows[0].db} — 테스트를 중단합니다.`);
  server = app.listen(0);
  await new Promise<void>((r) => server.once('listening', () => r()));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(async () => {
  await new Promise<void>((r) => (server ? server.close(() => r()) : r()));
  await prisma.memorial.deleteMany({ where: { createdByUserId: { in: userIds } } }); // 헌화·방명록은 캐스케이드
  await prisma.deceased.deleteMany({ where: { registeredBy: { in: userIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  await prisma.$disconnect();
});

describe('GET /api/me/visited-memorials — 헌화·방명록을 남긴 추모관', () => {
  it('로그인 없이는 401', async () => {
    assert.equal((await get('/api/me/visited-memorials')).status, 401);
  });

  it('로그인한 채 남긴 남의 추모관 중 지금 열리는 것만, 남긴 것·마지막 날짜와 함께 최신순', async () => {
    const owner = await makeUser('own');
    const me = await makeUser('me');
    const other = await makeUser('other');
    const day = (n: number) => new Date(Date.UTC(2026, 9, n, 3));

    const both = await newMemorial(owner.token, '故둘다');
    const onlyEntry = await newMemorial(owner.token, '故방명록만');
    const onlyTribute = await newMemorial(owner.token, '故헌화만');
    const hiddenEntryOnly = await newMemorial(owner.token, '故숨긴글뿐'); // 글은 운영자가 숨겼지만 헌화는 남음 → "헌화"
    const priv = await newMemorial(owner.token, '故비공개');
    const closed = await newMemorial(owner.token, '故닫힘');
    const hidden = await newMemorial(owner.token, '故운영자내림');
    const mine = await newMemorial(me.token, '故내가만듦');
    const anonOnly = await newMemorial(owner.token, '故비회원뿐');
    await prisma.memorial.update({ where: { id: priv.id }, data: { visibility: 'PRIVATE' } });
    await prisma.memorial.update({ where: { id: closed.id }, data: { closedAt: day(5) } });
    await prisma.memorial.update({ where: { id: hidden.id }, data: { hiddenAt: day(5) } });

    await tribute(both.id, me.user.id, day(10));
    await entry(both.id, me.user.id, day(12));
    await entry(onlyEntry.id, me.user.id, day(8));
    await tribute(onlyTribute.id, me.user.id, day(9));
    await tribute(hiddenEntryOnly.id, me.user.id, day(11));
    await entry(hiddenEntryOnly.id, me.user.id, day(13), { hiddenAt: day(14) });
    // 열리지 않는 추모관 · 내가 만든 추모관은 남겨도 목록에 없다
    for (const m of [priv, closed, hidden, mine]) {
      await tribute(m.id, me.user.id, day(20));
      await entry(m.id, me.user.id, day(21));
    }
    // 비회원 행(userId null)과 다른 사람의 행은 내 것이 아니다
    await tribute(anonOnly.id, null, day(22));
    await entry(anonOnly.id, null, day(23));
    await tribute(onlyEntry.id, other.user.id, day(24));

    const res = await get('/api/me/visited-memorials', me.token);
    assert.equal(res.status, 200);
    const { data } = (await res.json()) as { data: { slug: string; deceasedName: string; tributed: boolean; wrote: boolean; lastAt: string }[] };
    assert.deepEqual(
      data.map((d) => [d.deceasedName, d.tributed, d.wrote]),
      [
        ['故둘다', true, true], // 마지막 날 12일
        ['故숨긴글뿐', true, false], // 숨긴 글(13일)은 방명록으로 치지 않아 마지막 날도 헌화 11일
        ['故헌화만', true, false], // 9일
        ['故방명록만', false, true], // 8일
      ],
    );
    assert.equal(new Date(data[1].lastAt).getTime(), day(11).getTime());
    // 응답 화이트리스트 — 다른 조문객의 글·개설자 정보를 싣지 않는다
    assert.deepEqual(Object.keys(data[0]).sort(), ['deceasedName', 'lastAt', 'slug', 'tributed', 'wrote']);

    // 다른 사람이 같은 API를 불러도 내 기록이 보이지 않는다
    const otherRes = await get('/api/me/visited-memorials', other.token);
    const otherData = ((await otherRes.json()) as { data: { deceasedName: string }[] }).data;
    assert.deepEqual(otherData.map((d) => d.deceasedName), ['故방명록만']);
  });
});

describe('GET /api/me/memorials — 방명록 수 · 헌화 수', () => {
  it('내 추모관마다 세되, 상주 삭제·운영자 숨김·본인 삭제한 글은 방명록으로 치지 않는다', async () => {
    const owner = await makeUser('count-own');
    const v = await makeUser('count-v');
    const a = await newMemorial(owner.token, '故수셈');
    const empty = await newMemorial(owner.token, '故빈곳');
    const now = new Date();

    await entry(a.id, v.user.id, now);
    await entry(a.id, v.user.id, now);
    await entry(a.id, null, now); // 비회원 글도 방명록 수에는 들어간다(공개 글)
    await entry(a.id, v.user.id, now, { deletedByOwnerAt: now });
    await entry(a.id, v.user.id, now, { hiddenAt: now });
    await entry(a.id, v.user.id, now, { deletedByAuthorAt: now });
    await tribute(a.id, v.user.id, now);
    await tribute(a.id, null, now);

    const res = await get('/api/me/memorials', owner.token);
    assert.equal(res.status, 200);
    const { data } = (await res.json()) as { data: { id: string; guestbookCount: number; tributeCount: number; canExtend: boolean }[] };
    const byId = new Map(data.map((d) => [d.id, d]));
    assert.equal(byId.get(a.id)?.guestbookCount, 3);
    assert.equal(byId.get(a.id)?.tributeCount, 2);
    assert.equal(byId.get(empty.id)?.guestbookCount, 0);
    assert.equal(byId.get(empty.id)?.tributeCount, 0);
    // 기존 칸은 그대로(추가형)
    assert.equal(typeof byId.get(a.id)?.canExtend, 'boolean');
  });
});
