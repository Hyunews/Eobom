// docs 06-06 §4.1 — 업로드 입구 검사(10-06 3·4차 결정): tiff 제외 · 사진 5MB · PDF 20MB · PDF 1개.
// 모두 대기열·CLOVA 앞에서 400으로 끝나야 하므로 외부 호출 없이 돈다.
// 🔴 첫 줄 import는 testEnv여야 한다(전용 테스트 DB 가드).
import './helpers/testEnv';
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import app from '../src/app';
import prisma from '../src/config/prisma';
import { heavyQueue } from '../src/services/heavyQueue';
import { tokenFor } from './helpers/tokens';

const MB = 1024 * 1024;

describe('사진 인식 업로드 — 입구 검사', () => {
  let server: Server;
  let base = '';

  before(async () => {
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

  const blob = (bytes: number, type: string) => new Blob([new Uint8Array(bytes)], { type });

  const post = async (parts: Array<{ bytes: number; type: string; name: string }>) => {
    const form = new FormData();
    for (const p of parts) form.append('photos', blob(p.bytes, p.type), p.name);
    const res = await fetch(`${base}/api/ocr/recognize`, { method: 'POST', headers: { Authorization: `Bearer ${tokenFor('user')}` }, body: form });
    return { status: res.status, message: ((await res.json()) as { message: string }).message };
  };

  it('tiff는 거절한다', async () => {
    for (const [type, name] of [['image/tiff', 'will.tiff'], ['image/tiff', 'will.tif']] as const) {
      const r = await post([{ bytes: 100, type, name }]);
      assert.equal(r.status, 400);
      assert.equal(r.message, 'jpg·png·pdf 파일만 올릴 수 있습니다.');
    }
  });

  it('사진은 5MB 초과를 거절한다(png·heic)', async () => {
    const over = await post([{ bytes: 5 * MB + 1, type: 'image/png', name: 'big.png' }]);
    assert.equal(over.status, 400);
    assert.equal(over.message, '사진 1장은 5MB까지 올릴 수 있습니다.');
    const heic = await post([{ bytes: 6 * MB, type: 'image/heic', name: 'big.heic' }]);
    assert.equal(heic.status, 400);
    assert.equal(heic.message, '사진 1장은 5MB까지 올릴 수 있습니다.');
  });

  it('PDF는 20MB 초과를 거절한다', async () => {
    const r = await post([{ bytes: 20 * MB + 1, type: 'application/pdf', name: 'big.pdf' }]);
    assert.equal(r.status, 400);
    assert.equal(r.message, 'PDF 파일은 20MB까지 올릴 수 있습니다.');
  });

  it('PDF 2개는 거절한다', async () => {
    const r = await post([
      { bytes: 100, type: 'application/pdf', name: 'a.pdf' },
      { bytes: 100, type: 'application/pdf', name: 'b.pdf' },
    ]);
    assert.equal(r.status, 400);
    assert.equal(r.message, 'PDF는 1개만 올릴 수 있고, 사진과 함께 올릴 수 없습니다.');
  });

  it('PDF와 사진을 섞으면 거절한다', async () => {
    const r = await post([
      { bytes: 100, type: 'application/pdf', name: 'a.pdf' },
      { bytes: 100, type: 'image/png', name: 'b.png' },
    ]);
    assert.equal(r.status, 400);
    assert.equal(r.message, 'PDF는 1개만 올릴 수 있고, 사진과 함께 올릴 수 없습니다.');
  });

  it('검사에서 막힌 요청은 대기열을 쓰지 않는다', () => {
    assert.equal(heavyQueue.activeCount, 0);
    assert.equal(heavyQueue.waitingCount, 0);
  });
});
