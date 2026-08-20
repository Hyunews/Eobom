import React, { useEffect, useRef } from 'react';
import { Home, X, Settings, LogOut } from 'lucide-react';
import { HouseLeafIcon, HandScalesIcon, PhoneHeartIcon, NoteKeyIcon, ChecklistShieldIcon } from './MenuIcons';
import { Badge } from './home/EntryBoxes';
import { MODE_MENUS, type NavMode, type ModeMenuItem, type NavStatus } from '../modeNav';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  navMode?: NavMode | null;
  currentUser?: string | null;
  onOpenLogin?: () => void;
  // 모바일 드로어(≤480px) 열림 상태 — App.tsx가 Header의 햄버거 버튼과 함께 관리한다.
  // 데스크톱 호버 사이드바(아래 <aside>)는 이 값과 무관하게 항상 그대로 동작한다.
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  // 480px 이하에서 헤더가 겹치는 문제로 계정 설정/로그아웃 버튼을 헤더에서 숨기고 여기로
  // 이관했다(Header.tsx `.header-account-buttons--has-drawer`, 2026-08-20).
  onOpenAccountSettings?: () => void;
  onLogout?: () => void;
}

// width/margin-left 확장 동기화는 순수 CSS(:hover)로 처리한다(→ index.css `.sidebar`) —
// 이전엔 이 컴포넌트의 React state로 width만 넓히고 .main-wrapper의 margin-left는
// 못 따라가서, 확장 시 사이드바가 본문 위에 그대로 올라타 콘텐츠를 가리는 문제가 있었다.
// 00-26 §3·§7 — navMode가 있으면 모드별 맞춤 메뉴(3개/6개, modeNav.ts), 없으면(직접 URL
// 진입 등) 기존 6개 메뉴를 라벨만 정정해 그대로 둔다(§6 #5).
export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, navMode, currentUser, onOpenLogin, mobileOpen, onMobileClose, onOpenAccountSettings, onLogout }) => {
  // 공식 6개 네비게이션 메뉴 — 00-26 §5가 잡은 라벨 불일치 3건 정정(장례·묘지 매칭 /
  // 상속·법률 케어 / 디지털 유품 정리 → 00-02 §3.2 정본).
  const defaultMenuItems = [
    { id: 'home', label: '메인', icon: Home },
    { id: 'facility', label: '장사시설 매칭', icon: HouseLeafIcon },
    { id: 'counseling', label: '전문가 매칭', icon: HandScalesIcon },
    { id: 'digital-estate', label: '디지털 정산', icon: PhoneHeartIcon },
    { id: 'care-guide', label: '상중 · 행정 케어', icon: ChecklistShieldIcon },
    { id: 'ending-note', label: '디지털 엔딩노트', icon: NoteKeyIcon },
  ];

  const modeItems: ModeMenuItem[] | null = navMode ? MODE_MENUS[navMode] : null;

  const handleModeItemClick = (item: ModeMenuItem) => {
    if (item.status === 'comingSoon') return;
    if (item.loginRequired && !currentUser) {
      onOpenLogin?.();
      return;
    }
    setActiveTab(item.id);
  };

  // 모바일 드로어용 — 데스크톱의 두 분기(모드별/기본)와 같은 데이터를 쓰되, 아이콘 컴포넌트별
  // accentColor/fillColor 같은 추가 prop 없이 size/color만으로 통일해서 그린다(모든 MenuIcons가
  // 해당 prop을 옵셔널로 받으므로 안전). 항상 라벨이 보이는 구조라 호버 확장 로직은 필요 없다.
  const drawerItems: Array<{ id: string; label: string; Icon: ModeMenuItem['icon']; status: NavStatus; loginRequired?: boolean }> = modeItems
    ? modeItems.map((item) => ({ id: item.id, label: item.label, Icon: item.icon, status: item.status, loginRequired: item.loginRequired }))
    : defaultMenuItems.map((item) => ({ id: item.id, label: item.label, Icon: item.icon, status: 'active' as NavStatus }));

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
    <aside
      className="sidebar"
      style={{
        backgroundColor: 'var(--primary-color)',
        color: '#FFFFFF',
        boxShadow: '4px 0 20px rgba(0,0,0,0.15)',
        display: 'flex',
        flexDirection: 'column',
        padding: '1rem 0.5rem'
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.65rem',
          width: '100%'
        }}
      >
        {modeItems
          ? modeItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = activeTab === item.id;
              const isComingSoon = item.status === 'comingSoon';

              return (
                <button
                  key={item.id}
                  onClick={() => handleModeItemClick(item)}
                  disabled={isComingSoon}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.6rem',
                    padding: '0.9rem 0.85rem',
                    borderRadius: '12px',
                    border: isActive ? '1.5px solid var(--accent-gold)' : '1px solid transparent',
                    borderLeft: isActive ? '5px solid var(--accent-gold)' : '1px solid transparent',
                    backgroundColor: isActive ? 'var(--point-color)' : 'transparent',
                    color: isComingSoon ? '#94A3B8' : isActive ? '#FFFFFF' : '#CBD5E1',
                    cursor: isComingSoon ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    whiteSpace: 'nowrap',
                    width: '100%',
                    textAlign: 'left',
                    boxShadow: isActive ? '0 4px 14px rgba(91, 112, 101, 0.5)' : 'none'
                  }}
                  title={item.label}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 0 }}>
                    <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px' }}>
                      <IconComponent size={24} color={isComingSoon ? '#64748B' : isActive ? '#FFFFFF' : '#E2E8F0'} />
                    </span>
                    <span
                      className="sidebar-label"
                      style={{
                        fontSize: '0.98rem',
                        fontWeight: isActive ? 800 : 600,
                        color: isComingSoon ? '#94A3B8' : isActive ? '#FFFFFF' : '#F8FAFC'
                      }}
                    >
                      {item.label}
                    </span>
                  </span>
                  {item.status !== 'active' && (
                    <span className="sidebar-label">
                      <Badge status={item.status === 'preview' ? 'preview' : 'comingSoon'} />
                    </span>
                  )}
                </button>
              );
            })
          : defaultMenuItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.85rem',
                    padding: '0.9rem 0.85rem',
                    borderRadius: '12px',
                    border: isActive ? '1.5px solid var(--accent-gold)' : '1px solid transparent',
                    borderLeft: isActive ? '5px solid var(--accent-gold)' : '1px solid transparent',
                    backgroundColor: isActive ? 'var(--point-color)' : 'transparent',
                    color: isActive ? '#FFFFFF' : '#CBD5E1',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    whiteSpace: 'nowrap',
                    width: '100%',
                    textAlign: 'left',
                    boxShadow: isActive ? '0 4px 14px rgba(91, 112, 101, 0.5)' : 'none'
                  }}
                  title={item.label}
                >
                  <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px' }}>
                    {item.id === 'home' ? (
                      <Home size={24} color={isActive ? '#FFFFFF' : '#E2E8F0'} />
                    ) : (
                      <IconComponent
                        size={24}
                        color={isActive ? '#FFFFFF' : '#E2E8F0'}
                        accentColor={isActive ? '#FDE047' : '#D4A359'}
                        fillColor={isActive ? '#FFFFFF' : '#5B7065'}
                      />
                    )}
                  </div>

                  <span
                    className="sidebar-label"
                    style={{
                      fontSize: '0.98rem',
                      fontWeight: isActive ? 800 : 600,
                      color: isActive ? '#FFFFFF' : '#F8FAFC'
                    }}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
      </div>
    </aside>

    {/* 모바일 드로어(≤480px) — 데스크톱 호버 사이드바가 터치 환경에서는 열리지 않는 문제의 대체
        진입점(2026-08-20 지시). 481px 이상에서는 index.css가 강제로 숨긴다. */}
    <div
      className={`mobile-drawer-overlay${mobileOpen ? ' is-open' : ''}`}
      aria-hidden={!mobileOpen}
    />
    <div ref={drawerRef} className={`mobile-drawer-panel${mobileOpen ? ' is-open' : ''}`} role="dialog" aria-modal="true" aria-hidden={!mobileOpen}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
        <span style={{ color: '#FFFFFF', fontWeight: 800, fontSize: '1.05rem' }}>메뉴</span>
        <button
          type="button"
          onClick={onMobileClose}
          aria-label="메뉴 닫기"
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: 'rgba(255,255,255,0.12)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <X size={18} />
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {drawerItems.map((item) => {
          const isActive = activeTab === item.id;
          const isComingSoon = item.status === 'comingSoon';
          const IconComp = item.Icon;

          return (
            <button
              key={item.id}
              onClick={() => handleDrawerItemClick(item)}
              disabled={isComingSoon}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.6rem',
                padding: '0.85rem 0.8rem',
                borderRadius: '12px',
                border: isActive ? '1.5px solid var(--accent-gold)' : '1px solid transparent',
                borderLeft: isActive ? '5px solid var(--accent-gold)' : '1px solid transparent',
                backgroundColor: isActive ? 'var(--point-color)' : 'transparent',
                color: isComingSoon ? '#94A3B8' : isActive ? '#FFFFFF' : '#CBD5E1',
                cursor: isComingSoon ? 'not-allowed' : 'pointer',
                width: '100%',
                textAlign: 'left',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', minWidth: 0 }}>
                <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '26px' }}>
                  <IconComp size={22} color={isComingSoon ? '#64748B' : isActive ? '#FFFFFF' : '#E2E8F0'} />
                </span>
                <span style={{ fontSize: '0.95rem', fontWeight: isActive ? 800 : 600 }}>{item.label}</span>
              </span>
              {item.status !== 'active' && <Badge status={item.status === 'preview' ? 'preview' : 'comingSoon'} />}
            </button>
          );
        })}
      </div>

      {/* 계정 설정/로그아웃 — 480px 이하에서 헤더에 안 들어가 여기로 옮겨왔다(위 SidebarProps 주석 참고). */}
      {currentUser && (onOpenAccountSettings || onLogout) && (
        <div style={{ marginTop: '1.2rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.15)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {onOpenAccountSettings && (
            <button
              type="button"
              onClick={() => { onOpenAccountSettings(); onMobileClose?.(); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.7rem', padding: '0.75rem 0.8rem',
                borderRadius: '10px', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'transparent',
                color: '#CBD5E1', cursor: 'pointer', width: '100%', textAlign: 'left', fontSize: '0.9rem',
              }}
            >
              <Settings size={18} /> 계정 설정
            </button>
          )}
          {onLogout && (
            <button
              type="button"
              onClick={() => { onLogout(); onMobileClose?.(); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.7rem', padding: '0.75rem 0.8rem',
                borderRadius: '10px', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'transparent',
                color: '#CBD5E1', cursor: 'pointer', width: '100%', textAlign: 'left', fontSize: '0.9rem',
              }}
            >
              <LogOut size={18} /> 로그아웃
            </button>
          )}
        </div>
      )}
    </div>
    </>
  );
};
