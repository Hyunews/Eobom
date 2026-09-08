// 00-34 §4 — 프론트엔드 저장소 키 상수화(1층).
// 🔴 §4.2 — 키 문자열 "값"은 절대 바꾸지 않는다. 바꾸면 이미 로그인해 있는 모든 사용자의
// 세션이 즉시 끊긴다. 통일하는 건 상수 "이름"뿐이다.
// 🔴 이 파일 밖에서 저장소 키 문자열을 직접 쓰지 않는다(§4.1) — 아래 함수로만 접근한다.

export type Audience = 'USER' | 'ADMIN' | 'PARTNER';

// §2.2 — 일반 사용자만 sessionStorage(2026-08-21 전환), 관리자·사업자는 localStorage.
// 계정군마다 저장소가 다른 건 의도된 차이이므로 통일하지 않는다.
const STORE: Record<Audience, Storage> = {
  USER: sessionStorage,
  ADMIN: localStorage,
  PARTNER: localStorage,
};

const KEYS = {
  USER: {
    TOKEN: 'k_ending_token',
    DISPLAY_NAME: 'k_ending_current_user',
  },
  ADMIN: {
    TOKEN: 'eobom_admin_token',
    REFRESH_TOKEN: 'eobom_admin_refresh_token',
    DISPLAY_NAME: 'eobom_admin_name',
  },
  PARTNER: {
    TOKEN: 'eobom_biz_token',
    REFRESH_TOKEN: 'eobom_biz_refresh_token',
    TYPE: 'eobom_biz_type',
    DISPLAY_NAME: 'eobom_biz_name',
  },
} as const;

// 계정군과 무관한 비인증 보조 키(§2.2) — 로그인 전 초대 토큰 보관 · 스크롤 위치 복원.
export const PENDING_INVITE_TOKEN_KEY = 'eobom_pending_invite_token';
export const SCROLL_HOME_KEY = 'eobom_scroll_home';
export const scrollTabKey = (tab: string): string => `eobom_scroll_${tab}`;

export function getToken(audience: Audience): string | null {
  return STORE[audience].getItem(KEYS[audience].TOKEN);
}

export function getDisplayName(audience: Audience): string | null {
  return STORE[audience].getItem(KEYS[audience].DISPLAY_NAME);
}

export function getPartnerType(): string | null {
  return localStorage.getItem(KEYS.PARTNER.TYPE);
}

type SessionPayload = {
  USER: { displayName: string; token?: string };
  ADMIN: { displayName: string; token: string; refreshToken: string };
  PARTNER: { displayName: string; token: string; refreshToken: string; type: string };
};

export function setSession<A extends Audience>(audience: A, payload: SessionPayload[A]): void {
  const store = STORE[audience];
  const keys = KEYS[audience];
  store.setItem(keys.DISPLAY_NAME, payload.displayName);
  if ('token' in payload && payload.token) {
    store.setItem(keys.TOKEN, payload.token);
  }
  if ('refreshToken' in payload) {
    store.setItem((keys as typeof KEYS.ADMIN).REFRESH_TOKEN, payload.refreshToken);
  }
  if (audience === 'PARTNER' && 'type' in payload) {
    store.setItem(KEYS.PARTNER.TYPE, (payload as SessionPayload['PARTNER']).type);
  }
}

export function clearSession(audience: Audience): void {
  const store = STORE[audience];
  Object.values(KEYS[audience]).forEach((key) => store.removeItem(key));
}

// §4.4 — 2026-08-21 localStorage→sessionStorage 전환 때 남긴 한시적 청소 코드.
// 그 이전에 접속한 뒤 아직 안 돌아온 브라우저에는 localStorage에 옛 값이 남아 있을 수 있어
// 아직 지우지 않는다. 🔴 한시적 코드 — 제거 시점은 정식 오픈 시(§4.4).
export function clearLegacyUserLocalStorage(): void {
  localStorage.removeItem(KEYS.USER.DISPLAY_NAME);
  localStorage.removeItem(KEYS.USER.TOKEN);
}
