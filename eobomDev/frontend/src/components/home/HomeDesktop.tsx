import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Footer } from '../Footer';
import { MODE_MENUS, MODE_LABELS, HOME_DUO_LABELS, type NavMode, type ModeMenuItem } from '../../lib/modeNav';
import { PageLink, tabPath } from '../common/PageLink';
import { parseMemorialLink } from '../../utils/memorialLink';
import { SCROLL_HOME_KEY } from '../../lib/storage';

interface HomeDesktopProps {
  currentUser?: string | null;
  onOpenLogin?: () => void;
  setActiveTab?: (tab: string) => void;
  landingMode?: NavMode;
}

// 00-40 §3.3-2 W-1 — 세로 풀페이지 3칸: 히어로 · ⓓ 두 갈래 · 에필로그+푸터. 넘김 방식은
// 구 HomePage.tsx의 휠 스냅 그대로(모바일 분기가 없어져 isMobileLayout() 가지들만 걷어냈다).
const SECTION_COUNT = 3;

// 00-40 §3.3-2 W-4 — ⓓ 두 갈래 순서(왼쪽 생전 준비 · 오른쪽 임종 및 사후 정리)
const DUO_MODES: NavMode[] = ['prep', 'bereaved'];

// 페이지 로드당 1회만 "새로고침이면 저장된 섹션 삭제"를 한다(모듈 수명 = 페이지 로드 수명).
let reloadChecked = false;

