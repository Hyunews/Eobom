import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Sparkles, ChevronUp, ChevronDown } from 'lucide-react';
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
  // 00-23 §5.4-1: 640px 이하는 스크롤 주체가 container가 아니라 body다(index.css 참고) —
  // 인덱스 기반 스크롤 함수들이 그 폭에서는 이 배열(섹션 0/1/2의 실제 DOM 엘리먼트)을 기준으로
  // window.scrollTo를 쓴다. 3개 고정이라 배열 크기를 sections.length에 동적으로 맞추지 않는다.
  const sectionElsRef = useRef<(HTMLElement | null)[]>([null, null, null]);

  const isMobileLayout = () => window.matchMedia('(max-width: 640px)').matches;

  const getHeaderOffset = () => {
    const raw = getComputedStyle(document.documentElement).getPropertyValue('--header-h');
    return parseFloat(raw) || 0;
  };

  const scrollNativeToIndex = (index: number, behavior: ScrollBehavior) => {
    const el = sectionElsRef.current[index];
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - getHeaderOffset();
    window.scrollTo({ top, behavior });
  };

  // 히어로 CTA 2개 — copy.md ①Hero. EntryBoxes.tsx가 같은 ?entry=box1/box2 URL 쿼리를
  // 읽어 박스별 풀스크린 오버레이(BoxDetailOverlay, position:fixed 전체화면)를 여는 방식을
  // 그대로 재사용한다 — 여기서 쿼리만 세팅해도 스크롤 위치와 무관하게 오버레이가 뜬다.
  const [, setHeroSearchParams] = useSearchParams();
  const handleHeroPrimaryCTA = () => {
    onSetMode?.('bereaved');
    setHeroSearchParams({ entry: 'box2' });
  };
  const handleHeroSecondaryCTA = () => {
    onSetMode?.('prep');
    setHeroSearchParams({ entry: 'box1' });
  };

  const sections = [
    { id: 'hero', title: '이어봄 브랜드', icon: Sparkles },
    { id: 'entry-boxes', title: '어떤 도움이 필요하신가요', icon: Sparkles },
    { id: 'footer', title: '플랫폼 하단 정보', icon: Sparkles },
  ];

  // 2026-08-24 — 섹션 1(어떤 도움이 필요하신가요)로 즉시 스크롤. sessionStorage(eobom_scroll_home)를
  // 마운트 이펙트가 읽어서 복원하는 기존 경로가 다른 라우트(/ending-note 등)에서 막 넘어왔을 때
  // 간헐적으로 안 먹는 게 실측으로 확인됐다(원인 미확정 — rAF 중첩·ResizeObserver로도 재현됨).
  // containerRef를 직접 건드리는 이 함수를 EntryBoxes.tsx에 prop으로 내려서, 마운트 타이밍이나
  // sessionStorage 타이밍과 무관하게 "박스③(?entry=box3) 처리 이펙트가 실제로 실행되는 그 순간"에
  // 바로 스크롤시킨다 — 그 이펙트 실행 자체는 URL이 box3→빈 값으로 바뀌는 걸로 이미 확인됨.
  const scrollToEntrySection = React.useCallback(() => {
    const index = 1;
    if (isMobileLayout()) {
      scrollNativeToIndex(index, 'auto');
    } else {
      const container = containerRef.current;
      if (!container) return;
      container.scrollTop = index * container.clientHeight;
    }
    setActiveSection(index);
    sessionStorage.setItem('eobom_scroll_home', String(index));
  }, []);

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
    // 마운트 직후(특히 다른 라우트에서 막 이동해 온 시점)엔 컨테이너가 아직 레이아웃을 안 끝내
    // clientHeight가 0으로 읽힐 수 있다 — initialIndex가 0이면 0*0=0이라 눈에 안 띄지만,
    // 1 이상으로 복원할 때(헤더 메뉴로 바로 진입 등)는 엉뚱하게 맨 위에 멈추는 원인이 된다.
    // 2026-08-24: rAF 1번, 중첩 2번 다 시도했는데도 재현됨 — "몇 프레임 뒤면 끝나 있겠지"는
    // 추측일 뿐이고 실제로 레이아웃이 언제 끝나는지는 페이지 무게(배경 이미지 등)에 따라
    // 달라진다. 추측을 버리고 ResizeObserver로 컨테이너가 실제 높이를 갖게 되는 순간을 직접
    // 관찰해서 그때 스크롤을 적용한다 — 이미 높이가 잡혀 있으면(같은 홈 안에서의 재계산 등)
    // 그 자리에서 바로 적용하고 옵저버는 아예 만들지 않는다.
    // 00-23 §5.4-1: 640px 이하는 container가 아니라 body가 스크롤 주체다(index.css의
    // .home-scroll-container overflow 해제 참고) — container.scrollTop 대입은 그 폭에서
    // 아무 효과가 없으므로 window.scrollTo로 갈라 태운다.
    const applyInitialScroll = () => {
      if (isMobileLayout()) {
        scrollNativeToIndex(initialIndex, 'auto');
      } else {
        container.scrollTop = initialIndex * container.clientHeight;
      }
      setActiveSection(initialIndex);
    };

    let resizeObserver: ResizeObserver | null = null;
    if (container.clientHeight > 0) {
      applyInitialScroll();
    } else {
      resizeObserver = new ResizeObserver(() => {
        if (container.clientHeight > 0) {
          applyInitialScroll();
          resizeObserver?.disconnect();
        }
      });
      resizeObserver.observe(container);
    }

    // ≥641px 전용 — container.scrollTop 기준. 640px 이하에서는 container가 실제로 스크롤되지
    // 않아(overflow 해제) scrollTop이 항상 0이라, 여기서 계산하면 activeSection이 매번 0으로
    // 잘못 리셋된다 — 그래서 isMobileLayout이면 아무것도 하지 않고 아래 handleWindowScroll에
    // 맡긴다.
    const handleScroll = () => {
      if (isMobileLayout()) return;
      const sectionHeight = container.clientHeight;
      if (sectionHeight > 0) {
        const index = Math.round(container.scrollTop / sectionHeight);
        const clamped = Math.min(sections.length - 1, Math.max(0, index));
        setActiveSection(clamped);
        // 현재 보던 섹션 인덱스를 세션에 기록 (이탈 후 되돌아올 때 복원용 — 픽셀이 아니라 인덱스)
        sessionStorage.setItem('eobom_scroll_home', String(clamped));
      }
    };

    // 640px 이하 전용 — window.scrollY 기준으로 각 섹션의 문서상 top과 비교해 현재 섹션을
    // 판정한다. 실제로 값이 바뀔 때만 setState해 스크롤 중 불필요한 리렌더를 피한다.
    const handleWindowScroll = () => {
      if (!isMobileLayout()) return;
      const offset = getHeaderOffset();
      const scrollPos = window.scrollY + offset + 1;
      let idx = 0;
      for (let i = 0; i < sectionElsRef.current.length; i++) {
        const el = sectionElsRef.current[i];
        if (!el) continue;
        const top = el.getBoundingClientRect().top + window.scrollY;
        if (scrollPos >= top) idx = i;
      }
      if (idx !== activeSectionRef.current) {
        activeSectionRef.current = idx;
        setActiveSection(idx);
        sessionStorage.setItem('eobom_scroll_home', String(idx));
      }
    };

    // 이미 홈에 있는 상태에서 "홈으로"(로고 클릭 등)를 다시 누르면 App.tsx의 setActiveTab이
    // navigate('/')를 호출해도 경로가 안 바뀌어 이 컴포넌트가 리마운트되지 않는다 — 그래서
    // App.tsx가 쏘는 커스텀 이벤트를 직접 듣고 맨 위로 스크롤한다(마운트 여부와 무관하게 동작).
    const handleGoTop = () => {
      if (isMobileLayout()) {
        window.scrollTo({ top: 0, behavior: 'auto' });
      } else {
        container.scrollTop = 0;
      }
      setActiveSection(0);
      sessionStorage.removeItem('eobom_scroll_home');
    };

    // Header.tsx의 헤더 메뉴("생전 준비"·"임종·사후 정리"·"추모관")가 이미 홈에 있는 상태에서
    // 눌렸을 때 쏘는 이벤트 — handleGoTop과 같은 이유로 라우트가 안 바뀌어 마운트 로직이
    // 재실행되지 않으므로, 커스텀 이벤트로 직접 섹션 1(어떤 도움이 필요하신가요)로 스크롤한다.
    const handleGoToEntry = () => {
      const index = 1;
      if (isMobileLayout()) {
        scrollNativeToIndex(index, 'auto');
      } else {
        container.scrollTop = index * container.clientHeight;
      }
      setActiveSection(index);
      sessionStorage.setItem('eobom_scroll_home', String(index));
    };

    // 🟡 폭이 640px 경계를 넘나드는 리사이즈(브라우저 창 조정)·기기 회전 시 activeSection이
    // 직전 스크롤 주체(container 또는 window) 기준값에 멈춰 있을 수 있어 재동기화한다 —
    // 두 핸들러 다 자기 폭이 아니면 즉시 return하므로 그냥 둘 다 불러도 안전하다.
    const handleResync = () => {
      handleScroll();
      handleWindowScroll();
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('scroll', handleWindowScroll, { passive: true });
    window.addEventListener('resize', handleResync);
    window.addEventListener('orientationchange', handleResync);
    window.addEventListener('eobom:home-scroll-top', handleGoTop);
    window.addEventListener('eobom:home-scroll-to-entry', handleGoToEntry);
    return () => {
      resizeObserver?.disconnect();
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('scroll', handleWindowScroll);
      window.removeEventListener('resize', handleResync);
      window.removeEventListener('orientationchange', handleResync);
      window.removeEventListener('eobom:home-scroll-top', handleGoTop);
      window.removeEventListener('eobom:home-scroll-to-entry', handleGoToEntry);
    };
  }, [sections.length]);

  // activeSection의 최신값을 휠 이벤트 핸들러(마운트 시 1회만 등록)에서 항상 최신으로 읽기 위한 ref 동기화
  useEffect(() => {
    activeSectionRef.current = activeSection;
  }, [activeSection]);

  // 마우스 휠 한 번 = 섹션 한 칸 이동 (네이티브 scroll-snap은 여러 번 굴려야 겨우 스냅되는 둔감한 반응이라, 휠 델타를 직접 가로채서 즉시 다음/이전 섹션으로 이동시킴)
  // 00-23 §5.4-1: 640px 이하는 스냅 자체가 없는 네이티브 스크롤이라 이 핸들러를 등록하지
  // 않는다 — 폭이 아니라 matchMedia('(pointer: coarse)')로 판정한다(터치 입력 자체가 이미
  // 스와이프로 섹션을 넘기므로, 좁은 창을 쓰는 데스크톱 마우스는 그대로 휠 점프를 유지하고
  // 넓은 화면의 터치스크린은 제외하기 위함).
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;

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
      {/* 우측 풀페이지 스크롤 네비게이션 인디케이터 (3개 섹션 점) — 640px 이하는
          index.css에서 숨긴다(좁은 화면에서 카드 위에 겹쳐 보여 콘텐츠를 가린다는
          지적, 2026-08-25). */}
      <div
        className="home-section-dots"
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

      {/* 위/아래 더 있음 힌트 — 우측 점 인디케이터만으로는 "더 스크롤할 게 있다"는 게 잘 안
          보인다는 피드백(2026-08)으로 추가. 박스 상세 오버레이(BoxDetailOverlay.tsx)의 반투명
          아이콘형 힌트와 같은 스타일(.scroll-hint)로 통일했다 — 원형 배경 없음. 첫/마지막
          섹션에서는 해당 방향 화살표를 숨긴다. */}
      {activeSection > 0 && (
        <button
          onClick={() => scrollToSection(activeSection - 1)}
          className="scroll-hint scroll-hint--up scroll-hint--in-viewport"
          aria-label="이전 섹션으로 스크롤"
          title="위로 스크롤"
        >
          <ChevronUp size={34} />
        </button>
      )}
      {activeSection < sections.length - 1 && (
        <button
          onClick={() => scrollToSection(activeSection + 1)}
          className="scroll-hint scroll-hint--down scroll-hint--in-viewport"
          aria-label="다음 섹션으로 스크롤"
          title="아래로 스크롤"
        >
          <ChevronDown size={34} />
        </button>
      )}

      {/* 풀페이지 스냅 스크롤 컨테이너 (전체 베이지 배경). ≥641px은 mandatory 스냅 그대로 유지.
          00-23 §5.4-1: 640px 이하는 mandatory 스냅과 모바일 가변 높이 섹션이 서로를 부정해
          바운스백이 났다(예전에 mandatory→proximity로 완화만 해봤다가 섹션0↔1 스냅감까지
          느슨해져 되돌린 적 있음) — 부분 완화가 아니라 스냅 자체를 index.css에서 끈다
          (scrollSnapType은 인라인으로 남겨 ≥641px 기본값 역할만 하고, ≤640px 무효화는
          index.css `.home-scroll-container`가 !important로 담당). */}
      <div
        ref={containerRef}
        className="home-scroll-container"
        style={{
          width: '100%',
          height: '100%',
          overflowY: 'scroll',
          scrollSnapType: 'y mandatory',
          // scrollBehavior는 컨테이너 레벨(CSS)로 항상 걸어두지 않는다 — 휠 핸들러·점 인디케이터는
          // 이미 scrollTo({behavior:'smooth'})로 필요할 때만 명시적으로 애니메이션을 요청한다.
          // 여기 걸어두면 마운트 복원/handleGoTop/handleGoToEntry의 "즉시 점프"용 scrollTop 대입까지
          // 전부 애니메이션돼, 그 사이 발생하는 scroll 이벤트가 목표 인덱스보다 낮은 중간값으로
          // activeSection·세션 저장값을 덮어써 버리는 실제 버그가 있었다(2026-08 A안 헤더 메뉴
          // 작업 중 발견 — 다른 페이지에서 헤더 메뉴로 홈 섹션1까지 스크롤이 중간에 멈추는 현상).
          WebkitOverflowScrolling: 'touch',
          backgroundColor: '#FBF9F5'
        }}
      >
        {/* ========================================================= */}
        {/* [섹션 0] 메인 히어로 — copy.md ①Hero 개정 권고안 + will.png 배경 (2026-08-24) */}
        {/* ========================================================= */}
        <section
          ref={(el) => { sectionElsRef.current[0] = el; }}
          className="fullpage-section"
          style={{
            width: '100%',
            scrollSnapAlign: 'start',
            display: 'flex',
            alignItems: 'center',
            padding: '1.5rem 0',
            backgroundColor: '#FBF9F5',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* 우측 배경 사진(assets/will.png → public/hero_will.png) — 만년필로 체크리스트를
              쓰는 손. 손·펜이 있는 지점이 우측에 오도록 위치를 잡는다. 위치/스크림은
              index.css .hero-photo-bg·.hero-photo-scrim이 담당(미디어쿼리로 반응형 처리). */}
          <div className="hero-photo-bg" style={{ backgroundImage: "url('/hero_will.png')" }} />
          <div className="hero-photo-scrim" />

          {/* index.css .container(max-width 1440·margin auto)과 같은 폭 규칙으로 맞춘 래퍼 —
              이게 없으면 텍스트 박스가 뷰포트 왼쪽 끝에 그대로 붙어버려(패딩 몇 px만 떨어짐),
              화면이 넓을수록 "왼쪽에 쏠려 보인다"는 인상을 준다. 헤더 로고·진입 4박스 등
              나머지 섹션과 같은 중앙 정렬 기준선 안에서, 텍스트만 그 기준선의 왼쪽에 앉힌다. */}
          <div style={{ width: '100%', maxWidth: '1440px', margin: '0 auto', padding: '0 6vw', position: 'relative', zIndex: 1 }}>
          <div className="hero-content-card" style={{ maxWidth: '640px', width: '100%' }}>
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
                fontSize: 'clamp(2rem, 4vw, 3.1rem)',
                fontWeight: 700,
                color: '#1A2B4C',
                lineHeight: 1.35,
                fontFamily: "'KoPub World Batang', 'KoPubWorld 명조', serif",
                marginBottom: '1.3rem',
                letterSpacing: '-0.02em'
              }}
            >
              장례가 끝이 아니었습니다
            </h1>

            <p style={{ fontSize: '1.12rem', color: '#6C7A89', lineHeight: 1.75, marginBottom: '2.2rem', maxWidth: '560px' }}>
              미리 남기는 <strong style={{ color: '#1A2B4C', fontWeight: 700 }}>평온한 생전 준비</strong>부터{' '}
              <strong style={{ color: '#1A2B4C', fontWeight: 700 }}>장사시설 매칭</strong>,{' '}
              <strong style={{ color: '#1A2B4C', fontWeight: 700 }}>복잡한 사후 행정</strong>, 그리고{' '}
              <strong style={{ color: '#1A2B4C', fontWeight: 700 }}>영원한 기억의 온라인 추모관</strong>까지.
              <br />
              이어봄이 삶의 마지막 여정과 남겨진 가족의 시간을 온전히 연결합니다.
            </p>

            <div className="hero-cta-row">
              <button type="button" onClick={handleHeroPrimaryCTA} className="btn btn-primary" style={{ height: '58px', fontSize: '1.05rem' }}>
                장례 준비 및 사후 정리 →
              </button>
              <button
                type="button"
                onClick={handleHeroSecondaryCTA}
                className="btn"
                style={{
                  height: '58px',
                  fontSize: '1.05rem',
                  backgroundColor: 'transparent',
                  color: '#1A2B4C',
                  border: '1.5px solid #1A2B4C'
                }}
              >
                미리 준비하려 합니다 →
              </button>
            </div>
          </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* [섹션 1+2] 진입 4박스 + 에필로그·푸터 — 2026-08-24: 2페이지 전용 사진을 따로 못 구해서,
            fullpage_03 한 장을 이 두 섹션(화면 2칸 높이)에 걸쳐 이어지는 배경으로 쓴다. 사진 자체가
            위쪽 하늘 → 중간 언덕·오솔길 → 아래쪽 들꽃 순서라, 스크롤로 두 섹션을 내려가는 동안
            "같은 사진을 아래로 패닝"하는 느낌이 자연스럽게 난다. 그래서 배경 레이어를 개별 섹션이
            아니라 이 둘을 감싸는 공용 래퍼 하나에만 절대배치(inset:0)한다 — 래퍼 높이가 두 섹션
            높이의 합이 되므로 background-size:cover가 사진 전체를 그 2배 높이에 맞춰 늘린다. */}
        <div style={{ position: 'relative' }}>
          <div className="duo-photo-bg" style={{ backgroundImage: "url('/fullpage_03.png')" }} />
          <div className="duo-photo-scrim" />

          {/* ========================================================= */}
          {/* [섹션 1] 진입 4박스 — 00-23 §8. 새 화면 ID 아님(SCR-001 내부 블록) */}
          {/* ========================================================= */}
          <section
            ref={(el) => { sectionElsRef.current[1] = el; }}
            className="fullpage-section"
            style={{
              width: '100%',
              scrollSnapAlign: 'start',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '1.5rem 0',
              position: 'relative',
              overflowY: 'auto'
            }}
          >
            <div style={{ position: 'relative', zIndex: 1, width: '100%' }}>
              <EntryBoxes
                currentUser={currentUser}
                onOpenLogin={onOpenLogin}
                setActiveTab={setActiveTab}
                onSetMode={onSetMode}
                onRequestScrollIntoView={scrollToEntrySection}
              />
            </div>
          </section>

          {/* ========================================================= */}
          {/* [섹션 2] 에필로그 & 푸터 — 데스크톱(≥641px)은 래퍼(.epilogue-footer-wrapper)가
              기존 .fullpage-section 역할(고정 높이·스냅 대상)을 그대로 하고, 두 자식은 그
              안의 평범한 콘텐츠 블록이다. 00-23 §5.4-1: 640px 이하는 스냅 자체가 없으므로
              래퍼도 두 자식도 스냅 대상이 아니다 — 그냥 순서대로 흘러가는 콘텐츠(index.css
              참고). DOM 구조(래퍼+자식 두 section)는 폭과 무관하게 항상 같다. */}
          {/* ========================================================= */}
          <div
            ref={(el) => { sectionElsRef.current[2] = el; }}
            className="epilogue-footer-wrapper"
            style={{
              width: '100%',
              scrollSnapAlign: 'start',
              position: 'relative',
              overflowX: 'hidden'
            }}
          >
            {/* [섹션 3] 에필로그 클로징 메시지 — 남는 세로 공간을 채우도록 가운데 정렬
                (빈 공간이 아닌 실 콘텐츠로 확장). */}
            <section
              className="home-epilogue-section"
              style={{
                position: 'relative',
                zIndex: 1,
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
            </section>

            {/* [섹션 4] 하단 푸터 — 배경이 투명해서(Footer.tsx) 위 공용 배경 사진·스크림이 그대로
                비쳐 보인다(의도된 동작). position:relative로 감싸서 스태킹 컨텍스트를 올려야
                한다 — 안 그러면 static 요소는 절대 위치인 .duo-photo-bg/-scrim(z-index:auto)
                보다 항상 먼저(아래에) 그려져, Footer의 텍스트·구분선이 사진 뒤로 숨어버린다. */}
            <section className="home-footer-section" style={{ position: 'relative', zIndex: 1 }}>
              <Footer />
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};
