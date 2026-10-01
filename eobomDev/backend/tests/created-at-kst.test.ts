// "createdAtKst" 보기 전용 칸 회귀 테스트 — DB를 사람이 열었을 때 원래 표에서 바로 한국 시간이 보이게 한 칸(10-01 개발자 결정).
//
// 불변 규칙: createdAt이 있는 모든 표에 createdAtKst 칸 + 트리거가 있다(새 표에서 빠뜨리면 여기서 실패) /
// 값은 INSERT·UPDATE 때마다 createdAt + 9시간 / 앱 코드는 이 칸을 읽지도 쓰지도 않는다(schema.prisma @ignore).
// 🔴 첫 줄 import는 testEnv여야 한다 — 전용 테스트 DB 가드(_test·localhost)가 앱보다 먼저여야 한다.
import './helpers/testEnv';
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
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

describe('createdAtKst 칸·트리거', () => {
  it('🔴 createdAt이 있는 모든 표에 createdAtKst(timestamp(3)) 칸과 트리거가 있다 — 새 표에서 빠뜨리면 여기서 걸린다', async () => {
    const tables = await prisma.$queryRaw<{ table_name: string }[]>`
      SELECT c.table_name::text AS table_name
      FROM information_schema.columns c
      JOIN information_schema.tables t ON t.table_schema = c.table_schema AND t.table_name = c.table_name AND t.table_type = 'BASE TABLE'
      WHERE c.table_schema = 'public' AND c.column_name = 'createdAt'`;
    assert.ok(tables.length >= 26, `createdAt이 있는 표가 ${tables.length}개뿐이다 — 조회가 잘못됐다`);

    const kstCols = await prisma.$queryRaw<{ table_name: string; datetime_precision: number }[]>`
      SELECT table_name::text AS table_name, datetime_precision FROM information_schema.columns
      WHERE table_schema = 'public' AND column_name = 'createdAtKst' AND data_type = 'timestamp without time zone'`;
    const triggers = await prisma.$queryRaw<{ tgname: string }[]>`
      SELECT tgname::text AS tgname FROM pg_trigger WHERE NOT tgisinternal AND tgname LIKE '%\\_created\\_at\\_kst'`;
    const kstSet = new Set(kstCols.filter((c) => c.datetime_precision === 3).map((c) => c.table_name));
    const trgSet = new Set(triggers.map((t) => t.tgname));

    const noColumn = tables.map((t) => t.table_name).filter((n) => !kstSet.has(n));
    const noTrigger = tables.map((t) => t.table_name).filter((n) => !trgSet.has(`${n}_created_at_kst`));
    assert.deepEqual(noColumn, [], `createdAtKst 칸이 없는 표: ${noColumn.join(', ')}`);
    assert.deepEqual(noTrigger, [], `트리거가 없는 표: ${noTrigger.join(', ')}`);
  });

  it('INSERT 때 createdAt + 9시간이 채워지고, createdAt이 바뀌면(UPDATE) 따라 바뀐다', async () => {
    const user = await prisma.user.create({ data: { name: 'KST칸테스트' } });
    createdIds.push(user.id);
    const read = () =>
      prisma.$queryRaw<{ createdAt: Date; createdAtKst: Date }[]>`SELECT "createdAt", "createdAtKst" FROM "User" WHERE id = ${user.id}`;

    const [inserted] = await read();
    assert.equal(inserted.createdAtKst.getTime() - inserted.createdAt.getTime(), NINE_HOURS);

    await prisma.$executeRaw`UPDATE "User" SET "createdAt" = '2020-01-01 00:00:00' WHERE id = ${user.id}`;
    const [updated] = await read();
    assert.equal(updated.createdAt.toISOString(), '2020-01-01T00:00:00.000Z');
    assert.equal(updated.createdAtKst.toISOString(), '2020-01-01T09:00:00.000Z');
  });

  it('다른 칸만 고쳐도(UPDATE) createdAtKst가 틀어지지 않는다', async () => {
    const user = await prisma.user.create({ data: { name: 'KST칸테스트2' } });
    createdIds.push(user.id);
    await prisma.user.update({ where: { id: user.id }, data: { name: 'KST칸테스트2-수정' } });
    const [row] = await prisma.$queryRaw<{ createdAt: Date; createdAtKst: Date }[]>`SELECT "createdAt", "createdAtKst" FROM "User" WHERE id = ${user.id}`;
    assert.equal(row.createdAtKst.getTime() - row.createdAt.getTime(), NINE_HOURS);
  });
});

describe('앱은 createdAtKst를 읽지도 쓰지도 않는다', () => {
  it('🔴 Prisma 쿼리 결과에 칸이 안 나온다(@ignore) — API가 행을 그대로 돌려줘도 createdAtKst가 새지 않는다', async () => {
    // 타입 정의(index.d.ts)에는 이름이 보이지만 엔진이 @ignore 칸을 빼고 돌려준다 — 새는지는 실제 결과로 확인한다.
    const user = await prisma.user.create({ data: { name: 'KST칸노출테스트' } });
    createdIds.push(user.id);
    const found = await prisma.user.findUnique({ where: { id: user.id } });
    assert.ok(found);
    assert.ok(!('createdAtKst' in found!), 'findUnique 결과에 createdAtKst가 있다 — schema.prisma에서 @ignore가 빠졌다');
    assert.ok(!('createdAtKst' in user), 'create 결과에 createdAtKst가 있다');
    const many = await prisma.user.findMany({ where: { id: user.id } });
    assert.ok(!('createdAtKst' in many[0]), 'findMany 결과에 createdAtKst가 있다');
  });

  it('src/ 와 frontend/src/ 에 createdAtKst를 쓰는 코드가 0건이다', () => {
    const roots = [path.resolve(__dirname, '../src'), path.resolve(__dirname, '../../frontend/src')];
    const hits: string[] = [];
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (/\.(ts|tsx|js|jsx)$/.test(entry.name) && fs.readFileSync(full, 'utf8').includes('createdAtKst')) hits.push(full);
      }
    };
    for (const r of roots) if (fs.existsSync(r)) walk(r);
    assert.deepEqual(hits, [], `createdAtKst를 쓰는 파일: ${hits.join(', ')}`);
  });
});
