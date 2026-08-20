import React, { useEffect, useRef, useState } from 'react';
import { UserCheck, LogIn, LogOut, Settings, ChevronDown, Menu } from 'lucide-react';
import { EobomLogo } from './EobomLogo';
import { MODE_LABELS, MODE_MENUS, type NavMode } from '../modeNav';

interface HeaderProps {
  setActiveTab: (tab: string) => void;
  onOpenLogin: () => void;
  onOpenAccountSettings: () => void;
  currentUser: string | null;
  onLogout: () => void;
  navMode?: NavMode | null;
  onSetMode?: (mode: NavMode) => void;
  // 480px 이하에서만 노출되는 햄버거 버튼(.mobile-menu-trigger, index.css) — Sidebar.tsx의
  // 모바일 드로어를 연다. 사이드바 자체가 없는 홈에서는 App.tsx가 undefined를 넘겨 숨긴다.
  onOpenMobileMenu?: () => void;
}

// 08-19 14차(개발자 직접 지시) — 기존엔 "지금 모드가 뭔지 알려주는" 칩일 뿐이었고(클릭하면
// 홈으로 보내 4박스에서 다시 고르게 함), 위치도 로고와 우측 버튼 사이 중앙이었다. 이번엔
// 로고 바로 오른쪽으로 옮기고, 실제로 눌러서 생전 준비/임종 및 사후 정리/게스트 세 군데를
// 바로 오갈 수 있는 드롭다운으로 바꿨다 — 홈을 거치지 않고 모드를 즉시 전환한다.
// "게스트"는 아직 실제 화면이 없어(EntryBoxes 박스③ 비활성 고정) 홈으로 보낸다.
type ModeDropdownKey = NavMode | 'guest';
const MODE_DROPDOWN_ITEMS: Array<{ key: ModeDropdownKey; label: string }> = [
  { key: 'prep', label: '생전 준비' },
  { key: 'bereaved', label: '임종 및 사후 정리' },
  { key: 'guest', label: '게스트' },
];

