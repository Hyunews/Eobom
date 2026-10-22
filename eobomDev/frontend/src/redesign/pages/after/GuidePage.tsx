import React, { useEffect, useMemo, useRef, useState } from 'react';
import careGuideTasksData from '../../../mockData/careGuideTasks.json';
import { getLegalLink } from '../../../lib/legalLink';
import { RdBadge, RdButton, RdTextLink } from '../../parts/RdButtons';
import { RdSectionHead } from '../../parts/RdCards';
import { DemoBar, type DemoOption } from '../../parts/RdDemo';
import { RdPageHead, RdTabs, RdToc } from '../../parts/RdNav';
import { RdDeadlineLine } from '../../parts/RdNotices';
import { RdDialog, RdLoginGate, useRdToast } from '../../parts/RdModal';
import { IconChevronRight, IconWarn } from '../../parts/icons';
import { useIsPhone } from '../../useIsPhone';
import { sleep } from '../prep/prepCommon';
import './after.css';

// 8단계 묶음 5 · /preview/care-guide — 2단계 캔버스 판 2-1(기본) · 2-2(항목 창) · 2-3(상태).
// 항목 내용·근거 링크는 지금 코드와 같은 자료(careGuideTasks.json · getLegalLink)를 읽어 쓴다. 서버 없이 움직인다.

interface Task {
  id: number;
  category: string;
  title: string;
  deadlineLabel: string;
  deadlineShort?: string;
  deadlineBase: string;
  severity: 'CRITICAL' | 'NORMAL' | 'INFO';
  legalBasis: string;
  deadlineOriginalRequired?: boolean;
}
const TASKS = careGuideTasksData as unknown as Task[];

// 구간 정의 — 지금 CareGuidePage.tsx의 TIME_SECTIONS와 같은 순서·항목(07-04 §4.1). 지금 화면 파일은 고치지 않아 복사해 두었다.
// 3개월 구간 제목의 대시는 판 2-1 개발자 수정(콜론)을 따른다.
const SECTIONS: { key: string; label: string; title?: string; ids: number[] }[] = [
  { key: 'funeral', label: '장례 기간 (즉시)', ids: [2, 5, 1, 3, 4, 23] },
  { key: 'month1', label: '1개월 이내', ids: [6, 7, 8] },
  { key: 'month3', label: '3개월', title: '3개월 : 상속개시·채무초과를 안 날부터', ids: [9, 10, 11, 12] },
  { key: 'month6', label: '6개월', ids: [13, 14, 15, 16, 17] },
  { key: 'later', label: '이후/수시로', ids: [20, 21, 22, 18, 19] },
];

const badgeText = (t: Task) => t.deadlineShort ?? t.deadlineLabel;

const DEMOS: DemoOption[] = [
  { value: 'member', label: '회원 (기본)' },
  { value: 'guest', label: '로그인 전 ([전문가 상담]을 누르면 로그인 요구 창)' },
  { value: 'savefail', label: '체크 저장 실패 (체크하면 되돌리고 알림)' },
];

