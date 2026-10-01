import React from 'react';
import { UserCheck, LogIn, LogOut, Menu, ChevronDown } from 'lucide-react';
import { EobomLogo } from './EobomLogo';
import { MODE_MENUS, type NavMode, type ModeMenuItem } from '../lib/modeNav';
import { PageLink, tabPath } from './common/PageLink';

interface HeaderProps {
  setActiveTab: (tab: string) => void;
  onOpenLogin: () => void;
  currentUser: string | null;
  onLogout: () => void;
  // 480px 이하에서만 노출되는 햄버거 버튼(.mobile-menu-trigger, index.css) — Sidebar.tsx의
  // 모바일 드로어를 연다. 사이드바 자체가 없는 홈에서는 App.tsx가 undefined를 넘겨 숨긴다.
  onOpenMobileMenu?: () => void;
  // 🆕 00-40 §3.3 M-10 — 모바일 홈(및 /prep·/bereaved)에서만 App.tsx가 넘긴다. 헤더가 그
  // 칸 위에 겹쳐 칸의 배경처럼 보인다. 데스크톱·다른 페이지는 항상 undefined(기본 흰 sticky 헤더).
  // 🔄 2026-09-28 사람 지시 — 칸 배경색을 헤더에 그대로 입히면 스크롤 중 다음 칸 색이
  // 헤더에 먼저 씌워지는 것처럼 보였다(스크롤 진행률이 아니라 "어느 칸이 활성인지"만으로
  // 색을 정했기 때문) — 그래서 배경은 항상 투명으로 고정하고, variant는 로고·햄버거
  // 아이콘 색(히어로=흰색·그 외=진한 색)에만 쓴다.
  homeMobileOverlay?: { variant: 'hero' | 'panel' };
}

