import React, { useEffect, useId, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { RdButton } from '../../parts/RdButtons';
import type { DemoOption } from '../../parts/RdDemo';
import { RdSelect } from '../../parts/RdInputs';
import { IconArrow } from '../../parts/icons';
import { IconLockSmall, IconShield, PartnerRoot } from '../partner/PartnerShell';
import {
  ADMIN_NAME,
  NOTIFICATION_KIND_LABEL,
  PV_ADMIN,
  adminMenuGroups,
  adminPath,
  sampleNotifications,
  timeAgo,
  type AdminBadges,
  type AdminNotification,
  type AdminRole,
} from './adminData';
import '../partner/partner.css';
import './admin.css';

// 8단계 묶음 12 · 운영자 틀. 정본: 00-37 §4.1 · §3.3 · 판 6-14 · 6-26.
// 사업자 틀(묶음 10 PartnerShell)과 뿌리(PartnerRoot) · 위 먹색 바(.rd-pt-top) · 왼쪽 메뉴 260(.rd-pt-side)을 같이 쓰고,
// 묶음 제목 · 알림 종 · 등급 표시 · 데스크톱 전용 최소폭 1200만 이 폴더 CSS(.rd-ad)가 더한다.
// 이용자 헤더·바닥글이 없는 포털 전용 틀이라 PreviewApp의 RdLayout 밖에서 연다.

export const IconKey = ({ size = 14, label }: { size?: number; label?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
  >
    <circle cx="8" cy="12" r="4" />
    <path d="M12 12h9M18 12v4M21 12v3" />
  </svg>
);

const IconBell = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20a2 2 0 0 0 4 0" />
  </svg>
);

/** 미리보기 전용 — 등급·알림 상태를 주소(?role=operator · ?bell=empty)로 들고 다녀 화면을 옮겨도 유지한다. */
export function useAdminPreview() {
  const [params, setParams] = useSearchParams();
  const { search } = useLocation();
  const role: AdminRole = params.get('role') === 'operator' ? 'OPERATOR' : 'SUPERADMIN';
  const bell: 'some' | 'empty' = params.get('bell') === 'empty' ? 'empty' : 'some';
  const setPreview = (next: { role?: AdminRole; bell?: 'some' | 'empty' }) => {
    const p = new URLSearchParams(params);
    const r = next.role ?? role;
    const b = next.bell ?? bell;
    if (r === 'OPERATOR') p.set('role', 'operator'); else p.delete('role');
    if (b === 'empty') p.set('bell', 'empty'); else p.delete('bell');
    setParams(p, { replace: true });
  };
  return { role, bell, search, setPreview };
}

/** 위 먹색 바 — 왼쪽 "이어봄" · 오른쪽 [알림 종] · "이어봄 홈으로". 로그인 화면엔 종이 없다. */
export function AdminTopBar({ bell }: { bell?: React.ReactNode }) {
  const navigate = useNavigate();
  const go = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(PV_ADMIN.site);
  };
  return (
    <div className="rd-pt-top">
      <a className="rd-pt-top__logo" href={PV_ADMIN.site} onClick={go}>이어봄</a>
      <div className="rd-ad-top__right">
        {bell}
        <a className="rd-pt-top__home" href={PV_ADMIN.site} onClick={go}>
          <span>이어봄 홈으로</span>
          <IconArrow size={14} />
        </a>
      </div>
    </div>
  );
}

