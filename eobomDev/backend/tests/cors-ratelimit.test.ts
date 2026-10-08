// CORS 허용 목록 + 요청 횟수 제한 회귀 테스트 — 00-42 §10 (10-01 결정).
//
// 불변 규칙: 허용 안 된 출처엔 Access-Control-Allow-Origin을 주지 않는다 / 허용 출처·Origin 없는 요청은 통과 /
// 한도 초과 시 429 + 사실만 말하는 문구(공개 쓰기 10 · 로그인 20 · 전체 300 / 분) / /api/health는 제한 없음 /
// 429에도 CORS 헤더가 붙고 접속기록에 실패로 남는다 / 운영(NODE_ENV=production)은 허용 목록만 본다.
// 🔴 첫 줄 import는 testEnv여야 한다 — 전용 테스트 DB 가드(_test·localhost)가 앱보다 먼저여야 한다.
import './helpers/testEnv';
// 다른 시험들은 한도에 안 걸리게 제한을 꺼 두므로(testEnv) 여기서만 켠다. 앱을 부르기 전에 지워야 해서 app·prisma는 before()에서 동적으로 불러온다.
delete process.env.RATE_LIMIT_DISABLED;
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import express from 'express';
import cors from 'cors';
import { buildCorsOptions, DEFAULT_CORS_ORIGINS, isAllowedOrigin, parseCorsOrigins } from '../src/config/cors';
import { RATE_LIMITS, RATE_LIMIT_MESSAGE } from '../src/middleware/rateLimit';

type Prisma = typeof import('../src/config/prisma').default;

let server: Server;
let base = '';
let prisma: Prisma;
const requestIds: string[] = [];

