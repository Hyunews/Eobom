import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RdBranchLink, RdButton, RdIconButton, RdTextLink } from '../parts/RdButtons';
import { RdDialog } from '../parts/RdModal';
import { RdField, RdInput } from '../parts/RdInputs';
import { IconChevronDown, IconChevronLeft, IconChevronRight, IconPause } from '../parts/icons';
import { useIsPhone } from '../useIsPhone';
import { useFitScale } from '../useFitScale';
import { parseMemorialLink } from '../../utils/memorialLink';
import {
  PART1,
  PART1_INTRO,
  PART2,
  PART2_INTRO,
  QUICK_PAGES,
  type IntroItem,
  type QuickIcon,
  type QuickItem,
} from './landingData';

// 랜딩(첫 화면) — 00-45. 데스크톱과 모바일은 구조가 달라(보통 스크롤 ↔ 세로 풀페이지, 목록+상세 ↔ 밀어 넘기는 카드)
// 같은 문구·같은 부품을 두 배치로 그린다. 폭 판별은 useIsPhone(767px 이하, 00-44 §5-2).

const AUTO_MS = 7000;

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** 같은 쪽 안의 구간으로 내려가고, 도착한 구간 제목에 초점을 둔다(00-45 §4 · §8-1). */
function jumpTo(sectionId: string, focusId?: string) {
  const sec = document.getElementById(sectionId);
  if (!sec) return;
  sec.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
  if (focusId) document.getElementById(focusId)?.focus({ preventScroll: true });
}

// ── 바로 보기 아이콘(캔버스 인라인 그림 그대로) ──
function QuickGlyph({ icon, size }: { icon: QuickIcon; size: number }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' as const, 'aria-hidden': true, focusable: false };
  switch (icon) {
    case 'pin':
      return <svg {...common}><path d="M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>;
    case 'phone':
      return <svg {...common}><rect x="6" y="3" width="12" height="18" rx="1" /><path d="M10 17h4" /></svg>;
    case 'box':
      return <svg {...common}><path d="M4 8h16v12H4zM9 8V5h6v3" /></svg>;
    case 'users':
      return <svg {...common}><circle cx="9" cy="8" r="3" /><path d="M3 20c0-3 3-5 6-5s6 2 6 5M16 11a3 3 0 0 0 0-6M21 20c0-2-1.5-4-4-4.6" /></svg>;
    case 'note':
      return <svg {...common}><path d="M5 4h10l4 4v12H5z" /><path d="M9 12h6M9 16h4" /></svg>;
    case 'mail':
      return <svg {...common}><rect x="3" y="6" width="18" height="13" rx="1" /><path d="M3 7l9 6 9-6" /></svg>;
    case 'list':
      return <svg {...common}><path d="M9 6h11M9 12h11M9 18h11" /><path d="M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2" /></svg>;
    case 'tree':
      return <svg {...common}><circle cx="12" cy="8" r="3" /><path d="M12 11v10M12 16c-3 0-5-2-5-4M12 18c3 0 5-2 5-4" /></svg>;
    case 'card':
      return <svg {...common}><rect x="3" y="6" width="18" height="13" rx="1" /><path d="M3 10h18M7 15h4" /></svg>;
    case 'chat':
      return <svg {...common}><path d="M12 4c-4.5 0-8 2.8-8 6.3 0 2.2 1.4 4.1 3.6 5.3L7 20l4-2.6h1c4.5 0 8-2.8 8-6.3S16.5 4 12 4z" /></svg>;
    case 'link':
      return <svg {...common}><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></svg>;
  }
}

