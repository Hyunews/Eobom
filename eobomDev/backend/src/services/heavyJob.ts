import type { Response } from 'express';
import { heavyQueue, HEAVY_QUEUE_CONFIG, QueueRejectedError, BUSY_MESSAGE } from './heavyQueue';
import type { HeavyKind, HeavyQueue } from './heavyQueue';

// docs 06-04 §6.4-11-10 "대기 상한·즉시 알림·시간 제한" — 사진 글자 인식·음성 변환이 함께 쓰는 한 건 처리 틀.
// 업로드를 다 받은 때부터 마감(사진 55초·음성 115초, 대기 + CLOVA 처리 합계)을 재고, 어디서 멈췄는지에 따라
// 이유를 구분해 돌려준다: ① 대기(busy) · ② 처리(slow) · ③ 연결·오류(error). 연결이 끊기면 처리 중이던 외부 호출도
// 멈추고 창구를 반납한다(work가 받은 signal을 fetch·ffmpeg에 넘기는 것은 work의 몫).

// CLOVA가 정상 응답했지만 글자·내용이 비어 있는 경우 — 연결 실패(③)가 아니다.
export class NoRecognizedTextError extends Error {}

export type HeavyJobResult<T> =
  | { ok: true; value: T }
  | { ok: false; reason: 'busy' }
  | { ok: false; reason: 'slow' }
  | { ok: false; reason: 'aborted' }
  | { ok: false; reason: 'error'; error: unknown };

type CloseEmitter = Pick<Response, 'once' | 'off' | 'writableFinished'>;

const STOPPED = Symbol('stopped');

// 서버 마감 시간(ms). 기본은 설정 한 곳(HEAVY_QUEUE_CONFIG)이고, 통합 시험이 짧게 바꿔 쓴다 — 운영 코드는 건드리지 않는다.
export const heavyJobRuntime = { deadlineMs: { ...HEAVY_QUEUE_CONFIG.deadlineMs } };

export const runHeavyJob = async <T>(
  res: CloseEmitter,
  kind: HeavyKind,
  work: (signal: AbortSignal) => Promise<T>,
  opts: { deadlineMs?: number; queue?: HeavyQueue } = {},
): Promise<HeavyJobResult<T>> => {
  const queue = opts.queue ?? heavyQueue;
  const ac = new AbortController();
  let timedOut = false;
  let disconnected = false;

  const timer = setTimeout(() => { timedOut = true; ac.abort(); }, opts.deadlineMs ?? heavyJobRuntime.deadlineMs[kind]);
  // 🔴 req 'close'는 본문을 다 읽은 뒤에도 발생하므로 res 'close' + writableFinished로 판정한다.
  const onClose = () => { if (!res.writableFinished) { disconnected = true; ac.abort(); } };
  res.once('close', onClose);

  try {
    let release: (ok?: boolean) => void;
    try {
      release = await queue.acquire(ac.signal, kind);
    } catch (queueError) {
      if (disconnected) return { ok: false, reason: 'aborted' };
      if (queueError instanceof QueueRejectedError && queueError.reason === 'aborted' && !timedOut) return { ok: false, reason: 'aborted' };
      return { ok: false, reason: 'busy' }; // 대기 10건 · 예상 대기 초과(즉시) · 대기 30초 · 마감이 대기 중에 옴 → ①
    }

    const job = (async () => work(ac.signal))();
    job.catch(() => {}); // 마감 뒤 늦게 실패해도 미처리 거절로 남기지 않는다
    const stopped = new Promise<never>((_, reject) => {
      if (ac.signal.aborted) reject(STOPPED);
      else ac.signal.addEventListener('abort', () => reject(STOPPED), { once: true });
    });
    stopped.catch(() => {});

    try {
      const value = await Promise.race([job, stopped]);
      release(true);
      return { ok: true, value };
    } catch (error) {
      release(false); // 창구 반납 — 늦게 끝나는 작업이 있어도 기다리지 않는다
      if (disconnected) return { ok: false, reason: 'aborted' };
      if (timedOut) return { ok: false, reason: 'slow' };
      return { ok: false, reason: 'error', error };
    }
  } finally {
    clearTimeout(timer);
    res.off('close', onClose);
  }
};

// ── 이유별 응답(스펙 문구 그대로) ──
const AUDIO_FALLBACK = '직접 녹음이나 아래 입력창에 직접 입력해 이어서 작성해 주세요.';

export type HeavyFailureCode = 'BUSY' | 'SLOW' | 'UPSTREAM';

export const heavyFailureResponse = (
  kind: HeavyKind,
  reason: 'busy' | 'slow' | 'upstream',
): { status: number; body: { status: 'error'; code: HeavyFailureCode; message: string } } => {
  if (reason === 'busy') {
    return {
      status: 503,
      body: { status: 'error', code: 'BUSY', message: kind === 'audio' ? `${BUSY_MESSAGE} ${AUDIO_FALLBACK}` : BUSY_MESSAGE },
    };
  }
  if (reason === 'slow') {
    return {
      status: 504,
      body: {
        status: 'error',
        code: 'SLOW',
        message: kind === 'audio'
          ? '음성 변환이 오래 걸려 중단했습니다. 녹음을 나눠 올리거나 직접 입력해 주세요.' // 🔴 "다시 시도"를 쓰지 않는다
          : '사진 인식이 오래 걸려 중단했습니다. 잠시 후 다시 시도해 주세요.',
      },
    };
  }
  const base = '인식 서비스에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.';
  return { status: 502, body: { status: 'error', code: 'UPSTREAM', message: kind === 'audio' ? `${base} ${AUDIO_FALLBACK}` : base } };
};
