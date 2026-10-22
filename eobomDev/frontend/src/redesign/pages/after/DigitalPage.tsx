import React, { useState } from 'react';
import { DemoBar, type DemoOption } from '../../parts/RdDemo';
import { RdPageHead } from '../../parts/RdNav';
import { RdSourceTip, RdTipHost } from '../../parts/RdNotices';
import { RdLoginGate } from '../../parts/RdModal';
import { IconArrow, IconArrowOut, IconCheck, IconChevronDown, IconClose } from '../../parts/icons';
import './after.css';

// 8단계 묶음 5 · /preview/digital-estate — 2단계 캔버스 판 2-20(10-22 재구성: 찾기 → 정리하기 2구간) · 2-21(출처 말풍선) · 2-24(가림판).
// 문구는 캔버스 판 2-20 그대로. 서버 호출 없는 화면이라 미리보기도 정적이다.

// 04-03 §1.1 표 — KISO 정책규정 제28조 원문. 🔴 고치거나 요약하지 않는다(지금 코드 KISO_28과 같은 글).
const KISO_28 = {
  '①': '회원사는 상속인에게 피상속인의 계정 접속권 등을 원칙적으로 제공하지 아니한다.',
  '②': '다만 피상속인의 계정 중 사이버머니 등 경제적 가치가 있는 디지털 정보의 경우 관계 법령 및 약관에 따라 이를 상속인에게 제공할 수 있다.',
} as const;

const STEPS = [
  {
    no: '①',
    learn: '고인 명의 금융기관·카드사 목록',
    label: '안심상속 원스톱',
    provider: '정부24 · 주민센터',
    note: undefined,
    tags: [{ lead: '신청 기한', text: '사망하신 달의 말일부터 1년 안에' }],
    url: 'https://www.gov.kr/portal/onestopSvc/safeInheritance',
    together: false,
  },
  {
    no: '②',
    learn: '금융회사별 예금·채무액',
    label: '상속인 금융거래 조회',
    provider: '금융감독원',
    note: undefined,
    tags: [{ lead: '결과 확인', text: '신청 15~20일 뒤부터' }, { lead: '', text: '3개월간 최대 5회' }],
    url: undefined,
    together: true,
  },
  {
    no: '③',
    learn: '어느 구독에 결제됐는지',
    label: '카드사 정기결제 내역',
    provider: '각 카드사',
    note: '카드사에 요청해야 알 수 있습니다.',
    tags: [{ lead: '처리 기간', text: '카드사별로 다름' }],
    url: undefined,
    together: false,
  },
];

function Source({ clause }: { clause: keyof typeof KISO_28 }) {
  return (
    <RdTipHost>
      <RdSourceTip label={`KISO 정책규정 §28${clause}`} title={`KISO 정책규정 제28조 ${clause}`}>
        {KISO_28[clause]}
      </RdSourceTip>
    </RdTipHost>
  );
}

function Mark({ yes }: { yes?: boolean }) {
  return (
    <span className={`rd-af-do__mark rd-af-do__mark--${yes ? 'yes' : 'no'}`}>
      {yes ? <IconCheck size={16} /> : <IconClose size={16} />}
    </span>
  );
}

