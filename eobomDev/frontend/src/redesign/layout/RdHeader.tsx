import React from 'react';

export type MenuPart = 'part1' | 'part2';

interface Props {
  open: MenuPart | null;
  onToggle: (part: MenuPart) => void;
  onOpenSheet: () => void;
  menuBtnRef: React.RefObject<HTMLButtonElement>;
  onLogin?: () => void;
}

function Chevron({ up }: { up: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d={up ? 'M6 15l6-6 6 6' : 'M6 9l6 6 6-6'} />
    </svg>
  );
}

/** 00-44 §5-5 헤더 — 데스크톱: 로고 · 홈 · 생전 준비 ⌄ · 임종·사후 정리 ⌄ · 로그인 / 모바일: 로고 · 메뉴 버튼. */
export function RdHeader({ open, onToggle, onOpenSheet, menuBtnRef, onLogin }: Props) {
  return (
    <header className="rd-container rd-header">
      <div className="rd-header__left">
        <a href="/" className="rd-logo">이어봄</a>
        <nav className="rd-nav" aria-label="주 메뉴">
          <a href="/" className="rd-nav__link">홈</a>
          <button
            type="button"
            className="rd-nav__trigger"
            aria-expanded={open === 'part1'}
            aria-controls="rd-menu-panel"
            onClick={() => onToggle('part1')}
          >
            <span>생전 준비</span>
            <Chevron up={open === 'part1'} />
          </button>
          <button
            type="button"
            className="rd-nav__trigger"
            aria-expanded={open === 'part2'}
            aria-controls="rd-menu-panel"
            onClick={() => onToggle('part2')}
          >
            <span>임종·사후 정리</span>
            <Chevron up={open === 'part2'} />
          </button>
        </nav>
      </div>
      <button type="button" className="rd-login" onClick={onLogin}>로그인</button>
      <button type="button" className="rd-menu-btn" aria-label="메뉴 열기" ref={menuBtnRef} onClick={onOpenSheet}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2B2620" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>
    </header>
  );
}
