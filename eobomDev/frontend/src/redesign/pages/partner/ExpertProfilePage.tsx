import React, { useState } from 'react';
import { RdBadge, RdButton, RdButtonRow } from '../../parts/RdButtons';
import { DemoBar, sleep, type DemoOption } from '../../parts/RdDemo';
import { RdCheck, RdField, RdInput, RdTextarea } from '../../parts/RdInputs';
import { useRdToast } from '../../parts/RdModal';
import { IconSearch } from '../../parts/icons';
import { ExpertShellFor, PartnerMain } from './partnerCommon';
import { PartnerTitle } from './PartnerShell';
import {
  EXPERT_CATEGORIES, EXPERT_STATUS_BADGE, EXPERT_STATUS_LABEL, INTRO_MAX, blockedIntroMessage,
  type ExpertStatus,
} from './partnerData';

// 8단계 묶음 11 · /preview/partner/expert/profile(내 프로필) · /preview/partner/expert/ads(유료 상담·광고 자리). 정본: 02-03 §7.3-1 · §5.3 · 판 6-11 · 6-12.
// 맨 위 상태 딱지(심사 대기 · 승인됨 · 반려됨, 테두리) → 보기만: 전문 분야 · 자격증 등록번호 → 입력 칸: 연락처 · 사무실 주소([주소 검색]) · 소개(여러 줄)
// → 맨 아래 "소비자 화면 공개" 체크 칸(승인됨일 때만 보임) → [저장]. 자격 정보(직역·성명·번호·등록 기관)는 못 고친다.
// 🔴 판 6-11 "심사 대기" 화면·6-12 "반려됨" 카드는 따로 만들지 않는다(02-03 §7.3-1 ✅ 10-21) — 로그인 중 상태가 바뀐 드문 경우만 딱지로 보인다(아래 보기 상태).

type View = 'approved' | ExpertStatus | 'loading' | 'loadfail' | 'savefail';
const DEMOS: DemoOption[] = [
  { value: 'approved', label: '승인됨' },
  { value: 'PENDING', label: '심사 대기 (로그인 중 상태가 바뀐 경우)' },
  { value: 'REJECTED', label: '반려됨 (로그인 중 상태가 바뀐 경우)' },
  { value: 'loading', label: '불러오는 중', group: '상태' },
  { value: 'loadfail', label: '불러오기 실패', group: '상태' },
  { value: 'savefail', label: '저장 실패 (저장을 눌러 보기)', group: '상태' },
];

const EXAMPLE_ADDRESS = '서울 중구 세종대로 110';
const INITIAL = {
  contactPhone: '010-1234-5678',
  officeAddress: '서울 서초구 [예시]로 12, 3층',
  bio: '[예시] 상속·유언 분쟁 경력 12년. 평일 상담을 받습니다.',
  isPublished: true,
};
type Form = typeof INITIAL;
const READONLY = { category: 'LAWYER', licenseNo: '[예시] 12-3456' };

