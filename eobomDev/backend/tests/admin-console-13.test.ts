// 운영자 콘솔 묶음 13 회귀 테스트 — 00-37 §3.3·§4.1 · 01-05 §14-9.
//
// 불변 규칙: SUPERADMIN만 하는 새 라우트는 OPERATOR가 부르면 403 / 마지막 남은 SUPERADMIN은 낮출 수 없다 /
// 정지된 회원 토큰은 403(고정 문구, 사유 미노출) · 해제하면 복구 / 탈퇴 대리 접수는 유예 30일·사유 필수·중복 409 /
// 감사로그는 ?result=FAIL로 거를 수 있다.
// 🔴 첫 줄 import는 testEnv여야 한다 — 전용 테스트 DB 가드(_test·localhost)가 앱보다 먼저여야 한다.
// 가짜 계정만 만들고, 끝나면 자기 id만 지운다(전용 테스트 DB).
import { TEST_JWT_SECRET } from './helpers/testEnv';
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import app from '../src/app';
import prisma from '../src/config/prisma';

let server: Server;
let base = '';
const adminIds: string[] = [];
const userIds: string[] = [];
const auditTargetIds: string[] = [];

const adminToken = (a: { id: string; name: string }) => jwt.sign({ id: a.id, name: a.name, aud: 'admin' }, TEST_JWT_SECRET!, { expiresIn: '5m' });
const userToken = (id: string) => jwt.sign({ id, name: '콘솔테스트회원', email: 'c13@example.test', provider: 'kakao', aud: 'user' }, TEST_JWT_SECRET!, { expiresIn: '5m' });

async function makeAdmin(tag: string, role: 'SUPERADMIN' | 'OPERATOR') {
  const admin = await prisma.admin.create({
    data: { email: `c13-${tag}-${Date.now()}@example.test`, passwordHash: await bcrypt.hash('correct-horse-battery', 4), name: `콘솔-${tag}`, role },
  });
  adminIds.push(admin.id);
  return admin;
}

async function makeUser(tag: string) {
  const user = await prisma.user.create({ data: { name: `콘솔-${tag}`, email: `c13-${tag}-${Date.now()}@example.test` } });
  userIds.push(user.id);
  return user;
}

