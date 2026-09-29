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
// 🆕 2026-09-10 사람 리포트 — 소셜 로그인은 전체 페이지 리다이렉트(OAuth 인가 → 백엔드 콜백)라
// SPA 라우트가 끊긴다. 콜백은 항상 '/'로 돌아오므로(App.tsx), prep·bereaved처럼 라우트로 들어간
// 화면에서 로그인하면 무조건 홈으로 튕겼다. 리다이렉트 직전 현재 경로를 여기 저장해뒀다가
// loginSuccess 처리 시 그 경로로 돌려보낸다(PENDING_INVITE_TOKEN_KEY와 같은 패턴).
export const PENDING_RETURN_PATH_KEY = 'eobom_pending_return_path';
export const SCROLL_HOME_KEY = 'eobom_scroll_home';
// 모바일 홈(HomeMobile.tsx)의 마지막 칸 — App.setActiveTab('home')이 명시적 홈 진입 때 지운다.
export const SCROLL_HOME_MOBILE_KEY = 'eobom_scroll_home_m';
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

// 저장만 한다(탭 간 방송 없음) — 방송을 받은 탭이 다시 방송하는 핑퐁을 막으려고 갈라둔다.
function storeSession<A extends Audience>(audience: A, payload: SessionPayload[A]): void {
  const store = STORE[audience];
  const keys = KEYS[audience];
  store.setItem(keys.DISPLAY_NAME, payload.displayName);
  if ('token' in payload && payload.token) {
    store.setItem(keys.TOKEN, payload.token);
    if (audience === 'USER') startHeartbeat();
  }
  if ('refreshToken' in payload) {
    store.setItem((keys as typeof KEYS.ADMIN).REFRESH_TOKEN, payload.refreshToken);
  }
  if (audience === 'PARTNER' && 'type' in payload) {
    store.setItem(KEYS.PARTNER.TYPE, (payload as SessionPayload['PARTNER']).type);
  }
}

function wipeSession(audience: Audience): void {
  const store = STORE[audience];
  Object.values(KEYS[audience]).forEach((key) => store.removeItem(key));
  if (audience === 'USER') {
    stopHeartbeat();
    setLoginHint(false);
  }
}

// 탭 간 공유용 "어딘가 로그인돼 있다" 표시 — 🔴 시각(숫자)만 localStorage에 둔다. 토큰·이름 등 개인정보는
// 절대 넣지 않는다(08-21 원칙 유지, 토큰은 sessionStorage에만). 로그인한 탭이 주기적으로 갱신하고, 로그아웃·
// 탭 닫힘(pagehide) 때 지운다. 새 탭은 첫 화면 전에 이걸 동기로 읽어, 없거나 오래됐으면 기다리지 않는다.
// 백그라운드 탭은 타이머가 1분에 한 번으로 늦춰질 수 있어 신선 판정을 넉넉히(90초) 잡는다 — 비정상 종료로
// 표시가 남아도 그 시간 안에 새 탭이 한 번(최대 300ms) 기다리고 끝난다.
const LOGIN_HINT_KEY = 'eobom_user_login_hint';
const LOGIN_HINT_FRESH_MS = 90_000;
const LOGIN_HINT_BEAT_MS = 15_000;
function setLoginHint(on: boolean): void {
  try {
    if (on) localStorage.setItem(LOGIN_HINT_KEY, String(Date.now()));
    else localStorage.removeItem(LOGIN_HINT_KEY);
  } catch {
    /* 저장 불가 환경 — 표시 없이 동작(대기 없음) */
  }
}
function hasFreshLoginHint(): boolean {
  try {
    const at = Number(localStorage.getItem(LOGIN_HINT_KEY));
    return at > 0 && Date.now() - at < LOGIN_HINT_FRESH_MS;
  } catch {
    return false;
  }
}

let heartbeat: ReturnType<typeof setInterval> | null = null;
function startHeartbeat(): void {
  setLoginHint(true);
  if (heartbeat || typeof window === 'undefined') return;
  heartbeat = setInterval(() => {
    if (getToken('USER')) setLoginHint(true);
  }, LOGIN_HINT_BEAT_MS);
}
function stopHeartbeat(): void {
  if (heartbeat) clearInterval(heartbeat);
  heartbeat = null;
}

export function setSession<A extends Audience>(audience: A, payload: SessionPayload[A]): void {
  storeSession(audience, payload);
  if (audience === 'USER') {
    const p = payload as SessionPayload['USER'];
    postAuth({ type: 'LOGIN', displayName: p.displayName, token: p.token });
  }
}

export function clearSession(audience: Audience): void {
  wipeSession(audience);
  if (audience === 'USER') postAuth({ type: 'LOGOUT' });
}

