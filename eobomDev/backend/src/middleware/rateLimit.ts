import type { Express, Request, RequestHandler, Response } from 'express';
import { rateLimit } from 'express-rate-limit';
import { getRequestId } from './requestLog';

// docs 00-42 §10 (10-01 결정) — 같은 IP 기준 요청 횟수 제한. IP는 app.ts의 `trust proxy 1` 덕에 프록시 뒤 실제 주소다.
// 저장은 메모리(express-rate-limit 기본) — Render 인스턴스가 하나라 충분하다. 재시작·슬립 뒤 초기화돼도 괜찮다(남용 방지용 1차 가드).
//   · 공개 쓰기 분당 10 — 비로그인으로(또는 공개 주소로) 누구나 보낼 수 있는 POST
//   · 로그인·토큰 갱신 분당 20
//   · 그 밖 전체 분당 300 — /api/health 제외(외부 깨우기 핑)
// 한도 하나가 넘으면 429 + 사실만 말하는 문구. 429도 접속기록에 실패로 남는다(accessLog가 limiter보다 앞이라 자연히 남는다 — 00-42 §5.1).

export const RATE_LIMIT_WINDOW_MS = 60 * 1000;
export const RATE_LIMITS = { publicWrite: 10, auth: 20, global: 300 } as const;
export const RATE_LIMIT_MESSAGE = '잠시 후 다시 시도해 주세요.';

// 로그인·토큰 갱신 — 분당 20. 🔴 운영자 로그인은 이미 계정 잠금(5회 실패)이 있고 이건 IP 쪽 가드다.
export const AUTH_ROUTES = [
  '/api/admin/login',
  '/api/admin/refresh',
  '/api/partner/login',
  '/api/partner/refresh',
  '/api/expert/login',
  '/api/expert/refresh',
  '/api/auth/confirm-link',
  '/api/auth/demo-login', // 운영에선 403이지만 진입점이라 같이 묶는다
] as const;

// 공개 쓰기 — 분당 10. 라우트 파일(routes/*.ts)의 POST 중 로그인 없이(또는 링크·토큰만으로) 도달하는 것.
// 컨트롤러가 401을 돌려주는 것(방명록·상담 신청)도 주소는 공개라 같이 묶는다 — 문을 두드리는 횟수를 제한하는 것이 목적.
export const PUBLIC_WRITE_ROUTES = [
  '/api/memorials/:slug/tributes', // 헌화 — 비회원 허용
  '/api/memorials/:slug/guestbook', // 방명록 — 로그인 필수지만 공개 주소
  '/api/memorials/extend/:token', // 추모관 연장 링크(00-20 §8.1-4) — 토큰만으로 도달, 추측 대상
  '/api/experts/:id/consult-requests', // 전문가 상담 신청
  '/api/facilities/:id/quotes', // 시설 문의
  '/api/obituaries/:slug/share', // 부고장 공유 집계 +1 — 인증 불필요
  '/api/family-designations/invite/:token/accept', // 초대 토큰 — 추측 대상
  '/api/family-designations/invite/:token/decline',
  '/api/partner/signup', // 가입 신청 — 스팸 계정 방지
  '/api/expert/signup',
] as const;

const GLOBAL_EXEMPT_PATHS = new Set(['/api/health']);

// 테스트 전용 스위치 — NODE_ENV=test일 때만 인정한다(운영에서 이 값이 실수로 남아 있어도 제한은 켜진다).
// 다른 테스트 파일들이 같은 IP(127.0.0.1)로 수십 번 로그인·요청해서 한도에 걸리지 않게 하려는 것이고,
// 제한 자체는 tests/cors-ratelimit.test.ts가 이 값을 끄고 실제 앱으로 시험한다.
const disabledForTests = (): boolean => process.env.NODE_ENV === 'test' && process.env.RATE_LIMIT_DISABLED === 'true';

function makeLimiter(limit: number, extraSkip?: (req: Request) => boolean): RequestHandler {
  return rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    // CORS 사전요청(OPTIONS)은 세지 않는다 — 브라우저가 쓰기 요청마다 자동으로 하나씩 더 보낸다.
    skip: (req) => disabledForTests() || req.method === 'OPTIONS' || (extraSkip ? extraSkip(req) : false),
    handler: (req: Request, res: Response) => {
      res.status(429).json({ status: 'error', message: RATE_LIMIT_MESSAGE, requestId: getRequestId(res) });
    },
  });
}

// 라우터보다 앞에서 한 번 호출한다. 주소별 한도는 app.post(주소들, 한도)로 걸어 두고 next()로 원래 라우터에 넘긴다.
export function installRateLimits(app: Express): void {
  app.use(makeLimiter(RATE_LIMITS.global, (req) => GLOBAL_EXEMPT_PATHS.has(req.path)));
  app.post([...AUTH_ROUTES], makeLimiter(RATE_LIMITS.auth));
  app.post([...PUBLIC_WRITE_ROUTES], makeLimiter(RATE_LIMITS.publicWrite));
}