export function ExpertProfilePage() {
  const [view, setView] = useState<View>('approved');
  const [saved, setSaved] = useState<Form>(INITIAL);
  const [form, setForm] = useState<Form>(INITIAL);
  const [errors, setErrors] = useState<Partial<Record<'contactPhone' | 'bio', string>>>({});
  const [saving, setSaving] = useState(false);
  const [failText, setFailText] = useState<string | null>(null);
  const toast = useRdToast();

  const status: ExpertStatus = view === 'PENDING' || view === 'REJECTED' ? view : 'APPROVED';
  const showForm = view !== 'loading' && view !== 'loadfail';

  const setText = (k: 'contactPhone' | 'officeAddress' | 'bio') => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    // 서버 규칙(expertController.ts updateMe): 연락처는 숫자 9~11자리(utils/phone.ts) · 소개 글은 전화번호·링크·카톡 안내를 저장 때 막는다(사업자와 같은 규칙)
    const digits = form.contactPhone.replace(/[^0-9]/g, '');
    if (form.contactPhone.trim() && (digits.length < 9 || digits.length > 11)) next.contactPhone = '연락처는 숫자 9~11자리여야 합니다.';
    const blocked = form.bio.trim() ? blockedIntroMessage(form.bio) : null;
    if (blocked) next.bio = blocked.replace('소개 글', '소개');
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
  const category = EXPERT_CATEGORIES.find((c) => c.value === READONLY.category)?.label ?? READONLY.category;

  return (
    <ExpertShellFor current="profile">
      <PartnerMain>
        {/* 상태 딱지는 입력 박스의 오른쪽 위 바깥(제목 줄 오른쪽 끝 = 박스 오른쪽 끝) */}
        <div className="rd-pt-profilehead">
          <PartnerTitle aside={showForm ? <RdBadge kind={EXPERT_STATUS_BADGE[status]}>{EXPERT_STATUS_LABEL[status]}</RdBadge> : undefined}>내 프로필</PartnerTitle>
        </div>
        {view === 'loading' && <p className="rd-pt-line" role="status">불러오는 중…</p>}
        {view === 'loadfail' && <p className="rd-pt-line rd-pt-line--err" role="alert">불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>}
        {showForm && (
          <form className="rd-pt-card rd-pt-card--form" onSubmit={save} noValidate>
            <section className="rd-pt-sec">
              <h2 className="rd-pt-sec__title">자격 정보</h2>
              <dl className="rd-pt-dl">
                {[['전문 분야', category], ['자격증 등록번호', READONLY.licenseNo]].map(([k, v]) => (
                  <div className="rd-pt-dl__row" key={k}>
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
            </section>
            <section className="rd-pt-sec">
              <h2 className="rd-pt-sec__title">연락처·소개</h2>
              <RdField label="연락처" error={errors.contactPhone}>
                {(p) => <RdInput {...p} type="tel" value={form.contactPhone} onChange={setText('contactPhone')} />}
              </RdField>
              <RdField label="사무실 주소" optional>
                {(p) => (
                  <div className="rd-pt-addr">
                    <RdInput {...p} value={form.officeAddress} onChange={setText('officeAddress')} />
                    {/* 견본: 주소 검색 창 대신 예시 주소를 채운다. 교체 때 AddressSearchModal로 잇는다(00-44 §9-4 묶음 5 판정) */}
                    <RdButton kind="secondary" place="row" onClick={() => setForm((f) => ({ ...f, officeAddress: EXAMPLE_ADDRESS }))}>
                      <span className="rd-pt-addr__btn"><IconSearch size={18} />주소 검색</span>
                    </RdButton>
                  </div>
                )}
              </RdField>
              <RdField label="소개" optional error={errors.bio}>
                {(p) => <RdTextarea {...p} rows={5} maxLength={INTRO_MAX} value={form.bio} onChange={setText('bio')} />}
              </RdField>
              {status === 'APPROVED' && (
                <RdCheck
                  label="소비자 화면 공개"
                  checked={form.isPublished}
                  onChange={() => setForm((f) => ({ ...f, isPublished: !f.isPublished }))}
                />
              )}
            </section>
            {failText && <p className="rd-field__error" role="alert">{failText}</p>}
            <RdButtonRow place="screen">
              <RdButton type="submit" disabled={!dirty} busy={saving} busyText="저장 중…">저장</RdButton>
            </RdButtonRow>
          </form>
        )}
        <DemoBar value={view} options={DEMOS} onChange={(v) => { setView(v as View); setErrors({}); setFailText(null); }} />
      </PartnerMain>
      {toast.node}
    </ExpertShellFor>
  );
}

export function ExpertAdsPage() {
  return (
    <ExpertShellFor current="ads">
      <PartnerMain>
        <PartnerTitle>유료 상담·광고</PartnerTitle>
        {/* 판 6-12: 자물쇠 그림 48 + 제목 "준비 중" 한 장. 칸·금액 없음. 🔒 02-03 §2.2 결제 연동 = 사장님 승인 */}
        <div className="rd-pt-soon" role="status">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" aria-hidden="true">
            <rect x="5" y="11" width="14" height="9" rx="1" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
          <h2 className="rd-pt-soon__title">준비 중</h2>
        </div>
      </PartnerMain>
    </ExpertShellFor>
  );
}
