import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { formatKstDate, kstToday } from '../../../utils/kstDate';
import { copyObituaryLink } from '../../../utils/kakaoShare';
import { RdBadge, RdButton, RdTextLink } from '../../parts/RdButtons';
import { DemoBar, sleep, type DemoOption } from '../../parts/RdDemo';
import { RdDate, RdField, RdInput, RdSaveBar, RdSelect } from '../../parts/RdInputs';
import { AgreeRow } from '../after/ObituaryPage';
import { RdPageHead } from '../../parts/RdNav';
import { RdDialog } from '../../parts/RdModal';
import { RdState } from '../../parts/RdState';
import { IconArrowOut, IconErrorCircle } from '../../parts/icons';
import { useIsPhone } from '../../useIsPhone';
import {
  MEMORIALS, MEMORIAL_STATE_BADGE, MEMORIAL_STATE_LABEL, PV, VISIBILITY_LABEL,
  findMemorial, memorialButtons, memorialDateLine, memorialManageUrl, memorialState, type MyMemorial,
} from './myData';
import { IconCopy, MyDl, MyGate, MyLine, MyResult } from './myShared';
import './mypage.css';

// 8단계 묶음 7 · /preview/memorial — 4단계 판 4-6-1(만들기) · 4-6-2(관리 `?slug=`) · 4-6-3(상태).
// 정본: 00-36 §4.8-2 · §4.8-3 · §4.8-4 · 확정 ⑧. 주소 하나가 둘을 맡는다: slug가 없으면 만들기, 있으면 그 추모관 관리.
// 🔴 [수정]은 운영자 비공개(hiddenAt)면 숨긴다(서버 PATCH도 거부 — 묶음 0). [열기]·[주소 복사]는 공개 화면이 열리는 때만(공개 범위 LINK이고 종료됨·운영자 비공개가 아닐 때).
// 날짜 줄 · 버튼 조건 · 딱지는 myData.ts의 규칙 함수. 추모관 값은 예시(10단계 교체 때 GET /api/me/memorials 응답에서 slug로 찾는다).

const EXAMPLE_ORIGIN = 'https://eobom.example';
const SUB_DESKTOP = '조문객이 헌화·방명록을 남길 수 있는 추모 공간입니다.';
const SUB_PHONE = '헌화·방명록을 남길 수 있는 추모 공간입니다.'; // 모바일만 "조문객이" 뺀다(10-16 개발자 확정)
const LOAD_FAIL = '목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.';
const EPITAPH_PLACEHOLDER = '예: 늘 그리운 모습으로 기억합니다';
// 시안 문구: 줄표(—) 없이 괄호로
const VISIBILITY_OPTIONS = [
  { value: 'LINK', label: '링크로만 공개(주소를 아는 사람만)' },
  { value: 'PRIVATE', label: '비공개(나만 볼 수 있음)' },
];

const plusDays = (ymd: string, days: number) => formatKstDate(new Date(`${ymd}T00:00:00+09:00`).getTime() + days * 86400000);

export function MemorialPage() {
  const [params] = useSearchParams();
  const slug = params.get('slug');
  return slug ? <ManageView slug={slug} /> : <MakeView />;
}

// 관리 화면 "보기 상태"에 올리는 추모관 고르기 — 목록에 있는 4곳 + 버튼 조건을 모두 볼 수 있게 더한 2곳
const PICK: { slug: string; label: string }[] = [
  { slug: 'hong-gildong', label: '운영중, 링크로만 공개' },
  { slug: 'choi-minsu', label: '운영중, 비공개 ([열기]·[주소 복사] 없음)' },
  { slug: 'kim-younghee', label: '열람만 가능, 비공개 ([계속 보존하기] 있음)' },
  { slug: 'jung-hana', label: '열람만 가능, 링크로만 공개 (버튼 전부)' },
  { slug: 'park-cheolsu', label: '종료됨 ([삭제]만)' },
  { slug: 'lee-sunja', label: '운영자가 비공개 처리함 ([수정] 없음)' },
];

