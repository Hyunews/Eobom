import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiFetch } from '../../../lib/api';
import { scrollPageTo } from '../../../lib/scroll';
import { LoginRequired } from '../../auth/LoginRequired';
import { useAuth } from '../../auth/AuthProvider';
import { RdBadge, RdButton, RdButtonRow, RdTextLink } from '../../parts/RdButtons';
import { RdPageHead, RdTabs } from '../../parts/RdNav';
import { RdNotice } from '../../parts/RdNotices';
import { RdTextarea } from '../../parts/RdInputs';
import { RdDialog } from '../../parts/RdModal';
import { RdState } from '../../parts/RdState';
import { IconChevronDown, IconChevronLeft, IconChevronRight, IconChevronUp } from '../../parts/icons';
import { useIsPhone } from '../../useIsPhone';
import { NoteSectionForm } from './NoteSectionForm';
import { PhotoFlow, type PhotoMode } from './PhotoFlow';
import { downloadText, printWillDraft, SaveStatus, type SaveState } from './prepCommon';
import type { RecentOcr } from './photoOcr';
import {
  applySaved,
  EMPTY_VALUES,
  NOT_A_WILL_NOTICE,
  NOTE_SECTIONS,
  payloadOf,
  relationLabel,
  summarize,
  TIMING_LABEL,
  WILL_REQS,
  type FamilyItem,
  type GrantItem,
  type NoteValues,
  type Timing,
} from './noteData';

// 10단계 묶음 10-2 · 디지털 엔딩노트 — 1단계 캔버스 1-1~1-5(엔딩노트·유언장 초안·한눈에 보기·상태) + 1-6~1-10(사진 읽기).
// 서버 `/api/ending-note`(+ `/grants` · `/policy-agree`) · `/api/family-designations` · `/api/ocr/status`. 규칙은 지금 화면(`pages/EndingNotePage.tsx`)에서 옮겼다.
// 화면 글의 "섹션"은 "항목"으로(00-44 §6-3-10).

const TITLE = '디지털 엔딩노트';
const DESC = '연명의료 의향 메모, 장례 희망 방식, 유언장 초안까지 표준화된 항목을 차근차근 채워두세요.';
const WILL_DRAFT_INIT = '- 주소 : \n- 날짜 : \n- 성명 : \n- 내용 : ';

export function EndingNotePage() {
  return (
    <LoginRequired screenName="엔딩노트" title={TITLE} desc={DESC}>
      <EndingNoteBody />
    </LoginRequired>
  );
}

