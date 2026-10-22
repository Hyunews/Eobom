import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';
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

  // 뒤로·앞으로 가기로 들어온 쪽은 진입 움직임을 쓰지 않는다(이미 본 화면이 보였다가 다시 움직이는 것을 막는다).
  // 처음 여는 것도 POP으로 오므로 첫 위치와 다를 때만 센다.
  const location = useLocation();
  const navType = useNavigationType();
  const firstKey = useRef(location.key);
  // 문서를 통째로 다시 불러오는 뒤로·앞으로 가기(다른 화면에서 돌아옴)는 브라우저 탐색 종류로 안다. 되살린 쪽(bfcache)은 pageshow로 안다.
  const [docBack, setDocBack] = useState(
    () => (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined)?.type === 'back_forward',
  );
  useEffect(() => {
    const on = (e: PageTransitionEvent) => {
      if (e.persisted) setDocBack(true);
    };
    window.addEventListener('pageshow', on);
    return () => window.removeEventListener('pageshow', on);
  }, []);
  // 처음 연 위치에서 한 번이라도 벗어났다면 이후의 POP은 모두 뒤로·앞으로 가기다(처음 위치로 되돌아와 키가 같아져도 마찬가지).
  // 문서 단위 판정(docBack)은 처음 연 위치에 머무는 동안만 쓴다 — 그 뒤 새로 누른 이동까지 움직임이 꺼지면 안 된다.
  const moved = useRef(false);
  if (location.key !== firstKey.current) moved.current = true;
  const back = moved.current ? navType === 'POP' : docBack;

  // 쪽 진입 움직임은 글꼴이 준비된 뒤에 시작한다. 그 전에는 본문을 숨겨 둬서, 보였다가 다시 움직이는 깜빡임이 없다.
  // 글꼴이 늦어도 1.2초 뒤에는 시작한다.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let done = false;
    const go = () => {
      if (done) return;
      done = true;
      requestAnimationFrame(() => setReady(true));
    };
    const timer = window.setTimeout(go, 1200);
    document.fonts?.ready.then(go, go);
    return () => {
      done = true;
      window.clearTimeout(timer);
    };
  }, []);

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
    <div className="rd-root" data-rd-ready={ready ? '' : undefined} data-rd-pop={back ? '' : undefined}>
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
