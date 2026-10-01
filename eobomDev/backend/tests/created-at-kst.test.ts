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
import type { AddressInfo } from 'node:net';
import app from '../src/app';
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

describe('API 응답에는 createdAtKst가 없다', () => {
  it('🔴 행을 통째로 돌려주는 응답(시설 목록·상세, 중첩 리뷰 포함)에 createdAtKst 키가 없다', async () => {
    const tag = `kst-${Date.now()}`;
    const user = await prisma.user.create({ data: { name: 'KST응답테스트' } });
    createdIds.push(user.id);
    const facility = await prisma.facility.create({
      data: { id: `f_${tag}`, name: `응답시험시설${tag}`, type: '장례식장', location: '테스트로 1', lat: 37.5, lng: 127.0, price: '1만원', religion: '전체', guests: '1명' },
    });
    await prisma.facilityReview.create({ data: { facilityId: facility.id, userId: user.id, rating: 5, content: '응답 시험' } });

    // 이 시험이 의미 있으려면 DB에서 읽은 행에는 칸이 실제로 있어야 한다(없으면 "없다"는 단언이 공허하다)
    const raw = await prisma.facility.findUniqueOrThrow({ where: { id: facility.id }, include: { reviews: true } });
    assert.ok(raw.createdAtKst, 'Prisma가 읽은 시설 행에 createdAtKst가 없다 — 시험 전제가 깨졌다');
    assert.ok(raw.reviews[0].createdAtKst, 'Prisma가 읽은 리뷰 행에 createdAtKst가 없다 — 시험 전제가 깨졌다');

    const server = app.listen(0);
    await new Promise<void>((r) => server.once('listening', () => r()));
    const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    try {
      const list = await fetch(`${base}/api/facilities?q=${encodeURIComponent(`응답시험시설${tag}`)}`);
      const listText = await list.text();
      assert.equal(list.status, 200);
      assert.ok(listText.includes(`응답시험시설${tag}`), '목록 응답에 시험 시설이 없다');
      assert.ok(listText.includes('"createdAt"'), '목록 응답에 createdAt이 없다 — 행이 통째로 나가는 경로가 아니다');
      assert.ok(!listText.includes('createdAtKst'), '시설 목록 응답에 createdAtKst가 있다');

      const detail = await fetch(`${base}/api/facilities/${facility.id}`);
      const detailText = await detail.text();
      assert.equal(detail.status, 200);
      assert.ok(detailText.includes('응답 시험'), '상세 응답에 중첩 리뷰가 없다');
      assert.ok(!detailText.includes('createdAtKst'), '시설 상세(중첩 리뷰 포함) 응답에 createdAtKst가 있다');
    } finally {
      await new Promise<void>((r) => server.close(() => r()));
      await prisma.facilityReview.deleteMany({ where: { facilityId: facility.id } });
      await prisma.facility.delete({ where: { id: facility.id } });
    }
  });
});

describe('앱은 createdAtKst를 읽지도 쓰지도 않는다', () => {
  it('🔴 코드가 createdAtKst에 다른 값을 넣어도 트리거 값(createdAt + 9시간)이 남는다 — create·update 모두', async () => {
    // 이 칸은 Prisma 모델에 보이지만(Studio에서 보려고 @ignore를 뺐다) 코드에서 쓰면 안 된다 — 써도 트리거가 덮어쓰는지 확인한다.
    const WRONG = new Date('2000-01-01T00:00:00.000Z');
    const user = await prisma.user.create({ data: { name: 'KST칸덮어쓰기테스트', createdAtKst: WRONG } });
    createdIds.push(user.id);
    const afterCreate = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    assert.equal(afterCreate.createdAtKst!.getTime() - afterCreate.createdAt.getTime(), NINE_HOURS, 'create에서 넣은 값이 덮어써지지 않았다');

    await prisma.user.update({ where: { id: user.id }, data: { createdAtKst: WRONG } });
    const afterUpdate = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    assert.equal(afterUpdate.createdAtKst!.getTime() - afterUpdate.createdAt.getTime(), NINE_HOURS, 'update에서 넣은 값이 덮어써지지 않았다');
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
    // 허용은 src/app.ts 하나뿐 — 응답에서 이 칸을 "빼는" 'json replacer' 한 줄(읽거나 쓰는 코드가 아니다)
    const allowed = [path.resolve(__dirname, '../src/app.ts')];
    const unexpected = hits.filter((h) => !allowed.includes(h));
    assert.deepEqual(unexpected, [], `createdAtKst를 쓰는 파일: ${unexpected.join(', ')}`);
  });
});
