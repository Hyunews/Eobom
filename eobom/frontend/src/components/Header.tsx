import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { UserCheck, LogIn, LogOut, Settings, Menu } from 'lucide-react';
import { EobomLogo } from './EobomLogo';
import type { NavMode } from '../modeNav';

interface HeaderProps {
  setActiveTab: (tab: string) => void;
  onOpenLogin: () => void;
  onOpenAccountSettings: () => void;
  currentUser: string | null;
  onLogout: () => void;
  onSetMode?: (mode: NavMode) => void;
  // 480px 이하에서만 노출되는 햄버거 버튼(.mobile-menu-trigger, index.css) — Sidebar.tsx의
  // 모바일 드로어를 연다. 사이드바 자체가 없는 홈에서는 App.tsx가 undefined를 넘겨 숨긴다.
  onOpenMobileMenu?: () => void;
}

// 메인 홈 A안 재구성(2026-08) — 로고 옆 "모드 드롭다운" 1개 대신, 로그인 시에만 보이는
// "홈"·"생전 준비"·"임종·사후 정리"·"추모관" 4개를 평면 메뉴로 노출한다(개발자 확정 —
// 비로그인 시 "홈"도 숨김). 헤더는 전역 공용 컴포넌트라 이 변경은 모든 페이지에 적용된다.
// "생전 준비"·"임종·사후 정리"는 박스를 직접 클릭한 것과 동일하게 ?entry=box1/box2로 이동해
// BoxDetailOverlay를 바로 연다(EntryBoxes.tsx의 handleBox1Click/handleBox2Click과 동일 목적지 —
// 풀페이지 섹션까지만 스크롤하던 이전 방식에서 변경, 개발자 확정). "추모관"은 대응하는 오버레이가
// 없어(박스③은 링크 입력창일 뿐) 홈의 캐러셀 섹션까지만 스크롤한다.
export const Header: React.FC<HeaderProps> = ({ setActiveTab, onOpenLogin, onOpenAccountSettings, currentUser, onLogout, onSetMode, onOpenMobileMenu }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';

  const goHome = () => {
    setActiveTab('home');
  };

  // 박스①②를 직접 누른 것과 동일한 목적지(?entry=box1|box2)로 보낸다. setActiveTab('home')을
  // 먼저 불러 "떠나는 탭의 스크롤 위치 저장" 등 기존 부기(簿記)를 그대로 타게 하고, 그 직후
  // 쿼리스트링을 얹어 push한다(EntryBoxes.tsx의 handleBox1Click/handleBox2Click과 동일하게
  // — 2026-08 변경: 뒤로가기 한 번으로 오버레이가 닫히게 하려면 "홈(오버레이 없음)"과
  // "홈+오버레이"가 서로 다른 히스토리 엔트리여야 한다). 오버레이는 화면 전체를 덮는 고정
  // 레이어라 배경(HomePage) 스크롤 위치는 안 보이지만, 오버레이를 닫았을 때 자연스럽게
  // "어떤 도움이 필요하신가요" 섹션이 보이도록 eobom_scroll_home도 같이 남겨 둔다.
  const goToBoxEntry = (box: 'box1' | 'box2', mode: NavMode) => {
    onSetMode?.(mode);
    setActiveTab('home');
    sessionStorage.setItem('eobom_scroll_home', '1');
    navigate(`/?entry=${box}`);
  };

  // "추모관"은 대응하는 박스 오버레이가 없어 섹션 스크롤까지만 한다. 홈이 아닌 페이지에서는
  // "홈으로 이동 후 섹션 스크롤"이 필요한데, setActiveTab('home')이 이동 시점에 eobom_scroll_home을
  // 지워 최상단(히어로)으로 여는 게 기본 동작이라(App.tsx), 그 직후 세션값을 다시 심어 HomePage
  // 마운트 시 섹션 1(EntryBoxes)로 열리게 한다. 이미 홈이면 라우트가 안 바뀌어 HomePage가
  // 리마운트되지 않으므로, "홈으로 스크롤 맨 위" 때와 같은 방식(커스텀 이벤트)으로 알린다.
  const goToEntrySection = () => {
    if (isHome) {
      window.dispatchEvent(new Event('eobom:home-scroll-to-entry'));
    } else {
      setActiveTab('home');
      sessionStorage.setItem('eobom_scroll_home', '1');
    }
  };

  return (
    <header className="site-header">
      <div className="header-inner">
        {/* 모바일 햄버거 메뉴 버튼 — 480px 이하에서만 보임(.mobile-menu-trigger, index.css).
            사이드바가 호버로 안 열리는 터치 환경 대체 진입점(2026-08-20 지시, Sidebar.tsx 드로어 연동). */}
        {onOpenMobileMenu && (
          <button
            type="button"
            onClick={onOpenMobileMenu}
            aria-label="메뉴 열기"
            className="mobile-menu-trigger header-hamburger-btn"
          >
            <Menu size={20} />
          </button>
        )}

        {/* 브랜드 로고 — 클릭 시 항상 홈(4박스)로(00-26 §4.4 C안). variant="symbol"은 밝은
            배경(A안 흰 헤더)에 맞는 네이비/그린 배색을 쓴다 — 기존 "header" variant는 다크 배경
            전제(흰 글자)라 흰 헤더에서는 보이지 않는다. */}
        <div
          onClick={goHome}
          className="header-logo-wrap"
          title="이어봄 (Eobom) 디지털 엔딩 & 웰다잉 토탈 케어 플랫폼"
        >
          <EobomLogo variant="symbol" height={42} />
        </div>

        {/* 헤더 메뉴 — 4개 전부 로그인 상태에서만 노출(개발자 확정, 비로그인 시 "홈"도 숨김).
            판별은 기존 인증 상태(currentUser)를 그대로 쓴다 — 새 상태를 만들지 않는다.
            비로그인 시에는 메뉴 전체가 렌더되지 않을 뿐이라 레이아웃은 그대로 유지된다
            (header-spacer가 남는 공간을 흡수한다). */}
        {currentUser && (
          <nav className="header-nav">
            <button type="button" className="header-nav-item" onClick={goHome}>홈</button>
            <button type="button" className="header-nav-item" onClick={() => goToBoxEntry('box1', 'prep')}>생전 준비</button>
            <button type="button" className="header-nav-item" onClick={() => goToBoxEntry('box2', 'bereaved')}>임종·사후 정리</button>
            <button type="button" className="header-nav-item" onClick={goToEntrySection}>추모관</button>
          </nav>
        )}

        {/* 로고·메뉴와 우측 그룹 사이 여백 채우기 */}
        <div className="header-spacer" />

        {/* 우측 로그인 / 회원가입 상태 버튼 — 회원가입 전용 버튼·경로는 만들지 않는다(개발자 확정).
            로그인/회원가입은 기존 LoginModal 하나로 통합돼 있다(소셜 로그인이 곧 최초 가입). */}
        <div className="header-actions-wrap">
          {currentUser ? (
            <div className="header-user-group">
              <span
                onClick={() => setActiveTab('mypage')}
                title="마이페이지"
                className="header-user-chip"
              >
                <UserCheck size={16} color="var(--point-color)" style={{ flexShrink: 0 }} />
                <span className="header-user-name-text">{currentUser}님</span>
              </span>
              {/* 480px 이하에서 햄버거+로고+메뉴+사용자칩+이 두 버튼까지 겹치며 헤더가 깨지는 문제(2026-08-20
                  발견) — 모바일 드로어가 있는 경로(onOpenMobileMenu 존재)에서는 이 두 버튼을 헤더에서 숨기고
                  Sidebar.tsx 드로어 하단으로 옮긴다. 드로어가 없는 홈에서는 대체 진입점이 없으므로 그대로 둔다. */}
              <div
                className={`header-account-buttons${onOpenMobileMenu ? ' header-account-buttons--has-drawer' : ''}`}
              >
                <button onClick={onOpenAccountSettings} className="header-outline-btn">
                  <Settings size={14} /> <span className="header-btn-label">계정 연동</span>
                </button>
                <button onClick={onLogout} className="header-outline-btn">
                  <LogOut size={14} /> <span className="header-btn-label">로그아웃</span>
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="btn btn-point"
              style={{ height: '44px', padding: '0 1.2rem', fontSize: '0.9rem' }}
            >
              <LogIn size={16} /> <span className="header-btn-label">로그인 / 회원가입</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
