// docs 06-04 §6.4-11-10 — 사진 글자 인식(ocrController)·음성 변환(sttController) 합산 동시 처리 제한.
// "은행 창구 2개": 동시 처리 MAX_CONCURRENT건, 나머지는 도착 순서대로 대기한다.
// 프로세스 내부 대기열이다 — 서버 1대 전제(2대 이상이면 다시 설계).

// 🔴 설정값은 여기 한 곳. 서버 크기가 정해지면 이 세 줄만 고친다.
export const HEAVY_QUEUE_CONFIG = {
  maxConcurrent: 2,
  maxWaiting: 10,
  maxWaitMs: 60_000,
} as const;

export const BUSY_MESSAGE = '지금 요청이 많습니다. 잠시 후 다시 시도해 주세요.';

export type QueueRejectReason = 'full' | 'timeout' | 'aborted';

export class QueueRejectedError extends Error {
  constructor(public readonly reason: QueueRejectReason) {
    super(`heavy queue rejected: ${reason}`);
  }
}

interface Waiter {
  grant: () => void;
  fail: (reason: QueueRejectReason) => void;
}

export class HeavyQueue {
  private active = 0;
  private waiting: Waiter[] = [];

  constructor(private readonly config: { maxConcurrent: number; maxWaiting: number; maxWaitMs: number } = HEAVY_QUEUE_CONFIG) {}

  get activeCount() { return this.active; }
  get waitingCount() { return this.waiting.length; }

  // 슬롯을 얻으면 release 함수를 돌려준다. 대기 한도(건수·시간)를 넘거나 signal이 끊기면
  // QueueRejectedError로 거절 — 이때는 슬롯을 쓰지 않았으므로 호출자는 아무것도 되돌릴 필요가 없다.
  acquire(signal?: AbortSignal): Promise<() => void> {
    if (signal?.aborted) return Promise.reject(new QueueRejectedError('aborted'));

    if (this.active < this.config.maxConcurrent) {
      this.active += 1;
      return Promise.resolve(this.makeRelease());
    }
    if (this.waiting.length >= this.config.maxWaiting) {
      return Promise.reject(new QueueRejectedError('full'));
    }

    return new Promise<() => void>((resolve, reject) => {
      let timer: NodeJS.Timeout | undefined;
      const cleanup = () => {
        if (timer) clearTimeout(timer);
        signal?.removeEventListener('abort', onAbort);
      };
      const waiter: Waiter = {
        // 이 시점에 active는 release()가 이미 넘겨준 슬롯으로 센다(release가 감소시키지 않고 승계).
        grant: () => { cleanup(); resolve(this.makeRelease()); },
        fail: (reason) => { cleanup(); reject(new QueueRejectedError(reason)); },
      };
      const leave = (reason: QueueRejectReason) => {
        const i = this.waiting.indexOf(waiter);
        if (i === -1) return; // 이미 슬롯을 받았다
        this.waiting.splice(i, 1);
        waiter.fail(reason);
      };
      const onAbort = () => leave('aborted');
      timer = setTimeout(() => leave('timeout'), this.config.maxWaitMs);
      signal?.addEventListener('abort', onAbort, { once: true });
      this.waiting.push(waiter);
    });
  }

  private makeRelease() {
    let released = false;
    return () => {
      if (released) return;
      released = true;
      const next = this.waiting.shift();
      if (next) next.grant(); // 슬롯을 그대로 다음 대기자에게 넘긴다(active 유지)
      else this.active -= 1;
    };
  }
}

// 사진 글자 인식 + 음성 변환이 함께 쓰는 단일 대기열.
export const heavyQueue = new HeavyQueue();

// 컨트롤러 공용 — 연결이 끊기면(응답이 끝나기 전에 close) 대기에서 빼도록 AbortSignal을 만든다.
// 🔴 req 'close'는 본문을 다 읽은 뒤에도 발생하므로 res 'close' + writableFinished로 판정한다.
export const abortOnDisconnect = (res: import('http').ServerResponse): AbortSignal => {
  const ac = new AbortController();
  res.once('close', () => { if (!res.writableFinished) ac.abort(); });
  return ac.signal;
};
