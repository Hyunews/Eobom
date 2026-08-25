import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowRight, ChevronUp, ChevronDown } from 'lucide-react';
import { DomainSlide } from './domainSlides';

// 4박스 클릭 시 뜨는 박스별 미니 풀스크린 오버레이 — HomePage의 풀페이지 휠 스크롤과
// 같은 방식(휠 한 번 = 슬라이드 한 칸)을 이 오버레이 안에서 독립적으로 재현한다.
// X 또는 Esc로 닫으면 원래 4박스 화면으로 돌아간다(라우트 이동 없음).
// 2026-08-25 — 모바일(≤640px)은 HomePage와 달리 mandatory 스냅을 그대로 유지한다(개발자
// 지시: "우선 풀페이지 스크롤 형태 그대로"). 대신 슬라이드 하나가 고정 100dvh를 넘던 콘텐츠
// 오버플로우 문제만 index.css에서 슬라이드를 height:auto+min-height로 풀어 해결했다 — 그래서
// 슬라이드마다 높이가 달라질 수 있고, 아래 goTo·휠 핸들러의 `index * container.clientHeight`
// 계산은 그 경우 더 이상 정확하지 않다. 모바일에서는 화살표(.scroll-hint)와 점 인디케이터
// (.overlay-slide-dots)를 아예 숨겨(index.css) 이 계산식이 호출될 일 자체를 없앴다 — 터치
// 스와이프는 이 JS를 거치지 않고 네이티브 CSS scroll-snap으로만 동작하므로 영향이 없다.
// 모바일에서는 description만으로 충분하다는 개발자 판단으로 피처 카드(아이콘+타이틀+본문+
// bullets, 아래 .overlay-slide-feature-card)도 index.css에서 통째로 숨긴다 — 웹(≥641px)은
// 그대로 유지.
// 2026-08-25 — 실기기 모바일에서 헤더 아래로 boxTitle 칩·닫기 버튼의 잘린 조각이 삐져나와
// 보이는 버그 확인(스크린샷). 이 오버레이는 EntryBoxes → HomePage.tsx의 .home-scroll-container
// (overflow-y 스크롤 컨테이너) 안에 DOM으로 중첩돼 있는데, position:fixed 자식이 스크롤 컨테이너
// 조상 안에서 뷰포트가 아니라 그 조상 기준으로 갇히는 현상이 모바일 WebKit에서 알려져 있다
// (그 조상 CSS를 하나하나 다 맞춰서 고치는 대신) createPortal로 DOM 자체를 body 바로 아래로
// 옮겨서 어떤 조상의 overflow·position·stacking-context 설정과도 무관하게 만든다 — 모달/오버레이의
// 표준 해법이라 이후 조상 쪽 CSS가 또 바뀌어도 이 문제가 재발하지 않는다.

interface BoxDetailOverlayProps {
  slides: DomainSlide[];
  initialIndex?: number;
  onClose: () => void;
  onSlideChange?: (index: number) => void;
  currentUser?: string | null;
  onOpenLogin?: () => void;
  setActiveTab?: (tab: string) => void;
}

export const BoxDetailOverlay: React.FC<BoxDetailOverlayProps> = ({
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
      // createPortal로 body 직속이 된 뒤에도(위 파일 상단 주석 참고) 네이티브 이벤트는 실제 DOM
      // 트리를 기준으로 버블링하므로 이제 배경까지 새지는 않지만, preventDefault만으로는 막히지
      // 않는 환경을 위한 안전망으로 stopPropagation도 그대로 둔다.
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

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 1500, backgroundColor: '#FBF9F5' }}>
      {/* 2026-08-25 개발자 지시 — 좌측 boxTitle 칩(생전 준비/임종 및 사후 정리 등)은 각 슬라이드
          안 배지가 이미 같은 정보를 보여줘 중복이라 제거. 닫기 버튼만 남기되 원형 배경·그림자
          없이 아이콘만 노출한다(.scroll-hint와 같은 "배경 없는 아이콘" 톤). */}
      <button
        type="button"
        onClick={onClose}
        aria-label="닫기"
        style={{
          position: 'fixed',
          top: '1.2rem',
          right: '1.6rem',
          zIndex: 1520,
          background: 'none',
          border: 'none',
          padding: '0.4rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <X size={26} color="#1A2B4C" />
      </button>

      {/* 위/아래 슬라이드가 더 있음을 알리는 가벼운 힌트 — 원형 배경 없이 반투명 아이콘만
          (개발자 확정, 2026-08). 메인 홈(HomePage.tsx)과 같은 .scroll-hint 클래스를 공유한다.
          위/아래 각각 해당 방향에 슬라이드가 있을 때만 노출. */}
      {activeIndex > 0 && (
        <button
          type="button"
          onClick={() => goTo(activeIndex - 1)}
          className="scroll-hint scroll-hint--up"
          aria-label="이전 슬라이드"
          title="이전 슬라이드"
        >
          <ChevronUp size={34} />
        </button>
      )}
      {activeIndex < slides.length - 1 && (
        <button
          type="button"
          onClick={() => goTo(activeIndex + 1)}
          className="scroll-hint scroll-hint--down"
          aria-label="다음 슬라이드"
          title="다음 슬라이드"
        >
          <ChevronDown size={34} />
        </button>
      )}

      {slides.length > 1 && (
        <div
          className="overlay-slide-dots"
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
                className="overlay-slide-feature-card"
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
    </div>,
    document.body
  );
};
