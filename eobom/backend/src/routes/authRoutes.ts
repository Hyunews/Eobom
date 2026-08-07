import { Router } from 'express';
import jwt from 'jsonwebtoken';
import passport from '../config/passport';
import {
  handleSocialLoginCallback,
  demoLogin,
  getCurrentUser,
  confirmLink,
  unlinkProvider,
  captureFrontendOrigin,
  resolveFrontendUrl,
  JWT_SECRET,
} from '../controllers/authController';

const router = Router();

const LINKABLE_PROVIDERS = ['kakao', 'naver', 'google'] as const;

// provider별 재인증/추가 옵션 (일반 로그인 라우트와 동일한 정책 재사용)
const providerAuthOptions: Record<(typeof LINKABLE_PROVIDERS)[number], Record<string, unknown>> = {
  kakao: { prompt: 'login' },
  naver: { authType: 'reauthenticate' },
  google: { scope: ['profile', 'email'], prompt: 'select_account' },
};

// 1~3. 카카오/네이버/구글 소셜 로그인 (provider별 prompt/authType으로 기존 세션 재사용 없이 매번 재인증 화면을 띄움)
for (const provider of LINKABLE_PROVIDERS) {
  // 로그인 시작 시점의 Referer로 프론트 오리진(LAN IP 등)을 캡처해 state에 실어보낸다.
  // OAuth 제공자가 콜백 때 state를 그대로 echo해주므로, 콜백 단계(Referer가 제공자 도메인이라 못 씀)에서 복원 가능.
  router.get(`/${provider}`, (req, res, next) => {
    const state = jwt.sign({ purpose: 'login', origin: captureFrontendOrigin(req) }, JWT_SECRET, { expiresIn: '10m' });
    const options = { ...providerAuthOptions[provider], state };
    return passport.authenticate(provider, options as object)(req, res, next);
  });

  router.get(
    `/${provider}/callback`,
    (req, res, next) => {
      // 실패 시 리다이렉트도 같은 state(요청 쿼리에 그대로 담겨옴)로 프론트 오리진을 복원해야
      // 폰(LAN IP 접속) 환경에서 로그인 실패 메시지가 자기 자신의 localhost로 새지 않는다.
      const frontendUrl = resolveFrontendUrl(req.query.state);
      return passport.authenticate(provider, { session: false, failureRedirect: `${frontendUrl}?loginError=${provider}_failed` } as object)(
        req,
        res,
        next
      );
    },
    handleSocialLoginCallback
  );
}

// 4. 가입 모달에서 [계정 통합] 또는 [독립 신규 가입] 선택 확정 처리
router.post('/confirm-link', confirmLink);

// 5. 모의 / 데모 로그인 (API 개발용)
router.post('/demo-login', demoLogin);

// 6. 현재 로그인 유저 조회 (연동된 소셜 계정 목록 포함)
router.get('/me', getCurrentUser);

// 7. 마이페이지: 이미 로그인된 유저가 다른 소셜 계정 추가 연동 시작
// (JWT를 쿼리로 받아 OAuth state에 서명해 실어보내고, 위 3~4번의 동일한 /:provider/callback을 그대로 재사용해서
//  별도 리다이렉트 URI를 콘솔에 추가 등록할 필요 없이 "로그인"과 "연동"을 콜백 단계에서 분기함)
router.get('/:provider/link', (req, res, next) => {
  const provider = req.params.provider as (typeof LINKABLE_PROVIDERS)[number];
  if (!LINKABLE_PROVIDERS.includes(provider)) {
    return res.status(400).json({ status: 'error', message: '지원하지 않는 provider입니다.' });
  }

  const token = req.query.token;
  if (typeof token !== 'string') {
    return res.status(401).json({ status: 'error', message: '로그인이 필요합니다.' });
  }

  let userId: string;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload & { id: string };
    userId = decoded.id;
  } catch {
    return res.status(401).json({ status: 'error', message: '유효하지 않거나 만료된 토큰입니다.' });
  }

  const linkState = jwt.sign({ purpose: 'link', userId, origin: captureFrontendOrigin(req) }, JWT_SECRET, { expiresIn: '10m' });
  const options = { ...providerAuthOptions[provider], state: linkState };

  return passport.authenticate(provider, options as object)(req, res, next);
});

// 8. 마이페이지: 소셜 계정 연동 해제 (최소 1개는 유지)
router.delete('/unlink-provider', unlinkProvider);

export default router;
