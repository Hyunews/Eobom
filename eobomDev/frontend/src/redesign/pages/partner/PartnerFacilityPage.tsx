import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CONTACT_EMAIL } from '../../../config';
import { RdBadge, RdButton, RdButtonRow, RdTextLink } from '../../parts/RdButtons';
import { DemoBar, sleep, type DemoOption } from '../../parts/RdDemo';
import { RdCheck, RdField, RdInput, RdSelect, RdTextarea } from '../../parts/RdInputs';
import { RdNotice } from '../../parts/RdNotices';
import { RdState } from '../../parts/RdState';
import { useRdToast } from '../../parts/RdModal';
import { IconImage } from '../../parts/icons';
import { PartnerMain, PartnerShellFor } from './partnerCommon';
import { PartnerTitle } from './PartnerShell';
import {
  AMENITIES, INTRO_HIDE_LABEL, INTRO_MAX, MY_FACILITIES, PV_PARTNER, RELIGIONS, blockedIntroMessage,
  type MyFacility,
} from './partnerData';

// 8단계 묶음 10 · /preview/partner/facility — 내 시설 정보. 정본: 01-05 §14-5 · 판 6-6.
// 시설이 둘 이상이면 위에 시설 고르기 탭(모바일은 세로로 쌓음) — 한 곳씩 보인다. 시설 카드 안 세 구역:
//   공공 데이터 기준 정보(보기만) · 고칠 수 있는 정보(소개 글·종교·수용 규모·부대시설, 저장하면 유족 화면에 바로 반영) · 사진(자리만 + "결정 대기").
// 🔴 가격 글 칸은 만들지 않는다(2026-09-10 지시). 사진 업로드·대표·삭제 버튼 없음(§6.1 주 — 사진 결정 대기).

type View = 'two' | 'one' | 'hidden' | 'none' | 'loading' | 'loadfail' | 'savefail';
const DEMOS: DemoOption[] = [
  { value: 'two', label: '시설 2곳 (탭)' },
  { value: 'one', label: '시설 1곳 (탭 없음)' },
  { value: 'hidden', label: '운영자가 소개 글을 숨긴 시설' },
  { value: 'none', label: '연동된 시설 없음', group: '상태' },
  { value: 'loading', label: '불러오는 중', group: '상태' },
  { value: 'loadfail', label: '불러오기 실패', group: '상태' },
  { value: 'savefail', label: '저장 실패 (저장을 눌러 보기)', group: '상태' },
];

interface Draft {
  intro: string;
  religion: string;
  capacity: string;
  amenities: string[];
}
const draftOf = (f: MyFacility): Draft => ({ intro: f.intro, religion: f.religion, capacity: f.capacity, amenities: f.amenities });

