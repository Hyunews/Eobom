import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, HeartHandshake, Flower2, Building2 } from 'lucide-react';
import { ChecklistShieldIcon } from '../MenuIcons';
import { box1Keys, box2Keys, box1Intro, box2Intro } from './domainSlides';
import type { NavMode } from '../../modeNav';
import { parseMemorialLink } from '../../utils/memorialLink';

// docs/00_핵심플랫폼/00-23 §8 — 메인화면 진입구조 목업. 사장님 지시(2026-08-18 2차)로
// 박스①②는 항목 목록을 뺀 "간단 설명"만 남기고, 클릭 시 도메인 소개를 보여주는 별도 화면으로
// 이동하게 바꿨다(그 화면은 풀스크린 오버레이 → 일반 페이지로 재차 변경, 아래 2026-08-25 참고).
// 박스③④(Guest·파트너)는 항목이 1개뿐이라 기존 방식(목록 1줄) 그대로 둔다.
// 08-19 시각 정제(00-23 §8.5) — ①②/③④를 별도 그리드 블록으로 나눠 "큰 카드/낮은 카드" 위계 복원.
// 08-19 2차 — 동적 포커스 인터랙션 고도화. 기본 상태는 [아이콘+제목+한줄설명]만 정갈하게 노출하고,
// 칩·CTA·부가 버튼은 `.entry-box-reveal`로 감싸 index.css의 @media (hover:hover)에서만 접었다 편다
// (터치 기기는 이 media 밖이라 처음부터 펼쳐진 채로 보여 터치 UX를 막지 않는다).
// 카드 배경은 00-09 §2.1 5색 토큰에서 파생한 옅은 그라데이션 틴트(index.css --box-tint-*)로 마감.
//
// 2026-08 A안 재구성 — 4박스를 2x2 정적 그리드(00-23 §8.5)에서 좌우 캐러셀(한 화면 2개씩,
// 모바일 1개씩)로 바꿨다. §8.5와 어긋나는 편차이며 정본 개정 필요(walkthrough 기록 + docs 반영
// 요청 대상, Opus 소관). 순서(①→②→③→④)·카드 내용은 그대로 유지한다.
// 2026-08-25 개발자 지시("애초에 굳이 오버레이일 이유가 없음") — 박스①②는 클릭 시 풀스크린
// 오버레이(BoxDetailOverlay, 폐지) 대신 일반 페이지(/prep·/bereaved, DomainOverviewPage)로
// 이동한다. 그 페이지가 쓰는 box1Keys·box2Keys는 domainSlides.tsx로 옮겨 여기와 공유한다.

// 박스 요약 칩 전용 짧은 라벨 — domainSlides.badgeLabel은 소개 페이지 제목용이라 길다.
const chipLabels: Record<string, string> = {
  counseling: '전문가 상담',
  'ending-note': '디지털 엔딩노트',
  'farewell-messages': '유족 메시지 보관함',
  'digital-estate': '디지털 정산',
  'care-guide': '상중 행정',
  obituary: '모바일 부고장',
  facility: '장사시설 매칭',
  memorial: '디지털 추모관',
  pickup: '유품 수거',
};

interface EntryBoxesProps {
  currentUser?: string | null;
  onOpenLogin?: () => void;
  setActiveTab?: (tab: string) => void;
  onSetMode?: (mode: NavMode) => void;
  // HomePage.tsx가 containerRef를 직접 조작하는 함수를 내려준다 — 박스③(?entry=box3)로 진입할 때
  // 섹션 1로 스크롤시키는 데 쓴다. sessionStorage/마운트 타이밍에 기대지 않는 직접 호출 경로.
  onRequestScrollIntoView?: () => void;
}

interface EntryItem {
  label: string;
  tab?: string;
  status: 'active' | 'preview' | 'comingSoon';
  loginRequired?: boolean;
}

const box4Items: EntryItem[] = [{ label: '파트너 로그인', tab: 'partner', status: 'active' }];

