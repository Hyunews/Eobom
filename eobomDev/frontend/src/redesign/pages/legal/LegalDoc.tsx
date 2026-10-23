import React, { useEffect, useRef, useState } from 'react';
import { RdButton, RdTextLink } from '../../parts/RdButtons';
import { RdPageHead } from '../../parts/RdNav';
import { RdDialog } from '../../parts/RdModal';
import { RdNotice } from '../../parts/RdNotices';
import { useIsPhone } from '../../useIsPhone';
import './legal.css';

// 8단계 묶음 9 — 법적 문서(이용약관·처리방침) 공통 틀. 정본: 00-21 §0.4(두 화면 공통) · 5단계 캔버스 판 5-1~5-3.
// 지금 LegalDocLayout 과 같은 쓰임(조 단위 목차 자동 수집)이되, 새 값으로 처음부터 그린다. 지금 화면 파일은 고치지 않는다.
// 10단계 교체 때 바꿀 것: 아래 두 주소를 실제 주소(/privacy · /)로.
export const LEGAL_PATH = { privacy: '/preview/privacy', home: '/preview/landing' } as const;

interface TocEntry {
  id: string;
  label: string;
}

// id 속성·스크롤 대상으로 쓸 조 제목 슬러그. 한 문서 안에서 제목이 겹치지 않는다.
const slugify = (title: string) => `lg-${title.trim().replace(/\s+/g, '-').replace(/[^\w\-가-힣]/g, '')}`;

// 목차용 항목을 children 에서 뽑는다 — 장은 한 겹 더 들어가고 조가 실제 항목이다(장 제목은 목차에 안 들어감).
// LOCATION_LEGAL_PUBLISHED 로 제6장이 안 그려지면 여기서도 자동으로 빠진다.
function collectTocEntries(children: React.ReactNode): TocEntry[] {
  const entries: TocEntry[] = [];
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    if (child.type === RdLegalArticle) {
      const title = (child.props as { title: string }).title;
      entries.push({ id: slugify(title), label: title });
    } else if (child.type === RdLegalChapter) {
      entries.push(...collectTocEntries((child.props as { children: React.ReactNode }).children));
    }
  });
  return entries;
}