export function PartnerFacilityPage() {
  const navigate = useNavigate();
  const [view, setView] = useState<View>('two');
  const [saved, setSaved] = useState<MyFacility[]>(MY_FACILITIES);
  const [sel, setSel] = useState(MY_FACILITIES[0].id);
  const [draft, setDraft] = useState<Draft>(draftOf(MY_FACILITIES[0]));
  const [errors, setErrors] = useState<{ intro?: string; capacity?: string; religion?: string }>({});
  const [saving, setSaving] = useState(false);
  const [failText, setFailText] = useState<string | null>(null);
  const toast = useRdToast();

  const list: MyFacility[] =
    view === 'none' || view === 'loading' || view === 'loadfail'
      ? []
      : view === 'one'
        ? saved.slice(0, 1)
        : view === 'hidden'
          ? saved.slice(0, 1).map((f) => ({ ...f, hiddenReason: 'EXTERNAL_CONTACT' }))
          : saved;
  const fac = list.find((f) => f.id === sel) ?? list[0] ?? null;

  // 시설을 바꾸거나 보기 상태를 바꾸면 그 시설의 저장된 값으로 되돌린다
  useEffect(() => {
    if (fac) setDraft(draftOf(fac));
    setErrors({});
    setFailText(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fac?.id, view]);

  const dirty = !!fac && JSON.stringify(draft) !== JSON.stringify(draftOf(fac));

  const save = async () => {
    if (!fac) return;
    const next: typeof errors = {};
    const blocked = draft.intro.trim() ? blockedIntroMessage(draft.intro) : null;
    if (blocked) next.intro = blocked; // 저장 때 막는 것: 전화번호 모양 · 홈페이지 · 카톡·카카오·오픈채팅(01-05 §14-5)
    if (draft.capacity.trim() && !/^[0-9]+$/.test(draft.capacity.trim())) next.capacity = '수용 규모는 숫자로 입력해주세요.';
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
    // 소개 글을 고쳐 저장하면 운영자 숨김이 풀린다 — 견본에서는 저장 후 숨김 안내가 사라지는 것으로 보인다
    const changedIntro = draft.intro.trim() !== fac.intro;
    setSaved((all) => all.map((f) => (f.id === fac.id ? { ...f, ...draft, intro: draft.intro.trim(), hiddenReason: changedIntro ? undefined : f.hiddenReason } : f)));
    if (changedIntro && view === 'hidden') setView('one');
    toast.show('저장했습니다. 유족 화면에 바로 반영됩니다.');
  };

  const toggleAmenity = (a: string) =>
    setDraft((d) => ({ ...d, amenities: d.amenities.includes(a) ? d.amenities.filter((x) => x !== a) : [...d.amenities, a] }));

  let body: React.ReactNode;
  if (view === 'loading') body = <p className="rd-pt-line" role="status">불러오는 중…</p>;
  else if (view === 'loadfail') body = <p className="rd-pt-line rd-pt-line--err" role="alert">불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>;
  else if (!fac) {
    // 빈 화면 문구는 코드 그대로 — 메뉴가 갈려 "위에서"가 어긋나지만 그대로(2026-10-19 개발자 "지금대로", §14-8)
    body = (
      <RdState kind="empty" title="아직 연동된 시설이 없습니다. 위에서 검색 후 연동을 신청해주세요." link={<RdTextLink href={PV_PARTNER.link} onClick={(e) => { e.preventDefault(); navigate(PV_PARTNER.link); }}>시설 연동</RdTextLink>} />
    );
  } else {
    body = (
      <>
        {list.length > 1 && (
          <div className="rd-pt-factabs" role="tablist" aria-label="내 시설 고르기">
            {list.map((f) => (
              <button key={f.id} type="button" role="tab" aria-selected={f.id === fac.id} className="rd-pt-factab" onClick={() => setSel(f.id)}>
                {f.name}
              </button>
            ))}
          </div>
        )}
        <article className="rd-pt-fac">
          <div className="rd-pt-fac__head">
            <span className="rd-pt-fac__region">{fac.region}</span>
            <h3 className="rd-pt-fac__name">{fac.name}</h3>
          </div>

          <section className="rd-pt-facsec" aria-labelledby="fd-pub">
            <h4 className="rd-pt-facsec__title" id="fd-pub">공공 데이터 기준 정보</h4>
            <dl className="rd-pt-dl">
              {[
                ['시설명', fac.name], ['종류', fac.kind], ['주소', fac.address], ['전화', fac.phone], ['운영주체', fac.owner],
              ].map(([k, v]) => (
                <div className="rd-pt-dl__row" key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
            <p className="rd-pt-facsec__note">
              공공 데이터 기준 · 고치려면 <a className="rd-link rd-pt-inlinelink" href={`mailto:${CONTACT_EMAIL}`}><span>문의</span></a>
            </p>
          </section>

          <section className="rd-pt-facsec" aria-labelledby="fd-edit">
            <h4 className="rd-pt-facsec__title" id="fd-edit">고칠 수 있는 정보</h4>
            {fac.hiddenReason && (
              <RdNotice tone="caution" title={`운영자가 소개 글을 숨겼습니다. (숨긴 사유: ${INTRO_HIDE_LABEL[fac.hiddenReason]})`}>
                소개 글을 고쳐서 저장하면 숨김이 풀리고 다시 바로 반영됩니다.
              </RdNotice>
            )}
            <div className="rd-pt-facform">
              <RdField label="소개 글" error={errors.intro}>
                {(p) => (
                  <RdTextarea
                    {...p}
                    rows={4}
                    maxLength={INTRO_MAX}
                    value={draft.intro}
                    onChange={(e) => {
                      setDraft((d) => ({ ...d, intro: e.target.value }));
                      setErrors((er) => ({ ...er, intro: undefined }));
                    }}
                  />
                )}
              </RdField>
              <div className="rd-pt-grid2 rd-pt-grid2--wide">
                <RdField label="종교" error={errors.religion}>
                  {(p) => (
                    <RdSelect {...p} value={draft.religion} onChange={(e) => setDraft((d) => ({ ...d, religion: e.target.value }))}>
                      {!RELIGIONS.includes(draft.religion) && <option value="">선택</option>}
                      {RELIGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                    </RdSelect>
                  )}
                </RdField>
                <RdField label="수용 규모" error={errors.capacity}>
                  {(p) => (
                    <div className="rd-pt-unit">
                      <RdInput
                        {...p}
                        inputMode="numeric"
                        value={draft.capacity}
                        onChange={(e) => {
                          setDraft((d) => ({ ...d, capacity: e.target.value }));
                          setErrors((er) => ({ ...er, capacity: undefined }));
                        }}
                      />
                      <span>명</span>
                    </div>
                  )}
                </RdField>
              </div>
              <fieldset className="rd-pt-amen">
                <legend className="rd-field__label">부대시설</legend>
                <div className="rd-pt-amen__list">
                  {AMENITIES.map((a) => (
                    <RdCheck key={a} label={a} checked={draft.amenities.includes(a)} onChange={() => toggleAmenity(a)} />
                  ))}
                </div>
              </fieldset>
            </div>
            {failText && <p className="rd-field__error" role="alert">{failText}</p>}
            <RdButtonRow place="screen">
              <RdButton kind="secondary" disabled={!dirty || saving} onClick={() => { setDraft(draftOf(fac)); setErrors({}); setFailText(null); }}>취소</RdButton>
              <RdButton busy={saving} busyText="저장 중…" onClick={save}>저장</RdButton>
            </RdButtonRow>
          </section>

          <section className="rd-pt-facsec" aria-labelledby="fd-photo">
            <div className="rd-pt-facsec__titlerow">
              <h4 className="rd-pt-facsec__title" id="fd-photo">사진</h4>
              <RdBadge kind="state">결정 대기</RdBadge>
            </div>
            <div className="rd-pt-photoslot" role="img" aria-label="사진 칸 (비어 있음)"><IconImage size={26} /></div>
          </section>
        </article>
      </>
    );
  }

  return (
    <PartnerShellFor current="facility">
      <PartnerMain>
        <PartnerTitle>내 시설 정보</PartnerTitle>
        {body}
        <DemoBar value={view} options={DEMOS} onChange={(v) => { setView(v as View); setSel(MY_FACILITIES[0].id); }} />
      </PartnerMain>
      {toast.node}
    </PartnerShellFor>
  );
}
