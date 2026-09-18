import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ExternalLink, ChevronRight } from 'lucide-react';
import careGuideTasksData from '../mockData/careGuideTasks.json';
import { getLegalLink } from '../lib/legalLink';
import '../styles/design-v2.css';

interface CareGuideTask {
  id: number;
  category: string;
  title: string;
  deadlineLabel: string;
  // 07-02 §2-1 — 배지용 축약(6자 이내). 없으면 deadlineLabel을 그대로 쓴다(옵셔널 폴백).
  deadlineShort?: string;
  deadlineBase: string;
  severity: 'CRITICAL' | 'NORMAL' | 'INFO';
  legalBasis: string;
  verified: boolean;
  // 00-39 §8 항목3 — 화면에 더 이상 쓰지 않지만 07-02가 검증한 내용 자산이라 필드는 남긴다.
  irreversibleNote?: string;
  needsExpertHelp?: boolean;
  linkTo?: string;
  externalUrl?: string;
  conditional?: boolean;
  note?: string;
  checked: boolean;
  deadlineOriginalRequired?: boolean;
}

// 배지 텍스트 — deadlineShort 우선, 없으면 원문(07-02 §2-1 옵셔널 폴백).
const getBadgeText = (t: CareGuideTask): string => t.deadlineShort ?? t.deadlineLabel;

interface CareGuidePageProps {
  currentUser?: string | null;
  onOpenLogin?: () => void;
  setActiveTab?: (tab: string) => void;
}

// docs/07_상중_행정_케어/07-04 §4.1 — 정렬축은 severity 그룹이 아니라 시간축 5구간이다
// (사망일은 받지 않으므로 구간은 전부 상대 표현). 00-39 §7 — 이 5구간이 곧 웹 좌측 목차·
// 모바일 상단 가로 탭의 항목이 된다(둘이 같은 기준을 쓴다).
interface TimeSection {
  key: string;
  label: string;
  ids: number[];
}
const TIME_SECTIONS: TimeSection[] = [
  { key: 'funeral', label: '장례 기간 (즉시)', ids: [2, 5, 1, 3, 4, 23] },
  { key: 'month1', label: '1개월 이내', ids: [6, 8] },
  { key: 'month3', label: '3개월', ids: [7, 9, 10, 11, 12] },
  { key: 'month6', label: '6개월', ids: [13, 14, 15, 16, 17] },
  { key: 'later', label: '이후/수시로', ids: [20, 21, 22, 18, 19] },
];