function QuickCell({ item, size, onEntry, showIcon = true }: { item: QuickItem; size: number; onEntry: (opener: HTMLElement) => void; showIcon?: boolean }) {
  const inner = (
    <>
      {showIcon && <QuickGlyph icon={item.icon} size={size} />}
      <span className="rd-lq__name">{item.name}</span>
    </>
  );
  if (item.kind === 'memorial-entry') {
    return (
      <button type="button" className="rd-lq__cell" onClick={(e) => onEntry(e.currentTarget)}>
        {inner}
      </button>
    );
  }
  if (item.kind === 'external') {
    return (
      <a className="rd-lq__cell" href={item.to} target="_blank" rel="noopener noreferrer">
        {inner}
      </a>
    );
  }
  return (
    <a className="rd-lq__cell" href={item.to}>
      {inner}
    </a>
  );
}

function PlayGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M7 5l12 7-12 7z" />
    </svg>
  );
}

// ── 데스크톱: 바로 보기 카드(7초 자동 넘김) ──
function QuickCard({ onEntry }: { onEntry: (opener: HTMLElement) => void }) {
  const [page, setPage] = useState(0);
  const [paused, setPaused] = useState(prefersReducedMotion);
  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(false);
  const n = QUICK_PAGES.length;

  // 마우스가 칸 위에 있거나 키보드 초점이 카드 안에 있으면 넘기지 않는다(WCAG 2.2.2, 00-45 §5).
  useEffect(() => {
    if (paused || hover || focus) return;
    const t = window.setTimeout(() => setPage((p) => (p + 1) % n), AUTO_MS);
    return () => window.clearTimeout(t);
  }, [page, paused, hover, focus, n]);

  return (
    <section
      className="rd-lq"
      aria-labelledby="quick-title"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setFocus(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocus(false);
      }}
    >
      <div className="rd-lq__head" data-fit-guard>
        <h2 className="rd-lq__title" id="quick-title" tabIndex={-1}>필요한 것만 바로 보기</h2>
        <div className="rd-lq__ctrl">
          <RdIconButton bordered label="이전 묶음" onClick={() => setPage((p) => (p + n - 1) % n)}>
            <IconChevronLeft size={16} />
          </RdIconButton>
          <RdIconButton bordered label={paused ? '자동 넘김 다시 켜기' : '자동 넘김 멈추기'} onClick={() => setPaused((v) => !v)}>
            {paused ? <PlayGlyph /> : <IconPause size={16} />}
          </RdIconButton>
          <RdIconButton bordered label="다음 묶음" onClick={() => setPage((p) => (p + 1) % n)}>
            <IconChevronRight size={16} />
          </RdIconButton>
        </div>
      </div>
      <ul className="rd-lq__grid">
        {QUICK_PAGES[page].map((it) => (
          <li key={it.name}>
            <QuickCell item={it} size={28} onEntry={onEntry} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function BranchPair() {
  return (
    <div className="rd-lh__branches">
      <RdBranchLink
        tone="primary"
        href="#part2-title"
        title="가족을 떠나보냈어요"
        desc="장례 기간부터 6개월 이후까지 할 일"
        onClick={(e) => {
          e.preventDefault();
          jumpTo('part2', 'part2-title');
        }}
      />
      <RdBranchLink
        tone="secondary"
        href="#part1-title"
        title="미리 준비하려고 해요"
        desc="엔딩노트 · 유족 메시지 · 전문가 상담"
        onClick={(e) => {
          e.preventDefault();
          jumpTo('part1', 'part1-title');
        }}
      />
    </div>
  );
}

// ── 데스크톱: 소개(왼쪽 목록 + 오른쪽 상세) ──
function DesktopIntro({
  id,
  part,
  title,
  lead,
  items,
  paper,
}: {
  id: 'part1' | 'part2';
  part: string;
  title: string;
  lead: string;
  items: IntroItem[];
  paper?: boolean;
}) {
  const [sel, setSel] = useState(0);
  const secRef = useRef<HTMLElement>(null);
  const fitRef = useRef<HTMLDivElement>(null);
  useFitScale(secRef, fitRef);
  const total = String(items.length).padStart(2, '0');
  return (
    <section ref={secRef} id={id} className={`rd-ls${paper ? ' rd-ls--paper' : ''}`} aria-labelledby={`${id}-title`}>
      <div className="rd-ls__fit" ref={fitRef}>
        <div className="rd-ls__inner">
          <div className="rd-ls__head">
            <p className="rd-t-eyebrow">{part}</p>
            <h2 className="rd-ls__title" id={`${id}-title`} tabIndex={-1}>{title}</h2>
            <p className="rd-ls__lead">{lead}</p>
          </div>
          <div className="rd-ls__body">
            <div className={`rd-ls__list${paper ? ' rd-ls__list--ruled' : ''}`}>
              {items.map((it, i) => (
                <React.Fragment key={it.title + i}>
                  {it.stage && (i === 0 || items[i - 1].stage !== it.stage) && <p className="rd-ls__stage">{it.stage}</p>}
                  <button type="button" className="rd-ls__row" aria-pressed={i === sel} onClick={() => setSel(i)}>
                    <span className="rd-ls__no">{String(i + 1).padStart(2, '0')}</span>
                    <span className="rd-ls__rowname">{it.title}</span>
                  </button>
                </React.Fragment>
              ))}
            </div>
            {/* 모든 항목의 상세를 같은 칸에 겹쳐 두고 고른 것만 보인다 — 칸 높이가 가장 긴 항목 기준으로 고정돼 고를 때 배율이 출렁이지 않는다(00-45 §6-1). */}
            <div className="rd-ls__stack">
              {items.map((it, i) => (
                <IntroDetail key={it.title + i} item={it} no={i + 1} total={total} active={i === sel} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function IntroDetail({ item, no, total, active }: { item: IntroItem; no: number; total: string; active: boolean }) {
  return (
    <div className={`rd-ls__detail${active ? '' : ' rd-ls__detail--ghost'}`} aria-hidden={active ? undefined : true}>
      <div className="rd-ls__img" role="img" aria-label={item.alt}>
        <span aria-hidden="true">[{item.title} 화면 이미지]</span>
      </div>
      <div className="rd-ls__nameline">
        <h3 className="rd-ls__name">{item.title}</h3>
        <span className="rd-ls__count">{String(no).padStart(2, '0')} / {total}</span>
      </div>
      <p className="rd-ls__desc">{item.desc}</p>
      <ul className="rd-ls__points">
        {item.points.map((p) => (
          <li key={p}>
            <span aria-hidden="true">·</span>
            <span>{p}</span>
          </li>
        ))}
      </ul>
      <RdTextLink className="rd-ls__cta" href={item.to} tabIndex={active ? undefined : -1}>{item.cta}</RdTextLink>
    </div>
  );
}

function DesktopLanding({ onEntry }: { onEntry: (opener: HTMLElement) => void }) {
  const heroRef = useRef<HTMLElement>(null);
  const heroFitRef = useRef<HTMLDivElement>(null);
  useFitScale(heroRef, heroFitRef);
  return (
    <>
      <section ref={heroRef} id="hero" className="rd-lh" aria-label="첫 화면">
        <button
          type="button"
          className="rd-ldown"
          aria-label="아래로 이어서 보기"
          onClick={() => jumpTo('part1', 'part1-title')}
        >
          <IconChevronDown size={22} />
        </button>
        <div className="rd-lh__fit" ref={heroFitRef}>
          <div className="rd-lh__inner">
            <div className="rd-lh__main" data-fit-guard>
              <p className="rd-t-eyebrow">생전 준비부터 임종 및 사후 정리까지</p>
              <h1 className="rd-lh__h1">장례가 전부가 아니었습니다.</h1>
              <BranchPair />
            </div>
            <QuickCard onEntry={onEntry} />
          </div>
        </div>
      </section>
      <DesktopIntro id="part1" part="제1부" title="생전 준비" lead={PART1_INTRO} items={PART1} paper />
      <DesktopIntro id="part2" part="제2부" title="임종 및 사후 정리" lead={PART2_INTRO} items={PART2} />
    </>
  );
}

// ── 모바일: 카드 한 장을 좌우로 밀어 넘기는 소개 칸 ──
function MobileIntro({
  id,
  part,
  title,
  items,
  paper,
  onDown,
}: {
  id: 'part1' | 'part2';
  part: string;
  title: string;
  items: IntroItem[];
  paper?: boolean;
  onDown?: () => void;
}) {
  const [i, setI] = useState(0);
  const startX = useRef<number | null>(null);
  const n = items.length;
  const cur = items[i];
  const go = useCallback((d: number) => setI((v) => (v + d + n) % n), [n]);

  return (
    <section id={id} className={`rd-lm${paper ? ' rd-lm--paper' : ''}`} aria-labelledby={`${id}-title`}>
      <div className="rd-lm__head">
        <p className="rd-t-eyebrow">{part}</p>
        <h2 className="rd-lm__title" id={`${id}-title`} tabIndex={-1}>{title}</h2>
      </div>
      <div
        className="rd-lm__card"
        tabIndex={0}
        role="group"
        aria-label={`${title} 기능 카드, 좌우로 밀거나 방향키로 넘깁니다`}
        onPointerDown={(e) => {
          startX.current = e.clientX;
        }}
        onPointerUp={(e) => {
          const s = startX.current;
          startX.current = null;
          if (s == null) return;
          const dx = e.clientX - s;
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
        }}
        onPointerCancel={() => {
          startX.current = null;
        }}
        // 키 처리는 이 카드에 초점이 있을 때만(전역 키 처리 금지, 00-45 §8-5)
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget) return;
          if (e.key === 'ArrowLeft') {
            e.preventDefault();
            go(-1);
          } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            go(1);
          }
        }}
      >
        <div className="rd-lm__img" role="img" aria-label={cur.alt}>
          <span aria-hidden="true">[{cur.title} 화면 이미지]</span>
        </div>
        <div className="rd-lm__nameline">
          <h3 className="rd-lm__name">{cur.title}</h3>
          <span className="rd-lm__count" aria-live="polite">{i + 1} / {n}</span>
        </div>
        <p className="rd-lm__desc">{cur.desc}</p>
        <ul className="rd-lm__points">
          {cur.points.map((p) => (
            <li key={p}>
              <span aria-hidden="true">·</span>
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="rd-lm__bar">
        <button type="button" className="rd-lm__step" aria-label="이전 기능" onClick={() => go(-1)}>
          <IconChevronLeft size={18} />
        </button>
        <a className="rd-lm__go" href={cur.to}>{cur.cta}</a>
        <button type="button" className="rd-lm__step" aria-label="다음 기능" onClick={() => go(1)}>
          <IconChevronRight size={18} />
        </button>
      </div>
      {onDown && (
        <button type="button" className="rd-ldown rd-ldown--m" aria-label="다음 화면으로" onClick={onDown}>
          <IconChevronDown size={24} />
        </button>
      )}
    </section>
  );
}

function MobileLanding({ onEntry }: { onEntry: (opener: HTMLElement) => void }) {
  const all = QUICK_PAGES.flat();
  return (
    <>
      <section id="hero" className="rd-lc rd-lc--hero" aria-label="첫 화면">
        <div className="rd-lc__hero">
          <p className="rd-t-eyebrow">생전 준비부터 임종 및 사후 정리까지</p>
          <h1 className="rd-lc__h1">
            장례가 전부가<br />아니었습니다.
          </h1>
          <p className="rd-lc__ask">어떤 일로 오셨나요?</p>
          <BranchPair />
        </div>
        <button type="button" className="rd-ldown rd-ldown--m" aria-label="다음 화면으로" onClick={() => jumpTo('quick', 'quick-title')}>
          <IconChevronDown size={24} />
        </button>
      </section>
      <section id="quick" className="rd-lc rd-lc--quick" aria-labelledby="quick-title">
        <div className="rd-lq rd-lq--m">
          <h2 className="rd-lq__title" id="quick-title" tabIndex={-1}>필요한 것만 바로 보기</h2>
          <ul className="rd-lq__grid">
            {all.map((it) => (
              <li key={it.name}>
                <QuickCell item={it} size={22} onEntry={onEntry} />
              </li>
            ))}
          </ul>
        </div>
        <button type="button" className="rd-ldown rd-ldown--m" aria-label="다음 화면으로" onClick={() => jumpTo('part1', 'part1-title')}>
          <IconChevronDown size={24} />
        </button>
      </section>
      <MobileIntro id="part1" part="제1부" title="생전 준비" items={PART1} paper onDown={() => jumpTo('part2', 'part2-title')} />
      <MobileIntro id="part2" part="제2부" title="임종 및 사후 정리" items={PART2} />
    </>
  );
}

// ── 추모관 링크로 입장 — 이어봄 입력 창(00-45 §5 · 00-44 §7-6) ──
function MemorialEntryDialog({ onClose }: { onClose: () => void }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  // 링크를 읽는 방식은 지금 홈(HomeDesktop·HomeMobile)의 handleMemorialLinkEnter 그대로다.
  const enter = () => {
    const raw = value.trim();
    if (!raw) {
      setError('받으신 추모관 링크를 입력해 주세요.');
      return;
    }
    const parsed = parseMemorialLink(raw);
    if (!parsed) {
      setError('추모관 링크 형식이 아닙니다. 받으신 링크를 다시 확인해 주세요.');
      return;
    }
    setError('');
    // 미리보기는 지금 화면과 다른 진입점이라 같은 출처여도 전체 이동으로 연다.
    window.location.href = parsed.isCrossOrigin ? raw : parsed.path;
  };

  return (
    <RdDialog
      width={560}
      form
      closeX
      title="추모관 링크로 입장"
      onClose={onClose}
      footer={
        <>
          <RdButton kind="secondary" place="dialog" onClick={onClose}>취소</RdButton>
          <RdButton place="dialog" onClick={enter}>입장</RdButton>
        </>
      }
    >
      <div className="rd-form">
        <RdField label="추모관 링크" help="문자나 카카오톡으로 받으신 추모관 링크를 붙여 넣어 주세요." error={error || undefined}>
          {(p) => (
            <RdInput
              {...p}
              value={value}
              placeholder="받으신 추모관 링크"
              autoComplete="off"
              onChange={(e) => {
                setValue(e.target.value);
                if (error) setError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') enter();
              }}
            />
          )}
        </RdField>
      </div>
    </RdDialog>
  );
}

export function LandingPage() {
  const phone = useIsPhone();
  const [entryOpen, setEntryOpen] = useState(false);
  const openerRef = useRef<HTMLElement | null>(null);

  const openEntry = useCallback((opener: HTMLElement) => {
    openerRef.current = opener;
    setEntryOpen(true);
  }, []);
  const closeEntry = useCallback(() => {
    setEntryOpen(false);
    openerRef.current?.focus();
  }, []);

  // 모바일은 세로 풀페이지 — 칸 맞춤은 이 화면에 있는 동안만 건다(00-45 §2).
  useEffect(() => {
    if (!phone) return;
    document.documentElement.classList.add('rd-landing-snap');
    return () => document.documentElement.classList.remove('rd-landing-snap');
  }, [phone]);

  // 주소 뒤 #part1-title · #part2-title 로 열면 그 구간으로 내려간다(옛 /prep · /bereaved 대응은 교체 때 라우터가 한다, 00-45 §8-6).
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash === 'part1-title') window.setTimeout(() => jumpTo('part1', 'part1-title'), 0);
    if (hash === 'part2-title') window.setTimeout(() => jumpTo('part2', 'part2-title'), 0);
  }, [phone]);

  return (
    <div className="rd-landing">
      {phone ? <MobileLanding onEntry={openEntry} /> : <DesktopLanding onEntry={openEntry} />}
      {entryOpen && <MemorialEntryDialog onClose={closeEntry} />}
    </div>
  );
}
