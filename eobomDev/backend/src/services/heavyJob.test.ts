import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { HeavyQueue, HEAVY_QUEUE_CONFIG, QueueRejectedError } from './heavyQueue';
import { runHeavyJob, heavyFailureResponse } from './heavyJob';
import { getAudioDurationSec } from './audioDuration';

// docs 06-04 §6.4-11-10 — 단계별 마감·이유 구분·abort·즉시 거절·음성 길이. 외부 호출 없이 돈다.

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// 응답 객체 대역 — close 이벤트와 writableFinished만 쓴다.
const fakeRes = () => {
  const em = new EventEmitter() as EventEmitter & { writableFinished: boolean };
  em.writableFinished = false;
  return em;
};

const newQueue = (over: Partial<ConstructorParameters<typeof HeavyQueue>[0]> = {}) =>
  new HeavyQueue({ maxConcurrent: 1, maxWaiting: 10, maxWaitMs: 5_000, ...over });

// ── 마감: 어디서 멈췄는지에 따라 ①대기 ②처리 ──
test('마감 — 대기 중에 넘기면 busy(①), 슬롯은 쓰지 않는다', async () => {
  const q = newQueue();
  const hold = await q.acquire();
  const r = await runHeavyJob(fakeRes(), 'photo', async () => 'never', { queue: q, deadlineMs: 40 });
  assert.deepEqual(r, { ok: false, reason: 'busy' });
  assert.equal(q.waitingCount, 0);
  hold();
  assert.equal(q.activeCount, 0);
});

test('마감 — 처리 중에 넘기면 slow(②): 외부 호출에 abort가 가고 창구를 바로 돌려준다', async () => {
  const q = newQueue();
  let sawAbort = false;
  const r = await runHeavyJob(fakeRes(), 'photo', (signal) => new Promise<string>((_, reject) => {
    signal.addEventListener('abort', () => { sawAbort = true; reject(new Error('aborted')); });
  }), { queue: q, deadlineMs: 40 });
  assert.deepEqual(r, { ok: false, reason: 'slow' });
  assert.equal(sawAbort, true);
  assert.equal(q.activeCount, 0);
});

test('마감 — 작업이 abort를 무시하고 계속 돌아도 마감 시각에 slow로 끝나고 창구를 반납한다', async () => {
  const q = newQueue();
  const r = await runHeavyJob(fakeRes(), 'audio', async () => { await sleep(300); return 'late'; }, { queue: q, deadlineMs: 40 });
  assert.deepEqual(r, { ok: false, reason: 'slow' });
  assert.equal(q.activeCount, 0);
  await sleep(350); // 늦게 끝난 작업이 미처리 거절·상태 오염을 만들지 않는다
  assert.equal(q.activeCount, 0);
});

test('성공 — 값을 돌려주고 창구를 반납한다', async () => {
  const q = newQueue();
  const r = await runHeavyJob(fakeRes(), 'photo', async () => 42, { queue: q, deadlineMs: 1_000 });
  assert.deepEqual(r, { ok: true, value: 42 });
  assert.equal(q.activeCount, 0);
});

test('오류 — 작업이 던진 오류는 error(③)로 구분한다', async () => {
  const q = newQueue();
  const boom = new Error('CLOVA 500');
  const r = await runHeavyJob(fakeRes(), 'photo', async () => { throw boom; }, { queue: q, deadlineMs: 1_000 });
  assert.equal(r.ok, false);
  assert.equal(r.ok === false && r.reason, 'error');
  assert.equal(r.ok === false && r.reason === 'error' && r.error, boom);
  assert.equal(q.activeCount, 0);
});

// ── 연결 끊김 ──
test('연결 끊김 — 처리 중이면 외부 호출을 멈추고 창구를 반납한다(aborted)', async () => {
  const q = newQueue();
  const res = fakeRes();
  let sawAbort = false;
  const p = runHeavyJob(res, 'photo', (signal) => new Promise<string>((_, reject) => {
    signal.addEventListener('abort', () => { sawAbort = true; reject(new Error('aborted')); });
  }), { queue: q, deadlineMs: 5_000 });
  await sleep(20);
  assert.equal(q.activeCount, 1);
  res.emit('close');
  assert.deepEqual(await p, { ok: false, reason: 'aborted' });
  assert.equal(sawAbort, true);
  assert.equal(q.activeCount, 0);
});

test('연결 끊김 — 대기 중이면 대기에서 빠지고 처리하지 않는다', async () => {
  const q = newQueue();
  const hold = await q.acquire();
  const res = fakeRes();
  let ran = false;
  const p = runHeavyJob(res, 'photo', async () => { ran = true; }, { queue: q, deadlineMs: 5_000 });
  await sleep(20);
  assert.equal(q.waitingCount, 1);
  res.emit('close');
  assert.deepEqual(await p, { ok: false, reason: 'aborted' });
  assert.equal(q.waitingCount, 0);
  assert.equal(ran, false);
  hold();
});

