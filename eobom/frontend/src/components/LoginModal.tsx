import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ShieldCheck } from 'lucide-react';
import { BACKEND_URL } from '../config';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (username: string, provider?: string, token?: string) => void;
}

// B2C 소비자 로그인 전용. 사업자·전문가는 /partner, 운영자는 /admin — 전부 완전히 분리된
// 별도 인증 체계라 여기엔 관리자 로그인이 없다(2026-08-10, 옛 admin/1234 목업 버튼 제거).
// 하단에 /partner 진입 링크만 둔다(00-06 §7.3 ①, 2026-08-14) — 헤더 로그인 버튼을 누르고
// 여기까지 들어온 사업자·전문가가 막다른 길에 걸리지 않도록.
export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const navigate = useNavigate();
  if (!isOpen) return null;

  const handlePartnerEntry = () => {
    onClose();
    navigate('/partner');
  };

  // 소셜 로그인 처리 (카카오, 네이버, 구글) — 백엔드 OAuth 인가 엔드포인트로 리다이렉트
  const handleSocialLogin = (provider: 'kakao' | 'naver' | 'google') => {
    window.location.href = `${BACKEND_URL}/api/auth/${provider}`;
  };

  // 데모 로그인 (`POST /api/auth/demo-login`) — 2026-08-12 정정: 예전엔 토큰 없이 화면 표시용
  // 이름만 세팅하는 순수 프런트 목업이었다. 그래서 로그인된 것처럼 "OO 회원님"이 뜨는데도
  // 실제로는 인증 토큰이 없어 업체 문의 등 모든 요청이 조용히 익명으로 나가는 혼란이 있었다
  // (walkthrough 2026-08-12 (4)). 실제 백엔드 데모 로그인 API를 호출해 진짜 토큰을 받도록 수정.
  const handleMockSocialLogin = async (providerCode: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/demo-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: providerCode }),
      });
      const data = await res.json();
      if (!res.ok || data.status !== 'success') {
        alert(data.message || '데모 로그인에 실패했습니다.');
        return;
      }
      onLoginSuccess(data.user.name, providerCode, data.token);
      onClose();
    } catch {
      alert('서버와 통신 중 오류가 발생했습니다.');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 3000,
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '24px',
        maxWidth: '440px',
        width: '100%',
        padding: '1.9rem 1.5rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        position: 'relative'
      }}>
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: '#F3F4F6',
            border: 'none',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#6B7280',
            transition: 'all 0.2s'
          }}
        >
          <X size={20} />
        </button>

        {/* 모달 타이틀 */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.4rem 0.9rem',
            backgroundColor: 'var(--secondary-color)',
            color: 'var(--primary-color)',
            borderRadius: '20px',
            fontSize: '0.8rem',
            fontWeight: 600,
            marginBottom: '0.75rem'
          }}>
            <ShieldCheck size={14} /> 안전하고 빠른 3초 간편로그인
          </div>
          <h2 style={{ color: 'var(--primary-color)', fontSize: '1.6rem', fontWeight: 800, margin: '0 0 0.4rem 0' }}>
            이어봄 시작하기
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#6B7280', margin: 0, lineHeight: 1.5 }}>
            소셜 계정으로 로그인하고<br />엔딩노트 및 웰다잉 토탈 케어 서비스를 이용해보세요.
          </p>
        </div>

        {/* 소셜 로그인 3종 전면 배치 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {/* 1. 카카오 로그인 */}
            <button
              onClick={() => handleSocialLogin('kakao')}
              style={{
                width: '100%',
                height: '52px',
                backgroundColor: '#FEE500',
                color: '#191919',
                border: 'none',
                borderRadius: '14px',
                fontSize: '0.98rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(254, 229, 0, 0.3)',
                transition: 'transform 0.15s'
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 3C6.477 3 2 6.484 2 10.782C2 13.567 3.791 16.002 6.5 17.388L5.59 20.738C5.474 21.164 5.952 21.492 6.31 21.254L10.378 18.55C10.906 18.625 11.446 18.665 12 18.665C17.523 18.665 22 15.181 22 10.883C22 6.584 17.523 3 12 3Z" fill="#191919"/>
              </svg>
              카카오로 시작하기
            </button>

            {/* 2. 네이버 로그인 */}
            <button
              onClick={() => handleSocialLogin('naver')}
              style={{
                width: '100%',
                height: '52px',
                backgroundColor: '#03C75A',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '14px',
                fontSize: '0.98rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(3, 199, 90, 0.3)',
                transition: 'transform 0.15s'
              }}
            >
              <span style={{ fontWeight: 900, fontSize: '1.2rem', fontFamily: 'sans-serif' }}>N</span>
              네이버로 시작하기
            </button>

            {/* 3. 구글 로그인 */}
            <button
              onClick={() => handleSocialLogin('google')}
              style={{
                width: '100%',
                height: '52px',
                backgroundColor: '#FFFFFF',
                color: '#3C4043',
                border: '1.5px solid #E5E7EB',
                borderRadius: '14px',
                fontSize: '0.98rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                transition: 'transform 0.15s'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              구글 계정으로 시작하기
            </button>

            {/* 파트너(사업자·전문가) 진입 분기 — B2C 소셜 로그인과 무관한 별도 인증 체계로 이동
                (00-06 §7.3 ①). 데모 블록은 오픈 시 제거될 것이므로 그 위에 둔다. */}
            <div style={{ marginTop: '0.95rem', paddingTop: '0.95rem', borderTop: '1px solid #F3F4F6', textAlign: 'center' }}>
              <button
                type="button"
                onClick={handlePartnerEntry}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: 'var(--primary-color)',
                  textDecoration: 'underline',
                  padding: 0
                }}
              >
                장사시설 · 전문가 회원이신가요? 파트너 로그인 →
              </button>
            </div>

            {/* 하단 개발용 모의 로그인 버튼 */}
            <div style={{ marginTop: '0.95rem', paddingTop: '0.95rem', borderTop: '1px solid #F3F4F6', textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: '#9CA3AF', marginBottom: '0.6rem' }}>
                [빠른 데모 테스트용 선택]
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => handleMockSocialLogin('KAKAO')}
                  style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem', borderRadius: '6px', border: '1px solid #FEE500', backgroundColor: '#FFFDF0', color: '#191919', cursor: 'pointer' }}
                >
                  🟡 카카오(모의)
                </button>
                <button
                  type="button"
                  onClick={() => handleMockSocialLogin('NAVER')}
                  style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem', borderRadius: '6px', border: '1px solid #03C75A', backgroundColor: '#F0FDF4', color: '#03C75A', cursor: 'pointer' }}
                >
                  🟢 네이버(모의)
                </button>
                <button
                  type="button"
                  onClick={() => handleMockSocialLogin('GOOGLE')}
                  style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem', borderRadius: '6px', border: '1px solid #D1D5DB', backgroundColor: '#F9FAFB', color: '#374151', cursor: 'pointer' }}
                >
                  ⚪ 구글(모의)
                </button>
              </div>
            </div>
          </div>
      </div>
    </div>
  );
};
