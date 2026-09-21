import React, { useEffect, useState } from 'react';
import { apiFetch, ApiError } from '../../lib/api';
import { backdropCloseProps } from '../../utils/backdropClose';
import '../../styles/design-v2.css';

// 회원 탈퇴 — 00-36 §4.3(4단계 확인 흐름)·M-3 #12, 06-05 §5.4-2. 화면 규칙: 00-39 규칙 18(체크는 `.v2-check`)·
// 규칙 19(저장 상태는 버튼이 말한다)·규칙 21(모달, 모바일은 바텀시트).
//
//   ① 무엇이 지워지는가(건수만, 본문 금지) + 🔴 **남는 것** 고지(추모관·이미 접수된 상담/문의)
//   ② 반출부터 하시겠습니까 — 지금 내려받을 수 있는 것은 유족 메시지 보관함 zip뿐(`GET /api/farewell-messages/export`)
//   ③ 30일 유예 고지
//   ④ 동의 체크 → 신청. 🔴 신청은 시각 두 개를 찍을 뿐 **아무것도 지우지 않는다**(서버 accountDeletionController).
//
// 🔴 되살리기는 자동이 아니다 — 유예 중 다시 로그인하면 복구 안내(AccountRecoveryModal)가 먼저 뜨고, 사용자가
// "계속 이용"을 눌러야 탈퇴 신청이 취소된다.
// 🔴 "30일 뒤 삭제됩니다"는 파기 배치(06-05 §5.6-8 ④, 별도 실행 스크립트 — 사람 승인)가 있어야 사실이 된다.

interface Preview {
  graceDays: number;
  deletionRequestedAt: string | null;
  deletionScheduledAt: string | null;
  willDelete: {
    letters: number;
    voices: number;
    endingNoteSections: number;
    guestbookEntries: number;
    facilityReviews: number;
    familyDesignations: number;
  };
  willRemain: { obituaries: number; memorials: number; consultations: number };
}

type Step = 'delete' | 'export' | 'grace' | 'confirm' | 'done';

const formatDashDate = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
};

interface WithdrawalModalProps {
  onClose: () => void;
  // 신청이 끝난 뒤 "확인"을 누르면 호출 — 마이페이지가 로그아웃시킨다
  onDone: () => void;
  // 반출 단계에서 유족 메시지 보관함으로 이동
  onGoExport: () => void;
}

