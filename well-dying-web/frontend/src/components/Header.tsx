import React from 'react';
import { UserCheck, LogIn, LogOut } from 'lucide-react';
import { EobomLogo } from './EobomLogo';

interface HeaderProps {
  setActiveTab: (tab: string) => void;
  onOpenLogin: () => void;
  currentUser: string | null;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ setActiveTab, onOpenLogin, currentUser, onLogout }) => {
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
      <div style={{
        width: '100%',
        padding: '0 2rem',
        height: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        {/* 브랜드 로고 (공식 Design_Logo.png 가이드 기반 심볼마크 & 워드마크) */}
        <div 
          onClick={() => setActiveTab('home')} 
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          title="이어봄 (Eobom) 디지털 엔딩 & 웰다잉 토탈 케어 플랫폼"
        >
          <EobomLogo variant="header" height={42} />
        </div>

        {/* 우측 로그인 / 회원가입 상태 버튼 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{
                fontSize: '0.9rem',
                backgroundColor: 'rgba(255,255,255,0.15)',
                padding: '0.4rem 0.8rem',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}>
                <UserCheck size={16} color="var(--point-light)" />
                {currentUser}님
              </span>
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
                <LogOut size={14} /> 로그아웃
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="btn btn-point"
              style={{ height: '44px', padding: '0 1.2rem', fontSize: '0.9rem' }}
            >
              <LogIn size={16} /> 로그인 / 회원가입
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
