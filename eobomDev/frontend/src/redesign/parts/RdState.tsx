import React from 'react';

// 00-44 §7-7 상태 화면 — 다섯 가지 모두 같은 틀: 선 그림 → 제목 → 한 줄 설명 → 다음에 할 버튼. 가운데 정렬, 종이 칸 안.
// 선 그림은 0단계 판 08(States_D/M)의 그림 그대로(40 × 40).

export type RdStateKind = 'empty' | 'working' | 'offline' | 'error' | 'done';

const S = { width: 40, height: 40, viewBox: '0 0 24 24', fill: 'none', strokeLinecap: 'round' as const, 'aria-hidden': true, focusable: false };

const ICON: Record<RdStateKind, React.ReactNode> = {
  empty: (
    <svg {...S} stroke="#B9AC98" strokeWidth="1.2">
      <rect x="3" y="6" width="18" height="13" rx="1" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  ),
  working: (
    <svg {...S} stroke="#7A5634" strokeWidth="1.4">
      <circle cx="12" cy="12" r="9" stroke="#E6DCCB" />
      <path d="M12 3a9 9 0 0 1 9 9" />
    </svg>
  ),
  offline: (
    <svg {...S} stroke="#B9AC98" strokeWidth="1.2">
      <path d="M2 9a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0" />
      <circle cx="12" cy="19.5" r="0.8" />
      <path d="M3 3l18 18" stroke="#9A3B2E" />
    </svg>
  ),
  error: (
    <svg {...S} stroke="#B9AC98" strokeWidth="1.2">
      <path d="M5 4h10l4 4v12H5z" />
      <path d="M10 11l4 4M14 11l-4 4" stroke="#9A3B2E" />
    </svg>
  ),
  done: (
    <svg {...S} stroke="#4F6B3A" strokeWidth="1.4">
      <circle cx="12" cy="12" r="9" />
      <path d="M7.5 12.5l3 3 6-7" />
    </svg>
  ),
};

export function RdState({
  kind,
  title,
  desc,
  progress,
  children,
  link,
}: {
  kind: RdStateKind;
  title: string;
  desc?: string;
  /** 처리 중: 진행 막대(폭 280 · 높이 4 · 갈색) + "2 / 3장째" */
  progress?: { now: number; total: number; unit?: string };
  /** 다음에 할 버튼. 모바일은 가득 폭 52로 쌓인다. 소스 순서는 [보조][주] */
  children?: React.ReactNode;
  /** 버튼 아래 글 링크. 모바일에서 버튼 쌓기(주가 위)와 따로 두어 맨 아래에 남긴다 */
  link?: React.ReactNode;
}) {
  const busy = kind === 'working';
  return (
    <section
      className={`rd-state rd-state--${kind}`}
      // 처리 중은 화면낭독에 알린다. 그 밖은 화면이 바뀐 것이라 따로 알리지 않는다.
      role={busy ? 'status' : undefined}
      aria-busy={busy || undefined}
    >
      <span className="rd-state__icon">{ICON[kind]}</span>
      <h2 className="rd-state__title">{title}</h2>
      {desc && <p className="rd-state__desc">{desc}</p>}
      {progress && (
        <div className="rd-state__progress">
          <div
            className="rd-progress"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={progress.total}
            aria-valuenow={progress.now}
            aria-label="진행"
          >
            <span style={{ width: `${Math.min(100, (progress.now / progress.total) * 100)}%` }} />
          </div>
          <p className="rd-state__count">{progress.now} / {progress.total}{progress.unit ?? '장째'}</p>
        </div>
      )}
      {children && <div className="rd-state__actions">{children}</div>}
      {link}
    </section>
  );
}