export const WithdrawalModal: React.FC<WithdrawalModalProps> = ({ onClose, onDone, onGoExport }) => {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [step, setStep] = useState<Step>('delete');
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scheduledAt, setScheduledAt] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Preview>('/api/me/deletion-preview', 'USER')
      .then((p) => {
        setPreview(p);
        // 이미 신청된 계정이면 처음부터 결과 화면(중복 신청 방지)
        if (p.deletionScheduledAt) {
          setScheduledAt(p.deletionScheduledAt);
          setStep('done');
        }
      })
      .catch(() => setLoadError(true));
  }, []);

  const submit = async () => {
    if (!agreed || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const data = await apiFetch<{ deletionScheduledAt: string }>('/api/me/deletion-request', 'USER', { method: 'POST' });
      setScheduledAt(data.deletionScheduledAt);
      setStep('done');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '탈퇴 신청 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  const w = preview?.willDelete;
  // 건수가 0인 항목은 목록에서 뺀다(0건짜리 줄로 화면을 채우지 않는다)
  const deleteLines: { label: string; n: number; text: string }[] = w
    ? [
        { label: '유족 메시지(편지)', n: w.letters, text: `${w.letters}통` },
        { label: '그중 음성 첨부', n: w.voices, text: `${w.voices}건` },
        { label: '엔딩노트 섹션', n: w.endingNoteSections, text: `${w.endingNoteSections}개` },
        { label: '내가 남긴 방명록', n: w.guestbookEntries, text: `${w.guestbookEntries}건` },
        { label: '시설 후기', n: w.facilityReviews, text: `${w.facilityReviews}건` },
        { label: '가족 지정', n: w.familyDesignations, text: `${w.familyDesignations}건` },
      ].filter((l) => l.n > 0)
    : [];

  // 신청이 끝난 화면·신청 중에는 배경 클릭으로 닫히지 않게 한다(닫으면 결과를 못 본다)
  const guardedClose = step === 'done' || submitting ? () => {} : onClose;

  return (
    <div className="v2-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="withdrawal-title" {...backdropCloseProps(guardedClose)}>
      <div className="v2-modal" onClick={(e) => e.stopPropagation()}>
        {loadError && (
          <>
            <h3 id="withdrawal-title" className="v2-modal-title">회원 탈퇴</h3>
            <p className="v2-error-text">정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
            <div className="v2-modal-actions"><button type="button" className="v2-btn-outline" onClick={onClose}>닫기</button></div>
          </>
        )}

        {!loadError && !preview && (
          <>
            <h3 id="withdrawal-title" className="v2-modal-title">회원 탈퇴</h3>
            <p className="v2-empty" style={{ padding: 0 }}>불러오는 중…</p>
          </>
        )}

        {preview && step === 'delete' && (
          <>
            <h3 id="withdrawal-title" className="v2-modal-title">탈퇴하면 지워지는 기록</h3>
            {deleteLines.length === 0 ? (
              <p className="v2-modal-value" style={{ margin: '0 0 16px' }}>지워질 기록이 없습니다.</p>
            ) : (
              <ul className="v2-withdraw-list">
                {deleteLines.map((l) => (
                  <li key={l.label}><span>{l.label}</span><span>{l.text}</span></li>
                ))}
              </ul>
            )}
            {/* 🔴 남는 것을 반드시 고지 — 부고장·추모관은 1:1(봉투/목적지, 07-03 §4.1 E안)이고 추모관은 00-20 보존정책 +
                타인의 방명록이 있어 함께 지워지지 않는다. 이미 접수된 상담·문의는 계약·정산 증거라 건은 남는다(00-36 §6 #2·M-3) */}
            <p className="v2-modal-value" style={{ margin: '0 0 8px', fontWeight: 700 }}>남는 것</p>
            <ul className="v2-withdraw-list">
              <li><span>부고장</span><span>{preview.willRemain.obituaries}건 · 함께 지워지지 않습니다</span></li>
              <li><span>추모관</span><span>{preview.willRemain.memorials}개 · 함께 지워지지 않습니다</span></li>
              <li><span>이미 접수된 상담·문의</span><span>{preview.willRemain.consultations}건 · 연결만 끊기고 남습니다</span></li>
            </ul>
            <p className="v2-check-sub" style={{ margin: '0 0 8px' }}>부고장·추모관은 남습니다. 추모관 닫기는 마이페이지의 추모관 화면에서 따로 하실 수 있습니다.</p>
            <div className="v2-modal-actions">
              <button type="button" className="v2-btn-outline" onClick={onClose}>취소</button>
              <button type="button" className="v2-btn-primary" onClick={() => setStep('export')}>다음</button>
            </div>
          </>
        )}

        {preview && step === 'export' && (
          <>
            <h3 id="withdrawal-title" className="v2-modal-title">지우기 전에 내려받으시겠어요?</h3>
            <p className="v2-modal-value" style={{ margin: '0 0 12px' }}>
              탈퇴한 뒤에는 되돌릴 수 없습니다. 남기고 싶은 유족 메시지는 보관함에서 지금 내려받을 수 있습니다.
            </p>
            <div className="v2-modal-actions">
              <button type="button" className="v2-btn-outline" onClick={() => setStep('delete')}>이전</button>
              <button type="button" className="v2-btn-outline" onClick={onGoExport}>보관함에서 내려받기</button>
              <button type="button" className="v2-btn-primary" onClick={() => setStep('grace')}>내려받지 않고 계속</button>
            </div>
          </>
        )}

        {preview && step === 'grace' && (
          <>
            <h3 id="withdrawal-title" className="v2-modal-title">30일 동안 보관됩니다</h3>
            <p className="v2-modal-value" style={{ margin: '0 0 12px' }}>
              탈퇴를 신청하면 바로 지워지지 않고 {preview.graceDays}일 동안 보관된 뒤 삭제됩니다.
              {preview.graceDays}일 안에 다시 로그인해 <strong>“계속 이용”</strong>을 선택하면 탈퇴 신청이 취소됩니다.
            </p>
            <div className="v2-modal-actions">
              <button type="button" className="v2-btn-outline" onClick={() => setStep('export')}>이전</button>
              <button type="button" className="v2-btn-primary" onClick={() => setStep('confirm')}>다음</button>
            </div>
          </>
        )}

        {preview && step === 'confirm' && (
          <>
            <h3 id="withdrawal-title" className="v2-modal-title">탈퇴 신청 확인</h3>
            {/* 규칙 18 — 동의·확인은 `.v2-check` 한 가지 모양, 라벨 전체가 클릭 영역 */}
            <label className="v2-check" htmlFor="withdrawal-agree">
              <input id="withdrawal-agree" type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
              <span>위 내용을 모두 확인했으며, 회원 탈퇴를 신청합니다.</span>
            </label>
            {error && <p role="alert" className="v2-error-text" style={{ margin: '8px 0 0' }}>{error}</p>}
            <div className="v2-modal-actions">
              <button type="button" className="v2-btn-outline" onClick={() => setStep('grace')} disabled={submitting}>이전</button>
              {/* 규칙 19 — 누르는 순간 버튼을 잠그고 글자를 바꾼다(중복 제출 방지의 본체) */}
              <button type="button" className="v2-btn-solid" onClick={submit} disabled={!agreed || submitting} aria-busy={submitting}>
                {submitting ? '처리 중…' : '회원 탈퇴 신청'}
              </button>
            </div>
          </>
        )}

        {step === 'done' && (
          <>
            <h3 id="withdrawal-title" className="v2-modal-title">탈퇴 신청이 접수되었습니다</h3>
            <p className="v2-modal-value" style={{ margin: '0 0 12px' }}>
              {scheduledAt ? `${formatDashDate(scheduledAt)}까지 보관된 뒤 삭제됩니다. ` : ''}
              그 전에 다시 로그인해 “계속 이용”을 선택하면 취소할 수 있습니다.
            </p>
            <div className="v2-modal-actions">
              <button type="button" className="v2-btn-primary" onClick={onDone}>확인</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