export function GuidePage() {
  const phone = useIsPhone();
  const [demo, setDemo] = useState('member');
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [openId, setOpenId] = useState<number | null>(null);
  const [active, setActive] = useState(SECTIONS[0].key);
  const [gate, setGate] = useState(false);
  const toast = useRdToast();
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const inheritanceRef = useRef<HTMLDivElement | null>(null);

  const sections = useMemo(
    () =>
      SECTIONS.map((s) => ({
        ...s,
        items: s.ids.map((id) => TASKS.find((t) => t.id === id)).filter((t): t is Task => Boolean(t)),
      })).filter((s) => s.items.length > 0),
    [],
  );

  const toggle = async (id: number) => {
    const next = !checked.has(id);
    const apply = (on: boolean) =>
      setChecked((prev) => {
        const n = new Set(prev);
        if (on) n.add(id);
        else n.delete(id);
        return n;
      });
    apply(next);
    if (demo === 'savefail') {
      await sleep(600);
      apply(!next);
      toast.show('저장에 실패하였습니다.', 'warn');
    }
  };

  // 데스크톱: 스크롤 따라 목차의 현재 구간을 바꾼다. 휴대폰은 탭이 고른 구간 하나만 그리므로 쓰지 않는다.
  useEffect(() => {
    if (phone) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length === 0) return;
        const top = visible.reduce((a, b) => (a.boundingClientRect.top < b.boundingClientRect.top ? a : b));
        const key = top.target.getAttribute('data-section-key');
        if (key) setActive(key);
      },
      { rootMargin: '-96px 0px -70% 0px', threshold: 0 },
    );
    Object.values(sectionRefs.current).forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [phone, sections]);

  const goSection = (key: string) => {
    setActive(key);
    if (!phone) sectionRefs.current[key]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const counsel = () => {
    if (demo === 'guest') setGate(true);
    else toast.show('미리보기에서는 상담 화면으로 이동하지 않습니다.');
  };

  const openTask = TASKS.find((t) => t.id === openId) ?? null;
  const legal = openTask ? getLegalLink(openTask) : null;
  const shown = phone ? sections.filter((s) => s.key === active) : sections;

  return (
    <div className="rd-container rd-screen">
      <RdPageHead title="상중 행정 가이드" desc="사망 후 꼭 해야 할 행정절차를 순서대로 확인하세요." />

      <div className="rd-af-guide">
        <div className="rd-af-guide__main">
          {!phone && (
            <div className="rd-af-callout" role="note">
              <IconWarn size={24} />
              <div className="rd-af-callout__text">
                <b>고인에게 빚이 있을 수 있다면, 3개월 안에 결정해야 합니다.</b>
                <p>상속포기·한정승인 기한은 상속개시를 안 날로부터 3개월입니다.</p>
              </div>
              <div className="rd-af-callout__actions">
                <RdButton kind="secondary" place="row" onClick={() => inheritanceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                  내용 보기
                </RdButton>
                <RdButton place="row" onClick={counsel}>전문가 상담</RdButton>
              </div>
            </div>
          )}

          {phone && (
            <>
              <RdTabs label="기한별" tabs={sections.map((s) => ({ value: s.key, label: s.label }))} value={active} onChange={goSection} />
              {active !== 'month3' && <RdDeadlineLine onClick={() => goSection('month3')}>상속포기·한정승인 기한은 3개월입니다</RdDeadlineLine>}
            </>
          )}

          {shown.map((section) => {
            const order: string[] = [];
            const byCat = new Map<string, Task[]>();
            section.items.forEach((t) => {
              if (!byCat.has(t.category)) {
                byCat.set(t.category, []);
                order.push(t.category);
              }
              byCat.get(t.category)!.push(t);
            });
            return (
              <section
                key={section.key}
                className="rd-af-section"
                data-section-key={section.key}
                ref={(el) => {
                  sectionRefs.current[section.key] = el;
                }}
              >
                <RdSectionHead title={section.title ?? section.label} count={`(${section.items.length})`} />
                {order.map((cat) => (
                  <div key={cat} ref={cat === '상속 승인·포기' ? inheritanceRef : undefined}>
                    {order.length > 1 && <p className="rd-af-cat">{cat}</p>}
                    <ul className="rd-list rd-af-rows">
                      {byCat.get(cat)!.map((t) => (
                        <li key={t.id} className={`rd-list__li rd-check rd-af-row${checked.has(t.id) ? ' is-done' : ''}`}>
                          <div className="rd-check__box">
                            <input
                              type="checkbox"
                              className="rd-checkbox"
                              checked={checked.has(t.id)}
                              onChange={() => toggle(t.id)}
                              aria-label={`${t.title} 완료 표시`}
                            />
                          </div>
                          <button type="button" className="rd-check__body" onClick={() => setOpenId(t.id)}>
                            <span className="rd-check__title">{t.title}</span>
                            {t.deadlineOriginalRequired && <span className="rd-row__info">{t.deadlineLabel}</span>}
                          </button>
                          <div className="rd-check__side">
                            {t.severity === 'CRITICAL' && <RdBadge kind="danger">되돌릴 수 없음</RdBadge>}
                            <RdBadge kind="state">{badgeText(t)}</RdBadge>
                          </div>
                          <button type="button" className="rd-check__chev" aria-label={`${t.title} 안내 보기`} onClick={() => setOpenId(t.id)}>
                            <IconChevronRight />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </section>
            );
          })}

          <p className="rd-af-foot">이 체크리스트는 일반적인 안내이며 개별 사정에 따라 다를 수 있습니다. 정확한 기한 판단은 전문가 상담을 이용하세요.</p>
        </div>

        {!phone && (
          <div className="rd-af-guide__toc">
            <RdToc items={sections.map((s) => ({ id: s.key, label: s.label, count: s.items.length }))} current={active} onSelect={goSection} />
          </div>
        )}
      </div>

      <DemoBar value={demo} options={DEMOS} onChange={setDemo} />

      {openTask && (
        <RdDialog
          title={openTask.title}
          warning={openTask.severity === 'CRITICAL' ? '되돌릴 수 없음' : undefined}
          onClose={() => setOpenId(null)}
          footer={<RdButton kind="secondary" place="dialog" onClick={() => setOpenId(null)}>닫기</RdButton>}
        >
          <dl className="rd-af-facts">
            <div>
              <dt>기한</dt>
              <dd>
                {openTask.deadlineLabel}
                {openTask.deadlineBase !== '-' ? ` (${openTask.deadlineBase} 기준)` : ''}
              </dd>
            </div>
            {legal && (
              <div>
                <dt>근거</dt>
                <dd>
                  {legal.href ? (
                    <RdTextLink external href={legal.href} className="rd-af-basis">
                      {legal.baseLabel}
                    </RdTextLink>
                  ) : (
                    legal.baseLabel
                  )}
                  {legal.extra && <span className="rd-af-extra"> ({legal.extra})</span>}
                </dd>
              </div>
            )}
          </dl>
        </RdDialog>
      )}

      {gate && <RdLoginGate screenName="전문가 상담" onLogin={() => setGate(false)} />}
      {toast.node}
    </div>
  );
}
