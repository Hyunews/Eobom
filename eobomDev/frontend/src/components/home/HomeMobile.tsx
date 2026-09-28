import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Footer } from '../Footer';
import { MODE_MENUS, MODE_LABELS, HOME_DUO_LABELS, type NavMode, type ModeMenuItem } from '../../lib/modeNav';
import { parseMemorialLink } from '../../utils/memorialLink';

interface HomeMobileProps {
  currentUser?: string | null;
  onOpenLogin?: () => void;
  setActiveTab?: (tab: string) => void;
  onSetMode?: (mode: NavMode) => void;
  landingMode?: NavMode;
  onMobileHeaderStyleChange?: (style: { variant: 'hero' | 'panel' }) => void;
}

// 00-40 §3.3-3 M-2 — 칸 4개: 히어로 · 생전 준비 · 임종 및 사후 정리 · 섹션3+푸터
const PANEL_COUNT = 4;
// 각 칸 자체(콘텐츠)의 배경색 — 헤더 배경과는 무관하다(헤더는 항상 투명, 아래
// notifyHeaderStyle 주석 참고). ④(섹션3+푸터)는 사진 위라 별도 배경을 안 쓴다(CSS 기본값).
const PANEL_BG = ['transparent', '#FDFCFA', '#F5F2EC'];

const SESSION_KEY = 'eobom_scroll_home_m';

