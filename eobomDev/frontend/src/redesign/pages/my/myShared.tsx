import React from 'react';
import { RdBadge, type RdBadgeKind } from '../../parts/RdButtons';
import { RdPageHead } from '../../parts/RdNav';
import { RdLoginGate } from '../../parts/RdModal';
import { IconCheck, IconErrorCircle } from '../../parts/icons';
import './mypage.css';

// 8단계 묶음 7 · 마이페이지 미리보기 공용 조각. 아이콘은 4단계 캔버스(판 4-1)의 인라인 SVG 그대로.

function Svg({ size = 22, children, sw = 1.5 }: { size?: number; children: React.ReactNode; sw?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}

export const IconGear = ({ size = 18 }: { size?: number }) => (
  <Svg size={size} sw={1.6}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </Svg>
);
export const IconBook = () => (
  <Svg>
    <path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z" />
    <path d="M5 17a3 3 0 0 1 3-3h11" />
  </Svg>
);
export const IconPhoneHeart = () => (
  <Svg>
    <rect x="7" y="3" width="10" height="18" rx="1.5" />
    <path d="M12 15.5s-2.5-1.6-2.5-3.2a1.4 1.4 0 0 1 2.5-.8 1.4 1.4 0 0 1 2.5.8c0 1.6-2.5 3.2-2.5 3.2z" />
  </Svg>
);
export const IconFlower = ({ size = 22 }: { size?: number }) => (
  <Svg size={size}>
    <circle cx="12" cy="12" r="2.5" />
    <path d="M12 9.5C10 7 10 4 12 3c2 1 2 4 0 6.5zM14.5 12c2.5-2 5.5-2 6.5 0-1 2-4 2-6.5 0zM12 14.5c2 2.5 2 5.5 0 6.5-2-1-2-4 0-6.5zM9.5 12c-2.5 2-5.5 2-6.5 0 1-2 4-2 6.5 0z" />
  </Svg>
);
export const IconQuill = () => (
  <Svg>
    <path d="M4 20l1-4L16 5l3 3L8 19z" />
    <path d="M14 7l3 3" />
  </Svg>
);
export const IconInbox = () => (
  <Svg>
    <path d="M4 13l2-8h12l2 8v6H4z" />
    <path d="M4 13h5l1 2h4l1-2h5" />
  </Svg>
);
export const IconBubble = () => (
  <Svg>
    <path d="M12 4c-4.5 0-8 2.8-8 6.3 0 2.2 1.4 4.1 3.6 5.3L7 20l4-2.6h1c4.5 0 8-2.8 8-6.3S16.5 4 12 4z" />
  </Svg>
);
export const IconShield = () => (
  <Svg>
    <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
    <path d="M8.5 12l2.5 2.5 4.5-5" />
  </Svg>
);
export const IconExternal = ({ size = 18 }: { size?: number }) => (
  <Svg size={size} sw={1.6}>
    <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
  </Svg>
);
export const IconCopy = ({ size = 16 }: { size?: number }) => (
  <Svg size={size} sw={1.6}>
    <rect x="8" y="8" width="12" height="12" rx="1" />
    <path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" />
  </Svg>
);

/** 로그인 전 — 쪽 제목(+부제) 위에 두고 아래에 가림막 카드. 실제 화면은 화면 전체를 가리지만 견본은 상자 안에만 보인다 */
export function MyGate({ title, desc, screenName }: { title?: string; desc?: string; screenName: string }) {
  return (
    <>
      {title && (
        <div className="rd-mp-read">
          <RdPageHead title={title} desc={desc} />
        </div>
      )}
      <div className="rd-mp-gatebox">
        <RdLoginGate screenName={screenName} contained />
      </div>
    </>
  );
}

/** 구간 — 명조 제목 + (곳 수) + 아래에 목록. 4단계 판은 구간 머리 아래 실선 없이 목록 윗선(먹색)만 쓴다 */
export function MySec({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  return (
    <section className="rd-mp-sec">
      <h2 className="rd-t-section">
        {title}
        {count !== undefined && <span className="rd-mp-ct">({count})</span>}
      </h2>
      {children}
    </section>
  );
}

/** 구간 안 한 줄 상태 글 */
export function MyLine({ kind, children }: { kind: 'loading' | 'error' | 'empty'; children: React.ReactNode }) {
  return (
    <div className="rd-mp-line">
      {kind === 'loading' && (
        <div role="status">
          <span className="rd-spin" aria-hidden="true" />
          <span>{children}</span>
        </div>
      )}
      {kind === 'error' && (
        <div role="alert" className="rd-mp-line__err">
          <IconErrorCircle size={16} />
          <span>{children}</span>
        </div>
      )}
      {kind === 'empty' && <div>{children}</div>}
    </div>
  );
}

/** 딱지 — 상담 "종료"만 연한 회색이라 부품 종류에 없는 색을 CSS로 더한다 */
export function MyBadge({ kind, faint, children }: { kind: RdBadgeKind; faint?: boolean; children: React.ReactNode }) {
  if (faint) return <span className="rd-badge rd-badge--state rd-mp-badge--faint">{children}</span>;
  return <RdBadge kind={kind}>{children}</RdBadge>;
}

/** 결과 한 줄(완료색 / 위험색) */
export function MyResult({ tone, children }: { tone: 'ok' | 'err'; children: React.ReactNode }) {
  return (
    <p className={`rd-mp-rs rd-mp-rs--${tone}`} role={tone === 'err' ? 'alert' : 'status'}>
      {tone === 'ok' ? <IconCheck size={16} /> : <IconErrorCircle size={16} />}
      <span>{children}</span>
    </p>
  );
}

/** 값 줄 목록(상세 창 · 관리 화면 정보) */
export function MyDl({ rows, tight }: { rows: { name: string; value: React.ReactNode; stack?: boolean }[]; tight?: boolean }) {
  return (
    <dl className={`rd-mp-dl${tight ? ' rd-mp-info' : ''}`}>
      {rows.map((r) => (
        <div key={r.name} className={`rd-mp-dl__row${r.stack ? ' rd-mp-dl__row--stack' : ''}`}>
          <dt>{r.name}</dt>
          <dd>{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}
