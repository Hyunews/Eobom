// probe-route-auth.js — "경로 × 인증 여부" 표를 뽑는다. 모든 라우트를 (토큰 없음 / 엉터리 토큰)으로 호출해 상태 코드를 적는다.
// 용도: 인증 검사 위치를 바꾸는 리팩터링(예: 라우터 단위 requireAuth)의 전·후 증빙 — 두 표를 diff 해서 0건이면 판정 불변.
// 실행: eobomDev/backend 폴더에서
//   node --require ts-node/register/transpile-only ../../.harness/tools/probe-route-auth.js <출력파일.tsv>
// 🔴 testEnv가 전용 테스트 DB(_test·localhost)가 아니면 시작을 거부한다. 쓰기 경로도 빈 본문 '{}'로 부른다(테스트 DB 전용).
// 한계: 기능 스위치(STT·OCR·유언장 사진)는 켠 상태로 잰다 — 꺼진 환경의 404-앞서기는 이 표에 안 나온다(requireAuth.ts 머리 참고).
//       인증 필요 = 무토큰 401. 공개 라우트는 400/404/200 등 그 밖의 값이 나온다(더미 id라 404가 많다).
const fs = require('fs');
const path = require('path');
const B = path.resolve(__dirname, '..', '..', 'eobomDev', 'backend');
require(B + '/tests/helpers/testEnv');
process.env.R2_VOICE_ENABLED = 'true';
const app = require(B + '/src/app').default;
const prisma = require(B + '/src/config/prisma').default;

const METHODS = ['get', 'post', 'put', 'patch', 'delete'];

function mountOf(layer) {
  if (layer.regexp && layer.regexp.fast_slash) return '';
  const src = layer.regexp.source;
  const m = src.match(/^\^((?:\\\/[^\\()?$^]*)*)\\\/\?\(\?=\\\/\|\$\)$/);
  if (!m) throw new Error('mount 해석 실패: ' + src);
  return m[1].replace(/\\\//g, '/');
}

function walk(stack, prefix, out) {
  for (const layer of stack) {
    if (layer.route) {
      for (const m of METHODS) {
        if (layer.route.methods[m]) out.push({ method: m.toUpperCase(), path: prefix + layer.route.path });
      }
    } else if (layer.name === 'router' && layer.handle.stack) {
      walk(layer.handle.stack, prefix + mountOf(layer), out);
    }
  }
}

(async () => {
  if (!process.argv[2]) throw new Error('출력 파일 경로가 필요합니다');
  const rows = [];
  walk(app._router.stack, '', rows);
  // 다중 경로 배열을 문자열로 이은 줄(요청 횟수 제한용 app.post([...]))은 실제 라우트가 아니라 뺀다.
  const real = rows.filter((r) => typeof r.path === 'string' && !r.path.includes(','));

  const rs = await prisma.$queryRaw`SELECT current_database() AS db`;
  if (!rs[0].db.endsWith('_test')) throw new Error('_test DB가 아님: ' + rs[0].db);

  const server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  const base = `http://127.0.0.1:${server.address().port}`;

  const call = async (method, p, token) => {
    const url = base + p.replace(/:[A-Za-z]+/g, 'probe').replace(/\?/g, '');
    const res = await fetch(url, {
      method,
      redirect: 'manual',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(method !== 'GET' ? { 'Content-Type': 'application/json' } : {}),
      },
      body: method !== 'GET' ? '{}' : undefined,
    });
    await res.arrayBuffer();
    return res.status;
  };

  const out = [];
  for (const r of real) {
    const none = await call(r.method, r.path);
    const bad = await call(r.method, r.path, 'not.a.jwt');
    out.push(`${r.method} ${r.path}\t무토큰=${none}\t불량토큰=${bad}\t${none === 401 ? '인증필요' : '공개/기타'}`);
  }
  out.sort();
  fs.writeFileSync(process.argv[2], out.join('\n') + '\n');
  console.log('경로 수', out.length);
  await new Promise((r) => server.close(r));
  await prisma.$disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
