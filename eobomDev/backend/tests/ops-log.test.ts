// 운영 기록(00-42 L-1) 회귀 테스트 — 접속기록·운영자 감사 자동화·에러 기록.
//
// 불변 규칙: 요청마다 번호 · 경로에서 쿼리 제거 · 요청·응답 본문·이메일 미기록 · 운영자 열람은 감사기록 실패 시 거부 ·
// 접속기록이 실패해도 일반 요청은 성공 · 축소안(익명 공개 조회 성공은 안 남김) · 보관기간 파기.
// 🔴 첫 줄 import는 testEnv여야 한다 — 전용 테스트 DB 가드(_test·localhost)가 앱보다 먼저여야 한다.
// 가짜 계정만 만들고, 끝나면 자기가 만든 요청 번호·id만 지운다(전용 테스트 DB).
import './helpers/testEnv';
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import express from 'express';
import bcrypt from 'bcryptjs';
import app from '../src/app';
import prisma from '../src/config/prisma';
import { tokenFor } from './helpers/tokens';
import { requestId } from '../src/middleware/requestLog';
import { errorHandler } from '../src/middleware/errorHandler';
import { maskText, safeErrorMessage, stackHead, stripQuery } from '../src/utils/logMask';
import { purgeOpsLogExpired } from '../src/services/opsLogPurgeService';

let server: Server;
let base = '';
let boomServer: Server;
let boomBase = '';
const requestIds: string[] = [];
const createdAdminIds: string[] = [];
const createdUserIds: string[] = [];
const PASSWORD = 'correct-horse-battery';

// DB 실패 주입 — Prisma $use로 던지게 한다(실제 DB 장애와 같은 경로). 'Model'은 그 모델의 create, 'Model.action'은 해당 동작.
const failing = new Set<string>();
prisma.$use(async (params, next) => {
  const m = params.model ?? '';
  if (failing.has(`${m}.${params.action}`) || (params.action === 'create' && failing.has(m))) throw new Error('주입된 DB 실패');
  return next(params);
});

async function call(path: string, init: RequestInit = {}) {
  const res = await fetch(`${base}${path}`, init);
  const rid = res.headers.get('x-request-id');
  if (rid) requestIds.push(rid);
  return { res, rid, text: await res.text() };
}

// 기록은 응답이 끝난 뒤 쓰므로 잠깐 기다린다.
async function waitFor<T>(fn: () => Promise<T | null | undefined>, ms = 3000): Promise<T> {
  const end = Date.now() + ms;
  for (;;) {
    const v = await fn();
    if (v) return v;
    if (Date.now() > end) throw new Error('기록이 나타나지 않음');
    await new Promise((r) => setTimeout(r, 50));
  }
}

const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });
const accessByRid = (rid: string) => prisma.accessLog.findFirst({ where: { requestId: rid } });

async function adminLogin() {
  const admin = await prisma.admin.create({
    data: { email: `ops-${Date.now()}@example.test`, passwordHash: await bcrypt.hash(PASSWORD, 4), name: '기록테스트운영자' },
  });
  createdAdminIds.push(admin.id);
  const { res, text } = await call('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: admin.email, password: PASSWORD }),
  });
  assert.equal(res.status, 200);
  return { admin, token: JSON.parse(text).accessToken as string };
}

before(async () => {
  const rows = await prisma.$queryRaw<{ db: string }[]>`SELECT current_database() AS db`;
  assert.ok(rows[0].db.endsWith('_test'), `연결된 DB가 _test가 아닙니다: ${rows[0].db} — 테스트를 중단합니다.`);
  server = app.listen(0);
  await new Promise<void>((r) => server.once('listening', () => r()));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

  // 전역 에러 처리기만 따로 시험하는 미니 앱 — 실제 앱엔 일부러 터뜨릴 경로가 없다.
  const boom = express();
  boom.use(requestId);
  boom.get('/boom', () => {
    throw new Error('실패 jane@example.com 010-1234-5678 Bearer abc.def.ghi');
  });
  boom.get('/teapot', () => {
    throw Object.assign(new Error('잘못된 요청'), { status: 418 });
  });
  boom.use(errorHandler);
  boomServer = boom.listen(0);
  await new Promise<void>((r) => boomServer.once('listening', () => r()));
  boomBase = `http://127.0.0.1:${(boomServer.address() as AddressInfo).port}`;
});