// Sidebar(모드별 메뉴)가 00-26 §3의 상태 배지 규격 재사용을 위해 export한다(00-23 §8.3과 동일 규격).
export const Badge: React.FC<{ status: 'preview' | 'comingSoon' }> = ({ status }) => {
  const preview = status === 'preview';
  return (
    <span
      style={{
        flexShrink: 0,
        fontSize: '0.85rem',
        fontWeight: 700,
        padding: '0.2rem 0.55rem',
        borderRadius: '4px',
        color: preview ? '#475569' : '#94A3B8',
        backgroundColor: preview ? '#E2E8F0' : '#F1F5F9',
      }}
    >
      {preview ? '미리보기' : '준비 중'}
    </span>
  );
};

// 클릭 불가 요약 칩 — 박스①②의 호버 펼침 콘텐츠에 쓰인다. 순수 <span>만 써서 어포던스를 안 만든다.
// 767px 이하는 호버가 없어 RevealContent가 항상 펼쳐진 채로 렌더되는데, 박스②는 칩이 7개라
// 겹겹이 줄바꿈되며 카드가 뷰포트 세로 길이를 넘어서는 문제가 있었다(2026-08-25 개발자 지적)
// — index.css `.chip-row` 미디어쿼리로 767px 이하에서 숨긴다("자세히 보기" 진입 후 오버레이에서
// 항목을 전부 볼 수 있으므로 정보 손실은 아님).
const ChipRow: React.FC<{ labels: string[] }> = ({ labels }) => (
  <div className="chip-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.9rem' }}>
    {labels.map((label) => (
      <span
        key={label}
        style={{
          fontSize: '0.92rem',
          fontWeight: 600,
          color: '#6C7A89',
          backgroundColor: '#F1F5F9',
          padding: '0.35rem 0.85rem',
          borderRadius: '999px',
        }}
      >
        {label}
      </span>
    ))}
  </div>
);

const EntryRow: React.FC<{
  item: EntryItem;
  currentUser?: string | null;
  onOpenLogin?: () => void;
  setActiveTab?: (tab: string) => void;
}> = ({ item, currentUser, onOpenLogin, setActiveTab }) => {
  const isComingSoon = item.status === 'comingSoon';

  const handleClick = () => {
    if (isComingSoon) return;
    if (item.loginRequired && !currentUser) {
      onOpenLogin?.();
      return;
    }
    if (item.tab) setActiveTab?.(item.tab);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isComingSoon}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.6rem',
        width: '100%',
        minHeight: 'var(--min-touch-target)',
        padding: '0.3rem 0.1rem',
        background: 'none',
        border: 'none',
        textAlign: 'left',
        fontFamily: 'inherit',
        cursor: isComingSoon ? 'not-allowed' : 'pointer',
        color: isComingSoon ? '#94A3B8' : 'var(--text-main)',
      }}
    >
      <span style={{ fontSize: '1.05rem', fontWeight: 600 }}>{item.label}</span>
      {item.status === 'preview' && <Badge status="preview" />}
      {item.status === 'comingSoon' && <Badge status="comingSoon" />}
      {item.status === 'active' && <ChevronRight size={18} color="#94A3B8" />}
    </button>
  );
};

const BoxHeader: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  badge?: React.ReactNode;
  size?: 'lg' | 'sm';
  iconBg?: string;
}> = ({ icon, title, subtitle, badge, size = 'lg', iconBg = '#F1F5F9' }) => {
  // 2026-08-19 3차 — 카드는 줄이고(index.css min-height 축소) 내부 요소는 키워서 균형을 맞춘다.
  const boxSize = size === 'lg' ? '64px' : '48px';
  const titleSize = size === 'lg' ? '1.5rem' : '1.3rem';
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: boxSize,
              height: boxSize,
              flexShrink: 0,
              borderRadius: '16px',
              backgroundColor: iconBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </div>
          <h3 style={{ fontSize: titleSize, fontWeight: 800, color: 'var(--primary-color)', margin: 0 }}>{title}</h3>
        </div>
        {badge}
      </div>
      <p style={{ fontSize: '1.05rem', color: 'var(--text-muted)', margin: '0.65rem 0 0 0', lineHeight: 1.5 }}>{subtitle}</p>
    </div>
  );
};

