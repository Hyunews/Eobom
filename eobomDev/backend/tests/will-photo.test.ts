// docs 06-06 §5-2 — 유언장 사진 보관(P4).
//  · 스위치 꺼짐 = 저장 0·목록 404 · 켬+인식 성공 = 저장·목록·보기(본인만) · 인식 실패 = 저장 안 함
//  · 10묶음 초과 = 보관 안 하고 인식만 · 본인 삭제 → 30일 뒤 어드민 파기 ④(감사 로그 I:) · 탈퇴 파기
// CLOVA·R2는 이 파일 안의 가짜로 대신한다 — 실호출·요금·외부 저장 없음. 데이터는 전부 가짜.
// 🔴 첫 줄 import는 testEnv여야 한다(전용 테스트 DB 가드).
import './helpers/testEnv';
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import sharp from 'sharp';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import app from '../src/app';
import prisma from '../src/config/prisma';
import { TEST_JWT_SECRET } from './helpers/testEnv';
import { ClovaOcrProvider } from '../src/services/clovaOcrProvider';
import { NoRecognizedTextError } from '../src/services/heavyJob';
import { willPhotoStorage } from '../src/services/willPhotoStorage';
import { purgeAccount } from '../src/services/accountPurgeService';
import { LIMIT_MESSAGE, MAX_WILL_PHOTO_SETS } from '../src/services/willPhotoService';

const DAY = 24 * 60 * 60 * 1000;
const PASSWORD = 'test-pass-1234';
const tag = `wp-${Date.now()}`;

let server: Server;
let base = '';
let jpeg: Buffer;
const users: Record<'a' | 'b' | 'c', { id: string; token: string }> = { a: { id: '', token: '' }, b: { id: '', token: '' }, c: { id: '', token: '' } };
let adminId = '';
let adminToken = '';

// 가짜 R2 — 키 → 바이트. 저장·삭제를 눈으로 센다.
const fakeR2 = new Map<string, Buffer>();
const original = { put: willPhotoStorage.put, get: willPhotoStorage.get, remove: willPhotoStorage.remove };
let ocrMode: 'ok' | 'empty' = 'ok';
const originalRecognize = ClovaOcrProvider.prototype.recognize;
const originalEnv = { ...process.env };

const userToken = (id: string) => jwt.sign({ id, name: '보관시험', aud: 'user' }, TEST_JWT_SECRET!, { expiresIn: '5m' });

const recognize = async (token: string, opts: { keep?: boolean; count?: number } = {}) => {
  const form = new FormData();
  for (let i = 0; i < (opts.count ?? 1); i++) form.append('photos', new Blob([new Uint8Array(jpeg)], { type: 'image/jpeg' }), `secret-name-${i}.jpg`);
  if (opts.keep !== undefined) form.append('keepPhoto', String(opts.keep));
  const res = await fetch(`${base}/api/ocr/recognize`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form });
  return { status: res.status, body: (await res.json()) as any };
};
const get = (path: string, token?: string) => fetch(`${base}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
const admin = (path: string, init: RequestInit = {}) =>
  fetch(`${base}${path}`, { ...init, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}`, ...(init.headers ?? {}) } });

const setSwitch = (on: boolean) => {
  process.env.R2_WILL_ENABLED = on ? 'true' : 'false';
};

