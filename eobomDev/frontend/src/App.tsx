import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation, useNavigate, useNavigationType } from 'react-router-dom';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Footer } from './components/Footer';
import { LoginModal } from './components/LoginModal';
import { SocialLinkModal } from './components/SocialLinkModal';
import { MyPageAuthSettings } from './components/mypage/MyPageAuthSettings';
import { MyPageProfile } from './components/mypage/MyPageProfile';
import { MyPageFamilyDesignation } from './components/mypage/MyPageFamilyDesignation';
import { EobomLogo } from './components/EobomLogo';
import { providerLabel, BACKEND_URL } from './config';
import { getDisplayName, setSession, clearSession, clearLegacyUserLocalStorage, isUserSessionPending, subscribeUserSession, PENDING_RETURN_PATH_KEY, SCROLL_HOME_KEY, SCROLL_HOME_MOBILE_KEY } from './lib/storage';
import { registerSessionExpiredHandler } from './lib/api';
import { useIsMobile } from './hooks/useIsMobile';

import { HomePage } from './pages/HomePage';
import { FacilityPage } from './pages/FacilityPage';
import { CounselingPage } from './pages/CounselingPage';
import { DigitalEstatePage } from './pages/DigitalEstatePage';
import { EndingNotePage } from './pages/EndingNotePage';
import { FarewellMessagePage } from './pages/FarewellMessagePage';
import { CareGuidePage } from './pages/CareGuidePage';
import { ObituaryPage } from './pages/ObituaryPage';
import { MyObituaryListPage } from './pages/MyObituaryListPage';
import { ObituaryLandingPage } from './pages/ObituaryLandingPage';
import { MemorialLandingPage } from './pages/MemorialLandingPage';
import { FamilyInvitePage } from './pages/FamilyInvitePage';
import { PickupPage } from './pages/PickupPage';
import { MemorialPage } from './pages/MemorialPage';
import { MyPage } from './pages/MyPage';
import { FamilySharedPage } from './pages/FamilySharedPage';
import { ReleaseRequestBanner } from './components/endingNote/ReleaseRequestBanner';
import { MyConsultationsPage } from './pages/MyConsultationsPage';
import { MyGuestbookPage } from './pages/MyGuestbookPage';
import { AccountRecoveryModal } from './components/AccountRecoveryModal';
import { ConsentRequiredModal } from './components/ConsentRequiredModal';
import { PartnerPortalPage } from './pages/PartnerPortalPage';
import { AdminPage } from './pages/AdminPage';
import { TermsPage } from './pages/TermsPage';
import { PrivacyPage } from './pages/PrivacyPage';

