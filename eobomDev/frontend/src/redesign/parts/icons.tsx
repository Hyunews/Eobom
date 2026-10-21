import React from 'react';

// 선 그림 아이콘 — 이모지를 쓰지 않는다(00-44 §6-4-5). 색은 currentColor.
type P = { size?: number };

function Svg({ size = 20, children, fill = 'none' }: { size?: number; children: React.ReactNode; fill?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}

export const IconArrow = ({ size = 16 }: P) => <Svg size={size}><path d="M5 12h14M13 6l6 6-6 6" /></Svg>;
export const IconArrowOut = ({ size = 14 }: P) => <Svg size={size}><path d="M7 17L17 7M9 7h8v8" /></Svg>;
export const IconChevronRight = ({ size = 18 }: P) => <Svg size={size}><path d="M9 6l6 6-6 6" /></Svg>;
export const IconChevronDown = ({ size = 18 }: P) => <Svg size={size}><path d="M6 9l6 6 6-6" /></Svg>;
export const IconChevronUp = ({ size = 18 }: P) => <Svg size={size}><path d="M6 15l6-6 6 6" /></Svg>;
export const IconClose = ({ size = 20 }: P) => <Svg size={size}><path d="M6 6l12 12M18 6L6 18" /></Svg>;
export const IconPause = ({ size = 18 }: P) => <Svg size={size}><path d="M9 6v12M15 6v12" /></Svg>;
export const IconInfo = ({ size = 20 }: P) => <Svg size={size}><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5v.01" /></Svg>;
export const IconWarn = ({ size = 20 }: P) => <Svg size={size}><path d="M12 4l9 16H3z" /><path d="M12 10v5M12 17.5v.01" /></Svg>;
export const IconCheckCircle = ({ size = 20 }: P) => <Svg size={size}><circle cx="12" cy="12" r="9" /><path d="M8 12.5l2.7 2.7L16 9.5" /></Svg>;
export const IconPin = ({ size = 16 }: P) => <Svg size={size}><path d="M12 21s6-5.6 6-10.5A6 6 0 0 0 6 10.5C6 15.4 12 21 12 21z" /><circle cx="12" cy="10.5" r="2.2" /></Svg>;
export const IconCalendar = ({ size = 18 }: P) => <Svg size={size}><rect x="4" y="5.5" width="16" height="14" rx="1" /><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" /></Svg>;
export const IconDoc = ({ size = 24 }: P) => <Svg size={size}><path d="M7 3.5h7l4 4V20.5H7z" /><path d="M14 3.5v4h4M10 12h5M10 16h5" /></Svg>;
export const IconFolder = ({ size = 24 }: P) => <Svg size={size}><path d="M3.5 7.5h6l2 2.5h9v8.5h-17z" /></Svg>;
export const IconUpload = ({ size = 22 }: P) => <Svg size={size}><path d="M12 16V5M7.5 9.5L12 5l4.5 4.5M5 19h14" /></Svg>;
export const IconImage = ({ size = 22 }: P) => <Svg size={size}><rect x="4" y="5" width="16" height="14" rx="1" /><circle cx="9" cy="10" r="1.6" /><path d="M5 18l5-4.5 3.5 3L16 14l3 3" /></Svg>;
export const IconCamera = ({ size = 20 }: P) => <Svg size={size}><path d="M4 8.5h3.5L9 6h6l1.5 2.5H20V19H4z" /><circle cx="12" cy="13.5" r="3.2" /></Svg>;
export const IconRetry = ({ size = 22 }: P) => <Svg size={size}><path d="M4.5 12a7.5 7.5 0 1 1 2.2 5.3M4.5 18v-4.5H9" /></Svg>;
export const IconCloudOff = ({ size = 28 }: P) => <Svg size={size}><path d="M8 18h9.5a3.5 3.5 0 0 0 .6-6.9A5.5 5.5 0 0 0 7.5 9.7 4.2 4.2 0 0 0 8 18z" /><path d="M4 4l16 16" /></Svg>;
export const IconBox = ({ size = 28 }: P) => <Svg size={size}><path d="M4 8l8-4 8 4v8l-8 4-8-4z" /><path d="M4 8l8 4 8-4M12 12v8" /></Svg>;
export const IconBroken = ({ size = 28 }: P) => <Svg size={size}><circle cx="12" cy="12" r="9" /><path d="M9 9l6 6M15 9l-6 6" /></Svg>;
export const IconDone = ({ size = 28 }: P) => <Svg size={size}><circle cx="12" cy="12" r="9" /><path d="M7.8 12.4l3 3 5.4-6" /></Svg>;
export const IconRead = ({ size = 28 }: P) => <Svg size={size}><path d="M4 7h16M4 12h10M4 17h7" /><circle cx="18" cy="16" r="2.5" /><path d="M20 18l1.5 1.5" /></Svg>;
export const IconCheck = ({ size = 14 }: P) => <Svg size={size}><path d="M5 12.5l4.5 4.5L19 7.5" /></Svg>;
