import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';
import { backdropCloseProps } from '../../utils/backdropClose';
import { formatKstDate } from '../../utils/kstDate';
import '../../styles/design-v2.css';

// 개인정보·동의 — 00-36 §4.5(성격별 3층), 위치 = 마이페이지 "내 활동과 계정" 행 → 모달(00-39 §6.8-1 규칙 21).
//
//   계정 필수 — termsAgreedAt·privacyAgreedAt: 🔴 토글 없음. 동의한 날짜만 표시 + 거두려면 회원 탈퇴가 필요하다는 안내 → 탈퇴 행으로.
//   선택       — 없음. 마케팅 수신 동의는 받지 않는다(00-28 §9 #2, 10-16 결정) — 토글·저장을 뺐다. DB 칸(marketingAgreedAt)은 그대로.
//   건별       — thirdPartyConsentAt: 🔴 토글 대상이 아니다(이미 제공된 사실). 이 모달에 없다 — §4.4 상담 상세에 동의 시각만 표시.

interface ConsentData {
  termsAgreedAt: string | null;
  privacyAgreedAt: string | null;
}

const formatDashDate = (iso: string | null): string => {
  if (!iso) return '-';
  return formatKstDate(iso, '-') || '-';
};

interface ConsentModalProps {
  onClose: () => void;
  // "동의를 거두시려면 회원 탈퇴가 필요합니다" → 탈퇴 행(탈퇴 흐름)으로
  onGoWithdrawal: () => void;
}

export const ConsentModal: React.FC<ConsentModalProps> = ({ onClose, onGoWithdrawal }) => {
  const [data, setData] = useState<ConsentData | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    apiFetch<ConsentData>('/api/me/profile', 'USER')
      .then((p) => setData(p))
      .catch(() => setLoadError(true));
  }, []);

  return (
    <div className="v2-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="consent-title" {...backdropCloseProps(onClose)}>
      <div className="v2-modal" onClick={(e) => e.stopPropagation()}>
        <h3 id="consent-title" className="v2-modal-title">개인정보·동의</h3>

        {loadError && <p className="v2-error-text">정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>}

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
          </>
        )}

        <div className="v2-modal-actions">
          <button type="button" className="v2-btn-outline" onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>
  );
};
