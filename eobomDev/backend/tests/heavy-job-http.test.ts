// docs 06-04 §6.4-11-10 — 시간 제한·이유 구분·횟수 되돌림·연결 끊김·음성 길이 상한(HTTP 통합).
// CLOVA는 이 파일 안의 가짜 서버로 대신한다 — 실호출·요금 없음.
// 🔴 첫 줄 import는 testEnv여야 한다(전용 테스트 DB 가드).
import './helpers/testEnv';
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import sharp from 'sharp';
import app from '../src/app';
import prisma from '../src/config/prisma';
import { heavyQueue } from '../src/services/heavyQueue';
import { heavyJobRuntime } from '../src/services/heavyJob';
import { tokenFor } from './helpers/tokens';

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

describe('사진·음성 처리 시간 제한 — HTTP', () => {
  const startedAt = new Date(); // 건별 기록 확인 범위(이 시각 이후 기록만 본다)
  let server: Server;
  let base = '';
  let clova: Server;
  let png: Buffer;
  let mode: 'slow' | 'error' = 'slow';
  let clovaAborted = 0;
  const originalDeadline = { ...heavyJobRuntime.deadlineMs };

  before(async () => {
    const rows = await prisma.$queryRaw<{ db: string }[]>`SELECT current_database() AS db`;
    assert.ok(rows[0].db.endsWith('_test'), `연결된 DB가 _test가 아닙니다: ${rows[0].db} — 테스트를 중단합니다.`);

    clova = http.createServer((req, res) => {
      req.resume();
      res.on('close', () => { if (!res.writableFinished) clovaAborted += 1; });
      if (mode === 'error') {
        res.statusCode = 500;
        res.end('boom');
        return;
      }
      setTimeout(() => {
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ images: [{ inferResult: 'SUCCESS', fields: [{ inferText: '유언장', lineBreak: true, boundingPoly: { vertices: [{ x: 1, y: 1 }, { x: 9, y: 1 }, { x: 9, y: 9 }, { x: 1, y: 9 }] } }] }] }));
      }, 3_000);
    });
    await new Promise<void>((r) => clova.listen(0, '127.0.0.1', () => r()));
    process.env.CLOVA_OCR_INVOKE_URL = `http://127.0.0.1:${(clova.address() as AddressInfo).port}/general`;
    process.env.CLOVA_OCR_SECRET = 'test-only-secret';

    server = app.listen(0);
    await new Promise<void>((r) => server.once('listening', () => r()));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    png = await sharp({ create: { width: 120, height: 120, channels: 3, background: '#ffffff' } }).png().toBuffer();
  });

  after(async () => {
    Object.assign(heavyJobRuntime.deadlineMs, originalDeadline);
    clova.closeAllConnections?.();
    await new Promise<void>((r) => clova.close(() => r()));
    await new Promise<void>((r) => (server ? server.close(() => r()) : r()));
    await prisma.$disconnect();
  });

  const postPhoto = async (opts: { signal?: AbortSignal } = {}) => {
    const form = new FormData();
    form.append('photos', new Blob([new Uint8Array(png)], { type: 'image/png' }), 'will.png');
    const res = await fetch(`${base}/api/ocr/recognize`, { method: 'POST', headers: { Authorization: `Bearer ${tokenFor('user')}` }, body: form, signal: opts.signal });
    return { status: res.status, body: (await res.json()) as { code?: string; message: string } };
  };

  it('②처리 마감 — 사진은 504 + SLOW 문구, 외부 호출도 멈춘다. 하루 횟수(10회)는 되돌려져 11번 해도 429가 아니다', async () => {
    mode = 'slow';
    heavyJobRuntime.deadlineMs.photo = 250;
    clovaAborted = 0;
    for (let i = 0; i < 11; i++) {
      const r = await postPhoto();
      assert.equal(r.status, 504, `${i + 1}번째`);
      assert.equal(r.body.code, 'SLOW');
      assert.equal(r.body.message, '사진 인식이 오래 걸려 중단했습니다. 잠시 후 다시 시도해 주세요.');
    }
    assert.equal(heavyQueue.activeCount, 0);
    await sleep(100);
    assert.ok(clovaAborted >= 10, `CLOVA 호출이 멈췄어야 한다(${clovaAborted})`);
  });

  it('③연결·오류 — CLOVA가 오류를 돌려주면 502 + UPSTREAM 문구, 횟수는 되돌려진다', async () => {
    mode = 'error';
    heavyJobRuntime.deadlineMs.photo = 5_000;
    for (let i = 0; i < 11; i++) {
      const r = await postPhoto();
      assert.equal(r.status, 502, `${i + 1}번째`);
      assert.equal(r.body.code, 'UPSTREAM');
      assert.equal(r.body.message, '인식 서비스에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    }
    assert.equal(heavyQueue.activeCount, 0);
  });

  it('연결 끊김 — 화면이 먼저 끊으면 CLOVA 호출을 멈추고 창구를 반납한다', async () => {
    mode = 'slow';
    heavyJobRuntime.deadlineMs.photo = 5_000;
    clovaAborted = 0;
    const ac = new AbortController();
    const pending = postPhoto({ signal: ac.signal }).catch(() => null);
    await sleep(400);
    assert.equal(heavyQueue.activeCount, 1);
    ac.abort();
    await pending;
    for (let i = 0; i < 20 && (heavyQueue.activeCount > 0 || clovaAborted === 0); i++) await sleep(50);
    assert.equal(heavyQueue.activeCount, 0, '창구 반납');
    assert.equal(clovaAborted, 1, 'CLOVA 호출 중단');
  });

  it('음성 길이 상한 — 10분을 넘는 m4a는 대기열 앞에서 400, 문구 한 줄', async () => {
    const u32 = (n: number) => { const b = Buffer.alloc(4); b.writeUInt32BE(n); return b; };
    const box = (type: string, ...parts: Buffer[]) => { const body = Buffer.concat(parts); return Buffer.concat([u32(8 + body.length), Buffer.from(type, 'latin1'), body]); };
    const mvhd = box('mvhd', Buffer.alloc(4), u32(0), u32(0), u32(1000), u32(601 * 1000), Buffer.alloc(80));
    const m4a = Buffer.concat([box('ftyp', Buffer.from('M4A \0\0\0\0M4A isom', 'latin1')), box('mdat', Buffer.alloc(1000)), box('moov', mvhd)]);
    const form = new FormData();
    form.append('audio', new Blob([new Uint8Array(m4a)], { type: 'audio/mp4' }), 'long.m4a');
    const res = await fetch(`${base}/api/stt/transcribe`, { method: 'POST', headers: { Authorization: `Bearer ${tokenFor('user')}` }, body: form });
    assert.equal(res.status, 400);
    assert.equal(((await res.json()) as { message: string }).message, '10분 이하 녹음만 올릴 수 있습니다.');
    assert.equal(heavyQueue.activeCount, 0);
    // 입구 검사(400)는 대기열에 들어가지 않으므로 처리 결과 기록도 남기지 않는다
    assert.equal(await prisma.heavyJobLog.count({ where: { kind: 'audio', createdAt: { gte: startedAt } } }), 0);
  });

  it('건별 기록(06-04 §6.4-11-10-1) — 위 시험의 시간 초과·오류·화면 이탈이 DB에 종류·결과·시간만 남는다', async () => {
    // 기록은 응답 뒤에 쓰이는 fire-and-forget이라 잠깐 기다린다
    for (let i = 0; i < 40; i++) {
      if ((await prisma.heavyJobLog.count({ where: { createdAt: { gte: startedAt } } })) >= 23) break;
      await sleep(50);
    }
    const rows = await prisma.heavyJobLog.findMany({ where: { createdAt: { gte: startedAt } } });
    const n = (result: string) => rows.filter((r) => r.kind === 'photo' && r.result === result).length;
    assert.equal(n('slow'), 11, '②시간 초과 11건');
    assert.equal(n('error'), 11, '③오류 11건');
    assert.ok(n('aborted') >= 1, '화면 이탈');
    for (const r of rows) {
      assert.equal(r.audioSec, null, '사진은 음성 길이가 없다');
      assert.ok(r.waitMs >= 0);
    }
    for (const r of rows.filter((x) => x.result === 'slow')) {
      assert.ok(r.workMs !== null && r.workMs >= 200, `처리 시간이 마감(250ms)에 가까워야 한다: ${r.workMs}`);
    }
    // 기록 칸은 이것뿐이다 — 파일·인식 텍스트·이름·사용자 ID 칸이 없다
    assert.deepEqual(Object.keys(rows[0]).sort(), ['audioSec', 'createdAt', 'createdAtKst', 'id', 'kind', 'result', 'waitMs', 'workMs']);
    await prisma.heavyJobLog.deleteMany({ where: { id: { in: rows.map((r) => r.id) } } });
  });
});
