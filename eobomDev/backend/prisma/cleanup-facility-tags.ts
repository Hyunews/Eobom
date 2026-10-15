// 시설 태그 데이터 정리 (docs 01-06 §4) — 기존 행을 고치는 DB 쓰기다. db-safety.md 절차를 먼저 밟을 것(건수 승인 → 백업).
//   npm run cleanup:tags -- --target local            확인만(아무것도 쓰지 않고 예정 건수만 찍는다)
//   npm run cleanup:tags -- --target local --apply    실행(한 트랜잭션 — 예상 건수와 다르면 전부 되돌린다)
//   --target prod 는 .env의 BACKUP_DATABASE_URL을 이 실행에서만 쓴다(.env 불변, db-safety.md §2-2).
// 하는 일: ① 용인 평온의숲·제주 양지공원 시드 삭제(CSV 출신 시설과 같은 시설 — 10-15 이름·주소 대조) ② 천안 시드는 남기고 태그 비움·source=manual
//          ③ bongan_ 행에 봉안당, jayeon_ 행에 자연장 태그 추가 ④ 이 948곳 source를 kakao에서 mohw_csv로.
// 다시 돌려도 안전하다(이미 된 건 건너뜀) — 단, 건수 검증은 처음 한 번의 예상값이라 두 번째엔 되돌림 없이 0건으로 끝난다.

import 'dotenv/config';

const arg = (name: string): string | undefined => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
const flag = (name: string): boolean => process.argv.includes(`--${name}`);

const LOCAL_HOST = /@(localhost|127\.0\.0\.1|host\.docker\.internal)/;

const resolveTarget = (): string => {
  const target = arg('target');
  if (target !== 'local' && target !== 'prod') {
    console.error('--target local|prod 가 필요합니다(기본값 없음).');
    process.exit(1);
  }
  if (target === 'prod') {
    const url = (process.env.BACKUP_DATABASE_URL ?? '').trim();
    if (!url) { console.error('BACKUP_DATABASE_URL 값이 없습니다 — 중단합니다.'); process.exit(1); }
    if (LOCAL_HOST.test(url)) { console.error('BACKUP_DATABASE_URL이 로컬 주소입니다 — 중단합니다.'); process.exit(1); }
    process.env.DATABASE_URL = url;
  } else if (!LOCAL_HOST.test(process.env.DATABASE_URL ?? '')) {
    console.error('--target local 인데 DATABASE_URL이 로컬 주소가 아닙니다 — 중단합니다.');
    process.exit(1);
  }
  const m = (process.env.DATABASE_URL ?? '').match(/@([^/?]+)\/([^?]*)/);
  return `대상: ${target === 'prod' ? '운영' : '로컬'} (${m ? `${m[1]}/${m[2]}` : '주소 읽기 실패'})`;
};

const SEEDS_TO_DELETE = ['f_gyeonggi_2', 'f_jeju_2'];
const SEED_TO_KEEP = 'f_chungcheong_2';

async function main(): Promise<void> {
  const targetLine = resolveTarget();
  const apply = flag('apply');
  const prisma = (await import('../src/config/prisma')).default;
  console.log(targetLine);
  console.log(apply ? '모드: 실행(--apply)' : '모드: 확인만(쓰지 않음)');

  const seedIds = [...SEEDS_TO_DELETE, SEED_TO_KEEP];
  const [leads, reviews, claims] = await Promise.all([
    prisma.lead.count({ where: { facilityId: { in: seedIds } } }),
    prisma.facilityReview.count({ where: { facilityId: { in: seedIds } } }),
    prisma.facilityClaim.count({ where: { facilityId: { in: seedIds } } }),
  ]);
  const seedRows = await prisma.facility.findMany({ where: { id: { in: seedIds } }, select: { id: true, name: true, partnerId: true } });
  const bonganTodo = await prisma.facility.count({ where: { id: { startsWith: 'bongan_' }, NOT: { tags: { has: '봉안당' } } } });
  const jayeonTodo = await prisma.facility.count({ where: { id: { startsWith: 'jayeon_' }, NOT: { tags: { has: '자연장' } } } });
  const sourceTodo = await prisma.facility.count({
    where: { OR: [{ id: { startsWith: 'bongan_' } }, { id: { startsWith: 'jayeon_' } }], source: 'kakao' },
  });
  console.log(`시드 행 ${seedRows.length}/3 · 연결된 상담 ${leads} · 리뷰 ${reviews} · 클레임 ${claims} · 파트너 ${seedRows.filter((r) => r.partnerId).length}`);
  console.log(`예정: 시드 삭제 ${seedRows.filter((r) => SEEDS_TO_DELETE.includes(r.id)).length}곳 · 천안 시드 정리 ${seedRows.some((r) => r.id === SEED_TO_KEEP) ? 1 : 0}곳 · 봉안당 태그 ${bonganTodo}곳 · 자연장 태그 ${jayeonTodo}곳 · source 바로잡기 ${sourceTodo}곳`);
  if (leads + reviews + claims > 0 || seedRows.some((r) => r.partnerId)) {
    console.error('시드에 연결된 상담·리뷰·클레임·파트너가 있습니다 — 중단합니다.');
    process.exit(1);
  }
  if (!apply) { await prisma.$disconnect(); return; }

  await prisma.$transaction(async (tx) => {
    const del = await tx.facility.deleteMany({ where: { id: { in: SEEDS_TO_DELETE } } });
    const keep = await tx.facility.updateMany({ where: { id: SEED_TO_KEEP }, data: { tags: [], source: 'manual' } });
    const bongan = await tx.$executeRaw`UPDATE "Facility" SET tags = array_append(tags, '봉안당'), "updatedAt" = now() WHERE id LIKE 'bongan\_%' AND NOT ('봉안당' = ANY(tags))`;
    const jayeon = await tx.$executeRaw`UPDATE "Facility" SET tags = array_append(tags, '자연장'), "updatedAt" = now() WHERE id LIKE 'jayeon\_%' AND NOT ('자연장' = ANY(tags))`;
    const src = await tx.facility.updateMany({
      where: { OR: [{ id: { startsWith: 'bongan_' } }, { id: { startsWith: 'jayeon_' } }], source: 'kakao' },
      data: { source: 'mohw_csv' },
    });
    console.log(`실행: 삭제 ${del.count} · 천안 시드 ${keep.count} · 봉안당 ${bongan} · 자연장 ${jayeon} · source ${src.count}`);
    const expected = [del.count === seedRows.filter((r) => SEEDS_TO_DELETE.includes(r.id)).length, bongan === bonganTodo, jayeon === jayeonTodo, src.count === sourceTodo];
    if (expected.includes(false)) throw new Error('실행 건수가 예정과 다릅니다 — 전부 되돌립니다.');
  });
  console.log('완료(커밋됨).');
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