test('응답을 다 보낸 뒤의 close는 끊김이 아니다', async () => {
  const q = newQueue();
  const res = fakeRes();
  const r = await runHeavyJob(res, 'photo', async () => { res.writableFinished = true; res.emit('close'); return 'done'; }, { queue: q, deadlineMs: 1_000 });
  assert.deepEqual(r, { ok: true, value: 'done' });
});

// ── 즉시 알림: 예상 대기 = 앞 대기 건수 × 최근 처리 시간 평균 > 30초 ──
const crowdedQueue = () => new HeavyQueue({ maxConcurrent: 1, maxWaiting: 10, maxWaitMs: 5_000, instantWaitMs: 30_000, defaultJobMs: { photo: 10_000, audio: 30_000 } });

test('즉시 알림 — 기록이 없을 때 사진은 건당 10초: 앞 대기 3건(30초)은 기다리고 4건(40초)이면 바로 거절', async () => {
  const q = crowdedQueue();
  const hold = await q.acquire(undefined, 'photo');
  const waiters = [0, 1, 2].map(() => q.acquire(undefined, 'photo').catch(() => {}));
  await sleep(5);
  assert.equal(q.waitingCount, 3);
  const fourth = q.acquire(undefined, 'photo').catch(() => {}); // 앞 3건 × 10초 = 30초 — 넘지 않아 대기
  await sleep(5);
  assert.equal(q.waitingCount, 4);
  await assert.rejects(q.acquire(undefined, 'photo'), (e: unknown) => e instanceof QueueRejectedError && e.reason === 'crowded'); // 4 × 10 = 40초
  hold();
  void waiters; void fourth;
});

test('즉시 알림 — 음성은 건당 30초: 앞 대기 1건은 기다리고 2건이면 바로 거절', async () => {
  const q = crowdedQueue();
  await q.acquire(undefined, 'audio');
  q.acquire(undefined, 'audio').catch(() => {});
  await sleep(5);
  assert.equal(q.waitingCount, 1); // 1 × 30 = 30초 — 넘지 않음
  q.acquire(undefined, 'audio').catch(() => {});
  await sleep(5);
  assert.equal(q.waitingCount, 2);
  await assert.rejects(q.acquire(undefined, 'audio'), (e: unknown) => e instanceof QueueRejectedError && e.reason === 'crowded'); // 2 × 30 = 60초
});

test('즉시 알림 — 최근 처리 시간 평균을 쓴다(빠르면 더 많이 기다려도 된다)', async () => {
  const q = crowdedQueue();
  for (let i = 0; i < 3; i++) { // 사진 3건을 거의 0초에 처리 → 평균 ≈ 0
    const r = await q.acquire(undefined, 'photo');
    r();
  }
  assert.ok(q.averageJobMs('photo') < 100);
  const hold = await q.acquire(undefined, 'photo');
  for (let i = 0; i < 8; i++) q.acquire(undefined, 'photo').catch(() => {});
  await sleep(5);
  assert.equal(q.waitingCount, 8); // 예상 대기 ≈ 0초라 거절되지 않는다
  hold();
});

test('즉시 알림 — 실패한 건(release(false))은 평균에 넣지 않는다', async () => {
  const q = crowdedQueue();
  const r = await q.acquire(undefined, 'photo');
  r(false);
  assert.equal(q.averageJobMs('photo'), HEAVY_QUEUE_CONFIG.defaultJobMs.photo);
});

test('즉시 알림 — 대기 10건이 가득 차면 종류와 관계없이 바로 거절(full)', async () => {
  const q = new HeavyQueue({ maxConcurrent: 1, maxWaiting: 2, maxWaitMs: 5_000, instantWaitMs: 1_000_000 });
  await q.acquire(undefined, 'photo');
  q.acquire(undefined, 'photo').catch(() => {});
  q.acquire(undefined, 'photo').catch(() => {});
  await sleep(5);
  await assert.rejects(q.acquire(undefined, 'photo'), (e: unknown) => e instanceof QueueRejectedError && e.reason === 'full');
});

test('즉시 알림 — runHeavyJob은 crowded도 busy(①)로 돌려준다', async () => {
  const q = crowdedQueue();
  await q.acquire(undefined, 'audio');
  q.acquire(undefined, 'audio').catch(() => {});
  q.acquire(undefined, 'audio').catch(() => {});
  await sleep(5);
  const t0 = Date.now();
  const r = await runHeavyJob(fakeRes(), 'audio', async () => 'x', { queue: q, deadlineMs: 5_000 });
  assert.deepEqual(r, { ok: false, reason: 'busy' });
  assert.ok(Date.now() - t0 < 200, '기다리지 않고 바로 돌려준다');
});

