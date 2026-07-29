import React from 'react';
import { UserCheck, LogIn, LogOut } from 'lucide-react';

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
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0 2rem',
        height: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        {/* 브랜드 로고 (클릭 시 메인 페이지로 이동) */}
        <div 
          onClick={() => setActiveTab('home')} 
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
        >
          <div style={{
            backgroundColor: 'var(--point-color)',
            borderRadius: '50%',
            width: '42px',
            height: '42px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: '1.4rem'
          }}>
            🌿
          </div>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, color: '#FFFFFF', lineHeight: 1.2 }}>
              K-Ending <span style={{ color: 'var(--point-light)', fontSize: '1rem', fontWeight: 400 }}>토탈 케어</span>
            </h1>
            <p style={{ fontSize: '0.75rem', color: '#DFDCD7', margin: 0 }}>생전 준비부터 사후 행정까지 완결</p>
          </div>
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
