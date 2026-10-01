// 권한 경계 회귀 테스트 — 4종 aud(user·partner·expert·admin) 교차 접근 차단 (00-15 §5.1 ①, §6 ②).
//
// 불변 규칙: "다른 주체의 토큰으로는 그 주체 전용 경로에 못 들어간다." 도메인 기획이 바뀌어도 안 바뀐다.
// 🔴 첫 줄 import는 testEnv여야 한다 — 전용 테스트 DB 가드(_test·localhost)와 env 고정이 앱보다 먼저여야 한다.
import './helpers/testEnv';
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import app from '../src/app';
import prisma from '../src/config/prisma';
import { legacyUserTokenWithoutAud, tokenFor, type Aud } from './helpers/tokens';

// ── 보호되는 경로 목록 ──────────────────────────────────────────────────────────
// server.ts의 라우터 마운트 전체를 훑어 만든 표. 네임스페이스마다 대표를 잡는다.
// method GET인 것만 "정상 토큰이면 401이 아니다" 대조(positive control)를 돌린다 —
// 쓰기 경로는 정상 토큰으로 실제 핸들러를 실행시키지 않는다(테스트 DB라도 부작용을 만들지 않으려고).
type Protected = { ns: string; owner: Aud; method: 'GET' | 'POST'; path: string };

const PROTECTED: Protected[] = [
  // /api/admin — router.use(requireAdminAuth)로 /login·/refresh 아래 전부 보호
  { ns: '/api/admin', owner: 'admin', method: 'GET', path: '/api/admin/me' },
  { ns: '/api/admin', owner: 'admin', method: 'GET', path: '/api/admin/users' },
  { ns: '/api/admin', owner: 'admin', method: 'GET', path: '/api/admin/farewell-purge/expired' },
  { ns: '/api/admin', owner: 'admin', method: 'POST', path: '/api/admin/farewell-purge/execute' },
  // /api/partner — 핸들러마다 verifyPartnerBearerToken
  { ns: '/api/partner', owner: 'partner', method: 'GET', path: '/api/partner/me' },
  { ns: '/api/partner', owner: 'partner', method: 'GET', path: '/api/partner/leads' },
  { ns: '/api/partner', owner: 'partner', method: 'GET', path: '/api/partner/facilities' },
  // /api/expert — 핸들러마다 verifyExpertBearerToken
  { ns: '/api/expert', owner: 'expert', method: 'GET', path: '/api/expert/me' },
  { ns: '/api/expert', owner: 'expert', method: 'GET', path: '/api/expert/consult-requests' },
  // B2C 로그인 유저 전용 — 핸들러마다 verifyBearerToken
  { ns: '/api/me', owner: 'user', method: 'GET', path: '/api/me/summary' },
  { ns: '/api/me', owner: 'user', method: 'GET', path: '/api/me/profile' },
  { ns: '/api/auth', owner: 'user', method: 'GET', path: '/api/auth/me' },
  { ns: '/api/memorials', owner: 'user', method: 'POST', path: '/api/memorials' },
  { ns: '/api/obituaries', owner: 'user', method: 'POST', path: '/api/obituaries' },
  { ns: '/api/family-designations', owner: 'user', method: 'GET', path: '/api/family-designations' },
  { ns: '/api/farewell-messages', owner: 'user', method: 'GET', path: '/api/farewell-messages' },
  { ns: '/api/ending-note', owner: 'user', method: 'GET', path: '/api/ending-note' },
  // (10-01 시설 후기 작성 API 보류 — POST /api/facilities/:id/reviews 라우트 제거로 /api/facilities에는
  //  보호 경로가 없다. 후기 재개 시 이 줄과 아래 네임스페이스 목록의 '/api/facilities'를 복원할 것.)
  { ns: '/api/stt', owner: 'user', method: 'POST', path: '/api/stt/transcribe' },
  { ns: '/api/ocr', owner: 'user', method: 'POST', path: '/api/ocr/recognize' },
];

// 공개(비로그인) 네임스페이스 — 보호 목록에 넣지 않는다: /api/geo · /api/experts · /api/health ·
// /api/facilities(조회) · /api/memorials/:slug · /api/obituaries/:slug · 각 /status.
// (공개 경로에 인증을 붙이는 건 기획 변경이라 이 테스트가 지키는 불변이 아니다.)

const ALL_AUDS: Aud[] = ['user', 'partner', 'expert', 'admin'];