before(async () => {
  assert.equal(process.env.RATE_LIMIT_DISABLED, undefined, '이 시험은 제한을 켜 둔 앱으로 돌아야 한다');
  prisma = (await import('../src/config/prisma')).default;
  const rows = await prisma.$queryRaw<{ db: string }[]>`SELECT current_database() AS db`;
  assert.ok(rows[0].db.endsWith('_test'), `연결된 DB가 _test가 아닙니다: ${rows[0].db} — 테스트를 중단합니다.`);
  const app = (await import('../src/app')).default;
  server = app.listen(0);
  await new Promise<void>((r) => server.once('listening', () => r()));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(async () => {
  if (requestIds.length) await prisma.accessLog.deleteMany({ where: { requestId: { in: requestIds } } });
  await new Promise<void>((r) => server.close(() => r()));
  await prisma.$disconnect();
});

// IP는 trust proxy 1이라 X-Forwarded-For 한 값이 곧 요청 IP다 — 시험마다 다른 가짜 IP를 써서 한도가 서로 섞이지 않게 한다.
let ipSeq = 10;
const nextIp = () => `203.0.113.${ipSeq++}`; // 문서용 예약 대역(TEST-NET-3)

async function call(path: string, opts: { ip: string; method?: string; origin?: string; headers?: Record<string, string> }) {
  const res = await fetch(`${base}${path}`, {
    method: opts.method ?? 'GET',
    headers: { 'X-Forwarded-For': opts.ip, ...(opts.origin ? { Origin: opts.origin } : {}), ...(opts.headers ?? {}) },
  });
  const rid = res.headers.get('x-request-id');
  if (rid) requestIds.push(rid);
  return { res, rid, body: await res.text() };
}

describe('CORS 허용 목록 — 순수 함수', () => {
  const prod = { origins: DEFAULT_CORS_ORIGINS, production: true };
  const dev = { origins: DEFAULT_CORS_ORIGINS, production: false };

  it('기본 목록: 운영 프론트 + 로컬 개발 포트(5173 http·https)', () => {
    for (const o of ['https://eobom.vercel.app', 'http://localhost:5173', 'https://localhost:5173', 'http://127.0.0.1:5173']) {
      assert.ok(isAllowedOrigin(o, prod), `${o}가 막혔다`);
    }
  });

  it('목록에 없는 출처·비슷한 도메인은 막는다', () => {
    for (const o of ['https://evil.example', 'https://eobom.vercel.app.evil.example', 'http://eobom.vercel.app', 'https://eobom-preview.vercel.app', 'http://localhost:3000']) {
      assert.equal(isAllowedOrigin(o, prod), false, `${o}가 통과했다`);
    }
  });

  it('Origin 헤더가 없으면(서버 간 호출·주소창 이동) 통과', () => {
    assert.ok(isAllowedOrigin(undefined, prod));
  });

  it('🔴 사설망(LAN) 출처는 비운영에서만 5173 포트에 한해 허용 — 운영은 목록만', () => {
    assert.ok(isAllowedOrigin('http://192.168.0.5:5173', dev));
    assert.ok(isAllowedOrigin('https://10.0.0.7:5173', dev));
    assert.equal(isAllowedOrigin('http://192.168.0.5:8080', dev), false, '5173이 아닌 포트');
    assert.equal(isAllowedOrigin('http://8.8.8.8:5173', dev), false, '공인 IP');
    assert.equal(isAllowedOrigin('http://192.168.0.5:5173', prod), false, '운영에선 LAN 금지');
  });

  it('CORS_ORIGINS: 쉼표 목록이 기본값을 대체하고 공백·끝 슬래시를 정리, 비면 기본값', () => {
    assert.deepEqual(parseCorsOrigins(' https://a.example/ , http://b.example:3000 ,, '), ['https://a.example', 'http://b.example:3000']);
    assert.equal(parseCorsOrigins(''), null);
    assert.equal(parseCorsOrigins('  , '), null);
    assert.equal(parseCorsOrigins(undefined), null);
    const custom = { origins: ['https://a.example'], production: true };
    assert.ok(isAllowedOrigin('https://a.example/', custom));
    assert.equal(isAllowedOrigin('https://eobom.vercel.app', custom), false, '직접 지정하면 기본 목록은 안 합쳐진다');
  });
});

describe('CORS — 운영 설정으로 실제 응답 헤더', () => {
  let prodServer: Server;
  let prodBase = '';
  before(async () => {
    const mini = express();
    mini.use(cors(buildCorsOptions({ origins: DEFAULT_CORS_ORIGINS, production: true })));
    mini.get('/ping', (_req, res) => res.json({ ok: true }));
    prodServer = mini.listen(0);
    await new Promise<void>((r) => prodServer.once('listening', () => r()));
    prodBase = `http://127.0.0.1:${(prodServer.address() as AddressInfo).port}`;
  });
  after(async () => {
    await new Promise<void>((r) => prodServer.close(() => r()));
  });

  it('운영: LAN 출처엔 허용 헤더가 없고, 운영 프론트엔 있다', async () => {
    const lan = await fetch(`${prodBase}/ping`, { headers: { Origin: 'http://192.168.0.5:5173' } });
    assert.equal(lan.status, 200, '서버는 응답한다 — 읽기를 막는 건 브라우저다');
    assert.equal(lan.headers.get('access-control-allow-origin'), null);
    const ok = await fetch(`${prodBase}/ping`, { headers: { Origin: 'https://eobom.vercel.app' } });
    assert.equal(ok.headers.get('access-control-allow-origin'), 'https://eobom.vercel.app');
  });
});

describe('CORS — 실제 앱(테스트 환경 = 비운영)', () => {
  it('허용 출처: Allow-Origin이 그 출처로 돌아오고 X-Request-Id가 노출된다', async () => {
    const { res } = await call('/api/health', { ip: nextIp(), origin: 'https://eobom.vercel.app' });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('access-control-allow-origin'), 'https://eobom.vercel.app');
    assert.equal(res.headers.get('access-control-allow-credentials'), 'true');
    assert.match(res.headers.get('access-control-expose-headers') ?? '', /X-Request-Id/i);
  });

  it('허용 안 된 출처: Allow-Origin이 없다(브라우저가 응답 읽기를 막는다)', async () => {
    const { res } = await call('/api/health', { ip: nextIp(), origin: 'https://evil.example' });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('access-control-allow-origin'), null);
  });

  it('Origin 없는 요청은 그대로 통과', async () => {
    const { res } = await call('/api/health', { ip: nextIp() });
    assert.equal(res.status, 200);
  });

  it('사전요청(OPTIONS): 허용 출처는 허용 헤더를 받고, 허용 안 된 출처는 못 받는다', async () => {
    const pre = (origin: string) =>
      call('/api/me/profile', { ip: nextIp(), method: 'OPTIONS', origin, headers: { 'Access-Control-Request-Method': 'PATCH', 'Access-Control-Request-Headers': 'authorization,content-type' } });
    const ok = await pre('https://eobom.vercel.app');
    assert.equal(ok.res.status, 204);
    assert.equal(ok.res.headers.get('access-control-allow-origin'), 'https://eobom.vercel.app');
    const bad = await pre('https://evil.example');
    assert.equal(bad.res.headers.get('access-control-allow-origin'), null);
  });

  it('개발: 로컬·LAN(5173) 출처 허용, 다른 포트 LAN은 막는다', async () => {
    for (const o of ['http://localhost:5173', 'https://localhost:5173', 'http://192.168.0.5:5173']) {
      const { res } = await call('/api/health', { ip: nextIp(), origin: o });
      assert.equal(res.headers.get('access-control-allow-origin'), o, `${o}`);
    }
    const { res } = await call('/api/health', { ip: nextIp(), origin: 'http://192.168.0.5:8080' });
    assert.equal(res.headers.get('access-control-allow-origin'), null);
  });
});