/** 알림 종 — 안 읽은 건수(0이면 숫자 없음) + 누르면 바 아래로 내려오는 칸(폭 400). 줄을 눌러도 그 줄만 읽음 처리하지 않는다(모두 읽음 전까지 점이 남는다). */
export function AdminBell({
  items,
  onReadAll,
  onOpenItem,
}: {
  items: AdminNotification[];
  onReadAll: () => void;
  onOpenItem: (to: AdminNotification['to']) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const unread = items.filter((i) => i.unread).length;

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="rd-ad-bell" ref={wrapRef}>
      <button
        type="button"
        className="rd-ad-bell__btn"
        aria-label={`알림 ${unread}건`}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((v) => !v)}
      >
        <IconBell />
        {unread > 0 && <span className="rd-ad-bell__count" aria-hidden="true">{unread}</span>}
      </button>
      {open && (
        <div className="rd-ad-bell__panel" id={panelId} role="region" aria-label="알림">
          <div className="rd-ad-bell__head">
            <h2 className="rd-ad-bell__title">알림</h2>
            <button type="button" className="rd-ad-bell__readall" disabled={unread === 0} onClick={onReadAll}>모두 읽음</button>
          </div>
          {items.length === 0 ? (
            <p className="rd-ad-bell__empty">새 알림이 없습니다.</p>
          ) : (
            <ul className="rd-ad-bell__list">
              {items.map((n, i) => (
                <li key={`${n.kind}-${n.at}-${i}`}>
                  <button
                    type="button"
                    className="rd-ad-bell__row"
                    onClick={() => {
                      setOpen(false);
                      onOpenItem(n.to);
                    }}
                  >
                    <span className={`rd-ad-bell__dot${n.unread ? ' is-unread' : ''}`} aria-hidden="true" />
                    <span className="rd-ad-bell__body">
                      <span className="rd-ad-bell__kind">{NOTIFICATION_KIND_LABEL[n.kind]}</span>
                      <span className="rd-ad-bell__text">{n.text}</span>
                    </span>
                    <span className="rd-ad-bell__time">
                      {n.unread && <span className="rd-ad-visually-hidden">안 읽음 · </span>}
                      {timeAgo(n.at)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="rd-ad-bell__foot">최근 30일만 보여 줍니다</p>
        </div>
      )}
    </div>
  );
}

export function AdminShell({
  role,
  name = ADMIN_NAME,
  badges,
  current,
  notifications,
  onReadAll,
  onLogout,
  children,
}: {
  role: AdminRole;
  name?: string;
  badges: AdminBadges;
  current: string;
  notifications: AdminNotification[];
  onReadAll: () => void;
  onLogout?: () => void;
  children: React.ReactNode;
}) {
  const navigate = useNavigate();
  const { search } = useLocation();
  const to = (key: string) => `${adminPath(key)}${search}`;
  const go = (key: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(to(key));
  };
  return (
    <PartnerRoot>
      <div className="rd-ad">
        <AdminTopBar bell={<AdminBell items={notifications} onReadAll={onReadAll} onOpenItem={(k) => navigate(to(k))} />} />
        <div className="rd-pt-body rd-ad-body">
          <nav className="rd-pt-side rd-ad-side" aria-label="운영자 메뉴">
            <div className="rd-pt-side__who">
              <span className="rd-pt-side__icon"><IconShield /></span>
              <div className="rd-ad-side__id">
                <h2 className="rd-pt-side__name">{name}</h2>
                <span className="rd-ad-side__role">{role}</span>
              </div>
            </div>
            <div className="rd-ad-menu">
              <a
                href={to('home')}
                className={`rd-ad-menu__item${current === 'home' ? ' is-on' : ''}`}
                aria-current={current === 'home' ? 'page' : undefined}
                onClick={go('home')}
              >
                <span className="rd-ad-menu__label rd-ad-menu__label--top">
                  {current === 'home' && <span className="rd-pt-menu__dot" aria-hidden="true" />}
                  홈
                </span>
              </a>
              {adminMenuGroups(badges).map((g) => (
                <React.Fragment key={g.title}>
                  <div className="rd-ad-menu__group">{g.title}</div>
                  {g.items.map((m) => {
                    const on = m.key === current;
                    // OPERATOR는 SUPERADMIN 메뉴를 숨기지 않고 흐리게 둔다(눌리지 않음) — 숨기면 왜 없는지 알 수 없다(00-37 §3.3)
                    const dim = !!m.superOnly && role !== 'SUPERADMIN';
                    const inner = (
                      <>
                        <span className="rd-ad-menu__label">
                          {on && <span className="rd-pt-menu__dot" aria-hidden="true" />}
                          {m.label}
                        </span>
                        {m.badge !== undefined && m.badge > 0 && <span className="rd-pt-menu__badge">{m.badge}</span>}
                        {m.locked && <IconLockSmall size={14} />}
                        {m.superOnly && <IconKey label="SUPERADMIN만" />}
                      </>
                    );
                    return dim ? (
                      <span key={m.key} className="rd-ad-menu__item is-dim" aria-disabled="true" title="SUPERADMIN만">{inner}</span>
                    ) : (
                      <a
                        key={m.key}
                        href={to(m.key)}
                        className={`rd-ad-menu__item${on ? ' is-on' : ''}${m.locked ? ' is-locked' : ''}`}
                        aria-current={on ? 'page' : undefined}
                        onClick={go(m.key)}
                      >
                        {inner}
                      </a>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
            <div className="rd-ad-side__foot">
              <span className="rd-ad-side__legend"><IconKey />SUPERADMIN만</span>
              <RdButton kind="secondary" place="screen" onClick={onLogout}>로그아웃</RdButton>
            </div>
          </nav>
          <main className="rd-pt-main rd-ad-main">{children}</main>
        </div>
      </div>
    </PartnerRoot>
  );
}

/** 화면마다 같은 틀 — 등급·알림 상태는 주소에서 읽는다. [로그아웃] → 로그인 화면 */
export function AdminShellFor({
  current,
  badges,
  children,
}: {
  current: string;
  badges: AdminBadges;
  children: React.ReactNode;
}) {
  const navigate = useNavigate();
  const { role, bell, search } = useAdminPreview();
  const [items, setItems] = useState<AdminNotification[]>(() => (bell === 'empty' ? [] : sampleNotifications()));
  // 미리보기 고르기로 알림 상태를 바꾸면 목록을 다시 채운다
  useEffect(() => {
    setItems(bell === 'empty' ? [] : sampleNotifications());
  }, [bell]);
  return (
    <AdminShell
      role={role}
      badges={badges}
      current={current}
      notifications={items}
      onReadAll={() => setItems((list) => list.map((n) => ({ ...n, unread: false })))}
      onLogout={() => navigate(`${PV_ADMIN.login}${search}`)}
    >
      {children}
    </AdminShell>
  );
}

/** 미리보기 전용 고르기 한 칸(RdDemo의 DemoBar와 같은 모양, 한 상자에 여러 칸을 둘 수 있다). 실제 화면에는 없다 — 10단계 교체 때 지운다. */
export function AdminDemoSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: DemoOption[];
  onChange: (v: string) => void;
}) {
  const id = useId();
  const groups = Array.from(new Set(options.map((o) => o.group ?? '')));
  return (
    <>
      <label htmlFor={id}>{label}</label>
      <RdSelect id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        {groups.map((g) =>
          g ? (
            <optgroup key={g} label={g}>
              {options.filter((o) => o.group === g).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </optgroup>
          ) : (
            options.filter((o) => !o.group).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)
          ),
        )}
      </RdSelect>
    </>
  );
}

/** 쪽 제목 — 명조 36 = 메뉴 이름. 옛 "운영자 승인 대시보드"와 "○○님"은 뺀다(00-37 §4.1) */
export function AdminTitle({ children }: { children: React.ReactNode }) {
  return <h1 className="rd-pt-title">{children}</h1>;
}