export const HomeDesktop: React.FC<HomeDesktopProps> = ({ currentUser, onOpenLogin, setActiveTab, landingMode }) => {
  const [activeSection, setActiveSection] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeSectionRef = useRef(0);
  const isWheelScrollingRef = useRef(false);

  const scrollToSection = (index: number) => {
    const container = containerRef.current;
    if (container) {
      container.scrollTo({ top: index * container.clientHeight, behavior: 'smooth' });
    }
  };

  // 마운트 — 이전 섹션 복원, 단 /prep·/bereaved에서 돌아온 경우(C6)는 곧장 ⓓ(섹션 인덱스 1)로.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 🔄 2026-09-29 — HomeMobile.tsx와 같은 이유로 페이지 로드당 첫 마운트에서만 지운다.
    if (!reloadChecked) {
      reloadChecked = true;
      const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      if (navEntry?.type === 'reload') {
        sessionStorage.removeItem(SCROLL_HOME_KEY);
      }
    }

    const saved = sessionStorage.getItem(SCROLL_HOME_KEY);
    const savedIndex = saved !== null ? Number(saved) : NaN;
    const initialIndex = landingMode
      ? 1
      : !isNaN(savedIndex) ? Math.min(SECTION_COUNT - 1, Math.max(0, savedIndex)) : 0;

    const applyInitialScroll = () => {
      container.scrollTop = initialIndex * container.clientHeight;
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

    const handleScroll = () => {
      const sectionHeight = container.clientHeight;
      if (sectionHeight > 0) {
        const index = Math.round(container.scrollTop / sectionHeight);
        const clamped = Math.min(SECTION_COUNT - 1, Math.max(0, index));
        setActiveSection(clamped);
        sessionStorage.setItem(SCROLL_HOME_KEY, String(clamped));
      }
    };

    // Header.tsx 로고를 이미 홈인 상태에서 다시 눌렀을 때(App.tsx setActiveTab이 쏘는 이벤트) 맨 위로.
    const handleGoTop = () => {
      container.scrollTop = 0;
      setActiveSection(0);
      sessionStorage.removeItem(SCROLL_HOME_KEY);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('eobom:home-scroll-top', handleGoTop);
    return () => {
      resizeObserver?.disconnect();
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('eobom:home-scroll-top', handleGoTop);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    activeSectionRef.current = activeSection;
  }, [activeSection]);

  // 마우스 휠 한 번 = 섹션 한 칸(W-1, 구 HomePage.tsx 그대로)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (isWheelScrollingRef.current) return;

      const direction = e.deltaY > 0 ? 1 : -1;
      const nextIndex = activeSectionRef.current + direction;
      if (nextIndex < 0 || nextIndex >= SECTION_COUNT) return;

      isWheelScrollingRef.current = true;
      activeSectionRef.current = nextIndex;
      setActiveSection(nextIndex);
      container.scrollTo({ top: nextIndex * container.clientHeight, behavior: 'smooth' });

      window.setTimeout(() => {
        isWheelScrollingRef.current = false;
      }, 700);
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  // 추모관 링크 입장 — 구 EntryBoxes.tsx 박스③과 같은 흐름 재사용(W-6)
  const navigate = useNavigate();
  const [showMemorialInput, setShowMemorialInput] = useState(false);
  const [memorialLinkInput, setMemorialLinkInput] = useState('');
  const [memorialLinkError, setMemorialLinkError] = useState('');
  // 🆕 2026-09-28 사람 지시 — 팝오버가 뜬 상태에서 바깥을 클릭하면 닫힌다. ref는 토글 버튼까지
  // 포함하는 띠 전체(W-6)에 걸어서, 토글 버튼 재클릭은 "안쪽"으로 잡혀 그 버튼 자신의
  // onClick(토글) 로직과 충돌하지 않는다.
  const memorialStripRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!showMemorialInput) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (memorialStripRef.current && !memorialStripRef.current.contains(e.target as Node)) {
        setShowMemorialInput(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showMemorialInput]);
  const handleMemorialLinkEnter = () => {
    const raw = memorialLinkInput.trim();
    if (!raw) {
      setMemorialLinkError('받으신 추모관 링크를 입력해 주세요.');
      return;
    }
    const parsed = parseMemorialLink(raw);
    if (!parsed) {
      setMemorialLinkError('추모관 링크 형식이 아닙니다. 받으신 링크를 다시 확인해 주세요.');
      return;
    }
    setMemorialLinkError('');
    if (parsed.isCrossOrigin) {
      window.location.href = raw;
    } else {
      navigate(parsed.path);
    }
  };

  // ⓓ 메뉴 줄 클릭 — Header.tsx goToModeItem과 같은 로그인 게이트(C7).
  // 🔄 09-29 — 링크(PageLink)로 바뀌어 게이트는 PageLink가 맡는다(비로그인+loginRequired=버튼).
  const goToModeItem = (_mode: NavMode, item: ModeMenuItem) => {
    setActiveTab?.(item.id);
  };

  return (
    <div className="fullpage-viewport" style={{ position: 'relative', width: '100%', overflow: 'hidden', backgroundColor: '#FDFCFA' }}>
      {/* 🔄 2026-09-28 — 00-40 §3.3-4 G4-c "함께 고칠 것". 오른쪽 점 3개 알약(주황 점) 제거 →
          오른쪽 아래 `n / 3`(모바일 M-4와 같은 방식) — 히어로(사진 배경)에서는 흰색, 나머지
          칸(밝은 배경)에서는 #5C6773. */}
      <div
        className="home-section-indicator"
        style={{
          position: 'fixed', right: '2rem', bottom: '2rem', zIndex: 800,
          fontSize: '13px', fontWeight: 600, letterSpacing: '0.02em',
          color: activeSection === 0 ? 'rgba(255, 255, 255, 0.9)' : '#5C6773',
        }}
      >
        {activeSection + 1} / {SECTION_COUNT}
      </div>

      {activeSection > 0 && (
        <button onClick={() => scrollToSection(activeSection - 1)} className="scroll-hint scroll-hint--up scroll-hint--in-viewport" aria-label="이전 섹션으로 스크롤" title="위로 스크롤">
          <ChevronUp size={34} />
        </button>
      )}
      {/* 히어로(섹션 0)는 "미리 준비 · 장례 준비 ↓" 버튼이 이 힌트를 대신한다(중복 방지) */}
      {activeSection > 0 && activeSection < SECTION_COUNT - 1 && (
        <button onClick={() => scrollToSection(activeSection + 1)} className="scroll-hint scroll-hint--down scroll-hint--in-viewport" aria-label="다음 섹션으로 스크롤" title="아래로 스크롤">
          <ChevronDown size={34} />
        </button>
      )}

      <div
        ref={containerRef}
        className="home-scroll-container"
        style={{
          width: '100%', height: '100%', overflowY: 'scroll', scrollSnapType: 'y mandatory',
          WebkitOverflowScrolling: 'touch', backgroundColor: '#FDFCFA',
        }}
      >
        {/* 섹션1 히어로 — W-2·W-3, 배지/CTA/설명문단은 C2·C3·C4 */}
        <section
          className="fullpage-section"
          style={{ width: '100%', scrollSnapAlign: 'start', display: 'flex', alignItems: 'stretch', backgroundColor: '#FDFCFA', position: 'relative', overflow: 'hidden' }}
        >
          <div className="hero-photo-bg" style={{ backgroundImage: "url('/hero_will.png')" }} />
          <div className="hero-photo-scrim" />
          {/* 🔄 2026-09-28 — 00-40 §3.3-4 G4-c(사람 확정, Opus 재지시로 정정). W-2·W-3·C2·C4의
              글 부분을 대체한다. 절대 위치 금지(§3.3-4) — 세로 흐름으로 쌓고, 덩어리 시작
              높이만 섹션 높이(824px 기준) 대비 28% 비율로 잡는다(calc로 실제 섹션 높이 =
              100vh - 헤더). 가로 위치 = "본문 1048px 상자의 왼쪽 선" — 그 상자는 화면 가운데
              놓이므로 왼쪽 선은 화면 폭에 따라 움직인다: max(80px, (섹션 폭 − 1048px) / 2),
              단 초광폭 화면에서 여백이 한없이 벌어지지 않도록 300px에서 상한(사람 지시,
              09-28 — 1920px 기준 436→300). 100%는 섹션 폭 기준(스크롤바 폭 때문에 100vw는
              쓰지 않는다). */}
          <div className="hero-body" style={{ width: '100%', position: 'relative', zIndex: 1, height: '100%', padding: '0 min(300px, max(80px, calc((100% - 1048px) / 2)))' }}>
            <div className="hero-content-card" style={{ marginTop: 'calc((100vh - var(--header-h)) * 0.28)', maxWidth: '540px', width: '100%' }}>
              {/* ① 이어봄 */}
              <h1 className="section-title" style={{ fontSize: '80px', fontWeight: 600, color: '#1A2B4C', lineHeight: 1.1, letterSpacing: '-2px', margin: 0 }}>
                이어봄
              </h1>
              {/* ② 가는 선 */}
              <div style={{ marginTop: '28px', borderTop: '1px solid #D8D2C8', width: '100%' }} />
              {/* ③ 장례가 전부가 아니었습니다 — 오른쪽 정렬(오른쪽 끝 = 선 끝에서 62px 안쪽) */}
              <p className="section-title" style={{ margin: '18px 62px 0 0', fontSize: '28px', fontWeight: 600, color: '#1A2B4C', textAlign: 'right' }}>
                장례가 전부가 아니었습니다.
              </p>
              {/* ④ 설명 두 줄 */}
              <p style={{ margin: '44px 0 0', fontSize: '20px', fontWeight: 500, color: '#5C6773', lineHeight: 1.6 }}>
                생전 준비 · 임종 및 사후 정리까지<br />
                디지털 엔딩 & 웰다잉 토탈 케어, 이어봄이 함께합니다.
              </p>
            </div>
            {/* 🔄 2026-09-28 사람 지시 — 이 텍스트 버튼과 아래 공용 스크롤 힌트(.scroll-hint--down)가
                같은 자리에서 두 개의 "아래로" 표시로 겹쳐 보여, 화면 가운데로 옮겨 하나로 합친다.
                공용 힌트는 히어로 섹션(index 0)에서만 숨긴다(아래 activeSection 조건 참고). */}
            <button
              type="button"
              onClick={() => scrollToSection(1)}
              style={{
                position: 'absolute', left: '50%', bottom: '32px', transform: 'translateX(-50%)',
                display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                fontSize: '15px', color: '#5C6773', background: 'none', border: 'none', padding: 0,
                cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
                animation: 'scrollHintBounceDown 1.8s ease-in-out infinite',
              }}
            >
              <span>미리 준비 · 장례 준비</span>
              <ChevronDown size={18} />
            </button>
          </div>
        </section>

        {/* 섹션2 ⓓ 두 갈래 대비 — W-4·W-5·W-6, C6·C7·C8 */}
        <section className="fullpage-section home-duo-section" style={{ width: '100%', scrollSnapAlign: 'start', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: '1 1 auto', display: 'flex', minHeight: 0 }}>
            {DUO_MODES.map((mode) => {
              const items = MODE_MENUS[mode];
              const isBereaved = mode === 'bereaved';
              return (
                <div
                  key={mode}
                  className="home-duo-col"
                  style={{
                    flex: '1 1 50%',
                    backgroundColor: isBereaved ? '#F5F2EC' : '#FDFCFA',
                    borderLeft: isBereaved ? '1px solid #E7E2DA' : 'none',
                    overflowY: 'auto',
                    // 🔄 2026-09-28 사람 지시 — 두 칸이 각자 가운데 정렬돼 있어 사이(안쪽) 간격이
                    // 너무 벌어져 있었다. 안쪽(경계선 쪽)을 좁히고 바깥쪽은 00-39 §5 데스크톱
                    // 좌우 여백(80px)만큼 더 준다 — 화면이 넓어질수록 바깥 여백만 늘어난다.
                    // 🔄 재조정(같은 날) — 처음 24px로는 "너무 가운데로 붙었다"는 재지적 →
                    // 56px로 늘림(안쪽 합 112px, 바깥 80px과 비슷한 무게가 되도록).
                    padding: isBereaved ? '0 80px 0 56px' : '0 56px 0 80px',
                  }}
                >
                  <div style={{ maxWidth: '600px', marginLeft: isBereaved ? 0 : 'auto', marginRight: isBereaved ? 'auto' : 0, padding: '120px 0 96px' }}>
                    {/* 🔄 2026-09-28 사람 지시 — 아래 회색 "사실 한 줄" 삭제, 이 라벨을 그만큼 키움 */}
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#A29B90' }}>{HOME_DUO_LABELS[mode]}</div>
                    <h2 className="section-title" style={{ fontSize: '40px', fontWeight: 600, color: '#1A2B4C', margin: '12px 0 0' }}>
                      {MODE_LABELS[mode]}
                    </h2>
                    <div
                      className="home-duo-menu"
                      style={{
                        marginTop: '36px',
                        borderTop: '1px solid #EFEBE4',
                        display: isBereaved ? 'grid' : 'block',
                        gridTemplateColumns: isBereaved ? '1fr 1fr' : undefined,
                        columnGap: isBereaved ? '40px' : undefined,
                      }}
                    >
                      {items.map((item) => (
                        <PageLink
                          key={item.id}
                          to={tabPath(item.id)}
                          loginRequired={item.loginRequired}
                          currentUser={currentUser}
                          onOpenLogin={onOpenLogin}
                          onNavigate={() => goToModeItem(mode, item)}
                          className="home-duo-menu-item"
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            width: '100%', height: '56px', background: 'none', border: 'none',
                            borderBottom: '1px solid #EFEBE4', fontSize: '17px', fontWeight: 600,
                            color: '#1A2B4C', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', padding: 0,
                          }}
                        >
                          <span>{item.label}</span>
                          {item.status === 'preview' && <span className="v2-badge-neutral">준비 중</span>}
                        </PageLink>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* W-6 — 맨 아래 띠. 🔄 2026-09-28 사람 지시 — 공용 스크롤 힌트(.scroll-hint--down,
              화면 정가운데 하단 고정)와 겹쳐 보여 marginBottom으로 그만큼 띄운다. */}
          <div ref={memorialStripRef} style={{ flexShrink: 0, height: '64px', marginBottom: '3rem', borderTop: '1px solid #E7E2DA', backgroundColor: '#FDFCFA', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2.5rem', position: 'relative' }}>
            <button type="button" onClick={() => setShowMemorialInput((v) => !v)} style={{ background: 'none', border: 'none', fontSize: '15px', fontWeight: 600, color: '#5B7065', cursor: 'pointer', fontFamily: 'inherit' }}>
              추모관 링크로 입장
            </button>
            <PageLink to="/partner" onNavigate={() => setActiveTab?.('partner')} style={{ background: 'none', border: 'none', fontSize: '15px', fontWeight: 600, color: '#8A9199', cursor: 'pointer', fontFamily: 'inherit' }}>
              파트너 로그인
            </PageLink>

            {showMemorialInput && (
              <div style={{ position: 'absolute', bottom: '72px', display: 'flex', flexDirection: 'column', gap: '0.5rem', backgroundColor: '#FFFFFF', border: '1px solid #E7E2DA', borderRadius: 'var(--r-md)', padding: '1rem', boxShadow: 'var(--el-3)', width: '320px' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="받으신 링크를 그대로 붙여넣어 주세요"
                  value={memorialLinkInput}
                  onChange={(e) => { setMemorialLinkInput(e.target.value); if (memorialLinkError) setMemorialLinkError(''); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleMemorialLinkEnter(); }}
                  autoFocus
                />
                <button type="button" onClick={handleMemorialLinkEnter} className="btn btn-primary">입장</button>
                {memorialLinkError && <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--state-danger-fg)', margin: 0 }}>{memorialLinkError}</p>}
              </div>
            )}
          </div>
        </section>

        {/* 섹션3 에필로그+푸터 — 배지 제거(C5) 외 유지, 배경 사진은 이 섹션 단독으로(W-7) */}
        <div className="epilogue-footer-wrapper" style={{ width: '100%', scrollSnapAlign: 'start', position: 'relative', overflowX: 'hidden' }}>
          <div className="duo-photo-bg" style={{ backgroundImage: "url('/fullpage_03.png')" }} />
          <div className="duo-photo-scrim" />
          <section className="home-epilogue-section" style={{ position: 'relative', zIndex: 1, flex: '1 1 auto', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '2.5rem 1.5rem', gap: '1.3rem' }}>
            <h2 className="section-title" style={{ fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', color: '#1A2B4C', fontWeight: 'var(--fw-bold)', margin: 0, lineHeight: 1.35 }}>
              당신과 사랑하는 가족의<br />
              삶의 모든 <span style={{ color: '#5B7065' }}>봄날</span>을 응원합니다
            </h2>
            <p style={{ fontSize: '1.05rem', color: '#6C7A89', lineHeight: 1.7, maxWidth: '560px', margin: 0 }}>
              엔딩노트 작성부터 전국 장사시설 탐색까지, 이어봄이 곁에서 함께합니다.
            </p>
          </section>
          <section className="home-footer-section" style={{ position: 'relative', zIndex: 1 }}>
            <Footer />
          </section>
        </div>
      </div>
    </div>
  );
};
