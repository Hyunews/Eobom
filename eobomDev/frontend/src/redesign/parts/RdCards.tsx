import React, { useId, useState } from 'react';
import { RdBadge, RdTextLink } from './RdButtons';
import { IconChevronDown, IconChevronRight, IconChevronUp } from './icons';

// 00-44 §7-2 칸 · 목록. 훑는 목록은 카드·그림자 없음(§6-2-1), 고르는 목록은 평 카드(§6-2-2).

/** 카드 — 평 카드(기본) / 종이 카드(어긋난 그림자, 화면당 1~2개). */
export function RdCard({
  tone = 'flat',
  eyebrow,
  title,
  desc,
  footer,
  onClick,
  children,
}: {
  tone?: 'flat' | 'paper';
  eyebrow?: string;
  title: string;
  desc?: string;
  /** 점선 아래 줄: 상태 + 링크 등 */
  footer?: React.ReactNode;
  /** 있으면 카드 전체가 누르는 자리(§6-5-7) */
  onClick?: () => void;
  children?: React.ReactNode;
}) {
  const inner = (
    <>
      {eyebrow && <p className="rd-card__eyebrow">{eyebrow}</p>}
      <h3 className="rd-card__title">{title}</h3>
      {desc && <p className="rd-card__desc">{desc}</p>}
      {children}
      {footer && <div className="rd-card__foot">{footer}</div>}
    </>
  );
  const cls = `rd-card rd-card--${tone}`;
  if (onClick) {
    return (
      <button type="button" className={`${cls} rd-card--press`} onClick={onClick}>
        {inner}
      </button>
    );
  }
  return <div className={cls}>{inner}</div>;
}

/** 구간 머리 — 구간 제목 + 개수 + 오른쪽 글 링크, 아래 실선. */
export function RdSectionHead({
  title,
  count,
  linkLabel,
  linkShort,
  href = '#',
}: {
  title: string;
  count?: string;
  linkLabel?: string;
  linkShort?: string;
  href?: string;
}) {
  return (
    <div className="rd-sechead">
      <div className="rd-sechead__l">
        <h2 className="rd-t-section">{title}</h2>
        {count && <span className="rd-sechead__count">{count}</span>}
      </div>
      {linkLabel && (
        <RdTextLink href={href} short={linkShort} onClick={(e) => e.preventDefault()}>
          {linkLabel}
        </RdTextLink>
      )}
    </div>
  );
}

/** 목록 줄 컨테이너 — 위 먹색 실선, 줄 사이 점선. */
export function RdList({ children, label }: { children: React.ReactNode; label?: string }) {
  return (
    <ul className="rd-list" aria-label={label}>
      {children}
    </ul>
  );
}

/** 목록 줄 — 제목(명조) + 정보 한 줄 + 상태 + ›. 줄 전체가 누르는 자리. */
export function RdListRow({
  title,
  info,
  status,
  onClick,
}: {
  title: string;
  info?: string;
  status?: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <li className="rd-list__li">
      <button type="button" className="rd-row" onClick={onClick}>
        <span className="rd-row__main">
          <span className="rd-row__title">{title}</span>
          {(info || status) && (
            <span className="rd-row__info">
              {info}
              {/* 모바일: 상태는 정보 줄 안으로(판 03). 데스크톱은 오른쪽 끝 */}
              {status && <span className="rd-row__status-m">{info ? ' · ' : ''}{status}</span>}
            </span>
          )}
        </span>
        {status && <span className="rd-row__status">{status}</span>}
        <span className="rd-row__chev"><IconChevronRight /></span>
      </button>
    </li>
  );
}

/** 이동 줄 — 메뉴처럼 쓰는 줄: 갈색 선 아이콘 + 이름 + 설명 + ›. 다른 화면으로 가므로 링크다. */
export function RdNavRow({ icon, name, desc, href = '#' }: { icon: React.ReactNode; name: string; desc?: string; href?: string }) {
  return (
    <li className="rd-list__li">
      <a className="rd-row rd-row--nav" href={href} onClick={(e) => e.preventDefault()}>
        <span className="rd-navrow__icon">{icon}</span>
        <span className="rd-row__main">
          <span className="rd-navrow__name">{name}</span>
          {desc && <span className="rd-row__info">{desc}</span>}
        </span>
        <span className="rd-row__chev"><IconChevronRight /></span>
      </a>
    </li>
  );
}

export type RdCheckState = 'todo' | 'soon' | 'done';

