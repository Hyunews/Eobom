import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ExternalLink, ChevronRight } from 'lucide-react';
import careGuideTasksData from '../mockData/careGuideTasks.json';
import { getLegalLink } from '../lib/legalLink';
import '../styles/design-v2.css';
import { backdropCloseProps } from '../utils/backdropClose';
import { PageLink } from '../components/common/PageLink';
import { apiFetch } from '../lib/api';

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
  label: string; // 모바일 탭·웹 좌측 목차
  title?: string; // 구간 제목 — 없으면 label (07-02 §2-1ⓒ 2026-10-08: 3개월만 기산점을 제목에 적는다)
  ids: number[];
}
const TIME_SECTIONS: TimeSection[] = [
  { key: 'funeral', label: '장례 기간 (즉시)', ids: [2, 5, 1, 3, 4, 23] },
  // id 7(안심상속)은 사망신고 때 함께 신청하므로 사망신고(6) 바로 뒤 — 07-02 §2-1ⓒ 2026-10-08
  { key: 'month1', label: '1개월 이내', ids: [6, 7, 8] },
  { key: 'month3', label: '3개월', title: '3개월 — 상속개시·채무초과를 안 날부터', ids: [9, 10, 11, 12] },
  { key: 'month6', label: '6개월', ids: [13, 14, 15, 16, 17] },
  { key: 'later', label: '이후/수시로', ids: [20, 21, 22, 18, 19] },
];

// docs/00_핵심플랫폼/00-39 §6-3~§6-14 — 값과 클래스는 styles/design-v2.css(:root --v2-*)가
// 정본. 이 페이지가 그룹①(목록·체크리스트)의 대표이고, 여기서 뽑힌 클래스를
// facility·counseling·pickup·my-obituaries가 그대로 이어 쓴다(§9.1).
export const CareGuidePage: React.FC<CareGuidePageProps> = ({ setActiveTab, currentUser, onOpenLogin }) => {
  const [tasks, setTasks] = useState<CareGuideTask[]>(careGuideTasksData as CareGuideTask[]);
  const [modalTaskId, setModalTaskId] = useState<number | null>(null);
  const [activeSectionKey, setActiveSectionKey] = useState<string>(TIME_SECTIONS[0].key);
  const inheritanceRef = useRef<HTMLDivElement | null>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isMember = Boolean(currentUser);

  const setChecked = (id: number, checked: boolean) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, checked } : t)));
  };

  // 07-04 §3.4 — 회원은 진입 시 서버 값으로 체크 표시, 비회원·로그아웃은 전부 미체크(state뿐).
  // 🔴 §3.4-1 — 어떤 항목을 체크했는지는 로그·에러 리포트에 남기지 않는다: 실패해도 id·목록을 찍지 않는다.
  useEffect(() => {
    let cancelled = false;
    if (!isMember) {
      setTasks((prev) => prev.map((t) => ({ ...t, checked: false })));
      return;
    }
    apiFetch<{ taskIds: number[] }>('/api/me/care-guide', 'USER')
      .then((data) => {
        if (cancelled) return;
        const checkedIds = new Set(data.taskIds);
        setTasks((prev) => prev.map((t) => ({ ...t, checked: checkedIds.has(t.id) })));
      })
      .catch(() => {
        /* 조회 실패 시 미체크로 둔다 — 화면은 그대로 쓸 수 있다 */
      });
    return () => {
      cancelled = true;
    };
  }, [isMember]);

  // 회원: 누를 때마다 저장(체크 = PUT, 해제 = DELETE·행 삭제). 실패하면 화면을 되돌려 저장된 것처럼 보이지 않게 한다.
  const toggleTask = (id: number) => {
    const next = !tasks.find((t) => t.id === id)?.checked;
    setChecked(id, next);
    if (!isMember) return;
    apiFetch(`/api/me/care-guide/${id}`, 'USER', { method: next ? 'PUT' : 'DELETE' }).catch(() => setChecked(id, !next));
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
  // 🔄 2026-09-18 사람 지시 — 모바일은 스크롤로 다음 구간이 "내려오지" 않는다. 탭을 누르면
  // 그 구간만 보이고 나머지는 CSS(design-v2.css `.v2-section`)가 숨긴다(모든 걸 한 페이지에
  // 담지 않는다). 이 옵저버는 웹 좌측 목차의 스크롤 스파이 전용 — 모바일은 항상 activeSectionKey
  // 하나만 화면에 있어 관찰해도 자기 자신만 다시 확인하는 것이라 무해하다.
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
          {/* §3.1 최상단 고정 배너 — 유족은 끝까지 스크롤하지 않는다. 리본형(위아래 1.5px 선만).
              모바일은 통째로 숨긴다(design-v2.css, 2026-09-18 사람 지시). */}
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
              {/* 🔄 09-29 — 이동은 링크(00-34 §2.2). counseling은 loginRequired(modeNav.ts) */}
              <PageLink
                to="/counseling"
                className="v2-btn-solid"
                loginRequired
                currentUser={currentUser}
                onOpenLogin={onOpenLogin}
                onNavigate={() => setActiveTab?.('counseling')}
              >
                전문가 상담
              </PageLink>
            </div>
          </div>

          {/* 모바일 전용 — 좌측 목차 대신 가로 탭(§7). 스크롤 앵커가 아니라 구간 전환(탭당
              하나만 표시, 2026-09-18 사람 지시) */}
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

          {/* 07-04 §4.3(2026-09-30 개발자 결정) — 모바일은 배너를 숨기므로 3개월 기한을 한 줄로 알린다.
              3개월 탭에서는 항목이 그대로 보이므로 숨긴다. 데스크톱은 CSS가 숨김(기존 배너가 그 역할). */}
          {activeSectionKey !== 'month3' && (
            <button type="button" className="v2-mobile-alert" onClick={() => scrollToSection('month3')}>
              상속포기·한정승인 기한은 3개월입니다 ›
            </button>
          )}

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
                className={`v2-section${activeSectionKey === section.key ? ' is-active-section' : ''}`}
                data-section-key={section.key}
                ref={(el) => {
                  sectionRefs.current[section.key] = el;
                }}
              >
                <div className="v2-section-head">
                  <h2 className="v2-section-title">{section.title ?? section.label}</h2>
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
                            {/* 07-02 §2-1ⓒ — 배지만 보면 뜻이 달라지는 3건(id 11·13·17)만 원문 한 줄 */}
                            {t.deadlineOriginalRequired && <span className="v2-item-deadline-note">{t.deadlineLabel}</span>}
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
          {!isMember && <p className="v2-footnote">로그인하면 체크한 항목이 저장됩니다.</p>}
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
        <div className="v2-modal-overlay" role="dialog" aria-modal="true" {...backdropCloseProps(() => setModalTaskId(null))}>
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
