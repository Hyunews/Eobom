import React from 'react';

// 선 그림 아이콘 — 이모지를 쓰지 않는다(00-44 §6-4-5). 색은 currentColor.
// 그림·굵기는 0단계 캔버스 판 02~08 데스크톱(`*_D`)의 인라인 SVG 그대로(2026-10-21 보완).
// 캔버스에 없는 그림(Pause · ArrowOut · Doc · Folder · Image · Camera · Retry)은 임시 선 그림이다.
type P = { size?: number };

function Svg({ size = 20, children, sw = 1.6 }: { size?: number; children: React.ReactNode; sw?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}

// 캔버스 그림
export const IconArrow = ({ size = 16 }: P) => <Svg size={size}><path d="M5 12h14M13 6l6 6-6 6" /></Svg>;
export const IconChevronRight = ({ size = 18 }: P) => <Svg size={size}><path d="M9 6l6 6-6 6" /></Svg>;
export const IconChevronLeft = ({ size = 18 }: P) => <Svg size={size}><path d="M15 6l-6 6 6 6" /></Svg>;
export const IconChevronDown = ({ size = 18 }: P) => <Svg size={size}><path d="M6 9l6 6 6-6" /></Svg>;
export const IconChevronUp = ({ size = 18 }: P) => <Svg size={size}><path d="M6 15l6-6 6 6" /></Svg>;
export const IconClose = ({ size = 20 }: P) => <Svg size={size}><path d="M6 6l12 12M18 6L6 18" /></Svg>;
export const IconInfo = ({ size = 22 }: P) => <Svg size={size}><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5v.5" /></Svg>;
export const IconWarn = ({ size = 22 }: P) => <Svg size={size} sw={1.8}><path d="M12 3l10 18H2z" /><path d="M12 10v5M12 18v.5" /></Svg>;
export const IconCheckCircle = ({ size = 20 }: P) => <Svg size={size} sw={1.8}><circle cx="12" cy="12" r="9" /><path d="M7.5 12.5l3 3 6-7" /></Svg>;
export const IconPin = ({ size = 18 }: P) => <Svg size={size}><path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z" /><circle cx="12" cy="10" r="2.2" /></Svg>;
export const IconCalendar = ({ size = 18 }: P) => <Svg size={size}><rect x="4" y="5" width="16" height="15" rx="1" /><path d="M4 10h16M9 3v4M15 3v4" /></Svg>;
export const IconUpload = ({ size = 32 }: P) => <Svg size={size} sw={1.5}><path d="M12 16V4M7 9l5-5 5 5M4 16v4h16v-4" /></Svg>;
export const IconErrorCircle = ({ size = 14 }: P) => <Svg size={size} sw={2}><circle cx="12" cy="12" r="9" /><path d="M12 7v6M12 16.5v.5" /></Svg>;
export const IconCheck =({ size = 18 }: P) => <Svg size={size} sw={1.8}><path d="M5 12l5 5 9-10" /></Svg>;
export const IconMail = ({ size = 20 }: P) => <Svg size={size}><rect x="3" y="6" width="18" height="13" rx="1" /><path d="M3 7l9 6 9-6" /></Svg>;
export const IconUser = ({ size = 24 }: P) => <Svg size={size} sw={1.5}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></Svg>;
export const IconUsers = ({ size = 24 }: P) => <Svg size={size} sw={1.5}><circle cx="9" cy="8" r="3" /><path d="M3 20c0-3 3-5 6-5s6 2 6 5M16 11a3 3 0 0 0 0-6M21 20c0-2-1.5-4-4-4.6" /></Svg>;

// 캔버스에 없는 임시 선 그림
export const IconArrowOut = ({ size = 14 }: P) => <Svg size={size}><path d="M7 17L17 7M9 7h8v8" /></Svg>;
export const IconPause = ({ size = 18 }: P) => <Svg size={size}><path d="M9 6v12M15 6v12" /></Svg>;
export const IconDoc = ({ size = 24 }: P) => <Svg size={size}><path d="M7 3.5h7l4 4V20.5H7z" /><path d="M14 3.5v4h4M10 12h5M10 16h5" /></Svg>;
export const IconFolder = ({ size = 24 }: P) => <Svg size={size}><path d="M3.5 7.5h6l2 2.5h9v8.5h-17z" /></Svg>;
export const IconImage = ({ size = 22 }: P) => <Svg size={size}><rect x="4" y="5" width="16" height="14" rx="1" /><circle cx="9" cy="10" r="1.6" /><path d="M5 18l5-4.5 3.5 3L16 14l3 3" /></Svg>;
export const IconCamera = ({ size = 20 }: P) => <Svg size={size}><path d="M4 8.5h3.5L9 6h6l1.5 2.5H20V19H4z" /><circle cx="12" cy="13.5" r="3.2" /></Svg>;
