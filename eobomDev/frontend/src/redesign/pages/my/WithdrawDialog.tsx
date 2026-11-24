import React, { useState } from 'react';
import { RdButton } from '../../parts/RdButtons';
import { sleep } from '../../parts/RdDemo';
import { RdCheck } from '../../parts/RdInputs';
import { RdDialog } from '../../parts/RdModal';
import { IconCheckCircle, IconErrorCircle } from '../../parts/icons';
import { FAKE_MS, WITHDRAW_ALREADY, WITHDRAW_EMPTY, WITHDRAW_RECORDS, type WithdrawPreview } from './accountData';
import { MyDl, MyLine } from './myShared';
import './account.css';

// 8단계 묶음 8 · 회원 탈퇴 창(4-10~4-12) — 같은 창 안에서 5장을 갈아끼운다. 정본: 00-36 §4.3 · 06-05 §5.4-2.
//   1 무엇이 지워지는가 → 2 내려받기 → 3 30일 보관 → 4 확인 → 5 접수
// #10: 이용자에게 보이는 "엔딩노트 섹션 N개" → "엔딩노트 항목 N개". 신청은 시각만 찍고 아무것도 지우지 않는다(서버).
// 🔴 되살리기는 자동이 아니다 — 30일 안에 다시 로그인해 "계속 이용"을 눌러야 취소된다(4-18).

type Step = 'delete' | 'export' | 'grace' | 'confirm' | 'done';

const addDays = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

