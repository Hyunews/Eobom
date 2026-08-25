import React from 'react';
import { ArrowRight } from 'lucide-react';
import { domainSlides } from '../components/home/domainSlides';

// 2026-08-25 개발자 지시("애초에 굳이 오버레이일 이유가 없음") — 박스①②(생전 준비/임종 및
// 사후 정리) 클릭 시 뜨던 풀스크린 오버레이(BoxDetailOverlay, 폐지)를 일반 페이지로 바꾼다.
// 데스크톱·모바일 구분 없이 같은 레이아웃 — 오버레이 시절엔 "슬라이드 하나 = 화면 하나"를
// 지키려고 고정/최소 높이·scroll-snap·wheel 핸들러·index 기반 페이징이 다 필요했는데, 그냥
// 세로로 흘러가는 일반 페이지가 되면서 그 장치들이 전부 불필요해졌다 — 문서 순서대로 하나씩
// 읽고 내려가면 그만이다. 모바일에서만 피처 카드(아이콘+타이틀+본문+bullets)를 숨겼던 것도
// 고정 높이 오버레이라 생긴 제약이었을 뿐이라, 일반 페이지에서는 웹·모바일 모두 그대로 보여준다.
interface DomainOverviewPageProps {
  title: string;
  intro: string;
  keys: string[];
  currentUser?: string | null;
  onOpenLogin?: () => void;
  setActiveTab?: (tab: string) => void;
}

export const DomainOverviewPage: React.FC<DomainOverviewPageProps> = ({
  title,
  intro,
  keys,
  currentUser,
  onOpenLogin,
  setActiveTab,
}) => {
  const slides = keys.map((k) => domainSlides[k]);

  return (
    <div className="container">
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 className="page-title" style={{ color: 'var(--primary-color)', margin: 0 }}>
          {title}
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '1.05rem' }}>{intro}</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {slides.map((slide, idx) => (
          <section
            key={slide.key}
            style={{
              width: '100%',
              padding: idx === 0 ? '0 0 3rem' : '3rem 0',
              borderTop: idx === 0 ? 'none' : '1px solid var(--border-color)',
            }}
          >
            <div
              style={{
                maxWidth: '1100px',
                width: '100%',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))',
                gap: '2.2rem',
                alignItems: 'stretch',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    backgroundColor: slide.badgeBg,
                    padding: '0.4rem 1rem',
                    borderRadius: '20px',
                    fontSize: '0.85rem',
                    color: slide.badgeColor,
                    fontWeight: 800,
                    marginBottom: '1.2rem',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  }}
                >
                  {slide.badgeIcon} {slide.badgeLabel}
                </div>
                {slide.note && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--point-color)', fontWeight: 700, marginBottom: '0.6rem' }}>
                    {slide.note}
                  </div>
                )}
                <h2
                  style={{
                    fontSize: 'clamp(1.5rem, 3.2vw, 2.1rem)',
                    fontWeight: 800,
                    color: '#1A2B4C',
                    fontFamily: "'KoPub World Batang', serif",
                    marginBottom: '1.1rem',
                    lineHeight: 1.3,
                  }}
                >
                  {slide.titleLine1}
                  <br />
                  <span style={{ color: slide.highlightColor }}>{slide.titleLine2}</span>
                </h2>
                <p style={{ fontSize: '1.05rem', color: '#6C7A89', lineHeight: 1.7, marginBottom: '1.4rem' }}>
                  {slide.description}
                </p>

                {slide.status === 'comingSoon' ? (
                  <span
                    style={{
                      display: 'inline-block',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: '#94A3B8',
                      backgroundColor: '#F1F5F9',
                      padding: '0.6rem 1.2rem',
                      borderRadius: '10px',
                    }}
                  >
                    준비 중인 서비스입니다.
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (slide.loginRequired && !currentUser) {
                        onOpenLogin?.();
                        return;
                      }
                      if (slide.tab) {
                        setActiveTab?.(slide.tab);
                      }
                    }}
                    className="btn btn-primary"
                    style={{
                      backgroundColor: slide.ctaColor,
                      padding: '1rem 2.2rem',
                      fontSize: '1.05rem',
                      borderRadius: '16px',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                    }}
                  >
                    {slide.ctaLabel} <ArrowRight size={18} />
                  </button>
                )}
              </div>

              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  padding: '1.75rem',
                  borderRadius: '24px',
                  boxShadow: '0 12px 35px rgba(26,43,76,0.08)',
                  border: `2px solid ${slide.featureBorderColor}`,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  minHeight: '280px',
                  height: '100%',
                }}
              >
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    backgroundColor: slide.featureIconBg,
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1.1rem',
                  }}
                >
                  {slide.featureIcon}
                </div>
                <h3 style={{ fontSize: '1.3rem', color: '#1A2B4C', fontWeight: 800, marginBottom: '0.8rem' }}>
                  {slide.featureTitle}
                </h3>
                <p style={{ color: '#6C7A89', fontSize: '0.95rem', lineHeight: 1.7, margin: 0 }}>{slide.featureDesc}</p>

                {slide.bullets.length > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.7rem',
                      marginTop: '1.3rem',
                      paddingTop: '1.2rem',
                      borderTop: `1px solid ${slide.featureIconBg}`,
                    }}
                  >
                    {slide.bullets.map((b) => (
                      <div key={b} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.92rem', color: '#1A2B4C', fontWeight: 600, lineHeight: 1.5 }}>
                        <span style={{ color: slide.featureBorderColor, fontWeight: 800, flexShrink: 0 }}>•</span>
                        {b}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};