before(async () => {
  const rows = await prisma.$queryRaw<{ db: string }[]>`SELECT current_database() AS db`;
  assert.ok(rows[0].db.endsWith('_test'), `연결된 DB가 _test가 아닙니다: ${rows[0].db} — 테스트를 중단합니다.`);

  // 버킷 변수 4개(가짜) — 스위치는 각 시험이 켜고 끈다. 실제 R2로는 나가지 않는다(storage를 바꿔 끼움).
  process.env.R2_ENDPOINT = 'https://fake.invalid';
  process.env.R2_WILL_ACCESS_KEY_ID = 'fake';
  process.env.R2_WILL_SECRET_ACCESS_KEY = 'fake';
  process.env.R2_WILL_BUCKET = 'eobom-will-photo-test';
  setSwitch(false);

  let n = 0;
  willPhotoStorage.put = async (buf) => {
    const key = `${tag}-${++n}`;
    fakeR2.set(key, Buffer.from(buf));
    return key;
  };
  willPhotoStorage.get = async (key) => {
    const b = fakeR2.get(key);
    if (!b) throw new Error('NoSuchKey');
    return b;
  };
  willPhotoStorage.remove = async (key) => {
    fakeR2.delete(key);
  };
  ClovaOcrProvider.prototype.recognize = async function () {
    if (ocrMode === 'empty') throw new NoRecognizedTextError('글자 없음');
    return { text: '유언장 시험 글', lines: [], pages: [{ text: '유언장 시험 글', lines: [] }] };
  };

  jpeg = await sharp({ create: { width: 64, height: 64, channels: 3, background: { r: 240, g: 240, b: 240 } } }).jpeg().toBuffer();

  for (const k of ['a', 'b', 'c'] as const) {
    const u = await prisma.user.create({ data: { name: `보관시험${k}` } });
    users[k] = { id: u.id, token: userToken(u.id) };
  }
  const adm = await prisma.admin.create({
    data: { email: `wp-${tag}@example.test`, passwordHash: await bcrypt.hash(PASSWORD, 4), name: '보관시험운영자' },
  });
  adminId = adm.id;

  server = app.listen(0);
  await new Promise<void>((r) => server.once('listening', () => r()));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const login = await fetch(`${base}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: adm.email, password: PASSWORD }),
  });
  assert.equal(login.status, 200);
  adminToken = (await login.json()).accessToken;
});

after(async () => {
  Object.assign(willPhotoStorage, original);
  ClovaOcrProvider.prototype.recognize = originalRecognize;
  for (const k of ['R2_ENDPOINT', 'R2_WILL_ACCESS_KEY_ID', 'R2_WILL_SECRET_ACCESS_KEY', 'R2_WILL_BUCKET', 'R2_WILL_ENABLED'] as const) {
    if (originalEnv[k] === undefined) delete process.env[k];
    else process.env[k] = originalEnv[k];
  }
  const ids = Object.values(users).map((u) => u.id).filter(Boolean);
  await prisma.willPhoto.deleteMany({ where: { set: { userId: { in: ids } } } });
  await prisma.willPhotoSet.deleteMany({ where: { userId: { in: ids } } }); // FK Restrict — 사용자보다 먼저
  await prisma.farewellPurgeAuditLog.deleteMany({ where: { adminId } });
  if (adminId) await prisma.admin.deleteMany({ where: { id: adminId } });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
  await new Promise<void>((r) => (server ? server.close(() => r()) : r()));
  await prisma.$disconnect();
});

describe('유언장 사진 보관 — 스위치 꺼짐(§5-2-1)', () => {
  it('status는 photoStorageEnabled=false · 인식은 되지만 저장 0 · 목록·보기·삭제는 404', async () => {
    setSwitch(false);
    const status = await (await get('/api/ocr/status')).json();
    assert.equal(status.data.photoStorageEnabled, false);

    const r = await recognize(users.a.token, { keep: true });
    assert.equal(r.status, 200);
    assert.equal(r.body.data.photo, undefined, '꺼짐인데 보관 결과가 실렸다');
    assert.equal(await prisma.willPhotoSet.count({ where: { userId: users.a.id } }), 0);
    assert.equal(fakeR2.size, 0);

    assert.equal((await get('/api/will-photos', users.a.token)).status, 404);
  });

  it('버킷 변수가 하나라도 없으면 스위치를 켜도 꺼진 것이다', async () => {
    setSwitch(true);
    const saved = process.env.R2_WILL_BUCKET;
    delete process.env.R2_WILL_BUCKET;
    assert.equal((await (await get('/api/ocr/status')).json()).data.photoStorageEnabled, false);
    process.env.R2_WILL_BUCKET = saved;
    assert.equal((await (await get('/api/ocr/status')).json()).data.photoStorageEnabled, true);
  });
});

describe('유언장 사진 보관 — 저장·목록·보기·삭제(§5-2-2·§5-2-4)', () => {
  let setId = '';

  it('켬 + 인식 성공 + 체크: 한 요청에서 묶음 1개(2장)가 저장되고 파일 이름은 어디에도 없다', async () => {
    setSwitch(true);
    const r = await recognize(users.a.token, { keep: true, count: 2 });
    assert.equal(r.status, 200);
    assert.deepEqual(r.body.data.photo, { stored: true });

    const sets = await prisma.willPhotoSet.findMany({ where: { userId: users.a.id }, include: { photos: true } });
    assert.equal(sets.length, 1);
    assert.equal(sets[0].pageCount, 2);
    assert.equal(sets[0].photos.length, 2);
    assert.ok(sets[0].photos.every((p) => p.mediaMime === 'image/jpeg' && p.sizeBytes > 0 && fakeR2.has(p.mediaKey)));
    assert.ok(!JSON.stringify(sets).includes('secret-name'), '파일 이름이 저장됐다');
    setId = sets[0].id;
  });

  it('체크를 끄면(또는 안 보내면) 저장하지 않는다', async () => {
    const before = fakeR2.size;
    assert.equal((await recognize(users.a.token, { keep: false })).body.data.photo, undefined);
    assert.equal((await recognize(users.a.token)).body.data.photo, undefined);
    assert.equal(fakeR2.size, before);
    assert.equal(await prisma.willPhotoSet.count({ where: { userId: users.a.id } }), 1);
  });

  it('목록은 본인 것만(키·크기 없음) · 보기는 바이트가 그대로 나오고 캐시 금지', async () => {
    const list = await get('/api/will-photos', users.a.token);
    const text = await list.text();
    const data = JSON.parse(text).data as { id: string; pageCount: number; mimes: string[] }[];
    assert.equal(data.length, 1);
    assert.equal(data[0].id, setId);
    assert.deepEqual(data[0].mimes, ['image/jpeg', 'image/jpeg']);
    assert.ok(!text.includes('mediaKey') && !text.includes(tag), '목록에 R2 키가 실렸다');

    const page = await get(`/api/will-photos/${setId}/pages/1`, users.a.token);
    assert.equal(page.status, 200);
    assert.equal(page.headers.get('content-type'), 'image/jpeg');
    assert.equal(page.headers.get('cache-control'), 'no-store');
    assert.ok(Buffer.from(await page.arrayBuffer()).equals(jpeg));

    // 다른 회원·비로그인은 못 본다
    assert.deepEqual(((await (await get('/api/will-photos', users.b.token)).json()).data), []);
    assert.equal((await get(`/api/will-photos/${setId}/pages/0`, users.b.token)).status, 404);
    assert.equal((await get(`/api/will-photos/${setId}/pages/0`)).status, 401);
    assert.equal((await get(`/api/will-photos/${setId}/pages/9`, users.a.token)).status, 404);
  });

  it('본인 삭제: 목록·보기에서 빠지고 R2는 그대로(30일 뒤 파기) · 남의 묶음은 지울 수 없다', async () => {
    const other = await fetch(`${base}/api/will-photos/${setId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${users.b.token}` } });
    assert.equal(other.status, 404);

    const del = await fetch(`${base}/api/will-photos/${setId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${users.a.token}` } });
    assert.equal(del.status, 200);
    assert.deepEqual((await (await get('/api/will-photos', users.a.token)).json()).data, []);
    assert.equal((await get(`/api/will-photos/${setId}/pages/0`, users.a.token)).status, 404);

    const row = await prisma.willPhotoSet.findUniqueOrThrow({ where: { id: setId }, include: { photos: true } });
    assert.ok(row.deletedAt && !row.purgedAt);
    assert.ok(row.photos.every((p) => fakeR2.has(p.mediaKey)), 'R2 원본이 벌써 지워졌다');
  });
});

describe('유언장 사진 보관 — 인식 실패·상한(§5-2-2)', () => {
  it('인식 실패(글자 없음)면 저장하지 않는다', async () => {
    setSwitch(true);
    ocrMode = 'empty';
    try {
      const before = fakeR2.size;
      const r = await recognize(users.b.token, { keep: true });
      assert.equal(r.status, 502);
      assert.equal(r.body.code, 'NO_TEXT');
      assert.equal(await prisma.willPhotoSet.count({ where: { userId: users.b.id } }), 0);
      assert.equal(fakeR2.size, before);
    } finally {
      ocrMode = 'ok';
    }
  });

  it('10묶음이면 보관하지 않고 인식만 한다 — 안내 문구가 내려가고 인식 결과는 그대로', async () => {
    setSwitch(true);
    await prisma.willPhotoSet.createMany({ data: Array.from({ length: MAX_WILL_PHOTO_SETS }, () => ({ userId: users.b.id, pageCount: 1 })) });
    const r = await recognize(users.b.token, { keep: true });
    assert.equal(r.status, 200);
    assert.equal(r.body.data.text, '유언장 시험 글');
    assert.deepEqual(r.body.data.photo, { stored: false, message: LIMIT_MESSAGE });
    assert.equal(LIMIT_MESSAGE, '보관 사진이 10묶음을 넘었습니다. 이전 사진을 삭제한 뒤 보관할 수 있습니다.');
    assert.equal(await prisma.willPhotoSet.count({ where: { userId: users.b.id } }), MAX_WILL_PHOTO_SETS);
  });

  it('본인이 삭제한 묶음은 10개에 세지 않는다', async () => {
    const one = await prisma.willPhotoSet.findFirstOrThrow({ where: { userId: users.b.id } });
    await prisma.willPhotoSet.update({ where: { id: one.id }, data: { deletedAt: new Date() } });
    assert.deepEqual((await recognize(users.b.token, { keep: true })).body.data.photo, { stored: true });
  });

  it('R2 저장이 실패해도 인식 결과는 돌려주고 보관 못 했다고 알린다 · 올린 조각은 치운다', async () => {
    setSwitch(true);
    const putOk = willPhotoStorage.put;
    let calls = 0;
    willPhotoStorage.put = async (buf) => {
      if (++calls === 2) throw new Error('R2 down');
      return putOk(buf);
    };
    try {
      const before = fakeR2.size;
      const r = await recognize(users.c.token, { keep: true, count: 2 });
      assert.equal(r.status, 200);
      assert.equal(r.body.data.photo.stored, false);
      assert.equal(await prisma.willPhotoSet.count({ where: { userId: users.c.id } }), 0);
      assert.equal(fakeR2.size, before, '실패 전에 올린 조각이 R2에 남았다');
    } finally {
      willPhotoStorage.put = putOk;
    }
  });
});

describe('유언장 사진 — 어드민 파기 ④(§5-2-5)', () => {
  let expiredId = '';
  let youngId = '';
  let expiredKey = '';

  before(async () => {
    const mk = async (deletedAt: Date) => {
      const key = `${tag}-seed-${Math.random()}`;
      fakeR2.set(key, Buffer.from('x'));
      const s = await prisma.willPhotoSet.create({
        data: { userId: users.c.id, pageCount: 1, deletedAt, photos: { create: [{ pageIndex: 0, mediaKey: key, mediaMime: 'image/jpeg', sizeBytes: 1 }] } },
      });
      return { id: s.id, key };
    };
    const e = await mk(new Date(Date.now() - 31 * DAY));
    const y = await mk(new Date(Date.now() - 10 * DAY));
    expiredId = e.id;
    expiredKey = e.key;
    youngId = y.id;
  });

  const execute = (items: { id: string; type: string }[], expectedCount: number) =>
    admin('/api/admin/farewell-purge/execute', { method: 'POST', body: JSON.stringify({ items, expectedCount, password: PASSWORD }) });

  it('목록: 30일 지난 묶음만 willPhoto에 나온다(회원·키는 내려주지 않는다)', async () => {
    const text = await (await admin('/api/admin/farewell-purge/expired')).text();
    const list = JSON.parse(text).data.willPhoto as { id: string; pageCount: number }[];
    assert.ok(list.some((r) => r.id === expiredId));
    assert.ok(!list.some((r) => r.id === youngId));
    assert.ok(!text.includes(expiredKey) && !text.includes(users.c.id), '목록 응답에 키·회원 id가 실렸다');
  });

  it('30일 안 지난 묶음은 서버 재검증이 409로 막는다 · 건수가 다르면 400', async () => {
    assert.equal((await execute([{ id: youngId, type: 'WILL' }], 1)).status, 409);
    assert.equal((await execute([{ id: expiredId, type: 'WILL' }], 2)).status, 400);
    assert.equal((await prisma.willPhotoSet.findUniqueOrThrow({ where: { id: expiredId } })).purgedAt, null);
  });

  it('실행: R2 원본 삭제 + purgedAt + 감사 로그 I: · 행은 남고 원장에는 안 올라간다', async () => {
    const ledgerBefore = await prisma.archivePurgeQueue.count();
    const res = await execute([{ id: expiredId, type: 'WILL' }], 1);
    assert.equal(res.status, 200);
    assert.equal(fakeR2.has(expiredKey), false, 'R2 원본이 안 지워졌다');
    const row = await prisma.willPhotoSet.findUniqueOrThrow({ where: { id: expiredId }, include: { photos: true } });
    assert.ok(row.purgedAt && row.photos.every((p) => p.purgedAt));
    assert.equal(await prisma.archivePurgeQueue.count(), ledgerBefore);

    const audit = await prisma.farewellPurgeAuditLog.findFirstOrThrow({ where: { adminId } });
    assert.equal(audit.targetIds, `I:${expiredId}`);
    assert.equal(audit.mediaKeys, '');

    assert.equal((await execute([{ id: expiredId, type: 'WILL' }], 1)).status, 409); // 다시 보내면 막는다
  });

  it('파기 기록 보기: type=I 필터에 나오고 V 필터에는 안 나온다 · 종류별 건수에 I가 있다', async () => {
    const logs = async (type: string) => (await (await admin(`/api/admin/farewell-purge/logs?pageSize=100&type=${type}`)).json()).data.logs as { targets: string[]; counts: Record<string, number> }[];
    const forI = await logs('I');
    const mine = forI.find((l) => l.targets.includes(`I:${expiredId}`));
    assert.ok(mine);
    assert.deepEqual(mine!.counts, { V: 0, L: 0, R: 0, I: 1, unknown: 0 });
    assert.ok(!(await logs('V')).some((l) => l.targets.includes(`I:${expiredId}`)));
  });
});

describe('유언장 사진 — 탈퇴 파기(§5-2-5 ④)', () => {
  it('purgeAccount가 그 회원의 사진 묶음(본인 삭제 여부 무관)을 R2에서 지우고 purgedAt을 찍는다 · 다른 회원 것은 그대로', async () => {
    const mkSet = async (userId: string, deletedAt: Date | null) => {
      const key = `${tag}-acct-${Math.random()}`;
      fakeR2.set(key, Buffer.from('y'));
      const s = await prisma.willPhotoSet.create({
        data: { userId, pageCount: 1, deletedAt, photos: { create: [{ pageIndex: 0, mediaKey: key, mediaMime: 'image/png', sizeBytes: 1 }] } },
      });
      return { id: s.id, key };
    };
    const alive = await mkSet(users.a.id, null);
    const trashed = await mkSet(users.a.id, new Date());
    const others = await mkSet(users.b.id, null);

    await prisma.user.update({
      where: { id: users.a.id },
      data: { deletionRequestedAt: new Date(Date.now() - 31 * DAY), deletionScheduledAt: new Date(Date.now() - DAY) },
    });
    const r = await purgeAccount({ id: users.a.id, deletionRequestedAt: new Date(), deletionScheduledAt: new Date(Date.now() - DAY) });
    assert.equal(r.purged, true);

    assert.equal(fakeR2.has(alive.key), false);
    assert.equal(fakeR2.has(trashed.key), false);
    assert.equal(fakeR2.has(others.key), true, '다른 회원의 사진이 지워졌다');
    assert.equal(await prisma.willPhotoSet.count({ where: { userId: users.a.id, purgedAt: null } }), 0);
    assert.equal((await prisma.willPhotoSet.findUniqueOrThrow({ where: { id: others.id } })).purgedAt, null);
    assert.ok((await prisma.user.findUniqueOrThrow({ where: { id: users.a.id } })).purgedAt);
  });
});
