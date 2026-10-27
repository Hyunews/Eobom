import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { BACKEND_URL } from '../../config';
import { ApiError, apiFetch, apiFetchRaw, registerSessionExpiredHandler } from '../../lib/api';
import {
  PENDING_RETURN_PATH_KEY, clearLegacyUserLocalStorage, clearSession, getDisplayName, getToken,
  isUserSessionPending, setSession, subscribeUserSession,
} from '../../lib/storage';
import { RdAlertDialog, useRdToast } from '../parts/RdModal';
import {
  ConsentRequiredDialog, LinkDialog, LoginDialog, RecoveryDialog,
  type LoginNoticeInput, type SocialProvider,
} from '../pages/auth/LoginDialogs';
import { LOGIN_ERROR_FALLBACK, LOGIN_ERROR_MESSAGES } from './loginErrors';

// 00-44 §9-5-3 10-1 · 지금 App.tsx의 세션·로그인 흐름을 새 쪽으로 옮긴 것.
// 세션 저장·읽기와 탭 간 공유는 지금 `lib/storage.ts`를 그대로 쓴다(키 값이 같아야 이미 로그인한 사용자의 세션이 이어진다 — 00-34 §4.2).
// 소셜 로그인은 전체 페이지 리다이렉트라, 돌아오는 주소(`/#loginSuccess…` · `/?loginError=…`)를 여기서 처리한다.

export interface OpenLoginOptions {
  tab?: 'login' | 'signup';
  notice?: LoginNoticeInput;
}

