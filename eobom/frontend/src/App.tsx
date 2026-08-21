import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation, useNavigate, useNavigationType } from 'react-router-dom';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Footer } from './components/Footer';
import { LoginModal } from './components/LoginModal';
import { SocialLinkModal } from './components/SocialLinkModal';
import { MyPageAuthSettings } from './components/MyPageAuthSettings';
import { EobomLogo } from './components/EobomLogo';
import { providerLabel } from './config';
import { NAV_MODE_STORAGE_KEY, type NavMode } from './modeNav';

import { HomePage } from './pages/HomePage';
import { FacilityPage } from './pages/FacilityPage';
import { CounselingPage } from './pages/CounselingPage';
import { DigitalEstatePage } from './pages/DigitalEstatePage';
import { EndingNotePage } from './pages/EndingNotePage';
import { CareGuidePage } from './pages/CareGuidePage';
import { ObituaryPage } from './pages/ObituaryPage';
import { ObituaryLandingPage } from './pages/ObituaryLandingPage';
import { PickupPage } from './pages/PickupPage';
import { MemorialPage } from './pages/MemorialPage';
import { MyPage } from './pages/MyPage';
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
  const isHomeRoute = activeTab === 'home';
  // docs 07-03 §6.1 — 부고장 랜딩(/o/:slug)은 껍데기(Header·Sidebar·Footer) 자체가 없는
  // 독립 페이지다. isPortalRoute가 partner·admin을 껍데기에서 빼는 패턴을 그대로 확장한다 —
  // 다만 포털은 최소 상단 바라도 남기는 반면, 이쪽은 그것도 없다(조의 화면에 서비스 메뉴가
  // 붙으면 광고로 읽힌다, §6.1). 카톡 링크를 받은 조문객이 비로그인으로 여는 화면이라
  // 로그인 게이트도 없다.
  const isObituaryLandingRoute = /^o\//.test(activeTab);
  // 게스트가 전달받은 추모관 링크(EntryBoxes.tsx 박스③)로 들어오는 화면 — 위 부고장 랜딩과
  // 같은 이유(비로그인 방문객, 서비스 메뉴가 붙으면 안 됨)로 껍데기 없이 그대로 노출한다.
  const isMemorialLandingRoute = /^m\//.test(activeTab);

  const [isLoginOpen, setIsLoginOpen] = useState<boolean>(false);
  // 모바일 햄버거 메뉴(드로어) 열림 상태 — 데스크톱은 기존 호버 사이드바 그대로,
  // 480px 이하에서만 Header의 햄버거 버튼으로 열고 Sidebar의 드로어로 보여준다(2026-08-20 지시).
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  // 2026-08-21: localStorage→sessionStorage로 전환(브라우저를 완전히 껐다 켜도 로그인이 남아있던
  // 문제 수정 — sessionStorage는 브라우저 종료 시 비워진다). 예전에 localStorage에 저장된 값은
  // 더 이상 안 읽지만 그대로 남아있으면 혼란을 주므로 최초 마운트 시 한 번 같이 지운다.
  const [currentUser, setCurrentUser] = useState<string | null>(() => {
    localStorage.removeItem('k_ending_current_user');
    localStorage.removeItem('k_ending_token');
    return sessionStorage.getItem('k_ending_current_user') || null;
  });

  // 00-26 §4.3 — 진입 모드(생전준비/유가족). localStorage로 날짜를 넘겨 기억한다(유족 행정 절차는
  // 여러 날에 걸침). ⚠️ 홈으로 돌아오면 4박스는 항상 보여야 하므로, 이 값으로 자동 이동시키지 않는다
  // — 사이드바 메뉴 선택에만 쓴다(§7.2).
  const [navMode, setNavMode] = useState<NavMode | null>(() => {
    const saved = localStorage.getItem(NAV_MODE_STORAGE_KEY);
    return saved === 'prep' || saved === 'bereaved' ? saved : null;
  });
  const handleSetNavMode = (mode: NavMode) => {
    setNavMode(mode);
    localStorage.setItem(NAV_MODE_STORAGE_KEY, mode);
  };

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
    if (tab === 'home') {
      window.dispatchEvent(new Event('eobom:home-scroll-top'));
    }

    navigate(tab === 'home' ? '/' : `/${tab}`);
  };

  // 탭이 바뀌면(메뉴 클릭이 아닌 다른 경로로 이동한 경우 포함) 열려있던 모바일 드로어를 닫는다.
  React.useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [activeTab]);

  // 탭 변경 시 스크롤 처리 (뒤로가기 시 복원, 메뉴 클릭 시 최상단)
  React.useEffect(() => {
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
        window.history.replaceState(null, '', '/');
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
      const messages: Record<string, string> = {
        kakao_failed: '카카오 로그인에 실패했습니다. 다시 시도해주세요.',
        naver_failed: '네이버 로그인에 실패했습니다. 다시 시도해주세요.',
        google_failed: '구글 로그인에 실패했습니다. 다시 시도해주세요.',
        auth_failed: '소셜 로그인 인증에 실패했습니다. 다시 시도해주세요.',
        server_error: '서버 오류로 로그인에 실패했습니다. 잠시 후 다시 시도해주세요.',
      };
      alert(messages[loginError] || '로그인에 실패했습니다. 다시 시도해주세요.');
      // 쿼리스트링 정리 (새로고침해도 에러 메시지가 다시 뜨지 않도록)
      window.history.replaceState(null, '', window.location.pathname + window.location.hash);
    }
  }, []);

  const handleLoginSuccess = (username: string, provider?: string, token?: string) => {
    const displayName = provider ? `${username} (${provider})` : username;
    setCurrentUser(displayName);
    sessionStorage.setItem('k_ending_current_user', displayName);
    if (token) {
      sessionStorage.setItem('k_ending_token', token);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('k_ending_current_user');
    sessionStorage.removeItem('k_ending_token');
    alert('로그아웃 되었습니다.');
  };

  const authProps = {
    currentUser,
    onOpenLogin: () => setIsLoginOpen(true),
    setActiveTab,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {isObituaryLandingRoute || isMemorialLandingRoute ? (
        // 껍데기 완전히 없음(§6.1) — Header·Sidebar·main-wrapper·Footer 전부 건너뛴다.
        <Routes>
          <Route path="/o/:slug" element={<ObituaryLandingPage />} />
          <Route path="/m/:slug" element={<MemorialPage />} />
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
            boxShadow: '0 2px 10px rgba(0,0,0,0.12)'
          }}
        >
          <Link to="/" style={{ display: 'inline-flex', lineHeight: 0 }}>
            <EobomLogo variant="header" height={30} />
          </Link>
          <Link to="/" style={{ fontSize: '0.9rem', color: '#D1D5DB', textDecoration: 'underline' }}>
            이어봄 홈으로
          </Link>
        </div>
      ) : (
        <>
          {/* 상단 네비게이션 헤더 */}
          <Header
            setActiveTab={setActiveTab}
            onOpenLogin={() => setIsLoginOpen(true)}
            onOpenAccountSettings={() => { setMyPageMessage(null); setIsMyPageOpen(true); }}
            currentUser={currentUser}
            onLogout={handleLogout}
            navMode={isHomeRoute ? null : navMode}
            onSetMode={handleSetNavMode}
            onOpenMobileMenu={isHomeRoute ? undefined : () => setIsMobileMenuOpen(true)}
          />

          {/* 좌측 호버 확장 사이드바(데스크톱) + 모바일 드로어 — 홈(4박스가 유일한 진입점)에서는 숨긴다(00-26 §7.2) */}
          {!isHomeRoute && (
            <Sidebar
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              navMode={navMode}
              currentUser={currentUser}
              onOpenLogin={() => setIsLoginOpen(true)}
              mobileOpen={isMobileMenuOpen}
              onMobileClose={() => setIsMobileMenuOpen(false)}
              onOpenAccountSettings={() => { setMyPageMessage(null); setIsMyPageOpen(true); }}
              onLogout={handleLogout}
            />
          )}
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
        <main style={{ flexGrow: 1 }}>
          <Routes>
            <Route path="/" element={<HomePage {...authProps} onSetMode={handleSetNavMode} />} />
            <Route path="/facility" element={<FacilityPage {...authProps} />} />
            <Route path="/counseling" element={<CounselingPage {...authProps} />} />
            <Route path="/digital-estate" element={<DigitalEstatePage {...authProps} />} />
            <Route path="/ending-note" element={<EndingNotePage {...authProps} />} />
            <Route path="/care-guide" element={<CareGuidePage {...authProps} />} />
            <Route path="/obituary" element={<ObituaryPage {...authProps} />} />
            <Route path="/pickup" element={<PickupPage {...authProps} />} />
            <Route path="/memorial" element={<MemorialPage {...authProps} />} />
            <Route
              path="/mypage"
              element={<MyPage {...authProps} onOpenAccountSettings={() => { setMyPageMessage(null); setIsMyPageOpen(true); }} />}
            />
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

        {/* 하단 푸터 (홈 메인 탭은 풀페이지 스냅 스크롤 내부 섹션으로 통합, 포털 경로는 최소 상단 바로 대체) */}
        {!isPortalRoute && activeTab !== 'home' && <Footer />}
      </div>
        </>
      )}

      {/* 로그인 / 회원가입 데모 모달 */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={handleLoginSuccess}
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
