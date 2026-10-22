import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RdBadge, RdButton, RdButtonRow, RdTextLink } from '../../parts/RdButtons';
import { RdPageHead, RdTabs } from '../../parts/RdNav';
import { RdNotice } from '../../parts/RdNotices';
import { RdTextarea } from '../../parts/RdInputs';
import { RdDialog, RdLoginGate } from '../../parts/RdModal';
import { IconChevronDown, IconChevronLeft, IconChevronRight, IconChevronUp } from '../../parts/icons';
import { useIsPhone } from '../../useIsPhone';
import { NoteSectionForm } from './NoteSectionForm';
import { PhotoFlow, type PhotoMode } from './PhotoFlow';
import { DemoBar, downloadText, SaveStatus, sleep, type DemoOption, type SaveState } from './prepCommon';
import {
  FAMILIES,
  INITIAL_DONE,
  INITIAL_TIMINGS,
  INITIAL_VALUES,
  NOTE_SECTIONS,
  summarize,
  TIMING_LABEL,
  WILL_REQS,
  WILL_TEXT,
  type Timing,
} from './noteData';

// 8단계 묶음 4 · /preview/ending-note — 1단계 캔버스 1-1~1-5(엔딩노트·유언장 초안·한눈에 보기·상태) + 1-6~1-10(사진 읽기).
// 서버 없이 예시 값으로 움직인다. 화면 글의 "섹션"은 "항목"으로(00-44 §6-3-10).

const DEMOS: DemoOption[] = [
  { value: 'normal', label: '기본 (작성 중)' },
  { value: 'login', label: '로그인 전' },
  { value: 'consent', label: '처음 (동의만)' },
  { value: 'nofamily', label: '지정한 가족이 없을 때' },
  { value: 'savefail', label: '저장 실패 (저장을 누르면)' },
  { value: 'up-format', label: '올리기 오류 ① 형식', group: '사진 읽기 (유언장 초안 탭)' },
  { value: 'up-count', label: '올리기 오류 ② 사진 개수', group: '사진 읽기 (유언장 초안 탭)' },
  { value: 'up-mixed', label: '올리기 오류 ③ PDF 2개·섞임', group: '사진 읽기 (유언장 초안 탭)' },
  { value: 'up-photo-size', label: '올리기 오류 ④ 사진 용량', group: '사진 읽기 (유언장 초안 탭)' },
  { value: 'up-pdf-size', label: '올리기 오류 ⑤ PDF 용량', group: '사진 읽기 (유언장 초안 탭)' },
  { value: 'ocr-fail', label: '알림 ⑥ 인식 실패', group: '사진 읽기 (유언장 초안 탭)' },
  { value: 'reocr-fail', label: '알림 ⑦ 다시 인식 실패', group: '사진 읽기 (유언장 초안 탭)' },
  { value: 'vault-loading', label: '보관한 사진 ⑧ 불러오는 중', group: '사진 읽기 (유언장 초안 탭)' },
  { value: 'vault-empty', label: '보관한 사진 ⑨ 없음', group: '사진 읽기 (유언장 초안 탭)' },
  { value: 'vault-error', label: '보관한 사진 ⑩ 불러오기 실패', group: '사진 읽기 (유언장 초안 탭)' },
  { value: 'bundle-loading', label: '묶음 ⑪ 여는 중', group: '사진 읽기 (유언장 초안 탭)' },
  { value: 'bundle-openfail', label: '묶음 ⑫ 열지 못함', group: '사진 읽기 (유언장 초안 탭)' },
  { value: 'bundle-delfail', label: '묶음 ⑬ 삭제 실패', group: '사진 읽기 (유언장 초안 탭)' },
  { value: 'result-pdf', label: '결과 ⑭ PDF를 올렸을 때', group: '사진 읽기 (유언장 초안 탭)' },
  { value: 'result-noloc', label: '결과 ⑮ 위치 없는 항목(날인)', group: '사진 읽기 (유언장 초안 탭)' },
];

function photoModeOf(demo: string): PhotoMode | null {
  if (demo.startsWith('up-') || demo === 'ocr-fail') return 'upload';
  if (demo.startsWith('result-')) return 'result';
  if (demo.startsWith('vault-') || demo.startsWith('bundle-') || demo === 'reocr-fail') return 'vault';
  return null;
}

