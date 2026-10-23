import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DemoBar, type DemoOption } from '../../parts/RdDemo';
import { RdTextLink } from '../../parts/RdButtons';
import { PartnerMain, PartnerShellFor } from './partnerCommon';
import { PartnerTitle } from './PartnerShell';
import { PV_PARTNER } from './partnerData';

// 8단계 묶음 10 · /preview/partner/home — 홈. 정본: 01-05 §14-3 · 판 6-4.
// 숫자 칸 3칸 — 칸마다 이름 · 숫자(명조 32) · 메뉴 이름 글 링크. 그 밖엔 아무것도 두지 않는다.
// "새 문의 건수"라는 이름을 쓰지 않는다(확정 ⑧) — 목록을 여는 순간 접수가 전달됨이 되므로 "응답 전 문의"(접수·전달됨, [응답 완료로 표시] 전).
// 숫자는 지금 받는 목록에서 센다(새 API 없음).

type View = 'ready' | 'zero' | 'loading' | 'loadfail';
const DEMOS: DemoOption[] = [
  { value: 'ready', label: '기본 (3 · 2 · 1)' },
  { value: 'zero', label: '모두 0' },
  { value: 'loading', label: '불러오는 중', group: '상태' },
  { value: 'loadfail', label: '불러오기 실패', group: '상태' },
];

const COUNTS: Record<'ready' | 'zero', [number, number, number]> = { ready: [3, 2, 1], zero: [0, 0, 0] };

export function PartnerHomePage() {
  const navigate = useNavigate();
  const [view, setView] = useState<View>('ready');
  const counts = view === 'ready' || view === 'zero' ? COUNTS[view] : null;

  const go = (to: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(to);
  };

  const cells = counts && [
    { name: '응답 전 문의', value: counts[0], to: PV_PARTNER.inquiries, link: '받은 문의', warm: counts[0] > 0 },
    { name: '연동 시설 수', value: counts[1], to: PV_PARTNER.facility, link: '내 시설', warm: false },
    { name: '연동 신청 심사 대기 수', value: counts[2], to: PV_PARTNER.link, link: '시설 연동', warm: false },
  ];

  return (
    <PartnerShellFor current="home" waiting={counts ? counts[0] : 0}>
      <PartnerMain>
        <PartnerTitle>홈</PartnerTitle>
        {view === 'loading' && <p className="rd-pt-line" role="status">불러오는 중…</p>}
        {view === 'loadfail' && <p className="rd-pt-line rd-pt-line--err" role="alert">불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>}
        {cells && (
          <div className="rd-pt-stats">
            {cells.map((c) => (
              <div className="rd-pt-stat" key={c.name}>
                <div className="rd-pt-stat__text">
                  <span className="rd-pt-stat__name">{c.name}</span>
                  <RdTextLink href={c.to} onClick={go(c.to)}>{c.link}</RdTextLink>
                </div>
                <b className={`rd-pt-stat__num${c.warm ? ' is-warm' : ''}`}>{c.value}</b>
              </div>
            ))}
          </div>
        )}
        <DemoBar value={view} options={DEMOS} onChange={(v) => setView(v as View)} />
      </PartnerMain>
    </PartnerShellFor>
  );
}
