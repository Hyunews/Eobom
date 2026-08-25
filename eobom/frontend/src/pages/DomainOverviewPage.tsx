import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, ChevronUp, ChevronDown } from 'lucide-react';
import { domainSlides } from '../components/home/domainSlides';
import { Footer } from '../components/Footer';
import type { NavMode } from '../modeNav';

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
  intro: string;
  mode: NavMode;
  keys: string[];
  currentUser?: string | null;
  onOpenLogin?: () => void;
  setActiveTab?: (tab: string) => void;
  onSetMode?: (mode: NavMode) => void;
}

export const DomainOverviewPage: React.FC<DomainOverviewPageProps> = ({
  title,
  intro,
  mode,
  keys,
  currentUser,
  onOpenLogin,
  setActiveTab,
  onSetMode,
}) => {
  // 00-26 §4.4 확정 — /prep·/bereaved로 직접 진입(URL 직입력·새로고침·북마크)해도 사이드바·
  // 모드 드롭다운이 해당 모드로 맞춰져야 한다. 기존엔 EntryBoxes.tsx 박스 클릭·HomePage 히어로
  // CTA를 거칠 때만 onSetMode가 불렸는데, 이 라우트로 바로 들어오면 그 클릭 자체가 없어 안
  // 불렸다 — 라우트 진입 시점에 직접 호출한다.
  useEffect(() => {
    onSetMode?.(mode);
  }, [mode, onSetMode]);

  const slides = keys.map((k) => domainSlides[k]);
  // 2026-08-25 재수정 — Footer를 App.tsx가 바깥(body)에 별도로 렌더링했더니, 이 페이지의
  // 안쪽 스냅 스크롤 컨테이너와 바깥 body 스크롤이 서로 다른 스크롤 위치를 갖는 두 개의
  // 독립된 스크롤 영역이 되어 "Footer가 다른 페이지 위에 떠 있는 것처럼 보이고, 맨 아래에서
  // 위로 스크롤하면 안쪽만 움직이고 Footer는 그대로 고정돼 보이는" 문제가 났다(개발자 지적).
  // 근본 해결은 스크롤 영역을 하나로 합치는 것 — Footer를 도메인 슬라이드와 똑같이 이
  // 컨테이너 안의 "마지막 섹션"으로 편입한다(App.tsx도 이 두 라우트에서는 바깥 Footer를
  // 안 그린다). totalSections = 도메인 개수 + Footer 1개.
  const totalSections = slides.length + 1;

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

    // 트랙패드는 살짝만 스쳐도 deltaY가 나와서 의도치 않게 한 섹션씩 넘어가곤 했다(2026-08-25
    // "스크롤 민감도" 지적) — 최소 이 정도는 굴려야 한 칸 넘어가도록 문턱값을 둔다. 일반
    // 마우스 휠 한 클릭(보통 deltaY 100 안팎)은 여유 있게 넘고, 트랙패드의 여운 스크롤(관성
    // 감속 구간의 작은 값들)만 걸러진다.
    const WHEEL_THRESHOLD = 24;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (isScrollingRef.current) return;
      if (Math.abs(e.deltaY) < WHEEL_THRESHOLD) return;

      const direction = e.deltaY > 0 ? 1 : -1;
      const nextIndex = activeIndexRef.current + direction;
      // Footer가 이제 이 컨테이너 안의 마지막 섹션이라(위 totalSections 참고), 맨 위·맨
      // 아래는 진짜 페이지 경계다 — 범위를 벗어나면 그냥 아무것도 안 하면 된다. 바깥에
      // 별도 스크롤 영역이 없으니 예전처럼 네이티브 스크롤로 넘겨줄 대상 자체가 없다.
      if (nextIndex < 0 || nextIndex >= totalSections) return;

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
  }, [totalSections]);

  const goTo = (index: number) => {
    const container = containerRef.current;
    if (container) {
      container.scrollTo({ top: index * container.clientHeight, behavior: 'smooth' });
    }
    activeIndexRef.current = index;
    setActiveIndex(index);
  };

  // 오버레이 시절엔 좌측 상단에 boxTitle 칩(그냥 "생전 준비" 같은 이름표)이 있었는데, 각
  // 도메인 슬라이드 안 배지와 중복된다는 지적(2026-08-25)으로 그건 뺐다. 지금 아래에 다시
  // 넣는 인트로 문구(EntryBoxes.tsx 박스 subtitle 재사용, 00-23 §8.6-1)는 이름표가 아니라
  // 실제 설명 문장이라 성격이 다르다 — position:absolute로 얹어서, .domain-overview-viewport의
  // 높이 계산(calc(100vh - header-h))에 레이아웃 공간을 뺏지 않는다.
  useEffect(() => {
    const prevTitle = document.title;
    document.title = `${title} | 이어봄`;
    return () => {
      document.title = prevTitle;
    };
  }, [title]);

  return (
    <div className="domain-overview-viewport">
        {/* 첫 도메인(activeIndex 0)에서만 보인다 — 페이지 진입 시점의 방향 안내용이라, 이후
            도메인을 넘기면서까지 화면 위에 계속 떠 있을 필요는 없다(화살표·점 인디케이터와
            달리 내비게이션 기능이 없는 순수 설명 문구라 오래 남으면 그냥 텍스트가 겹쳐 보임). */}
        {activeIndex === 0 && (
          <div className="domain-overview-intro">
            <h1 className="domain-overview-intro-title">{title}</h1>
            <p className="domain-overview-intro-text">{intro}</p>
          </div>
        )}

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
        {activeIndex < totalSections - 1 && (
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

          {/* 마지막 섹션 = Footer (위 totalSections 참고) — 도메인 슬라이드와 같은
              scroll-snap-align:start 대상이지만, 내용 자체가 세로 중앙 정렬을 요구하는
              카드형이 아니라 위에서부터 자연스럽게 흐르는 문서형이라 상단 정렬로 바꾸고,
              화면보다 길어질 수 있는 경우(모바일 3열→1열 접힘 등)를 위해 overflow-y:auto도
              같이 둔다(index.css `.domain-overview-footer-slide`). */}
          <section className="domain-overview-slide domain-overview-footer-slide">
            <Footer />
          </section>
        </div>
    </div>
  );
};