export function EndingNotePage() {
  const phone = useIsPhone();
  const navigate = useNavigate();
  const [demo, setDemo] = useState('normal');
  const [tab, setTab] = useState<'notes' | 'will'>('notes');
  const [agreed, setAgreed] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [values, setValues] = useState(INITIAL_VALUES);
  const [timings, setTimings] = useState(INITIAL_TIMINGS);
  const [done, setDone] = useState(INITIAL_DONE);
  const [save, setSave] = useState<SaveState>('idle');
  const [glance, setGlance] = useState(false);
  const [will, setWill] = useState(WILL_TEXT);
  const [willSave, setWillSave] = useState<SaveState>('idle');
  const [big, setBig] = useState(false);
  const [photo, setPhoto] = useState<PhotoMode | null>(null);
  const alive = useRef(true);
  useEffect(() => () => { alive.current = false; }, []);

  const hasFamily = demo !== 'nofamily';
  const showConsent = demo === 'consent' && !agreed;

  // 보기 상태가 바뀌면 그 상태의 처음 모양으로
  useEffect(() => {
    setAgreed(false);
    setSave('idle');
    const m = photoModeOf(demo);
    if (m) {
      setTab('will');
      setPhoto(m);
    } else {
      setPhoto(null);
    }
  }, [demo]);

  const setValue = useCallback((k: string, v: string | boolean) => setValues((cur) => ({ ...cur, [k]: v })), []);
  const open = (id: string | null) => {
    setSave('idle');
    setOpenId(id);
  };

  const doSave = async (id: string) => {
    setSave('saving');
    await sleep(700);
    if (!alive.current) return;
    if (demo === 'savefail') {
      setSave('fail');
      return;
    }
    setDone((d) => ({ ...d, [id]: true }));
    setSave('ok');
  };

  const counts = useMemo(
    () =>
      FAMILIES.map((f) => ({
        f,
        n: NOTE_SECTIONS.filter((s) => (timings[s.id]?.[f.id] ?? 'none') !== 'none').length,
      })),
    [timings],
  );
  const publicLine = counts.some((c) => c.n > 0) ? `가족에게 공개한 항목: ${counts.map((c) => `${c.f.name}(${c.f.relation}) ${c.n}개`).join(' · ')}` : null;

  const badgeOf = (id: string): string | null => {
    const t = timings[id] ?? {};
    const vals = Object.values(t);
    if (vals.includes('now')) return TIMING_LABEL.now;
    if (vals.includes('after')) return TIMING_LABEL.after;
    return null;
  };

  const head = (
    <RdPageHead
      title="디지털 엔딩노트"
      desc="연명의료 의향 메모, 장례 희망 방식, 유언장 초안까지 표준화된 항목을 차근차근 채워두세요."
    />
  );

  if (demo === 'login') {
    return (
      <div className="rd-container rd-screen">
        {head}
        <div className="rd-pr-gatewrap" style={{ position: 'relative', minHeight: 520 }}>
          <RdLoginGate screenName="엔딩노트" contained />
        </div>
        <DemoBar value={demo} options={DEMOS} onChange={setDemo} />
      </div>
    );
  }

  const sectionBody = (id: string, sheet?: boolean) => {
    const s = NOTE_SECTIONS.find((x) => x.id === id)!;
    return (
      <NoteSectionForm
        section={s}
        values={values}
        setValue={setValue}
        timings={timings[id]}
        setTiming={(fid, t) => setTimings((cur) => ({ ...cur, [id]: { ...cur[id], [fid]: t as Timing } }))}
        hasFamily={hasFamily}
        save={save}
        onSave={() => doSave(id)}
        onCancel={() => open(null)}
        sheet={sheet}
      />
    );
  };

  const stateText = (id: string) => (done[id] ? '완료' : '미작성');

  const notesTab = (
    <>
      {!hasFamily && (
        <RdNotice tone="info" title="지정한 가족이 없어 항목을 공개할 대상을 지정할 수 없습니다." action={<RdTextLink href="#" onClick={(e) => e.preventDefault()}>가족 지정하기</RdTextLink>} />
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
                  <span className={`rd-pr-toc__mark${done[s.id] ? ' rd-pr-toc__mark--done' : ''}`} aria-hidden="true" />
                  <span style={{ flex: 1 }}>{s.title}</span>
                  <span className="rd-t-small">{stateText(s.id)}</span>
                </button>
              </li>
            ))}
            <li>
              <button type="button" className="rd-pr-toc__item" onClick={() => setTab('will')}>
                <span className="rd-pr-toc__mark" aria-hidden="true" />
                <span style={{ flex: 1 }}>유언장 초안</span>
              </button>
            </li>
          </ul>
          <RdButton kind="secondary" place="row" onClick={() => setGlance(true)}>한눈에 보기</RdButton>
        </nav>

        <ul className="rd-pr-acc">
          {NOTE_SECTIONS.map((s) => {
            const isOpen = !phone && openId === s.id;
            const badge = badgeOf(s.id);
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
                  <span className={`rd-pr-acc__state${done[s.id] ? ' rd-pr-acc__state--done' : ''}`}>{stateText(s.id)}</span>
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

  const willTab = (
    <>
      <div className="rd-pr-will">
        <section className="rd-pr-will__main" aria-label="초안">
          <div className="rd-pr-will__bar">
            <h2 className="rd-t-section">초안 (직접 입력)</h2>
            <div className="rd-pr-will__tools">
              <RdButton kind="secondary" place="row" onClick={() => setPhoto('upload')}>사진으로 불러오기</RdButton>
              <RdButton kind="secondary" place="row" onClick={() => setPhoto('result')}>최근 인식 결과 보기</RdButton>
              <RdButton kind="secondary" place="row" onClick={() => setPhoto('vault')}>보관한 사진</RdButton>
            </div>
          </div>
          <RdNotice tone="info" title="인식된 글은 틀릴 수 있습니다. 사진과 대조해 고친 뒤 저장하세요." />
          <div className={`rd-pr-will__area${big ? ' rd-pr-will__area--big' : ''}`}>
            <RdTextarea aria-label="유언장 초안" rows={16} maxLength={20000} value={will} onChange={(e) => setWill(e.target.value)} />
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
            <RdTextLink
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setTab('notes');
                open('willloc');
              }}
            >
              유언장 소재 안내
            </RdTextLink>
          )}
        </div>
        <RdButtonRow place="row">
          {!phone && <RdButton kind="secondary" place="row" aria-pressed={big} onClick={() => setBig((v) => !v)}>큰 글씨로 보기</RdButton>}
          {!phone && <RdButton kind="secondary" place="row" onClick={() => window.print()}>인쇄하기</RdButton>}
          <RdButton kind="secondary" place="row" onClick={() => navigator.clipboard?.writeText(will)}>텍스트 복사</RdButton>
          <RdButton kind="secondary" place="row" onClick={() => downloadText('유언장_초안.txt', will)}>.txt 내려받기</RdButton>
          <RdButton
            place="row"
            busy={willSave === 'saving'}
            busyText="저장"
            onClick={async () => {
              setWillSave('saving');
              await sleep(700);
              if (alive.current) setWillSave(demo === 'savefail' ? 'fail' : 'ok');
            }}
          >
            저장
          </RdButton>
        </RdButtonRow>
      </div>
    </>
  );

  return (
    <div className="rd-container rd-screen">
      {head}
      {publicLine && <p className="rd-t-support" style={{ margin: '-16px 0 0' }}>{publicLine}</p>}

      {showConsent ? (
        <RdNotice
          tone="caution"
          title="작성을 시작하기 전에 확인해 주세요"
          action={<RdButton onClick={() => setAgreed(true)}>동의하고 시작하기</RdButton>}
        >
          작성 내용은 암호화 보관되며, 운영자는 열람하지 않습니다.
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

      <p className="rd-pr-help">마음이 힘드실 때 자살예방 상담전화 109(24시간)</p>
      <DemoBar value={demo} options={DEMOS} onChange={setDemo} />

      {/* 모바일: 구간을 아래에서 올라오는 판으로 */}
      {phone && openId && (
        <RdDialog
          form
          title={NOTE_SECTIONS.find((s) => s.id === openId)!.title}
          onClose={() => open(null)}
          footer={
            <>
              <RdButton kind="secondary" place="dialog" onClick={() => open(null)}>취소</RdButton>
              <RdButton place="dialog" busy={save === 'saving'} busyText="저장" onClick={() => doSave(openId)}>저장</RdButton>
            </>
          }
        >
          <button type="button" className="rd-pr-back" onClick={() => open(null)}>
            <IconChevronLeft />목록으로
          </button>
          {sectionBody(openId, true)}
        </RdDialog>
      )}

      {/* 한눈에 보기 — 데스크톱만 */}
      {glance && !phone && (
        <RdDialog
          form
          title="한눈에 보기"
          closeX
          onClose={() => setGlance(false)}
          footer={<RdButton kind="secondary" place="dialog" onClick={() => setGlance(false)}>닫기</RdButton>}
        >
          <div className="rd-pr-stack" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {!NOTE_SECTIONS.some((s) => done[s.id]) && (
              <RdNotice tone="info" title="아직 작성하신 항목이 없습니다. 아래 목록에서 항목을 눌러 하나씩 채워보세요." />
            )}
            <ul className="rd-list">
              {NOTE_SECTIONS.map((s) => (
                <li className="rd-list__li" key={s.id}>
                  <button
                    type="button"
                    className="rd-row"
                    onClick={() => {
                      setGlance(false);
                      setTab('notes');
                      open(s.id);
                    }}
                  >
                    <span className="rd-row__main">
                      <span className="rd-row__title" style={{ fontSize: 16 }}>{s.title}</span>
                      <span className="rd-row__info">{done[s.id] ? `완료 · ${summarize(s.id, values) || '내용 있음'}` : '미작성'}</span>
                    </span>
                    <span className="rd-row__chev"><IconChevronRight /></span>
                  </button>
                </li>
              ))}
              <li className="rd-list__li">
                <button type="button" className="rd-row" onClick={() => { setGlance(false); setTab('will'); }}>
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
          key={`${photo}-${demo}`}
          mode={photo}
          demo={demo}
          draftEmpty={will.trim() === ''}
          onClose={() => setPhoto(null)}
          onApply={(text, how) => {
            setWill((cur) => (how === 'append' ? `${cur.replace(/\s+$/, '')}\n\n${text}` : text));
            setPhoto(null);
          }}
        />
      )}
    </div>
  );
}
