import React, { useEffect, useRef } from 'react';
import { Home, X, LogOut } from 'lucide-react';
import { Badge } from './common/Badge';
import { PageLink, tabPath } from './common/PageLink';
import { MODE_MENUS, type NavMode, type ModeMenuItem, type NavStatus } from '../lib/modeNav';

// 🔄 2026-09-28 사람 지시 — 드로어는 이제 navMode(prep/bereaved)와 무관하게 항상 전체
// 메뉴를 보여준다("홈 추가 + prep·bereaved 관계없이 전부 나오게"). PREP_MENU·BEREAVED_MENU를
// 합쳐 중복 id("전문가 매칭" — 둘 다 같은 화면이라 항목도 동일)만 한 번으로 접고, 맨 앞에
// "홈"을 둔다. 구 defaultMenuItems(6개 요약 목록)는 obituary·pickup·memorial이 빠져 있어
// "전부"라는 이번 지시와 맞지 않아 폐기한다. 정적 데이터라 모듈 스코프에서 한 번만 계산한다.
const ALL_DRAWER_ITEMS: ModeMenuItem[] = (() => {
  const seen = new Set<string>();
  const items: ModeMenuItem[] = [{ id: 'home', label: '메인', icon: Home, status: 'active' }];
  [...MODE_MENUS.prep, ...MODE_MENUS.bereaved].forEach((item) => {
    if (seen.has(item.id)) return;
    seen.add(item.id);
    items.push(item);
  });
  return items;
})();

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  navMode?: NavMode | null;
  currentUser?: string | null;
  onOpenLogin?: () => void;
  // 모바일 드로어(≤480px) 열림 상태 — App.tsx가 Header의 햄버거 버튼과 함께 관리한다.
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  // 480px 이하에서 헤더가 겹치는 문제로 로그아웃 버튼을 헤더에서 숨기고 여기로 이관했다
  // (Header.tsx `.header-account-buttons--has-drawer`, 2026-08-20). "계정 연동"은 2026-08-25에
  // 헤더·이 드로어 양쪽에서 제거하고 마이페이지 전용으로 정리했었는데(Header.tsx:134 참고),
  // 이 드로어 쪽 반영이 빠져 있었다(2026-08-27 사용자 제보 — 모바일 햄버거 메뉴에 아직 남아있음).
  onLogout?: () => void;
}

