const resolveBackendUrl = (): string => {
  // 프로덕션 등 프론트/백엔드가 다른 도메인일 때는 명시적 override를 우선한다.
  const envUrl = import.meta.env.VITE_BACKEND_URL;
  if (envUrl) return envUrl;

  // 로컬 개발: LAN IP로 접속한 경우(예: 모바일 실기기 OAuth 테스트) 백엔드도
  // 같은 호스트의 5000번 포트라고 가정한다 — localhost 하드코딩 시 폰에서
  // 접속하면 폰 자신의 localhost를 가리켜 API 호출이 전부 실패한다.
  // 프로토콜은 항상 현재 페이지 기준(protocol)을 그대로 따른다 — 백엔드가 mkcert
  // 인증서로 HTTPS 뜨는 로컬 환경에서 http://로 고정하면 프로토콜이 어긋나 요청이 실패한다.
  const { hostname, protocol } = window.location;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `${protocol}//localhost:5000`;
  }
  return `${protocol}//${hostname}:5000`;
};

export const BACKEND_URL = resolveBackendUrl();

export const PROVIDER_LABELS: Record<string, string> = {
  KAKAO: '카카오',
  NAVER: '네이버',
  GOOGLE: '구글',
};

export const providerLabel = (provider: string): string => PROVIDER_LABELS[provider.toUpperCase()] || provider;
