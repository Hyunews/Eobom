// 시설 태그·source 분포 조회 (읽기 전용 — 쓰지 않는다)
// docs 01-06 §4 데이터 정리 전 현황 확인용.
//   npm run report:tags                  로컬 DB
//   npm run report:tags -- --target prod 운영 DB(.env의 BACKUP_DATABASE_URL을 이 실행에서만 사용)

import 'dotenv/config';

const arg = (name: string): string | undefined => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
};

// db-safety.md §2-2 — report-heavy-jobs.ts와 같은 방식. prisma 클라이언트는 DATABASE_URL이 정해진 뒤 불러온다.
const LOCAL_HOST = /@(localhost|127\.0\.0\.1|host\.docker\.internal)/;

const resolveTarget = (): string => {
  const target = arg('target') ?? 'local';
  if (target !== 'local' && target !== 'prod') {
    console.error('--target은 local 또는 prod');
    process.exit(1);
  }
  if (target === 'prod') {
    const url = (process.env.BACKUP_DATABASE_URL ?? '').trim();
    if (!url) { console.error('BACKUP_DATABASE_URL 값이 없습니다 — 중단합니다.'); process.exit(1); }
    if (LOCAL_HOST.test(url)) { console.error('BACKUP_DATABASE_URL이 로컬 주소입니다 — 중단합니다.'); process.exit(1); }
    process.env.DATABASE_URL = url;
  }
  const m = (process.env.DATABASE_URL ?? '').match(/@([^/?]+)\/([^?]*)/);
  return `대상: ${target === 'prod' ? '운영' : '로컬'} (${m ? `${m[1]}/${m[2]}` : '주소 읽기 실패'})`;
};

const prefixOf = (id: string): string => {
  const m = id.match(/^([a-z]+)_/i);
  return m ? `${m[1]}_` : '(없음)';
};

const count = (map: Map<string, number>, key: string) => map.set(key, (map.get(key) ?? 0) + 1);
const print = (title: string, map: Map<string, number>) => {
  console.log(`\n[${title}]`);
  [...map.entries()].sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${String(v).padStart(5)}  ${k}`));
};

async function main(): Promise<void> {
  const targetLine = resolveTarget();
  const prisma = (await import('../src/config/prisma')).default;
  console.log(targetLine);

  const rows = await prisma.facility.findMany({ select: { id: true, type: true, source: true, tags: true } });
  console.log(`시설 ${rows.length}곳`);

  const byTypeSource = new Map<string, number>();
  const byPrefixSource = new Map<string, number>();
  const byTag = new Map<string, number>();
  const byTypeTag = new Map<string, number>();
  for (const r of rows) {
    count(byTypeSource, `${r.type} / source=${r.source}`);
    count(byPrefixSource, `${prefixOf(r.id)} / source=${r.source}`);
    if (r.tags.length === 0) count(byTag, '(태그 없음)');
    for (const t of r.tags) { count(byTag, t); count(byTypeTag, `${r.type} / ${t}`); }
  }
  print('구분 x source', byTypeSource);
  print('id 접두사 x source', byPrefixSource);
  print('태그별 건수', byTag);
  print('구분 x 태그', byTypeTag);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