export const HomeMobile: React.FC<HomeMobileProps> = ({ currentUser, onOpenLogin, setActiveTab, onSetMode, landingMode, onMobileHeaderStyleChange }) => {
  // 00-40 §3.3 M-4 — 각 칸이 자기 인덱스를 그대로 찍어 보여줄 뿐(정적) 어느 칸이 활성인지에
  // 따라 다시 그릴 게 없어(데스크톱 점 인디케이터와 달리 반응형 표시가 없다), 현재 칸은
  // ref로만 들고 있는다 — state로 뒀다면 매 칸 전환마다 불필요한 리렌더만 생겼을 것이다.
  const viewportRef = useRef<HTMLDivElement>(null);
  const activePanelRef = useRef(0);

  // 🔄 2026-09-28 사람 지시 — 헤더에 칸 배경색을 그대로 입히면 스크롤 중 다음 칸 색이
  // 먼저 씌워지는 것처럼 보였다. variant(로고·아이콘 색만 결정)만 넘기고 배경은 Header.tsx가
  // 항상 투명으로 고정한다.
  const notifyHeaderStyle = (index: number) => {
    onMobileHeaderStyleChange?.({ variant: index === 0 ? 'hero' : 'panel' });
  };

  const goToPanel = (index: number) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const clamped = Math.min(PANEL_COUNT - 1, Math.max(0, index));
    viewport.scrollTo({ left: clamped * viewport.clientWidth, behavior: 'smooth' });
  };

  // 마운트 — 이전 칸 복원, 단 /prep·/bereaved에서 돌아온 경우(M-9)는 그 칸으로 곧장.
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    if (landingMode) {
      onSetMode?.(landingMode);
    }

    const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    if (navEntry?.type === 'reload') {
      sessionStorage.removeItem(SESSION_KEY);
    }

    const saved = sessionStorage.getItem(SESSION_KEY);
    const savedIndex = saved !== null ? Number(saved) : NaN;
    const initialIndex = landingMode
      ? (landingMode === 'prep' ? 1 : 2)
      : !isNaN(savedIndex) ? Math.min(PANEL_COUNT - 1, Math.max(0, savedIndex)) : 0;

    const applyInitial = () => {
      viewport.scrollLeft = initialIndex * viewport.clientWidth;
      activePanelRef.current = initialIndex;
      notifyHeaderStyle(initialIndex);
    };

    let resizeObserver: ResizeObserver | null = null;
    if (viewport.clientWidth > 0) {
      applyInitial();
    } else {
      resizeObserver = new ResizeObserver(() => {
        if (viewport.clientWidth > 0) {
          applyInitial();
          resizeObserver?.disconnect();
        }
      });
      resizeObserver.observe(viewport);
    }

    const handleScroll = () => {
      const width = viewport.clientWidth;
      if (width <= 0) return;
      const index = Math.round(viewport.scrollLeft / width);
      const clamped = Math.min(PANEL_COUNT - 1, Math.max(0, index));
      if (clamped !== activePanelRef.current) {
        activePanelRef.current = clamped;
        sessionStorage.setItem(SESSION_KEY, String(clamped));
        notifyHeaderStyle(clamped);
      }
    };

    const handleGoTop = () => goToPanel(0);

    viewport.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('eobom:home-scroll-top', handleGoTop);
    return () => {
      resizeObserver?.disconnect();
      viewport.removeEventListener('scroll', handleScroll);
      window.removeEventListener('eobom:home-scroll-top', handleGoTop);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // M-8 — 좌우 화살표는 넘김 영역에 포커스가 있을 때만(전역 키 처리 금지). 입력창 안에서는
  // 커서 이동을 가로채지 않는다.
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const targetTag = (e.target as HTMLElement).tagName;
    if (targetTag === 'INPUT' || targetTag === 'TEXTAREA') return;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      goToPanel(activePanelRef.current + 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goToPanel(activePanelRef.current - 1);
    }
  };

  // ⓓ 메뉴 줄 클릭 — Header.tsx goToModeItem과 같은 로그인 게이트
  const goToModeItem = (mode: NavMode, item: ModeMenuItem) => {
    if (item.loginRequired && !currentUser) {
      onOpenLogin?.();
      return;
    }
    onSetMode?.(mode);
    setActiveTab?.(item.id);
  };

  // 추모관 링크 입장 — 구 EntryBoxes.tsx 박스③과 같은 흐름 재사용(M-6)
  const navigate = useNavigate();
  const [showMemorialInput, setShowMemorialInput] = useState(false);
  const [memorialLinkInput, setMemorialLinkInput] = useState('');
  const [memorialLinkError, setMemorialLinkError] = useState('');
  // 🆕 2026-09-28 사람 지시 — 팝오버 바깥 클릭 시 닫힘(HomeDesktop.tsx와 같은 패턴).
  const memorialRowRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!showMemorialInput) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (memorialRowRef.current && !memorialRowRef.current.contains(e.target as Node)) {
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

  // M-4 — 모든 칸 오른쪽 아래 "1 / 4" + 다음 버튼. 칸 자체 스크롤과 분리해 항상 같은
  // 자리에 고정되도록 .home-m-panel-scroll(내부 스크롤)의 형제로 둔다(panel 렌더 참고).
  const renderIndicator = (index: number, isHero: boolean) => {
    const isLast = index === PANEL_COUNT - 1;
    const color = isHero ? '#FFFFFF' : '#5C6773';
    return (
      <div className="home-m-indicator" style={{ color }}>
        <span>{index + 1} / {PANEL_COUNT}</span>
        {!isLast && (
          <button
            type="button"
            aria-label="다음 화면"
            onClick={() => goToPanel(index + 1)}
            className="home-m-indicator-next"
            style={{
              borderColor: isHero ? 'rgba(255,255,255,0.6)' : '#D8D2C8',
              backgroundColor: isHero ? 'rgba(28,24,20,0.28)' : '#FFFFFF',
              color,
            }}
          >
            <ChevronRight size={20} />
          </button>
        )}
      </div>
    );
  };

  // 🔄 2026-09-29 — 00-40 §3.5 H-2·H-3. 칸 = 세로 flex 100%(헤더 50px 포함). 메뉴 줄이
  // flex:1 1 0 + min 44 / max 52px로 남는·모자라는 높이를 흡수한다. 넘치는 화면만 바깥
  // .home-m-panel-scroll(overflow-y:auto 안전망, H-1)이 스크롤한다.
  const renderModeMenu = (mode: NavMode) => (
    <div
      style={{
        height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column',
        padding: 'calc(50px + clamp(16px, 4svh, 48px)) 24px 72px',
      }}
    >
      <div style={{ fontSize: '12px', fontWeight: 700, color: '#A29B90' }}>{HOME_DUO_LABELS[mode]}</div>
      <h2 className="section-title" style={{ fontSize: '27px', fontWeight: 600, color: '#1A2B4C', margin: '6px 0 0' }}>
        {MODE_LABELS[mode]}
      </h2>
      {/* 🔄 2026-09-28 사람 지시 — 제목 아래 회색 "사실 한 줄" 삭제 */}
      <div style={{ marginTop: 'clamp(12px, 3svh, 24px)', flex: '1 1 auto', display: 'flex', flexDirection: 'column' }}>
        {MODE_MENUS[mode].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => goToModeItem(mode, item)}
            className="home-m-menu-item"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              width: '100%', flex: '1 1 0', minHeight: '44px', maxHeight: '52px',
              background: 'none', border: 'none',
              borderBottom: '1px solid #EFEBE4', fontSize: '16px', fontWeight: 600,
              color: '#1A2B4C', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', padding: 0,
            }}
          >
            <span>{item.label}</span>
            <ChevronRight size={18} color="#94A3B8" />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div ref={viewportRef} className="home-m-viewport" onKeyDown={handleKeyDown} tabIndex={0} role="region" aria-label="이어봄 홈 화면 넘김" aria-live="polite">
      {/* ① 히어로 — M-3 */}
      <section className="home-m-panel">
        <div className="home-m-panel-scroll">
          <div className="home-m-hero-photo" style={{ backgroundImage: "url('/hero_will.png')" }} />
          <div className="home-m-hero-scrim" />
          {/* 🔄 2026-09-28 — 00-40 §3.3-4 G4-c(사람 확정). M-3의 글 부분을 대체한다 —
              사진·그라데이션은 그대로. */}
          <div className="home-m-hero-text">
            <h1 className="section-title home-m-hero-title">이어봄</h1>
            <div style={{ marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.5)', width: '100%' }} />
            <p className="section-title" style={{ margin: '12px 0 0', fontSize: '21px', fontWeight: 600, color: '#FFFFFF', textAlign: 'right' }}>
              장례가 전부가 아니었습니다.
            </p>
            <p style={{ margin: '24px 0 0', fontSize: '15px', color: 'rgba(255,255,255,0.88)', lineHeight: 1.7 }}>
              생전 준비 · 임종 및 사후 정리까지<br />
              디지털 엔딩 & 웰다잉 토탈 케어,<br />
              이어봄이 함께합니다.
            </p>
          </div>
        </div>
        {renderIndicator(0, true)}
      </section>

      {/* ② 생전 준비 · ③ 임종 및 사후 정리 — M-5·M-6 */}
      {(['prep', 'bereaved'] as NavMode[]).map((mode, i) => (
        <section key={mode} className="home-m-panel" style={{ backgroundColor: PANEL_BG[i + 1] }}>
          <div className="home-m-panel-scroll">{renderModeMenu(mode)}</div>
          {renderIndicator(i + 1, false)}
        </section>
      ))}

      {/* ④ 섹션3+푸터 — C5(배지 제거) 외 유지, 배경은 데스크톱 섹션3과 같은 사진(W-7) */}
      <section className="home-m-panel">
        <div className="home-m-panel-scroll">
          <div className="duo-photo-bg" style={{ backgroundImage: "url('/fullpage_03.png')" }} />
          <div className="duo-photo-scrim" />
          {/* 🔄 2026-09-29 — 00-40 §3.5 H-6. 세로 flex 100% · 푸터 아래 48px 비움(4 / 4 숫자 자리) */}
          <div style={{ position: 'relative', zIndex: 1, height: '100%', boxSizing: 'border-box', paddingTop: '50px', paddingBottom: '48px', display: 'flex', flexDirection: 'column' }}>
            <section style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: 'clamp(12px, 3svh, 2.4rem) 1.5rem', gap: '1rem' }}>
              {/* 🔄 2026-09-28 사람 지시 — 좁은 폭에서 둘째 줄이 다시 줄바꿈돼 3줄로 보였다.
                  vw 기반 clamp로 줄여 320px대 폭에서도 "삶의 모든 봄날을 응원합니다"가
                  한 줄에 들어가게 한다(정확한 값은 실기기에서 사람이 다시 볼 것). */}
              <h2 className="section-title" style={{ fontSize: 'clamp(1.2rem, 6.2vw, 1.6rem)', color: '#1A2B4C', fontWeight: 'var(--fw-bold)', margin: 0, lineHeight: 1.4 }}>
                당신과 사랑하는 가족의<br />
                삶의 모든 <span style={{ color: '#5B7065' }}>봄날</span>을 응원합니다
              </h2>
              {/* 🔄 2026-09-28 사람 지시 — 지정된 지점에 줄바꿈 + 가운데 정렬(부모 textAlign은
                  이미 center지만 명시적으로 한 번 더 건다) */}
              <p style={{ fontSize: '0.95rem', color: '#6C7A89', lineHeight: 1.7, margin: 0, textAlign: 'center' }}>
                엔딩노트 작성부터 전국 장사시설 탐색까지,<br />
                이어봄이 곁에서 함께합니다.
              </p>
            </section>
            {/* 🔄 2026-09-29 — 00-40 §3.5 H-4. 추모관 링크로 입장 · 파트너 로그인을 ③에서 옮겨 온다(M-6).
                섹션3 문구 바로 아래·푸터 위, 누르는 높이 44px. */}
            <div ref={memorialRowRef} style={{ flex: '0 0 auto', margin: '0 24px', minHeight: '44px', borderTop: '1px solid #DDD6CB', display: 'flex', alignItems: 'center', gap: '1.2rem', position: 'relative' }}>
              <button type="button" onClick={() => setShowMemorialInput((v) => !v)} style={{ background: 'none', border: 'none', fontSize: '14px', fontWeight: 600, color: '#5B7065', cursor: 'pointer', fontFamily: 'inherit', padding: 0, minHeight: '44px' }}>
                추모관 링크로 입장
              </button>
              <button type="button" onClick={() => setActiveTab?.('partner')} style={{ background: 'none', border: 'none', fontSize: '14px', fontWeight: 600, color: '#8A9199', cursor: 'pointer', fontFamily: 'inherit', padding: 0, minHeight: '44px' }}>
                파트너 로그인
              </button>

              {showMemorialInput && (
                <div style={{ position: 'absolute', bottom: '100%', left: 0, right: 0, marginBottom: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', backgroundColor: '#FFFFFF', border: '1px solid #E7E2DA', borderRadius: 'var(--r-md)', padding: '1rem', boxShadow: 'var(--el-3)' }}>
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
            <section style={{ position: 'relative', flex: '0 0 auto' }}>
              {/* 🔄 2026-09-28 사용자 지시 — 모바일 푸터는 이제 전역으로 로고·브랜드 문구가
                  없다(FooterMobile.tsx) — 이 칸도 특별 취급 없이 그대로 렌더. */}
              <Footer />
            </section>
          </div>
        </div>
        {renderIndicator(3, false)}
      </section>
    </div>
  );
};
