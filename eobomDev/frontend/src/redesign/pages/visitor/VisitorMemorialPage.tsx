import React, { useEffect, useRef, useState } from 'react';
import { formatKST, formatDeathDate } from '../../../utils/obituaryCard';
import { copyObituaryLink } from '../../../utils/kakaoShare';
import { sleep, type DemoOption } from '../../parts/RdDemo';
import { RdButton } from '../../parts/RdButtons';
import { RdField, RdInput } from '../../parts/RdInputs';
import { RdDialog, RdLoginGate } from '../../parts/RdModal';
import { RdState } from '../../parts/RdState';
import { IconChevronLeft, IconChevronRight, IconErrorCircle } from '../../parts/icons';
import { Chrysanthemum, VisitorShell, VsConnectionFailed, VsFoot } from './visitorParts';
import {
  DEFAULT_EPITAPH,
  GUESTBOOK,
  MEMORIAL_PLAIN,
  MEMORIAL_WITH_PORTRAIT,
  type ExGuestEntry,
  type ExMemorial,
} from './visitorData';
import './visitor.css';

// 8단계 묶음 6 · /preview/visitor/memorial — 추모관 공개 화면(판 3-4 기본 · 3-5 방명록 창 · 3-6 상태 · 3-4 글 삭제 창).
// 정본: 05-01 §6.1-2 · 3단계 캔버스 묶음 2. 예시 값은 지어낸 값(visitorData.ts). 서버를 부르지 않는다 —
// 방명록 남기기·삭제·헌화는 미리보기 안에서만 움직인다(실제 연결은 10단계 교체 때).

const PAGE_SIZE = 5;
const DELETE_FAIL = '삭제 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
const WRITE_FAIL = '방명록 작성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
const VIEWER_NAME = '김영희';

type Dlg = null | 'gate' | 'form' | 'formError' | 'formBusy' | 'del' | 'delBusy' | 'delFail';
type Tribute = 'idle' | 'busy' | 'duplicate' | 'done' | 'error';

const DEMOS: DemoOption[] = [
  { value: 'portrait', label: '영정 사진 있음 · 로그인 후 (3-4)', group: '기본' },
  { value: 'plain', label: '영정 사진 없음 · 추모 문구 있음 (3-4)', group: '기본' },
  { value: 'out', label: '로그인 전 — 내 글 [삭제] 없음 (3-4)', group: '기본' },
  { value: 'empty', label: '방명록 없음 (3-4)', group: '기본' },
  { value: 'listFail', label: '방명록 불러오기 실패 (3-6)', group: '상태' },
  { value: 'tributeDup', label: '이미 헌화함 (3-6)', group: '상태' },
  { value: 'tributeError', label: '헌화 오류 (3-6)', group: '상태' },
  { value: 'loading', label: '불러오는 중 (3-6)', group: '상태' },
  { value: 'offline', label: '접속 실패 (3-6)', group: '상태' },
  { value: 'missing', label: '없음 (3-6)', group: '상태' },
  { value: 'dlgGate', label: '방명록 창 · 로그인 전 (3-5)', group: '창' },
  { value: 'dlgForm', label: '방명록 창 · 처음 (3-5)', group: '창' },
  { value: 'dlgFormError', label: '방명록 창 · 오류 글 (3-5)', group: '창' },
  { value: 'dlgFormBusy', label: '방명록 창 · 남기는 중… (3-5)', group: '창' },
  { value: 'dlgDel', label: '글 삭제 창 · 기본 (3-4)', group: '창' },
  { value: 'dlgDelBusy', label: '글 삭제 창 · 삭제 중… (3-4)', group: '창' },
  { value: 'dlgDelFail', label: '글 삭제 창 · 실패 (3-4)', group: '창' },
];

const IconHeart = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </svg>
);

const IconCopy = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

