import React, { useState } from 'react';
import { RdButton, RdButtonRow } from '../../parts/RdButtons';
import { DemoBar, sleep, type DemoOption } from '../../parts/RdDemo';
import { RdField, RdInput } from '../../parts/RdInputs';
import { useRdToast } from '../../parts/RdModal';
import { PartnerMain, PartnerShellFor } from './partnerCommon';
import { PartnerTitle } from './PartnerShell';

// 8단계 묶음 10 · /preview/partner/account(계정 정보) · /preview/partner/settlement(정정산 자리). 정본: 01-05 §14-7 · 판 6-8.
// 계정 정보(API만 있던 PATCH /api/partner/me → 화면 신설): 담당자명 · 담당자 연락처 / 정산 은행 · 정산 계좌번호. 칸에서 바로 고치고 [저장].
// 상호·사업자등록번호·대표자명은 보이지 않는다(상호·번호 = 신원 정보라 반려 후 재신청 · 대표자명 = 운영자가 고침 §6.2).
// 정산 = 메뉴 자리 + 빈 화면 "준비 중" 한 장(칸·금액 없음). 🔒 §10-1 결정 대기 · §11 6단계.

type View = 'ready' | 'loading' | 'loadfail' | 'savefail';
const DEMOS: DemoOption[] = [
  { value: 'ready', label: '기본' },
  { value: 'loading', label: '불러오는 중', group: '상태' },
  { value: 'loadfail', label: '불러오기 실패', group: '상태' },
  { value: 'savefail', label: '저장 실패 (저장을 눌러 보기)', group: '상태' },
];

const INITIAL = { contactName: '이○○', contactPhone: '010-1234-5678', settlementBank: 'OO은행', settlementAccount: '000-000-000000' };

export function PartnerAccountPage() {
  const [view, setView] = useState<View>('ready');
  const [saved, setSaved] = useState(INITIAL);
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState<Partial<Record<keyof typeof INITIAL, string>>>({});
  const [saving, setSaving] = useState(false);
  const [failText, setFailText] = useState<string | null>(null);
  const toast = useRdToast();

  const set = (k: keyof typeof INITIAL) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    // 서버 규칙(partnerController.ts updateMe): 연락처는 숫자 9~11자리 (utils/phone.ts)
    const digits = form.contactPhone.replace(/[^0-9]/g, '');
    if (form.contactPhone.trim() && (digits.length < 9 || digits.length > 11)) next.contactPhone = '연락처는 숫자 9~11자리여야 합니다.';
    setErrors(next);
    setFailText(null);
    if (Object.keys(next).length > 0) return;
    setSaving(true);
    await sleep(700);
    setSaving(false);
    if (view === 'savefail') {
      setFailText('서버와 통신 중 오류가 발생했습니다.');
      return;
    }
    setSaved(form);
    toast.show('저장했습니다.');
  };

  const dirty = JSON.stringify(form) !== JSON.stringify(saved);

  return (
    <PartnerShellFor current="account">
      <PartnerMain>
        <PartnerTitle>계정 정보</PartnerTitle>
        {view === 'loading' && <p className="rd-pt-line" role="status">불러오는 중…</p>}
        {view === 'loadfail' && <p className="rd-pt-line rd-pt-line--err" role="alert">불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>}
        {(view === 'ready' || view === 'savefail') && (
          <form className="rd-pt-card rd-pt-card--form" onSubmit={save} noValidate>
            <section className="rd-pt-sec">
              <h2 className="rd-pt-sec__title">담당자</h2>
              <div className="rd-pt-grid2">
                <RdField label="담당자명" error={errors.contactName}>
                  {(p) => <RdInput {...p} value={form.contactName} onChange={set('contactName')} />}
                </RdField>
                <RdField label="담당자 연락처" error={errors.contactPhone}>
                  {(p) => <RdInput {...p} type="tel" value={form.contactPhone} onChange={set('contactPhone')} />}
                </RdField>
              </div>
            </section>
            <section className="rd-pt-sec">
              <h2 className="rd-pt-sec__title">정산 계좌</h2>
              <div className="rd-pt-grid2">
                <RdField label="정산 은행">
                  {(p) => <RdInput {...p} value={form.settlementBank} onChange={set('settlementBank')} />}
                </RdField>
                <RdField label="정산 계좌번호">
                  {(p) => <RdInput {...p} inputMode="numeric" value={form.settlementAccount} onChange={set('settlementAccount')} />}
                </RdField>
              </div>
            </section>
            {failText && <p className="rd-field__error" role="alert">{failText}</p>}
            <RdButtonRow place="screen">
              <RdButton type="submit" disabled={!dirty} busy={saving} busyText="저장 중…">저장</RdButton>
            </RdButtonRow>
          </form>
        )}
        <DemoBar value={view} options={DEMOS} onChange={(v) => setView(v as View)} />
      </PartnerMain>
      {toast.node}
    </PartnerShellFor>
  );
}

export function PartnerSettlementPage() {
  return (
    <PartnerShellFor current="settlement">
      <PartnerMain>
        <PartnerTitle>정산</PartnerTitle>
        {/* 판 6-8: 자물쇠 그림 48 + 제목 "준비 중" 한 장. 칸·금액 없음 */}
        <div className="rd-pt-soon" role="status">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" aria-hidden="true">
            <rect x="5" y="11" width="14" height="9" rx="1" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
          <h2 className="rd-pt-soon__title">준비 중</h2>
        </div>
      </PartnerMain>
    </PartnerShellFor>
  );
}
