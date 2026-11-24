import { CONTACT_EMAIL } from '../../config';

// 소셜 로그인 실패 리다이렉트(`?loginError=코드`)의 안내 문구 — 지금 App.tsx 표를 옮기고 account_suspended를 더했다(00-44 §9-5-3 10-1 ①).
// not_registered는 문구 표가 아니라 [회원가입] 탭을 여는 동작이라 AuthProvider가 따로 처리한다.
export const LOGIN_ERROR_MESSAGES: Record<string, string> = {
  kakao_failed: '카카오 로그인에 실패했습니다. 다시 시도해주세요.',
  naver_failed: '네이버 로그인에 실패했습니다. 다시 시도해주세요.',
  google_failed: '구글 로그인에 실패했습니다. 다시 시도해주세요.',
  auth_failed: '소셜 로그인 인증에 실패했습니다. 다시 시도해주세요.',
  server_error: '서버 오류로 로그인에 실패했습니다. 잠시 후 다시 시도해주세요.',
  // /api/auth/:provider 시작 라우트가 필수 동의 쿼리 없이 호출되면 돌아온다(구 버전 캐시·외부 링크로 직접 호출한 경우)
  consent_required: '이용약관 및 개인정보 수집·이용 동의가 필요합니다. 로그인 창에서 다시 시도해주세요.',
  // 비활성 계정(User.memorializedAt, 00-12 §5.3)
  account_unavailable: '사용할 수 없는 계정입니다. 고객센터로 문의해 주세요.',
  // 운영자가 정지한 회원(묶음 13). 서버가 토큰 없이 돌려보낸다.
  account_suspended: `이용이 정지된 계정입니다. 문의: ${CONTACT_EMAIL}`,
};

export const LOGIN_ERROR_FALLBACK = '로그인에 실패했습니다. 다시 시도해주세요.';
