import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { RdButton, type RdButtonKind, type RdButtonPlace } from '../../parts/RdButtons';
import { sleep, type DemoOption } from '../../parts/RdDemo';
import { RdField, RdInput, RdSelect } from '../../parts/RdInputs';
import { RdDialog } from '../../parts/RdModal';
import { RdState } from '../../parts/RdState';
import { IconChevronLeft, IconSearch } from '../../parts/icons';
import { StatusText } from '../partner/partnerCommon';
import { AdminDemoSelect, AdminShellFor, AdminTitle, IconKey, useAdminPreview } from './AdminShell';
import { PREVIEW_PAGE_SIZE, type Tone } from './adminSamples';
import { badgesOf, type AdminRole } from './adminData';
import './adminScreens.css';

// 8단계 묶음 13 · 운영자 화면 공통 조각. 정본: 00-37 §4.1(목록 380 + 고른 건의 상세 카드 · 이어봄 창 · 열쇠) · §3.3.
// 화면마다 같은 짜임(제목 줄 → 거르기 줄 → 목록 380 + 상세 → 쪽 넘김)을 쓰므로 한 곳에서 끼운다.

export const SUPER_ONLY = 'SUPERADMIN만';

export const useIsSuper = () => useAdminPreview().role === 'SUPERADMIN';

// ───────────── 열쇠 버튼 ─────────────
/**
 * SUPERADMIN만 하는 일의 버튼 — 열쇠 그림(00-37 §3.3). OPERATOR로 들어오면 숨기지 않고 흐리게(눌리지 않음) + 아래 한 줄 "SUPERADMIN만".
 * 다른 이유로 막을 때(예: 이미 탈퇴 유예 중)는 `blockedReason`을 준다 — 그 글이 우선한다.
 */
export function SuperButton({
  children,
  kind = 'primary',
  place = 'screen',
  blockedReason,
  disabled,
  busy,
  busyText,
  onClick,
}: {
  children: React.ReactNode;
  kind?: RdButtonKind;
  place?: RdButtonPlace;
  blockedReason?: string;
  disabled?: boolean;
  busy?: boolean;
  busyText?: string;
  onClick?: () => void;
}) {
  const isSuper = useIsSuper();
  const off = !isSuper || !!blockedReason || !!disabled;
  return (
    <RdButton
      kind={kind}
      place={place}
      busy={busy}
      busyText={busyText}
      disabled={off}
      disabledReason={!isSuper ? SUPER_ONLY : blockedReason}
      onClick={onClick}
    >
      <span className="rd-ad-keybtn"><IconKey size={16} />{children}</span>
    </RdButton>
  );
}

// ───────────── 쪽 넘김 — "n / m 페이지 (총 n건)" ─────────────
export function AdminPager({ page, total, count, onChange }: { page: number; total: number; count: number; onChange: (p: number) => void }) {
  return (
    <nav className="rd-pager" aria-label="쪽 넘김">
      <button type="button" className="rd-btn rd-btn--secondary rd-btn--row rd-pager__btn" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        <span>이전</span>
      </button>
      <span className="rd-pager__now" aria-live="polite">{page} / {total} 페이지 (총 {count}건)</span>
      <button type="button" className="rd-btn rd-btn--secondary rd-btn--row rd-pager__btn" disabled={page >= total} onClick={() => onChange(page + 1)}>
        <span>다음</span>
      </button>
    </nav>
  );
}

// ───────────── 미리보기 전용 줄 ─────────────
export type AdminView = 'ready' | 'empty' | 'loading' | 'loadfail';
const VIEWS: DemoOption[] = [
  { value: 'ready', label: '기본' },
  { value: 'empty', label: '빈 목록' },
  { value: 'loading', label: '불러오는 중', group: '상태' },
  { value: 'loadfail', label: '불러오기 실패', group: '상태' },
];
const ROLES: DemoOption[] = [
  { value: 'SUPERADMIN', label: 'SUPERADMIN' },
  { value: 'OPERATOR', label: 'OPERATOR (열쇠 버튼 흐림)' },
];

/** 미리보기 전용 — 실제 화면에는 없다(10단계 교체 때 지운다) */
export function AdminDemoBar({ view, onView }: { view: AdminView; onView: (v: AdminView) => void }) {
  const { role, setPreview } = useAdminPreview();
  return (
    <div className="rd-demo">
      <AdminDemoSelect label="미리보기 전용 · 보기 상태" value={view} options={VIEWS} onChange={(v) => onView(v as AdminView)} />
      <AdminDemoSelect label="로그인한 등급" value={role} options={ROLES} onChange={(v) => setPreview({ role: v as AdminRole })} />
    </div>
  );
}

/** 불러오는 중 · 불러오기 실패 — 본문 자리 */
export function AdminViewNotice({ view }: { view: AdminView }) {
  if (view === 'loading') return <p className="rd-pt-line" role="status">불러오는 중…</p>;
  if (view === 'loadfail') return <p className="rd-pt-line rd-pt-line--err" role="alert">불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>;
  return null;
}