// ─────────────────────────────────────────────────────────────────
// 00-34 §2.2 (2026-09-29 개발자 결정) — 일반 사용자(USER) 로그인을 열린 탭끼리 공유한다.
// 저장소는 sessionStorage 그대로(브라우저를 끄면 로그아웃, 08-21) — 새 탭은 비어 있으므로
// BroadcastChannel로 토큰을 가진 탭에 물어 받아온다. ADMIN·PARTNER는 이미 localStorage라 대상 아님.
// BroadcastChannel이 없는 브라우저는 channel이 null이라 모든 함수가 조용히 아무 일도 안 한다.
// ─────────────────────────────────────────────────────────────────
const AUTH_CHANNEL_NAME = 'eobom_auth';
const SESSION_REQUEST_WAIT_MS = 300;

type AuthMessage =
  | { type: 'REQUEST' }
  | { type: 'SHARE' | 'LOGIN'; displayName: string; token?: string }
  | { type: 'LOGOUT' };

let channel: BroadcastChannel | null = null;
try {
  if (typeof BroadcastChannel !== 'undefined') channel = new BroadcastChannel(AUTH_CHANNEL_NAME);
} catch {
  channel = null;
}

const sessionListeners = new Set<() => void>();
const notifySession = () => sessionListeners.forEach((fn) => fn());

function postAuth(msg: AuthMessage): void {
  try {
    channel?.postMessage(msg);
  } catch {
    /* 방송 실패는 조용히 — 이 탭의 로그인 자체엔 영향 없음 */
  }
}

// 새 탭이 답을 기다리는 동안 true — App이 이 동안 화면을 그리지 않아 "로그아웃 상태"가 번쩍이지 않게 한다.
let userSessionPending = false;
let pendingTimer: ReturnType<typeof setTimeout> | null = null;
function finishPending(): void {
  if (!userSessionPending) return;
  userSessionPending = false;
  if (pendingTimer) clearTimeout(pendingTimer);
  pendingTimer = null;
}

export function isUserSessionPending(): boolean {
  return userSessionPending;
}

// 다른 탭에서 온 로그인/로그아웃/공유 응답으로 이 탭의 USER 세션이 바뀌었을 때(또는 대기가 끝났을 때) 호출된다.
export function subscribeUserSession(listener: () => void): () => void {
  sessionListeners.add(listener);
  return () => {
    sessionListeners.delete(listener);
  };
}

if (channel) {
  channel.onmessage = (e: MessageEvent<AuthMessage>) => {
    const msg = e.data;
    if (!msg || typeof msg !== 'object') return;
    switch (msg.type) {
      case 'REQUEST': {
        const token = getToken('USER');
        const displayName = getDisplayName('USER');
        if (token && displayName) postAuth({ type: 'SHARE', displayName, token });
        return;
      }
      case 'SHARE':
        if (!getToken('USER') && msg.token) storeSession('USER', { displayName: msg.displayName, token: msg.token });
        break;
      case 'LOGIN':
        storeSession('USER', { displayName: msg.displayName, token: msg.token });
        break;
      case 'LOGOUT':
        wipeSession('USER');
        break;
      default:
        return;
    }
    finishPending();
    notifySession();
  };

  // 새 탭 시작 시 토큰이 없고 "로그인된 탭 있음" 표시가 최근이면 그 탭에 물어본다(최대 300ms 대기).
  // 표시가 없거나 오래됐으면 기다리지 않고 바로 비로그인으로 그린다. 답이 없어도 비로그인.
  if (getToken('USER')) {
    startHeartbeat();
  } else if (hasFreshLoginHint()) {
    userSessionPending = true;
    postAuth({ type: 'REQUEST' });
    pendingTimer = setTimeout(() => {
      finishPending();
      notifySession();
    }, SESSION_REQUEST_WAIT_MS);
  }

  // 탭이 닫히면 표시를 지운다. 다른 로그인 탭이 남아 있으면 지워지는 걸 storage 이벤트로 보고 바로 다시 쓴다.
  window.addEventListener('pagehide', () => {
    if (getToken('USER')) setLoginHint(false);
  });
  window.addEventListener('pageshow', () => {
    if (getToken('USER')) setLoginHint(true); // 뒤로가기 캐시 복원 대비
  });
  window.addEventListener('storage', (e) => {
    if (e.key === LOGIN_HINT_KEY && e.newValue === null && getToken('USER')) setLoginHint(true);
  });
}

// §4.4 — 2026-08-21 localStorage→sessionStorage 전환 때 남긴 한시적 청소 코드.
// 그 이전에 접속한 뒤 아직 안 돌아온 브라우저에는 localStorage에 옛 값이 남아 있을 수 있어
// 아직 지우지 않는다. 🔴 한시적 코드 — 제거 시점은 정식 오픈 시(§4.4).
export function clearLegacyUserLocalStorage(): void {
  localStorage.removeItem(KEYS.USER.DISPLAY_NAME);
  localStorage.removeItem(KEYS.USER.TOKEN);
}
