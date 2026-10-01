import type { CorsOptions } from 'cors';

// docs 00-42 §10 (10-01 결정) — CORS를 모든 출처 허용(origin: true)에서 허용 목록으로 좁힌다.
// 🔴 이게 막는 것은 "다른 사이트의 브라우저 스크립트가 이 API 응답을 읽는 것"이다. 서버로 요청이 오는 것 자체를 막는 장치는 아니다
//    (curl·서버 간 호출은 Origin 헤더가 없거나 위조 가능) — 그쪽은 rateLimit 몫. 인증은 쿠키가 아니라 Authorization 헤더 토큰이라
//    다른 출처 사이트가 로그인된 사용자의 요청을 대신 보내기도 어렵다(그래서 지금 위험이 작았다).

// 허용 목록 기본값 — CORS_ORIGINS 환경변수가 없을 때만 쓴다.
// 로컬 개발 포트는 Vite 5173(http·https — mkcert 인증서가 있으면 https로 뜬다).
export const DEFAULT_CORS_ORIGINS: readonly string[] = [
  'https://eobom.vercel.app',
  'http://localhost:5173',
  'https://localhost:5173',
  'http://127.0.0.1:5173',
  'https://127.0.0.1:5173',
];

// 비운영(개발·테스트)에서만 추가로 허용하는 사설망 주소 — 폰으로 LAN IP에 접속해 시험하는 흐름(authController.captureFrontendOrigin과 같은 범위).
// 🔴 운영(NODE_ENV=production)에서는 쓰지 않는다 — 운영은 목록만 본다.
const DEV_PORT = '5173';
const isPrivateDevHost = (hostname: string): boolean =>
  /^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/.test(hostname);

// "https://a.com, http://b.com:3000/" → ['https://a.com', 'http://b.com:3000'] — 공백·끝 슬래시·빈 값 제거.
// 비어 있으면 null(→ 기본값을 쓴다). 값이 있으면 기본값을 **대체**한다(합치지 않는다).
export function parseCorsOrigins(raw: string | undefined): string[] | null {
  if (!raw) return null;
  const list = raw
    .split(',')
    .map((s) => s.trim().replace(/\/+$/, ''))
    .filter(Boolean);
  return list.length ? list : null;
}

export type CorsConfig = { origins: readonly string[]; production: boolean };

export const corsConfigFromEnv = (): CorsConfig => ({
  origins: parseCorsOrigins(process.env.CORS_ORIGINS) ?? DEFAULT_CORS_ORIGINS,
  production: process.env.NODE_ENV === 'production',
});

// Origin 헤더가 없는 요청(주소창 이동·curl·서버 간 호출·같은 출처)은 CORS 대상이 아니라 통과시킨다.
export function isAllowedOrigin(origin: string | undefined, config: CorsConfig): boolean {
  if (!origin) return true;
  const normalized = origin.replace(/\/+$/, '');
  if (config.origins.includes(normalized)) return true;
  if (config.production) return false;
  try {
    const url = new URL(normalized);
    return isPrivateDevHost(url.hostname) && url.port === DEV_PORT;
  } catch {
    return false;
  }
}

// 허용되지 않은 출처는 Access-Control-Allow-* 헤더를 주지 않는다(에러로 던지지 않는다 — 던지면 500이 된다). 브라우저가 응답 읽기를 막는다.
// exposedHeaders: 다른 출처의 프론트가 응답의 X-Request-Id를 읽어 "오류 번호"로 보여줄 수 있게 한다(00-42 §5.2 ③).
export function buildCorsOptions(config: CorsConfig = corsConfigFromEnv()): CorsOptions {
  return {
    origin: (origin, callback) => callback(null, isAllowedOrigin(origin, config)),
    credentials: true,
    exposedHeaders: ['X-Request-Id'],
  };
}
