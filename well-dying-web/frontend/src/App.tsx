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

  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    window.location.hash = tab;
    localStorage.setItem('k_ending_active_tab', tab);
  };

  React.useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        setActiveTabState(hash);
        localStorage.setItem('k_ending_active_tab', hash);
      } else {
        setActiveTabState('home');
        localStorage.setItem('k_ending_active_tab', 'home');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

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

        {/* 하단 푸터 */}
        <Footer />
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
