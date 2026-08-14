import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';

// "24시간 긴급 콜/즉시 파견"은 받을 사람이 없는 약속이었다(00-14 §2-4 → 07-02 §5.3, 2026-08-14
// 정정). 임종 직후 유족이 급한 건 상담원이 아니라 "장례식장이 어디인지"이므로 FAB은 Domain 01
// 시설 검색으로 바로 보낸다. §5.3의 "②상담 문의" 갈래는 채널 개설 주체·응답시간이 사장님 확정
// 전이라 열지 않는다.
export const FloatingEmergency: React.FC = () => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate('/facility')}
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
      <Search size={22} className="animate-pulse" />
      <span>장례식장 바로 찾기</span>
    </button>
  );
};
