import React from 'react';

interface EobomLogoProps {
  variant?: 'full' | 'symbol' | 'header' | 'footer';
  height?: number;
  showText?: boolean;
}

export const EobomLogo: React.FC<EobomLogoProps> = ({
  variant = 'header',
  height = 44,
  showText = true
}) => {
  const isDarkBg = variant === 'header' || variant === 'footer';

  const navyColor = isDarkBg ? '#FFFFFF' : '#1A2B4C';
  const greenColor = '#5B7065';
  const goldColor = '#D4A359';
  const subTextColor = isDarkBg ? '#D4A359' : '#5B7065';

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', userSelect: 'none' }}>
      {/* 공식 Design_Logo.png 기반 SVG 심볼마크 (무한대 + 악수하는 손 + 봄의 잎사귀) */}
      <svg
        width={height * 1.35}
        height={height}
        viewBox="0 0 160 110"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        <defs>
          {/* 네이비 그라데이션 */}
          <linearGradient id="navyLoopGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isDarkBg ? '#60A5FA' : '#1A2B4C'} />
            <stop offset="100%" stopColor={isDarkBg ? '#93C5FD' : '#283C66'} />
          </linearGradient>

          {/* 골드/그린 그라데이션 */}
          <linearGradient id="goldGreenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#5B7065" />
            <stop offset="50%" stopColor="#8A9A86" />
            <stop offset="100%" stopColor="#D4A359" />
          </linearGradient>

          {/* 잎사귀 그라데이션 */}
          <linearGradient id="leafGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#5B7065" />
            <stop offset="100%" stopColor="#D4A359" />
          </linearGradient>
        </defs>

        {/* 1. 무한대 좌측 루프 (네이비 팔/손) */}
        <path
          d="M 52 75 C 30 75 12 62 12 45 C 12 28 30 15 52 15 C 70 15 82 28 92 40 L 98 48 C 88 60 72 75 52 75 Z"
          fill="none"
          stroke="url(#navyLoopGrad)"
          strokeWidth="13"
          strokeLinecap="round"
        />

        {/* 2. 무한대 우측 루프 (웜골드/그린 팔/손) */}
        <path
          d="M 108 75 C 130 75 148 62 148 45 C 148 28 130 15 108 15 C 90 15 78 28 68 40 L 62 48 C 72 60 88 75 108 75 Z"
          fill="none"
          stroke="url(#goldGreenGrad)"
          strokeWidth="13"
          strokeLinecap="round"
        />

        {/* 3. 중앙 두 개의 악수하는 손 매듭 (Handshake junction) */}
        {/* 좌측 손목/소매 밴드 */}
        <rect x="58" y="38" width="8" height="14" rx="2" fill={navyColor} opacity="0.9" />
        {/* 우측 손목/소매 밴드 */}
        <rect x="94" y="38" width="8" height="14" rx="2" fill={goldColor} />

        {/* 맞잡은 손가락 마디 (Interlocked hands) */}
        <path
          d="M 66 45 C 72 40 76 40 80 45 C 84 50 88 50 94 45"
          fill="none"
          stroke={goldColor}
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M 68 49 C 74 44 78 44 82 49 C 86 53 90 53 94 49"
          fill="none"
          stroke={navyColor}
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {/* 4. 상단 봄의 잎사귀 (Sprouting Spring Leaf) */}
        {/* 주 잎사귀 */}
        <path
          d="M 80 32 C 72 18 80 4 94 2 C 94 16 88 28 80 32 Z"
          fill="url(#leafGrad)"
        />
        {/* 보조 잎사귀 */}
        <path
          d="M 76 34 C 66 26 70 12 82 10 C 82 22 78 30 76 34 Z"
          fill="#5B7065"
          opacity="0.85"
        />
        {/* 잎맥 줄기 */}
        <path
          d="M 80 32 C 84 20 89 10 93 4"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.7"
        />
      </svg>

      {/* 워드마크 텍스트 (KoPubWorld 명조 스타일) — className은 Header.tsx의 헤더 로고에서
          index.css가 480px 이하(기존 .header-logo-wrap scale(0.8) 재사용)에 숨기는 데 쓴다.
          280px처럼 아주 좁은 화면에서는 아이콘+워드마크(0.8배 축소해도 ~146px)만으로 로그인
          버튼과 합쳐 헤더 폭을 넘어섰다(2026-08-25 실측). */}
      {showText && (
        <div className="eobom-logo-text" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', lineHeight: 1 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
            <span
              style={{
                fontFamily: "'KoPub World Batang', 'KoPubWorld 명조', serif",
                fontSize: `${height * 0.52}px`,
                fontWeight: 700,
                color: navyColor,
                letterSpacing: '-0.03em',
                lineHeight: 1
              }}
            >
              이어봄
            </span>
            {variant !== 'full' && (
              <span
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: `${height * 0.32}px`,
                  fontWeight: 600,
                  color: subTextColor,
                  letterSpacing: '0.02em',
                  opacity: 0.9
                }}
              >
                Eobom
              </span>
            )}
          </div>
          {variant === 'full' && (
            <span
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: `${height * 0.24}px`,
                fontWeight: 600,
                color: subTextColor,
                letterSpacing: '0.05em',
                marginTop: '0.2rem'
              }}
            >
              wordmark Eobom
            </span>
          )}
        </div>
      )}
    </div>
  );
};
