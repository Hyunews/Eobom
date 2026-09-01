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

export class ApiError extends Error {}

interface Envelope<T> {
  status: 'success' | 'error';
  data: T;
  message?: string;
}

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
  const data: Envelope<T> = await res.json();
  if (data.status !== 'success') {
    throw new ApiError(data.message || '요청 처리 중 오류가 발생했습니다.');
  }
  return data.data;
}

// §5.3 예외 — 파일 다운로드 등 봉투가 아닌 응답은 원본 Response를 그대로 받는다.
export async function apiFetchRaw(path: string, audience?: Audience, options: RequestInit = {}): Promise<Response> {
  return rawFetch(path, audience, options);
}
