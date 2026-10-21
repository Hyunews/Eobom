import React from 'react';
import { IconArrow, IconArrowOut, IconChevronRight } from './icons';

// 00-44 §7-1 버튼 · 링크. 동작은 버튼, 다른 화면으로 가는 것은 글 링크(§6-5-1).

export type RdButtonKind = 'primary' | 'secondary' | 'danger';
export type RdButtonPlace = 'screen' | 'row' | 'dialog' | 'bar';

interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  kind?: RdButtonKind;
  /** 놓이는 자리(§7-1 ①~④). 크기만 바뀐다. screen=44/48 · row=44·14 · dialog=48/52 · bar=48/52 */
  place?: RdButtonPlace;
  /** 처리 중: 누를 수 없고 돌림 그림 + busyText (주·위험만) */
  busy?: boolean;
  busyText?: string;
  /** 사용 불가 이유. 버튼 아래에 한 줄로 적는다(§6-5-5) */
  disabledReason?: string;
  type?: 'button' | 'submit';
}

export const RdButton = React.forwardRef<HTMLButtonElement, ButtonProps>(function RdButton(
  { kind = 'primary', place = 'screen', busy, busyText, disabledReason, disabled, className, children, type = 'button', ...rest },
  ref,
) {
  const reasonId = React.useId();
  const showBusy = !!busy && kind !== 'secondary';
  const button = (
    <button
      ref={ref}
      type={type}
      className={['rd-btn', `rd-btn--${kind}`, `rd-btn--${place}`, className].filter(Boolean).join(' ')}
      disabled={disabled || showBusy}
      aria-busy={showBusy || undefined}
      aria-describedby={disabled && disabledReason ? reasonId : undefined}
      {...rest}
    >
      {showBusy && <span className="rd-spin" aria-hidden="true" />}
      <span>{showBusy ? (busyText ?? '처리 중…') : children}</span>
    </button>
  );
  if (!disabledReason || !disabled) return button;
  return (
    <span className="rd-btn-wrap">
      {button}
      <span className="rd-btn-reason" id={reasonId}>{disabledReason}</span>
    </span>
  );
});

/** 버튼 줄 — 데스크톱 오른쪽 정렬 [보조][주], 모바일 가득 폭 쌓기(주가 위). 소스 순서는 [보조][주]로 두고 CSS가 뒤집는다. */
export function RdButtonRow({ children, place = 'screen' }: { children: React.ReactNode; place?: RdButtonPlace }) {
  return <div className={`rd-btnrow rd-btnrow--${place}`}>{children}</div>;
}

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  /** 바깥 사이트/법령 등: 화살표 대신 ↗ */
  external?: boolean;
  /** 모바일에서 보일 짧은 글자 ("전체 보기" → "전체") */
  short?: string;
  /** 어두운 바탕(띠 알림)에서 쓰는 모양 */
  onDark?: boolean;
}

/** 글 링크 — 16 · 500 · 밑줄 5px 아래 + 화살표. 사용 불가 상태가 없다(숨긴다). */
export function RdTextLink({ external, short, onDark, className, children, ...rest }: LinkProps) {
  return (
    <a
      className={['rd-link', onDark && 'rd-link--dark', className].filter(Boolean).join(' ')}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : null)}
      {...rest}
    >
      {short ? (
        <>
          <span className="rd-link__long">{children}</span>
          <span className="rd-link__short">{short}</span>
        </>
      ) : (
        <span>{children}</span>
      )}
      {external ? <IconArrowOut /> : <IconArrow />}
    </a>
  );
}

interface IconButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'aria-label'> {
  /** 화면낭독용 이름(필수) */
  label: string;
  bordered?: boolean;
  children: React.ReactNode;
  onDark?: boolean;
}

/** 아이콘 버튼 — 44 × 44. 닫기·넘김·멈춤. */
export const RdIconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(function RdIconButton(
  { label, bordered, onDark, className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      className={['rd-iconbtn', bordered && 'rd-iconbtn--bordered', onDark && 'rd-iconbtn--dark', className].filter(Boolean).join(' ')}
      {...rest}
    >
      {children}
    </button>
  );
});

interface BranchProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  tone?: 'primary' | 'secondary';
  title: string;
  desc: string;
}

/** 갈래 버튼 — 랜딩 첫 화면 · 상담의 상황 고르기(§7-1 ⑤). 주(먹색 채움) / 보조(종이 + 먹색 테두리). */
export function RdBranchButton({ tone = 'primary', title, desc, className, ...rest }: BranchProps) {
  return (
    <button type="button" className={['rd-branch', `rd-branch--${tone}`, className].filter(Boolean).join(' ')} {...rest}>
      <span className="rd-branch__text">
        <span className="rd-branch__title">{title}</span>
        <span className="rd-branch__desc">{desc}</span>
      </span>
      <IconArrow size={22} />
    </button>
  );
}

interface BranchLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  tone?: 'primary' | 'secondary';
  title: string;
  desc: string;
}

/** 갈래 링크 — 갈래 버튼과 같은 모양인데 같은 쪽 안의 구간(#id)으로 내려가는 링크다(00-45 §4). */
export function RdBranchLink({ tone = 'primary', title, desc, className, ...rest }: BranchLinkProps) {
  return (
    <a className={['rd-branch', `rd-branch--${tone}`, className].filter(Boolean).join(' ')} {...rest}>
      <span className="rd-branch__text">
        <span className="rd-branch__title">{title}</span>
        <span className="rd-branch__desc">{desc}</span>
      </span>
      <IconArrow size={22} />
    </a>
  );
}

/** 표시 딱지 — 테두리 딱지 = 상태 / 채운 딱지 = 기한 임박(위험)·"예시"만(§6-4-1). */
export type RdBadgeKind = 'state' | 'draft' | 'done' | 'danger' | 'danger-fill' | 'example';

export function RdBadge({ kind = 'state', children }: { kind?: RdBadgeKind; children: React.ReactNode }) {
  return <span className={`rd-badge rd-badge--${kind}`}>{children}</span>;
}

/** 필수 딱지 — 칸 이름 끝(§8-3-1). 별표를 쓰지 않는다. */
export function RdRequired({ narrow }: { narrow?: boolean }) {
  return <span className={`rd-required${narrow ? ' rd-required--narrow' : ''}`}>필수</span>;
}

/** 이동 줄 오른쪽 › */
export const RdChevron = () => <IconChevronRight />;