async function call(method: string, path: string, token: string, body?: unknown) {
  const res = await fetch(`${base}/api/admin${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, json: (await res.json().catch(() => null)) as any };
}

before(async () => {
  const rows = await prisma.$queryRaw<{ db: string }[]>`SELECT current_database() AS db`;
  assert.ok(rows[0].db.endsWith('_test'), `연결된 DB가 _test가 아닙니다: ${rows[0].db} — 테스트를 중단합니다.`);
  server = app.listen(0);
  await new Promise<void>((r) => server.once('listening', () => r()));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(async () => {
  await prisma.adminAuditLog.deleteMany({ where: { OR: [{ adminId: { in: adminIds } }, { targetId: { in: [...userIds, ...adminIds, ...auditTargetIds] } }] } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  await prisma.admin.deleteMany({ where: { id: { in: adminIds } } });
  await new Promise<void>((r) => server.close(() => r()));
  await prisma.$disconnect();
});

describe('SUPERADMIN 가드(00-37 §3.3)', () => {
  it('OPERATOR가 새 SUPERADMIN 라우트를 부르면 403', async () => {
    const op = await makeAdmin('guard-op', 'OPERATOR');
    const user = await makeUser('guard');
    const t = adminToken(op);
    const calls: [string, string, unknown?][] = [
      ['PATCH', `/users/${user.id}/suspend`, { reason: '시험' }],
      ['PATCH', `/users/${user.id}/unsuspend`, { reason: '시험' }],
      ['POST', `/users/${user.id}/deletion-request`, { reason: '시험' }],
      ['GET', '/accounts'],
      ['PATCH', `/accounts/${op.id}/role`, { role: 'SUPERADMIN' }],
      ['PATCH', `/accounts/${op.id}/password`, { newPassword: 'new-password-1' }],
      ['POST', '/commission-policies', { basis: 'PER_LEAD', amount: 1, effectiveFrom: '2030-01-01' }],
      ['PATCH', '/commission-policies/none', { effectiveTo: '2031-01-01' }],
    ];
    for (const [method, path, body] of calls) {
      const r = await call(method, path, t, body);
      assert.equal(r.status, 403, `${method} ${path}`);
    }
    // 심사 일(정지·해제 외 조회)은 OPERATOR도 연다
    assert.equal((await call('GET', '/audit-logs', t)).status, 200);
    assert.equal((await call('GET', '/commission-policies', t)).status, 200);
  });
});

describe('운영자 계정(마지막 SUPERADMIN)', () => {
  it('SUPERADMIN이 둘일 때 하나를 낮출 수 있고, 마지막 하나는 낮출 수 없다', async () => {
    const a = await makeAdmin('sa-a', 'SUPERADMIN');
    const b = await makeAdmin('sa-b', 'SUPERADMIN');
    // "마지막 하나"는 DB 전체를 세는 규칙이라 다른 테스트 파일(병렬로 돈다)이 만든 기본 등급(SUPERADMIN) 계정이 끼면 판이 흔들린다.
    // → 나 말고는 모두 OPERATOR로 내려 판을 만들고, 끼어든 계정 때문에 낮추기가 통과해 버리면 되돌리고 다시 해 본다(테스트 DB 전용).
    const others = await prisma.admin.findMany({ where: { role: 'SUPERADMIN', id: { notIn: [a.id, b.id] } }, select: { id: true } });
    const t = adminToken(a);
    try {
      const bad = await call('PATCH', `/accounts/${a.id}/role`, t, { role: 'ROOT' });
      assert.equal(bad.status, 400);

      await prisma.admin.updateMany({ where: { role: 'SUPERADMIN', id: { notIn: [a.id, b.id] } }, data: { role: 'OPERATOR' } });
      const first = await call('PATCH', `/accounts/${b.id}/role`, t, { role: 'OPERATOR' });
      assert.equal(first.status, 200);

      let refused: { status: number; json: any } | null = null;
      for (let i = 0; i < 5 && !refused; i += 1) {
        await prisma.admin.updateMany({ where: { role: 'SUPERADMIN', id: { notIn: [a.id] } }, data: { role: 'OPERATOR' } });
        const last = await call('PATCH', `/accounts/${a.id}/role`, t, { role: 'OPERATOR' });
        if (last.status === 409) refused = last;
        else await prisma.admin.update({ where: { id: a.id }, data: { role: 'SUPERADMIN' } }); // 끼어든 SUPERADMIN 때문에 통과했다 — 되돌리고 다시
      }
      assert.ok(refused, '마지막 남은 SUPERADMIN을 낮추는 요청이 거절되지 않았다');
      assert.match(refused.json.message, /마지막 남은 SUPERADMIN/);
      assert.equal((await prisma.admin.findUniqueOrThrow({ where: { id: a.id } })).role, 'SUPERADMIN');
    } finally {
      await prisma.admin.updateMany({ where: { id: { in: others.map((o) => o.id) } }, data: { role: 'SUPERADMIN' } });
    }
  });

  it('비밀번호 변경은 8자 미만을 거절하고, 바꾸면 새 비밀번호가 맞는다', async () => {
    const a = await makeAdmin('pw-a', 'SUPERADMIN');
    const target = await makeAdmin('pw-target', 'OPERATOR');
    const t = adminToken(a);
    assert.equal((await call('PATCH', `/accounts/${target.id}/password`, t, { newPassword: 'short' })).status, 400);
    assert.equal((await call('PATCH', `/accounts/${target.id}/password`, t, { newPassword: 'brand-new-password' })).status, 200);
    const row = await prisma.admin.findUniqueOrThrow({ where: { id: target.id } });
    assert.ok(await bcrypt.compare('brand-new-password', row.passwordHash));
    assert.equal(row.refreshTokenHash, null);
  });
});

describe('회원 정지·해제', () => {
  it('사유 없이는 400, 정지하면 회원 토큰이 고정 문구로 403(사유 미노출), 해제하면 복구', async () => {
    const admin = await makeAdmin('susp', 'SUPERADMIN');
    const user = await makeUser('susp');
    const t = adminToken(admin);

    assert.equal((await call('PATCH', `/users/${user.id}/suspend`, t, { reason: '  ' })).status, 400);
    const ok = await call('PATCH', `/users/${user.id}/suspend`, t, { reason: '약관 위반 시험 사유' });
    assert.equal(ok.status, 200);
    assert.equal((await call('PATCH', `/users/${user.id}/suspend`, t, { reason: '다시' })).status, 409);

    const blocked = await fetch(`${base}/api/me/deletion-preview`, { headers: { Authorization: `Bearer ${userToken(user.id)}` } });
    assert.equal(blocked.status, 403);
    const body = (await blocked.json()) as { message: string };
    assert.match(body.message, /이용이 정지된 계정입니다\. 문의: /);
    assert.ok(!body.message.includes('약관 위반 시험 사유'), '운영자 사유가 응답에 새면 안 된다');

    assert.equal((await call('PATCH', `/users/${user.id}/unsuspend`, t, { reason: '오해 해소' })).status, 200);
    const back = await fetch(`${base}/api/me/deletion-preview`, { headers: { Authorization: `Bearer ${userToken(user.id)}` } });
    assert.notEqual(back.status, 403);
    const row = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    assert.equal(row.suspendedAt, null);
    assert.equal(row.suspendReason, null);

    const logs = await prisma.adminAuditLog.findMany({ where: { targetId: user.id, action: { in: ['SUSPEND', 'UNSUSPEND'] } } });
    assert.deepEqual(logs.map((l) => l.action).sort(), ['SUSPEND', 'UNSUSPEND']);
  });
});

describe('탈퇴 대리 접수', () => {
  it('사유 필수 · 유예 30일 · 두 번째는 409 · 본인 탈퇴와 같은 처리', async () => {
    const admin = await makeAdmin('wd', 'SUPERADMIN');
    const user = await makeUser('wd');
    const t = adminToken(admin);

    assert.equal((await call('POST', `/users/${user.id}/deletion-request`, t, {})).status, 400);
    const r = await call('POST', `/users/${user.id}/deletion-request`, t, { reason: '10-23 메일 요청 · 가입 메일과 같은 주소 확인' });
    assert.equal(r.status, 201);
    const row = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    assert.ok(row.deletionRequestedAt && row.deletionScheduledAt);
    const days = Math.round((row.deletionScheduledAt!.getTime() - row.deletionRequestedAt!.getTime()) / 86_400_000);
    assert.equal(days, 30);

    assert.equal((await call('POST', `/users/${user.id}/deletion-request`, t, { reason: '다시' })).status, 409);
    assert.equal((await call('POST', `/users/00000000-0000-4000-8000-0000000000ff/deletion-request`, t, { reason: '없는 회원' })).status, 404);
  });
});

describe('감사로그 열람', () => {
  it('?result=FAIL로 거르고, 잘못된 result는 400', async () => {
    const admin = await makeAdmin('audit', 'OPERATOR');
    const t = adminToken(admin);
    // 실패 한 건을 만든다 — 사유 없는 정지는 이 계정이 OPERATOR라 403(FAIL로 남는다)
    await call('PATCH', `/users/zzz/suspend`, t, { reason: 'x' });
    // 감사 기록은 응답 뒤에 쓰인다 — 잠깐 기다린다
    await new Promise((r) => setTimeout(r, 300));
    const fail = await call('GET', '/audit-logs?result=FAIL&pageSize=100', t);
    assert.equal(fail.status, 200);
    assert.ok(fail.json.data.length >= 1);
    assert.ok(fail.json.data.every((l: { result: string }) => l.result === 'FAIL'));
    assert.ok(Array.isArray(fail.json.actions));
    assert.equal((await call('GET', '/audit-logs?result=NOPE', t)).status, 400);
  });
});

describe('요율 등록 틀', () => {
  it('금액·정률 중 하나만, 기존 요율의 적용 종료만 닫고 새 요율을 더한다', async () => {
    const admin = await makeAdmin('rate', 'SUPERADMIN');
    const t = adminToken(admin);
    const mk = (body: object) => call('POST', '/commission-policies', t, body);

    assert.equal((await mk({ basis: 'PER_LEAD', effectiveFrom: '2040-01-01' })).status, 400); // 둘 다 없음
    assert.equal((await mk({ basis: 'PER_LEAD', amount: 1000, rate: 0.05, effectiveFrom: '2040-01-01' })).status, 400); // 둘 다 있음
    assert.equal((await mk({ basis: 'NOPE', amount: 1000, effectiveFrom: '2040-01-01' })).status, 400);

    const first = await mk({ basis: 'PER_LEAD', amount: 1000, effectiveFrom: '2040-01-01', memo: '[예시] 시험' });
    assert.equal(first.status, 201);
    auditTargetIds.push(first.json.data.id);
    const second = await mk({ basis: 'PER_LEAD', amount: 2000, effectiveFrom: '2041-01-01' });
    assert.equal(second.status, 201);
    auditTargetIds.push(second.json.data.id);
    // 같은 범위에 더 이른 시작일은 겹친다
    assert.equal((await mk({ basis: 'PER_LEAD', amount: 3000, effectiveFrom: '2040-06-01' })).status, 409);

    const closed = await prisma.commissionPolicy.findUniqueOrThrow({ where: { id: first.json.data.id } });
    assert.equal(closed.effectiveTo?.toISOString().slice(0, 10), '2041-01-01');
    assert.equal(closed.amount, 1000); // 값은 그대로

    await prisma.commissionPolicy.deleteMany({ where: { id: { in: [first.json.data.id, second.json.data.id] } } });
  });
});