// docs/00_핵심플랫폼/00-39 §6-3~§6-14 — 값과 클래스는 styles/design-v2.css(:root --v2-*)가
// 정본. 이 페이지가 그룹①(목록·체크리스트)의 대표이고, 여기서 뽑힌 클래스를
// facility·counseling·pickup·my-obituaries가 그대로 이어 쓴다(§9.1).
export const CareGuidePage: React.FC<CareGuidePageProps> = ({ setActiveTab }) => {
  const [tasks, setTasks] = useState<CareGuideTask[]>(careGuideTasksData as CareGuideTask[]);
  const [modalTaskId, setModalTaskId] = useState<number | null>(null);
  const [activeSectionKey, setActiveSectionKey] = useState<string>(TIME_SECTIONS[0].key);
  const inheritanceRef = useRef<HTMLDivElement | null>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const toggleTask = (id: number) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, checked: !t.checked } : t)));
  };

  const sectionsWithItems = useMemo(
    () =>
      TIME_SECTIONS.map((section) => ({
        ...section,
        items: section.ids
          .map((id) => tasks.find((t) => t.id === id))
          .filter((t): t is CareGuideTask => Boolean(t)),
      })).filter((s) => s.items.length > 0),
    [tasks]
  );

  // 00-39 §7 — 구간 이동은 웹 좌측 목차(세로)·모바일 상단 탭(가로) 둘 다 같은 상태를 공유한다.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length === 0) return;
        const topMost = visible.reduce((a, b) => (a.boundingClientRect.top < b.boundingClientRect.top ? a : b));
        const key = topMost.target.getAttribute('data-section-key');
        if (key) setActiveSectionKey(key);
      },
      { rootMargin: '-96px 0px -70% 0px', threshold: 0 }
    );
    Object.values(sectionRefs.current).forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [sectionsWithItems]);

  const scrollToSection = (key: string) => {
    sectionRefs.current[key]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveSectionKey(key);
  };

  const modalTask = tasks.find((t) => t.id === modalTaskId) || null;
  const modalLegal = modalTask ? getLegalLink(modalTask) : null;

  return (
    <div className="v2-page">
      <div className="v2-page-head">
        <h1 className="v2-page-title">상중 행정 가이드</h1>
        <p className="v2-page-subtitle">사망 후 꼭 해야 할 행정절차를 순서대로 확인하세요.</p>
      </div>

      <div className="v2-guide-shell">
        <div className="v2-guide-main">
          {/* §3.1 최상단 고정 배너 — 유족은 끝까지 스크롤하지 않는다. 리본형(위아래 1.5px 선만) */}
          <div className="v2-callout">
            <div>
              <p className="v2-callout-title">고인에게 빚이 있을 수 있다면, 3개월 안에 결정해야 합니다.</p>
              <p className="v2-callout-desc">상속포기·한정승인 기한은 상속개시를 안 날로부터 3개월입니다.</p>
            </div>
            <div className="v2-callout-actions">
              <button
                type="button"
                className="v2-btn-outline"
                onClick={() => inheritanceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              >
                내용 보기
              </button>
              <button type="button" className="v2-btn-solid" onClick={() => setActiveTab?.('counseling')}>
                전문가 상담
              </button>
            </div>
          </div>

          {/* 모바일 전용 — 좌측 목차 대신 가로 탭(§7) */}
          <div className="v2-mobile-tabs">
            {sectionsWithItems.map((s) => (
              <button
                key={s.key}
                type="button"
                className={`v2-mobile-tab${activeSectionKey === s.key ? ' is-active' : ''}`}
                onClick={() => scrollToSection(s.key)}
              >
                {s.label}
              </button>
            ))}
          </div>

          {sectionsWithItems.map((section) => {
            const categoryOrder: string[] = [];
            const byCategory = new Map<string, CareGuideTask[]>();
            section.items.forEach((t) => {
              if (!byCategory.has(t.category)) {
                byCategory.set(t.category, []);
                categoryOrder.push(t.category);
              }
              byCategory.get(t.category)!.push(t);
            });
            const showCategoryHeader = categoryOrder.length > 1;

            return (
              <div
                key={section.key}
                className="v2-section"
                data-section-key={section.key}
                ref={(el) => {
                  sectionRefs.current[section.key] = el;
                }}
              >
                <div className="v2-section-head">
                  <h2 className="v2-section-title">{section.label}</h2>
                  <span className="v2-section-count">({section.items.length})</span>
                </div>

                {categoryOrder.map((category) => {
                  const items = byCategory.get(category)!;
                  const isInheritanceSet = category === '상속 승인·포기';

                  return (
                    <div key={category} ref={isInheritanceSet ? inheritanceRef : undefined}>
                      {showCategoryHeader && <div className="v2-category-label">{category}</div>}

                      {items.map((t) => (
                        <div key={t.id} className={`v2-item-row${t.checked ? ' is-checked' : ''}`}>
                          <input
                            type="checkbox"
                            className="v2-item-checkbox"
                            checked={t.checked}
                            onChange={() => toggleTask(t.id)}
                            aria-label={`${t.title} 완료 표시`}
                          />
                          <button type="button" className="v2-item-main" onClick={() => setModalTaskId(t.id)}>
                            {t.severity === 'CRITICAL' && <span className="v2-item-urgent-flag">되돌릴 수 없음</span>}
                            <span className="v2-item-title">{t.title}</span>
                          </button>
                          <span className="v2-item-deadline" title={t.deadlineLabel}>
                            {getBadgeText(t)}
                          </span>
                          <ChevronRight size={16} className="v2-row-chevron" />
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            );
          })}

          <p className="v2-footnote">
            이 체크리스트는 일반적인 안내이며 개별 사정에 따라 다를 수 있습니다. 정확한 기한 판단은
            전문가 상담을 이용하세요.
          </p>
        </div>

        <nav className="v2-guide-toc" aria-label="기한별 목차">
          {sectionsWithItems.map((s) => (
            <button
              key={s.key}
              type="button"
              className={`v2-toc-item${activeSectionKey === s.key ? ' is-current' : ''}`}
              onClick={() => scrollToSection(s.key)}
            >
              <span>{s.label}</span>
              <span className="v2-toc-count">{s.items.length}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* §6.4 모달 — 제목·기한·근거 세 줄뿐(규칙10), 해설·조언 문장 없음(규칙11).
          모바일은 CSS(design-v2.css)가 같은 마크업을 바텀시트로 바꾼다. */}
      {modalTask && (
        <div className="v2-modal-overlay" role="dialog" aria-modal="true" onClick={() => setModalTaskId(null)}>
          <div className="v2-modal" onClick={(e) => e.stopPropagation()}>
            {modalTask.severity === 'CRITICAL' && <p className="v2-modal-eyebrow">되돌릴 수 없음</p>}
            <h3 className="v2-modal-title">{modalTask.title}</h3>

            <div className="v2-modal-row">
              <span className="v2-modal-label">기한</span>
              <span className="v2-modal-value">
                {modalTask.deadlineLabel}
                {modalTask.deadlineBase !== '-' ? ` (${modalTask.deadlineBase} 기준)` : ''}
              </span>
            </div>

            {modalLegal && (
              <div className="v2-modal-row">
                <span className="v2-modal-label">근거</span>
                <span className="v2-modal-value">
                  {modalLegal.href ? (
                    <a className="v2-modal-basis-link" href={modalLegal.href} target="_blank" rel="noreferrer">
                      {modalLegal.baseLabel} <ExternalLink size={13} />
                    </a>
                  ) : (
                    modalLegal.baseLabel
                  )}
                  {modalLegal.extra && <span className="v2-modal-extra"> ({modalLegal.extra})</span>}
                </span>
              </div>
            )}

            <button type="button" className="v2-modal-close" onClick={() => setModalTaskId(null)}>
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
