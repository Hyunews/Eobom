import React, { useCallback, useEffect, useState } from 'react';
import { apiFetch, apiFetchRaw, ApiError } from '../lib/api';
import { getToken } from '../lib/storage';
import { ConsentFields } from './ConsentFields';
import '../styles/design-v2.css';

// 동의 기록이 없는 기존 회원의 재동의 창 — 00-36 §4.5-1. 로그인한 상태로 화면이 열릴 때마다
// `GET /api/auth/me`의 `consentRequired`를 보고, true면 **동의를 마칠 때까지** 전체 화면을 덮는다.
//
// 🔴 바깥 클릭·Esc·닫기(×)로 닫히지 않는다 — 선택지는 둘뿐이다: 동의하고 계속하기 / 동의하지 않고 로그아웃.
// 🔴 거절은 로그아웃만 한다. 계정·데이터는 건드리지 않고 다음 로그인 때 다시 묻는다.
// 🔴 시각은 서버가 "지금"으로만 찍는다(`POST /api/me/consent`). 만 14세 확인은 가입 탭처럼 어디로도 보내지 않는 로컬 게이트다.
// 🔴 탈퇴 유예 중 계정은 복구 안내(AccountRecoveryModal, §4.3-1)가 먼저다 — 그동안 이 창은 뜨지 않고,
//    복구가 끝나면 `RECOVERED_EVENT`로 다시 확인한다.

export const ACCOUNT_RECOVERED_EVENT = 'eobom:account-recovered';

interface ConsentRequiredModalProps {
  currentUser?: string | null;
  onLogout: () => void;
}

export const ConsentRequiredModal: React.FC<ConsentRequiredModalProps> = ({ currentUser, onLogout }) => {
  const [required, setRequired] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const [agreedMarketing, setAgreedMarketing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const check = useCallback(() => {
    if (!currentUser || !getToken('USER')) {
      setRequired(false);
      return;
    }
    // /api/auth/me는 {status, user} 봉투라 apiFetchRaw로 직접 파싱한다(AccountRecoveryModal과 같은 방식)
    apiFetchRaw('/api/auth/me', 'USER')
      .then((res) => res.json())
      .then((data) => {
        const u = data.status === 'success' ? data.user : null;
        // 유예 중이면 복구 안내가 먼저 — 여기서는 띄우지 않는다
        setRequired(!!u?.consentRequired && !u?.deletionScheduledAt);
      })
      .catch(() => {
        // 조회 실패 시 창을 못 띄울 뿐 — 로그인 자체를 막지 않는다
      });
  }, [currentUser]);

  useEffect(() => {
    setRequired(false);
    setError(null);
    setAgeConfirmed(false);
    setAgreedTerms(false);
    setAgreedPrivacy(false);
    setAgreedMarketing(false);
    check();
  }, [check]);

  useEffect(() => {
    window.addEventListener(ACCOUNT_RECOVERED_EVENT, check);
    return () => window.removeEventListener(ACCOUNT_RECOVERED_EVENT, check);
  }, [check]);

  if (!currentUser || !required) return null;

  const canProceed = ageConfirmed && agreedTerms && agreedPrivacy;

  const submit = async () => {
    if (!canProceed || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch('/api/me/consent', 'USER', {
        method: 'POST',
        body: JSON.stringify({ terms: true, privacy: true, marketing: agreedMarketing }),
      });
      setRequired(false);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    // 🔴 배경 클릭으로 닫지 않는다(backdropCloseProps 미사용), Esc 처리도 없다 — 결정 없이 지나가면 안 되는 화면
    <div
      className="v2-modal-overlay"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="consent-required-title"
      style={{ zIndex: 3200, overflowY: 'auto' }}
    >
      <div className="v2-modal">
        <h3 id="consent-required-title" className="v2-modal-title">이용 동의가 필요합니다</h3>
        <p className="v2-modal-value" style={{ margin: '0 0 12px' }}>
          이어봄 이용약관과 개인정보 수집·이용에 대한 동의 기록이 없습니다. 계속 이용하시려면 동의해 주세요.
        </p>
        <ConsentFields
          ageConfirmed={ageConfirmed}
          onAgeConfirmedChange={setAgeConfirmed}
          agreedTerms={agreedTerms}
          onTermsChange={setAgreedTerms}
          agreedPrivacy={agreedPrivacy}
          onPrivacyChange={setAgreedPrivacy}
          agreedMarketing={agreedMarketing}
          onMarketingChange={setAgreedMarketing}
        />
        {error && <p role="alert" className="v2-error-text" style={{ margin: '0 0 8px' }}>{error}</p>}
        <div className="v2-modal-actions">
          <button type="button" className="v2-btn-outline" onClick={onLogout} disabled={submitting}>동의하지 않고 로그아웃</button>
          <button type="button" className="v2-btn-primary" onClick={submit} disabled={!canProceed || submitting} aria-busy={submitting}>
            {submitting ? '처리 중…' : '동의하고 계속하기'}
          </button>
        </div>
      </div>
    </div>
  );
};
