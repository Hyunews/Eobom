import React, { useEffect, useState } from 'react';
import { apiFetch, apiFetchRaw, ApiError } from '../lib/api';
import { getToken } from '../lib/storage';
import '../styles/design-v2.css';

// 회원 탈퇴 유예 중 로그인 — 00-36 M-3, 06-05 §5.4-2. 로그인은 되지만 **복구 안내를 먼저** 띄운다.
//
// 🔴 되살리기는 자동이 아니다: 로그인 자체로는 `deletionRequestedAt`·`deletionScheduledAt`이 비워지지 않고
// (`GET /api/auth/me`는 조회만 한다), 사용자가 여기서 "계속 이용"을 눌러 `DELETE /api/me/deletion-request`를
// 호출해야만 비워진다. 모르고 로그인했다가 되살아나면 안 된다 — 그래서 이 모달은 배경 클릭·Esc로 닫히지 않는다
// (닫으면 결정을 안 한 채 계정을 쓰게 된다). 선택지는 둘뿐이다: 계속 이용 / 로그아웃(탈퇴 유지).
// 🔴 "탈퇴 유지"는 아무것도 하지 않는다 — 로그아웃할 뿐이고 유예는 그대로 흐른다.

interface AccountRecoveryModalProps {
  currentUser?: string | null;
  onLogout: () => void;
}

const formatDashDate = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
};

export const AccountRecoveryModal: React.FC<AccountRecoveryModalProps> = ({ currentUser, onLogout }) => {
  const [scheduledAt, setScheduledAt] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setScheduledAt(null);
    setError(null);
    if (!currentUser || !getToken('USER')) return;
    // /api/auth/me는 {status, user} 봉투라 apiFetchRaw로 직접 파싱한다(MyPage와 같은 방식)
    apiFetchRaw('/api/auth/me', 'USER')
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'success' && data.user?.deletionScheduledAt) setScheduledAt(data.user.deletionScheduledAt);
      })
      .catch(() => {
        // 조회 실패 시 안내를 못 띄울 뿐 — 로그인 자체를 막지 않는다
      });
  }, [currentUser]);

  if (!currentUser || !scheduledAt) return null;

  const keepUsing = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch('/api/me/deletion-request', 'USER', { method: 'DELETE' });
      setScheduledAt(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    // 🔴 배경 클릭으로 닫지 않는다(backdropCloseProps 미사용) — 결정 없이 지나가면 안 되는 화면
    <div className="v2-modal-overlay" role="alertdialog" aria-modal="true" aria-labelledby="recovery-title" style={{ zIndex: 3200 }}>
      <div className="v2-modal">
        <h3 id="recovery-title" className="v2-modal-title">탈퇴가 신청된 계정입니다</h3>
        <p className="v2-modal-value" style={{ margin: '0 0 12px' }}>
          {formatDashDate(scheduledAt)}에 삭제될 예정입니다. 계속 이용하시려면 아래 “계속 이용”을 눌러 탈퇴 신청을 취소해 주세요.
          누르지 않고 로그아웃하면 탈퇴 신청이 그대로 유지됩니다.
        </p>
        {error && <p role="alert" className="v2-error-text" style={{ margin: '0 0 8px' }}>{error}</p>}
        <div className="v2-modal-actions">
          <button type="button" className="v2-btn-outline" onClick={onLogout} disabled={submitting}>로그아웃</button>
          <button type="button" className="v2-btn-primary" onClick={keepUsing} disabled={submitting} aria-busy={submitting}>
            {submitting ? '처리 중…' : '계속 이용'}
          </button>
        </div>
      </div>
    </div>
  );
};
