import React, { useState } from 'react';
import { AlertCircle, Link2, UserPlus } from 'lucide-react';
import { BACKEND_URL, providerLabel } from '../config';

interface SocialLinkModalProps {
  isOpen: boolean;
  tempToken: string;
  email: string;
  existingProvider: string;
  newProvider: string;
  onResolved: (result: { token: string; name: string; provider: string }) => void;
  onClose: () => void;
}

export const SocialLinkModal: React.FC<SocialLinkModalProps> = ({
  isOpen,
  tempToken,
  email,
  existingProvider,
  newProvider,
  onResolved,
  onClose,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleChoice = async (action: 'MERGE' | 'CREATE_NEW') => {
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/confirm-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempToken, action }),
      });
      const data = await res.json();

      if (!res.ok || data.status !== 'success') {
        setErrorMessage(data.message || '처리 중 오류가 발생했습니다. 다시 시도해주세요.');
        return;
      }

      onResolved({ token: data.token, name: data.user.name, provider: data.user.provider });
    } catch (e) {
      setErrorMessage('서버와 통신 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
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
        zIndex: 3100,
        padding: '1rem',
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          maxWidth: '440px',
          width: '100%',
          padding: '2.5rem 2rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <h2 style={{ color: 'var(--primary-color)', fontSize: '1.4rem', fontWeight: 800, margin: '0 0 0.6rem 0' }}>
            이미 가입된 이메일이에요
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#6B7280', margin: 0, lineHeight: 1.6 }}>
            <strong>{email}</strong>로 이미 <strong>{providerLabel(existingProvider)}</strong> 계정이 가입되어 있어요.
            <br />
            지금 로그인하신 <strong>{providerLabel(newProvider)}</strong> 계정을 어떻게 처리할까요?
          </p>
        </div>

        {errorMessage && (
          <div
            style={{
              backgroundColor: '#FDE8E8',
              color: '#9B1C1C',
              padding: '0.75rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <AlertCircle size={16} />
            {errorMessage}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleChoice('MERGE')}
            className="btn btn-primary"
            style={{
              width: '100%',
              height: '52px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.6rem',
              opacity: isSubmitting ? 0.7 : 1,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
            }}
          >
            <Link2 size={18} />
            기존 계정에 통합하기 (추천)
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleChoice('CREATE_NEW')}
            style={{
              width: '100%',
              height: '52px',
              backgroundColor: '#FFFFFF',
              color: '#374151',
              border: '1.5px solid #E5E7EB',
              borderRadius: '14px',
              fontSize: '0.95rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.6rem',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.7 : 1,
            }}
          >
            <UserPlus size={18} />
            독립된 새 계정으로 가입하기
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            style={{
              width: '100%',
              background: 'none',
              border: 'none',
              color: '#9CA3AF',
              fontSize: '0.85rem',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              marginTop: '0.25rem',
            }}
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
};
