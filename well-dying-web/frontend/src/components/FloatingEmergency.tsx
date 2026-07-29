import React from 'react';
import { PhoneCall } from 'lucide-react';

export const FloatingEmergency: React.FC = () => {
  const handleCall = () => {
    alert('🚨 긴급 장례 지원 서비스로 즉시 연결합니다.\n(24시간 365일 전담 장례지도사 1-Touch 긴급 배정)');
  };

  return (
    <button
      onClick={handleCall}
      style={{
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
        backgroundColor: 'var(--accent-red)',
        color: '#FFFFFF',
        padding: '0 1.5rem',
        height: '60px',
        borderRadius: '30px',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        fontWeight: 'bold',
        fontSize: '1rem',
        boxShadow: '0 10px 25px rgba(217, 83, 79, 0.4)',
        cursor: 'pointer',
        zIndex: 1001,
        transition: 'transform 0.2s, background-color 0.2s'
      }}
      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
    >
      <PhoneCall size={22} className="animate-pulse" />
      <span>24시간 긴급상담</span>
    </button>
  );
};