/**
 * 체크리스트 줄 — 상자를 눌러야만 체크된다(§6-5-6). 제목·›를 누르면 onOpen(안내 창).
 * 세 상태: 안 함 · 기한 임박(채운 위험 딱지 + 위험 색 글) · 끝냄(제목 작은 글자색 + 완료 색 글).
 */
export function RdChecklistRow({
  title,
  info,
  state,
  checked,
  onToggle,
  onOpen,
  deadlineBadge,
  deadlineText,
  doneText,
}: {
  title: string;
  info?: string;
  state: RdCheckState;
  checked: boolean;
  onToggle: (next: boolean) => void;
  onOpen?: () => void;
  /** 기한 임박일 때 채운 딱지 글자 (예: "D-12") */
  deadlineBadge?: string;
  /** 기한 임박일 때 색만으로 구분하지 않도록 글로도 (예: "기한이 12일 남았습니다") */
  deadlineText?: string;
  /** 끝냄일 때 (예: "10월 12일 끝냄") */
  doneText?: string;
}) {
  const boxId = useId();
  return (
    <li className={`rd-list__li rd-check rd-check--${state}`}>
      <div className="rd-check__box">
        <input id={boxId} type="checkbox" className="rd-checkbox" checked={checked} onChange={(e) => onToggle(e.target.checked)} aria-label={`${title} 끝냄 표시`} />
      </div>
      <button type="button" className="rd-check__body" onClick={onOpen}>
        <span className="rd-check__title">{title}</span>
        {info && <span className="rd-row__info">{info}</span>}
        {/* 데스크톱 판 03: 기한 임박·끝냄은 정보 줄 자리에 글로 적는다(모바일은 아래 딱지 한 덩이) */}
        {state === 'soon' && deadlineText && <span className="rd-check__dueline">{deadlineText}</span>}
        {state === 'soon' && (
          <span className="rd-check__pill">{deadlineBadge}{deadlineText ? ` · ${deadlineText}` : ''}</span>
        )}
        {state === 'done' && doneText && <span className="rd-check__done rd-check__due--m">{doneText}</span>}
      </button>
      <div className="rd-check__side">
        {state === 'soon' && <RdBadge kind="danger-fill">{deadlineBadge}</RdBadge>}
      </div>
      <button type="button" className="rd-check__chev" aria-label={`${title} 안내 보기`} onClick={onOpen}>
        <IconChevronRight />
      </button>
    </li>
  );
}

/** 숫자 칸 — 이름(보조 글자) 위, 숫자(명조) 아래, 칸 사이 세로 점선. */
export function RdStatGrid({ items }: { items: { name: string; value: string }[] }) {
  return (
    <dl className="rd-stats">
      {items.map((it) => (
        <div className="rd-stats__cell" key={it.name}>
          <dt>{it.name}</dt>
          <dd>{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** 펼침 — 머리(명조) + ⌄ 닫힘 / ⌃ 펼침. */
export function RdFold({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <div className="rd-fold">
      <button type="button" className="rd-fold__head" aria-expanded={open} aria-controls={id} onClick={() => setOpen((v) => !v)}>
        <span>{title}</span>
        {open ? <IconChevronUp /> : <IconChevronDown />}
      </button>
      {open && (
        <div className="rd-fold__body" id={id}>
          {children}
        </div>
      )}
    </div>
  );
}

/** [더 보기] — 데스크톱은 글 버튼, 모바일은 가득 폭 48 테두리 버튼. */
export function RdMoreButton({ onClick, children = '더 보기' }: { onClick: () => void; children?: React.ReactNode }) {
  return (
    <button type="button" className="rd-more" onClick={onClick}>
      {children}
      <IconChevronDown size={14} />
    </button>
  );
}

/** 쪽 넘김 — [이전] "n / m 페이지" [다음]. 첫 쪽 [이전]·마지막 쪽 [다음]은 흐리게. */
export function RdPager({ page, total, onChange }: { page: number; total: number; onChange: (p: number) => void }) {
  return (
    <nav className="rd-pager" aria-label="쪽 넘김">
      <button type="button" className="rd-btn rd-btn--secondary rd-btn--row rd-pager__btn" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        <span>이전</span>
      </button>
      <span className="rd-pager__now" aria-live="polite">{page} / {total} 페이지</span>
      <button type="button" className="rd-btn rd-btn--secondary rd-btn--row rd-pager__btn" disabled={page >= total} onClick={() => onChange(page + 1)}>
        <span>다음</span>
      </button>
    </nav>
  );
}