after(async () => {
  failing.clear();
  await prisma.accessLog.deleteMany({ where: { requestId: { in: requestIds } } });
  await prisma.errorLog.deleteMany({ where: { requestId: { in: requestIds } } });
  await prisma.adminAuditLog.deleteMany({ where: { requestId: { in: requestIds } } });
  if (createdUserIds.length) await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
  if (createdAdminIds.length) await prisma.admin.deleteMany({ where: { id: { in: createdAdminIds } } });
  await new Promise<void>((r) => server.close(() => r()));
  await new Promise<void>((r) => boomServer.close(() => r()));
  await prisma.$disconnect();
});

describe('로그 문자열 정리(순수 함수)', () => {
  it('stripQuery: 쿼리·해시를 지우고 경로 안 id는 남긴다', () => {
    assert.equal(stripQuery('/api/geo/reverse?lat=37.5&lng=127.0'), '/api/geo/reverse');
    assert.equal(stripQuery('/api/memorials/abc-123?x=1#top'), '/api/memorials/abc-123');
    assert.equal(stripQuery('/api/health'), '/api/health');
    assert.equal(stripQuery(undefined), '');
  });

  it('maskText: 이메일·전화·토큰·좌표·긴 숫자를 가린다', () => {
    const out = maskText('a@b.co 010-1234-5678 Bearer xyz eyJhbGci.eyJpZCI6.sig 37.123456 9001011234567');
    for (const leaked of ['a@b.co', '010-1234-5678', 'xyz', 'eyJhbGci', '37.123456', '9001011234567']) {
      assert.ok(!out.includes(leaked), `${leaked} 가 남았다: ${out}`);
    }
  });

  it('safeErrorMessage: Prisma 에러는 마지막 줄만, 200자 제한, 마스킹', () => {
    const prismaErr = new Error('\nInvalid `prisma.user.create()` invocation:\n\n  data: { email: "secret@example.com" }\n\nUnique constraint failed');
    prismaErr.name = 'PrismaClientKnownRequestError';
    const msg = safeErrorMessage(prismaErr);
    assert.equal(msg, 'Unique constraint failed');
    assert.ok(safeErrorMessage(new Error('x'.repeat(500))).length <= 200);
  });

  it('stackHead: at 줄 5개까지만, 첫 줄(메시지)은 없다', () => {
    const head = stackHead(new Error('비밀 jane@example.com'))!;
    assert.ok(!head.includes('비밀'));
    assert.ok(head.split('\n').length <= 5);
    assert.equal(stackHead('문자열'), null);
  });
});

