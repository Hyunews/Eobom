import React, { useState, useRef } from 'react';
import { CheckSquare, ExternalLink, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import careGuideTasksData from '../mockData/careGuideTasks.json';
import { ChecklistShieldIcon } from '../components/MenuIcons';

interface CareGuideTask {
  id: number;
  category: string;
  title: string;
  deadlineLabel: string;
  deadlineBase: string;
  severity: 'CRITICAL' | 'NORMAL' | 'INFO';
  legalBasis: string;
  verified: boolean;
  irreversibleNote?: string;
  needsExpertHelp?: boolean;
  linkTo?: string;
  externalUrl?: string;
  conditional?: boolean;
  note?: string;
  checked: boolean;
}

interface CareGuidePageProps {
  currentUser?: string | null;
  onOpenLogin?: () => void;
  setActiveTab?: (tab: string) => void;
}

// docs/07_상중_행정_케어/07-04 §4.1 — 정렬축을 severity 그룹에서 시간축 5구간으로 바꾼다
// (07-01 §4.2가 지시해 두고 미이행이던 것 — 사망일은 받지 않으므로 구간은 전부 상대 표현).
// 구간 안의 순서는 §4.2대로 "구간 → severity(CRITICAL→NORMAL→INFO) → 기한"이고, 이 판단은
// 07-02 §2 흐름과 이미 일치해 각 구간의 id를 그 순서 그대로 나열해 둔다(런타임 재정렬 불필요).
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

// 07-04 §5.1 — 항목 단위 강조는 여전히 severity 기준이라(구간과는 독립 축) 매핑은 남긴다.
// 색만으로 구분하지 않는다(00-23 §8.7) — ⭐ 기호 + 글자 배지 + 좌측 테두리 3중으로 겹친다.
const SEVERITY_LABEL: Record<CareGuideTask['severity'], { title: string; desc: string; color: string; bg: string }> = {
  // 빨간색은 "위험/응급" 톤이 너무 강해 유족에게 불쾌감을 줄 수 있다는 개발자 피드백(2026-08-14)
  // 으로 짙은 앰버(주황)로 교체 — 강조는 유지하되 경보음보다는 "중요 안내" 톤. "확인 필요" 배지
  // (연한 노란빛 amber var(--state-warn-bg)/var(--state-warn-fg))와는 톤을 달리해서 겹칠 때도 구분되게 한다.
  CRITICAL: { title: '되돌릴 수 없는 것', desc: '기한을 놓치면 되돌릴 방법이 없습니다', color: 'var(--state-critical-fg)', bg: 'var(--state-critical-bg)' },
  NORMAL: { title: '과태료·가산세', desc: '기한을 놓치면 불이익이 있지만 되돌릴 수는 있습니다', color: 'var(--point-color)', bg: '#EAE5DC' },
  INFO: { title: '실무 편의', desc: '기한 압박은 없지만 정리해두면 좋습니다', color: 'var(--text-muted)', bg: 'var(--surface-subtle)' },
};
// 좌측 테두리로 severity를 항상(펼치지 않아도) 드러낸다 — CRITICAL은 굵게 + ⭐배지,
// INFO는 흐리게, NORMAL은 표시 없음(§5.1 3단 표기).
const EMPHASIS_BORDER: Record<CareGuideTask['severity'], string | undefined> = {
  CRITICAL: `4px solid ${SEVERITY_LABEL.CRITICAL.color}`,
  NORMAL: undefined,
  INFO: '3px solid var(--secondary-dark)',
};

const LINK_LABEL: Record<string, string> = {
  facility: '장사시설 찾기 →',
  counseling: '전문가 상담 →',
  'digital-estate': '디지털 정산으로 →',
};

// 08-19 8차(개발자 직접 지시) — "모바일 부고장 간편 작성"은 별도 도메인(ObituaryPage,
// tab: 'obituary')으로 분리했다. 이 페이지(07-02 체크리스트)는 원칙상 로그인 없이 열람돼야
// 하므로(00-26 §7.3, 07-02 원칙), 로그인이 필요한 부고장 전송 기능과 한 화면에 섞어두지 않는다.
// 08-19 11차(개발자 직접 지시) — 부고장 카드(잔재)까지 완전히 제거하고, 체크리스트가 전체
// 폭을 쓰도록 바꿈.
// 08-19 12차 — "카테고리 헤더가 전체 폭을 걸치는" 구조는 신고·조회(1~2건)·장례 단계(1건)처럼
// 짧은 카테고리도 매번 줄바꿈을 강제해 스크롤이 쓸데없이 길어졌다. 심각도(순위) 섹션 안에서
// 카테고리 자체를 "칸반형" 컬럼으로 나란히 배치하도록 바꿨다.
// 08-19 13차 — 그런데 CSS Grid는 행 단위 배치라, 카테고리별 항목 수가 들쭉날쭉하면(1건~4건)
// 짧은 컬럼 아래 여백이 그대로 남는 문제가 있었다. 이후 CSS 다단(columns)으로 바꿨으나,
// 다단은 "위→아래로 채우고 넘치면 다음 단" 순서라 카테고리 수가 적은 구간에서는 가로 여백이
// 남아도 다음 박스가 그 옆으로 오지 않고 전부 세로로 쌓였다(사용자 지적, 2026-08-31).
// index.css `.care-guide-columns`/`.care-guide-category`를 flex-wrap으로 다시 교체 —
// 가로 여유가 있으면 옆으로 나열되고, 없으면 다음 줄로 넘어간다.
export const CareGuidePage: React.FC<CareGuidePageProps> = ({ setActiveTab }) => {
  const [tasks, setTasks] = useState<CareGuideTask[]>(careGuideTasksData as CareGuideTask[]);
  const inheritanceRef = useRef<HTMLDivElement>(null);

  const toggleTask = (id: number) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, checked: !t.checked } : t)));
  };

  // 07-04 §8-8-2(2026-09-08) — 항목 아코디언을 없앤다. 접기는 구간 5개에만 두고, 기본은
  // "지금 — 장례 기간"만 펼친다. 카드는 항상 기한·⭐을 보여주므로 펼쳐야만 보이던 정보가 없다.
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['funeral']));
  const toggleSection = (key: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="container">
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'var(--state-ok-bg)', color: 'var(--state-ok-fg)', padding: '0.3rem var(--sp-4)', borderRadius: 'var(--r-lg)', fontSize: 'var(--fs-body)', fontWeight: 700, marginBottom: '0.6rem' }}>
          <ChecklistShieldIcon size={18} color="var(--state-ok-fg)" /> 사망 직후 필수 행정절차
        </div>
        <h1 className="page-title" style={{ color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
          <ChecklistShieldIcon color="var(--point-color)" size={32} /> 상중 행정 가이드
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.4rem' }}>
          사망 후 꼭 해야 할 행정절차를 순서대로 확인하세요.
        </p>
      </div>

      {/* §3.1 최상단 고정 배너 — 유족은 체크리스트를 끝까지 스크롤하지 않는다. 한 줄이라도
          남으려면 최상단이어야 한다.
          2026-09-08 — 시안 A~F 중 "E. 미니멀 아웃라인"으로 교체(사용자 선택), 그 뒤 사용자
          지시로 테두리만 리본형(시안 C형 — 위아래 가로줄만, 좌우·모서리 없음)으로 재수정.
          면을 칠하지 않고 위아래 선만 두르고, 경고는 모서리에 걸친 작은 뱃지 하나가 담당한다 —
          "소리치지 않지만 놓치지 않는" 쪽. */}
      <div style={{ backgroundColor: 'var(--card-bg)', borderTop: '1.5px solid var(--primary-color)', borderBottom: '1.5px solid var(--primary-color)', padding: '1.15rem 1.3rem 1.15rem 1.5rem', marginBottom: '1.5rem', position: 'relative' }}>
        <span style={{ position: 'absolute', top: '-12px', left: '-12px', width: '26px', height: '26px', borderRadius: 'var(--r-full)', backgroundColor: 'var(--state-critical-fg)', border: '2px solid var(--card-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <AlertCircle color="#FFFFFF" size={14} strokeWidth={2.5} />
        </span>
        <h3 style={{ color: 'var(--text-main)', fontSize: 'var(--fs-body)', fontWeight: 700, margin: '0 0 0.4rem 0' }}>
          고인에게 빚이 있을 수 있다면, 3개월 안에 결정해야 합니다.
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <p style={{ fontSize: 'var(--fs-body)', color: 'var(--text-muted)', margin: 0, lineHeight: 1.6, flex: '1 1 320px' }}>
            상속포기·한정승인 기한은 상속개시를 안 날로부터 3개월입니다. 지나면 채무를 그대로 물려받습니다.
          </p>
          <div style={{ display: 'flex', gap: '0.6rem', flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => inheritanceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="btn"
            style={{ background: 'none', color: 'var(--text-muted)', border: '1px solid var(--border-color)', height: '38px', fontSize: 'var(--fs-body)', padding: '0 1rem' }}
          >
            내용 보기
          </button>
          <button
            type="button"
            onClick={() => setActiveTab?.('counseling')}
            className="btn"
            style={{ backgroundColor: 'var(--primary-color)', color: '#FFFFFF', height: '38px', fontSize: 'var(--fs-body)', padding: '0 1rem' }}
          >
            전문가 상담
          </button>
          </div>
        </div>
      </div>

      {/* 상중 행정 타임라인 — 전체 폭 카드, 부고장 카드 제거(별도 페이지로 분리됨) */}
      <div style={{ backgroundColor: 'var(--card-bg)', padding: '1.5rem', borderRadius: 'var(--border-radius)', boxShadow: 'var(--box-shadow)' }}>
        <h3 style={{ color: 'var(--primary-color)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckSquare color="var(--point-color)" /> 상중 행정 체크리스트
        </h3>

        {TIME_SECTIONS.map((section) => {
          // §4.1 — 구간별 id를 이미 severity 우선순으로 나열해 뒀으므로 그 순서를 그대로 쓴다.
          const group = section.ids
            .map((id) => tasks.find((t) => t.id === id))
            .filter((t): t is CareGuideTask => Boolean(t));
          if (group.length === 0) return null;

          // 카테고리별로 묶는다 — 위 순서(구간 내 severity 순)를 그대로 표시 순서로 쓴다.
          const categoryOrder: string[] = [];
          const byCategory = new Map<string, CareGuideTask[]>();
          group.forEach((t) => {
            if (!byCategory.has(t.category)) {
              byCategory.set(t.category, []);
              categoryOrder.push(t.category);
            }
            byCategory.get(t.category)!.push(t);
          });

          // §8-8-2 — 구간 3은 접혀 있어도 ⭐을 유지한다. 좌측 테두리는 펼쳤을 때 하위
          // 항목에 이미 붉은 테두리(emphasisBorder)가 걸려 이중 강조라 제거(2026-09-09 사용자 지시).
          const isMonth3 = section.key === 'month3';
          const isOpen = openSections.has(section.key);

          return (
            <div key={section.key} style={{ marginBottom: 'var(--sp-6)' }}>
              <button
                type="button"
                onClick={() => toggleSection(section.key)}
                aria-expanded={isOpen}
                className="care-guide-section-toggle"
                style={{
                  display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', width: '100%',
                  background: 'none', border: 'none', padding: 'var(--sp-2) var(--sp-3)', margin: '0 0 var(--sp-2) 0',
                  cursor: 'pointer', textAlign: 'left', color: 'var(--primary-color)',
                }}
              >
                {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--fs-section)' }}>{section.label}</span>
                {isMonth3 && <span style={{ color: 'var(--state-critical-fg)' }}>⭐</span>}
                <span style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                  ({group.length})
                </span>
              </button>

              {/* 카테고리 = flex 박스. index.css `.care-guide-columns`가 가로 여유가 있으면
                  옆으로 나열하고, 없으면 다음 줄로 넘긴다. §8-8-2 — 카테고리 헤더는 그 구간에
                  2개 이상일 때만 노출한다. */}
              {isOpen && (
                <div className="care-guide-columns">
                  {categoryOrder.map((category) => {
                    const items = byCategory.get(category)!;
                    const isInheritanceSet = category === '상속 승인·포기';
                    const showCategoryHeader = categoryOrder.length > 1;

                    return (
                      <div
                        key={category}
                        ref={isInheritanceSet ? inheritanceRef : undefined}
                        className="care-guide-category"
                      >
                        {showCategoryHeader && (
                          <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.02em', marginBottom: 'var(--sp-2)' }}>
                            {category}
                          </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
                          {items.map((t) => {
                            const itemMeta = SEVERITY_LABEL[t.severity];
                            const emphasisBorder = EMPHASIS_BORDER[t.severity];
                            const hasLinks = Boolean(t.needsExpertHelp || t.linkTo || t.externalUrl);
                            return (
                              <div
                                key={t.id}
                                style={{
                                  padding: 'var(--sp-3)',
                                  borderRadius: 'var(--r-sm)',
                                  backgroundColor: t.checked ? 'var(--secondary-color)' : '#FFFFFF',
                                  border: '1px solid var(--border-color)',
                                  ...(emphasisBorder ? { borderLeft: emphasisBorder } : {}),
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--sp-3)' }}>
                                  <input
                                    type="checkbox"
                                    checked={t.checked}
                                    onChange={() => toggleTask(t.id)}
                                    style={{ width: '20px', height: '20px', marginTop: '0.15rem', flexShrink: 0, cursor: 'pointer' }}
                                  />
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    {/* 1줄 — 체크·제목·기한 배지(항상 노출)·⭐. 근거(legalBasis)는
                                    title 툴팁으로 내린다(§8-8-2) — 조문 번호는 유족에게 정보가 아니다. */}
                                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--sp-2)' }}>
                                      <span
                                        title={`근거: ${t.legalBasis}`}
                                        style={{ textDecoration: t.checked ? 'line-through' : 'none', color: t.checked ? 'var(--text-muted)' : 'var(--text-main)', fontSize: 'var(--fs-body)', fontWeight: 'var(--fw-medium)' }}
                                      >
                                        {t.title}
                                      </span>
                                      {/* 기한 배지 — 한 카드에 볼드는 하나만(§6.3 #2)이라 이 배지가 그 하나다.
                                      §8-8-4 — deadlineShort 미신설이라 원문을 그대로 넣고 줄바꿈을 허용한다. */}
                                      <span style={{ fontSize: 'var(--fs-caption)', fontWeight: 'var(--fw-bold)', color: itemMeta.color, backgroundColor: itemMeta.bg, padding: '0.15rem var(--sp-2)', borderRadius: 'var(--r-sm)', fontVariantNumeric: 'tabular-nums' }}>
                                        {t.deadlineLabel}{t.deadlineBase !== '-' ? ` · ${t.deadlineBase} 기준` : ''}
                                      </span>
                                      {t.severity === 'CRITICAL' && (
                                        <span style={{ fontSize: 'var(--fs-caption)', color: itemMeta.color, whiteSpace: 'nowrap' }}>
                                          ⭐ 되돌릴 수 없음
                                        </span>
                                      )}
                                      {!t.verified && (
                                        <span style={{ fontSize: 'var(--fs-caption)', color: 'var(--state-warn-fg)', backgroundColor: 'var(--state-warn-bg)', padding: '0.1rem 0.4rem', borderRadius: 'var(--r-sm)', whiteSpace: 'nowrap' }}>
                                          ⚠️ 확인 필요
                                        </span>
                                      )}
                                    </div>

                                    {/* 2줄 — irreversibleNote 또는 note (있을 때만) */}
                                    {(t.irreversibleNote || t.note) && (
                                      <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-muted)', margin: 'var(--sp-2) 0 0 0', lineHeight: 1.5 }}>
                                        {t.irreversibleNote || t.note}
                                      </p>
                                    )}

                                    {/* 3줄 — 링크. 6개 항목만 해당 */}
                                    {hasLinks && (
                                      <div style={{ display: 'flex', gap: 'var(--sp-4)', flexWrap: 'wrap', marginTop: 'var(--sp-2)' }}>
                                        {t.needsExpertHelp && (
                                          <button
                                            type="button"
                                            onClick={() => setActiveTab?.('counseling')}
                                            style={{ background: 'none', border: 'none', padding: 0, fontSize: 'var(--fs-caption)', color: 'var(--point-color)', textDecoration: 'underline', cursor: 'pointer' }}
                                          >
                                            {LINK_LABEL.counseling}
                                          </button>
                                        )}
                                        {t.linkTo && (
                                          <button
                                            type="button"
                                            onClick={() => setActiveTab?.(t.linkTo as string)}
                                            style={{ background: 'none', border: 'none', padding: 0, fontSize: 'var(--fs-caption)', color: 'var(--primary-color)', textDecoration: 'underline', cursor: 'pointer' }}
                                          >
                                            {LINK_LABEL[t.linkTo] || '바로가기 →'}
                                          </button>
                                        )}
                                        {t.externalUrl && (
                                          <a
                                            href={t.externalUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: 'var(--fs-caption)', color: 'var(--accent-gold)', textDecoration: 'underline' }}
                                          >
                                            정부24 바로가기 <ExternalLink size={12} />
                                          </a>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        <p style={{ fontSize: 'var(--fs-body)', color: 'var(--text-muted)', marginTop: '0.5rem', lineHeight: 1.6 }}>
          이 체크리스트는 일반적인 안내이며 개별 사정에 따라 다를 수 있습니다. 정확한 기한 판단은
          전문가 상담을 이용하세요.
        </p>
      </div>
    </div>
  );
};
