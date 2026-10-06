// 00-34 §5·§6 — 프론트엔드 공통 HTTP 요청 레이어(2층).
// URL 조립 + Authorization 헤더 + 토큰 + 응답 봉투 해석 + 401 세션만료 처리를 한 함수로 닫는다.
// ❌ axios·TanStack Query 도입하지 않는다(§7) — fetch 래퍼 함수 하나로 충분하다.

import { BACKEND_URL } from '../config';
import { getToken, type Audience } from './storage';

const SESSION_EXPIRED_MESSAGE = '세션이 만료되어 로그아웃되었습니다. 다시 로그인해주세요.';

// §6 — apiFetch는 라이브러리 함수라 화면 전환을 직접 하지 않는다. 계정군별로 App.tsx 등이
// 마운트 시 콜백을 등록해두면, 401을 받았을 때 그 콜백만 호출한다(window 커스텀 이벤트·전역
// 상태 라이브러리 대신 채택된 방식, §6 표).
const sessionExpiredHandlers: Partial<Record<Audience, (message: string) => void>> = {};

export function registerSessionExpiredHandler(audience: Audience, handler: (message: string) => void): void {
  sessionExpiredHandlers[audience] = handler;
}

// 00-42 §5.2 ③ — 5xx일 때만 서버가 기록한 요청 번호(X-Request-Id)를 담는다. 4xx에는 붙이지 않는다.
// 🔴 message 끝에 "\n오류 번호: …" 한 줄을 붙여 둔다 — 오류 문구를 보여 주는 곳(30여 곳, alert 포함)을 화면마다
//    고치지 않고도 번호가 따라 나오게 하려는 공통 처리다. 번호 없이 문구만 쓰려면 baseMessage를 읽는다.
export class ApiError extends Error {
  readonly status: number;
  readonly requestId: string | null;
  readonly baseMessage: string;
  // 서버가 이유를 구분해 주는 응답의 code(사진·음성 처리: BUSY·SLOW·UPSTREAM). 없으면 null.
  readonly code: string | null;
  constructor(message: string, status = 0, requestId: string | null = null, code: string | null = null) {
    super(requestId ? `${message}\n오류 번호: ${requestId}` : message);
    this.status = status;
    this.requestId = requestId;
    this.baseMessage = message;
    this.code = code;
  }
}

interface Envelope<T> {
  status: 'success' | 'error';
  data: T;
  message?: string;
  requestId?: string | null;
}

const SERVER_ERROR_MESSAGE = '요청 처리 중 오류가 발생했습니다.';

const requestIdOf = (res: Response, body?: { requestId?: string | null } | null): string | null =>
  res.headers.get('X-Request-Id') || (typeof body?.requestId === 'string' ? body.requestId : null);

// §5.2 — USER/ADMIN/PARTNER 3종 + 비인증(audience 생략, 토큰만 안 붙는다). 인증/비인증으로
// 함수를 쪼개지 않는다 — 어느 걸 쓸지 매번 판단하게 되면 결국 다시 직접 fetch를 쓰게 된다.
async function rawFetch(path: string, audience: Audience | undefined, options: RequestInit): Promise<Response> {
  const token = audience ? getToken(audience) : null;
  const hasBody = options.body !== undefined && !(options.body instanceof FormData);
  const headers: HeadersInit = {
    ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${BACKEND_URL}${path}`, { ...options, headers });

  if (res.status === 401 && audience) {
    sessionExpiredHandlers[audience]?.(SESSION_EXPIRED_MESSAGE);
  }
  return res;
}

// §5.3 — 백엔드 공통 봉투({status,data,message})를 풀어서 반환한다. status !== 'success'면
// message를 담은 오류로 던진다 — 호출부에서 반복하던 판정(55곳)이 사라진다.
export async function apiFetch<T = any>(path: string, audience?: Audience, options: RequestInit = {}): Promise<T> {
  const res = await rawFetch(path, audience, options);
  const isServerError = res.status >= 500;
  let data: Envelope<T>;
  try {
    data = await res.json();
  } catch {
    // 게이트웨이(502·504 등)가 JSON이 아닌 본문을 돌려준 경우 — 5xx면 번호가 있을 때만 붙여 ApiError로 통일한다.
    if (isServerError) throw new ApiError(SERVER_ERROR_MESSAGE, res.status, requestIdOf(res));
    throw new ApiError(SERVER_ERROR_MESSAGE, res.status);
  }
  if (data.status !== 'success') {
    throw new ApiError(data.message || SERVER_ERROR_MESSAGE, res.status, isServerError ? requestIdOf(res, data) : null);
  }
  return data.data;
}

// 06-04 §6.4-11-10 — 사진·음성 업로드. fetch는 "업로드가 끝난 때"를 알 수 없어 XMLHttpRequest로 보낸다:
// 화면 마감(사진 65초·음성 125초)은 업로드가 끝난 뒤부터 센다. 마감을 넘기면 요청을 끊고 timeoutMessage로 던진다.
// signal로 닫기(처음부터 다시)를 받는다 — 끊으면 code 'ABORTED'로 던지니 호출부가 조용히 넘긴다.
export function apiUploadForm<T = any>(
  path: string,
  audience: Audience,
  formData: FormData,
  opts: {
    deadlineMs: number;
    timeoutMessage: string;
    networkMessage: string;
    onUploaded?: () => void;
    signal?: AbortSignal;
  },
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${BACKEND_URL}${path}`);
    const token = getToken(audience);
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    let timer: ReturnType<typeof setTimeout> | undefined;
    let settled = false;
    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      opts.signal?.removeEventListener('abort', onAbort);
      fn();
    };
    const onAbort = () => {
      xhr.abort();
      finish(() => reject(new ApiError('요청을 취소했습니다.', 0, null, 'ABORTED')));
    };
    if (opts.signal?.aborted) {
      reject(new ApiError('요청을 취소했습니다.', 0, null, 'ABORTED'));
      return;
    }
    opts.signal?.addEventListener('abort', onAbort, { once: true });

    xhr.upload.onload = () => {
      opts.onUploaded?.();
      timer = setTimeout(() => {
        xhr.abort();
        finish(() => reject(new ApiError(opts.timeoutMessage, 0, null, 'SLOW')));
      }, opts.deadlineMs);
    };
    xhr.onerror = () => finish(() => reject(new ApiError(opts.networkMessage, 0, null, 'UPSTREAM')));
    xhr.onload = () => finish(() => {
      if (xhr.status === 401) sessionExpiredHandlers[audience]?.(SESSION_EXPIRED_MESSAGE);
      const isServerError = xhr.status >= 500;
      let data: (Envelope<T> & { code?: string }) | null = null;
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        data = null;
      }
      if (!data) {
        reject(new ApiError(SERVER_ERROR_MESSAGE, xhr.status, isServerError ? xhr.getResponseHeader('X-Request-Id') : null));
        return;
      }
      if (data.status !== 'success') {
        const requestId = isServerError ? (xhr.getResponseHeader('X-Request-Id') || (typeof data.requestId === 'string' ? data.requestId : null)) : null;
        reject(new ApiError(data.message || SERVER_ERROR_MESSAGE, xhr.status, requestId, typeof data.code === 'string' ? data.code : null));
        return;
      }
      resolve(data.data);
    });
    xhr.send(formData);
  });
}

// §5.3 예외 — 파일 다운로드 등 봉투가 아닌 응답은 원본 Response를 그대로 받는다.
export async function apiFetchRaw(path: string, audience?: Audience, options: RequestInit = {}): Promise<Response> {
  return rawFetch(path, audience, options);
}
