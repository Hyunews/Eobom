import React, { useEffect, useId, useRef, useState } from 'react';
import { RdIconButton } from './RdButtons';
import { IconCheckCircle, IconClose, IconInfo, IconMail, IconPin, IconWarn, IconChevronRight } from './icons';

// 00-44 §7-5 안내. 경고·안내는 한 화면에 겹쳐 두지 않는다(§6-2-5) — 해당하는 곳에 하나씩.

/**
 * 띠 알림 — 쪽 맨 위 먹색 띠. 한 번에 하나. 계속 떠 있으므로 role="status"(alert 아님, 4단계 묶음 3).
 * tone='warn' = 주의 띠(연한 위험 바탕 + △ + 오른쪽 윤곽선 버튼). 되돌릴 수 없는 일·기한에만(§7-5, 묶음 8 편차 ⑦).
 */
export function RdBanner({
  tone = 'ink',
  children,
  action,
  onClose,
}: {
  tone?: 'ink' | 'warn';
  children: React.ReactNode;
  /** ink = 링크(바탕색 밑줄) · warn = 윤곽선 버튼. 모바일은 글 아래 줄(ink 오른쪽, warn 가득 폭) */
  action?: React.ReactNode;
  onClose?: () => void;
}) {
  const warn = tone === 'warn';
  return (
    <div className={`rd-banner${warn ? ' rd-banner--warn' : ''}`} role="status">
      {/* 봉투·△ 그림은 데스크톱 판 06에만 있다(모바일 판엔 없음 → CSS가 숨김) */}
      <span className="rd-banner__icon">{warn ? <IconWarn size={22} /> : <IconMail />}</span>
      <p className="rd-banner__text">{children}</p>
      {action && <div className="rd-banner__action">{action}</div>}
      {onClose && (
        <RdIconButton label="알림 닫기" onDark={!warn} className="rd-banner__close" onClick={onClose}>
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
  /** 생략하면 설명 한 문단만(15 · 보통 굵기) */
  title?: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  const icon = tone === 'caution' ? <IconWarn size={22} /> : tone === 'success' ? <IconCheckCircle size={22} /> : <IconInfo size={22} />;
  return (
    <div className={`rd-notice rd-notice--${tone}`} role={tone === 'caution' ? 'group' : undefined}>
      <span className="rd-notice__icon">{icon}</span>
      <div className="rd-notice__body">
        {title && <p className="rd-notice__title">{title}</p>}
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
export function RdTipHost({ children, term }: { children: React.ReactNode; /** 용어 한 줄(용어 + ?)로 둘 때. 글 속에 끼울 때는 쓰지 않는다 */ term?: boolean }) {
  return <p className={`rd-tiphost${term ? ' rd-tiphost--term' : ''}`}>{children}</p>;
}

/** 도움말 풍선 — 어려운 말 옆 ?(누르는 자리 44). 눌러서 열고 닫는다(올림만으로는 안 열림). 먹색 풍선. */
export function RdHelpTip({ term, children, defaultOpen, keepOpen }: { term: string; children: React.ReactNode; /** 처음부터 열어 둔다(견본 쪽이 열린 모양을 보이려고) */ defaultOpen?: boolean; /** 견본 전용: 바깥을 눌러도 닫지 않는다. 실제 화면에서는 쓰지 않는다(00-44 §7-5: 바깥 누르면 닫힘) */ keepOpen?: boolean }) {
  const [open, setOpen] = useState(!!defaultOpen);
  const id = useId();
  const wrap = useRef<HTMLSpanElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const [top, setTop] = useState<number | undefined>(undefined);
  useCloseOnOutside(open && !keepOpen, () => setOpen(false), wrap);
  // 풍선은 ? 가 있는 줄 바로 아래에 편다(문단이 여러 줄이어도). 기준은 RdTipHost.
  const place = () => {
    const host = btn.current?.closest('.rd-tiphost');
    if (host && btn.current) {
      const h = host.getBoundingClientRect();
      const b = btn.current.getBoundingClientRect();
      setTop(b.bottom - h.top + 2); // 판 06: 풍선 윗면이 누르는 자리(44) 바닥보다 2 아래
    }
  };
  useEffect(() => {
    if (defaultOpen) place();
  }, [defaultOpen]);
  const toggle = () => {
    if (!open) place();
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
export function RdSourceTip({ label: text, title, children, defaultOpen, keepOpen }: { label: string; title: string; children: React.ReactNode; /** 처음부터 열어 둔다(견본 쪽이 열린 모양을 보이려고) */ defaultOpen?: boolean; /** 견본 전용: 바깥을 눌러도 닫지 않는다. 실제 화면에서는 쓰지 않는다(00-44 §7-5) */ keepOpen?: boolean }) {
  const [hover, setHover] = useState(false);
  const [pinned, setPinned] = useState(!!defaultOpen);
  const [focus, setFocus] = useState(false);
  const id = useId();
  const wrap = useRef<HTMLSpanElement>(null);
  const label = useRef<HTMLButtonElement>(null);
  const [top, setTop] = useState<number | undefined>(undefined);
  const open = hover || pinned || focus;
  useEffect(() => {
    if (defaultOpen) place();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultOpen]);
  // 모바일: 풍선을 글줄 폭 가득, 표기 바로 아래에 편다(문단이 여러 줄이어도). 기준은 RdTipHost. 데스크톱은 CSS가 표기 기준으로 둔다.
  const place = () => {
    const host = label.current?.closest('.rd-tiphost');
    if (host && label.current) setTop(label.current.getBoundingClientRect().bottom - host.getBoundingClientRect().top + 2);
  };
  useCloseOnOutside(open && !keepOpen, () => {
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
