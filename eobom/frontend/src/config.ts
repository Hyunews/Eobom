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

// 프론트 전용 UI 정책 상수 — docs/01_장사시설_매칭/01-05_...명세서.md §12.5.
// 백엔드 정책(POLICY, backend/src/config/policy.ts)과 같은 원칙(값을 컴포넌트에 직접 쓰지 않는다)을
// 따르되, 순수 클라이언트 동작이라 백엔드로 옮기거나 API로 내려받지 않는다.
// 위치 확인 실패 시 대체 좌표(광주광역시 광산구, 광산구청 인근) — 2026-08-19 개발자 지시로
// 서울 서초 값에서 변경. 실제 위치가 아니므로 사용하는 곳에서 반드시 폴백 배지를 함께 노출할 것.
export const GEOLOCATION_FALLBACK = { lat: 35.1397, lng: 126.7938 };

// 위치기반서비스사업 신고 완료 여부 — docs 00-21 §0.2 잠금 규칙(docs 00-14 §2.10).
// 신고가 실제로 확인되기 전까지 반드시 false로 둔다. false인 동안:
//   (1) FacilityPage가 navigator.geolocation.getCurrentPosition을 호출하지 않고
//   (2) TermsPage가 제6장(위치기반서비스)을, PrivacyPage가 제3-6조(위치정보)를 렌더링하지 않는다.
// 방통위 신고가 실제로 완료된 것이 확인된 뒤에만 true로 바꾼다 — 조문과 기능은 한 쌍이다.
export const LOCATION_BASED_SERVICE_REGISTERED = false;

// 카카오맵 SDK 로드 대기 타임아웃(ms) — 이 시간 안에 안 뜨면 무한 스피너 대신 실패 상태로 전환.
export const KAKAO_MAP_LOAD_TIMEOUT_MS = 5000;
export const KAKAO_MAP_LOAD_POLL_INTERVAL_MS = 100;

// 카카오톡 "공유하기" SDK(`t1.kakaocdn.net/kakao_js_sdk`) — 지도 SDK(dapi.kakao.com)와
// 별개 스크립트·별개 키다(docs 07-03 §3.2). 같은 앱이면 키 값 자체는 같을 수 있으나 용도가
// 달라 변수명을 분리해 노출한다. Phase 0 #2(사용자 작업) — .env·Vercel env에 값 등록 필요.
export const KAKAO_JS_KEY = import.meta.env.VITE_KAKAO_JS_KEY || '';
export const KAKAO_SHARE_SDK_LOAD_TIMEOUT_MS = 5000;
export const KAKAO_SHARE_SDK_LOAD_POLL_INTERVAL_MS = 100;

// 카톡 카드 이미지(§3.3-1~§3.3-3) — 근조 이미지 확정 완료(Phase 0 ⓒ), eobom/frontend/public/에
// 커밋됨. ⚠️ 반드시 고정 공개 URL이어야 한다 — 카카오 서버가 imageUrl을 직접 가져가는데
// localhost·사설 IP(window.location.origin 기반)는 접근할 수 없다(§3.3-3). 브랜드 로고
// 재사용은 §3.3-2가 금지(서비스 홍보로 읽힘) — eobom-logo-hd.png 임시 물림은 여기서 제거한다.
// 2026-08-21: obituary-card.png → obituary-card-v2.png로 파일명 변경. 같은 URL의 이미지만
// 바꿔서는(2026-08-20 "카드이미지 수정") 이미 그 URL을 한 번 가져간 카카오 CDN이 예전(꽃이
// 양쪽 끝에 있던) 이미지를 계속 캐시해서 내보낼 수 있다 — URL 자체를 바꿔 강제로 새로 가져가게 한다.
export const OBITUARY_CARD_IMAGE_URL = 'https://eobom.vercel.app/obituary-card-v2.png';

// 가족 지정 초대 카드 이미지(00-27 §9.1-4) — 부고장과 달리 이건 서비스 초대 카드라 브랜드
// 로고 재사용 금지(§3.3-2, obituary 전용 판단)가 적용되지 않는다. 이미 커밋된 로고 파일을
// 그대로 쓴다 — 새 이미지 자산을 만들지 않는다.
export const FAMILY_INVITE_CARD_IMAGE_URL = 'https://eobom.vercel.app/eobom-logo-hd.png';

// 연락처는 백엔드에 숫자만(하이픈 없이) 저장된다(backend/src/utils/phone.ts와 짝) — 화면 표시용 포맷터.
// 정확한 지역번호 체계까지는 다루지 않는 근사치 포맷(011자리 서울/지방 구분 등은 생략).
export const formatPhoneForDisplay = (digits: string): string => {
  if (!digits) return digits;
  if (digits.length === 11) return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) {
    return digits.startsWith('02') ? `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}` : `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 9) {
    return digits.startsWith('02') ? `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}` : digits;
  }
  return digits;
};
