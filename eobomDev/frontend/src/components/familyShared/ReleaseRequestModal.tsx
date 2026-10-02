import React, { useState } from 'react';
import { apiFetch, ApiError } from '../../lib/api';
import { backdropCloseProps } from '../../utils/backdropClose';
import { kstToday } from '../../utils/kstDate';

// 00-41 §8.1 — 유족의 개봉 요청 폼. 🔴 파일 첨부 칸을 만들지 않는다(00-16 §4.3). 🔴 이어봄이 발송한다는 뜻의 문구를
// 쓰지 않는다 — 이어봄은 보내지 않는다(§6). 안내 문구는 §8.1 문장 그대로(운영시간 9~17시·6시간은 서버 상수 값의 표기다).

interface Props {
  designationId: string;
  ownerName: string;
  onClose: () => void;
  onDone: () => void;
}

const todayIso = (): string => kstToday('-');

export const ReleaseRequestModal: React.FC<Props> = ({ designationId, ownerName, onClose, onDone }) => {
  const [deceasedName, setDeceasedName] = useState('');
  const [deathDate, setDeathDate] = useState('');
  const [hallName, setHallName] = useState('');
  const [hallPhone, setHallPhone] = useState('');
  const [noHall, setNoHall] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await apiFetch('/api/ending-note/release-requests', 'USER', {
        method: 'POST',
        body: JSON.stringify({
          designationId,
          deceasedName,
          deathDate,
          noFuneralHall: noHall,
          ...(noHall ? {} : { funeralHallName: hallName, funeralHallPhone: hallPhone }),
        }),
      });
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '서버와 통신 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="v2-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="release-request-title" {...backdropCloseProps(onClose)}>
      <div className="v2-modal" onClick={(e) => e.stopPropagation()}>
        <h3 id="release-request-title" className="v2-modal-title">{ownerName} 님의 기록 열기</h3>
        <form onSubmit={submit} className="v2-form">
          <p className="v2-notice">
            운영자가 장례식장에 확인한 뒤 열립니다. 확인은 평일 9시~17시에 하며(주말·공휴일 휴무), 운영시간 기준 6시간 안에
            마칩니다. 결과는 이 화면에서 보실 수 있습니다.
          </p>
          <div className="v2-field">
            <label htmlFor="rr-name">
              고인 성함 <span className="v2-req">필수</span>
            </label>
            <input id="rr-name" type="text" className="v2-input" value={deceasedName} onChange={(e) => setDeceasedName(e.target.value)} maxLength={50} required />
          </div>
          <div className="v2-field">
            <label htmlFor="rr-date">
              돌아가신 날 <span className="v2-req">필수</span>
            </label>
            <input id="rr-date" type="date" className="v2-input" value={deathDate} max={todayIso()} onChange={(e) => setDeathDate(e.target.value)} required />
          </div>
          <div className="v2-field">
            <label htmlFor="rr-hall">
              장례식장 이름 {noHall ? null : <span className="v2-req">필수</span>}
            </label>
            <input id="rr-hall" type="text" className="v2-input" value={hallName} onChange={(e) => setHallName(e.target.value)} maxLength={100} disabled={noHall} required={!noHall} />
          </div>
          <div className="v2-field">
            <label htmlFor="rr-phone">
              장례식장 전화번호 {noHall ? null : <span className="v2-req">필수</span>}
            </label>
            <input id="rr-phone" type="tel" inputMode="tel" className="v2-input" value={hallPhone} onChange={(e) => setHallPhone(e.target.value)} disabled={noHall} required={!noHall} />
            <p className="v2-field-hint">운영자가 이 번호로 전화해 확인합니다.</p>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', cursor: 'pointer' }}>
            <input type="checkbox" checked={noHall} onChange={(e) => setNoHall(e.target.checked)} />
            장례식장 없음
          </label>
          {error && <span className="v2-error-text">{error}</span>}
          <div className="v2-modal-actions is-form-actions">
            <button type="button" className="v2-btn-outline" onClick={onClose} disabled={submitting}>
              취소
            </button>
            <button type="submit" className="v2-btn-primary" disabled={submitting} aria-busy={submitting}>
              {submitting ? '요청하는 중…' : '열어 달라고 요청'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
