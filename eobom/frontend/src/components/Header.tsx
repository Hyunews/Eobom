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
// 2026-08-24 — "생전 준비"·"임종·사후 정리"는 박스 소개 오버레이가 아니라 실제 화면
// (/ending-note, /care-guide)으로 직접 이동한다. "추모관"은 대응하는 오버레이가 없어(박스③은
// 링크 입력창일 뿐) 홈의 진입 4박스 캐러셀에서 박스③이 있는 페이지까지 직접 넘긴다(아래
// goToMemorialEntry 참고 — 예전엔 섹션 스크롤까지만 해서 캐러셀이 첫 페이지에 멈춰 있는 버그가 있었다).
export const Header: React.FC<HeaderProps> = ({ setActiveTab, onOpenLogin, onOpenAccountSettings, currentUser, onLogout, onSetMode, onOpenMobileMenu }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';

  const goHome = () => {
    setActiveTab('home');
  };

  // 2026-08-24 변경 — "생전 준비"·"임종·사후 정리"는 예전엔 홈으로 이동시켜 박스①②의
  // 풀스크린 오버레이(슬라이드 소개)를 여는 방식이었는데, 로그인 상태에서 헤더로 자주 오가는
  // 사용자 입장에선 소개 슬라이드보다 실제 화면(엔딩노트 작성기·행정 체크리스트)으로 바로
  // 가는 게 더 유용하다는 피드백으로 직접 라우트 이동으로 바꿨다. onSetMode는 그대로 유지 —
  // Sidebar 등 다른 화면의 모드 표시가 여전히 이 클릭을 기준으로 맞아야 한다.
  const goToEndingNote = () => {
    onSetMode?.('prep');
    setActiveTab('ending-note');
  };

  const goToCareGuide = () => {
    onSetMode?.('bereaved');
    setActiveTab('care-guide');
  };

  // "추모관"은 박스③(추모관 링크 입력창)이 대응하는데, 이건 박스①②와 달리 풀스크린
  // 오버레이가 없고 홈의 진입 4박스 캐러셀 "두 번째 페이지"에만 있다. 예전엔 섹션까지만
  // 스크롤시켰는데, 캐러셀이 항상 첫 페이지(박스①②)로 시작해서 실제로는 박스③ 링크 입력창이
  // 안 보이는 채로 끝났다(2026-08-24 확인된 버그) — 그래서 EntryBoxes.tsx가 이미 쓰는
  // ?entry=box1|box2 쿼리 관례를 box3까지 넓혀서, 페이지 전환까지 시킨다.
  //
  // 2026-08-24 추가 수정 — 처음엔 setActiveTab('home')(내부에서 navigate('/') 호출) 다음에
  // navigate('/?entry=box3')를 또 불렀는데, 홈이 아닌 다른 페이지에서 진입할 때 같은 핸들러
  // 안에서 navigate()를 연달아 두 번 호출하는 게 두 번째 호출을 씹어버려(홈 맨 위에만 도착,
  // entry 파라미터가 안 붙음) 실제로 재현됐다 — navigate는 이 함수당 정확히 한 번만 부른다.
  // setActiveTab이 대신 해주던 "떠나는 페이지 스크롤 위치 기억"만 직접 남겨둔다.
  const goToMemorialEntry = () => {
    if (isHome) {
      window.dispatchEvent(new Event('eobom:home-scroll-to-entry'));
    } else {
      const leavingTab = location.pathname.replace(/^\//, '') || 'home';
      if (leavingTab !== 'home') {
        sessionStorage.setItem(`eobom_scroll_${leavingTab}`, String(window.scrollY));
      }
      sessionStorage.setItem('eobom_scroll_home', '1');
    }
    navigate('/?entry=box3');
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
            <button type="button" className="header-nav-item" onClick={goToEndingNote}>생전 준비</button>
            <button type="button" className="header-nav-item" onClick={goToCareGuide}>임종·사후 정리</button>
            <button type="button" className="header-nav-item" onClick={goToMemorialEntry}>추모관</button>
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
              {/* 640px 이하는 .header-btn-label이 숨겨져 LogIn 아이콘만 남는데, "출구"처럼
                  보인다는 지적(2026-08-25 개발자 실기기 확인) — 그 폭에서만 짧은 "로그인" 텍스트를
                  대신 보여준다(전체 텍스트 "로그인 / 회원가입"은 좁은 헤더에서 폭이 부족하다). */}
              <LogIn size={16} />{' '}
              <span className="header-btn-label">로그인 / 회원가입</span>
              <span className="header-btn-label-short">로그인</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
