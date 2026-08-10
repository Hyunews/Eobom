import React, { useState } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Footer } from './components/Footer';
import { FloatingEmergency } from './components/FloatingEmergency';
import { LoginModal } from './components/LoginModal';
import { SocialLinkModal } from './components/SocialLinkModal';
import { MyPageAuthSettings } from './components/MyPageAuthSettings';
import { providerLabel } from './config';

import { HomePage } from './pages/HomePage';
import { FacilityPage } from './pages/FacilityPage';
import { CounselingPage } from './pages/CounselingPage';
import { DigitalEstatePage } from './pages/DigitalEstatePage';
import { EndingNotePage } from './pages/EndingNotePage';
import { CareGuidePage } from './pages/CareGuidePage';
import { MyPage } from './pages/MyPage';
import { PartnerPortalPage } from './pages/PartnerPortalPage';
import { AdminPage } from './pages/AdminPage';

export function App() {
  // F5 새로고침 및 브라우저 뒤로가기 시에도 현재 탭과 로그인 유지
  // 웹 주소로 새로 들어올 때는 항상 홈화면이 기본으로 보이도록 설정
  const [activeTab, setActiveTabState] = useState<string>(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash) return hash;
    return 'home';
  });

  const [isLoginOpen, setIsLoginOpen] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<string | null>(() => {
    return localStorage.getItem('k_ending_current_user') || null;
  });

  // 가입 시 이메일 중복 감지 -> [계정 통합] vs [독립 신규 가입] 선택 모달 상태
  const [socialLinkPrompt, setSocialLinkPrompt] = useState<{
    tempToken: string;
    email: string;
    existingProvider: string;
    newProvider: string;
  } | null>(null);

  // 마이페이지 소셜 계정 연동 설정 모달 상태
  const [isMyPageOpen, setIsMyPageOpen] = useState<boolean>(false);
  const [myPageMessage, setMyPageMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 이동 타입 구분 플래그: 'menu' (메뉴 클릭 -> 최상단 0) vs 'back' (뒤로가기 -> 이전 위치 복원)
  const isBackNavigation = React.useRef<boolean>(false);

  // 메뉴/버튼 직접 클릭으로 페이지 이동 시 호출
  const setActiveTab = (tab: string) => {
    // 1. 현재 떠나는 탭의 위치 기록 (뒤로가기로 되돌아올 때 복원용)
    if (activeTab !== 'home') {
      sessionStorage.setItem(`eobom_scroll_${activeTab}`, String(window.scrollY));
    }

    // 2. 메뉴 직접 클릭이므로 타겟 탭의 저장된 스크롤 위치 삭제 (최상단 개봉)
    sessionStorage.removeItem(`eobom_scroll_${tab}`);
    isBackNavigation.current = false;

    setActiveTabState(tab);
    window.location.hash = tab;
    localStorage.setItem('k_ending_active_tab', tab);
  };

  // 브라우저 뒤로가기 / 앞으로가기 (hashchange) 이벤트 처리
  React.useEffect(() => {
    const handleHashChange = () => {
      // 뒤로가기/앞으로가기 시에는 복원 모드 활성화
      isBackNavigation.current = true;
      const hash = window.location.hash.replace('#', '');
      const targetTab = hash || 'home';
      setActiveTabState(targetTab);
      localStorage.setItem('k_ending_active_tab', targetTab);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // 탭 변경 시 스크롤 처리 (뒤로가기 시 복원, 메뉴 클릭 시 최상단)
  React.useEffect(() => {
    if (activeTab !== 'home') {
      if (isBackNavigation.current) {
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

  // 백엔드 소셜 로그인 리다이렉트 콜백 파싱 (예: #loginSuccess?token=...&name=...)
  React.useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('loginSuccess')) {
      const urlParams = new URLSearchParams(hash.split('?')[1]);
      const token = urlParams.get('token');
      const name = urlParams.get('name');
      const provider = urlParams.get('provider');

      if (name) {
        handleLoginSuccess(name, provider || undefined, token || undefined);
        // Hash 정리
        window.history.replaceState(null, '', window.location.pathname + '#home');
        setActiveTabState('home');
      }
    }
  }, []);

  // 가입 시점 동일 이메일 감지 콜백 파싱 (예: #socialLinkPrompt?tempToken=...&email=...)
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
      window.history.replaceState(null, '', window.location.pathname + '#home');
      setActiveTabState('home');
    }
  }, []);

  // 마이페이지 소셜 계정 추가 연동 리다이렉트 콜백 파싱 (예: #mypage?linkSuccess=KAKAO / ?linkError=...)
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
      window.history.replaceState(null, '', window.location.pathname + '#home');
      setActiveTabState('home');
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
    localStorage.setItem('k_ending_current_user', displayName);
    if (token) {
      localStorage.setItem('k_ending_token', token);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('k_ending_current_user');
    localStorage.removeItem('k_ending_token');
    alert('로그아웃 되었습니다.');
  };

  const renderPage = () => {
    const authProps = {
      currentUser,
      onOpenLogin: () => setIsLoginOpen(true),
      setActiveTab
    };

    switch (activeTab) {
      case 'home':
        return <HomePage {...authProps} />;
      case 'facility':
        return <FacilityPage {...authProps} />;
      case 'counseling':
        return <CounselingPage {...authProps} />;
      case 'digital-estate':
        return <DigitalEstatePage {...authProps} />;
      case 'ending-note':
        return <EndingNotePage {...authProps} />;
      case 'care-guide':
        return <CareGuidePage {...authProps} />;
      case 'mypage':
        return <MyPage {...authProps} onOpenAccountSettings={() => { setMyPageMessage(null); setIsMyPageOpen(true); }} />;
      case 'partner':
        // B2C 소셜 로그인과 무관한 별도 포털 — Header/Sidebar 메뉴에는 올리지 않고 Footer 링크로만 접근
        return <PartnerPortalPage />;
      case 'admin':
        // 운영자 전용 — 어디에도 링크 노출 안 함, 직접 URL(#admin)로만 접근
        return <AdminPage />;
      default:
        return <HomePage {...authProps} />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* 상단 네비게이션 헤더 */}
      <Header
        setActiveTab={setActiveTab}
        onOpenLogin={() => setIsLoginOpen(true)}
        onOpenAccountSettings={() => { setMyPageMessage(null); setIsMyPageOpen(true); }}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* 좌측 호버 확장 사이드바 */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* 메인 콘텐츠 영역 (사이드바 공간 확보 wrapper) */}
      <div className="main-wrapper">
        <main style={{ flexGrow: 1 }}>
          {renderPage()}
        </main>

        {/* 1-Touch 긴급 상담 플로팅 버튼 */}
        <FloatingEmergency />

        {/* 하단 푸터 (홈 메인 탭은 풀페이지 스냅 스크롤 내부 섹션 6으로 통합) */}
        {activeTab !== 'home' && <Footer />}
      </div>

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

export default App;