describe('요청 번호·접속기록', () => {
  it('모든 응답에 X-Request-Id가 붙고, 요청마다 다르다', async () => {
    const a = await call('/api/health');
    const b = await call('/api/health');
    assert.match(a.rid ?? '', /^[0-9a-f]{16}$/);
    assert.notEqual(a.rid, b.rid);
  });

  it('클라이언트가 보낸 X-Request-Id는 믿지 않는다', async () => {
    const { rid } = await call('/api/health', { headers: { 'X-Request-Id': 'forged-1234' } });
    assert.notEqual(rid, 'forged-1234');
  });

  it('축소안: 익명 공개 조회의 성공은 남기지 않고, 실패(404)는 남긴다', async () => {
    const ok = await call('/api/health');
    const miss = await call('/api/no-such-route');
    assert.equal(miss.res.status, 404);
    await waitFor(() => accessByRid(miss.rid!));
    assert.equal(await accessByRid(ok.rid!), null);
    const row = (await accessByRid(miss.rid!))!;
    assert.equal(row.subjectType, 'anonymous');
    assert.equal(row.subjectId, null);
    assert.equal(row.status, 404);
  });

  it('로그인한 요청은 성공 조회도 남기고, 주체 종류·id가 기록된다', async () => {
    const { rid } = await call('/api/health', { headers: bearer(tokenFor('partner')) });
    const row = await waitFor(() => accessByRid(rid!));
    assert.equal(row.subjectType, 'partner');
    assert.equal(row.subjectId, '00000000-0000-4000-8000-000000000000');
    assert.equal(row.method, 'GET');
    assert.ok(row.durationMs >= 0);
  });

  it('🔴 createdAt은 UTC로 저장되고, 보기 전용 칸 createdAtKst는 정확히 9시간 뒤다(3개 표 모두)', async () => {
    const { rid } = await call('/api/no-such-route');
    const access = await waitFor(() => accessByRid(rid!));
    await prisma.errorLog.create({ data: { requestId: rid!, errorName: 'UTC', message: 'm' } });
    await prisma.adminAuditLog.create({ data: { adminId: 'k', adminName: 'k', action: 'LIST', targetType: 'User', targetId: '', requestId: rid! } });
    const error = (await prisma.errorLog.findFirst({ where: { requestId: rid!, errorName: 'UTC' } }))!;
    const audit = (await prisma.adminAuditLog.findFirst({ where: { requestId: rid!, adminId: 'k' } }))!;
    for (const [name, row] of [['AccessLog', access], ['ErrorLog', error], ['AdminAuditLog', audit]] as const) {
      assert.ok(Math.abs(row.createdAt.getTime() - Date.now()) < 60 * 1000, `${name}.createdAt이 UTC(현재 시각)가 아니다: ${row.createdAt.toISOString()}`);
      // createdAtKst는 Prisma 모델에 없으므로(@ignore) raw로만 읽는다 — 이 시험 말고는 아무 코드도 읽지 않는다
      const raw = await prisma.$queryRawUnsafe<{ createdAt: Date; createdAtKst: Date }[]>(
        `SELECT "createdAt", "createdAtKst" FROM "${name}" WHERE "requestId" = $1 AND "id" = $2`,
        rid!,
        row.id,
      );
      assert.equal(raw.length, 1, `${name}에서 행을 못 찾음`);
      assert.equal(raw[0].createdAtKst.getTime() - raw[0].createdAt.getTime(), 9 * 60 * 60 * 1000, `${name}: createdAtKst가 +9시간이 아니다`);
    }
  });

  it('위조·만료 토큰은 익명으로 남는다(남의 id를 찍지 못한다)', async () => {
    const bad = tokenFor('user', { secret: 'wrong-secret' });
    const { rid } = await call('/api/no-such-route', { headers: bearer(bad) });
    const row = await waitFor(() => accessByRid(rid!));
    assert.equal(row.subjectType, 'anonymous');
    assert.equal(row.subjectId, null);
  });

  it('🔴 경로에서 쿼리 문자열(좌표)을 지운다', async () => {
    const { rid } = await call('/api/health?lat=37.123456&lng=127.654321', { headers: bearer(tokenFor('user')) });
    const row = await waitFor(() => accessByRid(rid!));
    assert.equal(row.path, '/api/health');
    assert.ok(!JSON.stringify(row).includes('37.123456'));
    assert.ok(!JSON.stringify(row).includes('127.654321'));
  });

  it('쓰기(POST)는 익명이어도 남는다 — 그리고 🔴 요청 본문·이메일은 어디에도 없다', async () => {
    const email = `nobody-${Date.now()}@example.test`;
    const secret = 'body-secret-pw-xyz';
    const { rid } = await call('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: secret }),
    });
    const access = await waitFor(() => accessByRid(rid!));
    const audit = await waitFor(() => prisma.adminAuditLog.findFirst({ where: { requestId: rid! } }));
    const dump = JSON.stringify([access, audit]);
    assert.equal(access.method, 'POST');
    assert.equal(access.status, 401);
    assert.ok(!dump.includes(secret), '비밀번호가 기록에 있다');
    assert.ok(!dump.includes(email), '시도한 이메일이 기록에 있다');
  });

  it('접속기록 쓰기가 실패해도 일반 요청은 그대로 성공한다', async () => {
    failing.add('AccessLog');
    try {
      const { res } = await call('/api/health', { headers: bearer(tokenFor('user')) });
      assert.equal(res.status, 200);
    } finally {
      failing.delete('AccessLog');
    }
  });
});

