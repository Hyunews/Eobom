import React from 'react';

interface MenuIconProps {
  size?: number;
  color?: string; // 주 색상 (Primary)
  accentColor?: string; // 포인트 색상 (Accent - Gold)
  fillColor?: string; // 채우기 색상 (Fill - Green)
  className?: string;
}

/**
 * Design_Logo.png 공식 5대 핵심 메뉴 가이드 아이콘 세트
 * 통일된 HSL 색상 팔레트 적용:
 *  - Primary: #1A2B4C (Deep Navy) 또는 #FFFFFF (다크 헤더/사이드바용)
 *  - Accent: #D4A359 (Warm Gold)
 *  - Green: #5B7065 (Warm Green)
 */

// 1. 장례 · 묘지 매칭 (집 & 나뭇잎 - House & Leaf)
export const HouseLeafIcon: React.FC<MenuIconProps> = ({
  size = 24,
  color = '#FFFFFF',
  accentColor = '#D4A359',
  fillColor = '#5B7065'
}) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* 집 외곽 프레임 */}
    <path
      d="M4 14L16 4L28 14V26C28 27.1 27.1 28 26 28H6C4.9 28 4 27.1 4 26V14Z"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* 중앙 봄의 잎사귀 (Warm Green & Gold Accent) */}
    <path
      d="M16 12C12.5 12.8 11.5 16.5 11.5 20C15 20 18.7 19 19.5 15.5C19.5 12.8 17.5 12 16 12Z"
      fill={fillColor}
      fillOpacity="0.45"
      stroke={accentColor}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M13.5 19.5L18 14"
      stroke={accentColor}
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

// 2. 상속 · 법률 케어 (손 & 저울 - Hand & Scales)
export const HandScalesIcon: React.FC<MenuIconProps> = ({
  size = 24,
  color = '#FFFFFF',
  accentColor = '#D4A359',
  fillColor = '#5B7065'
}) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* 중앙 저울 기둥 */}
    <path d="M16 4V18M10 4H22M16 18L13 22H19L16 18Z" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    {/* 좌측 저울 접시 */}
    <path d="M7 11L10 4M7 11C7 13 8.8 14.5 11 14.5C13.2 14.5 15 13 15 11H7Z" stroke={accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill={fillColor} fillOpacity="0.3" />
    {/* 우측 저울 접시 */}
    <path d="M17 11L20 4M17 11C17 13 18.8 14.5 21 14.5C23.2 14.5 25 13 25 11H17Z" stroke={accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill={fillColor} fillOpacity="0.3" />
    {/* 하단 받쳐주는 케어의 손 */}
    <path d="M4 25C7 23.5 11 23.5 15 25.5C19 27.5 24 26 28 24" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

// 3. 디지털 유품 정리 (스마트폰 & 하트 - Phone & Heart)
export const PhoneHeartIcon: React.FC<MenuIconProps> = ({
  size = 24,
  color = '#FFFFFF',
  accentColor = '#D4A359',
  fillColor = '#5B7065'
}) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* 스마트폰 본체 */}
    <rect x="7" y="3" width="18" height="26" rx="4" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    <path d="M13 6H19" stroke={color} strokeWidth="2" strokeLinecap="round" />
    {/* 스마트폰 화면 중앙의 하트 노드 */}
    <path
      d="M16 22L12.5 18.5C11.1 17.1 11.1 14.8 12.5 13.4C13.9 12 16 12 16 13.4C16 12 18.1 12 19.5 13.4C20.9 14.8 20.9 17.1 19.5 18.5L16 22Z"
      fill={fillColor}
      fillOpacity="0.45"
      stroke={accentColor}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// 4. 디지털 엔딩노트 (노트 & 열쇠 - Note & Key)
export const NoteKeyIcon: React.FC<MenuIconProps> = ({
  size = 24,
  color = '#FFFFFF',
  accentColor = '#D4A359',
  fillColor = '#5B7065'
}) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* 엔딩노트 바인딩 커버 */}
    <rect x="5" y="4" width="18" height="24" rx="3" fill={fillColor} fillOpacity="0.25" stroke={color} strokeWidth="2.2" />
    <path d="M9 9H17M9 14H14" stroke={color} strokeWidth="2" strokeLinecap="round" />
    {/* 보안 열쇠 및 열쇠구멍 자물쇠 */}
    <circle cx="21" cy="21" r="3.5" stroke={accentColor} strokeWidth="2" fill="#1A2B4C" />
    <path d="M23.5 23.5L27.5 27.5M26 26L28 24.5" stroke={accentColor} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// 5. 상중 · 행정 케어 (체크리스트 & 쉴드 - Checklist & Shield)
export const ChecklistShieldIcon: React.FC<MenuIconProps> = ({
  size = 24,
  color = '#FFFFFF',
  accentColor = '#D4A359',
  fillColor = '#5B7065'
}) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* 체크리스트 클립보드 */}
    <rect x="5" y="5" width="16" height="23" rx="3" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    <rect x="10" y="3" width="6" height="4" rx="1" fill={accentColor} stroke={color} strokeWidth="1.5" />
    {/* 체크 표시 */}
    <path d="M9 12L12 15L17 10" stroke={accentColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9 19H15" stroke={color} strokeWidth="2" strokeLinecap="round" />
    {/* 방패 뱃지 보호막 */}
    <path
      d="M18 16C18 16 21 14.8 24 16.5V21C24 24.5 21 27 21 27C21 27 18 24.5 18 21V16Z"
      fill={fillColor}
      fillOpacity="0.45"
      stroke={accentColor}
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
);
