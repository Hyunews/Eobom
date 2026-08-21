import React, { useEffect, useState } from 'react';
import { X, CheckCircle2, AlertCircle, Link2, Unlink, Loader2 } from 'lucide-react';
import { BACKEND_URL, providerLabel } from '../config';

interface SocialAccountInfo {
  provider: string;
  email: string | null;
  createdAt: string;
}

interface MyPageAuthSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  initialMessage?: { type: 'success' | 'error'; text: string } | null;
}

const ALL_PROVIDERS = ['KAKAO', 'NAVER', 'GOOGLE'] as const;

const PROVIDER_STYLE: Record<string, { dot: string }> = {
  KAKAO: { dot: '#FEE500' },
  NAVER: { dot: '#03C75A' },
  GOOGLE: { dot: '#4285F4' },
};

export const MyPageAuthSettings: React.FC<MyPageAuthSettingsProps> = ({ isOpen, onClose, initialMessage }) => {
  const [accounts, setAccounts] = useState<SocialAccountInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(initialMessage ?? null);

  const fetchAccounts = async () => {
    const token = sessionStorage.getItem('k_ending_token');
    if (!token) return;

    setIsLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.status === 'success' && Array.isArray(data.user?.accounts)) {
        setAccounts(data.user.accounts);
      }
    } catch (e) {
      // 조회 실패는 조용히 무시 (연동 목록만 비어있게 표시됨)
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAccounts();
    }
  }, [isOpen]);

  useEffect(() => {
    setMessage(initialMessage ?? null);
  }, [initialMessage]);

  if (!isOpen) return null;

  const linkedProviders = new Set(accounts.map((account) => account.provider));

  const handleLink = (provider: string) => {
    const token = sessionStorage.getItem('k_ending_token');
    if (!token) return;
    window.location.href = `${BACKEND_URL}/api/auth/${provider.toLowerCase()}/link?token=${encodeURIComponent(token)}`;
  };

  const handleUnlink = async (provider: string) => {
    const token = sessionStorage.getItem('k_ending_token');
    if (!token) return;

    if (accounts.length <= 1) {
      setMessage({ type: 'error', text: '최소 1개의 소셜 계정은 연동되어 있어야 합니다.' });
      return;
    }
    if (!window.confirm(`${providerLabel(provider)} 연동을 해제하시겠어요?`)) return;

    setIsLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/unlink-provider`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ provider }),
      });
      const data = await res.json();
      if (!res.ok || data.status !== 'success') {
        setMessage({ type: 'error', text: data.message || '연동 해제에 실패했습니다.' });
        return;
      }
      setMessage({ type: 'success', text: data.message });
      await fetchAccounts();
    } catch (e) {
      setMessage({ type: 'error', text: '서버와 통신 중 오류가 발생했습니다.' });
    } finally {
      setIsLoading(false);
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
          padding: '1.9rem 1.5rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          position: 'relative',
        }}
      >
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
          }}
        >
          <X size={20} />
        </button>

        <h2 style={{ color: 'var(--primary-color)', fontSize: '1.4rem', fontWeight: 800, margin: '0 0 1.1rem 0' }}>
          연동된 소셜 계정
        </h2>

        {message && (
          <div
            style={{
              backgroundColor: message.type === 'success' ? '#ECFDF5' : '#FDE8E8',
              color: message.type === 'success' ? '#065F46' : '#9B1C1C',
              padding: '0.75rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              marginBottom: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {message.text}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {ALL_PROVIDERS.map((provider) => {
            const account = accounts.find((a) => a.provider === provider);
            const isLinked = linkedProviders.has(provider);

            return (
              <div
                key={provider}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.9rem 1rem',
                  border: '1px solid #E5E7EB',
                  borderRadius: '14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: PROVIDER_STYLE[provider].dot,
                      border: provider === 'GOOGLE' ? '1px solid #D1D5DB' : 'none',
                    }}
                  />
                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#111827' }}>{providerLabel(provider)}</div>
                    {isLinked && account?.email && (
                      <div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>{account.email}</div>
                    )}
                  </div>
                </div>

                {isLinked ? (
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleUnlink(provider)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      background: 'none',
                      border: '1px solid #FCA5A5',
                      color: '#DC2626',
                      borderRadius: '8px',
                      padding: '0.35rem 0.7rem',
                      fontSize: '0.8rem',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <Unlink size={14} /> 연동 해제
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleLink(provider)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      background: 'none',
                      border: '1px solid var(--primary-color)',
                      color: 'var(--primary-color)',
                      borderRadius: '8px',
                      padding: '0.35rem 0.7rem',
                      fontSize: '0.8rem',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <Link2 size={14} /> 연동하기
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {isLoading && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem', color: '#9CA3AF' }}>
            <Loader2 size={18} />
          </div>
        )}
      </div>
    </div>
  );
};
