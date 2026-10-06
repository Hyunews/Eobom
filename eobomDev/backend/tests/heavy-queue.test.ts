// docs 06-04 §6.4-11-10 — 사진 글자 인식·음성 변환 합산 대기열 시험.
// 🔴 첫 줄 import는 testEnv여야 한다(전용 테스트 DB 가드).
import './helpers/testEnv';
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import app from '../src/app';
import prisma from '../src/config/prisma';
import { HeavyQueue, HEAVY_QUEUE_CONFIG, QueueRejectedError, heavyQueue } from '../src/services/heavyQueue';
import { tokenFor } from './helpers/tokens';

const tick = () => new Promise<void>((r) => setImmediate(r));

describe('HeavyQueue 단위', () => {
  it('설정값은 2 · 10 · 30초 + 즉시 알림 30초 · 마감 사진 55초/음성 115초 · 음성 10분', () => {
    assert.deepEqual(JSON.parse(JSON.stringify(HEAVY_QUEUE_CONFIG)), {
      maxConcurrent: 2,
      maxWaiting: 10,
      maxWaitMs: 30_000,
      instantWaitMs: 30_000,
      defaultJobMs: { photo: 10_000, audio: 30_000 },
      deadlineMs: { photo: 55_000, audio: 115_000 },
      audioMaxSeconds: 600,
    });
  });

  it('동시 2건까지 즉시 처리, 3번째는 대기하다 슬롯이 나면 도착 순서대로 진행', async () => {
    const q = new HeavyQueue({ maxConcurrent: 2, maxWaiting: 10, maxWaitMs: 5_000 });
    const r1 = await q.acquire();
    const r2 = await q.acquire();
    assert.equal(q.activeCount, 2);

    const order: number[] = [];
    const p3 = q.acquire().then((r) => { order.push(3); return r; });
    const p4 = q.acquire().then((r) => { order.push(4); return r; });
    await tick();
    assert.equal(q.waitingCount, 2);
    assert.deepEqual(order, []);

    r1();
    const r3 = await p3;
    assert.deepEqual(order, [3]);
    assert.equal(q.activeCount, 2); // 슬롯을 그대로 승계
    r2();
    const r4 = await p4;
    assert.deepEqual(order, [3, 4]);
    r3(); r4();
    assert.equal(q.activeCount, 0);
    assert.equal(q.waitingCount, 0);
  });

  it('release를 두 번 불러도 슬롯이 두 번 반환되지 않는다', async () => {
    const q = new HeavyQueue({ maxConcurrent: 1, maxWaiting: 1, maxWaitMs: 1_000 });
    const r = await q.acquire();
    r(); r();
    assert.equal(q.activeCount, 0);
  });

  it('대기 10건이 차 있으면 11번째 대기는 즉시 거절(full)', async () => {
    const q = new HeavyQueue({ maxConcurrent: 2, maxWaiting: 10, maxWaitMs: 5_000 });
    const held = [await q.acquire(), await q.acquire()];
    const waiters = Array.from({ length: 10 }, () => q.acquire());
    await tick();
    assert.equal(q.waitingCount, 10);
    await assert.rejects(q.acquire(), (e: unknown) => e instanceof QueueRejectedError && e.reason === 'full');
    assert.equal(q.waitingCount, 10);
    // 정리
    held.forEach((r) => r());
    for (const w of waiters) (await w)();
    assert.equal(q.activeCount, 0);
  });

  it('대기 시간이 한도를 넘으면 거절(timeout)하고 대기에서 빠진다', async () => {
    const q = new HeavyQueue({ maxConcurrent: 1, maxWaiting: 10, maxWaitMs: 50 });
    const r1 = await q.acquire();
    await assert.rejects(q.acquire(), (e: unknown) => e instanceof QueueRejectedError && e.reason === 'timeout');
    assert.equal(q.waitingCount, 0);
    r1();
    assert.equal(q.activeCount, 0);
  });

  it('대기 중 연결이 끊기면(abort) 대기에서 빠지고 처리하지 않는다', async () => {
    const q = new HeavyQueue({ maxConcurrent: 1, maxWaiting: 10, maxWaitMs: 5_000 });
    const r1 = await q.acquire();
    const ac = new AbortController();
    const waiting = q.acquire(ac.signal);
    const next = q.acquire();
    await tick();
    assert.equal(q.waitingCount, 2);
    ac.abort();
    await assert.rejects(waiting, (e: unknown) => e instanceof QueueRejectedError && e.reason === 'aborted');
    assert.equal(q.waitingCount, 1);
    r1(); // 끊긴 요청이 아니라 다음 대기자가 슬롯을 받는다
    (await next)();
    assert.equal(q.activeCount, 0);
  });

  it('이미 끊긴 signal로는 슬롯이 비어 있어도 시작하지 않는다', async () => {
    const q = new HeavyQueue({ maxConcurrent: 2, maxWaiting: 10, maxWaitMs: 5_000 });
    const ac = new AbortController();
    ac.abort();
    await assert.rejects(q.acquire(ac.signal), (e: unknown) => e instanceof QueueRejectedError && e.reason === 'aborted');
    assert.equal(q.activeCount, 0);
  });
});

