import React, { useEffect, useState } from 'react';
import { X, CheckCircle2, AlertCircle, Link2, Unlink, Loader2 } from 'lucide-react';
import { BACKEND_URL, providerLabel } from '../config';
import { apiFetchRaw, apiFetch, ApiError } from '../lib/api';
import { getToken } from '../lib/storage';

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
    if (!getToken('USER')) return;

    setIsLoading(true);
    try {
      // /api/auth/me는 {status, user}를 반환해 공통 {status, data} 봉투와 다르다 — apiFetchRaw로 직접 파싱.
      const res = await apiFetchRaw('/api/auth/me', 'USER');
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
    const token = getToken('USER');
    if (!token) return;
    window.location.href = `${BACKEND_URL}/api/auth/${provider.toLowerCase()}/link?token=${encodeURIComponent(token)}`;
  };

  const handleUnlink = async (provider: string) => {
    if (!getToken('USER')) return;

    if (accounts.length <= 1) {
      setMessage({ type: 'error', text: '최소 1개의 소셜 계정은 연동되어 있어야 합니다.' });
      return;
    }
    if (!window.confirm(`${providerLabel(provider)} 연동을 해제하시겠어요?`)) return;

    setIsLoading(true);
    setMessage(null);
    try {
      // 응답이 {status, message}만 주고 data 필드가 없어 apiFetch가 성공 메시지를 못 실어준다
      // (00-34 §5.3 봉투 규격 밖) — 해제 성공 문구는 고정 텍스트로 대체.
      await apiFetch(`/api/auth/unlink-provider`, 'USER', {
        method: 'DELETE',
        body: JSON.stringify({ provider }),
      });
      setMessage({ type: 'success', text: `${providerLabel(provider)} 연동이 해제되었습니다.` });
      await fetchAccounts();
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof ApiError ? e.message : '서버와 통신 중 오류가 발생했습니다.' });
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
          borderRadius: 'var(--r-lg)',
          maxWidth: '440px',
          width: '100%',
          padding: '1.9rem 1.5rem',
          boxShadow: 'var(--el-3)',
          position: 'relative',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'var(--surface-subtle)',
            border: 'none',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text-muted)',
          }}
        >
          <X size={20} />
        </button>

        <h2 style={{ color: 'var(--primary-color)', fontSize: '1.4rem', fontWeight: 'var(--fw-bold)', margin: '0 0 1.1rem 0' }}>
          연동된 소셜 계정
        </h2>

        {message && (
          <div
            style={{
              backgroundColor: message.type === 'success' ? 'var(--state-ok-bg)' : 'var(--state-danger-bg)',
              color: message.type === 'success' ? 'var(--state-ok-fg)' : 'var(--state-danger-fg)',
              padding: 'var(--sp-3)',
              borderRadius: 'var(--r-sm)',
              fontSize: 'var(--fs-body)',
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
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
                  border: '1px solid var(--secondary-dark)',
                  borderRadius: 'var(--r-md)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: PROVIDER_STYLE[provider].dot,
                      border: provider === 'GOOGLE' ? '1px solid var(--border-color)' : 'none',
                    }}
                  />
                  <div>
                    <div style={{ fontSize: 'var(--fs-body)', fontWeight: 700, color: '#111827' }}>{providerLabel(provider)}</div>
                    {isLinked && account?.email && (
                      <div style={{ fontSize: 'var(--fs-body)', color: 'var(--text-hint)' }}>{account.email}</div>
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
                      border: '1px solid var(--state-danger-bg)',
                      color: 'var(--state-danger-fg)',
                      borderRadius: 'var(--r-sm)',
                      padding: '0.35rem var(--sp-3)',
                      fontSize: 'var(--fs-body)',
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
                      borderRadius: 'var(--r-sm)',
                      padding: '0.35rem var(--sp-3)',
                      fontSize: 'var(--fs-body)',
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
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem', color: 'var(--text-hint)' }}>
            <Loader2 size={18} />
          </div>
        )}
      </div>
    </div>
  );
};