export function WithdrawDialog({
  variant,
  onClose,
  onDone,
  onGoExport,
}: {
  /** records(기본) · empty = 지워질 기록 없음 · loading · loadfail · done = 이미 신청된 계정 · submitfail = 신청 실패 */
  variant?: string;
  onClose: () => void;
  /** 5장 [확인] — 실제로는 로그아웃시킨다 */
  onDone: () => void;
  /** 2장 [내려받기] — 유족 메시지 보관함으로 */
  onGoExport: () => void;
}) {
  const preview: WithdrawPreview | null =
    variant === 'loading' || variant === 'loadfail' ? null : variant === 'empty' ? WITHDRAW_EMPTY : variant === 'done' ? WITHDRAW_ALREADY : WITHDRAW_RECORDS;

  const [step, setStep] = useState<Step>(variant === 'done' ? 'done' : 'delete');
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scheduledAt, setScheduledAt] = useState<string | null>(preview?.deletionScheduledAt ?? null);

  const submit = async () => {
    if (!agreed || submitting) return;
    setSubmitting(true);
    setError(null);
    await sleep(FAKE_MS);
    setSubmitting(false);
    if (variant === 'submitfail') {
      setError('탈퇴 신청 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
      return;
    }
    setScheduledAt(addDays(preview?.graceDays ?? 30));
    setStep('done');
  };

  // 접수된 뒤·신청 중에는 바깥을 눌러도 Esc로도 닫히지 않는다(닫으면 결과를 못 본다)
  const guarded = step === 'done' || submitting ? () => {} : onClose;

  if (!preview) {
    return (
      <RdDialog footLine width={560} title="회원 탈퇴" onClose={onClose} footer={<RdButton place="dialog" onClick={onClose}>닫기</RdButton>}>
        {variant === 'loadfail' ? (
          <MyLine kind="error">정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</MyLine>
        ) : (
          <MyLine kind="loading">불러오는 중…</MyLine>
        )}
      </RdDialog>
    );
  }

  const w = preview.willDelete;
  // 건수가 0인 항목은 줄에서 뺀다
  const deleteLines = [
    { label: '유족 메시지(편지)', n: w.letters, text: `${w.letters}통` },
    { label: '그중 음성 첨부', n: w.voices, text: `${w.voices}건` },
    { label: '엔딩노트 항목', n: w.endingNoteItems, text: `${w.endingNoteItems}개` },
    { label: '내가 남긴 방명록', n: w.guestbookEntries, text: `${w.guestbookEntries}건` },
    { label: '가족 지정', n: w.familyDesignations, text: `${w.familyDesignations}건` },
  ].filter((l) => l.n > 0);
  const c = preview.willClose;

  return (
    <RdDialog
      footLine
      width={560}
      title={
        step === 'done' ? (
          <>
            <span className="rd-ac-tick" aria-hidden="true"><IconCheckCircle size={24} /></span>
            탈퇴 신청이 접수되었습니다
          </>
        ) : step === 'delete' ? '회원 탈퇴'
        : step === 'export' ? '지우기 전에 내려받으시겠어요?'
        : step === 'grace' ? `${preview.graceDays}일 동안 보관됩니다`
        : '탈퇴 신청 확인'
      }
      onClose={guarded}
      evenButtons={step === 'export'}
      footer={
        step === 'delete' ? (
          <>
            <RdButton kind="secondary" place="dialog" onClick={onClose}>취소</RdButton>
            <RdButton place="dialog" onClick={() => setStep('export')}>다음</RdButton>
          </>
        ) : step === 'export' ? (
          <>
            <RdButton kind="secondary" place="dialog" onClick={() => setStep('delete')}>이전</RdButton>
            <RdButton kind="secondary" place="dialog" onClick={onGoExport}>내려받기</RdButton>
            <RdButton place="dialog" onClick={() => setStep('grace')}>계속</RdButton>
          </>
        ) : step === 'grace' ? (
          <>
            <RdButton kind="secondary" place="dialog" onClick={() => setStep('export')}>이전</RdButton>
            <RdButton place="dialog" onClick={() => setStep('confirm')}>다음</RdButton>
          </>
        ) : step === 'confirm' ? (
          <>
            <RdButton kind="secondary" place="dialog" disabled={submitting} onClick={() => setStep('grace')}>이전</RdButton>
            <RdButton kind="danger" place="dialog" disabled={!agreed} busy={submitting} busyText="처리 중…" onClick={submit}>회원 탈퇴 신청</RdButton>
          </>
        ) : (
          <RdButton place="dialog" onClick={onDone}>확인</RdButton>
        )
      }
    >
      {step === 'delete' && (
        <div className="rd-mp-editbody">
          <section className="rd-ac-wsec">
            <h3 className="rd-ac-sub">탈퇴하면 지워지는 기록</h3>
            {deleteLines.length === 0 ? (
              <p className="rd-dialog__desc">지워질 기록이 없습니다.</p>
            ) : (
              <MyDl rows={deleteLines.map((l) => ({ name: l.label, value: l.text }))} />
            )}
          </section>
          {/* 추모관·부고장은 탈퇴를 따라간다(09-30). 열려 있는 것이 있을 때만 그린다 */}
          {(c.memorials > 0 || c.obituaries > 0) && (
            <section className="rd-ac-wsec">
              <h3 className="rd-ac-sub">바로 닫히는 것</h3>
              <MyDl
                rows={[
                  ...(c.memorials > 0 ? [{ name: '개설하신 추모관', value: `${c.memorials}개 · 바로 비공개되고 ${preview.graceDays}일 뒤 삭제됩니다` }] : []),
                  ...(c.obituaries > 0 ? [{ name: '부고장', value: `${c.obituaries}개 · 바로 닫힙니다` }] : []),
                ]}
              />
            </section>
          )}
          {/* 🔴 남는 것을 반드시 알린다 — 이미 접수된 상담·문의는 건이 남는다 */}
          <section className="rd-ac-wsec">
            <h3 className="rd-ac-sub">남는 것</h3>
            <MyDl rows={[{ name: '이미 접수된 상담·문의', value: `${preview.willRemain.consultations}건 · 연결만 끊기고 남습니다` }]} />
          </section>
        </div>
      )}

      {step === 'export' && (
        <p className="rd-dialog__desc">탈퇴한 뒤에는 되돌릴 수 없습니다. 남기고 싶은 유족 메시지는 보관함에서 지금 내려받을 수 있습니다.</p>
      )}

      {step === 'grace' && (
        <p className="rd-dialog__desc">
          탈퇴를 신청하면 바로 지워지지 않고 {preview.graceDays}일 동안 보관된 뒤 삭제됩니다. {preview.graceDays}일 안에 다시 로그인해{' '}
          <strong>“계속 이용”</strong>을 선택하면 탈퇴 신청이 취소되고, 닫힌 추모관과 부고장도 다시 열립니다.
        </p>
      )}

      {step === 'confirm' && (
        <div className="rd-mp-editbody">
          <RdCheck label="위 내용을 모두 확인했으며, 회원 탈퇴를 신청합니다." checked={agreed} disabled={submitting} onChange={(e) => setAgreed(e.target.checked)} />
          {error && (
            <p className="rd-field__error" role="alert">
              <IconErrorCircle />
              <span>{error}</span>
            </p>
          )}
        </div>
      )}

      {step === 'done' && (
        <p className="rd-dialog__desc">
          {scheduledAt ? `${scheduledAt}까지 보관된 뒤 삭제됩니다. ` : ''}그 전에 다시 로그인해 “계속 이용”을 선택하면 취소할 수 있습니다.
        </p>
      )}
    </RdDialog>
  );
}
