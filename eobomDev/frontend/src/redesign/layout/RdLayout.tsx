import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RdHeader, type MenuPart } from './RdHeader';
import { RdFooter } from './RdFooter';
import { RdMenuPanel } from './RdMenuPanel';
import { RdMenuSheet } from './RdMenuSheet';
import { MOBILE_MAX } from '../nav';

interface Props {
  children: React.ReactNode;
  /** 로그인 버튼. 미리보기에는 로그인 상태가 없어 기본은 아무 일도 하지 않는다(묶음 3 이후 연결). */
  onLogin?: () => void;
}

function useIsPhone(): boolean {
  const query = `(max-width: ${MOBILE_MAX}px)`;
  const [phone, setPhone] = useState<boolean>(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const on = () => setPhone(mql.matches);
    on();
    mql.addEventListener('change', on);
    return () => mql.removeEventListener('change', on);
  }, [query]);
  return phone;
}

/** 새 디자인 공통 틀 — 헤더 · 메뉴 펼침 · 본문 · 바닥글. 00-44 §5-5. */
export function RdLayout({ children, onLogin }: Props) {
  const phone = useIsPhone();
  const [open, setOpen] = useState<MenuPart | 'sheet' | null>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => setOpen(null), []);

  // 폭이 바뀌어 배치가 갈리면 펼침을 닫는다(데스크톱 판 ↔ 모바일 판).
  useEffect(() => {
    setOpen(null);
  }, [phone]);

  // 데스크톱 판: Esc · 바깥 누름으로 닫는다.
  useEffect(() => {
    if (open === null || open === 'sheet') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null);
    };
    const onDown = (e: MouseEvent) => {
      if (headRef.current && !headRef.current.contains(e.target as Node)) setOpen(null);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, [open]);

  const closeSheet = useCallback(() => {
    setOpen(null);
    menuBtnRef.current?.focus();
  }, []);

  return (
    <div className="rd-root">
      <div className="rd-head" ref={headRef}>
        <RdHeader
          open={open === 'sheet' ? null : open}
          onToggle={(part) => setOpen((cur) => (cur === part ? null : part))}
          onOpenSheet={() => setOpen('sheet')}
          menuBtnRef={menuBtnRef}
          onLogin={onLogin}
        />
        {!phone && open !== null && open !== 'sheet' && <RdMenuPanel active={open} onNavigate={close} />}
      </div>
      {!phone && open !== null && open !== 'sheet' && <div className="rd-scrim" aria-hidden="true" onClick={close} />}
      {phone && open === 'sheet' && <RdMenuSheet onClose={closeSheet} onLogin={onLogin} />}
      <main className="rd-main">{children}</main>
      <RdFooter />
    </div>
  );
}