// ── 이유별 응답 문구(스펙 그대로) ──
test('응답 문구 — ① ② ③ 사진·음성', () => {
  assert.deepEqual(heavyFailureResponse('photo', 'busy'), { status: 503, body: { status: 'error', code: 'BUSY', message: '지금 요청이 많습니다. 잠시 후 다시 시도해 주세요.' } });
  assert.equal(heavyFailureResponse('photo', 'slow').body.message, '사진 인식이 오래 걸려 중단했습니다. 잠시 후 다시 시도해 주세요.');
  assert.equal(heavyFailureResponse('photo', 'upstream').body.message, '인식 서비스에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.');
  assert.ok(heavyFailureResponse('audio', 'busy').body.message.startsWith('지금 요청이 많습니다. 잠시 후 다시 시도해 주세요.'));
  assert.ok(heavyFailureResponse('audio', 'busy').body.message.includes('직접 입력'));
  const slow = heavyFailureResponse('audio', 'slow');
  assert.equal(slow.body.message, '음성 변환이 오래 걸려 중단했습니다. 녹음을 나눠 올리거나 직접 입력해 주세요.');
  assert.ok(!slow.body.message.includes('다시 시도'), '음성 ②는 "다시 시도"를 쓰지 않는다');
  assert.ok(heavyFailureResponse('audio', 'upstream').body.message.includes('직접 입력'));
  assert.deepEqual([503, 504, 502], [heavyFailureResponse('photo', 'busy').status, slow.status, heavyFailureResponse('photo', 'upstream').status]);
});

// ── 음성 길이 읽기(ffprobe 없이 컨테이너 머리말만) ──
const u32 = (n: number) => { const b = Buffer.alloc(4); b.writeUInt32BE(n); return b; };
const box = (type: string, ...parts: Buffer[]) => { const body = Buffer.concat(parts); return Buffer.concat([u32(8 + body.length), Buffer.from(type, 'latin1'), body]); };

const mp4WithDuration = (seconds: number, moovFirst: boolean) => {
  const timescale = 1000;
  const mvhd = box('mvhd', Buffer.alloc(4), u32(0), u32(0), u32(timescale), u32(seconds * timescale), Buffer.alloc(80));
  const ftyp = box('ftyp', Buffer.from('M4A \0\0\0\0M4A isom', 'latin1'));
  const moov = box('moov', mvhd);
  const mdat = box('mdat', Buffer.alloc(2000));
  return Buffer.concat(moovFirst ? [ftyp, moov, mdat] : [ftyp, mdat, moov]);
};

test('길이 — m4a: moov가 앞이든 파일 끝이든 mvhd에서 읽는다', () => {
  assert.equal(getAudioDurationSec(mp4WithDuration(700, true)), 700);
  assert.equal(getAudioDurationSec(mp4WithDuration(95, false)), 95);
});

test('길이 — wav: 바이트율과 데이터 크기로 읽는다', () => {
  const byteRate = 32000; // 16kHz · 16bit · 모노
  const data = Buffer.alloc(byteRate * 12);
  const fmt = Buffer.alloc(16);
  fmt.writeUInt16LE(1, 0); fmt.writeUInt16LE(1, 2); fmt.writeUInt32LE(16000, 4); fmt.writeUInt32LE(byteRate, 8);
  const head = Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WAVE'), Buffer.from('fmt '), Buffer.from([16, 0, 0, 0]), fmt, Buffer.from('data'), Buffer.from([0, 0, 0, 0])]);
  head.writeUInt32LE(data.length, head.length - 4);
  assert.equal(getAudioDurationSec(Buffer.concat([head, data])), 12);
});

test('길이 — mp3(CBR 128kbps): 파일 크기와 비트레이트로 어림한다', () => {
  // MPEG1 Layer III · 128kbps · 44.1kHz · 스테레오 프레임 머리말 FF FB 90 00
  const frame = Buffer.from([0xff, 0xfb, 0x90, 0x00]);
  const bytesPerSecond = 128000 / 8;
  const body = Buffer.alloc(bytesPerSecond * 60 - frame.length);
  const sec = getAudioDurationSec(Buffer.concat([frame, body]));
  assert.ok(sec !== null && Math.abs(sec - 60) < 0.5, String(sec));
});

test('길이 — 못 읽는 파일(webm·깨진 파일·너무 짧음)은 null: 호출자는 통과시킨다', () => {
  assert.equal(getAudioDurationSec(Buffer.from([0x1a, 0x45, 0xdf, 0xa3, ...new Array(64).fill(0)])), null);
  assert.equal(getAudioDurationSec(Buffer.alloc(100)), null);
  assert.equal(getAudioDurationSec(Buffer.alloc(4)), null);
});