/** 쪽 번호는 한 번에 최대 5개(00-39 §6.7 "방명록 길이" · 05-01 §6.1-2). 지금 쪽이 가운데 오게 밀어 보인다. */
function pageNumbers(page: number, total: number): number[] {
  const count = Math.min(5, total);
  let start = Math.max(1, page - 2);
  start = Math.min(start, total - count + 1);
  return Array.from({ length: count }, (_, i) => start + i);
}

function GuestPager({ page, total, onChange }: { page: number; total: number; onChange: (p: number) => void }) {
  if (total <= 1) return null;
  return (
    <nav className="rd-vs-pager" aria-label="방명록 쪽">
      <button type="button" className="rd-vs-pager__side" aria-label="이전 쪽" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        <IconChevronLeft size={18} />
      </button>
      {/* 데스크톱: 쪽 번호 */}
      <span className="rd-vs-pager__nums rd-vs-only-desktop">
        {pageNumbers(page, total).map((n) => (
          <button key={n} type="button" className="rd-vs-pager__n" aria-current={n === page ? 'page' : undefined} onClick={() => onChange(n)}>
            {n}
          </button>
        ))}
      </span>
      {/* 모바일: ‹ 1 / 6 › */}
      <span className="rd-vs-pager__now rd-vs-only-phone" aria-live="polite">{page} / {total}</span>
      <button type="button" className="rd-vs-pager__side" aria-label="다음 쪽" disabled={page >= total} onClick={() => onChange(page + 1)}>
        <IconChevronRight size={18} />
      </button>
    </nav>
  );
}

function GuestFormDialog({
  error,
  busy,
  initialRelation,
  initialMessage,
  onCancel,
  onSubmit,
}: {
  error?: string;
  busy?: boolean;
  initialRelation?: string;
  initialMessage?: string;
  onCancel: () => void;
  onSubmit: (relation: string, message: string) => void;
}) {
  const [relation, setRelation] = useState(initialRelation ?? '');
  const [message, setMessage] = useState(initialMessage ?? '');
  return (
    <RdDialog
      form
      closeX
      width={560}
      title="방명록 남기기"
      onClose={busy ? () => undefined : onCancel}
      footer={
        <>
          <RdButton kind="secondary" place="dialog" disabled={busy} onClick={onCancel}>취소</RdButton>
          {/* 글이 비면 아무 일도 하지 않는다(지금 코드는 textarea required) */}
          <RdButton place="dialog" busy={busy} busyText="남기는 중…" onClick={() => message.trim() && onSubmit(relation, message)}>
            방명록 남기기
          </RdButton>
        </>
      }
    >
      <p className="rd-vs-dlg__author">작성자: {VIEWER_NAME}</p>
      <RdField label="고인과의 관계" optional>
        {(p) => <RdInput {...p} type="text" value={relation} onChange={(e) => setRelation(e.target.value)} />}
      </RdField>
      <RdField label="고인에게 전하는 글" required>
        {(p) => <textarea {...p} className="rd-input rd-input--area" value={message} onChange={(e) => setMessage(e.target.value)} />}
      </RdField>
      {error && (
        <p className="rd-field__error" role="alert">
          <IconErrorCircle />
          <span>{error}</span>
        </p>
      )}
    </RdDialog>
  );
}

function DeleteDialog({
  name,
  message,
  busy,
  error,
  onCancel,
  onDelete,
}: {
  name: string;
  message: string;
  busy?: boolean;
  error?: string;
  onCancel: () => void;
  onDelete: () => void;
}) {
  // 위험 확인 창(붉은 테두리). 문구는 지금 MyGuestbookPage 그대로 — "되돌릴 수 없습니다" 같은 새 글은 붙이지 않는다(3단계 확정 ⑩).
  return (
    <RdDialog
      danger
      evenButtons
      title="이 글을 삭제할까요?"
      onClose={busy ? () => undefined : onCancel}
      initialFocus="[data-rd-cancel]"
      footer={
        <>
          <RdButton kind="secondary" place="dialog" data-rd-cancel="" disabled={busy} onClick={onCancel}>취소</RdButton>
          <RdButton kind="danger" place="dialog" busy={busy} busyText="삭제 중…" onClick={onDelete}>삭제</RdButton>
        </>
      }
    >
      <p className="rd-dialog__desc">{name} 추모관에 남긴 글이 삭제되어 다른 분들에게도 보이지 않게 됩니다.</p>
      <p className="rd-vs-dlg__quote">{message}</p>
      {error && (
        <p className="rd-vs-dlg__fail" role="alert">
          <IconErrorCircle size={16} />
          <span>{error}</span>
        </p>
      )}
    </RdDialog>
  );
}