let server: Server;
let base = '';

async function call(method: string, path: string, token?: string): Promise<number> {
  const res = await fetch(base + path, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(method === 'POST' ? { 'Content-Type': 'application/json' } : {}),
    },
    body: method === 'POST' ? '{}' : undefined,
  });
  await res.arrayBuffer(); // 응답을 비워 소켓을 닫는다
  return res.status;
}

before(async () => {
  // 2차 가드 — env 문자열이 아니라 **실제로 붙은 DB**가 _test인지 확인한다.
  const rows = await prisma.$queryRaw<{ db: string }[]>`SELECT current_database() AS db`;
  assert.ok(rows[0].db.endsWith('_test'), `연결된 DB가 _test가 아닙니다: ${rows[0].db} — 테스트를 중단합니다.`);

  server = app.listen(0);
  await new Promise<void>((r) => server.once('listening', () => r()));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(async () => {
  await new Promise<void>((r) => (server ? server.close(() => r()) : r()));
  await prisma.$disconnect();
});

describe('보호 경로 목록', () => {
  it('server.ts의 보호 네임스페이스를 빠짐없이 덮는다', () => {
    const covered = new Set(PROTECTED.map((p) => p.ns));
    for (const ns of [
      '/api/admin', '/api/partner', '/api/expert', '/api/me', '/api/auth', '/api/memorials', '/api/obituaries',
      '/api/family-designations', '/api/farewell-messages', '/api/ending-note', '/api/stt', '/api/ocr',
    ]) {
      assert.ok(covered.has(ns), `${ns} 대표 경로가 목록에 없습니다`);
    }
  });
});

describe('토큰 없음·불량 토큰 → 401', () => {
  for (const p of PROTECTED) {
    it(`${p.method} ${p.path} — 토큰 없음`, async () => {
      assert.equal(await call(p.method, p.path), 401);
    });
    it(`${p.method} ${p.path} — 엉터리 토큰`, async () => {
      assert.equal(await call(p.method, p.path, 'not.a.jwt'), 401);
    });
    it(`${p.method} ${p.path} — 다른 비밀키로 서명한 토큰(${p.owner})`, async () => {
      assert.equal(await call(p.method, p.path, tokenFor(p.owner, { secret: 'some-other-secret' })), 401);
    });
    it(`${p.method} ${p.path} — 만료된 토큰(${p.owner})`, async () => {
      assert.equal(await call(p.method, p.path, tokenFor(p.owner, { expiresIn: -60 })), 401);
    });
  }
});

describe('다른 주체의 토큰 → 401 (교차 접근 차단)', () => {
  for (const p of PROTECTED) {
    for (const aud of ALL_AUDS.filter((a) => a !== p.owner)) {
      it(`${aud} 토큰 → ${p.method} ${p.path}`, async () => {
        assert.equal(await call(p.method, p.path, tokenFor(aud)), 401);
      });
    }
  }
});

// 토큰을 헤더가 아니라 쿼리로 받는 경로 — 소셜 계정 연동 시작(GET /api/auth/:provider/link?token=…).
// 정상 유저 토큰은 소셜 로그인 화면으로 리다이렉트(외부 이동)하므로 대조군은 만들지 않는다.
describe('쿼리 토큰 경로 /api/auth/:provider/link', () => {
  for (const aud of ['partner', 'expert', 'admin'] as Aud[]) {
    it(`${aud} 토큰 → 401`, async () => {
      assert.equal(await call('GET', `/api/auth/kakao/link?token=${tokenFor(aud)}`), 401);
    });
  }
  it('토큰 없음 → 401', async () => {
    assert.equal(await call('GET', '/api/auth/kakao/link'), 401);
  });
});

describe('대조군 — 주인 토큰은 401이 아니다(위 테스트가 "다 401"이라 통과한 게 아님을 확인)', () => {
  for (const p of PROTECTED.filter((x) => x.method === 'GET')) {
    it(`${p.owner} 토큰 → GET ${p.path} ≠ 401`, async () => {
      assert.notEqual(await call('GET', p.path, tokenFor(p.owner)), 401);
    });
  }
  it('aud 없는 옛 B2C 토큰은 유저 경로에서 허용된다(레거시 호환, authController.ts:129)', async () => {
    assert.notEqual(await call('GET', '/api/me/summary', legacyUserTokenWithoutAud()), 401);
  });
});
