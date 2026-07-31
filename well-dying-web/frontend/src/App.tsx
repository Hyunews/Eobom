import React, { useState } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Footer } from './components/Footer';
import { FloatingEmergency } from './components/FloatingEmergency';
import { LoginModal } from './components/LoginModal';

import { HomePage } from './pages/HomePage';
import { FacilityPage } from './pages/FacilityPage';
import { CounselingPage } from './pages/CounselingPage';
import { DigitalEstatePage } from './pages/DigitalEstatePage';
import { EndingNotePage } from './pages/EndingNotePage';
import { CareGuidePage } from './pages/CareGuidePage';

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

  const handleLoginSuccess = (username: string) => {
    setCurrentUser(username);
    localStorage.setItem('k_ending_current_user', username);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('k_ending_current_user');
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
    </div>
  );
}

export default App;
