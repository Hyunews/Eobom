import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, CheckCircle2, ChevronDown, ArrowRight } from 'lucide-react';
import { HouseLeafIcon, HandScalesIcon, PhoneHeartIcon, NoteKeyIcon, ChecklistShieldIcon } from '../components/MenuIcons';
import { Footer } from '../components/Footer';

interface HomePageProps {
  currentUser?: string | null;
  onOpenLogin?: () => void;
  setActiveTab?: (tab: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ setActiveTab }) => {
  const [activeSection, setActiveSection] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeSectionRef = useRef(0);
  const isWheelScrollingRef = useRef(false);

  const sections = [
    { id: 'hero', title: '이어봄 브랜드', icon: Sparkles },
    { id: 'facility', title: '장례 · 묘지 매칭', icon: HouseLeafIcon },
    { id: 'counseling', title: '상속 · 법률 케어', icon: HandScalesIcon },
    { id: 'digital-estate', title: '디지털 유품 정리', icon: PhoneHeartIcon },
    { id: 'care-guide', title: '상중 · 행정 케어', icon: ChecklistShieldIcon },
    { id: 'ending-note', title: '디지털 엔딩노트', icon: NoteKeyIcon },
    { id: 'footer', title: '플랫폼 하단 정보', icon: Sparkles },
  ];

  // 스크롤 감지 및 이전 홈 스크롤 위치 저장 / 마운트 시 복원
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 마운트 시 이전에 보던 위치가 저장되어 있다면 해당 위치(섹션)로 즉시 복원
    // (메뉴 직접 클릭 시에는 eobom_scroll_home이 삭제되어 0 최상단으로 오픈)
    const saved = sessionStorage.getItem('eobom_scroll_home');
    if (saved !== null) {
      const savedTop = Number(saved);
      if (!isNaN(savedTop) && savedTop > 0) {
        container.scrollTop = savedTop;
        const sectionHeight = container.clientHeight;
        if (sectionHeight > 0) {
          const index = Math.round(savedTop / sectionHeight);
          setActiveSection(Math.min(sections.length - 1, Math.max(0, index)));
        }
      } else {
        container.scrollTop = 0;
        setActiveSection(0);
      }
    } else {
      container.scrollTop = 0;
      setActiveSection(0);
    }

    const handleScroll = () => {
      const sectionHeight = container.clientHeight;
      if (sectionHeight > 0) {
        const index = Math.round(container.scrollTop / sectionHeight);
        setActiveSection(Math.min(sections.length - 1, Math.max(0, index)));
        // 현재 보던 스크롤 위치 세션에 자동 기록 (이탈 후 되돌아올 때 복원용)
        sessionStorage.setItem('eobom_scroll_home', String(container.scrollTop));
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
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
      {/* 우측 풀페이지 스크롤 네비게이션 인디케이터 (7개 섹션 점) */}
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
              maxWidth: '1400px',
              width: '100%',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
              gap: '2.2rem',
              alignItems: 'center'
            }}
          >
            {/* 좌측 메인 텍스트 & 헤드라인 & 체크리스트 */}
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

              <p style={{ fontSize: '1.1rem', color: '#6C7A89', lineHeight: 1.7, marginBottom: '1.5rem' }}>
                <strong style={{ color: '#1A2B4C', fontWeight: 700 }}>이어봄 서비스</strong>는 엔딩노트·상속 준비부터 장례·묘지 매칭, 디지털 유품 정리와 행정 원스톱 가이드까지 단일 플랫폼에서 완결합니다.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1rem', color: '#1A2B4C', fontWeight: 700 }}>
                  <CheckCircle2 size={18} color="#5B7065" /> 24시간 365일 긴급 장례 지도사 즉시 연결
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1rem', color: '#1A2B4C', fontWeight: 700 }}>
                  <CheckCircle2 size={18} color="#5B7065" /> 유족 유언 메시지 &amp; 256-bit 암호화 금고
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1rem', color: '#1A2B4C', fontWeight: 700 }}>
                  <CheckCircle2 size={18} color="#5B7065" /> 변호사 · 세무사 1:1 비대면 전문 케어
                </div>
              </div>

              <button
                onClick={() => scrollToSection(1)}
                className="btn btn-primary"
                style={{
                  padding: '1rem 2rem',
                  fontSize: '1.05rem',
                  borderRadius: '16px',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.6rem'
                }}
              >
                5대 핵심 서비스 둘러보기 <ChevronDown size={20} />
              </button>
            </div>

            {/* 우측 고화질 서정적 아카이브 비주얼 카드 */}
            <div style={{ width: '100%', height: 'calc(100vh - 160px)', maxHeight: '580px', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
              <img
                src="/calm_boat.png"
                alt="존엄한 마무리를 상징하는 평온한 나룻배"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* [섹션 1] 장례 · 묘지 매칭 (집 & 나뭇잎) */}
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
          <div style={{ maxWidth: '1200px', width: '100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.2rem', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#FFFFFF', padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '0.85rem', color: '#1A2B4C', fontWeight: 800, marginBottom: '1.2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <HouseLeafIcon size={20} color="#1A2B4C" /> 01. 장례 · 묘지 매칭
              </div>
              <h2 style={{ fontSize: 'clamp(1.7rem, 3.6vw, 2.5rem)', fontWeight: 800, color: '#1A2B4C', fontFamily: "'KoPub World Batang', serif", marginBottom: '1.2rem', lineHeight: 1.25 }}>
                당신에게 가장 평온한<br />
                <span style={{ color: '#5B7065' }}>안식처를 찾아드립니다</span>
              </h2>
              <p style={{ fontSize: '1.1rem', color: '#6C7A89', lineHeight: 1.7, marginBottom: '1.5rem' }}>
                현재 위치 기반 반경 탐색, 카카오맵 LBS 핀 마커 연동, 표준 공시 견적 비교 및 1-Touch 방문 답사 예약을 이용해보세요.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1.75rem' }}>
                <div style={{ fontSize: '1rem', color: '#1A2B4C', fontWeight: 700 }}>• 전국 14개 실제 장례식장 / 봉안당 / 수목장 GPS 연동</div>
                <div style={{ fontSize: '1rem', color: '#1A2B4C', fontWeight: 700 }}>• 보건복지부 e하늘 장사정보 시스템 투명 가격 공시표 팝업</div>
                <div style={{ fontSize: '1rem', color: '#1A2B4C', fontWeight: 700 }}>• 전담 지도사 동행 1:1 방문 답사 예약 신청</div>
              </div>
              <button
                onClick={() => setActiveTab?.('facility')}
                className="btn btn-primary"
                style={{ padding: '1rem 2.2rem', fontSize: '1.05rem', borderRadius: '16px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}
              >
                장례 · 묘지 매칭 이동하기 <ArrowRight size={18} />
              </button>
            </div>
            <div style={{ backgroundColor: '#FFFFFF', padding: '1.75rem', borderRadius: '24px', boxShadow: '0 12px 35px rgba(26,43,76,0.08)', border: '2px solid #5B7065' }}>
              <div style={{ width: '64px', height: '64px', backgroundColor: '#F1F5F9', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.1rem' }}>
                <HouseLeafIcon size={36} color="#1A2B4C" />
              </div>
              <h3 style={{ fontSize: '1.4rem', color: '#1A2B4C', fontWeight: 800, marginBottom: '0.8rem' }}>봉안당 · 수목장 맞춤 검색</h3>
              <p style={{ color: '#6C7A89', fontSize: '0.95rem', lineHeight: 1.7, margin: 0 }}>
                날씨와 상관없는 쾌적한 실내 납골당부터 자연으로 돌아가는 친환경 수목장까지, 예산과 종교에 맞는 최고의 시설을 비교해 드립니다.
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* [섹션 2] 상속 · 법률 케어 (손 & 저울) */}
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
          <div style={{ maxWidth: '1200px', width: '100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.2rem', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#FEF3C7', padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '0.85rem', color: 'var(--accent-gold)', fontWeight: 800, marginBottom: '1.2rem' }}>
                <HandScalesIcon size={20} color="var(--accent-gold)" /> 02. 상속 · 법률 케어
              </div>
              <h2 style={{ fontSize: 'clamp(1.7rem, 3.6vw, 2.5rem)', fontWeight: 800, color: '#1A2B4C', fontFamily: "'KoPub World Batang', serif", marginBottom: '1.2rem', lineHeight: 1.25 }}>
                복잡하고 막막한 상속세<br />
                <span style={{ color: 'var(--accent-gold)' }}>전문가가 1:1 케어합니다</span>
              </h2>
              <p style={{ fontSize: '1.1rem', color: '#6C7A89', lineHeight: 1.7, marginBottom: '1.5rem' }}>
                상속세 자동 시뮬레이터로 공제액을 즉시 계산하고, 분야별 검증된 변호사·세무사와의 비대면 상담을 예약하세요.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1.75rem' }}>
                <div style={{ fontSize: '1rem', color: '#1A2B4C', fontWeight: 700 }}>• 부동산, 예적금 입력 ➔ 예상 상속세액 3초 자동 계산</div>
                <div style={{ fontSize: '1rem', color: '#1A2B4C', fontWeight: 700 }}>• 변호사 / 세무사 월별 상담 달력 예약 시스템</div>
                <div style={{ fontSize: '1rem', color: '#1A2B4C', fontWeight: 700 }}>• 유언장 작성 가이드 및 공증 법무사 매칭</div>
              </div>
              <button
                onClick={() => setActiveTab?.('counseling')}
                className="btn btn-primary"
                style={{ backgroundColor: 'var(--accent-gold)', padding: '1rem 2.2rem', fontSize: '1.05rem', borderRadius: '16px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}
              >
                상속 · 법률 케어 이동하기 <ArrowRight size={18} />
              </button>
            </div>
            <div style={{ backgroundColor: '#FFFFFF', padding: '1.75rem', borderRadius: '24px', boxShadow: '0 12px 35px rgba(212,163,89,0.1)', border: '2px solid var(--accent-gold)' }}>
              <div style={{ width: '64px', height: '64px', backgroundColor: '#FEF3C7', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.1rem' }}>
                <HandScalesIcon size={36} color="var(--accent-gold)" />
              </div>
              <h3 style={{ fontSize: '1.4rem', color: '#1A2B4C', fontWeight: 800, marginBottom: '0.8rem' }}>상속세 시뮬레이터 &amp; 1:1 케어</h3>
              <p style={{ color: '#6C7A89', fontSize: '0.95rem', lineHeight: 1.7, margin: 0 }}>
                배우자 공제, 자녀 일괄 공제를 적용하여 실제 과세 표준액을 미리 확인하고 자산 분쟁 없는 평온한 상속을 준비하세요.
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* [섹션 3] 디지털 유품 정리 (스마트폰 & 하트) */}
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
          <div style={{ maxWidth: '1200px', width: '100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.2rem', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#FFFFFF', padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '0.85rem', color: '#D4A359', fontWeight: 800, marginBottom: '1.2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <PhoneHeartIcon size={20} color="#D4A359" /> 03. 디지털 유품 정리
              </div>
              <h2 style={{ fontSize: 'clamp(1.7rem, 3.6vw, 2.5rem)', fontWeight: 800, color: '#1A2B4C', fontFamily: "'KoPub World Batang', serif", marginBottom: '1.2rem', lineHeight: 1.25 }}>
                소중한 디지털 흔적에<br />
                <span style={{ color: '#D4A359' }}>안전한 마침표를 찍습니다</span>
              </h2>
              <p style={{ fontSize: '1.1rem', color: '#6C7A89', lineHeight: 1.7, marginBottom: '1.5rem' }}>
                SNS·클라우드 계정 영구 삭제 신청부터 현물 유품 정리 수거 및 온라인 추모 갤러리까지 원스톱으로 지원합니다.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1.75rem' }}>
                <div style={{ fontSize: '1rem', color: '#1A2B4C', fontWeight: 700 }}>• 인스타그램, 페이스북, 카카오 계정 영구 삭제 대행</div>
                <div style={{ fontSize: '1rem', color: '#1A2B4C', fontWeight: 700 }}>• 지역 기반 현물 유품 수거 및 청소 전문 업체 연결</div>
                <div style={{ fontSize: '1rem', color: '#1A2B4C', fontWeight: 700 }}>• 유족 온라인 방명록, 헌화 및 추모 앨범 생성</div>
              </div>
              <button
                onClick={() => setActiveTab?.('digital-estate')}
                className="btn btn-primary"
                style={{ backgroundColor: '#D4A359', padding: '1rem 2.2rem', fontSize: '1.05rem', borderRadius: '16px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}
              >
                디지털 유품 정리 이동하기 <ArrowRight size={18} />
              </button>
            </div>
            <div style={{ backgroundColor: '#FFFFFF', padding: '1.75rem', borderRadius: '24px', boxShadow: '0 12px 35px rgba(212,163,89,0.12)', border: '2px solid #D4A359' }}>
              <div style={{ width: '64px', height: '64px', backgroundColor: '#FEF3C7', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.1rem' }}>
                <PhoneHeartIcon size={36} color="#D4A359" />
              </div>
              <h3 style={{ fontSize: '1.4rem', color: '#1A2B4C', fontWeight: 800, marginBottom: '0.8rem' }}>SNS / 클라우드 정산 &amp; 추모관</h3>
              <p style={{ color: '#6C7A89', fontSize: '0.95rem', lineHeight: 1.7, margin: 0 }}>
                유족의 슬픔을 터치하고 개인정보 유출을 방지하기 위해 계정 정산 절차를 1:1 대행하고 따뜻한 디지털 추모관을 구성해 드립니다.
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* [섹션 4] 상중 · 행정 케어 (체크리스트 & 쉴드) */}
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
          <div style={{ maxWidth: '1200px', width: '100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.2rem', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#DEF7EC', padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '0.85rem', color: '#03543F', fontWeight: 800, marginBottom: '1.2rem' }}>
                <ChecklistShieldIcon size={20} color="#03543F" /> 04. 상중 · 행정 케어
              </div>
              <h2 style={{ fontSize: 'clamp(1.7rem, 3.6vw, 2.5rem)', fontWeight: 800, color: '#1A2B4C', fontFamily: "'KoPub World Batang', serif", marginBottom: '1.2rem', lineHeight: 1.25 }}>
                갑작스러운 이별 앞에서도<br />
                <span style={{ color: '#5B7065' }}>24시간 든든하게 지켜드립니다</span>
              </h2>
              <p style={{ fontSize: '1.1rem', color: '#6C7A89', lineHeight: 1.7, marginBottom: '1.5rem' }}>
                사망 후 D-Day 필수 행정절차 타임라인, 모바일 부고장 작성 및 24시간 365일 긴급 출동 파견을 연동하세요.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1.75rem' }}>
                <div style={{ fontSize: '1rem', color: '#1A2B4C', fontWeight: 700 }}>• 사망진단서, 사망신고 등 정부24 연계 행정 타임라인</div>
                <div style={{ fontSize: '1rem', color: '#1A2B4C', fontWeight: 700 }}>• 모바일 부고장 간편 작성 &amp; 답례 문자 생성</div>
                <div style={{ fontSize: '1rem', color: '#1A2B4C', fontWeight: 700 }}>• 15분 내 운구 차 &amp; 전담 장례지도사 24시간 출동 핫라인</div>
              </div>
              <button
                onClick={() => setActiveTab?.('care-guide')}
                className="btn btn-primary"
                style={{ backgroundColor: '#5B7065', padding: '1rem 2.2rem', fontSize: '1.05rem', borderRadius: '16px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}
              >
                상중 · 행정 케어 이동하기 <ArrowRight size={18} />
              </button>
            </div>
            <div style={{ backgroundColor: '#FFFFFF', padding: '1.75rem', borderRadius: '24px', boxShadow: '0 12px 35px rgba(91,112,101,0.12)', border: '2px solid #5B7065' }}>
              <div style={{ width: '64px', height: '64px', backgroundColor: '#DEF7EC', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.1rem' }}>
                <ChecklistShieldIcon size={36} color="#03543F" />
              </div>
              <h3 style={{ fontSize: '1.4rem', color: '#1A2B4C', fontWeight: 800, marginBottom: '0.8rem' }}>24h 긴급 장례 디스패치</h3>
              <p style={{ color: '#6C7A89', fontSize: '0.95rem', lineHeight: 1.7, margin: 0 }}>
                임종 직후 1-Touch 전화 한 통으로 15분 내 운구 차와 배정된 지도사가 즉시 현장으로 출동하여 안치 수속을 지원합니다.
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* [섹션 5] 디지털 엔딩노트 (노트 & 열쇠) */}
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
          <div style={{ maxWidth: '1200px', width: '100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.2rem', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#FFFFFF', padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '0.85rem', color: '#1A2B4C', fontWeight: 800, marginBottom: '1.2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <NoteKeyIcon size={20} color="#1A2B4C" /> 05. 디지털 엔딩노트
              </div>
              <h2 style={{ fontSize: 'clamp(1.7rem, 3.6vw, 2.5rem)', fontWeight: 800, color: '#1A2B4C', fontFamily: "'KoPub World Batang', serif", marginBottom: '1.2rem', lineHeight: 1.25 }}>
                사랑하는 이들에게 남기는<br />
                <span style={{ color: '#5B7065' }}>256-bit 비밀 메시지</span>
              </h2>
              <p style={{ fontSize: '1.1rem', color: '#6C7A89', lineHeight: 1.7, marginBottom: '1.5rem' }}>
                사전 연명의료 의향서부터 256-bit AES 최고 등급 암호화 금고, 사후 지정 수신 자동 발송까지 소중한 유언을 보관하세요.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1.75rem' }}>
                <div style={{ fontSize: '1rem', color: '#1A2B4C', fontWeight: 700 }}>• 사전 연명의료 의향서 &amp; 장례 방식 사전 선택</div>
                <div style={{ fontSize: '1rem', color: '#1A2B4C', fontWeight: 700 }}>• 256-bit AES 군사 등급 암호화 유언 메시지 보관함</div>
                <div style={{ fontSize: '1rem', color: '#1A2B4C', fontWeight: 700 }}>• 사후 2인 유족 승인(Multi-Sig) 시 자동 메시지 개봉 및 발송</div>
              </div>
              <button
                onClick={() => setActiveTab?.('ending-note')}
                className="btn btn-primary"
                style={{ padding: '1rem 2.2rem', fontSize: '1.05rem', borderRadius: '16px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}
              >
                디지털 엔딩노트 작성하기 <ArrowRight size={18} />
              </button>
            </div>
            <div style={{ backgroundColor: '#FFFFFF', padding: '1.75rem', borderRadius: '24px', boxShadow: '0 12px 35px rgba(26,43,76,0.08)', border: '2px solid #D4A359' }}>
              <div style={{ width: '64px', height: '64px', backgroundColor: '#FEF3C7', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.1rem' }}>
                <NoteKeyIcon size={36} color="#1A2B4C" accentColor="#D4A359" fillColor="#5B7065" />
              </div>
              <h3 style={{ fontSize: '1.4rem', color: '#1A2B4C', fontWeight: 800, marginBottom: '0.8rem' }}>256-bit AES 보안 금고</h3>
              <p style={{ color: '#6C7A89', fontSize: '0.95rem', lineHeight: 1.7, margin: 0 }}>
                생전에는 철저히 비밀이 보장되며, 사후 사망진단서 확인 및 지정 유족의 이중 동의 완료 시에만 안전하게 복호화되어 전송됩니다.
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* [섹션 6] 에필로그 & 푸터 (다른 섹션과 같은 베이지 톤, Footer Snap Section) */}
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
            <div style={{ display: 'flex', gap: '0.9rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '0.4rem' }}>
              <button
                onClick={() => setActiveTab?.('ending-note')}
                className="btn btn-primary"
                style={{ padding: '0.85rem 1.6rem', borderRadius: '12px', fontSize: '0.95rem', fontWeight: 700 }}
              >
                사전 엔딩노트 작성 ➔
              </button>
              <button
                onClick={() => setActiveTab?.('facility')}
                className="btn"
                style={{ backgroundColor: 'transparent', color: '#1A2B4C', padding: '0.85rem 1.6rem', borderRadius: '12px', fontSize: '0.95rem', fontWeight: 700, border: '1.5px solid #DFDCD7' }}
              >
                전국 시설 탐색 ➔
              </button>
            </div>
          </div>

          {/* 하단 푸터 — 별도 카드로 띄우지 않고 같은 다크 톤에 자연스럽게 이어붙임 */}
          <Footer />
        </section>
      </div>
    </div>
  );
};