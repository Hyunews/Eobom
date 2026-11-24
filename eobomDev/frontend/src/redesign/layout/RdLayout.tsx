import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';
import { RdHeader, type MenuPart } from './RdHeader';
import { RdFooter } from './RdFooter';
import { RdMenuPanel } from './RdMenuPanel';
import { RdMenuSheet } from './RdMenuSheet';
import { useLeave } from './useLeave';
import { MOBILE_MAX } from '../nav';
import { useAuth } from '../auth/AuthProvider';

interface Props {
  children: React.ReactNode;
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
export function RdLayout({ children }: Props) {
  const { currentUser, openLogin, logout } = useAuth();
  const onLogin = useCallback(() => openLogin(), [openLogin]);
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

  // 헤더 따라오기(00-44 §5-5): 맨 위에서 조금이라도 내리면 얇은 띠. 모바일은 높이가 같아 바뀌는 것이 없다.
  const [slim, setSlim] = useState(() => window.scrollY > 0);
  useEffect(() => {
    const on = () => setSlim(window.scrollY > 0);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  // 닫을 때 0.2초 거꾸로 사라진다(§6-8) — 사라지는 동안에는 마지막으로 열렸던 쪽을 그대로 그린다.
  const panelPart = !phone && open !== null && open !== 'sheet' ? open : null;
  const lastPart = useRef<MenuPart>('part1');
  if (panelPart) lastPart.current = panelPart;
  const panel = useLeave(panelPart !== null);
  const sheet = useLeave(phone && open === 'sheet');

  return (
    <div className="rd-root" data-rd-ready={ready ? '' : undefined} data-rd-pop={back ? '' : undefined} data-rd-slim={slim ? '' : undefined}>
      <div className="rd-head" ref={headRef}>
        <div className="rd-head__bar">
          <RdHeader
            open={open === 'sheet' ? null : open}
            onToggle={(part) => setOpen((cur) => (cur === part ? null : part))}
            onOpenSheet={() => setOpen('sheet')}
            menuBtnRef={menuBtnRef}
            onLogin={onLogin}
            user={currentUser}
            onLogout={logout}
          />
          {!phone && panel.mounted && <RdMenuPanel active={panelPart ?? lastPart.current} leaving={panel.leaving} onNavigate={close} />}
        </div>
      </div>
      {!phone && panel.mounted && <div className="rd-scrim" aria-hidden="true" data-leaving={panel.leaving ? '' : undefined} onClick={close} />}
      {phone && sheet.mounted && <RdMenuSheet leaving={sheet.leaving} onClose={closeSheet} onLogin={onLogin} user={currentUser} onLogout={logout} />}
      <main className="rd-main">{children}</main>
      <RdFooter />
    </div>
  );
}