const scrollBehavior = (): ScrollBehavior => (window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth');

// "본문만 보기" 겉틀(00-21 §0.4 로그인 창 [보기]) — 목차·홈 링크를 빼고 표를 모바일 규칙으로 그린다.
// 본문 안 링크(제4조 → 처리방침)는 주소로 나가지 않고 onNavigate 로 넘긴다.
export interface LegalBare {
  title: string;
  onNavigate?: (href: string) => void;
}
const LegalBareContext = React.createContext<LegalBare | null>(null);

export function RdLegalDoc({ title, effectiveDateLabel, bare, children }: { title: string; effectiveDateLabel: string; bare?: LegalBare; children: React.ReactNode }) {
  const mainRef = useRef<HTMLDivElement | null>(null);
  const phone = useIsPhone();
  const entries = bare ? [] : collectTocEntries(children);
  const tocKey = entries.map((e) => e.id).join('|');
  const [activeId, setActiveId] = useState<string>(entries[0]?.id ?? '');
  const [sheet, setSheet] = useState(false);
  const navRef = useRef<HTMLElement | null>(null);

  // 읽는 자리에 따라 강조가 바뀐다.
  useEffect(() => {
    const container = mainRef.current;
    if (!container || !tocKey) return;
    const sections = tocKey
      .split('|')
      .map((id) => container.querySelector<HTMLElement>(`#${CSS.escape(id)}`))
      .filter((el): el is HTMLElement => Boolean(el));
    if (sections.length === 0) return;
    const observer = new IntersectionObserver(
      (hits) => {
        const visible = hits.filter((h) => h.isIntersecting);
        if (visible.length === 0) return;
        const top = visible.reduce((a, b) => (a.boundingClientRect.top < b.boundingClientRect.top ? a : b));
        if (top.target.id) setActiveId(top.target.id);
      },
      { rootMargin: '-24px 0px -70% 0px', threshold: 0 },
    );
    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [tocKey]);

  // 강조된 줄이 목차 안 스크롤 밖으로 나가 있으면 안으로 끌어온다(목차가 560 을 넘는 경우).
  useEffect(() => {
    const nav = navRef.current;
    const cur = nav?.querySelector<HTMLElement>('[aria-current="true"]');
    if (!nav || !cur) return;
    const top = cur.offsetTop;
    const bottom = top + cur.offsetHeight;
    if (top < nav.scrollTop) nav.scrollTop = top;
    else if (bottom > nav.scrollTop + nav.clientHeight) nav.scrollTop = bottom - nav.clientHeight;
  }, [activeId]);

  const go = (id: string) => {
    mainRef.current?.querySelector(`#${CSS.escape(id)}`)?.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
    setActiveId(id);
  };

  const pick = (id: string) => {
    setSheet(false);
    // 판이 닫히며 본문 스크롤 잠금이 풀린 뒤에 올린다.
    window.setTimeout(() => go(id), 60);
  };

  return (
    <LegalBareContext.Provider value={bare ?? null}>
    <div className={bare ? 'rd-lg rd-lg--bare' : 'rd-container rd-screen rd-lg'}>
      <RdPageHead title={bare ? bare.title : title} desc={effectiveDateLabel} />

      <div className="rd-lg__shell">
        <div className="rd-lg__main" ref={mainRef}>
          <RdNotice title="시행 준비 중(공식 게시본 아님)">아래 내용은 공식 시행 전 초안이며, 일부 항목은 확정되는 대로 채워집니다.</RdNotice>

          <div className="rd-lg__body">{children}</div>

          {!bare && (
            <div className="rd-lg__back">
              <RdTextLink href={LEGAL_PATH.home}>이어봄 홈으로</RdTextLink>
            </div>
          )}
        </div>

        {entries.length > 0 && !phone && (
          <nav className="rd-lg__toc" aria-label="조문 목차" ref={navRef}>
            {entries.map((e) => (
              <button key={e.id} type="button" className="rd-lg__toc-item" aria-current={activeId === e.id ? 'true' : undefined} onClick={() => go(e.id)}>
                <span className="rd-lg__toc-mark" aria-hidden="true" />
                <span>{e.label}</span>
              </button>
            ))}
          </nav>
        )}
      </div>

      {entries.length > 0 && phone && !sheet && (
        <button type="button" className="rd-lg__toc-open" onClick={() => setSheet(true)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
            <path d="M5 7h14M5 12h14M5 17h9" />
          </svg>
          목차
        </button>
      )}

      {sheet && (
        <RdDialog title="조문 목차" onClose={() => setSheet(false)} footer={<RdButton place="dialog" onClick={() => setSheet(false)}>닫기</RdButton>}>
          <ul className="rd-lg__sheet-list">
            {entries.map((e) => (
              <li key={e.id}>
                <button type="button" className="rd-lg__sheet-item" aria-current={activeId === e.id ? 'true' : undefined} onClick={() => pick(e.id)}>
                  <span className="rd-lg__toc-mark" aria-hidden="true" />
                  <span>{e.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </RdDialog>
      )}
    </div>
    </LegalBareContext.Provider>
  );
}

// 장(章) — 여러 조를 묶는 표제. 구간 머리 모양(먹색 실선 아래).
export function RdLegalChapter({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rd-lg__chapter">
      <h3 className="rd-lg__chapter-title">{title}</h3>
      {children}
    </div>
  );
}

// 조(條) — 제목 + 본문. id 는 목차의 스크롤 대상이다.
export function RdLegalArticle({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section id={slugify(title)} className="rd-lg__article">
      <h2 className="rd-lg__article-title">{title}</h2>
      <div className="rd-lg__article-body">{children}</div>
    </section>
  );
}

// 항 번호가 붙는 목록(1. 2. 3.). 번호는 CSS 카운터.
export function RdLegalList({ children }: { children: React.ReactNode }) {
  return <ol className="rd-lg__list">{children}</ol>;
}

// 항 안의 호 목록 — 갈색 작은 네모.
export function RdLegalSubList({ children }: { children: React.ReactNode }) {
  return <ul className="rd-lg__sublist">{children}</ul>;
}

// 하위 제목(17).
export function RdLegalSubhead({ children }: { children: React.ReactNode }) {
  return <h3 className="rd-lg__subhead">{children}</h3>;
}

// 부연 글(14, 옅게).
export function RdLegalNote({ children }: { children: React.ReactNode }) {
  return <p className="rd-lg__note">{children}</p>;
}

// 본문 안 링크 — 갈색 + 밑줄.
export function RdLegalLink({ href, children }: { href: string; children: React.ReactNode }) {
  const bare = React.useContext(LegalBareContext);
  const onClick = bare?.onNavigate
    ? (e: React.MouseEvent) => {
        e.preventDefault();
        bare.onNavigate?.(href);
      }
    : undefined;
  return (
    <a className="rd-lg__link" href={href} onClick={onClick}>
      {children}
    </a>
  );
}

/**
 * 표 — 00-21 §0.4. 머리줄 = 눌린 바탕 + 위 먹색 실선.
 * 2열은 첫 칸 폭 한 가지(데스크톱 160 · 모바일 96). 3열 이상은 모바일에서 줄마다 세로로 쌓는다(칸 이름 + 값, 첫 칸 값은 중간 굵기).
 * widths = 데스크톱 칸 폭(마지막 칸은 나머지). 4열 이상은 "넓은 표"라 글자 14 · 칸 안 여백 10.
 */
export function RdLegalTable({ headers, rows, widths }: { headers: string[]; rows: React.ReactNode[][]; widths?: number[] }) {
  const cols = headers.length;
  const stack = cols >= 3;
  const wide = cols >= 4;
  // 쌓은 줄의 칸 이름 폭 = 그 표의 가장 긴 칸 이름에 맞춘다(세 글자 이하면 56, 그 위는 96 — 판 5-2).
  const longest = Math.max(...headers.map((h) => h.length));
  const style = { ['--lg-label-w' as string]: `${longest <= 3 ? 56 : 96}px` } as React.CSSProperties;
  const colW = widths ?? (cols === 2 ? [160] : cols === 3 ? [160] : []);
  return (
    <table className={['rd-lg__table', stack && 'rd-lg__table--stack', wide && 'rd-lg__table--wide'].filter(Boolean).join(' ')} style={style}>
      <thead>
        <tr>
          {headers.map((h, i) => (
            <th key={h} scope="col" style={colW[i] ? { width: colW[i] } : undefined}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            {row.map((cell, j) => (
              <td key={j} data-label={headers[j]}>
                <span className="rd-lg__cell">{cell}</span>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