/** 구간 1 — 돈이 오가는 곳 찾기. 데스크톱 가로 3칸 + 화살표, 모바일 세로 번호 줄(같은 DOM, CSS로 갈린다). */
function FindSection() {
  return (
    <section className="rd-af-sec">
      <h2 className="rd-t-section rd-af-h2">돈이 오가는 곳 찾기</h2>
      <ol className="rd-af-flow">
        {STEPS.map((s, i) => (
          <React.Fragment key={s.no}>
            {i > 0 && <li className="rd-af-flow__arrow" aria-hidden="true"><IconArrow size={40} /></li>}
            <li className="rd-af-st">
              <div className="rd-af-st__rail" aria-hidden="true">
                <span className="rd-af-st__no">{s.no}</span>
                {i < STEPS.length - 1 && (
                  <>
                    <span className="rd-af-st__line" />
                    <IconChevronDown size={14} />
                  </>
                )}
              </div>
              <div className="rd-af-st__body">
                <div className="rd-af-st__learn">
                  <span className="rd-af-st__eyebrow">알게 되는 것</span>
                  <span className="rd-af-st__what">{s.learn}</span>
                </div>
                <div className="rd-af-st__org">
                  <span className="rd-af-st__label">{s.label}</span>
                  <span className="rd-af-st__prov">{s.provider}</span>
                </div>
                {s.note && <p className="rd-af-st__note">{s.note}</p>}
                <div className="rd-af-st__tags">
                  {s.tags.map((t) => (
                    <span className="rd-af-st__tag" key={t.text}>
                      {t.lead && <b>{t.lead}</b>}
                      {t.lead && ' · '}
                      {t.text}
                    </span>
                  ))}
                </div>
                {s.url && (
                  <a className="rd-btn rd-btn--primary rd-btn--row rd-af-st__go" href={s.url} target="_blank" rel="noopener noreferrer">
                    <span>신청 페이지로 이동</span>
                    <IconArrowOut size={15} />
                  </a>
                )}
                {s.together && (
                  <div className="rd-af-st__together">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6" /></svg>
                    <span>①과 함께 접수</span>
                  </div>
                )}
              </div>
            </li>
          </React.Fragment>
        ))}
      </ol>
    </section>
  );
}

/** 구간 2 — 찾은 계정 정리하기. 요청할 수 있음 ✓ / 요청할 수 없음 ✕ 두 칸(모바일은 위아래). */
function ArrangeSection() {
  return (
    <section className="rd-af-sec">
      <div className="rd-af-h2 rd-af-h2--sub">
        <h2 className="rd-t-section">찾은 계정 정리하기</h2>
        <p className="rd-af-h2__sub">요청할 수 있는 것과 없는 것</p>
      </div>
      <div className="rd-af-docols">
        <section className="rd-af-do">
          <h3 className="rd-af-do__head"><Mark yes />요청할 수 있음</h3>
          <ul className="rd-af-do__list">
            {['계정 폐쇄', '구독 해지', '추모 전환'].map((t) => (
              <li key={t}>
                <Mark yes />
                <div className="rd-af-do__text"><span>{t}</span></div>
              </li>
            ))}
            <li>
              <Mark yes />
              <div className="rd-af-do__text">
                <span>공개 게시물 백업</span>
                <span className="rd-af-do__sub">사업자 재량</span>
              </div>
            </li>
            <li>
              <Mark yes />
              <div className="rd-af-do__text">
                <span>사이버머니 등 경제적 가치가 있는 것의 청구</span>
                <Source clause="②" />
              </div>
            </li>
          </ul>
        </section>
        <section className="rd-af-do">
          <h3 className="rd-af-do__head"><Mark />요청할 수 없음</h3>
          <ul className="rd-af-do__list">
            <li>
              <Mark />
              <div className="rd-af-do__text">
                <span>고인의 아이디·비밀번호는 받으실 수 없습니다</span>
                <Source clause="①" />
              </div>
            </li>
            <li>
              <Mark />
              <div className="rd-af-do__text">
                <span>개인정보 포털(privacy.go.kr) 「본인확인 내역 조회」</span>
                <span>본인만 이용할 수 있습니다.</span>
                <span>고인 명의로는 유족이 조회하실 수 없습니다.</span>
              </div>
            </li>
          </ul>
        </section>
      </div>
    </section>
  );
}

const DEMOS: DemoOption[] = [
  { value: 'normal', label: '기본' },
  { value: 'login', label: '로그인 전' },
];

export function DigitalPage() {
  const [demo, setDemo] = useState('normal');
  const desc = '고인의 금융·구독 계정을 공공 서비스로 찾아보세요.';
  const bar = <DemoBar value={demo} options={DEMOS} onChange={setDemo} />;

  if (demo === 'login') {
    return (
      <div className="rd-container rd-screen">
        <RdPageHead title="디지털 정산" desc={desc} />
        <div className="rd-af-gatebox"><RdLoginGate screenName="디지털 정산" contained /></div>
        {bar}
      </div>
    );
  }

  return (
    <div className="rd-container rd-screen">
      <RdPageHead title="디지털 정산" desc={desc} />
      <FindSection />
      <ArrangeSection />
      {bar}
    </div>
  );
}
