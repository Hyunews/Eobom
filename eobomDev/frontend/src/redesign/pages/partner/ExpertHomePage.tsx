import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DemoBar, type DemoOption } from '../../parts/RdDemo';
import { RdTextLink } from '../../parts/RdButtons';
import { ExpertShellFor, PartnerMain } from './partnerCommon';
import { PartnerTitle } from './PartnerShell';
import { PV_PARTNER } from './partnerData';

// 8단계 묶음 11 · /preview/partner/expert/home — 전문가 홈. 정본: 02-03 §7.3-1 · 판 6-10.
// 숫자 칸 3칸(사업자 홈과 같은 짜임) — "수락 전 상담" = 접수 건수(갈색, 링크 받은 상담) · "승인 상태" = 승인됨(완료색) · "소비자 화면 공개" = 공개 중/비공개(링크 내 프로필 둘 다).
// 메뉴 옆 갈색 숫자도 "수락 전 상담"과 같은 뜻. 숫자는 지금 받는 목록에서 센다(새 API 없음).

type View = 'ready' | 'zero' | 'private' | 'loading' | 'loadfail';
const DEMOS: DemoOption[] = [
  { value: 'ready', label: '기본 (1 · 승인됨 · 공개 중)' },
  { value: 'zero', label: '접수 0건' },
  { value: 'private', label: '비공개' },
  { value: 'loading', label: '불러오는 중', group: '상태' },
  { value: 'loadfail', label: '불러오기 실패', group: '상태' },
];

export function ExpertHomePage() {
  const navigate = useNavigate();
  const [view, setView] = useState<View>('ready');
  const ok = view === 'ready' || view === 'zero' || view === 'private';
  const waiting = view === 'ready' || view === 'private' ? 1 : 0;

  const go = (to: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(to);
  };

  const cells = ok && [
    { name: '수락 전 상담', value: String(waiting), tone: waiting > 0 ? 'is-warm' : '', to: PV_PARTNER.expertConsults, link: '받은 상담' },
    { name: '승인 상태', value: '승인됨', tone: 'is-done', to: PV_PARTNER.expertProfile, link: '내 프로필' },
    { name: '소비자 화면 공개', value: view === 'private' ? '비공개' : '공개 중', tone: '', to: PV_PARTNER.expertProfile, link: '내 프로필' },
  ];

  return (
    <ExpertShellFor current="home" waiting={ok ? waiting : 0}>
      <PartnerMain>
        <PartnerTitle>홈</PartnerTitle>
        {view === 'loading' && <p className="rd-pt-line" role="status">불러오는 중…</p>}
        {view === 'loadfail' && <p className="rd-pt-line rd-pt-line--err" role="alert">불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>}
        {cells && (
          <div className="rd-pt-stats">
            {cells.map((c, i) => (
              <div className="rd-pt-stat" key={`${c.name}-${i}`}>
                <div className="rd-pt-stat__text">
                  <span className="rd-pt-stat__name">{c.name}</span>
                  <RdTextLink href={c.to} onClick={go(c.to)}>{c.link}</RdTextLink>
                </div>
                <b className={`rd-pt-stat__num${c.tone ? ` ${c.tone}` : ''}`}>{c.value}</b>
              </div>
            ))}
          </div>
        )}
        <DemoBar value={view} options={DEMOS} onChange={(v) => setView(v as View)} />
      </PartnerMain>
    </ExpertShellFor>
  );
}