function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const navigationType = useNavigationType(); // 'POP' = 뒤로가기/앞으로가기, 'PUSH'/'REPLACE' = 메뉴 클릭 등 직접 이동

  // 현재 경로 -> 탭 id. path 매핑은 setActiveTab이 만드는 규칙과 대칭이어야 한다.
  const rawTab = location.pathname.replace(/^\//, '');
  const activeTab = rawTab === '' ? 'home' : rawTab;

  // 파트너·운영자 포털은 B2C 소셜 로그인과 완전히 분리된 별도 인증 체계라
  // Header(로그인 버튼)·Sidebar(소비자 메뉴)·긴급콜을 렌더하지 않는다(00-06 §7.4).
  const isPortalRoute = activeTab === 'partner' || activeTab === 'admin';
  // 00-26 §7.2 — 홈은 4박스가 유일한 진입점이라 사이드바를 숨긴다(Header는 유지).
  // 🔄 00-40 §3.3 C6(2026-09-28) — /prep·/bereaved가 폐지되며 둘 다 HomePage로 돌아간다
  // (landingMode로 어느 갈래인지만 넘어감) — 홈과 같은 대접(사이드바 숨김 등)을 받아야 한다.
  const isHomeRoute = activeTab === 'home' || activeTab === 'prep' || activeTab === 'bereaved';
  // 00-40 §3.3 M-10 — 모바일 홈에서만 헤더가 칸 위에 겹치는 오버레이로 바뀐다.
  const isMobileViewport = useIsMobile();
  // docs 07-03 §6.1 — 부고장 랜딩(/o/:slug)은 껍데기(Header·Sidebar·Footer) 자체가 없는
  // 독립 페이지다. isPortalRoute가 partner·admin을 껍데기에서 빼는 패턴을 그대로 확장한다 —
  // 다만 포털은 최소 상단 바라도 남기는 반면, 이쪽은 그것도 없다(조의 화면에 서비스 메뉴가
  // 붙으면 광고로 읽힌다, §6.1). 카톡 링크를 받은 조문객이 비로그인으로 여는 화면이라
  // 로그인 게이트도 없다.
  const isObituaryLandingRoute = /^o\//.test(activeTab);
  // 게스트가 전달받은 추모관 링크(EntryBoxes.tsx(삭제됨) 박스③)로 들어오는 화면 — 위 부고장 랜딩과
  // 같은 이유(비로그인 방문객, 서비스 메뉴가 붙으면 안 됨)로 껍데기 없이 그대로 노출한다.
  const isMemorialLandingRoute = /^m\//.test(activeTab);
  // 00-27 §9.1-2 — 가족 지정 초대 링크. 받는 사람은 아직 회원이 아닐 수 있어 사이드바·모드가
  // 무의미하다(위 두 랜딩과 같은 처리).
  const isFamilyInviteRoute = /^invite\//.test(activeTab);

  const [isLoginOpen, setIsLoginOpen] = useState<boolean>(false);
  // 2026-08-25 — LoginModal 내부 로그인/회원가입 탭 분리. 기본은 항상 "로그인" 탭으로 열리고,
  // mode=login 소셜 로그인이 "가입되지 않은 계정"으로 되돌아왔을 때만 "회원가입" 탭 + 안내문과
  // 함께 연다(아래 loginError 처리부).
  const [loginModalTab, setLoginModalTab] = useState<'login' | 'signup'>('login');
  const [loginModalNotice, setLoginModalNotice] = useState<string | null>(null);
  const openLoginModal = (opts?: { tab?: 'login' | 'signup'; notice?: string }) => {
    setLoginModalTab(opts?.tab ?? 'login');
    setLoginModalNotice(opts?.notice ?? null);
    setIsLoginOpen(true);
  };
  // 모바일 햄버거 메뉴(드로어) 열림 상태 — 데스크톱은 기존 호버 사이드바 그대로,
  // 480px 이하에서만 Header의 햄버거 버튼으로 열고 Sidebar의 드로어로 보여준다(2026-08-20 지시).
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  // 00-40 §3.3 M-10 — 모바일 홈의 현재 칸에 맞춰 HomePage(HomeMobile.tsx)가 갱신한다.
  const [homeMobileHeaderStyle, setHomeMobileHeaderStyle] = useState<{ variant: 'hero' | 'panel' }>({ variant: 'hero' });
  // 2026-08-21: localStorage→sessionStorage로 전환(브라우저를 완전히 껐다 켜도 로그인이 남아있던
  // 문제 수정 — sessionStorage는 브라우저 종료 시 비워진다). 예전에 localStorage에 저장된 값은
  // 더 이상 안 읽지만 그대로 남아있으면 혼란을 주므로 최초 마운트 시 한 번 같이 지운다.
  const [currentUser, setCurrentUser] = useState<string | null>(() => {
    clearLegacyUserLocalStorage();
    return getDisplayName('USER');
  });

  // 00-34 §2.2 (09-29) — 다른 탭의 로그인·로그아웃, 새 탭이 받아온 세션에 반응한다. 답을 기다리는
  // 짧은 동안(sessionPending)은 아래에서 화면을 그리지 않아 로그아웃 화면이 번쩍이지 않는다.
  const [sessionPending, setSessionPending] = useState(isUserSessionPending);
  useEffect(() => {
    const sync = () => {
      setCurrentUser(getDisplayName('USER'));
      setSessionPending(isUserSessionPending());
    };
    const unsubscribe = subscribeUserSession(sync);
    sync(); // 구독 전에 도착한 응답을 놓치지 않게 한 번 맞춘다
    return unsubscribe;
  }, []);

  // §3-2 — 로그인 속도. Render 무료 인스턴스는 15분 미사용 시 슬립하므로, 로그인 버튼을 누른
  // 시점에 깨우면 이미 늦다. 첫 페이지 로드 때 미리 한 번 깨워둔다 — 완전 무음(실패해도 무시,
  // 응답을 기다리지도 화면에 표시하지도 않는다).
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/health`).catch(() => {});
  }, []);

  // 가입 시점 이메일 중복 감지 -> [계정 통합] vs [독립 신규 가입] 선택 모달 상태
  const [socialLinkPrompt, setSocialLinkPrompt] = useState<{
    tempToken: string;
    email: string;
    existingProvider: string;
    newProvider: string;
  } | null>(null);

  // 마이페이지 소셜 계정 연동 설정 모달 상태
  const [isMyPageOpen, setIsMyPageOpen] = useState<boolean>(false);
  const [myPageMessage, setMyPageMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  // 00-28·00-27 §6.3·§8.2 — 마이페이지 > 내 정보 / 가족 지정 모달 상태(MyPageAuthSettings와 같은 패턴)
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isFamilyDesignationOpen, setIsFamilyDesignationOpen] = useState<boolean>(false);

  // 메뉴/버튼 직접 클릭으로 페이지 이동 시 호출 — 시그니처는 예전 해시 버전과 동일하게 유지해
  // Header/Sidebar/HomePage/MyPage 등 호출부는 손대지 않아도 되게 함.
  const setActiveTab = (tab: string) => {
    // 1. 현재 떠나는 탭의 위치 기록 (뒤로가기로 되돌아올 때 복원용)
    if (activeTab !== 'home') {
      sessionStorage.setItem(`eobom_scroll_${activeTab}`, String(window.scrollY));
    }

    // 2. 메뉴 직접 클릭이므로 타겟 탭의 저장된 스크롤 위치 삭제 (최상단 개봉)
    sessionStorage.removeItem(`eobom_scroll_${tab}`);

    // 3. 이미 홈에 있는 상태에서 "홈으로"(로고 클릭 등)를 다시 누르면 아래 navigate('/')가
    // 경로 변화가 없어 HomePage를 리마운트시키지 않는다 — 그래서 HomePage가 직접 듣는
    // 커스텀 이벤트로 맨 위 스크롤을 별도로 알린다(다른 페이지에서 홈으로 갈 때는
    // 무해한 조기 이벤트일 뿐, 실제 복귀는 HomePage 마운트 시 로직이 처리한다).
    // 🔄 2026-09-29 — 명시적 홈 진입(메뉴·드로어·로고)은 저장된 칸/섹션을 지워 ①부터 연다.
    // 위 이벤트는 HomePage가 마운트 전이면 유실되고, 마운트 시 복원 로직이 이전 칸을 띄웠다.
    // 브라우저 뒤로가기는 이 함수를 거치지 않으므로 복원이 그대로 동작한다.
    if (tab === 'home') {
      sessionStorage.removeItem(SCROLL_HOME_KEY);
      sessionStorage.removeItem(SCROLL_HOME_MOBILE_KEY);
      window.dispatchEvent(new Event('eobom:home-scroll-top'));
    }

    navigate(tab === 'home' ? '/' : `/${tab}`);
  };

  // 탭이 바뀌면(메뉴 클릭이 아닌 다른 경로로 이동한 경우 포함) 열려있던 모바일 드로어를 닫는다.
  React.useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [activeTab]);

  // 탭 변경 시 스크롤 처리 (뒤로가기 시 복원, 메뉴 클릭 시 최상단)
  // 🔴 Header.tsx의 "추모관"(?entry=box3)처럼 홈 안의 특정 박스로 바로 진입시키는 경우엔
  // 이 무조건 top-scroll을 건너뛴다 — HomePage.tsx/EntryBoxes.tsx(삭제됨)가 이 이펙트보다 먼저(자식이
  // 부모보다 먼저 실행되는 React 이펙트 순서) 박스③ 위치로 스크롤해 두는데, 여기서 다시 0으로
  // 되돌리면 640px 이하(body가 스크롤 주체, index.css §5.4-1)에서 그 결과가 그대로 덮인다.
  // 🔴 EntryBoxes.tsx(삭제됨)가 박스③ 스크롤을 적용한 직후 setSearchParams({}, {replace:true})로
  // entry= 를 지운다 — 그 값을 deps에 넣으면 지워지는 순간 true→false로 바뀌어 이펙트가 한 번
  // 더 실행되며 이 아래 top-scroll이 다시 걸려 방금 맞춘 위치를 도로 덮어쓴다(실측 확인,
  // 2026-08-31). deps는 activeTab만 유지해 "실제로 홈에 막 도착한 그 렌더"의 값만 캡처한다.
  const skipHomeTopScroll = activeTab === 'home' && location.search.includes('entry=');
  React.useEffect(() => {
    if (skipHomeTopScroll) return;
    if (activeTab !== 'home') {
      if (navigationType === 'POP') {
        const saved = sessionStorage.getItem(`eobom_scroll_${activeTab}`);
        const targetY = saved ? Number(saved) : 0;
        window.scrollTo({ top: targetY, left: 0, behavior: 'instant' });
      } else {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      }
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // 백엔드 소셜 로그인 리다이렉트 콜백 파싱 (예: /#loginSuccess?token=...&name=...)
  // 경로(pathname)는 항상 '/'로 온다 — 해시는 페이지 라우팅과 무관한 1회성 신호로만 쓴다.
  React.useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('loginSuccess')) {
      const urlParams = new URLSearchParams(hash.split('?')[1]);
      const token = urlParams.get('token');
      const name = urlParams.get('name');
      const provider = urlParams.get('provider');

      if (name) {
        handleLoginSuccess(name, provider || undefined, token || undefined);
        // 00-27 §9.1-2 — 초대 링크(/invite/:token)에서 로그인하면 콜백은 항상 '/'로 돌아오고
        // 토큰은 해시에 없다. FamilyInvitePage.tsx가 로그인 시작 전에 sessionStorage에 심어둔
        // 값을 여기서 소비해 원래 초대 화면으로 되돌려보낸다 — 없으면(일반 로그인) 그대로 홈.
        const pendingInviteToken = sessionStorage.getItem('eobom_pending_invite_token');
        // 🆕 2026-09-10 사람 리포트 — prep·bereaved 같은 라우트 화면에서 소셜 로그인하면
        // 콜백이 항상 '/'로 돌아와 무조건 홈으로 튕겼다. LoginModal.tsx가 리다이렉트 직전
        // 저장해둔 경로가 있으면(초대 토큰이 없을 때만 — 초대 흐름이 우선) 그리로 돌려보낸다.
        const pendingReturnPath = sessionStorage.getItem(PENDING_RETURN_PATH_KEY);
        if (pendingInviteToken) {
          sessionStorage.removeItem('eobom_pending_invite_token');
          navigate(`/invite/${pendingInviteToken}`, { replace: true });
        } else if (pendingReturnPath && pendingReturnPath !== '/') {
          sessionStorage.removeItem(PENDING_RETURN_PATH_KEY);
          navigate(pendingReturnPath, { replace: true });
        } else {
          sessionStorage.removeItem(PENDING_RETURN_PATH_KEY);
          window.history.replaceState(null, '', '/');
        }
      }
    }
  }, []);

  // 가입 시점 동일 이메일 감지 콜백 파싱 (예: /#socialLinkPrompt?tempToken=...&email=...)
  React.useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('socialLinkPrompt')) {
      const urlParams = new URLSearchParams(hash.split('?')[1]);
      const tempToken = urlParams.get('tempToken');
      const email = urlParams.get('email');
      const existingProvider = urlParams.get('existingProvider');
      const newProvider = urlParams.get('newProvider');

      if (tempToken && email && existingProvider && newProvider) {
        setSocialLinkPrompt({ tempToken, email, existingProvider, newProvider });
      }
      window.history.replaceState(null, '', '/');
    }
  }, []);

  // 마이페이지 소셜 계정 추가 연동 리다이렉트 콜백 파싱 (예: /#mypage?linkSuccess=KAKAO / ?linkError=...)
  React.useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#mypage')) {
      const urlParams = new URLSearchParams(hash.split('?')[1]);
      const linkSuccess = urlParams.get('linkSuccess');
      const linkError = urlParams.get('linkError');

      if (linkSuccess) {
        setMyPageMessage({ type: 'success', text: `${providerLabel(linkSuccess)} 계정이 연동되었습니다.` });
        setIsMyPageOpen(true);
      } else if (linkError) {
        const errorMessages: Record<string, string> = {
          auth_failed: '소셜 인증에 실패했습니다. 다시 시도해주세요.',
          already_own: '이미 연동되어 있는 계정이에요.',
          already_linked_elsewhere: '이미 다른 계정에 연동된 소셜 계정이에요.',
          server_error: '서버 오류로 연동에 실패했습니다. 잠시 후 다시 시도해주세요.',
        };
        setMyPageMessage({ type: 'error', text: errorMessages[linkError] || '연동에 실패했습니다.' });
        setIsMyPageOpen(true);
      }
      window.history.replaceState(null, '', '/mypage');
    }
  }, []);

  // 백엔드 소셜 로그인 실패 리다이렉트 처리 (예: ?loginError=kakao_failed)
  React.useEffect(() => {
    const loginError = new URLSearchParams(window.location.search).get('loginError');
    if (loginError) {
      // 2026-08-25 — "로그인" 탭(mode=login)으로 소셜 인증까지는 성공했는데 이 소셜 계정으로
      // 가입된 적이 없는 경우(authController.ts handleSocialLoginCallback). 동의 없이 조용히
      // 가입시키지 않고, 알림창 대신 모달을 "회원가입" 탭으로 열어 그 자리에서 이어가게 한다.
      if (loginError === 'not_registered') {
        openLoginModal({ tab: 'signup', notice: '가입되지 않은 계정입니다. 아래에서 약관 동의 후 회원가입을 진행해주세요.' });
      } else {
        const messages: Record<string, string> = {
          kakao_failed: '카카오 로그인에 실패했습니다. 다시 시도해주세요.',
          naver_failed: '네이버 로그인에 실패했습니다. 다시 시도해주세요.',
          google_failed: '구글 로그인에 실패했습니다. 다시 시도해주세요.',
          auth_failed: '소셜 로그인 인증에 실패했습니다. 다시 시도해주세요.',
          server_error: '서버 오류로 로그인에 실패했습니다. 잠시 후 다시 시도해주세요.',
          // 2026-08-24 — /api/auth/:provider 시작 라우트가 필수 동의(이용약관·개인정보) 쿼리
          // 없이 호출되면 여기로 리다이렉트한다(authRoutes.ts). LoginModal.tsx를 거치지 않고
          // 직접 URL을 호출한 경우(예: 구 버전 캐시, 외부 링크)에만 실제로 뜬다.
          consent_required: '이용약관 및 개인정보 수집·이용 동의가 필요합니다. 로그인 창에서 다시 시도해주세요.',
        };
        alert(messages[loginError] || '로그인에 실패했습니다. 다시 시도해주세요.');
      }
      // 쿼리스트링 정리 (새로고침해도 에러 메시지가 다시 뜨지 않도록)
      window.history.replaceState(null, '', window.location.pathname + window.location.hash);
    }
  }, []);

  const handleLoginSuccess = (username: string, provider?: string, token?: string) => {
    const displayName = provider ? `${username} (${provider})` : username;
    setCurrentUser(displayName);
    setSession('USER', { displayName, token });
  };

  // notice가 있으면(apiFetch의 401 세션만료 콜백, 00-34 §5.4·§6) 로그인 모달을 안내문과 함께
  // 열고, 없으면(직접 로그아웃 버튼) 기존처럼 alert. alert()는 탭이 백그라운드일 때 브라우저가
  // 표시를 미뤄 JS 스레드를 그대로 붙잡아 두는데, 그 사이엔 setCurrentUser(null)이 이미 호출돼
  // 있어도 리렌더가 막혀 화면은 "로그인된 상태"로 멈춰 있고 이후 API 호출도 전부 401만 반복하는
  // 것처럼 보인다("사이트 오래 켜두면 로그인은 되어 있는데 연결이 안 됨" 증상). 세션 만료는
  // 알림 모달(비차단) 쪽으로 옮겨 리렌더가 alert 해제를 기다리지 않게 한다.
  const handleLogout = (notice?: string) => {
    setCurrentUser(null);
    clearSession('USER');
    if (typeof notice === 'string' && notice) {
      openLoginModal({ notice });
    } else {
      alert('로그아웃 되었습니다.');
    }
  };

  // 00-34 §6 — apiFetch가 일반 사용자 요청에서 401을 받으면 이 콜백을 호출해 세션을 정리하고
  // 로그인 모달로 재로그인을 안내한다.
  useEffect(() => {
    registerSessionExpiredHandler('USER', (message) => handleLogout(message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const authProps = {
    currentUser,
    onOpenLogin: () => openLoginModal(),
    setActiveTab,
  };

  // 새 탭이 다른 탭에 로그인 정보를 묻고 답을 기다리는 최대 300ms(storage.ts) — 로그인 창·"로그인" 버튼을
  // 먼저 띄우지 않고 배경+로고만 둔다. "로그인된 탭 있음" 표시가 최근일 때만 여기 온다.
  if (sessionPending) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: 'var(--primary-color)', fontSize: '1.5rem', fontWeight: 700, letterSpacing: '0.05em' }}>이어봄</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {isObituaryLandingRoute || isMemorialLandingRoute || isFamilyInviteRoute ? (
        // 껍데기 완전히 없음(§6.1) — Header·Sidebar·main-wrapper·Footer 전부 건너뛴다.
        <Routes>
          <Route path="/o/:slug" element={<ObituaryLandingPage />} />
          <Route
            path="/m/:slug"
            element={<MemorialLandingPage currentUser={currentUser} onOpenLogin={() => openLoginModal()} />}
          />
          <Route
            path="/invite/:token"
            element={<FamilyInvitePage currentUser={currentUser} onOpenLogin={() => openLoginModal()} />}
          />
        </Routes>
      ) : (
        <>
      {isPortalRoute ? (
        /* 포털(파트너·운영자) 최소 상단 바 — 로고 + 홈 복귀 링크만. B2C 크롬 대체(00-06 §7.4) */
        <div
          style={{
            padding: '1rem 1.5rem',
            backgroundColor: 'var(--primary-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: 'var(--el-1)'
          }}
        >
          <Link to="/" style={{ display: 'inline-flex', lineHeight: 0 }}>
            <EobomLogo variant="header" height={30} />
          </Link>
          <Link to="/" style={{ fontSize: 'var(--fs-body)', color: 'var(--border-color)', textDecoration: 'underline' }}>
            이어봄 홈으로
          </Link>
        </div>
      ) : (
        <>
          {/* 상단 네비게이션 헤더 */}
          <Header
            setActiveTab={setActiveTab}
            onOpenLogin={() => openLoginModal()}
            currentUser={currentUser}
            onLogout={handleLogout}
            // 00-40 §3.3 M-10 — 모바일 홈에서도 햄버거+드로어를 켠다(그 외는 기존 그대로:
            // 홈이 아닌 페이지는 항상, 데스크톱 홈은 계속 숨김).
            onOpenMobileMenu={(!isHomeRoute || isMobileViewport) ? () => setIsMobileMenuOpen(true) : undefined}
            homeMobileOverlay={isHomeRoute && isMobileViewport ? homeMobileHeaderStyle : undefined}
          />

          {/* Sidebar.tsx는 이제 모바일 드로어 전용(00-39 §6-3) — 항상 마운트해도 무해하고
              (≥641px는 index.css가 강제로 숨김), 열림 여부는 위 onOpenMobileMenu 게이트가
              결정한다(00-40 §3.3 M-10 — 모바일 홈도 이제 드로어를 쓴다). */}
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            currentUser={currentUser}
            onOpenLogin={() => openLoginModal()}
            mobileOpen={isMobileMenuOpen}
            onMobileClose={() => setIsMobileMenuOpen(false)}
            onLogout={handleLogout}
          />
        </>
      )}

      {/* 메인 콘텐츠 영역 (사이드바 공간 확보 wrapper) — 포털 경로·홈은 사이드바가 없으므로
          margin-left를 0으로 되돌린다(그 외 경로는 undefined로 둬 .main-wrapper CSS 값을 그대로 씀) */}
      <div
        className={isPortalRoute ? undefined : 'main-wrapper'}
        style={
          isPortalRoute
            ? { flexGrow: 1, display: 'flex', flexDirection: 'column' }
            : isHomeRoute
              ? { marginLeft: 0 }
              : undefined
        }
      >
        {/* 00-41 §8.3 — 본인 앞으로 온 사후 개봉 요청 배너(진행 중·열림일 때만 그려진다) */}
        {!isPortalRoute && <ReleaseRequestBanner currentUser={currentUser} />}
        <main style={{ flexGrow: 1 }}>
          <Routes>
            <Route
              path="/"
              element={<HomePage {...authProps} onMobileHeaderStyleChange={setHomeMobileHeaderStyle} />}
            />
            {/* 🔄 00-40 §3.3 C6(2026-09-28) — DomainOverviewPage(옛 박스①② "자세히 보기"
                소개 화면)는 폐지. 두 주소 다 홈으로 돌려보내되, landingMode로 어느 갈래인지
                HomePage에 알려 웹은 섹션2로, 모바일은 해당 칸으로 곧장 떨어뜨린다(M-9). */}
            <Route
              path="/prep"
              element={<HomePage {...authProps} onMobileHeaderStyleChange={setHomeMobileHeaderStyle} landingMode="prep" />}
            />
            <Route
              path="/bereaved"
              element={<HomePage {...authProps} onMobileHeaderStyleChange={setHomeMobileHeaderStyle} landingMode="bereaved" />}
            />
            <Route path="/facility" element={<FacilityPage {...authProps} />} />
            <Route path="/counseling" element={<CounselingPage {...authProps} />} />
            <Route path="/digital-estate" element={<DigitalEstatePage {...authProps} />} />
            <Route
              path="/ending-note"
              element={<EndingNotePage {...authProps} onOpenFamilyDesignation={() => setIsFamilyDesignationOpen(true)} />}
            />
            <Route
              path="/farewell-messages"
              element={<FarewellMessagePage {...authProps} onOpenFamilyDesignation={() => setIsFamilyDesignationOpen(true)} />}
            />
            <Route path="/care-guide" element={<CareGuidePage {...authProps} />} />
            <Route path="/obituary" element={<ObituaryPage {...authProps} />} />
            {/* 🔄 09-07 사용자 지시 — 헤더 직행 메뉴를 없애고 마이페이지에서만 들어오게
                하면서 주소도 정정(부고장·추모관 반반 화면이 됐으므로 `/my-obituaries`만으로는
                이제 부정확하다). */}
            <Route path="/my-obituaries-memorials" element={<MyObituaryListPage {...authProps} />} />
            <Route path="/pickup" element={<PickupPage {...authProps} />} />
            {/* 🔄 09-07 재정정 — 추모관은 부고장과 독립이라 "부고장 있으면 리다이렉트" 판정
                자체가 의미를 잃었다. MemorialPage가 직접 CRUD를 한다(로그인 시). */}
            <Route path="/memorial" element={<MemorialPage {...authProps} />} />
            <Route
              path="/mypage"
              element={
                <MyPage
                  {...authProps}
                  onOpenAccountSettings={() => { setMyPageMessage(null); setIsMyPageOpen(true); }}
                  onOpenProfile={() => setIsProfileOpen(true)}
                  onOpenFamilyDesignation={() => setIsFamilyDesignationOpen(true)}
                  onLogout={() => handleLogout()}
                />
              }
            />
            {/* 00-36 §4.6(SCR-020) — 마이페이지 나에게 공유된 것 구간의 착지 화면 */}
            <Route path="/family-shared" element={<FamilySharedPage {...authProps} />} />
            {/* 00-36 §4.4(SCR-019) — 마이페이지 `내 활동과 계정` > `내 상담 내역`의 착지 화면 */}
            <Route path="/my-consultations" element={<MyConsultationsPage {...authProps} />} />
            {/* 00-36 §4.7(SCR-021) — 마이페이지 `내가 남긴 것` > `내가 남긴 방명록`의 착지 화면(1차 읽기 전용) */}
            <Route path="/my-guestbook" element={<MyGuestbookPage {...authProps} />} />
            {/* 법적 문서 — docs 00-19/00-21 v0.9 초안. 게시 게이트(00-18 §8.1) 통과 전까지
                LegalDocLayout 상단 배너로 "시행 준비 중"을 고지한다. */}
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            {/* B2C 소셜 로그인과 무관한 별도 포털 — 진입은 LoginModal 하단 분기 + Footer 링크(00-06 §7.3) */}
            <Route path="/partner" element={<PartnerPortalPage />} />
            {/* 운영자 전용 — 어디에도 링크 노출 안 함, 직접 URL(/admin)로만 접근 */}
            <Route path="/admin" element={<AdminPage />} />
            {/* 알 수 없는 경로는 전부 홈으로 (기존 switch의 default 분기와 동일 동작) */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* 하단 푸터 (홈 메인 탭·prep·bereaved는 각자의 풀페이지 스냅 스크롤 내부 마지막
            섹션으로 Footer를 직접 통합한다 — 2026-08-25: DomainOverviewPage(삭제됨)를 바깥(body)
            스크롤과 안쪽 스냅 스크롤이 따로 노는 구조로 뒀더니 "Footer가 다른 페이지 위에
            뜬 것처럼 보인다"는 지적을 받았다. 포털 경로는 최소 상단 바로 대체) */}
        {!isPortalRoute && activeTab !== 'home' && activeTab !== 'prep' && activeTab !== 'bereaved' && <Footer />}
      </div>
        </>
      )}

      {/* 로그인 / 회원가입 데모 모달 — 내부에 로그인·회원가입 탭 분리(2026-08-25, LoginModal.tsx) */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        initialTab={loginModalTab}
        initialNotice={loginModalNotice}
      />

      {/* 가입 시점 동일 이메일 감지 -> [계정 통합] vs [독립 신규 가입] 선택 모달 */}
      {socialLinkPrompt && (
        <SocialLinkModal
          isOpen={true}
          tempToken={socialLinkPrompt.tempToken}
          email={socialLinkPrompt.email}
          existingProvider={socialLinkPrompt.existingProvider}
          newProvider={socialLinkPrompt.newProvider}
          onResolved={({ token, name, provider }) => {
            handleLoginSuccess(name, provider, token);
            setSocialLinkPrompt(null);
          }}
          onClose={() => setSocialLinkPrompt(null)}
        />
      )}

      {/* 마이페이지 소셜 계정 연동 설정 */}
      <MyPageAuthSettings
        isOpen={isMyPageOpen}
        onClose={() => setIsMyPageOpen(false)}
        initialMessage={myPageMessage}
      />

      {/* 마이페이지 > 내 정보(00-28) / 가족 지정(00-27) */}
      <MyPageProfile isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
      <MyPageFamilyDesignation isOpen={isFamilyDesignationOpen} onClose={() => setIsFamilyDesignationOpen(false)} />
      {/* 00-36 M-3 — 탈퇴 유예 중 로그인 시 복구 안내를 먼저 띄운다(자동 복구 아님). 어느 화면에서든 뜬다. */}
      <AccountRecoveryModal currentUser={currentUser} onLogout={() => handleLogout()} />
      {/* 00-36 §4.5-1 — 동의 기록 없는 기존 회원은 동의를 마칠 때까지 전체 화면 동의 창(닫기 불가). 유예 중이면 위 복구 안내가 먼저. */}
      <ConsentRequiredModal currentUser={currentUser} onLogout={() => handleLogout()} />
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}

export default App;
