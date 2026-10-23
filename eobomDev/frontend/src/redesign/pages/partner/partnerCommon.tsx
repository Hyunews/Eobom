import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PartnerShell } from './PartnerShell';
import { PARTNER_NAME, PV_PARTNER, facilityMenu } from './partnerData';

// 8단계 묶음 10 · 파트너 화면 공통 조각. 화면마다 같은 틀(이름·메뉴·로그아웃)을 쓰므로 한 곳에서 끼운다.

/** 장사시설 사업자 틀. 메뉴 옆 갈색 숫자 = 응답 전 문의 수(홈 첫 칸과 같은 뜻). [로그아웃] → 입구 */
export function PartnerShellFor({
  current,
  waiting = 3,
  children,
}: {
  current: string;
  waiting?: number;
  children: React.ReactNode;
}) {
  const navigate = useNavigate();
  return (
    <PartnerShell
      name={PARTNER_NAME}
      menu={facilityMenu(waiting)}
      current={current}
      onLogout={() => navigate(PV_PARTNER.login)}
    >
      {children}
    </PartnerShell>
  );
}

/** 본문 세로 틀 — 간격은 CSS가 정한다 */
export function PartnerMain({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={['rd-pt-content', className].filter(Boolean).join(' ')}>{children}</div>;
}

/** 상태 글자(갈색/완료/보조/위험) — 색은 00-44 §6-4. 목록 줄·상세에서 쓴다. */
export function StatusText({ tone, children }: { tone: 'state' | 'done' | 'faint' | 'danger'; children: React.ReactNode }) {
  return <b className={`rd-pt-status rd-pt-status--${tone}`}>{children}</b>;
}
