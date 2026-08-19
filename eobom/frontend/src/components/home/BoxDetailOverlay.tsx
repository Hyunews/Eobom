import React, { useEffect, useRef, useState } from 'react';
import { X, ArrowRight } from 'lucide-react';
import { DomainSlide } from './domainSlides';

// 4박스 클릭 시 뜨는 박스별 미니 풀스크린 오버레이 — HomePage의 풀페이지 휠 스크롤과
// 같은 방식(휠 한 번 = 슬라이드 한 칸)을 이 오버레이 안에서 독립적으로 재현한다.
// X 또는 Esc로 닫으면 원래 4박스 화면으로 돌아간다(라우트 이동 없음).

interface BoxDetailOverlayProps {
  boxTitle: string;
  slides: DomainSlide[];
  initialIndex?: number;
  onClose: () => void;
  onSlideChange?: (index: number) => void;
  currentUser?: string | null;
  onOpenLogin?: () => void;
  setActiveTab?: (tab: string) => void;
}

export const BoxDetailOverlay: React.FC<BoxDetailOverlayProps> = ({
  boxTitle,
  slides,
  initialIndex = 0,
  onClose,
  onSlideChange,
  currentUser,
  onOpenLogin,
  setActiveTab,
}) => {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeIndexRef = useRef(initialIndex);
  const isScrollingRef = useRef(false);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.scrollTop = initialIndex * container.clientHeight;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      // 이 오버레이가 HomePage의 풀페이지 스크롤 컨테이너 안에 DOM상 중첩돼 있어, stopPropagation
      // 없이는 같은 휠 이벤트가 부모로 버블링돼 뒤에 가려진 배경(4박스 섹션)까지 같이 스크롤됐다.
      e.stopPropagation();
      if (isScrollingRef.current) return;

      const direction = e.deltaY > 0 ? 1 : -1;
      const nextIndex = activeIndexRef.current + direction;
      if (nextIndex < 0 || nextIndex >= slides.length) return;

      isScrollingRef.current = true;
      activeIndexRef.current = nextIndex;
      setActiveIndex(nextIndex);
      onSlideChange?.(nextIndex);
      container.scrollTo({ top: nextIndex * container.clientHeight, behavior: 'smooth' });

      window.setTimeout(() => {
        isScrollingRef.current = false;
      }, 700);
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides.length]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const goTo = (index: number) => {
    const container = containerRef.current;
    if (container) {
      container.scrollTo({ top: index * container.clientHeight, behavior: 'smooth' });
    }
    activeIndexRef.current = index;
    setActiveIndex(index);
    onSlideChange?.(index);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1500, backgroundColor: '#FBF9F5' }}>
      <div
        style={{
          position: 'fixed',
          top: '1.4rem',
          left: '1.6rem',
          zIndex: 1520,
          fontSize: '0.95rem',
          fontWeight: 700,
          color: '#1A2B4C',
          backgroundColor: '#FFFFFF',
          padding: '0.5rem 1rem',
          borderRadius: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}
      >
        {boxTitle}
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="닫기"
        style={{
          position: 'fixed',
          top: '1.2rem',
          right: '1.6rem',
          zIndex: 1520,
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          border: 'none',
          backgroundColor: '#FFFFFF',
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <X size={22} color="#1A2B4C" />
      </button>

      {slides.length > 1 && (
        <div
          style={{
            position: 'fixed',
            right: '2rem',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 1520,
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

      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          overflowY: 'scroll',
          scrollSnapType: 'y mandatory',
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch',
          backgroundColor: '#FBF9F5',
        }}
      >
        {slides.map((slide) => (
          <section
            key={slide.key}
            className="overlay-slide"
            style={{
              width: '100%',
              scrollSnapAlign: 'start',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.5rem 2.2rem',
              backgroundColor: '#FBF9F5',
              position: 'relative',
            }}
          >
            <div
              style={{
                maxWidth: '1100px',
                width: '100%',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '2.2rem',
                alignItems: 'start',
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
                    fontSize: 'clamp(1.6rem, 3.2vw, 2.3rem)',
                    fontWeight: 800,
                    color: '#1A2B4C',
                    fontFamily: "'KoPub World Batang', serif",
                    marginBottom: '1.1rem',
                    lineHeight: 1.25,
                  }}
                >
                  {slide.titleLine1}
                  <br />
                  <span style={{ color: slide.highlightColor }}>{slide.titleLine2}</span>
                </h2>
                <p style={{ fontSize: '1.05rem', color: '#6C7A89', lineHeight: 1.7, marginBottom: '1.4rem' }}>
                  {slide.description}
                </p>
                {slide.bullets.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.6rem' }}>
                    {slide.bullets.map((b) => (
                      <div key={b} style={{ fontSize: '1rem', color: '#1A2B4C', fontWeight: 700 }}>
                        • {b}
                      </div>
                    ))}
                  </div>
                )}

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
                        // 다른 화면으로 이동 — onClose()를 부르지 않는다. 뒤로가기로 돌아왔을 때
                        // 이 오버레이·슬라이드가 그대로 복원돼야 하므로(EntryBoxes.tsx의 URL
                        // 쿼리 동기화), 이동 직전 URL을 건드리지 않고 그대로 히스토리에 남긴다.
                        setActiveTab?.(slide.tab);
                      } else {
                        onClose();
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
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};
