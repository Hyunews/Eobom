import React, { useId, useRef, useState } from 'react';
import { IconChevronDown, IconChevronUp } from './icons';

// 00-44 §7-4 쪽 머리 · 탭 · 쪽 안 차례.

/** 쪽 머리 — 윗글(어느 부) → 쪽 제목 → 한 줄 설명, 오른쪽에 쪽 전체에 걸리는 버튼(보조 / 둘이면 [보조][주]). */
export function RdPageHead({
  eyebrow,
  title,
  desc,
  actions,
}: {
  eyebrow?: string;
  title: string;
  desc?: string;
  /** 버튼은 [보조][주] 순서로 넘긴다. 모바일은 제목 아래 세로(주 위)로 CSS가 바꾼다. */
  actions?: React.ReactNode;
}) {
  return (
    <header className="rd-pagehead">
      <div className="rd-pagehead__text">
        {eyebrow && <p className="rd-t-eyebrow">{eyebrow}</p>}
        <h1 className="rd-t-title">{title}</h1>
        {desc && <p className="rd-pagehead__desc">{desc}</p>}
      </div>
      {actions && <div className="rd-pagehead__actions">{actions}</div>}
    </header>
  );
}

/** 탭 — 고른 것 = 굵게 + 먹색 밑줄 3px. 방향키로 옮긴다. 모바일은 넘치면 옆으로 밀어 넘김. */
export function RdTabs({
  label,
  tabs,
  value,
  onChange,
}: {
  label: string;
  tabs: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: React.KeyboardEvent, i: number) => {
    let next = -1;
    if (e.key === 'ArrowRight') next = (i + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    if (next >= 0) {
      e.preventDefault();
      onChange(tabs[next].value);
      refs.current[next]?.focus();
    }
  };
  return (
    <div className="rd-tabs" role="tablist" aria-label={label}>
      {tabs.map((t, i) => {
        const on = t.value === value;
        return (
          <button
            key={t.value}
            ref={(el) => (refs.current[i] = el)}
            type="button"
            role="tab"
            aria-selected={on}
            tabIndex={on ? 0 : -1}
            className="rd-tab"
            onClick={() => onChange(t.value)}
            onKeyDown={(e) => onKey(e, i)}
          >
            <span>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export interface RdTocItem {
  id: string;
  label: string;
  /** 진행 개수 "2 / 5". 다 하면 완료 색 "끝냄" */
  done?: number;
  total?: number;
}

/**
 * 쪽 안 차례 — 데스크톱: 왼쪽 열 220, 스크롤 따라 고정 / 모바일: 접힌 띠 52("차례 · 지금 구간") → 누르면 펼침.
 * 지금 위치 = 굵게 + 작은 네모 6.
 */
export function RdToc({ items, current, onSelect }: { items: RdTocItem[]; current: string; onSelect: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const listId = useId();
  const now = items.find((i) => i.id === current);
  return (
    <nav className={`rd-toc${open ? ' rd-toc--open' : ''}`} aria-label="쪽 안 차례">
      <button type="button" className="rd-toc__band" aria-expanded={open} aria-controls={listId} onClick={() => setOpen((v) => !v)}>
        {open ? (
          <span>차례 닫기</span>
        ) : (
          <span>
            <span className="rd-toc__prefix">차례 ·</span> {now?.label}
          </span>
        )}
        {open ? <IconChevronUp /> : <IconChevronDown />}
      </button>
      <ul className="rd-toc__list" id={listId}>
        {items.map((it) => {
          const finished = it.total !== undefined && it.done === it.total;
          return (
            <li key={it.id}>
              <button
                type="button"
                className="rd-toc__item"
                aria-current={it.id === current ? 'true' : undefined}
                onClick={() => {
                  onSelect(it.id);
                  setOpen(false);
                }}
              >
                <span className="rd-toc__mark" aria-hidden="true" />
                <span className="rd-toc__label">{it.label}</span>
                {it.total !== undefined && (
                  <span className={`rd-toc__count${finished ? ' rd-toc__count--done' : ''}`}>
                    {finished ? '끝냄' : `${it.done ?? 0} / ${it.total}`}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
