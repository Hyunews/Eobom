// "updatedAtKst" 보기 전용 칸 회귀 테스트 — createdAtKst(tests/created-at-kst.test.ts)와 같은 방식, updatedAt 쪽(10-01 개발자 요청).
//
// 불변 규칙: updatedAt이 있는 모든 표에 updatedAtKst 칸 + 트리거가 있다(새 표에서 빠뜨리면 여기서 실패) /
// 값은 INSERT·UPDATE 때마다 updatedAt + 9시간 — Prisma가 문장에 넣은 새 updatedAt을 BEFORE 트리거가 읽으므로 따라간다 /
// 코드가 다른 값을 넣어도 트리거 값이 남는다. 응답 제외·코드 사용 0건은 created-at-kst.test.ts가 두 칸을 같이 지킨다.
// 🔴 첫 줄 import는 testEnv여야 한다 — 전용 테스트 DB 가드(_test·localhost)가 앱보다 먼저여야 한다.
import './helpers/testEnv';
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import prisma from '../src/config/prisma';

const NINE_HOURS = 9 * 60 * 60 * 1000;
const createdIds: string[] = [];

before(async () => {
  const rows = await prisma.$queryRaw<{ db: string }[]>`SELECT current_database() AS db`;
  assert.ok(rows[0].db.endsWith('_test'), `연결된 DB가 _test가 아닙니다: ${rows[0].db} — 테스트를 중단합니다.`);
});

after(async () => {
  if (createdIds.length) await prisma.user.deleteMany({ where: { id: { in: createdIds } } });
  await prisma.$disconnect();
});

const readTimes = (id: string) =>
  prisma.$queryRaw<{ updatedAt: Date; updatedAtKst: Date }[]>`SELECT "updatedAt", "updatedAtKst" FROM "User" WHERE id = ${id}`;

describe('updatedAtKst 칸·트리거', () => {
  it('🔴 updatedAt이 있는 모든 표에 updatedAtKst(timestamp(3)) 칸과 트리거가 있다 — 새 표에서 빠뜨리면 여기서 걸린다', async () => {
    const tables = await prisma.$queryRaw<{ table_name: string }[]>`
      SELECT c.table_name::text AS table_name
      FROM information_schema.columns c
      JOIN information_schema.tables t ON t.table_schema = c.table_schema AND t.table_name = c.table_name AND t.table_type = 'BASE TABLE'
      WHERE c.table_schema = 'public' AND c.column_name = 'updatedAt'`;
    assert.ok(tables.length >= 14, `updatedAt이 있는 표가 ${tables.length}개뿐이다 — 조회가 잘못됐다`);

    const kstCols = await prisma.$queryRaw<{ table_name: string; datetime_precision: number }[]>`
      SELECT table_name::text AS table_name, datetime_precision FROM information_schema.columns
      WHERE table_schema = 'public' AND column_name = 'updatedAtKst' AND data_type = 'timestamp without time zone'`;
    const triggers = await prisma.$queryRaw<{ tgname: string }[]>`
      SELECT tgname::text AS tgname FROM pg_trigger WHERE NOT tgisinternal AND tgname LIKE '%\\_updated\\_at\\_kst'`;
    const kstSet = new Set(kstCols.filter((c) => c.datetime_precision === 3).map((c) => c.table_name));
    const trgSet = new Set(triggers.map((t) => t.tgname));

    const noColumn = tables.map((t) => t.table_name).filter((n) => !kstSet.has(n));
    const noTrigger = tables.map((t) => t.table_name).filter((n) => !trgSet.has(`${n}_updated_at_kst`));
    assert.deepEqual(noColumn, [], `updatedAtKst 칸이 없는 표: ${noColumn.join(', ')}`);
    assert.deepEqual(noTrigger, [], `트리거가 없는 표: ${noTrigger.join(', ')}`);
  });

  it('INSERT 때 updatedAt + 9시간이 채워진다', async () => {
    const user = await prisma.user.create({ data: { name: 'updatedKST칸테스트' } });
    createdIds.push(user.id);
    const [row] = await readTimes(user.id);
    assert.equal(row.updatedAtKst.getTime() - row.updatedAt.getTime(), NINE_HOURS);
  });

  it('🔴 Prisma update가 updatedAt을 새로 찍으면 updatedAtKst도 그 값 + 9시간으로 따라간다', async () => {
    const user = await prisma.user.create({ data: { name: 'updatedKST칸테스트2' } });
    createdIds.push(user.id);
    const [before] = await readTimes(user.id);
    await new Promise((r) => setTimeout(r, 20)); // updatedAt이 달라질 만큼만
    await prisma.user.update({ where: { id: user.id }, data: { name: 'updatedKST칸테스트2-수정' } });
    const [after] = await readTimes(user.id);
    assert.ok(after.updatedAt.getTime() > before.updatedAt.getTime(), 'Prisma가 updatedAt을 갱신하지 않았다 — 시험 전제가 깨졌다');
    assert.equal(after.updatedAtKst.getTime() - after.updatedAt.getTime(), NINE_HOURS, 'updatedAtKst가 갱신된 updatedAt을 따라가지 않았다');
    assert.ok(after.updatedAtKst.getTime() > before.updatedAtKst.getTime(), 'updatedAtKst가 그대로다');
  });

  it('SQL로 updatedAt을 직접 바꿔도(UPDATE) 따라 바뀐다', async () => {
    const user = await prisma.user.create({ data: { name: 'updatedKST칸테스트3' } });
    createdIds.push(user.id);
    await prisma.$executeRaw`UPDATE "User" SET "updatedAt" = '2020-01-01 00:00:00' WHERE id = ${user.id}`;
    const [row] = await readTimes(user.id);
    assert.equal(row.updatedAt.toISOString(), '2020-01-01T00:00:00.000Z');
    assert.equal(row.updatedAtKst.toISOString(), '2020-01-01T09:00:00.000Z');
  });

  it('🔴 코드가 updatedAtKst에 다른 값을 넣어도 트리거 값(updatedAt + 9시간)이 남는다 — create·update 모두', async () => {
    const WRONG = new Date('2000-01-01T00:00:00.000Z');
    const user = await prisma.user.create({ data: { name: 'updatedKST덮어쓰기', updatedAtKst: WRONG } });
    createdIds.push(user.id);
    const [afterCreate] = await readTimes(user.id);
    assert.equal(afterCreate.updatedAtKst.getTime() - afterCreate.updatedAt.getTime(), NINE_HOURS, 'create에서 넣은 값이 덮어써지지 않았다');

    await prisma.user.update({ where: { id: user.id }, data: { updatedAtKst: WRONG } });
    const [afterUpdate] = await readTimes(user.id);
    assert.equal(afterUpdate.updatedAtKst.getTime() - afterUpdate.updatedAt.getTime(), NINE_HOURS, 'update에서 넣은 값이 덮어써지지 않았다');
  });
});
