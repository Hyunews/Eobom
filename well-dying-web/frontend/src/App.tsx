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
  const [activeTab, setActiveTab] = useState<string>('home');
  const [isLoginOpen, setIsLoginOpen] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  const handleLoginSuccess = (username: string) => {
    setCurrentUser(username);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    alert('로그아웃 되었습니다.');
  };

  const renderPage = () => {
    switch (activeTab) {
      case 'home':
        return <HomePage />;
      case 'facility':
        return <FacilityPage />;
      case 'counseling':
        return <CounselingPage />;
      case 'digital-estate':
        return <DigitalEstatePage />;
      case 'ending-note':
        return <EndingNotePage />;
      case 'care-guide':
        return <CareGuidePage />;
      default:
        return <HomePage />;
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
