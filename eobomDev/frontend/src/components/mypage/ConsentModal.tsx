import React, { useEffect, useState } from 'react';
import { apiFetch, ApiError } from '../../lib/api';
import { backdropCloseProps } from '../../utils/backdropClose';
import '../../styles/design-v2.css';

// 개인정보·동의 — 00-36 §4.5(성격별 3층), 위치 = 마이페이지 "내 활동과 계정" 행 → 모달(00-39 §6.8-1 규칙 21).
//
//   계정 필수 — termsAgreedAt·privacyAgreedAt: 🔴 토글 없음. 동의한 날짜만 표시 + 거두려면 회원 탈퇴가 필요하다는 안내 → 탈퇴 행으로.
//   선택       — marketingAgreedAt: 토글 1개. 🔴 "내 정보" 모달의 체크박스를 이곳으로 옮겼다(같은 값을 두 곳에서 고치지 않는다).
//   건별       — thirdPartyConsentAt: 🔴 토글 대상이 아니다(이미 제공된 사실). 이 모달에 없다 — §4.4 상담 상세에 동의 시각만 표시.
//
// 규칙 18(체크는 `.v2-check`)·규칙 19(저장 상태는 버튼이 말한다).

interface ConsentData {
  termsAgreedAt: string | null;
  privacyAgreedAt: string | null;
  marketingAgreedAt: string | null;
}

const formatDashDate = (iso: string | null): string => {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
};

interface ConsentModalProps {
  onClose: () => void;
  // "동의를 거두시려면 회원 탈퇴가 필요합니다" → 탈퇴 행(탈퇴 흐름)으로
  onGoWithdrawal: () => void;
}

export const ConsentModal: React.FC<ConsentModalProps> = ({ onClose, onGoWithdrawal }) => {
  const [data, setData] = useState<ConsentData | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    apiFetch<ConsentData>('/api/me/profile', 'USER')
      .then((p) => {
        setData(p);
        setMarketing(!!p.marketingAgreedAt);
      })
      .catch(() => setLoadError(true));
  }, []);

  const changed = data ? marketing !== !!data.marketingAgreedAt : false;

  const save = async () => {
    if (!changed || saving) return;
    setSaving(true);
    setMessage(null);
    try {
      // marketingAgreed만 보낸다 — 다른 프로필 칸은 건드리지 않는다(PATCH는 부분 수정)
      const p = await apiFetch<ConsentData>('/api/me/profile', 'USER', {
        method: 'PATCH',
        body: JSON.stringify({ marketingAgreed: marketing }),
      });
      setData(p);
      setMarketing(!!p.marketingAgreedAt);
      setMessage({ type: 'success', text: '저장되었습니다.' });
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof ApiError ? e.message : '서버와 통신 중 오류가 발생했습니다.' });
    } finally {
      setSaving(false);
    }
  };

  const guardedClose = saving ? () => {} : onClose;

  return (
    <div className="v2-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="consent-title" {...backdropCloseProps(guardedClose)}>
      <div className="v2-modal" onClick={(e) => e.stopPropagation()}>
        <h3 id="consent-title" className="v2-modal-title">개인정보·동의</h3>

        {loadError && (
          <>
            <p className="v2-error-text">정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
            <div className="v2-modal-actions"><button type="button" className="v2-btn-outline" onClick={onClose}>닫기</button></div>
          </>
        )}

        {!loadError && !data && <p className="v2-empty" style={{ padding: 0 }}>불러오는 중…</p>}

        {data && (
          <>
            <ul className="v2-withdraw-list">
              <li><span>서비스 이용약관 동의</span><span>{formatDashDate(data.termsAgreedAt)}</span></li>
              <li><span>개인정보 수집·이용 동의</span><span>{formatDashDate(data.privacyAgreedAt)}</span></li>
            </ul>
            <p className="v2-modal-value" style={{ margin: '0 0 16px' }}>
              동의를 거두시려면 회원 탈퇴가 필요합니다.{' '}
              <button type="button" className="v2-btn-outline" onClick={onGoWithdrawal}>회원 탈퇴</button>
            </p>

            {/* 규칙 18 — 동의·확인은 `.v2-check` 한 가지 모양, 라벨 전체가 클릭 영역 */}
            <label className="v2-check" htmlFor="consent-marketing">
              <input id="consent-marketing" type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} disabled={saving} />
              <span>마케팅 정보 수신에 동의합니다 (선택)</span>
            </label>

            {message && (
              <p role={message.type === 'error' ? 'alert' : 'status'} className={message.type === 'error' ? 'v2-error-text' : 'v2-modal-value'} style={{ margin: '8px 0 0' }}>
                {message.text}
              </p>
            )}

            <div className="v2-modal-actions">
              <button type="button" className="v2-btn-outline" onClick={onClose} disabled={saving}>닫기</button>
              {/* 규칙 19 — 누르는 순간 버튼을 잠그고 글자를 바꾼다 */}
              <button type="button" className="v2-btn-primary" onClick={save} disabled={!changed || saving} aria-busy={saving}>
                {saving ? '저장 중…' : '저장'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