describe('운영자 감사 자동화', () => {
  it('로그인 성공은 LOGIN으로, 틀린 비밀번호는 LOGIN_FAIL로 IP·요청 번호와 함께 남는다', async () => {
    const { admin } = await adminLogin();
    const wrong = await call('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: admin.email, password: 'wrong' }),
    });
    const fail = await waitFor(() => prisma.adminAuditLog.findFirst({ where: { requestId: wrong.rid! } }));
    assert.equal(fail.action, 'LOGIN_FAIL');
    assert.equal(fail.result, 'FAIL');
    assert.equal(fail.adminId, admin.id);
    assert.ok(fail.ip, 'IP가 비어 있다');

    const ok = await prisma.adminAuditLog.findFirst({ where: { adminId: admin.id, action: 'LOGIN' } });
    assert.ok(ok);
    assert.equal(ok!.result, 'SUCCESS');
  });

  it('5회 실패로 잠기면 LOCKED가 남고, 잠금 중 시도도 LOCKED로 남는다', async () => {
    const { admin } = await adminLogin();
    for (let i = 0; i < 6; i++) {
      await call('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: admin.email, password: 'wrong' }),
      });
    }
    const locked = await prisma.adminAuditLog.findMany({ where: { adminId: admin.id, action: 'LOCKED' }, orderBy: { createdAt: 'asc' } });
    assert.equal(locked.length, 2);
    assert.deepEqual(locked.map((r) => r.reason), ['잠금 시작', '잠금 중 시도 거부']);
    assert.equal(await prisma.adminAuditLog.count({ where: { adminId: admin.id, action: 'LOGIN_FAIL' } }), 5);
  });

  it('운영자 목록 조회는 핸들러 수정 없이 LIST로, 상세는 대상 id와 함께 VIEW로 남는다', async () => {
    const { admin, token } = await adminLogin();
    const user = await prisma.user.create({ data: { name: '기록테스트회원' } });
    createdUserIds.push(user.id);

    const list = await call('/api/admin/consult-requests', { headers: bearer(token) });
    assert.equal(list.res.status, 200);
    const listRow = await waitFor(() => prisma.adminAuditLog.findFirst({ where: { requestId: list.rid! } }));
    assert.equal(listRow.action, 'LIST');
    assert.equal(listRow.targetType, 'ConsultRequest');
    assert.equal(listRow.adminId, admin.id);
    assert.equal(listRow.result, 'SUCCESS');
    assert.ok(listRow.ip);

    const detail = await call(`/api/admin/users/${user.id}`, { headers: bearer(token) });
    assert.equal(detail.res.status, 200);
    const viewRow = await waitFor(() => prisma.adminAuditLog.findFirst({ where: { requestId: detail.rid! } }));
    assert.equal(viewRow.action, 'VIEW');
    assert.equal(viewRow.targetType, 'User');
    assert.equal(viewRow.targetId, user.id);
    // 이전엔 핸들러가 직접 한 줄을 더 남겼다 — 중복 없이 이 요청에 한 줄이어야 한다
    assert.equal(await prisma.adminAuditLog.count({ where: { requestId: detail.rid! } }), 1);
  });

  it('없는 대상 조회(404)도 FAIL로 남는다', async () => {
    const { token } = await adminLogin();
    const ghost = '11111111-1111-4111-8111-111111111111';
    const { res, rid } = await call(`/api/admin/users/${ghost}`, { headers: bearer(token) });
    assert.equal(res.status, 404);
    const row = await waitFor(() => prisma.adminAuditLog.findFirst({ where: { requestId: rid! } }));
    assert.equal(row.result, 'FAIL');
    assert.equal(row.targetId, ghost);
  });

  it('쓰기(PATCH)는 UPDATE로 응답 뒤에 남는다', async () => {
    const { token } = await adminLogin();
    const { rid } = await call('/api/admin/partners/11111111-1111-4111-8111-111111111111/status', {
      method: 'PATCH',
      headers: { ...bearer(token), 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'APPROVED' }),
    });
    const row = await waitFor(() => prisma.adminAuditLog.findFirst({ where: { requestId: rid! } }));
    assert.equal(row.action, 'UPDATE');
    assert.equal(row.targetType, 'Partner');
  });

  it('🔴 감사기록을 못 쓰면 개인정보 열람(목록·상세)은 응답하지 않는다(503, 데이터 없음)', async () => {
    const { token } = await adminLogin();
    const user = await prisma.user.create({ data: { name: '열람거부테스트회원' } });
    createdUserIds.push(user.id);
    failing.add('AdminAuditLog');
    try {
      const list = await call('/api/admin/users', { headers: bearer(token) });
      assert.equal(list.res.status, 503);
      assert.ok(!list.text.includes('열람거부테스트회원'), '거부했는데 데이터가 나갔다');

      const detail = await call(`/api/admin/users/${user.id}`, { headers: bearer(token) });
      assert.equal(detail.res.status, 503);
      assert.ok(!detail.text.includes('열람거부테스트회원'), '거부했는데 데이터가 나갔다');
      assert.equal(JSON.parse(detail.text).requestId, detail.rid);
    } finally {
      failing.delete('AdminAuditLog');
    }
  });

  it('감사기록 실패는 본인 정보(/me)·로그인·쓰기를 막지 않는다', async () => {
    const { admin, token } = await adminLogin();
    failing.add('AdminAuditLog');
    try {
      const me = await call('/api/admin/me', { headers: bearer(token) });
      assert.equal(me.res.status, 200);

      const login = await call('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: admin.email, password: PASSWORD }),
      });
      assert.equal(login.res.status, 200);

      const write = await call('/api/admin/partners/11111111-1111-4111-8111-111111111111/status', {
        method: 'PATCH',
        headers: { ...bearer(token), 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'APPROVED' }),
      });
      assert.notEqual(write.res.status, 503);
    } finally {
      failing.delete('AdminAuditLog');
    }
  });
});