export const Header: React.FC<HeaderProps> = ({ setActiveTab, onOpenLogin, onOpenAccountSettings, currentUser, onLogout, navMode, onSetMode, onOpenMobileMenu }) => {
  const [isModeMenuOpen, setIsModeMenuOpen] = useState(false);
  const modeMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isModeMenuOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (modeMenuRef.current && !modeMenuRef.current.contains(e.target as Node)) {
        setIsModeMenuOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsModeMenuOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    window.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isModeMenuOpen]);

  const handleSelectMode = (key: ModeDropdownKey) => {
    setIsModeMenuOpen(false);
    if (key === 'guest') {
      setActiveTab('home');
      return;
    }
    onSetMode?.(key);
    const firstActiveItem = MODE_MENUS[key].find((item) => item.status === 'active');
    if (!firstActiveItem) {
      setActiveTab('home');
      return;
    }
    if (firstActiveItem.loginRequired && !currentUser) {
      onOpenLogin();
      return;
    }
    setActiveTab(firstActiveItem.id);
  };

  const modeMenuLabel = navMode ? MODE_LABELS[navMode] : '메뉴';

  return (
    <header style={{
      backgroundColor: 'var(--primary-color)',
      color: '#FFFFFF',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      height: '72px',
      boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
    }}>
      <div className="header-inner" style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center'
      }}>
        {/* 모바일 햄버거 메뉴 버튼 — 480px 이하에서만 보임(.mobile-menu-trigger, index.css).
            사이드바가 호버로 안 열리는 터치 환경 대체 진입점(2026-08-20 지시, Sidebar.tsx 드로어 연동). */}
        {onOpenMobileMenu && (
          <button
            type="button"
            onClick={onOpenMobileMenu}
            aria-label="메뉴 열기"
            className="mobile-menu-trigger"
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              width: '38px',
              height: '38px',
              marginRight: '0.6rem',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.25)',
              backgroundColor: 'rgba(255,255,255,0.12)',
              color: '#FFFFFF',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <Menu size={20} />
          </button>
        )}

        {/* 브랜드 로고 (공식 Design_Logo.png 가이드 기반 심볼마크 & 워드마크) — 클릭 시 항상 홈(4박스)로(00-26 §4.4 C안) */}
        <div
          onClick={() => setActiveTab('home')}
          style={{ flexShrink: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          title="이어봄 (Eobom) 디지털 엔딩 & 웰다잉 토탈 케어 플랫폼"
        >
          <EobomLogo variant="header" height={42} />
        </div>

        {/* 모드 드롭다운 — 로고 바로 오른쪽. 생전 준비 / 임종 및 사후 정리 / 게스트를
            홈을 거치지 않고 즉시 오갈 수 있다(08-19 14차). */}
        <div ref={modeMenuRef} className="header-mode-wrap" style={{ position: 'relative', flexShrink: 0, marginLeft: '0.6rem' }}>
          <button
            type="button"
            onClick={() => setIsModeMenuOpen((v) => !v)}
            aria-expanded={isModeMenuOpen}
            className="header-mode-trigger"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              backgroundColor: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: '20px',
              padding: '0.4rem 0.75rem',
              color: '#FFFFFF',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            <span className="header-mode-chip-label">{modeMenuLabel}</span>
            <ChevronDown size={14} style={{ flexShrink: 0, transform: isModeMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
          </button>

          {isModeMenuOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 0.5rem)',
                left: 0,
                minWidth: '190px',
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                boxShadow: '0 12px 32px rgba(0,0,0,0.2)',
                overflow: 'hidden',
                zIndex: 1100,
              }}
            >
              {MODE_DROPDOWN_ITEMS.map((item) => {
                const isActive = item.key === navMode;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleSelectMode(item.key)}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '0.75rem 1rem',
                      fontSize: '0.9rem',
                      fontWeight: isActive ? 800 : 600,
                      color: isActive ? 'var(--point-color)' : 'var(--text-main)',
                      backgroundColor: isActive ? 'var(--secondary-color)' : 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 로고·모드 드롭다운과 우측 그룹 사이 여백 채우기 */}
        <div style={{ flex: '1 1 auto', minWidth: 0 }} />

        {/* 우측 로그인 / 회원가입 상태 버튼 */}
        <div style={{ flexShrink: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
              <span
                onClick={() => setActiveTab('mypage')}
                title="마이페이지"
                style={{
                  minWidth: 0,
                  fontSize: '0.9rem',
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  padding: '0.4rem 0.8rem',
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  cursor: 'pointer'
                }}>
                <UserCheck size={16} color="var(--point-light)" style={{ flexShrink: 0 }} />
                <span className="header-user-name-text">{currentUser}님</span>
              </span>
              {/* 480px 이하에서 햄버거+로고+모드칩+사용자칩+이 두 버튼까지 겹치며 헤더가 깨지는 문제(2026-08-20
                  발견) — 모바일 드로어가 있는 경로(onOpenMobileMenu 존재)에서는 이 두 버튼을 헤더에서 숨기고
                  Sidebar.tsx 드로어 하단으로 옮긴다. 드로어가 없는 홈에서는 대체 진입점이 없으므로 그대로 둔다. */}
              <div
                className={`header-account-buttons${onOpenMobileMenu ? ' header-account-buttons--has-drawer' : ''}`}
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
              >
                <button
                  onClick={onOpenAccountSettings}
                  style={{
                    backgroundColor: 'transparent',
                    color: '#DFDCD7',
                    border: '1px solid rgba(255,255,255,0.3)',
                    borderRadius: '6px',
                    padding: '0.4rem 0.8rem',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}
                >
                  <Settings size={14} /> <span className="header-btn-label">계정 설정</span>
                </button>
                <button
                  onClick={onLogout}
                  style={{
                    backgroundColor: 'transparent',
                    color: '#DFDCD7',
                    border: '1px solid rgba(255,255,255,0.3)',
                    borderRadius: '6px',
                    padding: '0.4rem 0.8rem',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}
                >
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
