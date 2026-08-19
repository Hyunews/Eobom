import React from 'react';
import { UserCheck, LogIn, LogOut, Settings, ChevronDown } from 'lucide-react';
import { EobomLogo } from './EobomLogo';
import { MODE_LABELS, type NavMode } from '../modeNav';

interface HeaderProps {
  setActiveTab: (tab: string) => void;
  onOpenLogin: () => void;
  onOpenAccountSettings: () => void;
  currentUser: string | null;
  onLogout: () => void;
  navMode?: NavMode | null;
}

// 00-26 §4.4 A안 — 현재 모드를 알려주고 클릭 시 홈(4박스)으로 돌아가 다른 모드를 고를 수 있게 하는 칩.
// 로고 클릭도 항상 홈으로 가므로(§4.4 C안, 아래 로고 onClick과 동일) 모드 칩은 "지금 모드가 뭔지
// 알려주는" 역할이 실질적으로 더 크다. ⚠️ walkthrough (34)가 보고한 375px 헤더 가로 오버플로를
// 이번에 함께 해소한다 — 모바일에서는 라벨 텍스트를 숨기고 아이콘만 남긴다(index.css 미디어쿼리).
export const Header: React.FC<HeaderProps> = ({ setActiveTab, onOpenLogin, onOpenAccountSettings, currentUser, onLogout, navMode }) => {
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
        {/* 브랜드 로고 (공식 Design_Logo.png 가이드 기반 심볼마크 & 워드마크) — 클릭 시 항상 홈(4박스)로(00-26 §4.4 C안) */}
        <div
          onClick={() => setActiveTab('home')}
          style={{ flexShrink: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          title="이어봄 (Eobom) 디지털 엔딩 & 웰다잉 토탈 케어 플랫폼"
        >
          <EobomLogo variant="header" height={42} />
        </div>

        {/* 현재 모드 칩 — 로고와 우측 그룹 사이 남는 공간 안에서 가운데 정렬(절대배치 아님, 겹침 방지).
            로그인 상태의 사용자명 pill+버튼들과 함께 있어도 겹치지 않도록 실제 flex 흐름에 둔다. */}
        <div style={{ flex: '1 1 auto', minWidth: 0, display: 'flex', justifyContent: 'center' }}>
          {navMode && (
            <button
              type="button"
              onClick={() => setActiveTab('home')}
              title="클릭하면 홈에서 다른 모드를 고를 수 있습니다"
              style={{
                minWidth: 0,
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
                overflow: 'hidden',
              }}
            >
              <span className="header-mode-chip-label">{MODE_LABELS[navMode]} 모드</span>
              <ChevronDown size={14} style={{ flexShrink: 0 }} />
            </button>
          )}
        </div>

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
