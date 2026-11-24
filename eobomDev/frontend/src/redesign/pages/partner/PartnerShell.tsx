import React, { useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RdButton } from '../../parts/RdButtons';
import { IconArrow } from '../../parts/icons';
import { PV_PARTNER, type PartnerMenuItem } from './partnerData';
import './partner.css';

// 8단계 묶음 10 · 사업자 틀(전문가도 쓴다 — 묶음 11이 메뉴·이름 그림만 바꿔 끼운다). 정본: 01-05 §14-1 · 판 6-4.
// 이용자 헤더·바닥글이 없는 포털 전용 틀이라 PreviewApp의 RdLayout 밖에서 연다(조문객 화면과 같은 방식).
// 데스크톱 = 먹색 상단 바 + 왼쪽 메뉴 260 + 본문 / 모바일 = 상단 바 + 상호·[로그아웃] 한 줄 + 메뉴 한 줄 탭(옆으로 밀어 넘김).

export const IconShield = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
  </svg>
);
export const IconBuilding = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 21V5l8-2 8 2v16M9 9h2M13 9h2M9 13h2M13 13h2M10 21v-4h4v4" />
  </svg>
);
export const IconScale = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 4v16M6 20h12M4 8h16M7 8l-3 6a3 3 0 0 0 6 0zM17 8l-3 6a3 3 0 0 0 6 0z" />
  </svg>
);
export const IconLockSmall = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" role="img" aria-label="준비 중">
    <rect x="5" y="11" width="14" height="9" rx="1" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);

/** 포털 맨 위 먹색 바 — 로그인 전·후 모두 같다. 왼쪽 "이어봄" → 홈 / 오른쪽 "이어봄 홈으로" → 홈 (둘 다 미리보기에서는 /preview) */
export function PartnerTopBar() {
  const navigate = useNavigate();
  const go = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(PV_PARTNER.site);
  };
  return (
    <div className="rd-pt-top">
      <a className="rd-pt-top__logo" href={PV_PARTNER.site} onClick={go}>이어봄</a>
      <a className="rd-pt-top__home" href={PV_PARTNER.site} onClick={go}>
        <span>이어봄 홈으로</span>
        <IconArrow size={14} />
      </a>
    </div>
  );
}

/** 포털 뿌리 — .rd-root 안에서 글자·색 값이 걸리게 하고 body에 미리보기 바탕을 건다. */
export function PartnerRoot({ children }: { children: React.ReactNode }) {
  useLayoutEffect(() => {
    document.body.classList.add('rd-body');
    return () => document.body.classList.remove('rd-body');
  }, []);
  return <div className="rd-root rd-pt">{children}</div>;
}

export function PartnerShell({
  name,
  icon,
  menu,
  current,
  onLogout,
  children,
}: {
  name: string;
  /** 상호 앞 그림 — 장사시설 = 방패, 전문가 = 저울 */
  icon?: React.ReactNode;
  menu: PartnerMenuItem[];
  current: string;
  onLogout?: () => void;
  children: React.ReactNode;
}) {
  const navigate = useNavigate();
  return (
    <PartnerRoot>
      <PartnerTopBar />
      <div className="rd-pt-body">
        <div className="rd-pt-side">
          <div className="rd-pt-side__who">
            <span className="rd-pt-side__icon">{icon ?? <IconShield />}</span>
            <h2 className="rd-pt-side__name">{name}</h2>
          </div>
          <nav className="rd-pt-menu" aria-label="파트너 메뉴">
            {menu.map((m) => {
              const on = m.key === current;
              return (
                <a
                  key={m.key}
                  href={m.to}
                  className={`rd-pt-menu__item${on ? ' is-on' : ''}${m.locked ? ' is-locked' : ''}`}
                  aria-current={on ? 'page' : undefined}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(m.to);
                  }}
                >
                  <span className="rd-pt-menu__label">
                    {on && <span className="rd-pt-menu__dot" aria-hidden="true" />}
                    {m.label}
                  </span>
                  {m.badge !== undefined && m.badge > 0 && <span className="rd-pt-menu__badge">{m.badge}</span>}
                  {m.locked && <IconLockSmall />}
                </a>
              );
            })}
          </nav>
          <div className="rd-pt-side__out">
            <RdButton kind="secondary" place="screen" onClick={onLogout}>로그아웃</RdButton>
          </div>
        </div>
        <main className="rd-pt-main">{children}</main>
      </div>
    </PartnerRoot>
  );
}

/** 쪽 제목 — 명조 36(모바일 28) = 메뉴 이름 */
export function PartnerTitle({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="rd-pt-titlerow">
      <h1 className="rd-pt-title">{children}</h1>
      {aside}
    </div>
  );
}