describe('에러 기록', () => {
  it('처리 못 한 예외: 500 JSON + 요청 번호 응답, 에러 기록은 마스킹된다', async () => {
    const res = await fetch(`${boomBase}/boom?token=secret-query`);
    const rid = res.headers.get('x-request-id')!;
    requestIds.push(rid);
    const body = await res.json();
    assert.equal(res.status, 500);
    assert.equal(body.requestId, rid);
    assert.ok(!JSON.stringify(body).includes('jane@example.com'), '응답에 에러 내용이 실렸다');

    const row = await waitFor(() => prisma.errorLog.findFirst({ where: { requestId: rid } }));
    assert.equal(row.status, 500);
    assert.equal(row.path, '/boom'); // 쿼리 제거
    assert.equal(row.errorName, 'Error');
    const dump = JSON.stringify(row);
    for (const leaked of ['jane@example.com', '010-1234-5678', 'abc.def.ghi', 'secret-query']) {
      assert.ok(!dump.includes(leaked), `${leaked} 가 에러 기록에 남았다`);
    }
  });

  it('4xx 에러는 응답만 돌려주고 에러 기록에는 남기지 않는다', async () => {
    const res = await fetch(`${boomBase}/teapot`);
    const rid = res.headers.get('x-request-id')!;
    requestIds.push(rid);
    assert.equal(res.status, 418);
    await new Promise((r) => setTimeout(r, 200));
    assert.equal(await prisma.errorLog.findFirst({ where: { requestId: rid } }), null);
  });

  it('핸들러가 직접 돌려준 5xx도 같은 요청 번호로 에러 기록에 남는다', async () => {
    // 로그인 핸들러가 DB 오류를 직접 잡아 500으로 답하는 경로 — 전역 처리기까지 오지 않는다
    failing.add('Admin.findUnique');
    let rid: string | null;
    try {
      ({ rid } = await call('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'x@example.test', password: 'x' }),
      }));
    } finally {
      failing.delete('Admin.findUnique');
    }
    const row = await waitFor(() => prisma.errorLog.findFirst({ where: { requestId: rid! } }));
    assert.equal(row.errorName, 'Http5xx');
    assert.equal(row.status, 500);
  });
});

describe('보관기간 파기', () => {
  it('접속기록 1년·감사 2년·에러 90일을 넘긴 행만 지우고 최근 행은 남긴다', async () => {
    const day = 24 * 60 * 60 * 1000;
    const at = (days: number) => new Date(Date.now() - days * day);
    const tag = `purge-${Date.now()}`;
    const mkAccess = (days: number, suffix: string) =>
      prisma.accessLog.create({ data: { requestId: `${tag}-${suffix}`, subjectType: 'anonymous', method: 'GET', path: '/x', status: 404, durationMs: 1, createdAt: at(days) } });
    const mkAudit = (days: number, suffix: string) =>
      prisma.adminAuditLog.create({ data: { adminId: 'p', adminName: 'p', action: 'LIST', targetType: 'User', targetId: '', requestId: `${tag}-${suffix}`, createdAt: at(days) } });
    const mkError = (days: number, suffix: string) =>
      prisma.errorLog.create({ data: { requestId: `${tag}-${suffix}`, errorName: 'E', message: 'm', createdAt: at(days) } });

    await Promise.all([
      mkAccess(366, 'a-old'), mkAccess(364, 'a-new'),
      mkAudit(731, 'u-old'), mkAudit(729, 'u-new'),
      mkError(91, 'e-old'), mkError(89, 'e-new'),
    ]);

    await purgeOpsLogExpired();

    const left = async (model: 'accessLog' | 'adminAuditLog' | 'errorLog') =>
      ((await (prisma[model] as any).findMany({ where: { requestId: { startsWith: tag } }, select: { requestId: true } })) as { requestId: string }[])
        .map((r) => r.requestId.replace(`${tag}-`, ''));
    assert.deepEqual(await left('accessLog'), ['a-new']);
    assert.deepEqual(await left('adminAuditLog'), ['u-new']);
    assert.deepEqual(await left('errorLog'), ['e-new']);

    await prisma.accessLog.deleteMany({ where: { requestId: { startsWith: tag } } });
    await prisma.adminAuditLog.deleteMany({ where: { requestId: { startsWith: tag } } });
    await prisma.errorLog.deleteMany({ where: { requestId: { startsWith: tag } } });
  });
});