// 호버(또는 키보드 포커스) 시에만 펼쳐지는 콘텐츠 래퍼 — index.css `.entry-box-reveal`
// (grid-template-rows 0fr↔1fr 트릭)과 짝을 이룬다. 호버 불가 기기에서는 처음부터 펼쳐진다.
const RevealContent: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="entry-box-reveal">
    <div className="entry-box-reveal__inner">{children}</div>
  </div>
);

// 캐러셀 한 페이지에 넣을 박스 개수 — 767px 이하는 1개, 그 위는 2개(기존 .entry-boxes-grid
// 브레이크포인트 재사용, 00-29 §6.1 "신규 브레이크포인트 금지"). SSR 없는 순수 CSR이라
// window 참조는 항상 안전하다.
const getItemsPerPage = () => (window.matchMedia('(max-width: 767px)').matches ? 1 : 2);

export const EntryBoxes: React.FC<EntryBoxesProps> = ({ currentUser, onOpenLogin, setActiveTab, onSetMode, onRequestScrollIntoView }) => {
  // 박스③(추모관 링크 입력)은 여전히 홈 안 캐러셀 페이지 전환용으로 ?entry=box3 쿼리를 쓴다
  // (아래 entryParam 참고) — 박스①②만 2026-08-25에 일반 페이지 이동으로 바뀌었다.
  const [searchParams, setSearchParams] = useSearchParams();
  const entryParam = searchParams.get('entry');

  const handleBox1Click = () => {
    onSetMode?.('prep');
    setActiveTab?.('prep');
  };

  const handleBox2Click = () => {
    onSetMode?.('bereaved');
    setActiveTab?.('bereaved');
  };

  // ③ 추모관(구 Guest) — 받은 링크(전체 URL이든 "/m/slug"·slug만이든)로 바로 입장.
  // 다른 오리진 링크는 클라이언트 라우팅으로 못 넘어가므로 하드 리다이렉트로 처리한다.
  const navigate = useNavigate();
  const [memorialLinkInput, setMemorialLinkInput] = useState('');
  const [memorialLinkError, setMemorialLinkError] = useState('');

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

  // ── 캐러셀 상태 — 자동재생 없음. 좌우 버튼 / 인디케이터 클릭 / 스와이프 / 방향키로만 이동.
  const [itemsPerPage, setItemsPerPage] = useState<number>(getItemsPerPage);
  const [currentPage, setCurrentPage] = useState(0);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const prevArrowRef = useRef<HTMLButtonElement>(null);
  const nextArrowRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 767px)');
    const handleChange = (e: MediaQueryListEvent) => {
      setItemsPerPage(e.matches ? 1 : 2);
      setCurrentPage(0);
    };
    if (mql.addEventListener) {
      mql.addEventListener('change', handleChange);
      return () => mql.removeEventListener('change', handleChange);
    }
    // 구형 Safari 폴백
    mql.addListener(handleChange);
    return () => mql.removeListener(handleChange);
  }, []);

  // 2026-08-24 — Header.tsx의 "추모관" 메뉴가 ?entry=box3로 진입시킨다. 박스①②와 달리 박스③은
  // 풀스크린 오버레이가 없어(추모관 링크 입력창일 뿐) 그냥 이 섹션으로 스크롤만 해서는 캐러셀이
  // 첫 페이지(박스①②)에 멈춰 있어 실제로는 안 보였다 — 캐러셀 페이지 자체를 넘긴다. 박스③은
  // boxItems 배열의 인덱스 2(0-based)라, itemsPerPage로 나눈 몫이 그 박스가 속한 페이지 번호다.
  useEffect(() => {
    if (entryParam === 'box3') {
      setCurrentPage(Math.floor(2 / itemsPerPage));
      onRequestScrollIntoView?.();
      setSearchParams({}, { replace: true });
    }
  }, [entryParam, itemsPerPage, setSearchParams, onRequestScrollIntoView]);

  const box1Card = (
    // 카드 전체는 더 이상 클릭 대상이 아니다 — "자세히 보기"에 마우스를 올렸을 때만 포인터
    // 커서·클릭이 활성화되도록, 실제 클릭 핸들러는 그 버튼에만 건다(개발자 확정). 호버 시 칩·
    // "자세히 보기"가 펼쳐지는 동작은 .entry-box-card 클래스 기준이라(태그 무관) 그대로 유지된다.
    <div
      key="box1"
      className="card entry-box-primary entry-box-card entry-box-tint-green"
      style={{ textAlign: 'left', width: '100%', justifyContent: 'center' }}
    >
      <BoxHeader
        icon={<HeartHandshake size={32} color="var(--point-color)" />}
        title="생전 준비"
        subtitle={box1Intro}
        iconBg="rgba(91, 112, 101, 0.12)"
      />
      <RevealContent>
        <ChipRow labels={box1Keys.map((k) => chipLabels[k])} />
        <button
          type="button"
          onClick={handleBox1Click}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
            marginTop: '1.1rem',
            paddingTop: '1rem',
            borderTop: '1px solid rgba(91, 112, 101, 0.2)',
            color: 'var(--point-color)',
            fontSize: '1rem',
            fontWeight: 700,
            background: 'none',
            border: 'none',
            borderTopWidth: '1px',
            borderTopStyle: 'solid',
            borderTopColor: 'rgba(91, 112, 101, 0.2)',
            width: '100%',
            textAlign: 'left',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          자세히 보기 <ChevronRight size={18} />
        </button>
      </RevealContent>
    </div>
  );

  const box2Card = (
    // box1Card와 동일한 이유로 카드 자체는 클릭 대상이 아니다 — "자세히 보기"에만 클릭을 건다.
    <div
      key="box2"
      className="card entry-box-primary entry-box-card entry-box-tint-gold"
      style={{ textAlign: 'left', width: '100%', justifyContent: 'center' }}
    >
      <BoxHeader
        icon={<ChecklistShieldIcon size={32} color="#03543F" />}
        title="임종 및 사후 정리"
        subtitle={box2Intro}
        iconBg="rgba(212, 163, 89, 0.16)"
      />
      <RevealContent>
        <ChipRow labels={box2Keys.map((k) => chipLabels[k])} />
        <button
          type="button"
          onClick={handleBox2Click}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
            marginTop: '1.1rem',
            paddingTop: '1rem',
            borderTopWidth: '1px',
            borderTopStyle: 'solid',
            borderTopColor: 'rgba(212, 163, 89, 0.25)',
            color: 'var(--point-color)',
            fontSize: '1rem',
            fontWeight: 700,
            background: 'none',
            border: 'none',
            width: '100%',
            textAlign: 'left',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          자세히 보기 <ChevronRight size={18} />
        </button>
      </RevealContent>
    </div>
  );

  const box3Card = (
    // ③ 추모관(구 Guest) — 받으신 링크를 붙여넣으면 바로 입장(00-23 §4.4).
    // 2026-08-26 — ①②와 높이·헤더 크기를 통일(entry-box-secondary 200px → primary 300px,
    // BoxHeader size="sm" → 기본값 "lg"). 호버 전 카드가 ①②보다 낮아 보인다는 지적.
    <div
      key="box3"
      style={{ textAlign: 'left', width: '100%', justifyContent: 'center' }}
      className="card entry-box-primary entry-box-card entry-box-tint-slate"
    >
      <BoxHeader
        icon={<Flower2 size={32} color="#5B7065" />}
        title="추모관"
        subtitle="받으신 추모관 링크로 입장하세요. 온라인 헌화와 방명록으로 마음을 전할 수 있습니다."
      />
      <RevealContent>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.8rem' }}>
          <input
            type="text"
            className="form-input"
            placeholder="받으신 링크를 그대로 붙여넣어 주세요"
            value={memorialLinkInput}
            onChange={(e) => {
              setMemorialLinkInput(e.target.value);
              if (memorialLinkError) setMemorialLinkError('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleMemorialLinkEnter();
            }}
          />
          <button type="button" onClick={handleMemorialLinkEnter} className="btn btn-primary">
            입장
          </button>
          {memorialLinkError && (
            <p style={{ fontSize: '0.85rem', color: '#B91C1C', margin: 0 }}>{memorialLinkError}</p>
          )}
        </div>
      </RevealContent>
    </div>
  );

  const box4Card = (
    // ④ 파트너 — 항목 1개뿐이라 기존 방식(목록 1줄) 그대로 유지
    // 2026-08-26 — ①②와 높이·헤더 크기를 통일(box3Card와 동일 사유).
    <div
      key="box4"
      style={{ textAlign: 'left', width: '100%', justifyContent: 'center' }}
      className="card entry-box-primary entry-box-card entry-box-tint-slate"
    >
      <BoxHeader
        icon={<Building2 size={32} color="var(--primary-color)" />}
        title="파트너"
        subtitle="장사시설·전문가 사업자이신가요? 노출이 아니라 실제 문의가 발생했을 때만 정산됩니다."
      />
      <RevealContent>
        <div style={{ marginTop: '0.5rem' }}>
          {box4Items.map((item) => (
            <EntryRow key={item.label} item={item} currentUser={currentUser} onOpenLogin={onOpenLogin} setActiveTab={setActiveTab} />
          ))}
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.5rem 0 0 0' }}>
          로그인하시면 대시보드로 이동합니다.
        </p>
      </RevealContent>
    </div>
  );

  // 순서 고정: ①→②→③→④(00-23 §8.5 모바일 스택 순서와 동일). itemsPerPage개씩 잘라 페이지를
  // 만든다 — 2개씩이면 [①②][③④] 두 페이지(기존 그리드와 같은 짝), 1개씩이면 네 페이지.
  const boxItems = [box1Card, box2Card, box3Card, box4Card];
  const pages: React.ReactNode[][] = [];
  for (let i = 0; i < boxItems.length; i += itemsPerPage) {
    pages.push(boxItems.slice(i, i + itemsPerPage));
  }
  const pageCount = pages.length;
  const safeCurrentPage = Math.min(currentPage, pageCount - 1);

  const goToPage = (index: number) => {
    setCurrentPage(Math.min(pageCount - 1, Math.max(0, index)));
  };

  // 경계(첫/마지막 페이지)에 닿으면 해당 화살표가 disabled로 바뀌는데, 그 순간 포커스가 그
  // 버튼에 있으면 브라우저가 자동으로 blur시켜 버려(disabled 요소는 포커스를 가질 수 없음)
  // 방향키 연속 조작이 그 자리에서 끊긴다. 전환 직전(아직 focus가 살아있는 시점)에 "이 화살표가
  // 곧 비활성화되는가"를 확인해 두었다가, 그렇다면 반대쪽 화살표로 포커스를 옮겨 키보드 조작이
  // 끊기지 않게 한다.
  const goPrev = () => {
    const wasPrevFocused = document.activeElement === prevArrowRef.current;
    const target = Math.max(0, safeCurrentPage - 1);
    setCurrentPage(target);
    if (target === 0 && wasPrevFocused) {
      requestAnimationFrame(() => nextArrowRef.current?.focus());
    }
  };
  const goNext = () => {
    const wasNextFocused = document.activeElement === nextArrowRef.current;
    const target = Math.min(pageCount - 1, safeCurrentPage + 1);
    setCurrentPage(target);
    if (target === pageCount - 1 && wasNextFocused) {
      requestAnimationFrame(() => prevArrowRef.current?.focus());
    }
  };

  // 방향키 좌우로도 이동 — 단, 추모관 링크 입력창(box3) 안에서 커서 이동을 가로채지 않는다.
  const handleCarouselKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const targetTag = (e.target as HTMLElement).tagName;
    if (targetTag === 'INPUT' || targetTag === 'TEXTAREA') return;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goPrev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      goNext();
    }
  };

  // 스와이프(터치) — 40px 이상 수평 이동 + 수평 이동량이 수직 이동량보다 뚜렷이 클 때만
  // 페이지 전환으로 인식한다. 원래는 수직 이동(deltaY)을 아예 안 봐서, 풀페이지 스크롤을
  // 하려고 아래로 스와이프하는 손짓이 조금만 옆으로 틀어져도(엄지 스와이프는 흔히 대각선이
  // 된다) 카드가 갑자기 옆 페이지로 넘어가 버렸다 — "카드가 위아래로 움직여서 휠 굴리기
  // 어렵다"는 실기기 지적(2026-08-25)의 원인으로 추정. 세로 스크롤 제스처는 카드 전환을
  // 건드리지 않고 그대로 상위 풀페이지 스크롤 컨테이너로 넘어가게 한다.
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStartXRef.current = e.touches[0]?.clientX ?? null;
    touchStartYRef.current = e.touches[0]?.clientY ?? null;
  };
  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    const startX = touchStartXRef.current;
    const startY = touchStartYRef.current;
    touchStartXRef.current = null;
    touchStartYRef.current = null;
    if (startX === null) return;
    const endX = e.changedTouches[0]?.clientX ?? startX;
    const endY = e.changedTouches[0]?.clientY ?? startY ?? startX;
    const deltaX = endX - startX;
    const deltaY = startY !== null ? endY - startY : 0;
    const threshold = 40;
    if (Math.abs(deltaX) <= Math.abs(deltaY)) return;
    if (deltaX > threshold) goPrev();
    else if (deltaX < -threshold) goNext();
  };

  return (
    // 2026-08-24: HomePage.tsx 히어로(섹션0)의 .hero-inner와 완전히 같은 폭 규칙(maxWidth 1440·
    // margin auto·padding 0 6vw)을 재사용한다 — 좌측 화살표의 왼쪽 끝이 히어로 텍스트 박스
    // (.hero-content-card)의 왼쪽 끝과 정렬되고, 같은 컨테이너라 우측도 자동으로 대칭 정렬된다.
    <div style={{ width: '100%', maxWidth: '1440px', margin: '0 auto', padding: '0 6vw' }}>
      <h2
        style={{
          fontSize: 'clamp(1.5rem, 2.6vw, 2rem)',
          fontWeight: 800,
          color: '#1A2B4C',
          fontFamily: "'KoPub World Batang', 'KoPubWorld 명조', serif",
          textAlign: 'center',
          marginBottom: '1.4rem',
        }}
      >
        어떤 도움이 필요하신가요?
      </h2>

      {/* 좌우 캐러셀 — 자동재생 없음. 방향키(←/→)는 이 영역에 포커스가 있을 때 동작한다(추모관
          입력창 안에서는 커서 이동을 위해 가로채지 않음). 00-23 §8.5의 2x2 정적 그리드를
          캐러셀로 대체한 편차 — docs 반영 요청서 참고. */}
      <div className="entry-carousel" onKeyDown={handleCarouselKeyDown}>
        <button
          ref={prevArrowRef}
          type="button"
          className="entry-carousel-arrow"
          onClick={goPrev}
          disabled={safeCurrentPage === 0}
          aria-label="이전 항목 보기"
        >
          <ChevronLeft size={22} />
        </button>

        <div
          className="entry-carousel-viewport"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="entry-carousel-track entry-boxes-focus-group"
            style={{ width: `${pageCount * 100}%`, transform: `translateX(-${safeCurrentPage * (100 / pageCount)}%)` }}
          >
            {pages.map((pageItems, pageIndex) => (
              <div
                key={pageIndex}
                className="entry-carousel-page"
                style={{ width: `${100 / pageCount}%` }}
                aria-hidden={pageIndex !== safeCurrentPage}
              >
                <div
                  className="entry-boxes-grid"
                  style={{ display: 'grid', gridTemplateColumns: `repeat(${pageItems.length}, 1fr)`, gap: '1.5rem' }}
                >
                  {pageItems}
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          ref={nextArrowRef}
          type="button"
          className="entry-carousel-arrow"
          onClick={goNext}
          disabled={safeCurrentPage === pageCount - 1}
          aria-label="다음 항목 보기"
        >
          <ChevronRight size={22} />
        </button>
      </div>

      {pageCount > 1 && (
        <div className="entry-carousel-dots" role="tablist" aria-label="박스 페이지 이동">
          {pages.map((_, pageIndex) => (
            <button
              key={pageIndex}
              type="button"
              className={`entry-carousel-dot${pageIndex === safeCurrentPage ? ' active' : ''}`}
              onClick={() => goToPage(pageIndex)}
              role="tab"
              aria-selected={pageIndex === safeCurrentPage}
              aria-label={`${pageIndex + 1}번째 페이지로 이동`}
            />
          ))}
        </div>
      )}

    </div>
  );
};