interface AuthValue {
  /** 화면에 보일 이름 — 로그인 전이면 null */
  currentUser: string | null;
  /** 다른 탭에 로그인 정보를 묻고 답을 기다리는 동안(최대 300ms) true */
  sessionPending: boolean;
  openLogin: (opts?: OpenLoginOptions) => void;
  /** 로그아웃 + "로그아웃 되었습니다." 알림 */
  logout: () => void;
  /** 이어봄 알림 창 — alert() 자리. 꼭 읽어야 하는 일에만 */
  showAlert: (title: string, desc?: string) => void;
  /** 이어봄 짧은 알림 — 읽고 넘길 일 */
  showToast: (message: string, tone?: 'ok' | 'warn') => void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function useAuth(): AuthValue {
  const v = useContext(AuthContext);
  if (!v) throw new Error('useAuth는 AuthProvider 안에서만 쓴다');
  return v;
}

interface MeState {
  scheduledAt: string | null;
  consentRequired: boolean;
}

interface LinkPrompt {
  tempToken: string;
  email: string;
  existingProvider: string;
  newProvider: string;
}

const messageOf = (e: unknown) => (e instanceof ApiError ? e.message : '처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const toast = useRdToast();
  const [currentUser, setCurrentUser] = useState<string | null>(() => {
    clearLegacyUserLocalStorage();
    return getDisplayName('USER');
  });
  const [sessionPending, setSessionPending] = useState(isUserSessionPending);
  const [login, setLogin] = useState<{ tab: 'login' | 'signup'; notice?: LoginNoticeInput; key: number } | null>(null);
  const [alertBox, setAlertBox] = useState<{ title: string; desc?: string } | null>(null);
  const [link, setLink] = useState<LinkPrompt | null>(null);
  const [me, setMe] = useState<MeState>({ scheduledAt: null, consentRequired: false });
  const loginKey = useRef(0);

  // 다른 탭의 로그인·로그아웃, 새 탭이 받아온 세션에 반응한다(00-34 §2.2).
  useEffect(() => {
    const sync = () => {
      setCurrentUser(getDisplayName('USER'));
      setSessionPending(isUserSessionPending());
    };
    const unsubscribe = subscribeUserSession(sync);
    sync(); // 구독 전에 도착한 응답을 놓치지 않게 한 번 맞춘다
    return unsubscribe;
  }, []);

  const openLogin = useCallback((opts?: OpenLoginOptions) => {
    loginKey.current += 1;
    setLogin({ tab: opts?.tab ?? 'login', notice: opts?.notice, key: loginKey.current });
  }, []);

  const showAlert = useCallback((title: string, desc?: string) => setAlertBox({ title, desc }), []);

  const handleLoginSuccess = useCallback((username: string, provider?: string, token?: string) => {
    const displayName = provider ? `${username} (${provider})` : username;
    setCurrentUser(displayName);
    setSession('USER', { displayName, token });
    setLogin(null);
  }, []);

  // notice가 있으면(401 세션 만료) 로그인 창을 안내문과 함께 연다. 없으면 직접 로그아웃 — 짧은 알림.
  // 🔴 세션 만료에 alert()를 쓰지 않는다: 탭이 백그라운드일 때 JS가 붙잡혀 화면이 "로그인된 채"로 멈춘다(지금 App.tsx와 같은 이유).
  const endSession = useCallback((notice?: string) => {
    setCurrentUser(null);
    setMe({ scheduledAt: null, consentRequired: false });
    clearSession('USER');
    if (notice) openLogin({ notice: { text: notice } });
    else toast.show('로그아웃 되었습니다.');
  }, [openLogin, toast.show]);

  const logout = useCallback(() => endSession(), [endSession]);

  // apiFetch가 회원 요청에서 401을 받으면 부르는 콜백(00-34 §6). 최신 endSession을 쓰도록 ref로 한 번만 등록한다.
  const endSessionRef = useRef(endSession);
  endSessionRef.current = endSession;
  useEffect(() => {
    registerSessionExpiredHandler('USER', (message) => endSessionRef.current(message));
    return () => registerSessionExpiredHandler('USER', undefined);
  }, []);

  // 소셜 로그인 시작 — 각 회사 로그인으로 나간다. 돌아올 때 같은 쪽으로 오도록 지금 경로를 저장해 둔다(지금 LoginModal과 같다).
  const startSocial = useCallback((provider: SocialProvider, tab: 'login' | 'signup') => {
    sessionStorage.setItem(PENDING_RETURN_PATH_KEY, window.location.pathname);
    // 가입 탭은 동의(만 14세·약관·처리방침)를 마친 뒤에만 버튼이 켜진다. 로그인 탭은 mode=login — 가입 이력이 없으면 서버가 not_registered로 돌려보낸다.
    const params = tab === 'signup'
      ? new URLSearchParams({ mode: 'signup', consentTerms: '1', consentPrivacy: '1' })
      : new URLSearchParams({ mode: 'login' });
    window.location.href = `${BACKEND_URL}/api/auth/${provider}?${params.toString()}`;
  }, []);

  // 소셜 로그인으로 돌아온 주소를 한 번 처리한다 — `#loginSuccess…` · `#socialLinkPrompt…` · `?loginError=…`
  useEffect(() => {
    const { hash, pathname, search } = window.location;
    const clean = (keepSearch = false) => window.history.replaceState(null, '', pathname + (keepSearch ? search : ''));

    if (hash.includes('loginSuccess')) {
      const params = new URLSearchParams(hash.split('?')[1]);
      const name = params.get('name');
      if (name) {
        handleLoginSuccess(name, params.get('provider') || undefined, params.get('token') || undefined);
        sessionStorage.removeItem(PENDING_RETURN_PATH_KEY);
        clean();
      }
    } else if (hash.includes('socialLinkPrompt')) {
      const params = new URLSearchParams(hash.split('?')[1]);
      const tempToken = params.get('tempToken');
      const email = params.get('email');
      const existingProvider = params.get('existingProvider');
      const newProvider = params.get('newProvider');
      if (tempToken && email && existingProvider && newProvider) setLink({ tempToken, email, existingProvider, newProvider });
      clean();
    }

    const loginError = new URLSearchParams(search).get('loginError');
    if (loginError) {
      sessionStorage.removeItem(PENDING_RETURN_PATH_KEY);
      // 소셜 인증까지는 됐는데 이 계정으로 가입된 적이 없을 때 — 알림 대신 [회원가입] 탭을 안내문과 함께 연다.
      if (loginError === 'not_registered') openLogin({ tab: 'signup', notice: 'notfound' });
      else setAlertBox({ title: '로그인하지 못했습니다', desc: LOGIN_ERROR_MESSAGES[loginError] ?? LOGIN_ERROR_FALLBACK });
      window.history.replaceState(null, '', pathname + window.location.hash);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 로그인한 뒤 계정 상태 — 탈퇴 유예 중이면 복구 안내가 먼저, 동의 기록이 없으면 그다음에 동의 창(00-36 §4.5-1). 조회가 실패해도 로그인은 막지 않는다.
  const loadMe = useCallback(() => {
    if (!getDisplayName('USER') || !getToken('USER')) {
      setMe({ scheduledAt: null, consentRequired: false });
      return Promise.resolve();
    }
    // /api/auth/me는 {status, user} 봉투라 apiFetchRaw로 직접 읽는다
    return apiFetchRaw('/api/auth/me', 'USER')
      .then((res) => res.json())
      .then((data) => {
        const u = data.status === 'success' ? data.user : null;
        setMe({ scheduledAt: u?.deletionScheduledAt ?? null, consentRequired: !!u?.consentRequired });
      })
      .catch(() => undefined);
  }, []);
  useEffect(() => {
    setMe({ scheduledAt: null, consentRequired: false });
    if (currentUser) void loadMe();
  }, [currentUser, loadMe]);

  const value = useMemo<AuthValue>(
    () => ({ currentUser, sessionPending, openLogin, logout, showAlert, showToast: toast.show }),
    [currentUser, sessionPending, openLogin, logout, showAlert, toast.show],
  );

  // 이 탭이 다른 탭의 답을 기다리는 동안은 화면을 그리지 않아 "로그아웃 화면"이 번쩍이지 않는다.
  if (sessionPending) return null;

  const showRecovery = !!currentUser && !!me.scheduledAt;
  const showConsent = !!currentUser && me.consentRequired && !me.scheduledAt;

  return (
    <AuthContext.Provider value={value}>
      {children}
      {login && !currentUser && (
        <LoginDialog key={login.key} initialTab={login.tab} initialNotice={login.notice} onClose={() => setLogin(null)} onSocial={startSocial} />
      )}
      {link && (
        <LinkDialog
          onClose={() => setLink(null)}
          live={{
            email: link.email,
            existingProvider: link.existingProvider,
            newProvider: link.newProvider,
            onSubmit: async (action) => {
              try {
                const res = await fetch(`${BACKEND_URL}/api/auth/confirm-link`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ tempToken: link.tempToken, action }),
                });
                const data = await res.json();
                if (!res.ok || data.status !== 'success') return data.message || '처리 중 오류가 발생했습니다. 다시 시도해주세요.';
                handleLoginSuccess(data.user.name, data.user.provider, data.token);
                setLink(null);
                return null;
              } catch {
                return '서버와 통신 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
              }
            },
          }}
        />
      )}
      {showRecovery && (
        <RecoveryDialog
          onClose={() => undefined}
          live={{
            scheduledAt: me.scheduledAt as string,
            onLogout: logout,
            onKeep: async () => {
              try {
                await apiFetch('/api/me/deletion-request', 'USER', { method: 'DELETE' });
                // 유예가 풀렸으니 동의 기록이 없는 계정이면 이어서 동의 창이 뜨게 다시 읽는다
                await loadMe();
                return null;
              } catch (e) {
                return messageOf(e);
              }
            },
          }}
        />
      )}
      {showConsent && (
        <ConsentRequiredDialog
          onClose={() => undefined}
          live={{
            onDecline: logout,
            onAgree: async () => {
              try {
                await apiFetch('/api/me/consent', 'USER', { method: 'POST', body: JSON.stringify({ terms: true, privacy: true }) });
                setMe((m) => ({ ...m, consentRequired: false }));
                return null;
              } catch (e) {
                return messageOf(e);
              }
            },
          }}
        />
      )}
      {alertBox && <RdAlertDialog title={alertBox.title} desc={alertBox.desc} onOk={() => setAlertBox(null)} />}
      {toast.node}
    </AuthContext.Provider>
  );
}