// 메인 홈 A안 재구성(2026-08) — 로고 옆 "모드 드롭다운" 1개 대신 "홈"·"생전 준비"·
// "임종·사후 정리" 3개를 평면 메뉴로 노출한다. 헤더는 전역 공용 컴포넌트라 이 변경은
// 모든 페이지에 적용된다.
// 2026-08-24 — "생전 준비"·"임종·사후 정리"는 박스 소개 오버레이가 아니라 실제 화면
// (/ending-note, /care-guide)으로 직접 이동한다.
// 🔄 00-39 §6-3(2026-09-18) — 좌측 72px 사이드바 폐지에 따라 두 모드 버튼에 호버
// 드롭다운을 달아 그 사이드바가 하던 역할(모드별 세부 메뉴 진입)을 대신한다. 동시에
// 사람 확정으로 이 메뉴 전체를 비로그인 상태에서도 노출한다("홈" 숨김 방침 해제) —
// 사이드바가 없어지면 비로그인 사용자가 페이지를 옮겨 다닐 다른 수단이 없기 때문이다.
// 🔄 09-07 사용자 지시 — 예전엔 네 번째 메뉴로 "내 부고장"(→ `/my-obituaries-memorials`,
// 구 라벨 "추모관")이 있었다. 사이드바의 "디지털 추모관"(→ `/memorial`, 다른 화면)과 이름이
// 겹쳐 혼란이 있었던 데다, 그 화면은 이제 **마이페이지에서만** 들어가게 정리해 헤더에서는
// 아예 뺐다(MyPage.tsx의 "내 부고장" 통계 칸이 그 유일한 통로가 됨).
export const Header: React.FC<HeaderProps> = ({ setActiveTab, onOpenLogin, currentUser, onLogout, onOpenMobileMenu, homeMobileOverlay }) => {
  const goHome = () => {
    setActiveTab('home');
  };

  // 00-40 §3.3 M-10 — 히어로 칸 위(투명)에서는 로고·햄버거·사용자 버튼을 흰색으로. 배경은
  // 항상 투명(위 homeMobileOverlay 주석 참고) — 로고 숨김·버튼 투명화는 index.css
  // `.site-header--home-overlay`가, 히어로 전용 흰색은 `-hero` 변형이 담당한다
  // (🔄 2026-09-28 사람 지시 — 로고 삭제 + 메뉴·사용자 버튼 배경 삭제).
  const isHeroOverlay = homeMobileOverlay?.variant === 'hero';
  const headerClassName = homeMobileOverlay
    ? `site-header site-header--home-overlay${isHeroOverlay ? ' site-header--home-overlay-hero' : ''}`
    : 'site-header';

  // (2026-08-24 — 모드 버튼은 소개 오버레이가 아니라 실제 화면으로 직접 이동한다.)
  // 00-39 §6-3(2026-09-18) — 좌측 72px 사이드바 폐지, 모드 버튼 호버 드롭다운으로 대체.
  // 메뉴 구성은 modeNav.ts(MODE_MENUS)가 정본. 개별 항목은 Sidebar.tsx가 쓰던 것과 같은
  // loginRequired 게이트를 그대로 따른다 — 헤더 메뉴 자체는 로그인 여부와 무관하게 항상
  // 노출한다(비로그인 사용자가 사이드바 없이도 페이지를 옮겨 다닐 수 있어야 하므로,
  // 2026-09-18 사람 확정 — 항목 클릭 시 loginRequired면 로그인 모달로 게이트).
  // 🔄 09-29 — 이동 메뉴는 링크(PageLink, 00-34 §2.2). loginRequired인 항목은 비로그인이면 PageLink가
  // 링크가 아니라 버튼으로 그려 로그인 창만 연다(우클릭 "새 탭에서 열기"가 아예 없게).
  // 여기 남은 건 보통 클릭 때만 도는 기존 부가 동작(스크롤 저장·이동).
  const goToModeItem = (item: ModeMenuItem) => {
    setActiveTab(item.id);
  };

  // 모드 버튼 자체를 클릭하면 그 드롭다운의 첫 항목 화면으로 간다(MODE_MENUS가 정본이라
  // 메뉴 순서가 바뀌어도 따라간다). 첫 항목의 loginRequired 게이트도 같이 적용된다.
  const modeLinkProps = (mode: NavMode, item: ModeMenuItem) => ({
    to: tabPath(item.id),
    loginRequired: item.loginRequired,
    currentUser,
    onOpenLogin,
    onNavigate: () => goToModeItem(item),
  });

  return (
    <header className={headerClassName}>
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
            전제(흰 글자)라 흰 헤더에서는 보이지 않는다. 00-40 §3.3 M-10 — 히어로 칸(투명) 위에서만
            다시 "header" variant(흰 워드마크)로 돌아간다. */}
        <PageLink
          to="/"
          look="plain"
          onNavigate={goHome}
          className="header-logo-wrap"
          title="이어봄 (Eobom) 디지털 엔딩 & 웰다잉 토탈 케어 플랫폼"
        >
          <EobomLogo variant={isHeroOverlay ? 'header' : 'symbol'} height={42} />
        </PageLink>

        {/* 헤더 메뉴 — 00-39 §6-3(2026-09-18) 사람 확정으로 로그인 여부와 무관하게 항상
            노출한다(사이드바 폐지로 비로그인 사용자의 유일한 내비게이션 수단이 됨). 로그인이
            필요한 개별 항목은 클릭 시 goToModeItem이 로그인 모달로 게이트한다.
            00-40 §3.3 M-10 — 모바일 홈에서는 이 평면 메뉴 대신 햄버거+드로어만 쓴다(새 모바일
            메뉴 구성은 분기3 범위 밖) — index.css의 640px 숨김과 별개로 여기서도 끈다(모바일
            홈의 768px 경계가 그 640px 숨김 폭보다 넓어 641~768px 구간이 남기 때문). */}
        {!homeMobileOverlay && (
        <nav className="header-nav">
          <PageLink to="/" className="header-nav-item" onNavigate={goHome}>홈</PageLink>
          <div className="hdr-mode">
            <PageLink className="header-nav-item hdr-mode-trigger" {...modeLinkProps('prep', MODE_MENUS.prep[0])}>
              생전 준비 <ChevronDown size={14} />
            </PageLink>
            <div className="hdr-mode-panel">
              {MODE_MENUS.prep.map((item) => (
                <PageLink key={item.id} className="hdr-mode-item" {...modeLinkProps('prep', item)}>
                  <span>{item.label}</span>
                  {item.status === 'preview' && <span className="v2-badge-neutral">준비 중</span>}
                </PageLink>
              ))}
            </div>
          </div>
          <div className="hdr-mode">
            <PageLink className="header-nav-item hdr-mode-trigger" {...modeLinkProps('bereaved', MODE_MENUS.bereaved[0])}>
              임종·사후 정리 <ChevronDown size={14} />
            </PageLink>
            <div className="hdr-mode-panel">
              {MODE_MENUS.bereaved.map((item) => (
                <PageLink key={item.id} className="hdr-mode-item" {...modeLinkProps('bereaved', item)}>
                  <span>{item.label}</span>
                  {item.status === 'preview' && <span className="v2-badge-neutral">준비 중</span>}
                </PageLink>
              ))}
            </div>
          </div>
        </nav>
        )}

        {/* 로고·메뉴와 우측 그룹 사이 여백 채우기 */}
        <div className="header-spacer" />

        {/* 우측 로그인 / 회원가입 상태 버튼 — 회원가입 전용 버튼·경로는 만들지 않는다(개발자 확정).
            로그인/회원가입은 기존 LoginModal 하나로 통합돼 있다(소셜 로그인이 곧 최초 가입).
            2026-08-25 변경: 로그인/회원가입 탭 분리로 전환 — 버튼·경로는 여전히 하나(LoginModal),
            모달 내부에서 탭으로만 나뉜다(LoginModal.tsx 참고). */}
        <div className="header-actions-wrap">
          {currentUser ? (
            <div className="header-user-group">
              <PageLink
                to="/mypage"
                look="plain"
                onNavigate={() => setActiveTab('mypage')}
                title="마이페이지"
                className="header-user-chip"
              >
                <UserCheck size={16} className="header-user-icon" style={{ flexShrink: 0 }} />
                <span className="header-user-name-text">{currentUser}님</span>
              </PageLink>
              {/* 480px 이하에서 햄버거+로고+메뉴+사용자칩+이 버튼까지 겹치며 헤더가 깨지는 문제(2026-08-20
                  발견) — 모바일 드로어가 있는 경로(onOpenMobileMenu 존재)에서는 이 버튼을 헤더에서 숨기고
                  Sidebar.tsx 드로어 하단으로 옮긴다. 드로어가 없는 홈에서는 대체 진입점이 없으므로 그대로 둔다.
                  2026-08-25 — "계정 연동" 버튼은 여기서 제거하고 마이페이지 전용으로 정리했다
                  (MyPage.tsx가 이미 같은 트리거를 갖고 있다) — 로그아웃만 남는다. */}
              <div
                className={`header-account-buttons${onOpenMobileMenu ? ' header-account-buttons--has-drawer' : ''}`}
              >
                <button onClick={() => onLogout()} className="header-outline-btn">
                  <LogOut size={14} /> <span className="header-btn-label">로그아웃</span>
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="btn btn-point"
              style={{ height: '44px', padding: '0 1.2rem', fontSize: 'var(--fs-body)' }}
            >
              {/* 2026-08-25 — 라벨을 "로그인"으로 단순화(로그인/회원가입은 모달 내부 탭으로
                  분리됨, LoginModal.tsx 참고). "로그인 / 회원가입"이 좁은 헤더에서 잘려 보이던
                  문제로 640px 이하에서만 짧은 라벨을 대신 보여주던 반응형 전환은 이제 두 라벨이
                  같은 텍스트가 돼 필요 없어져 제거했다. */}
              <LogIn size={16} />{' '}
              <span>로그인</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
