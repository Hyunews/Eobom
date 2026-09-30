// 전용 테스트 DB에 스키마 적용 — `npm run test:db:migrate`.
// 🔴 가드를 통과한 주소(localhost · *_test)에만 `prisma migrate deploy`를 돌린다. 개발 DB·운영 DB는 가드에서 막힌다.
// DB 자체(eobom_test)는 만들지 않는다 — 로컬은 tests/README.md의 한 줄, CI는 서비스 컨테이너의 POSTGRES_DB가 만든다.
import './helpers/testEnv';
import { spawnSync } from 'node:child_process';

const url = process.env.DATABASE_URL!;
console.log(`[test:db:migrate] 대상: ${new URL(url).host}${new URL(url).pathname} (전용 테스트 DB)`);

const r = spawnSync('npx', ['prisma', 'migrate', 'deploy'], {
  stdio: 'inherit',
  shell: true, // Windows에서 npx.cmd 해석
  env: { ...process.env, DATABASE_URL: url, DIRECT_URL: url },
});
process.exit(r.status ?? 1);