function EndingNoteBody() {
  const phone = useIsPhone();
  const { showToast } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  // 06-04 §6.1-1 T-5·T-6 — 탭은 주소(?tab=will)와 연동. tab 없음·모르는 값 = 엔딩노트. 전환은 push라 뒤로가기로 이전 탭에 돌아온다.
  const tab: 'notes' | 'will' = params.get('tab') === 'will' ? 'will' : 'notes';
  const setTab = (t: 'notes' | 'will') => {
    if (t !== tab) setParams(t === 'will' ? { tab: 'will' } : {});
  };

  // 서버가 정본(재로그인 복원) — 동의 시각·동의 문구·완료 표시·항목 값·가족·공개 시점을 한 번에 받는다.
  const [load, setLoad] = useState<'loading' | 'ready' | 'fail'>('loading');
  const [policyAgreedAt, setPolicyAgreedAt] = useState<string | null>(null);
  const [policyNotice, setPolicyNotice] = useState('');
  const [agreeing, setAgreeing] = useState(false);
  const [sectionState, setSectionState] = useState<Record<string, boolean>>({});
  const [values, setValues] = useState<NoteValues>(EMPTY_VALUES);
  /** 항목별 마지막 저장 값 — "한눈에 보기"와 취소가 이걸 본다(2026-09-03 사람 지시) */
  const [savedValues, setSavedValues] = useState<Record<string, any>>({});
  const [family, setFamily] = useState<FamilyItem[]>([]);
  const [grants, setGrants] = useState<GrantItem[]>([]);
  /** 서버에 실제로 저장된 공개 시점 — 화면의 grants는 저장 전 선택도 섞여 있다 */
  const [savedGrants, setSavedGrants] = useState<GrantItem[]>([]);
  const [saves, setSaves] = useState<Record<string, SaveState>>({});
  const [openId, setOpenId] = useState<string | null>(null);
  const [glance, setGlance] = useState(false);
  // 유언장 초안
  const [will, setWill] = useState(WILL_DRAFT_INIT);
  const [big, setBig] = useState(false);
  // 사진 읽기 — 06-06 §5. 서버 스위치가 꺼져 있으면 버튼 자체를 숨긴다("업체 없이 업로드 버튼을 노출하지 않는다")
  const [ocrEnabled, setOcrEnabled] = useState(false);
  const [photoStorageEnabled, setPhotoStorageEnabled] = useState(false);
  const [photo, setPhoto] = useState<{ mode: PhotoMode; n: number } | null>(null);
  /** 🔴 이 컴포넌트 메모리에만 둔다 — localStorage·sessionStorage·IndexedDB·서버 저장 금지 */
  const [recentOcr, setRecentOcr] = useState<RecentOcr | null>(null);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  const pendingGrants = useRef<Record<string, Record<string, { timing: string | null; grantId?: string }>>>({});
  const pendingScroll = useRef<string | null>(null);
  const alive = useRef(true);
  // 개발 모드(StrictMode)는 마운트→해제→마운트를 한 번 돌린다 — 다시 붙을 때 true로 되돌려야 응답을 받는다
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  const loadAll = useCallback(() => {
    setLoad('loading');
    Promise.all([
      apiFetch<any>('/api/ending-note', 'USER'),
      apiFetch<FamilyItem[]>('/api/family-designations', 'USER'),
      apiFetch<GrantItem[]>('/api/ending-note/grants', 'USER'),
    ])
      .then(([d, familyList, grantList]) => {
        if (!alive.current) return;
        setPolicyAgreedAt(d.policyAgreedAt);
        setPolicyNotice(d.policyNotice || '');
        setSectionState(d.sectionState || {});
        const bySection: Record<string, any> = {};
        (d.entries || []).forEach((e: { section: string; value: unknown }) => { bySection[e.section] = e.value; });
        setValues(NOTE_SECTIONS.reduce((acc, s) => applySaved(s.id, acc, bySection[s.id]), EMPTY_VALUES));
        if (bySection.WILL_DRAFT) setWill(bySection.WILL_DRAFT.draftText || '');
        setSavedValues(bySection);
        // 권한을 줄 수 있는 대상은 DECLINED(거절)만 뺀 지정 전원 — 서버도 같은 규칙으로 다시 막는다(00-41 §7.3 · 06-04 §8.3-2)
        if (Array.isArray(familyList)) setFamily(familyList.filter((f) => f.status !== 'DECLINED'));
        if (Array.isArray(grantList)) {
          setGrants(grantList);
          setSavedGrants(grantList);
        }
        setLoad('ready');
      })
      // 못 불러왔는데 빈 칸으로 열어 두면 저장 한 번에 서버의 글을 덮어쓴다 — 열지 않고 다시 시도하게 한다
      .catch(() => { if (alive.current) setLoad('fail'); });
  }, []);
  useEffect(loadAll, [loadAll]);

  useEffect(() => {
    apiFetch<{ enabled: boolean; photoStorageEnabled?: boolean }>('/api/ocr/status')
      .then((d) => {
        setOcrEnabled(d.enabled);
        setPhotoStorageEnabled(!!d.enabled && !!d.photoStorageEnabled);
      })
      .catch(() => {
        setOcrEnabled(false);
        setPhotoStorageEnabled(false);
      });
  }, []);

  const agree = async () => {
    setAgreeing(true);
    try {
      const d = await apiFetch<{ policyAgreedAt: string }>('/api/ending-note/policy-agree', 'USER', { method: 'POST' });
      setPolicyAgreedAt(d.policyAgreedAt);
    } catch {
      showToast('처리하지 못했습니다. 다시 시도해 주세요.', 'warn');
    } finally {
      if (alive.current) setAgreeing(false);
    }
  };

  const patch = useCallback((p: Partial<NoteValues>) => setValues((cur) => ({ ...cur, ...p })), []);
  const open = (id: string | null) => {
    if (id) setSaves((s) => ({ ...s, [id]: 'idle' }));
    setOpenId(id);
  };

  // ── 가족 공개 시점 ──
  const timingOf = (section: string) => (familyId: string): Timing => {
    const g = grants.find((x) => x.section === section && x.designationId === familyId && !x.revokedAt);
    return (g?.timing as Timing) ?? 'none';
  };
  // select는 바로 반응하되(화면 = grants 낙관적 갱신) 서버 전송은 그 항목의 "저장"을 눌러야 나간다 — 본문과 같은 저장 버튼이 기준(2026-09-03).
  const setTiming = (section: string) => (familyId: string, t: Timing) => {
    const active = grants.find((x) => x.section === section && x.designationId === familyId && !x.revokedAt);
    const timing = t === 'none' ? null : t;
    setGrants((prev) => {
      if (timing === null) {
        if (!active) return prev; // 이미 비공개라 철회할 것이 없음
        return prev.map((g) => (g.id === active.id ? { ...g, revokedAt: new Date().toISOString() } : g));
      }
      const idx = prev.findIndex((g) => g.designationId === familyId && g.section === section);
      if (idx === -1) {
        return [...prev, { id: `temp-${familyId}-${section}`, designationId: familyId, section, timing, revokedAt: null, updatedAt: new Date().toISOString() }];
      }
      const next = [...prev];
      next[idx] = { ...next[idx], timing, revokedAt: null };
      return next;
    });
    pendingGrants.current[section] = { ...pendingGrants.current[section], [familyId]: { timing, grantId: active?.id } };
  };

  // ── 저장 ──
  const setSave = (id: string, s: SaveState) => setSaves((cur) => ({ ...cur, [id]: s }));
  const saveSection = async (section: string, value: unknown) => {
    setSave(section, 'saving');
    try {
      const d = await apiFetch<{ sectionState: Record<string, boolean> }>(`/api/ending-note/sections/${section}`, 'USER', {
        method: 'PUT',
        body: JSON.stringify({ value }),
      });
      setSectionState(d.sectionState || {});
      setSavedValues((prev) => ({ ...prev, [section]: value }));
      // 그 항목에 대기 중인 "가족 공개 시점" 변경도 같은 저장으로 함께 내보낸다
      const pending = pendingGrants.current[section];
      if (pending) {
        await Promise.all(
          Object.entries(pending).map(async ([designationId, change]) => {
            if (change.timing === null) {
              if (!change.grantId) return;
              await apiFetch(`/api/ending-note/grants/${change.grantId}/revoke`, 'USER', { method: 'PATCH' });
              setSavedGrants((prev) => prev.map((g) => (g.id === change.grantId ? { ...g, revokedAt: new Date().toISOString() } : g)));
            } else {
              const updated = await apiFetch<GrantItem>('/api/ending-note/grants', 'USER', {
                method: 'PUT',
                body: JSON.stringify({ designationId, section, timing: change.timing }),
              });
              setGrants((prev) => prev.map((g) => (g.designationId === designationId && g.section === section ? updated : g)));
              setSavedGrants((prev) => {
                const idx = prev.findIndex((g) => g.designationId === designationId && g.section === section);
                if (idx === -1) return [...prev, updated];
                const next = [...prev];
                next[idx] = updated;
                return next;
              });
            }
          }),
        );
        delete pendingGrants.current[section];
      }
      if (!alive.current) return;
      setSave(section, 'ok');
      window.setTimeout(() => { if (alive.current) setSave(section, 'idle'); }, 2000);
    } catch {
      if (alive.current) setSave(section, 'fail');
    }
  };

  // "취소" — 편집 중인 값과 대기 중인 공개 시점 변경을 마지막 저장 값으로 되돌린다
  const cancelSection = (section: string) => {
    setValues((cur) => applySaved(section, cur, savedValues[section]));
    delete pendingGrants.current[section];
    setGrants((prev) => [...prev.filter((g) => g.section !== section), ...savedGrants.filter((g) => g.section === section)]);
    open(null);
  };

  // ── 화면에 쓰는 값 ──
  const stateText = (id: string) => (sectionState[id] ? '완료' : '미작성');
  const timingBadge = (section: string): string | null => {
    const active = savedGrants.filter((g) => g.section === section && !g.revokedAt);
    if (active.length === 0) return null;
    return active.some((g) => g.timing === 'IMMEDIATE') ? TIMING_LABEL.IMMEDIATE : TIMING_LABEL.POSTMORTEM;
  };
  // 06-04 §8.3-1 — 제목 아래 한 줄 "가족에게 공개한 항목 — 이름(관계) N개 · …". 저장된 유효 권한의 서로 다른 항목 수(WILL_DRAFT 제외).
  // 🔴 색·아이콘·경고·권유 없음 — 0개도 같은 모양(00-39 규칙 5).
  const publicLine = useMemo(() => {
    if (family.length === 0) return null;
    const parts = family.map((f) => {
      const n = new Set(savedGrants.filter((g) => g.designationId === f.id && !g.revokedAt && g.section !== 'WILL_DRAFT').map((g) => g.section)).size;
      return `${f.name}(${relationLabel(f)}) ${n}개`;
    });
    return `가족에게 공개한 항목: ${parts.join(' · ')}`;
  }, [family, savedGrants]);

  const goWillLocation = () => {
    setTab('notes');
    open('WILL_LOCATION');
    pendingScroll.current = 'WILL_LOCATION';
  };
  useEffect(() => {
    const id = pendingScroll.current;
    if (!id || tab !== 'notes' || phone) return;
    pendingScroll.current = null;
    document.getElementById(`pr-sec-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [tab, openId, phone]);

  const copyWill = async () => {
    try {
      await navigator.clipboard.writeText(will);
      showToast('복사되었습니다.');
    } catch {
      showToast('복사에 실패했습니다. 직접 선택해 복사해 주세요.', 'warn');
    }
  };

  const head = (
    <>
      <RdPageHead title={TITLE} desc={DESC} />
      {publicLine && <p className="rd-t-support" style={{ margin: '-16px 0 0' }}>{publicLine}</p>}
    </>
  );

  if (load === 'loading') {
    return (
      <div className="rd-container rd-screen">
        <RdPageHead title={TITLE} desc={DESC} />
        <RdState kind="working" title="불러오고 있습니다." />
      </div>
    );
  }
  if (load === 'fail') {
    return (
      <div className="rd-container rd-screen">
        <RdPageHead title={TITLE} desc={DESC} />
        <RdState kind="error" title="엔딩노트를 불러오지 못했습니다." desc="잠시 뒤 다시 시도해 주세요.">
          <RdButton onClick={loadAll}>다시 불러오기</RdButton>
        </RdState>
      </div>
    );
  }

  const sectionBody = (id: string, sheet?: boolean) => {
    const s = NOTE_SECTIONS.find((x) => x.id === id)!;
    return (
      <NoteSectionForm
        section={s}
        values={values}
        patch={patch}
        family={family}
        timingOf={timingOf(id)}
        setTiming={setTiming(id)}
        photoStorageEnabled={photoStorageEnabled}
        save={saves[id] ?? 'idle'}
        onSave={() => saveSection(id, payloadOf(id, values))}
        onCancel={() => cancelSection(id)}
        sheet={sheet}
      />
    );
  };

  const notesTab = (
    <>
      {family.length === 0 && (
        <RdNotice tone="info" title="지정한 가족이 없어 항목을 공개할 대상을 지정할 수 없습니다." action={<RdTextLink href="/preview/mypage" onClick={(e) => { e.preventDefault(); navigate('/preview/mypage'); }}>가족 지정하기</RdTextLink>} />
      )}
      <div className="rd-pr-notes">
        <nav className="rd-pr-toc" aria-label="목차">
          <p className="rd-pr-toc__title">목차</p>
          <ul className="rd-pr-toc__list">
            {NOTE_SECTIONS.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  className="rd-pr-toc__item"
                  aria-current={openId === s.id ? 'true' : undefined}
                  onClick={() => {
                    open(s.id);
                    window.setTimeout(() => document.getElementById(`pr-sec-${s.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
                  }}
                >
                  <span className={`rd-pr-toc__mark${sectionState[s.id] ? ' rd-pr-toc__mark--done' : ''}`} aria-hidden="true" />
                  <span style={{ flex: 1 }}>{s.title}</span>
                  <span className="rd-t-small">{stateText(s.id)}</span>
                </button>
              </li>
            ))}
            <li>
              <button type="button" className="rd-pr-toc__item" onClick={() => { setTab('will'); scrollPageTo(0, 'smooth'); }}>
                <span className={`rd-pr-toc__mark${sectionState.WILL_DRAFT ? ' rd-pr-toc__mark--done' : ''}`} aria-hidden="true" />
                <span style={{ flex: 1 }}>유언장 초안</span>
              </button>
            </li>
          </ul>
          <RdButton kind="secondary" place="row" onClick={() => setGlance(true)}>한눈에 보기</RdButton>
        </nav>

        <ul className="rd-pr-acc">
          {NOTE_SECTIONS.map((s) => {
            const isOpen = !phone && openId === s.id;
            const badge = timingBadge(s.id);
            return (
              <li className="rd-pr-acc__item" key={s.id} id={`pr-sec-${s.id}`}>
                <button
                  type="button"
                  className="rd-pr-acc__head"
                  aria-expanded={phone ? undefined : isOpen}
                  onClick={() => open(isOpen ? null : s.id)}
                >
                  <span className="rd-pr-acc__title">{s.title}</span>
                  {badge && <RdBadge kind="state">{badge}</RdBadge>}
                  <span className={`rd-pr-acc__state${sectionState[s.id] ? ' rd-pr-acc__state--done' : ''}`}>{stateText(s.id)}</span>
                  <span className="rd-pr-acc__chev" aria-hidden="true">
                    {phone ? <IconChevronRight /> : isOpen ? <IconChevronUp /> : <IconChevronDown />}
                  </span>
                </button>
                {!phone && (
                  <div className={`rd-pr-acc__panel${isOpen ? ' is-open' : ''}`} aria-hidden={!isOpen}>
                    <div className="rd-pr-acc__panel-in">{sectionBody(s.id)}</div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );

  const willSave = saves.WILL_DRAFT ?? 'idle';
  const willTab = (
    <>
      {/* 06-05 §7.2 (2026-09-30 개발자 확정) — 음성으로 남기려는 사람이 찾는 자리. 설명 문구는 두지 않는다. */}
      <div style={{ marginBottom: 16 }}>
        <RdTextLink href="/preview/farewell-messages" onClick={(e) => { e.preventDefault(); navigate('/preview/farewell-messages'); }}>음성 메시지 남기기</RdTextLink>
      </div>
      <div className="rd-pr-willnotice"><RdNotice tone="caution" title={NOT_A_WILL_NOTICE} /></div>
      <div className="rd-pr-will">
        <section className="rd-pr-will__main" aria-label="초안">
          <div className="rd-pr-will__bar">
            <h2 className="rd-t-section">초안 (직접 입력)</h2>
            {ocrEnabled && (
              <div className="rd-pr-will__tools">
                <RdButton kind="secondary" place="row" onClick={() => setPhoto({ mode: 'upload', n: Date.now() })}>사진으로 불러오기</RdButton>
                {recentOcr && <RdButton kind="secondary" place="row" onClick={() => setPhoto({ mode: 'result', n: Date.now() })}>최근 인식 결과 보기</RdButton>}
                {photoStorageEnabled && <RdButton kind="secondary" place="row" onClick={() => setPhoto({ mode: 'vault', n: Date.now() })}>보관한 사진</RdButton>}
              </div>
            )}
          </div>
          {/* 06-06 §6 단계 5 — 사진으로 초안을 채운 뒤에는 편집 영역 바로 위에서 계속 보여준다 */}
          {showDisclaimer && <RdNotice tone="info" title="인식된 글은 틀릴 수 있습니다. 사진과 대조해 고친 뒤 저장하세요." />}
          <div className={`rd-pr-will__area${big ? ' rd-pr-will__area--big' : ''}`}>
            <RdTextarea aria-label="유언장 초안" rows={16} maxLength={20000} value={will} placeholder="유언장 초안 내용을 직접 입력해 주세요." onChange={(e) => setWill(e.target.value)} />
          </div>
        </section>
        <aside className="rd-pr-will__side">
          <div className="rd-pr-req">
            <h2 className="rd-pr-req__title">자필증서 유언장의 4대 요건</h2>
            {WILL_REQS.map((r) => (
              <div className="rd-pr-req__row" key={r}>
                <span className="rd-toc__mark" aria-hidden="true" style={{ width: 14, height: 14, border: '1.5px solid var(--rd-ink-small)', borderRadius: '50%', display: 'inline-block' }} />
                {r}
              </div>
            ))}
            <p className="rd-pr-req__note">※ 이어봄은 위 항목을 자동으로 확인하지 않습니다. 직접 확인해 주세요.</p>
          </div>
          <RdNotice tone="caution" title="이 초안을 보고 직접 손으로 옮겨 쓰십시오. 컴퓨터로 작성한 문서는 자필증서 유언장으로 인정되지 않습니다." />
        </aside>
      </div>
      <div className="rd-pr-willbar">
        <div className="rd-pr-willbar__left">
          <SaveStatus state={willSave} />
          {willSave === 'ok' && (
            <RdTextLink href="#" onClick={(e) => { e.preventDefault(); goWillLocation(); }}>
              유언장 소재 안내
            </RdTextLink>
          )}
        </div>
        <RdButtonRow place="row">
          {/* 사람 지시(09-29) — 모바일에서는 큰 글씨·인쇄 버튼을 두지 않는다. */}
          {!phone && <RdButton kind="secondary" place="row" aria-pressed={big} onClick={() => setBig((v) => !v)}>{big ? '보통 글씨로' : '큰 글씨로 보기'}</RdButton>}
          {!phone && <RdButton kind="secondary" place="row" onClick={() => printWillDraft(will, NOT_A_WILL_NOTICE, big)}>인쇄하기</RdButton>}
          <RdButton kind="secondary" place="row" onClick={copyWill}>텍스트 복사</RdButton>
          <RdButton kind="secondary" place="row" onClick={() => downloadText('유언장_초안.txt', will)}>.txt 내려받기</RdButton>
          <RdButton place="row" busy={willSave === 'saving'} busyText="저장" onClick={() => saveSection('WILL_DRAFT', { draftText: will })}>
            저장
          </RdButton>
        </RdButtonRow>
      </div>
    </>
  );

  const phoneSection = phone && openId ? NOTE_SECTIONS.find((s) => s.id === openId) : undefined;
  const phoneSave = openId ? saves[openId] ?? 'idle' : 'idle';

  return (
    <div className="rd-container rd-screen">
      {head}

      {/* 작성 시작 시점 동의(06-03 §5) — 가입 시점이 아니다. 문구는 서버가 내려준다(정본이 한 곳) */}
      {!policyAgreedAt ? (
        <RdNotice
          tone="caution"
          title="작성을 시작하기 전에 확인해 주세요"
          action={<RdButton busy={agreeing} busyText="처리 중" onClick={agree}>동의하고 시작하기</RdButton>}
        >
          {policyNotice || '작성 내용은 암호화 보관되며, 운영자는 열람하지 않습니다.'}
        </RdNotice>
      ) : (
        <>
          <RdTabs
            label="엔딩노트"
            tabs={[
              { value: 'notes', label: '엔딩노트' },
              { value: 'will', label: '유언장 초안' },
            ]}
            value={tab}
            onChange={(v) => setTab(v as 'notes' | 'will')}
          />
          {tab === 'notes' ? notesTab : willTab}
        </>
      )}

      {/* 06-03 §4.2 (10-12 결정) — 공적 창구 상시 안내 한 줄. 🔴 번호·명칭·운영 시간은 게시 전 외부 확인 대상 */}
      <p className="rd-pr-help">마음이 힘드실 때 자살예방 상담전화 109(24시간)</p>

      {/* 모바일: 항목을 아래에서 올라오는 판으로 */}
      {phoneSection && openId && (
        <RdDialog
          form
          title={phoneSection.title}
          onClose={() => cancelSection(openId)}
          footer={
            <>
              <RdButton kind="secondary" place="dialog" disabled={phoneSave === 'saving'} onClick={() => cancelSection(openId)}>취소</RdButton>
              <RdButton place="dialog" busy={phoneSave === 'saving'} busyText="저장" onClick={() => saveSection(openId, payloadOf(openId, values))}>저장</RdButton>
            </>
          }
        >
          <button type="button" className="rd-pr-back" onClick={() => cancelSection(openId)}>
            <IconChevronLeft />목록으로
          </button>
          {sectionBody(openId, true)}
        </RdDialog>
      )}

      {/* 한눈에 보기 — 데스크톱만. 🔴 입력 중인 값이 아니라 마지막으로 저장한 값으로 그린다 */}
      {glance && !phone && (
        <RdDialog
          form
          title="한눈에 보기"
          closeX
          onClose={() => setGlance(false)}
          footer={<RdButton kind="secondary" place="dialog" onClick={() => setGlance(false)}>닫기</RdButton>}
        >
          <div className="rd-pr-stack" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {!NOTE_SECTIONS.some((s) => sectionState[s.id]) && (
              <RdNotice tone="info" title="아직 작성하신 항목이 없습니다. 아래 목록에서 항목을 눌러 하나씩 채워보세요." />
            )}
            <ul className="rd-list">
              {NOTE_SECTIONS.map((s) => {
                const sum = sectionState[s.id] ? summarize(s.id, savedValues[s.id]) : '';
                const badge = timingBadge(s.id) ?? TIMING_LABEL.none;
                return (
                  <li className="rd-list__li" key={s.id}>
                    <button
                      type="button"
                      className="rd-row"
                      onClick={() => {
                        setGlance(false);
                        setTab('notes');
                        open(s.id);
                        pendingScroll.current = s.id;
                      }}
                    >
                      <span className="rd-row__main">
                        <span className="rd-row__title" style={{ fontSize: 16 }}>{s.title}</span>
                        <span className="rd-row__info">{sectionState[s.id] ? `완료${sum ? ` · ${sum}` : ''} · ${badge}` : `미작성 · ${badge}`}</span>
                      </span>
                      <span className="rd-row__chev"><IconChevronRight /></span>
                    </button>
                  </li>
                );
              })}
              <li className="rd-list__li">
                <button type="button" className="rd-row" onClick={() => { setGlance(false); setTab('will'); scrollPageTo(0, 'smooth'); }}>
                  <span className="rd-row__main">
                    <span className="rd-row__title" style={{ fontSize: 16 }}>유언장 초안</span>
                    <span className="rd-row__info">본인 전용. 내용은 여기 표시되지 않습니다.</span>
                  </span>
                  <span className="rd-row__chev"><IconChevronRight /></span>
                </button>
              </li>
            </ul>
          </div>
        </RdDialog>
      )}

      {photo && (
        <PhotoFlow
          key={`${photo.mode}-${photo.n}`}
          mode={photo.mode}
          photoStorageEnabled={photoStorageEnabled}
          recent={recentOcr}
          draftEmpty={will.trim() === ''}
          onRecognized={setRecentOcr}
          onClose={() => setPhoto(null)}
          onApply={(text, how) => {
            setWill((cur) => (how === 'append' && cur.trim() ? `${cur}\n\n${text}` : text));
            setShowDisclaimer(true);
            setPhoto(null);
          }}
        />
      )}
    </div>
  );
}
