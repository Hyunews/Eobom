import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RdTextLink } from '../../parts/RdButtons';
import type { DemoOption } from '../../parts/RdDemo';
import { AdminDemoSelect, AdminShellFor, AdminTitle, useAdminPreview } from './AdminShell';
import { DASHBOARD_READY, DASHBOARD_ZERO, adminPath, badgesOf, type AdminDashboard, type AdminRole } from './adminData';

// 8단계 묶음 12 · /preview/admin/home — 홈(로그인 뒤 첫 화면). 정본: 00-37 §4.1 홈 표 · A-3 · 판 6-14.
// 건수와 메뉴 글 링크만 둔다. 내용(이름·편지·사유)은 넣지 않는다(§3.1).
// 숫자는 GET /admin/dashboard 응답 모양(review · afterDeath · recent)과 같다 — 미리보기는 예시 값.

type View = 'ready' | 'zero' | 'loading' | 'loadfail';
const VIEWS: DemoOption[] = [
  { value: 'ready', label: '기본' },
  { value: 'zero', label: '모두 0' },
  { value: 'loading', label: '불러오는 중', group: '상태' },
  { value: 'loadfail', label: '불러오기 실패', group: '상태' },
];
const ROLES: DemoOption[] = [
  { value: 'SUPERADMIN', label: 'SUPERADMIN' },
  { value: 'OPERATOR', label: 'OPERATOR (SUPERADMIN 메뉴 흐림)' },
];
const BELLS: DemoOption[] = [
  { value: 'some', label: '알림 5건 (안 읽음 3)' },
  { value: 'empty', label: '알림 없음' },
];

type Tone = 'warm' | 'danger' | 'plain';
interface Cell {
  name: string;
  value: number;
  tone: Tone;
  key: string;
  link: string;
  /** 링크가 가는 곳에 붙는 거르기(최근 오류 → 감사로그 결과 FAIL) */
  query?: string;
}

export function AdminHomePage() {
  const navigate = useNavigate();
  const { role, bell, search, setPreview } = useAdminPreview();
  const [view, setView] = useState<View>('ready');
  const data: AdminDashboard | null = view === 'ready' ? DASHBOARD_READY : view === 'zero' ? DASHBOARD_ZERO : null;

  const warm = (n: number): Tone => (n > 0 ? 'warm' : 'plain');
  const sections: { title: string; cols: number; cells: Cell[] }[] | null = data && [
    {
      title: '심사',
      cols: 3,
      cells: [
        { name: '사업자 가입', value: data.review.partners, tone: warm(data.review.partners), key: 'partners', link: '사업자 가입' },
        { name: '전문가 가입', value: data.review.experts, tone: warm(data.review.experts), key: 'experts', link: '전문가 가입' },
        { name: '시설 연동', value: data.review.claims, tone: warm(data.review.claims), key: 'claims', link: '시설 연동' },
      ],
    },
    {
      title: '사후 처리',
      cols: 4,
      cells: [
        { name: '사망 확인 대기', value: data.afterDeath.deathPending, tone: warm(data.afterDeath.deathPending), key: 'death', link: '사망 확인' },
        { name: '대외 마감 초과', value: data.afterDeath.deathOverDue, tone: data.afterDeath.deathOverDue > 0 ? 'danger' : 'plain', key: 'death', link: '사망 확인' },
        { name: '내부 목표 초과', value: data.afterDeath.deathOverTarget, tone: warm(data.afterDeath.deathOverTarget), key: 'death', link: '사망 확인' },
        { name: '파기 만료', value: data.afterDeath.purgeExpired, tone: warm(data.afterDeath.purgeExpired), key: 'purge', link: '유족메시지 파기' },
      ],
    },
    {
      title: '최근',
      cols: 3,
      cells: [
        { name: '최근 가입', value: data.recent.signups, tone: 'plain', key: 'members', link: '회원' },
        { name: '최근 오류', value: data.recent.errors, tone: 'plain', key: 'audit', link: '감사로그', query: 'result=FAIL' },
      ],
    },
  ];

  const href = (c: Cell) => {
    const base = adminPath(c.key);
    const p = new URLSearchParams(search);
    if (c.query) new URLSearchParams(c.query).forEach((v, k) => p.set(k, v));
    const s = p.toString();
    return s ? `${base}?${s}` : base;
  };

  return (
    <AdminShellFor current="home" badges={badgesOf(data)}>
      <div className="rd-ad-home">
        <AdminTitle>홈</AdminTitle>
        {view === 'loading' && <p className="rd-pt-line" role="status">불러오는 중…</p>}
        {view === 'loadfail' && <p className="rd-pt-line rd-pt-line--err" role="alert">불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>}
        {sections?.map((s) => (
          <section className="rd-ad-sec" key={s.title} aria-labelledby={`rd-ad-sec-${s.title}`}>
            <h2 className="rd-ad-sec__title" id={`rd-ad-sec-${s.title}`}>{s.title}</h2>
            <div className="rd-ad-stats" style={{ '--cols': s.cols } as React.CSSProperties}>
              {s.cells.map((c) => (
                <div className="rd-ad-stat" key={c.name}>
                  <span className="rd-ad-stat__name">{c.name}</span>
                  <b className={`rd-ad-stat__num${c.tone === 'warm' ? ' is-warm' : c.tone === 'danger' ? ' is-danger' : ''}`}>{c.value}</b>
                  <RdTextLink
                    href={href(c)}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(href(c));
                    }}
                  >
                    {c.link}
                  </RdTextLink>
                </div>
              ))}
            </div>
          </section>
        ))}
        <div className="rd-demo">
          <AdminDemoSelect label="미리보기 전용 · 보기 상태" value={view} options={VIEWS} onChange={(v) => setView(v as View)} />
          <AdminDemoSelect label="로그인한 등급" value={role} options={ROLES} onChange={(v) => setPreview({ role: v as AdminRole })} />
          <AdminDemoSelect label="알림" value={bell} options={BELLS} onChange={(v) => setPreview({ bell: v as 'some' | 'empty' })} />
        </div>
      </div>
    </AdminShellFor>
  );
}