// 모바일 드로어 전용(00-39 §6-3 — 데스크톱 사이드바는 폐지, Header.tsx 드롭다운이 대신함).
// navMode는 더 이상 항목 선택에 쓰지 않지만(위 ALL_DRAWER_ITEMS가 정본), App.tsx가 여전히
// 넘겨주는 값이라 prop 자체는 유지한다(다른 화면의 모드 표시와 같은 시그니처를 맞추는 용도).
export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, currentUser, onOpenLogin, mobileOpen, onMobileClose, onLogout }) => {
  // 모바일 드로어용 — 아이콘 컴포넌트별 accentColor/fillColor 같은 추가 prop 없이 size/color만
  // 으로 통일해서 그린다(모든 MenuIcons가 해당 prop을 옵셔널로 받으므로 안전).
  const drawerItems: Array<{ id: string; label: string; Icon: ModeMenuItem['icon']; status: NavStatus; loginRequired?: boolean }> =
    ALL_DRAWER_ITEMS.map((item) => ({ id: item.id, label: item.label, Icon: item.icon, status: item.status, loginRequired: item.loginRequired }));

  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mobileOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        onMobileClose?.();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onMobileClose?.();
    };
    document.addEventListener('mousedown', handleOutside);
    window.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [mobileOpen, onMobileClose]);

  const handleDrawerItemClick = (item: { id: string; status: NavStatus; loginRequired?: boolean }) => {
    if (item.status === 'comingSoon') return;
    if (item.loginRequired && !currentUser) {
      onOpenLogin?.();
      onMobileClose?.();
      return;
    }
    setActiveTab(item.id);
    onMobileClose?.();
  };

  return (
    <>
    {/* 00-39 §6-3(2026-09-18) — 데스크톱 좌측 72px 호버 사이드바 폐지. 모드별 메뉴는
        Header.tsx의 헤더 드롭다운이 대신한다. 이 컴포넌트는 이제 모바일 드로어 전용. */}

    {/* 모바일 드로어(≤480px) — 데스크톱 호버 사이드바가 터치 환경에서는 열리지 않는 문제의 대체
        진입점(2026-08-20 지시). 481px 이상에서는 index.css가 강제로 숨긴다. */}
    <div
      className={`mobile-drawer-overlay${mobileOpen ? ' is-open' : ''}`}
      aria-hidden={!mobileOpen}
    />
    <div ref={drawerRef} className={`mobile-drawer-panel${mobileOpen ? ' is-open' : ''}`} role="dialog" aria-modal="true" aria-hidden={!mobileOpen}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <span style={{ color: 'var(--text-main)', fontWeight: 'var(--fw-bold)', fontSize: '1.05rem' }}>메뉴</span>
        <button
          type="button"
          onClick={onMobileClose}
          aria-label="메뉴 닫기"
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: 'var(--secondary-color)',
            color: 'var(--text-main)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <X size={18} />
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
        {drawerItems.map((item) => {
          const isActive = activeTab === item.id;
          const isComingSoon = item.status === 'comingSoon';
          const IconComp = item.Icon;
          // 🔄 2026-09-28 사람 지시 — "홈 / …전문가 매칭 / …" 점선 구분. ALL_DRAWER_ITEMS가
          // [홈, 생전 준비 3개(counseling으로 끝남), 사후 나머지]로 고정 구성되므로, 그 경계에
          // 해당하는 항목 id 뒤에만 점선을 그린다(순서가 바뀌어도 그룹 경계 자체는 안 바뀜).
          const showDividerAfter = item.id === 'home' || item.id === 'counseling';

          return (
            <React.Fragment key={item.id}>
            {(() => {
              const itemStyle: React.CSSProperties = {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.5rem',
                padding: '0.6rem 0.7rem',
                borderRadius: 'var(--r-md)',
                border: isActive ? '1.5px solid var(--accent-gold)' : '1px solid transparent',
                borderLeft: isActive ? '5px solid var(--accent-gold)' : '1px solid transparent',
                backgroundColor: isActive ? 'var(--point-color)' : 'transparent',
                color: isComingSoon ? 'var(--text-hint)' : isActive ? '#FFFFFF' : 'var(--text-main)',
                cursor: isComingSoon ? 'not-allowed' : 'pointer',
                width: '100%',
                textAlign: 'left',
              };
              const itemContent = (
                <>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', minWidth: 0 }}>
                    <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '22px' }}>
                      <IconComp size={19} color={isComingSoon ? 'var(--text-hint)' : isActive ? '#FFFFFF' : 'var(--point-color)'} />
                    </span>
                    <span style={{ fontSize: '0.95rem', fontWeight: isActive ? 'var(--fw-bold)' : 600 }}>{item.label}</span>
                  </span>
                  {item.status !== 'active' && <Badge status={item.status === 'preview' ? 'preview' : 'comingSoon'} />}
                </>
              );
              // 🔄 09-29 — 이동 항목은 링크(PageLink, 00-34 §2.2). 준비 중 항목은 예전처럼 비활성 버튼.
              return isComingSoon ? (
                <button disabled style={itemStyle}>{itemContent}</button>
              ) : (
                <PageLink
                  to={tabPath(item.id)}
                  loginRequired={item.loginRequired}
                  currentUser={currentUser}
                  onOpenLogin={() => { onOpenLogin?.(); onMobileClose?.(); }}
                  onNavigate={() => handleDrawerItemClick(item)}
                  style={itemStyle}
                >
                  {itemContent}
                </PageLink>
              );
            })()}
            {showDividerAfter && <div style={{ borderTop: '1px dashed var(--border-color)', margin: '0.3rem 0.2rem' }} />}
            </React.Fragment>
          );
        })}
      </div>

      {/* 로그아웃 — 480px 이하에서 헤더에 안 들어가 여기로 옮겨왔다(위 SidebarProps 주석 참고).
          "계정 연동"은 여기 두지 않는다 — 마이페이지 전용(Header.tsx:134와 같은 정리, 2026-08-25). */}
      {currentUser && onLogout && (
        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => { onLogout(); onMobileClose?.(); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', padding: 'var(--sp-3) var(--sp-4)',
              borderRadius: 'var(--r-sm)', border: '1px solid var(--border-color)', backgroundColor: 'transparent',
              color: 'var(--text-main)', cursor: 'pointer', width: '100%', textAlign: 'left', fontSize: '0.95rem',
            }}
          >
            <LogOut size={18} /> 로그아웃
          </button>
        </div>
      )}
    </div>
    </>
  );
};
