import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, ChevronUp, ChevronDown } from 'lucide-react';
import { domainSlides } from '../components/home/domainSlides';

// 2026-08-25 개발자 지시("애초에 굳이 오버레이일 이유가 없음") — 박스①②(생전 준비/임종 및
// 사후 정리) 클릭 시 뜨던 풀스크린 오버레이(BoxDetailOverlay, 폐지)를 일반 페이지로 바꿨다.
// 헤더·사이드바·푸터 껍데기가 있는 진짜 라우트(/prep·/bereaved)라는 점만 오버레이와 다르고,
// "도메인 하나 = 화면 하나"로 넘어가는 풀페이지 스크롤과 모바일 피처 카드 숨김은 그대로
// 재지시(2026-08-25 재확인)를 받아 유지한다 — 오버레이 시절 index.css `.overlay-slide` 계열이
// 하던 일을 이 페이지 전용 `.domain-overview-*` 클래스로 옮겨왔다(HomePage의
// `.fullpage-viewport`/`.home-scroll-container`/`.fullpage-section`과는 별도 클래스 —
// HomePage는 00-23 §5.4-1로 640px 이하에서 스냅을 아예 껐지만, 이 페이지는 모바일에서도
// 스냅을 유지해야 해서 그 규칙을 공유하면 안 된다).
interface DomainOverviewPageProps {
  title: string;
  keys: string[];
  currentUser?: string | null;
  onOpenLogin?: () => void;
  setActiveTab?: (tab: string) => void;
}

export const DomainOverviewPage: React.FC<DomainOverviewPageProps> = ({
  title,
  keys,
  currentUser,
  onOpenLogin,
  setActiveTab,
}) => {
  const slides = keys.map((k) => domainSlides[k]);

  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeIndexRef = useRef(0);
  const isScrollingRef = useRef(false);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  // 마우스 휠 한 번 = 도메인 한 칸 (HomePage.tsx 풀페이지 휠 핸들러와 같은 방식).
  // 00-23 §5.4-1 대응으로 확인된 관례대로 등록 조건을 폭이 아니라
  // matchMedia('(pointer: coarse)')로 판정한다 — 터치 스와이프는 이 JS 없이 네이티브
  // scroll-snap으로 동작하므로 coarse 포인터에서는 등록하지 않는다.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const handleWheel = (e: WheelEvent) => {
      const direction = e.deltaY > 0 ? 1 : -1;
      const nextIndex = activeIndexRef.current + direction;
      // 마지막 도메인에서 아래로 더 굴리면 preventDefault를 걸지 않고 그대로 흘려보낸다 —
      // 이 페이지는(오버레이와 달리) 뒤에 Footer가 있는 진짜 페이지라, 여기서 무조건
      // preventDefault를 걸면 마우스 휠로는 Footer에 영원히 닿을 수 없었다(2026-08-25 지적
      // "footer가 어색함" — 사실은 도달 불가 버그). 범위를 벗어날 때만 네이티브 스크롤에
      // 맡겨 바깥 페이지(Footer 방향)로 자연스럽게 이어지게 한다.
      if (nextIndex < 0 || nextIndex >= slides.length) return;

      e.preventDefault();
      if (isScrollingRef.current) return;

      isScrollingRef.current = true;
      activeIndexRef.current = nextIndex;
      setActiveIndex(nextIndex);
      container.scrollTo({ top: nextIndex * container.clientHeight, behavior: 'smooth' });

      window.setTimeout(() => {
        isScrollingRef.current = false;
      }, 700);
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [slides.length]);

  const goTo = (index: number) => {
    const container = containerRef.current;
    if (container) {
      container.scrollTo({ top: index * container.clientHeight, behavior: 'smooth' });
    }
    activeIndexRef.current = index;
    setActiveIndex(index);
  };

  // 오버레이 시절엔 좌측 상단 boxTitle 칩(페이지 제목)이 있었는데, 각 도메인 슬라이드 안
  // 배지와 중복된다는 지적(2026-08-25)으로 화면에서는 뺐다 — 대신 탭 타이틀로만 남긴다.
  // 이 페이지가 풀페이지 스크롤 뷰포트라 화면에 h1을 넣으면 그만큼 뷰포트 높이 계산이
  // header-h만 빼면 안 되게 꼬인다는 것도 이유.
  useEffect(() => {
    const prevTitle = document.title;
    document.title = `${title} | 이어봄`;
    return () => {
      document.title = prevTitle;
    };
  }, [title]);

  return (
    <div className="domain-overview-viewport">
        {activeIndex > 0 && (
          <button
            type="button"
            onClick={() => goTo(activeIndex - 1)}
            className="scroll-hint scroll-hint--up scroll-hint--in-viewport"
            aria-label="이전 도메인으로"
            title="위로 스크롤"
          >
            <ChevronUp size={34} />
          </button>
        )}
        {activeIndex < slides.length - 1 && (
          <button
            type="button"
            onClick={() => goTo(activeIndex + 1)}
            className="scroll-hint scroll-hint--down scroll-hint--in-viewport"
            aria-label="다음 도메인으로"
            title="아래로 스크롤"
          >
            <ChevronDown size={34} />
          </button>
        )}

        {slides.length > 1 && (
          <div
            className="domain-overview-dots"
            style={{
              position: 'absolute',
              right: '0.5rem',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              backgroundColor: 'rgba(26, 43, 76, 0.75)',
              backdropFilter: 'blur(8px)',
              padding: '0.8rem 0.6rem',
              borderRadius: '30px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            }}
          >
            {slides.map((slide, idx) => (
              <button
                key={slide.key}
                onClick={() => goTo(idx)}
                title={slide.badgeLabel}
                style={{
                  width: activeIndex === idx ? '14px' : '10px',
                  height: activeIndex === idx ? '14px' : '10px',
                  borderRadius: '50%',
                  backgroundColor: activeIndex === idx ? '#D4A359' : 'rgba(255, 255, 255, 0.4)',
                  border: activeIndex === idx ? '2px solid #FFFFFF' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  padding: 0,
                }}
              />
            ))}
          </div>
        )}

        <div ref={containerRef} className="domain-overview-scroll">
          {slides.map((slide) => (
            <section key={slide.key} className="domain-overview-slide">
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
                  className="domain-overview-feature-card"
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
