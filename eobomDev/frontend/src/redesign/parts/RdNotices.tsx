import React, { useEffect, useId, useRef, useState } from 'react';
import { RdIconButton } from './RdButtons';
import { IconCheckCircle, IconClose, IconInfo, IconPin, IconWarn, IconChevronRight } from './icons';

// 00-44 §7-5 안내. 경고·안내는 한 화면에 겹쳐 두지 않는다(§6-2-5) — 해당하는 곳에 하나씩.

/** 띠 알림 — 쪽 맨 위 먹색 띠. 한 번에 하나. 계속 떠 있으므로 role="status"(alert 아님, 4단계 묶음 3). */
export function RdBanner({
  children,
  action,
  onClose,
}: {
  children: React.ReactNode;
  /** 링크(바탕색 밑줄). 모바일은 글 아래 줄 오른쪽 */
  action?: React.ReactNode;
  onClose?: () => void;
}) {
  return (
    <div className="rd-banner" role="status">
      <p className="rd-banner__text">{children}</p>
      {action && <div className="rd-banner__action">{action}</div>}
      {onClose && (
        <RdIconButton label="알림 닫기" onDark className="rd-banner__close" onClick={onClose}>
          <IconClose />
        </RdIconButton>
      )}
    </div>
  );
}

type NoticeTone = 'info' | 'caution' | 'success';

/**
 * 알림 상자 / 주의 / 성공 상자 — 같은 틀.
 * info = 중립 안내(갈색 ⓘ) · caution = 되돌릴 수 없는 일·기한에만(연한 위험 바탕 + △) · success = 일이 끝났음(완료 색 + 체크 원).
 */
export function RdNotice({
  tone = 'info',
  title,
  children,
  action,
}: {
  tone?: NoticeTone;
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  const icon = tone === 'caution' ? <IconWarn size={22} /> : tone === 'success' ? <IconCheckCircle size={22} /> : <IconInfo size={22} />;
  return (
    <div className={`rd-notice rd-notice--${tone}`} role={tone === 'caution' ? 'group' : undefined}>
      <span className="rd-notice__icon">{icon}</span>
      <div className="rd-notice__body">
        <p className="rd-notice__title">{title}</p>
        {children && <p className="rd-notice__desc">{children}</p>}
        {action && <div className="rd-notice__action">{action}</div>}
      </div>
    </div>
  );
}

/** 기한 한 줄 안내 — 높이 48, 한 줄, 누르면 해당 구간으로. 큰 주의 상자를 숨기는 모바일에서 대신 쓴다. */
export function RdDeadlineLine({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button type="button" className="rd-deadline" onClick={onClick}>
      <span className="rd-deadline__text">{children}</span>
      <IconChevronRight />
    </button>
  );
}

/** 위치 표시 — 갈색 선 그림 핀 + "위치: 서울 강남구". */
export function RdLocation({ children }: { children: React.ReactNode }) {
  return (
    <p className="rd-location">
      <IconPin />
      <span>위치: {children}</span>
    </p>
  );
}

function useCloseOnOutside(open: boolean, close: () => void, ref: React.RefObject<HTMLElement>) {
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, close, ref]);
}

/**
 * 말풍선을 놓는 글줄 — 모바일의 가득 폭 풍선이 이 줄 기준으로 펴진다. 도움말 풍선·출처 말풍선은 이 안에 둔다.
 */
export function RdTipHost({ children }: { children: React.ReactNode }) {
  return <p className="rd-tiphost">{children}</p>;
}

/** 도움말 풍선 — 어려운 말 옆 ?(누르는 자리 44). 눌러서 열고 닫는다(올림만으로는 안 열림). 먹색 풍선. */
export function RdHelpTip({ term, children }: { term: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const wrap = useRef<HTMLSpanElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const [top, setTop] = useState<number | undefined>(undefined);
  useCloseOnOutside(open, () => setOpen(false), wrap);
  // 풍선은 ? 가 있는 줄 바로 아래에 편다(문단이 여러 줄이어도). 기준은 RdTipHost.
  const toggle = () => {
    if (!open) {
      const host = btn.current?.closest('.rd-tiphost');
      if (host && btn.current) {
        const h = host.getBoundingClientRect();
        const b = btn.current.getBoundingClientRect();
        setTop(b.bottom - h.top - 8);
      }
    }
    setOpen((v) => !v);
  };
  return (
    <span className="rd-help" ref={wrap}>
      <button ref={btn} type="button" className="rd-help__btn" aria-expanded={open} aria-controls={id} aria-label={`${term} 뜻 보기`} onClick={toggle}>
        <span className="rd-help__q" aria-hidden="true">?</span>
      </button>
      {open && (
        <span className="rd-help__pop" id={id} role="note" style={top !== undefined ? { top } : undefined}>
          {children}
        </span>
      )}
    </span>
  );
}

/**
 * 출처 말풍선 — 조문 원문을 그 자리에서 보여 준다(어려운 말 풀이와 다른 부품, §6-7-2).
 * 데스크톱: 올림·초점·누름으로 열고 Esc·바깥 누름으로 닫음 / 모바일: 누르면 열고 다시 누르거나 바깥을 누르면 닫음.
 */
export function RdSourceTip({ label: text, title, children }: { label: string; title: string; children: React.ReactNode }) {
  const [hover, setHover] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [focus, setFocus] = useState(false);
  const id = useId();
  const wrap = useRef<HTMLSpanElement>(null);
  const label = useRef<HTMLButtonElement>(null);
  const [top, setTop] = useState<number | undefined>(undefined);
  const open = hover || pinned || focus;
  // 모바일: 풍선을 글줄 폭 가득, 표기 바로 아래에 편다(문단이 여러 줄이어도). 기준은 RdTipHost. 데스크톱은 CSS가 표기 기준으로 둔다.
  const place = () => {
    const host = label.current?.closest('.rd-tiphost');
    if (host && label.current) setTop(label.current.getBoundingClientRect().bottom - host.getBoundingClientRect().top + 2);
  };
  useCloseOnOutside(open, () => {
    setHover(false);
    setPinned(false);
    setFocus(false);
  }, wrap);
  return (
    <span
      className="rd-source"
      ref={wrap}
      onPointerEnter={(e) => e.pointerType === 'mouse' && setHover(true)}
      onPointerLeave={(e) => e.pointerType === 'mouse' && setHover(false)}
    >
      <button
        ref={label}
        type="button"
        className="rd-source__label"
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        onFocus={() => {
          place();
          setFocus(true);
        }}
        onBlur={() => setFocus(false)}
        onClick={() => {
          place();
          setPinned((v) => !v);
        }}
      >
        {text}
      </button>
      {open && (
        <span className="rd-source__pop" id={id} role="note" style={top !== undefined ? ({ ['--rd-pop-top' as string]: `${top}px` } as React.CSSProperties) : undefined}>
          <span className="rd-source__title">{title}</span>
          <span className="rd-source__body">{children}</span>
        </span>
      )}
    </span>
  );
}