describe('503 응답 — 컨트롤러 통합', () => {
  let server: Server;
  let base = '';
  const releases: Array<() => void> = [];

  before(async () => {
    const rows = await prisma.$queryRaw<{ db: string }[]>`SELECT current_database() AS db`;
    assert.ok(rows[0].db.endsWith('_test'), `연결된 DB가 _test가 아닙니다: ${rows[0].db} — 테스트를 중단합니다.`);
    server = app.listen(0);
    await new Promise<void>((r) => server.once('listening', () => r()));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

    // 전역 대기열을 가득 채운다: 처리 2 + 대기 10.
    for (let i = 0; i < HEAVY_QUEUE_CONFIG.maxConcurrent + HEAVY_QUEUE_CONFIG.maxWaiting; i++) {
      heavyQueue.acquire().then((r) => releases.push(r), () => {});
    }
    await tick();
    assert.equal(heavyQueue.activeCount, HEAVY_QUEUE_CONFIG.maxConcurrent);
    assert.equal(heavyQueue.waitingCount, HEAVY_QUEUE_CONFIG.maxWaiting);
  });

  after(async () => {
    // 슬롯을 차례로 돌려주며 대기자가 모두 풀리게 한다(타이머 정리).
    while (heavyQueue.activeCount > 0 || heavyQueue.waitingCount > 0) {
      const r = releases.shift();
      if (r) r(); else await tick();
    }
    await new Promise<void>((r) => (server ? server.close(() => r()) : r()));
    await prisma.$disconnect();
  });

  const png = () => new Blob([Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])], { type: 'image/png' });

  it('OCR — 대기가 가득 차면 503, 그리고 하루 10회 횟수에서 빠지지 않는다(15번 보내도 429가 아니다)', async () => {
    const token = tokenFor('user');
    for (let i = 0; i < 15; i++) {
      const form = new FormData();
      form.append('photos', png(), 'will.png');
      const res = await fetch(`${base}/api/ocr/recognize`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form });
      const body = (await res.json()) as { message: string };
      assert.equal(res.status, 503, `${i + 1}번째 요청`);
      assert.equal(body.message, '지금 요청이 많습니다. 잠시 후 다시 시도해 주세요.');
    }
  });

  it('STT — 대기가 가득 차면 503 + 대체 입력 안내를 함께 둔다', async () => {
    const token = tokenFor('user');
    const form = new FormData();
    form.append('audio', new Blob([Uint8Array.from([0, 0, 0, 0])], { type: 'audio/mp4' }), 'voice.m4a');
    const res = await fetch(`${base}/api/stt/transcribe`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form });
    const body = (await res.json()) as { message: string };
    assert.equal(res.status, 503);
    assert.ok(body.message.startsWith('지금 요청이 많습니다. 잠시 후 다시 시도해 주세요.'));
    assert.ok(body.message.includes('직접 입력'));
  });
});
