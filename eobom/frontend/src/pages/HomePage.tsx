import React, { useState, useRef, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { Footer } from '../components/Footer';
import { EntryBoxes } from '../components/home/EntryBoxes';
import type { NavMode } from '../modeNav';

interface HomePageProps {
  currentUser?: string | null;
  onOpenLogin?: () => void;
  setActiveTab?: (tab: string) => void;
  onSetMode?: (mode: NavMode) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ currentUser, onOpenLogin, setActiveTab, onSetMode }) => {
  const [activeSection, setActiveSection] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeSectionRef = useRef(0);
  const isWheelScrollingRef = useRef(false);

  const sections = [
    { id: 'hero', title: '이어봄 브랜드', icon: Sparkles },
    { id: 'entry-boxes', title: '어떤 도움이 필요하신가요', icon: Sparkles },
    { id: 'footer', title: '플랫폼 하단 정보', icon: Sparkles },
  ];

  // 스크롤 감지 및 이전 홈 스크롤 위치 저장 / 마운트 시 복원
  // ⚠️ 저장·복원 단위를 "섹션 인덱스"로 통일한다(휠 핸들러·인디케이터·scrollToSection과 동일 기준).
  // 예전에는 픽셀 scrollTop을 저장해뒀다가 복원 시 clientHeight로 나눠 섹션 번호를 역산했는데,
  // 저장 시점과 복원 시점 사이에 뷰포트 높이가 조금만 달라져도(주소창 높이 변화 등) 나눗셈이
  // 옆 섹션으로 반올림되는 문제가 있었다(뒤로가기 시 엉뚱한 섹션에 도착하는 버그의 원인).
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 새로고침(F5)이면 이전 스크롤 기억을 무시하고 항상 맨 위(히어로)에서 시작한다.
    // Navigation Timing API의 type은 "문서가 실제로 다시 로드됐는지"만 반영하고 SPA 내부 이동
    // (뒤로가기 등 client-side 라우팅)에는 바뀌지 않으므로, 이 둘을 구분하는 데 쓸 수 있다.
    const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    if (navEntry?.type === 'reload') {
      sessionStorage.removeItem('eobom_scroll_home');
    }

    // 마운트 시 이전에 보던 섹션이 저장돼 있으면 그 섹션으로 즉시 복원
    // (메뉴 직접 클릭 시에는 eobom_scroll_home이 삭제되어 0 최상단으로 오픈)
    const saved = sessionStorage.getItem('eobom_scroll_home');
    const savedIndex = saved !== null ? Number(saved) : NaN;
    const initialIndex = !isNaN(savedIndex) ? Math.min(sections.length - 1, Math.max(0, savedIndex)) : 0;
    container.scrollTop = initialIndex * container.clientHeight;
    setActiveSection(initialIndex);

    const handleScroll = () => {
      const sectionHeight = container.clientHeight;
      if (sectionHeight > 0) {
        const index = Math.round(container.scrollTop / sectionHeight);
        const clamped = Math.min(sections.length - 1, Math.max(0, index));
        setActiveSection(clamped);
        // 현재 보던 섹션 인덱스를 세션에 기록 (이탈 후 되돌아올 때 복원용 — 픽셀이 아니라 인덱스)
        sessionStorage.setItem('eobom_scroll_home', String(clamped));
      }
    };

    // 이미 홈에 있는 상태에서 "홈으로"(로고 클릭 등)를 다시 누르면 App.tsx의 setActiveTab이
    // navigate('/')를 호출해도 경로가 안 바뀌어 이 컴포넌트가 리마운트되지 않는다 — 그래서
    // App.tsx가 쏘는 커스텀 이벤트를 직접 듣고 맨 위로 스크롤한다(마운트 여부와 무관하게 동작).
    const handleGoTop = () => {
      container.scrollTop = 0;
      setActiveSection(0);
      sessionStorage.removeItem('eobom_scroll_home');
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('eobom:home-scroll-top', handleGoTop);
    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('eobom:home-scroll-top', handleGoTop);
    };
  }, [sections.length]);

  // activeSection의 최신값을 휠 이벤트 핸들러(마운트 시 1회만 등록)에서 항상 최신으로 읽기 위한 ref 동기화
  useEffect(() => {
    activeSectionRef.current = activeSection;
  }, [activeSection]);

  // 마우스 휠 한 번 = 섹션 한 칸 이동 (네이티브 scroll-snap은 여러 번 굴려야 겨우 스냅되는 둔감한 반응이라, 휠 델타를 직접 가로채서 즉시 다음/이전 섹션으로 이동시킴)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (isWheelScrollingRef.current) return;

      const direction = e.deltaY > 0 ? 1 : -1;
      const nextIndex = activeSectionRef.current + direction;
      if (nextIndex < 0 || nextIndex >= sections.length) return;

      isWheelScrollingRef.current = true;
      activeSectionRef.current = nextIndex;
      setActiveSection(nextIndex);
      container.scrollTo({ top: nextIndex * container.clientHeight, behavior: 'smooth' });

      // 트랙패드는 한 번의 스와이프에도 휠 이벤트가 연속으로 여러 번 발생하므로,
      // 전환 애니메이션이 끝날 때까지 잠깐 잠가서 한 제스처에 섹션이 여러 칸 튀는 것을 방지
      window.setTimeout(() => {
        isWheelScrollingRef.current = false;
      }, 700);
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [sections.length]);

  const scrollToSection = (index: number) => {
    const container = containerRef.current;
    if (container) {
      container.scrollTo({
        top: index * container.clientHeight,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="fullpage-viewport" style={{ position: 'relative', width: '100%', overflow: 'hidden', backgroundColor: '#FBF9F5' }}>
      {/* 우측 풀페이지 스크롤 네비게이션 인디케이터 (3개 섹션 점) */}
      <div
        style={{
          position: 'fixed',
          right: '2rem',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 800,
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          backgroundColor: 'rgba(26, 43, 76, 0.75)',
          backdropFilter: 'blur(8px)',
          padding: '0.8rem 0.6rem',
          borderRadius: '30px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
        }}
      >
        {sections.map((sec, idx) => (
          <button
            key={sec.id}
            onClick={() => scrollToSection(idx)}
            style={{
              width: activeSection === idx ? '14px' : '10px',
              height: activeSection === idx ? '14px' : '10px',
              borderRadius: '50%',
              backgroundColor: activeSection === idx ? '#D4A359' : 'rgba(255, 255, 255, 0.4)',
              border: activeSection === idx ? '2px solid #FFFFFF' : 'none',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              padding: 0
            }}
            title={`${sec.title} (섹션 ${idx + 1})`}
          />
        ))}
      </div>

      {/* 풀페이지 스냅 스크롤 컨테이너 (전체 베이지 배경) */}
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          overflowY: 'scroll',
          scrollSnapType: 'y mandatory',
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch',
          backgroundColor: '#FBF9F5'
        }}
      >
        {/* ========================================================= */}
        {/* [섹션 0] 메인 히어로 (따뜻한 베이지 배경 #FBF9F5) */}
        {/* ========================================================= */}
        <section
          className="fullpage-section"
          style={{
            width: '100%',
            scrollSnapAlign: 'start',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem 2.2rem',
            backgroundColor: '#FBF9F5',
            position: 'relative'
          }}
        >
          <div
            style={{
              maxWidth: '1100px',
              width: '100%',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
              gap: '2.2rem',
              alignItems: 'start'
            }}
          >
            {/* 좌측 메인 텍스트 & 헤드라인 */}
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #DFDCD7',
                  padding: '0.45rem 1rem',
                  borderRadius: '20px',
                  fontSize: '0.88rem',
                  color: 'var(--point-color)',
                  fontWeight: 700,
                  marginBottom: '1.3rem',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
                }}
              >
                <Sparkles size={16} color="var(--point-color)" /> 이어봄 (Eobom) 디지털 엔딩 &amp; 웰다잉 토탈 케어
              </div>

              <h1
                style={{
                  fontSize: 'clamp(2.2rem, 3.5vw, 3.2rem)',
                  fontWeight: 800,
                  color: '#1A2B4C',
                  lineHeight: 1.25,
                  fontFamily: "'KoPub World Batang', 'KoPubWorld 명조', serif",
                  marginBottom: '1.1rem',
                  letterSpacing: '-0.02em'
                }}
              >
                당신과 사랑하는 가족의<br />
                <span style={{ color: '#5B7065' }}>존엄하고 따뜻한 봄날</span>을 함께 이어갑니다
              </h1>

              <p style={{ fontSize: '1.1rem', color: '#6C7A89', lineHeight: 1.7, margin: 0 }}>
                <strong style={{ color: '#1A2B4C', fontWeight: 700 }}>이어봄 서비스</strong>는 엔딩노트·상속 준비부터 장례·묘지 매칭, 디지털 유품 정리와 행정 원스톱 가이드까지 단일 플랫폼에서 완결합니다.
              </p>
            </div>

            {/* 우측 고화질 서정적 아카이브 비주얼 카드 */}
            <div style={{ width: '100%', height: 'calc(100vh - 320px)', maxHeight: '400px', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
              <img
                src="/calm_boat.png"
                alt="존엄한 마무리를 상징하는 평온한 나룻배"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* [섹션 1] 진입 4박스 — 00-23 §8. 새 화면 ID 아님(SCR-001 내부 블록) */}
        {/* ========================================================= */}
        <section
          className="fullpage-section"
          style={{
            width: '100%',
            scrollSnapAlign: 'start',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '1.5rem 2.2rem',
            backgroundColor: '#FBF9F5',
            position: 'relative',
            overflowY: 'auto'
          }}
        >
          <EntryBoxes currentUser={currentUser} onOpenLogin={onOpenLogin} setActiveTab={setActiveTab} onSetMode={onSetMode} />
        </section>

        {/* ========================================================= */}
        {/* [섹션 2] 에필로그 & 푸터 (다른 섹션과 같은 베이지 톤, Footer Snap Section) */}
        {/* ========================================================= */}
        <section
          className="fullpage-section"
          style={{
            width: '100%',
            scrollSnapAlign: 'start',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#FBF9F5',
            position: 'relative',
            overflowY: 'auto'
          }}
        >
          {/* 클로징 메시지 — 남는 세로 공간을 채우도록 가운데 정렬 (빈 공간이 아닌 실 콘텐츠로 확장) */}
          <div
            style={{
              flex: '1 1 auto',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
              padding: '2.5rem 1.5rem',
              gap: '1.3rem'
            }}
          >
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', backgroundColor: '#FEF3C7', color: 'var(--accent-gold)', padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 700 }}>
              <Sparkles size={15} color="var(--accent-gold)" /> 이어봄과 함께하는 존엄하고 따뜻한 준비
            </div>
            <h2
              style={{
                fontSize: 'clamp(1.8rem, 3vw, 2.6rem)',
                color: '#1A2B4C',
                fontWeight: 800,
                margin: 0,
                lineHeight: 1.35,
                fontFamily: "'KoPub World Batang', serif"
              }}
            >
              당신과 사랑하는 가족의<br />
              삶의 모든 <span style={{ color: '#5B7065' }}>봄날</span>을 응원합니다
            </h2>
            <p style={{ fontSize: '1.05rem', color: '#6C7A89', lineHeight: 1.7, maxWidth: '560px', margin: 0 }}>
              엔딩노트 작성부터 전국 장사시설 탐색까지, 이어봄이 곁에서 함께합니다.
            </p>
          </div>

          {/* 하단 푸터 — 별도 카드로 띄우지 않고 같은 다크 톤에 자연스럽게 이어붙임 */}
          <Footer />
        </section>
      </div>
    </div>
  );
};