// ───────────── 목록 380 + 고른 건의 상세 카드 ─────────────
export interface AdminListItem {
  id: string;
  node: React.ReactNode;
}

/**
 * 일이 쌓이는 화면의 틀 — 제목 줄(메뉴 이름 + 총 n건) · 거르기 줄 · 목록 380 + 상세 카드 · 쪽 넘김. 줄 안에서 펼치거나 창을 띄우지 않는다.
 * `resetKey`가 바뀌면(거르기 값이 바뀌면) 1쪽·첫 건으로 돌아간다. 주소의 `?pick=<id>`가 이 목록에 있으면 그 건을 연다(회원 정지 창의 "각 글로 가는 링크").
 */
export function AdminListScreen({
  current,
  title,
  filters,
  items,
  renderDetail,
  emptyTitle,
  resetKey = '',
  extra,
  above,
  initialId,
}: {
  current: string;
  title: string;
  filters?: React.ReactNode;
  items: AdminListItem[];
  renderDetail: (id: string) => React.ReactNode;
  emptyTitle: string;
  resetKey?: string;
  /** 본문 맨 아래, 미리보기 줄 위에 더 두는 것(창 등) */
  extra?: React.ReactNode;
  /** 제목 줄 바로 아래에 더 두는 것(되돌아가기 글 등) */
  above?: React.ReactNode;
  /** 처음에 열어 둘 건 — 없으면 주소의 `?pick=` */
  initialId?: string;
}) {
  const [params] = useSearchParams();
  const pick = initialId ?? params.get('pick');
  const [view, setView] = useState<AdminView>('ready');
  const [page, setPage] = useState(() => {
    const at = pick ? items.findIndex((i) => i.id === pick) : -1;
    return at >= 0 ? Math.floor(at / PREVIEW_PAGE_SIZE) + 1 : 1;
  });
  const [selected, setSelected] = useState<string | null>(pick);
  const first = useRef(true);

  const shown = view === 'ready' ? items : [];
  const totalPages = Math.max(1, Math.ceil(shown.length / PREVIEW_PAGE_SIZE));
  const pageItems = useMemo(() => shown.slice((page - 1) * PREVIEW_PAGE_SIZE, page * PREVIEW_PAGE_SIZE), [shown, page]);

  useEffect(() => {
    if (first.current) {
      first.current = false; // 처음 열 때는 주소의 ?pick 을 지우지 않는다
      return;
    }
    setPage(1);
    setSelected(null);
  }, [resetKey, view]);
  // 거른 결과에서 사라진 건이 상세에 남지 않게
  const active = pageItems.find((i) => i.id === selected) ?? pageItems[0] ?? null;

  return (
    <AdminShellFor current={current} badges={badgesOf(null)}>
      <div className="rd-ad-screen">
        <AdminTitle>
          {title} <span className="rd-pt-count">총 {shown.length}건</span>
        </AdminTitle>
        {above}
        {filters && <div className="rd-ad-filters">{filters}</div>}
        {view !== 'ready' && <AdminViewNotice view={view} />}
        {view === 'empty' || (view === 'ready' && shown.length === 0) ? (
          <RdState kind="empty" title={emptyTitle} />
        ) : (
          view === 'ready' && (
            <>
              <div className="rd-ad-split">
                <div className="rd-ad-listcol">
                  <ul className="rd-pt-list">
                    {pageItems.map((i) => (
                      <li key={i.id}>
                        <a
                          href={`#${i.id}`}
                          className={`rd-pt-row${active?.id === i.id ? ' is-on' : ''}`}
                          aria-current={active?.id === i.id ? 'true' : undefined}
                          onClick={(e) => {
                            e.preventDefault();
                            setSelected(i.id);
                          }}
                        >
                          <span className="rd-pt-row__text">{i.node}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                  <AdminPager page={page} total={totalPages} count={shown.length} onChange={setPage} />
                </div>
                <section className="rd-pt-detail" aria-label="고른 건 상세">
                  {active && renderDetail(active.id)}
                </section>
              </div>
            </>
          )
        )}
        {extra}
        <AdminDemoBar view={view} onView={setView} />
      </div>
    </AdminShellFor>
  );
}

/** 목록 줄 안 — 위 줄(굵은 이름 + 상태) · 아래 보조 줄들 */
export function AdminRowText({ top, tone, status, lines }: { top: React.ReactNode; tone: Tone; status: string; lines?: React.ReactNode[] }) {
  return (
    <>
      <span className="rd-pt-row__top">
        <b>{top}</b>
        <StatusText tone={tone}>{status}</StatusText>
      </span>
      {lines?.filter(Boolean).map((l, i) => (
        <span key={i} className={i === 0 ? 'rd-pt-row__what' : 'rd-pt-row__who'}>{l}</span>
      ))}
    </>
  );
}

// ───────────── 상세 카드 ─────────────
export function AdminDetailCard({ title, tone, status, children }: { title: React.ReactNode; tone?: Tone; status?: string; children: React.ReactNode }) {
  return (
    <div className="rd-pt-detail__card">
      <div className="rd-pt-detail__head">
        <h2 className="rd-pt-detail__no rd-ad-detail__title">{title}</h2>
        {status && tone && <StatusText tone={tone}>{status}</StatusText>}
      </div>
      {children}
    </div>
  );
}

/** 이름 : 값 목록 */
export function AdminKv({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <dl className="rd-ad-kv">
      {rows.map(([k, v]) => (
        <React.Fragment key={k}>
          <dt>{k}</dt>
          <dd>{v}</dd>
        </React.Fragment>
      ))}
    </dl>
  );
}

/** 상세 카드 안 한 줄 안내(정지 사유 등) */
export function AdminNote({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <p className="rd-ad-note">
      {label && <b>{label}</b>} {children}
    </p>
  );
}

/** 모바일 아님 — 데스크톱 전용이라 되돌아가기 글은 격자 → 상세 전환에서만 쓴다 */
export function AdminBackLink({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <a
      className="rd-pt-back"
      href="#back"
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
    >
      <IconChevronLeft size={14} />
      {children}
    </a>
  );
}

// ───────────── 거르기 줄 ─────────────
export function AdminFilterRow({
  search,
  onSearch,
  searchLabel,
  placeholder,
  select,
  onSelect,
  options,
  selectLabel,
  children,
}: {
  search?: string;
  onSearch?: (v: string) => void;
  searchLabel?: string;
  placeholder?: string;
  select?: string;
  onSelect?: (v: string) => void;
  options?: { value: string; label: string }[];
  selectLabel?: string;
  children?: React.ReactNode;
}) {
  // 글을 치는 동안은 목록을 바꾸지 않고 [검색]을 눌러야 거른다(판 6-16·6-24 "시설명 검색 + [검색]")
  const [draft, setDraft] = useState(search ?? '');
  return (
    <form
      className="rd-ad-filterrow"
      onSubmit={(e) => {
        e.preventDefault();
        onSearch?.(draft.trim());
      }}
    >
      {onSearch && (
        <>
          <div className="rd-ad-filterrow__search">
            <RdInput aria-label={searchLabel} placeholder={placeholder} value={draft} onChange={(e) => setDraft(e.target.value)} />
          </div>
          <RdButton type="submit" kind="secondary" place="row">
            <span className="rd-pt-btnicon"><IconSearch size={16} />검색</span>
          </RdButton>
        </>
      )}
      {onSelect && options && (
        <div className="rd-ad-filterrow__select">
          <RdSelect aria-label={selectLabel} value={select} onChange={(e) => onSelect(e.target.value)}>
            {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </RdSelect>
        </div>
      )}
      {children}
    </form>
  );
}

// ───────────── 이어봄 입력 창 — 사유 한 칸 ─────────────
/**
 * 입력 창(00-44 §7-6) — 제목 = 버튼 글자 · 안내 = 대상 문장과 "사유를 입력해 주세요(…)"를 둘로 나눈다. 필수 사유가 비면 창 안 오류 글.
 * 되돌릴 수 없는 일(반려 · 정지 · 내리기 · 종료 · 탈퇴 접수)은 위험 버튼, 되돌리기 · 승인은 주 버튼. 선택 사유(승인 메모)는 오류 글이 없다.
 */
export function ReasonDialog({
  eyebrow,
  title,
  desc,
  label,
  hint,
  confirmLabel = title,
  danger,
  required = true,
  warning,
  onClose,
  onSubmit,
  children,
}: {
  eyebrow?: string;
  title: string;
  /** 칸 위 안내 — "대상 문장"과 칸 이름을 가르기 위한 둘째 줄 */
  desc?: string;
  label: string;
  hint?: string;
  confirmLabel?: string;
  danger?: boolean;
  required?: boolean;
  warning?: string;
  onClose: () => void;
  /** 처리. 거절하는 글을 돌려주면 창 안 오류 글로 보인다(예: 서버 409) */
  onSubmit: (text: string) => Promise<string | void> | string | void;
  children?: React.ReactNode;
}) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (required && !text.trim()) {
      setError('사유를 입력해야 처리할 수 있습니다.');
      return;
    }
    setBusy(true);
    await sleep(400);
    const refused = await onSubmit(text.trim());
    setBusy(false);
    if (typeof refused === 'string') setError(refused);
  };

  return (
    <RdDialog
      form
      width={560}
      eyebrow={eyebrow}
      title={title}
      warning={warning}
      danger={danger}
      onClose={() => !busy && onClose()}
      closeX
      footer={
        <>
          <RdButton kind="secondary" place="dialog" disabled={busy} onClick={onClose}>취소</RdButton>
          <RdButton kind={danger ? 'danger' : 'primary'} place="dialog" busy={busy} busyText="처리 중…" onClick={submit}>{confirmLabel}</RdButton>
        </>
      }
    >
      <div className="rd-pt-dlgbody">
        {desc && <p className="rd-dialog__desc">{desc}</p>}
        {children}
        <RdField label={label} required={required} optional={!required} help={hint} error={error ?? undefined}>
          {(p) => (
            <textarea
              {...p}
              className="rd-input rd-input--area"
              rows={4}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setError(null);
              }}
            />
          )}
        </RdField>
      </div>
    </RdDialog>
  );
}
