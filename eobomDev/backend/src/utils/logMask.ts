// 00-42 §4.9·§5.2 — 운영 기록에 담는 문자열을 정리하는 순수 함수들(DB·env를 건드리지 않는다).
// 🔴 기록의 기본 방식은 "남길 칸만 골라 담기"다. 이 파일은 그래도 문자열 칸(에러 메시지)에 섞여 들어올 수 있는
//    식별 정보를 마지막으로 한 번 더 걸러내는 보조 장치이지, 이것만 믿고 본문을 담으라는 뜻이 아니다.

const MESSAGE_MAX = 200;
const STACK_LINES = 5;

// 경로에서 쿼리 문자열(?…)과 해시(#…)를 지운다. `/api/geo/reverse?lat=..&lng=..` → `/api/geo/reverse`.
// 경로 안의 id(`/memorials/:id`)는 남긴다.
export function stripQuery(url: string | undefined): string {
  if (!url) return '';
  const cut = url.search(/[?#]/);
  return cut === -1 ? url : url.slice(0, cut);
}

// 에러 메시지에서 식별 정보를 지운다. 순서가 중요하다 — 긴 패턴(토큰·이메일)을 먼저, 숫자열을 나중에.
export function maskText(input: string): string {
  return input
    .replace(/eyJ[\w-]+\.[\w-]+\.[\w-]+/g, '[token]') // JWT
    .replace(/\bBearer\s+\S+/gi, 'Bearer [token]')
    .replace(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, '[email]')
    .replace(/\b0\d{1,2}[-\s]?\d{3,4}[-\s]?\d{4}\b/g, '[phone]')
    .replace(/-?\d{1,3}\.\d{4,}/g, '[num]') // 좌표 모양(소수점 4자리 이상)
    .replace(/\d{6,}/g, '[num]'); // 긴 숫자열(주민번호·계좌 등)
}

// 에러가 한 줄로 남기는 메시지. Prisma 에러는 앞부분에 호출 코드와 인자 값(where 절 등)이 길게 붙고 이유는 마지막 줄에 있다 —
// 마지막 비어 있지 않은 줄만 쓴다.
export function safeErrorMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : typeof err === 'string' ? err : '';
  const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean);
  const isPrisma = err instanceof Error && err.name.startsWith('PrismaClient');
  const picked = isPrisma ? lines[lines.length - 1] ?? '' : lines.join(' ');
  return maskText(picked).slice(0, MESSAGE_MAX);
}

// 스택에서 "at …" 줄 앞부분만. 첫 줄(에러 메시지 그대로 들어 있다)은 버린다.
export function stackHead(err: unknown): string | null {
  if (!(err instanceof Error) || !err.stack) return null;
  const frames = err.stack.split('\n').filter((l) => /^\s+at\s/.test(l)).slice(0, STACK_LINES);
  return frames.length ? maskText(frames.map((l) => l.trim()).join('\n')) : null;
}
