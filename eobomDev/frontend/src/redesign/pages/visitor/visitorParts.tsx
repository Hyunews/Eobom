import React, { useLayoutEffect } from 'react';
import { DemoBar, type DemoOption } from '../../parts/RdDemo';
import { RdButton } from '../../parts/RdButtons';
import './visitor.css';

// 8단계 묶음 6 · 조문객 화면 공통 조각. 조문객 화면은 껍데기가 없다(헤더·메뉴·바닥글 없이 화면만, 3단계 목록 맨 위 🔴).
// 그래서 RdLayout 밖에서 열고, 토큰(.rd-root)만 직접 두른다. 값은 전부 .rd-vs 아래에 가둔다.

/** 국화 선그림 — 임시 그림(캔버스 결정 기록: 나중에 교체). 꽃잎 바깥 12 · 안쪽 12 · 가운데 점. */
export function Chrysanthemum({ size = 56, className }: { size?: number; className?: string }) {
  const outer = Array.from({ length: 12 }, (_, i) => i * 30);
  const inner = Array.from({ length: 12 }, (_, i) => i * 30 + 15);
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      stroke="#8A7E70"
      strokeWidth="1.2"
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
    >
      <g transform="translate(32 32)">
        {outer.map((r) => (
          <ellipse key={`o${r}`} cx="0" cy="-19" rx="4.5" ry="12" transform={`rotate(${r})`} />
        ))}
        {inner.map((r) => (
          <ellipse key={`i${r}`} cx="0" cy="-10" rx="3" ry="8" transform={`rotate(${r})`} />
        ))}
        <circle cx="0" cy="0" r="2.5" />
      </g>
    </svg>
  );
}

/**
 * 조문객 화면 바깥 틀 + 미리보기 전용 "보기 상태" 고르기.
 * 🔴 미리보기 주소(/preview/visitor/…)에서만 쓴다 — 검색에 잡히지 않게 하는 meta는 PreviewApp이 이미 둔다.
 */
export function VisitorShell({
  demo,
  children,
}: {
  demo: { value: string; options: DemoOption[]; onChange: (v: string) => void };
  children: React.ReactNode;
}) {
  useLayoutEffect(() => {
    document.title = '조문객 화면 미리보기 — 이어봄';
  }, []);
  return (
    <div className="rd-root rd-vs">
      <main className="rd-vs-page">{children}</main>
      <div className="rd-vs-demo">
        <DemoBar value={demo.value} options={demo.options} onChange={demo.onChange} />
      </div>
    </div>
  );
}

/** 꼬리 — "이어봄" 글자만. */
export function VsFoot({ updated }: { updated?: string }) {
  return (
    <div className="rd-vs-foot">
      {updated && <p className="rd-vs-foot__updated">최종 수정: {updated}</p>}
      <p className="rd-vs-foot__brand">이어봄</p>
    </div>
  );
}

export type VsIcon = 'offline' | 'missing' | 'done' | 'declined' | 'expired' | 'blocked';

const IC = { width: 48, height: 48, viewBox: '0 0 24 24', fill: 'none', strokeLinecap: 'round' as const, 'aria-hidden': true, focusable: false };

const ICONS: Record<VsIcon, React.ReactNode> = {
  offline: (
    <svg {...IC} stroke="#B9AC98" strokeWidth="1.2">
      <path d="M2 9a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0" />
      <circle cx="12" cy="19.5" r="0.8" />
      <path d="M3 3l18 18" stroke="#9A3B2E" />
    </svg>
  ),
  missing: (
    <svg {...IC} stroke="#B9AC98" strokeWidth="1.2">
      <path d="M5 4h10l4 4v12H5z" />
      <path d="M9 12h6M9 16h4" />
    </svg>
  ),
  // 원 + 체크(완료 색)
  done: (
    <svg {...IC} stroke="#4F6B3A" strokeWidth="1.4">
      <circle cx="12" cy="12" r="9" />
      <path d="M7.5 12.5l3 3 6-7" />
    </svg>
  ),
  // 원 + 가로선
  declined: (
    <svg {...IC} stroke="#B9AC98" strokeWidth="1.2">
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12h8" />
    </svg>
  ),
  // 시계
  expired: (
    <svg {...IC} stroke="#B9AC98" strokeWidth="1.2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  ),
  // 원 + 느낌표(회색 선)
  blocked: (
    <svg {...IC} stroke="#B9AC98" strokeWidth="1.2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5M12 16v.5" />
    </svg>
  ),
};

/**
 * 판 8 틀 상태 화면 — 선 그림 + 제목 + 설명 + 버튼, 종이 카드(그림자 없음). 00-44 §7-7 · 3단계 결정 기록 3-3·3-7·3-9.
 * 부품 RdState와 같은 클래스(.rd-state)를 쓰되 3단계 판이 새로 그린 그림(원+가로선·시계 등)을 갈아 끼운다.
 */
export function VsState({
  icon,
  title,
  desc,
  busy,
  children,
}: {
  icon: VsIcon;
  title: string;
  desc?: string;
  busy?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <section className="rd-state rd-vs-state" role={icon === 'offline' ? 'alert' : busy ? 'status' : undefined} aria-busy={busy || undefined}>
      <span className="rd-state__icon rd-vs-state__icon">{ICONS[icon]}</span>
      <h2 className="rd-state__title">{title}</h2>
      {desc && <p className="rd-state__desc">{desc}</p>}
      {children && <div className="rd-state__actions">{children}</div>}
    </section>
  );
}

/** 불러오는 중 — 판 8 틀에 글자만(연장·초대는 짧은 화면이라 뼈대 대신, 3단계 확정 ②). */
export function VsLoadingText() {
  return (
    <section className="rd-state rd-vs-state" role="status" aria-busy="true">
      <p className="rd-state__desc">불러오는 중...</p>
    </section>
  );
}

/** 접속 실패 — 세 화면(부고장·추모관·연장·초대) 공통 문구. 지금 ConnectionFailed.tsx 문구와 같다. */
export function VsConnectionFailed({ onRetry }: { onRetry: () => void }) {
  return (
    <VsState icon="offline" title="지금 연결이 원활하지 않습니다." desc="잠시 후 다시 시도해 주세요.">
      <RdButton place="row" onClick={onRetry}>다시 시도</RdButton>
    </VsState>
  );
}

/** 다른 화면으로 가는 버튼 — 모양은 RdButton(화면 안 버튼 44/48) 그대로, 마크업만 링크. 미리보기라 홈 = 랜딩 미리보기로 잇는다. */
export function VsLinkButton({ kind = 'primary', href = '/preview/landing', children }: { kind?: 'primary' | 'secondary'; href?: string; children: React.ReactNode }) {
  return (
    <a className={`rd-btn rd-btn--${kind} rd-btn--screen`} href={href}>
      <span>{children}</span>
    </a>
  );
}

export const joinClass =(...c: (string | false | undefined | null)[]) => c.filter(Boolean).join(' ');
