import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import '../../styles/design-v2.css';

interface LegalDocLayoutProps {
  title: string;
  effectiveDateLabel: string; // 예: "시행일: 추후 공지"
  children: React.ReactNode;
}

interface TocEntry {
  id: string;
  label: string;
}

// id 속성·스크롤 대상으로 쓸 조 제목 슬러그. 문서 안에서 제목이 겹치지 않으므로 이걸로 충분하다.
const slugify = (title: string) =>
  title
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-가-힣]/g, '');

// 좌측 목차용 항목을 children에서 뽑는다 — LegalChapter는 한 겹 더 들어가고, LegalArticle이
// 실제 항목이다(§9.2 ③). LOCATION_LEGAL_PUBLISHED로 조문 자체가 안 보이면 여기서도 자동으로 빠진다.
function collectTocEntries(children: React.ReactNode): TocEntry[] {
  const entries: TocEntry[] = [];
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    if (child.type === LegalArticle) {
      const title = (child.props as { title: string }).title;
      entries.push({ id: slugify(title), label: title });
    } else if (child.type === LegalChapter) {
      entries.push(...collectTocEntries((child.props as { children: React.ReactNode }).children));
    }
  });
  return entries;
}

// 법적 문서(약관·처리방침) 공용 레이아웃 — docs 00-19 / 00-21의 본문을 그대로 담는 화면.
// 두 문서 다 아직 v0.9 초안이라(docs 00-18 §8.1 게시 게이트 미통과) 상단에 준비중 배너를
// 고정한다. 실제 시행(v1.0) 전환 시 이 배너만 제거하면 된다.
// 00-39 §9.1 그룹③ — §6.7의 좌측 목차 골격(.v2-guide-shell/-toc/-main)은 그대로 쓰되, 조(條)
// 단위 구획은 .v2-section을 쓰지 않는다(§6.5 모바일 탭 전환 규칙과 묶여 있어 그대로 쓰면
// 탭이 없는 이 화면에서 본문이 통째로 사라진다 — 아래 v2-legal-* 는 그래서 새로 만든 것).
export const LegalDocLayout: React.FC<LegalDocLayoutProps> = ({ title, effectiveDateLabel, children }) => {
  const mainRef = useRef<HTMLDivElement | null>(null);
  const tocEntries = collectTocEntries(children);
  const tocKey = tocEntries.map((e) => e.id).join('|');
  const [activeId, setActiveId] = useState<string>(tocEntries[0]?.id ?? '');

  useEffect(() => {
    const container = mainRef.current;
    if (!container || !tocKey) return;
    const sections = tocKey
      .split('|')
      .map((id) => container.querySelector<HTMLElement>(`#${CSS.escape(id)}`))
      .filter((el): el is HTMLElement => Boolean(el));
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (observerEntries) => {
        const visible = observerEntries.filter((e) => e.isIntersecting);
        if (visible.length === 0) return;
        const topMost = visible.reduce((a, b) => (a.boundingClientRect.top < b.boundingClientRect.top ? a : b));
        if (topMost.target.id) setActiveId(topMost.target.id);
      },
      { rootMargin: '-96px 0px -70% 0px', threshold: 0 }
    );
    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [tocKey]);

  const scrollToEntry = (id: string) => {
    mainRef.current?.querySelector(`#${CSS.escape(id)}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveId(id);
  };

  return (
    <div className="v2-page">
      <div className="v2-page-head">
        <h1 className="v2-page-title">{title}</h1>
        <p className="v2-page-subtitle">{effectiveDateLabel}</p>
      </div>

      <div className="v2-legal-draft-banner">
        <AlertTriangle size={22} className="v2-legal-draft-icon" />
        <div>
          <strong className="v2-legal-draft-title">시행 준비 중 — 공식 게시본이 아닙니다</strong>
          <p className="v2-legal-draft-desc">아래 내용은 공식 시행 전 초안이며, 일부 항목은 확정되는 대로 채워집니다.</p>
        </div>
      </div>

      <div className="v2-guide-shell">
        <div className="v2-guide-main" ref={mainRef}>
          {children}

          <div className="v2-legal-back">
            <Link to="/" className="v2-legal-back-link">
              ← 이어봄 홈으로
            </Link>
          </div>
        </div>

        {tocEntries.length > 0 && (
          <nav className="v2-guide-toc" aria-label="조문 목차">
            {tocEntries.map((entry) => (
              <button
                key={entry.id}
                type="button"
                className={`v2-toc-item${activeId === entry.id ? ' is-current' : ''}`}
                onClick={() => scrollToEntry(entry.id)}
              >
                <span>{entry.label}</span>
              </button>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
};

// 조(條) 단위 섹션 — 제목(h2) + 본문. id는 좌측 목차의 스크롤 대상이다.
export const LegalArticle: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section id={slugify(title)} className="v2-legal-article">
    <div className="v2-legal-article-head">
      <h2 className="v2-legal-article-title">{title}</h2>
    </div>
    <div className="v2-legal-article-body v2-prose">{children}</div>
  </section>
);

// 장(章) 단위 구분 — 여러 조를 묶는 표제.
export const LegalChapter: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="v2-legal-chapter">
    <h3 className="v2-legal-chapter-title">{title}</h3>
    {children}
  </div>
);

// 항 번호가 매겨진 목록 — 법령 표기(1. 2. 3.)와 시각적으로 맞춘 순서 목록.
export const LegalList: React.FC<{ children: React.ReactNode }> = ({ children }) => <ol className="v2-legal-list">{children}</ol>;

// 표 — 처리 목적/보유기간 등 표 형태 조항용.
export const LegalTable: React.FC<{ headers: string[]; rows: (string | React.ReactNode)[][] }> = ({ headers, rows }) => (
  <div className="v2-legal-table-wrap">
    <table className="v2-legal-table">
      <thead>
        <tr>
          {headers.map((h) => (
            <th key={h}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            {row.map((cell, j) => (
              <td key={j}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// 항 안에 오는 호(號) 하위 목록 — 예: 5조 5호처럼 항 텍스트 아래 한 단 더 들여쓴 목록.
export const LegalSubList: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ul className="v2-legal-sublist">{children}</ul>
);