// ───────────────────────── 4-6-1 만들기 ─────────────────────────

type MakeDemo = 'make' | 'has' | 'list-loading' | 'list-fail' | 'create-fail' | 'login';
type FieldKey = 'deceased' | 'falseReport' | 'reshared';

function MakeView() {
  const navigate = useNavigate();
  const phone = useIsPhone();
  const [demo, setDemo] = useState<MakeDemo>('make');
  const [name, setName] = useState('');
  const [death, setDeath] = useState('');
  const [epitaph, setEpitaph] = useState('');
  const [visibility, setVisibility] = useState('LINK');
  const [falseAgree, setFalseAgree] = useState(false);
  const [reshare, setReshare] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [summary, setSummary] = useState(false);
  const [busy, setBusy] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const options: DemoOption[] = [
    { value: 'make', label: '기본, 만든 추모관 없음' },
    { value: 'has', label: '만든 추모관 있음 (마이페이지 링크 한 줄)' },
    { value: 'login', label: '로그인 전', group: '상태' },
    { value: 'list-loading', label: '목록 불러오는 중 (링크 자리 한 줄)', group: '상태' },
    { value: 'list-fail', label: '목록 불러오기 실패 (링크 자리 한 줄)', group: '상태' },
    { value: 'create-fail', label: '만들기 실패 글 (저장하면 보임)', group: '상태' },
    ...PICK.map((p) => ({ value: `slug:${p.slug}`, label: p.label, group: '관리 화면으로 (?slug=)' })),
  ];

  const bar = (
    <DemoBar
      value={demo}
      options={options}
      onChange={(v) => {
        if (v.startsWith('slug:')) navigate(memorialManageUrl(v.slice(5)));
        else {
          setDemo(v as MakeDemo);
          setCreateError(null);
        }
      }}
    />
  );

  const title = '디지털 추모관';
  const desc = phone ? SUB_PHONE : SUB_DESKTOP;

  if (demo === 'login') {
    return (
      <div className="rd-container rd-screen">
        <MyGate title={title} desc={desc} screenName="디지털 추모관" />
        {bar}
      </div>
    );
  }

  const clear = (k: FieldKey) => setErrors((e) => ({ ...e, [k]: undefined }));
  const hasList = demo === 'has' || demo === 'create-fail';

  const submit = async () => {
    const e: Partial<Record<FieldKey, string>> = {};
    if (!name.trim()) e.deceased = '고인 성함을 입력해 주세요.';
    if (!falseAgree) e.falseReport = '확인이 필요한 항목입니다.';
    if (!reshare) e.reshared = '확인이 필요한 항목입니다.';
    const n = Object.keys(e).length;
    setErrors(e);
    setSummary(n > 0);
    setCreateError(null);
    if (n > 0) return;
    setBusy(true);
    await sleep(900);
    setBusy(false);
    if (demo === 'create-fail') {
      // 서버가 준 문구가 있으면 그대로, 없으면 이 글(코드 문구)
      setCreateError('추모관 개설 중 오류가 발생했습니다.');
      return;
    }
    const today = kstToday();
    const created: MyMemorial = {
      id: 'm-new', slug: 'new-memorial', deceasedName: name.trim(), deceasedDeathDate: death || null, epitaph: epitaph.trim() || null,
      visibility: visibility === 'PRIVATE' ? 'PRIVATE' : 'LINK', createdAt: today, closedAt: null, hiddenAt: null,
      expiresAt: plusDays(today, 395), frozenAt: null, purgeAt: null, canExtend: false, guestbookCount: 0, tributeCount: 0,
    };
    // 만든 뒤 → 그 추모관 관리 화면
    navigate(memorialManageUrl(created.slug), { state: { created } });
  };

  return (
    <div className="rd-container rd-screen">
      <div className="rd-mp-make">
        <div>
          <RdPageHead title={title} desc={desc} />
          {/* 만든 추모관 곳 수 = 마이페이지 "내가 만든 추모관 (N)"과 같은 수(닫힌 것 포함). 많아도 숫자 그대로 */}
          {hasList && (
            <div className="rd-mp-make__link">
              <RdTextLink href={PV.list} onClick={(e) => { e.preventDefault(); navigate(PV.list); }}>
                내 추모관 {MEMORIALS.length}곳 · 마이페이지에서 보기
              </RdTextLink>
            </div>
          )}
          {demo === 'list-loading' && <p className="rd-mp-make__linkline" role="status">불러오는 중...</p>}
          {demo === 'list-fail' && (
            <p className="rd-mp-make__linkline rd-mp-make__linkline--err" role="alert">
              <IconErrorCircle size={16} />
              <span>{LOAD_FAIL}</span>
            </p>
          )}
        </div>

        <form className="rd-mp-make__form" noValidate onSubmit={(e) => e.preventDefault()}>
          <RdField label="고인 성함" required error={errors.deceased}>
            {(p) => <RdInput {...p} placeholder="예: 홍길동" value={name} onChange={(e) => { setName(e.target.value); clear('deceased'); }} />}
          </RdField>
          <RdField label="사망일" optional>
            {(p) => <RdDate {...p} value={death} onChange={(e) => setDeath(e.target.value)} />}
          </RdField>
          <RdField label="추모 문구" optional>
            {(p) => <RdInput {...p} placeholder={EPITAPH_PLACEHOLDER} value={epitaph} onChange={(e) => setEpitaph(e.target.value)} />}
          </RdField>
          <RdField label="공개 범위">
            {(p) => (
              <RdSelect {...p} value={visibility} onChange={(e) => setVisibility(e.target.value)}>
                {VISIBILITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </RdSelect>
            )}
          </RdField>
          <div className="rd-mp-agrees">
            <AgreeRow kind="req" id="mem-false" checked={falseAgree} error={errors.falseReport} onChange={(v) => { setFalseAgree(v); if (v) clear('falseReport'); }}>
              허위로 추모관을 개설할 경우 법적 책임을 질 수 있다는 점에 동의합니다.
            </AgreeRow>
            <AgreeRow kind="req" id="mem-reshared" checked={reshare} error={errors.reshared} onChange={(v) => { setReshare(v); if (v) clear('reshared'); }}>
              이 추모관 링크를 전달받은 분이 다시 다른 곳에 공유할 수 있다는 점을 확인했습니다.
            </AgreeRow>
          </div>
          {createError && (
            <p className="rd-field__error" role="alert">
              <IconErrorCircle />
              <span>{createError}</span>
            </p>
          )}
          {/* 저장 줄에는 [추모관 만들기]만 — 쪽 화면이라 [취소]가 없다. 오류 요약은 뒷문장 없이(00-44 §8-3-2) */}
          <RdSaveBar errorCount={summary ? Object.values(errors).filter(Boolean).length : 0}>
            <RdButton place="bar" busy={busy} busyText="만드는 중…" onClick={submit}>추모관 만들기</RdButton>
          </RdSaveBar>
        </form>
      </div>
      {bar}
    </div>
  );
}

// ───────────────────────── 4-6-2 관리 · 4-6-3 상태 ─────────────────────────

type ManageDemo = 'ok' | 'login' | 'loading' | 'loadfail' | 'copyfail' | 'extendfail' | 'editfail' | 'deletefail';

// 변형을 보려면 그 버튼이 있는 추모관이어야 한다
const VARIANT_SLUG: Partial<Record<ManageDemo, string>> = {
  copyfail: 'hong-gildong',
  extendfail: 'jung-hana',
  editfail: 'hong-gildong',
  deletefail: 'hong-gildong',
};

function ManageView({ slug }: { slug: string }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [view, setView] = useState<ManageDemo>('ok');
  const created = (location.state as { created?: MyMemorial } | null)?.created;
  const found = created && created.slug === slug ? created : findMemorial(slug);
  const [patch, setPatch] = useState<Partial<MyMemorial>>({});
  const m = found ? { ...found, ...patch } : undefined;

  const [copyNote, setCopyNote] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null);
  const [extending, setExtending] = useState(false);
  const [extendMsg, setExtendMsg] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editEpitaph, setEditEpitaph] = useState('');
  const [editVisibility, setEditVisibility] = useState('LINK');
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteFail, setDeleteFail] = useState(false);

  // 다른 추모관으로 바뀌면 그 추모관의 고친 값 · 결과 글을 비운다(보기 상태 view는 유지)
  useEffect(() => {
    setPatch({});
    setCopyNote(null);
    setExtendMsg(null);
    setEditOpen(false);
    setDeleteOpen(false);
    setDeleteFail(false);
  }, [slug]);

  const options: DemoOption[] = [
    ...(created ? [{ value: `slug:${created.slug}`, label: '방금 만든 추모관 (만들기 화면에서 넘어옴)' }] : []),
    ...PICK.map((p) => ({ value: `slug:${p.slug}`, label: p.label, group: '추모관 고르기' })),
    { value: 'login', label: '로그인 전', group: '상태' },
    { value: 'loading', label: '불러오는 중', group: '상태' },
    { value: 'loadfail', label: '불러오기 실패', group: '상태' },
    { value: 'notfound', label: '남의 추모관 · 없는 주소 (찾을 수 없음)', group: '상태' },
    { value: 'copyfail', label: '[주소 복사] 실패 글', group: '변형' },
    { value: 'extendfail', label: '[계속 보존하기] 실패 글', group: '변형' },
    { value: 'editfail', label: '[수정] 창에서 저장하면 실패 글', group: '변형' },
    { value: 'deletefail', label: '[삭제] 확인하면 실패 글', group: '변형' },
    { value: 'make', label: '만들기 화면으로 (/preview/memorial)', group: '화면 바꾸기' },
  ];
  const demoValue = view !== 'ok' ? view : !m ? 'notfound' : `slug:${slug}`;

  const onDemo = (v: string) => {
    if (v === 'make') return navigate(PV.memorial);
    if (v.startsWith('slug:')) {
      setView('ok');
      return navigate(memorialManageUrl(v.slice(5)));
    }
    if (v === 'notfound') {
      setView('ok');
      return navigate(memorialManageUrl('unknown'));
    }
    const next = v as ManageDemo;
    setView(next);
    setCopyNote(null);
    setExtendMsg(null);
    setDeleteFail(false);
    const need = VARIANT_SLUG[next];
    if (need && need !== slug) navigate(memorialManageUrl(need));
  };
  const bar = <DemoBar value={demoValue} options={options} onChange={onDemo} />;

  if (view === 'login') {
    // 관리 화면은 제목만(故 ○○○는 로그인 뒤에야 안다)
    return (
      <div className="rd-container rd-screen">
        <MyGate title="추모관 관리" screenName="디지털 추모관" />
        {bar}
      </div>
    );
  }
  if (view === 'loading') {
    return (
      <div className="rd-container rd-screen">
        <div className="rd-mp-read">
          <RdPageHead title="추모관 관리" />
          <MyLine kind="loading">불러오는 중...</MyLine>
        </div>
        {bar}
      </div>
    );
  }
  if (view === 'loadfail') {
    return (
      <div className="rd-container rd-screen">
        <RdState kind="error" title="추모관을 불러오지 못했습니다" desc="잠시 후 다시 시도해 주세요.">
          <RdButton onClick={() => setView('ok')}>다시 시도</RdButton>
        </RdState>
        {bar}
      </div>
    );
  }
  if (!m) {
    // 남의 추모관과 없는 주소를 나누지 않는다 — 남의 추모관이 있다는 사실을 알리지 않으려는 것(05-01 §4.1 404 원칙)
    return (
      <div className="rd-container rd-screen">
        <RdState kind="missing" title="추모관을 찾을 수 없습니다" desc="주소를 다시 확인해 주세요.">
          <RdButton onClick={() => navigate(PV.list)}>내 부고장·추모관</RdButton>
        </RdState>
        {bar}
      </div>
    );
  }

  const s = memorialState(m);
  const btn = memorialButtons(m);
  const dateLine = memorialDateLine(m);

  const rows = [
    { name: '상태', value: <RdBadge kind={MEMORIAL_STATE_BADGE[s]}>{MEMORIAL_STATE_LABEL[s]}</RdBadge> },
    // 운영자가 내렸으면 공개 범위 글은 한 마디만(뒷말은 [수정]이 없어져 뺀다, 00-36 §4.8-3)
    { name: '공개 범위', value: s === 'hidden' ? '운영자가 비공개 처리함' : (VISIBILITY_LABEL[m.visibility] ?? m.visibility) },
    ...(m.epitaph ? [{ name: '추모 문구', value: m.epitaph }] : []),
    m.deceasedDeathDate ? { name: '사망일', value: formatKstDate(m.deceasedDeathDate) } : { name: '개설일', value: formatKstDate(m.createdAt) },
    // 단위는 코드 문구를 따른다(탈퇴 창 "○건", 공개 화면 "○번 헌화되었습니다")
    { name: '방명록', value: `${m.guestbookCount}건` },
    { name: '헌화', value: `${m.tributeCount}번` },
    ...(dateLine ? [{ name: dateLine.label, value: formatKstDate(dateLine.value) }] : []),
  ];

  const publicUrl = `${EXAMPLE_ORIGIN}/m/${m.slug}`;
  const copy = async () => {
    const ok = view === 'copyfail' ? false : await copyObituaryLink(publicUrl);
    setCopyNote(ok ? { tone: 'ok', text: '추모관 주소가 복사되었습니다.' } : { tone: 'err', text: '복사에 실패했습니다. 주소창의 링크를 직접 복사해 주세요.' });
  };

  const extend = async () => {
    setExtending(true);
    setExtendMsg(null);
    await sleep(900);
    setExtending(false);
    if (view === 'extendfail') {
      setExtendMsg({ tone: 'err', text: '연장에 실패했습니다. 잠시 후 다시 시도해주세요.' });
      return;
    }
    // 서버가 다시 395일 활성으로 돌린다(00-20 §8.1-4). 상태는 운영중, 날짜 줄이 보존 기간 종료일로 바뀐다.
    const expiresAt = plusDays(kstToday(), 395);
    setPatch((p) => ({ ...p, expiresAt, frozenAt: null, purgeAt: null, canExtend: false }));
    setExtendMsg({ tone: 'ok', text: `${formatKstDate(expiresAt)}까지 보존됩니다.` });
  };

  const openEdit = () => {
    setEditEpitaph(m.epitaph ?? '');
    setEditVisibility(m.visibility);
    setEditError(null);
    setEditOpen(true);
  };
  const save = async () => {
    setSaving(true);
    setEditError(null);
    await sleep(800);
    setSaving(false);
    if (view === 'editfail') {
      setEditError('추모관 수정 중 오류가 발생했습니다.');
      return;
    }
    setPatch((p) => ({ ...p, epitaph: editEpitaph.trim() || null, visibility: editVisibility === 'PRIVATE' ? 'PRIVATE' : 'LINK' }));
    setEditOpen(false);
  };

  const remove = async () => {
    setDeleting(true);
    await sleep(900);
    setDeleting(false);
    setDeleteOpen(false);
    if (view === 'deletefail') {
      setDeleteFail(true);
      return;
    }
    // 삭제 뒤 마이페이지 4-6으로
    navigate(PV.list);
  };

  return (
    <div className="rd-container rd-screen">
      <RdPageHead title="추모관 관리" desc={`故 ${m.deceasedName}`} />
      <div className="rd-mp-two">
        <section>
          <h2 className="rd-mp-h3">추모관 정보</h2>
          <MyDl tight rows={rows} />
        </section>

        {/* 관리 칸: [열기 ↗] · [주소 복사] · [수정] → 구분선 → [계속 보존하기] → 구분선 → [삭제].
            종료됨은 00-36 §4.8-3 표대로 버튼이 하나도 없어(삭제는 "종료됨이 아닐 때") 빈 칸을 그리지 않는다 — 편차 */}
        {(btn.openCopy || btn.edit || btn.extend || btn.remove) && (
          <div className="rd-mp-card" role="group" aria-label="추모관 관리">
            {btn.openCopy && (
              <div className="rd-mp-pair">
                <a className="rd-btn rd-btn--secondary rd-btn--screen" href={PV.openMemorial} target="_blank" rel="noopener noreferrer">
                  <span>열기</span>
                  <IconArrowOut size={14} />
                </a>
                <RdButton kind="secondary" onClick={copy}>
                  <IconCopy />
                  주소 복사
                </RdButton>
              </div>
            )}
            {btn.edit && <RdButton kind="secondary" onClick={openEdit}>수정</RdButton>}
            {copyNote && btn.openCopy && <MyResult tone={copyNote.tone}>{copyNote.text}</MyResult>}
            {(btn.extend || extendMsg?.tone === 'ok') && (
              <div className="rd-mp-sg rd-mp-sg--dot">
                {btn.extend ? (
                  <RdButton busy={extending} busyText="처리 중..." onClick={extend}>계속 보존하기</RdButton>
                ) : (
                  extendMsg && <MyResult tone="ok">{extendMsg.text}</MyResult>
                )}
                {extendMsg?.tone === 'err' && <MyResult tone="err">{extendMsg.text}</MyResult>}
              </div>
            )}
            {btn.remove && (
              <div className="rd-mp-sg">
                <RdButton kind="danger" onClick={() => { setDeleteFail(false); setDeleteOpen(true); }}>삭제</RdButton>
                {deleteFail && <MyResult tone="err">삭제에 실패했습니다. 잠시 후 다시 시도해주세요.</MyResult>}
              </div>
            )}
          </div>
        )}
      </div>
      {bar}

      {/* [수정] 창 — 추모 문구 · 공개 범위만(고인 성함 · 사망일은 고치지 않는다) */}
      {editOpen && (
        <RdDialog
          form
          width={560}
          title="추모관 수정"
          onClose={() => !saving && setEditOpen(false)}
          footer={
            <>
              <RdButton kind="secondary" place="dialog" disabled={saving} onClick={() => setEditOpen(false)}>취소</RdButton>
              <RdButton place="dialog" busy={saving} busyText="저장 중…" onClick={save}>저장</RdButton>
            </>
          }
        >
          <div className="rd-mp-editbody">
            <RdField label="추모 문구" optional>
              {(p) => <RdInput {...p} placeholder={EPITAPH_PLACEHOLDER} value={editEpitaph} onChange={(e) => setEditEpitaph(e.target.value)} />}
            </RdField>
            <RdField label="공개 범위">
              {(p) => (
                <RdSelect {...p} value={editVisibility} onChange={(e) => setEditVisibility(e.target.value)}>
                  {VISIBILITY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </RdSelect>
              )}
            </RdField>
            {editError && (
              <p className="rd-field__error" role="alert">
                <IconErrorCircle />
                <span>{editError}</span>
              </p>
            )}
          </div>
        </RdDialog>
      )}

      {/* [삭제] 확인 — 위험 확인 창이지만 "되돌릴 수 없습니다" 딱지는 없다(2단계 판 2-23 결정) */}
      {deleteOpen && (
        <RdDialog
          danger
          evenButtons
          title="추모관을 삭제하시겠어요?"
          onClose={() => !deleting && setDeleteOpen(false)}
          initialFocus="[data-rd-cancel]"
          footer={
            <>
              <RdButton kind="secondary" place="dialog" data-rd-cancel="" disabled={deleting} onClick={() => setDeleteOpen(false)}>취소</RdButton>
              <RdButton kind="danger" place="dialog" busy={deleting} busyText="삭제 중…" onClick={remove}>삭제</RdButton>
            </>
          }
        >
          <p className="rd-dialog__desc">삭제하면 이 추모관 링크로 더는 들어올 수 없습니다. 방명록·헌화 기록은 보관 기간 동안 남아 있습니다.</p>
        </RdDialog>
      )}
    </div>
  );
}
