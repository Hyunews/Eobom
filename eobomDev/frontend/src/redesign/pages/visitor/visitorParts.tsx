import React, { useLayoutEffect } from 'react';
import { DemoBar, type DemoOption } from '../../parts/RdDemo';
import { RdButton } from '../../parts/RdButtons';
import { RdState } from '../../parts/RdState';
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
    <RdState kind="offline" title="지금 연결이 원활하지 않습니다." desc="잠시 후 다시 시도해 주세요.">
      <RdButton place="row" onClick={onRetry}>다시 시도</RdButton>
    </RdState>
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