function MemorialSkeleton() {
  return (
    <div className="rd-vs-wrap" role="status" aria-label="불러오는 중">
      <div className="rd-vs-card">
        <div className="rd-vs-head">
          <div className="rd-vs-sk rd-vs-copy" style={{ width: 88, height: 36 }} />
          <div className="rd-vs-sk" style={{ width: 160, height: 13, marginBottom: 8 }} />
          <div className="rd-vs-sk" style={{ width: 190, height: 28, marginBottom: 8 }} />
          <div className="rd-vs-sk" style={{ width: 120, height: 13 }} />
        </div>
        <div className="rd-vs-sec">
          <div className="rd-vs-sk" style={{ width: 80, height: 16, marginBottom: 12 }} />
          {[0, 1, 2].map((i) => (
            <div key={i} className="rd-vs-guest">
              <div className="rd-vs-guest__head">
                <div className="rd-vs-sk" style={{ width: 90, height: 13 }} />
                <div className="rd-vs-sk" style={{ width: 70, height: 13 }} />
              </div>
              <div className="rd-vs-sk" style={{ width: '75%', height: 16 }} />
            </div>
          ))}
        </div>
        <div className="rd-vs-sec">
          <div className="rd-vs-tribute">
            <div className="rd-vs-sk rd-vs-sk--btn44" style={{ width: 120 }} />
            <div className="rd-vs-sk" style={{ width: 150, height: 14 }} />
            <div className="rd-vs-sk rd-vs-sk--btn44" style={{ width: 120 }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function VisitorMemorialPage() {
  const [demo, setDemo] = useState('portrait');
  const loggedIn = demo !== 'out';
  const memorial: ExMemorial = demo === 'plain' ? MEMORIAL_PLAIN : MEMORIAL_WITH_PORTRAIT;

  const [entries, setEntries] = useState<ExGuestEntry[]>(GUESTBOOK);
  const [page, setPage] = useState(1);
  const [tribute, setTribute] = useState<Tribute>('idle');
  const [count, setCount] = useState(memorial.tributeCount);
  const [dlg, setDlg] = useState<Dlg>(null);
  const [target, setTarget] = useState<ExGuestEntry | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  // 보기 상태를 고르면 그 상태로 처음부터 다시 그린다.
  const select = (v: string) => {
    setDemo(v);
    setEntries(v === 'empty' ? [] : GUESTBOOK);
    setPage(1);
    setFeedback(null);
    setCount(MEMORIAL_WITH_PORTRAIT.tributeCount);
    setTribute(v === 'tributeDup' ? 'duplicate' : v === 'tributeError' ? 'error' : 'idle');
    const mine = GUESTBOOK.find((g) => g.mine) ?? null;
    setTarget(mine);
    setDlg(
      ({ dlgGate: 'gate', dlgForm: 'form', dlgFormError: 'formError', dlgFormBusy: 'formBusy', dlgDel: 'del', dlgDelBusy: 'delBusy', dlgDelFail: 'delFail' } as Record<string, Dlg>)[v] ?? null,
    );
  };

  const totalPages = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));
  const shown = entries.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const isMine = (g: ExGuestEntry) => loggedIn && !!g.mine;

  // 모바일: 목록을 좌우로 밀어 쪽을 넘긴다(결정 기록 3-4 쪽 넘김).
  const touchX = useRef<number | null>(null);
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) < 50) return;
    setPage((p) => Math.min(totalPages, Math.max(1, p + (dx < 0 ? 1 : -1))));
  };

  const onCopy = async () => {
    const ok = await copyObituaryLink(window.location.href);
    setFeedback(ok ? { ok, text: '링크가 복사되었습니다.' } : { ok, text: '복사에 실패했습니다. 주소창의 링크를 직접 복사해 주세요.' });
  };

  const onTribute = async () => {
    setTribute('busy');
    await sleep(500);
    setCount((c) => c + 1);
    setTribute('done');
  };

  const submitGuest = async (relation: string, message: string) => {
    setDlg('formBusy');
    await sleep(700);
    // 새 글을 남기면 1쪽으로(05-01 §6.1-2 / 00-39 §6.7)
    setEntries((list) => [
      { id: `n${Date.now()}`, authorName: VIEWER_NAME, relationToDeceased: relation.trim() || null, message: message.trim(), createdAt: new Date().toISOString(), mine: true },
      ...list,
    ]);
    setPage(1);
    setDlg(null);
  };

  const doDelete = async () => {
    if (!target) return;
    setDlg('delBusy');
    await sleep(700);
    // 지운 뒤 그 줄이 목록에서 빠진다
    setEntries((list) => list.filter((g) => g.id !== target.id));
    setDlg(null);
    setTarget(null);
  };

  let body: React.ReactNode;
  if (demo === 'loading') {
    body = <MemorialSkeleton />;
  } else if (demo === 'offline') {
    body = <div className="rd-vs-wrap"><VsConnectionFailed onRetry={() => select('portrait')} /></div>;
  } else if (demo === 'missing') {
    body = (
      <div className="rd-vs-wrap">
        <RdState kind="missing" title="추모관을 찾을 수 없습니다." desc="링크가 만료되었거나 잘못된 주소일 수 있습니다." />
      </div>
    );
  } else {
    const hasPortrait = !!memorial.portraitUrl;
    const locked = tribute === 'busy' || tribute === 'duplicate' || tribute === 'done';
    body = (
      <div className="rd-vs-wrap">
        <article className="rd-vs-card">
          <header className={`rd-vs-head${hasPortrait ? ' has-portrait' : ''}`}>
            <button type="button" className="rd-vs-copy" onClick={onCopy}>
              <IconCopy />
              링크 복사
            </button>
            {feedback && (
              <p role="status" className={`rd-vs-copy-note${feedback.ok ? '' : ' is-fail'}`}>{feedback.text}</p>
            )}
            <Chrysanthemum className="rd-vs-flower" />
            {hasPortrait && <div className="rd-vs-portrait" role="img" aria-label="영정 사진 자리" />}
            <p className="rd-vs-lede">삼가 고인의 명복을 빕니다</p>
            <h1 className="rd-vs-name">故 {memorial.deceasedName}</h1>
            {memorial.deceasedDeathDate && <p className="rd-vs-death">{formatDeathDate(memorial.deceasedDeathDate)} 별세</p>}
            {/* 비면 기본 문구 — 표시만, DB에 저장하지 않는다(05-01 §6.1) */}
            <p className="rd-vs-epitaph">{memorial.epitaph || DEFAULT_EPITAPH}</p>
          </header>

          <section className="rd-vs-sec">
            <h2 className="rd-vs-sec__title rd-vs-sec__title--guest">추모 방명록</h2>
            {demo === 'listFail' ? (
              <p className="rd-vs-listfail" role="alert">
                <IconErrorCircle size={20} />
                <span>방명록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.</span>
              </p>
            ) : entries.length === 0 ? (
              <p className="rd-vs-empty">아직 남겨진 글이 없습니다.</p>
            ) : (
              <>
                <div
                  className="rd-vs-guestlist"
                  onTouchStart={(e) => {
                    touchX.current = e.touches[0].clientX;
                  }}
                  onTouchEnd={onTouchEnd}
                >
                  {shown.map((g) => (
                    <div key={g.id} className={`rd-vs-guest${isMine(g) ? ' is-mine' : ''}`}>
                      <div className="rd-vs-guest__main">
                        <div className="rd-vs-guest__head">
                          <span className="rd-vs-guest__name">
                            {g.authorName}
                            {g.relationToDeceased ? ` · ${g.relationToDeceased}` : ''}
                          </span>
                          <span className="rd-vs-guest__date">{formatKST(g.createdAt)}</span>
                        </div>
                        <p className="rd-vs-guest__msg">{g.message}</p>
                      </div>
                      {isMine(g) && (
                        // 내가 쓴 글 줄에만. 수정 버튼은 없다(3단계 확정 ⑩).
                        // 데스크톱 = 줄 오른쪽, 일시 바로 아래 · 모바일 = 글 아래 줄 오른쪽 (일시는 머리 줄 그대로, CSS가 가른다)
                        <div className="rd-vs-guest__side">
                          <span className="rd-vs-guest__date rd-vs-guest__date--side">{formatKST(g.createdAt)}</span>
                          <RdButton
                            kind="danger"
                            place="row"
                            onClick={() => {
                              setTarget(g);
                              setDlg('del');
                            }}
                          >
                            삭제
                          </RdButton>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <GuestPager page={page} total={totalPages} onChange={setPage} />
              </>
            )}
          </section>

          <section className="rd-vs-sec">
            <div className="rd-vs-tribute">
              <RdButton kind="secondary" className="rd-vs-tribute__guest" onClick={() => setDlg(loggedIn ? 'form' : 'gate')}>방명록 남기기</RdButton>
              <p className="rd-vs-tribute__count">지금까지 <strong>{count}번</strong> 헌화되었습니다.</p>
              <RdButton className="rd-vs-tribute__btn" disabled={locked} onClick={onTribute}>
                <IconHeart />
                헌화하기
              </RdButton>
            </div>
            {tribute === 'duplicate' && <p className="rd-vs-tribute__status">이미 헌화하셨습니다.</p>}
            {tribute === 'done' && <p className="rd-vs-tribute__status">헌화하셨습니다.</p>}
            {tribute === 'error' && (
              <p className="rd-vs-tribute__status is-error" role="alert">헌화 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.</p>
            )}
          </section>
        </article>

        <VsFoot />
      </div>
    );
  }

  return (
    <VisitorShell demo={{ value: demo, options: DEMOS, onChange: select }}>
      {body}
      {dlg === 'gate' && <RdLoginGate screenName="방명록 남기기" onClose={() => setDlg(null)} onLogin={() => select('portrait')} />}
      {(dlg === 'form' || dlg === 'formError' || dlg === 'formBusy') && (
        <GuestFormDialog
          key={dlg === 'form' ? 'blank' : 'filled'}
          error={dlg === 'formError' ? WRITE_FAIL : undefined}
          busy={dlg === 'formBusy'}
          initialRelation={dlg === 'form' ? '' : '직장 동료'}
          initialMessage={dlg === 'form' ? '' : '갑작스러운 소식에 믿기지 않습니다. 편히 쉬시길 바랍니다.'}
          onCancel={() => setDlg(null)}
          onSubmit={submitGuest}
        />
      )}
      {(dlg === 'del' || dlg === 'delBusy' || dlg === 'delFail') && target && (
        <DeleteDialog
          name={memorial.deceasedName}
          message={target.message}
          busy={dlg === 'delBusy'}
          error={dlg === 'delFail' ? DELETE_FAIL : undefined}
          onCancel={() => setDlg(null)}
          onDelete={doDelete}
        />
      )}
    </VisitorShell>
  );
}