describe('요청 횟수 제한', () => {
  it('공개 쓰기(헌화): 분당 10까지는 통과, 11번째부터 429 + 사실만 말하는 문구 + 요청 번호', async () => {
    const ip = nextIp();
    for (let i = 1; i <= RATE_LIMITS.publicWrite; i++) {
      const r = await call('/api/memorials/no-such-slug/tributes', { ip, method: 'POST' });
      assert.notEqual(r.res.status, 429, `${i}번째가 벌써 429다`);
    }
    const over = await call('/api/memorials/no-such-slug/tributes', { ip, method: 'POST' });
    assert.equal(over.res.status, 429);
    const json = JSON.parse(over.body);
    assert.equal(json.status, 'error');
    assert.equal(json.message, RATE_LIMIT_MESSAGE);
    assert.equal(json.message, '잠시 후 다시 시도해 주세요.');
    assert.equal(json.requestId, over.rid);
    assert.ok(over.res.headers.get('retry-after'), 'Retry-After 헤더가 없다');
  });

  it('한도는 IP별이다 — 한 IP가 막혀도 다른 IP는 영향 없다', async () => {
    const a = nextIp();
    const b = nextIp();
    for (let i = 0; i < RATE_LIMITS.publicWrite + 1; i++) await call('/api/facilities/none/quotes', { ip: a, method: 'POST' });
    assert.equal((await call('/api/facilities/none/quotes', { ip: a, method: 'POST' })).res.status, 429);
    assert.notEqual((await call('/api/facilities/none/quotes', { ip: b, method: 'POST' })).res.status, 429);
  });

  it('공개 쓰기 한도는 주소와 무관하게 IP당 합산이다(헌화로 다 쓰면 시설 문의도 막힌다)', async () => {
    // 지시가 "공개 쓰기 분당 10"이라 주소별이 아니라 묶음 전체를 IP당 하나로 센다.
    const ip = nextIp();
    for (let i = 0; i < RATE_LIMITS.publicWrite; i++) await call('/api/memorials/none/tributes', { ip, method: 'POST' });
    const other = await call('/api/facilities/none/quotes', { ip, method: 'POST' });
    assert.equal(other.res.status, 429, '공개 쓰기는 주소와 무관하게 IP당 분당 10으로 합산된다');
  });

  it('로그인·토큰 갱신: 분당 20까지 통과, 21번째 429', async () => {
    const ip = nextIp();
    for (let i = 1; i <= RATE_LIMITS.auth; i++) {
      const r = await call('/api/admin/login', { ip, method: 'POST' }); // 본문 없음 → 400 (DB 안 탄다)
      assert.notEqual(r.res.status, 429, `${i}번째가 벌써 429다`);
    }
    const over = await call('/api/admin/login', { ip, method: 'POST' });
    assert.equal(over.res.status, 429);
    assert.equal(JSON.parse(over.body).message, RATE_LIMIT_MESSAGE);
    // 같은 묶음의 다른 주소도 같이 막힌다(IP당 합산)
    assert.equal((await call('/api/partner/refresh', { ip, method: 'POST' })).res.status, 429);
  });

  it('그 밖 전체: 분당 300까지 통과, 301번째 429 — 그리고 /api/health는 그 뒤에도 제한 없음', async () => {
    const ip = nextIp();
    for (let i = 1; i <= RATE_LIMITS.global; i++) {
      const r = await call('/api/no-such-route', { ip });
      assert.equal(r.res.status, 404, `${i}번째`);
    }
    const over = await call('/api/no-such-route', { ip });
    assert.equal(over.res.status, 429);
    // 한도를 다 쓴 IP로도 깨우기 핑은 계속 통과한다
    for (let i = 0; i < 5; i++) assert.equal((await call('/api/health', { ip })).res.status, 200);
  });

  it('429에도 CORS 헤더가 붙는다 — 다른 출처 프론트가 문구를 읽을 수 있게', async () => {
    const ip = nextIp();
    for (let i = 0; i < RATE_LIMITS.publicWrite; i++) await call('/api/obituaries/none/share', { ip, method: 'POST' });
    const over = await call('/api/obituaries/none/share', { ip, method: 'POST', origin: 'https://eobom.vercel.app' });
    assert.equal(over.res.status, 429);
    assert.equal(over.res.headers.get('access-control-allow-origin'), 'https://eobom.vercel.app');
  });

  it('429는 접속기록에 실패(status 429)로 남는다', async () => {
    const ip = nextIp();
    for (let i = 0; i < RATE_LIMITS.publicWrite; i++) await call('/api/experts/none/consult-requests', { ip, method: 'POST' });
    const over = await call('/api/experts/none/consult-requests', { ip, method: 'POST' });
    assert.equal(over.res.status, 429);
    const end = Date.now() + 3000;
    let row = null;
    while (!row && Date.now() < end) {
      row = await prisma.accessLog.findFirst({ where: { requestId: over.rid! } });
      if (!row) await new Promise((r) => setTimeout(r, 50));
    }
    assert.ok(row, '접속기록이 없다');
    assert.equal(row!.status, 429);
    assert.equal(row!.method, 'POST');
  });
});
