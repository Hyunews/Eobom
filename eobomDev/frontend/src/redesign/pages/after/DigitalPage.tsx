import React, { useState } from 'react';
import { RdButton } from '../../parts/RdButtons';
import { RdCard } from '../../parts/RdCards';
import { DemoBar, type DemoOption } from '../../parts/RdDemo';
import { RdPageHead } from '../../parts/RdNav';
import { RdSourceTip, RdTipHost } from '../../parts/RdNotices';
import { RdDialog, RdLoginGate } from '../../parts/RdModal';
import { IconArrowOut, IconCheck, IconChevronRight, IconClose } from '../../parts/icons';
import { useIsPhone } from '../../useIsPhone';
import './after.css';

// 8단계 묶음 5 · /preview/digital-estate — 2단계 캔버스 판 2-20(기본) · 2-21(출처 말풍선) · 2-24(가림판).
// 문구는 지금 DigitalEstatePage.tsx와 같다(부제만 판 2-20 개발자 수정). 서버 호출 없는 화면이라 미리보기도 정적이다.

// 04-03 §1.1 표 — KISO 정책규정 제28조 원문. 🔴 고치거나 요약하지 않는다(지금 코드 KISO_28과 같은 글).
const KISO_28 = {
  '①': '회원사는 상속인에게 피상속인의 계정 접속권 등을 원칙적으로 제공하지 아니한다.',
  '②': '다만 피상속인의 계정 중 사이버머니 등 경제적 가치가 있는 디지털 정보의 경우 관계 법령 및 약관에 따라 이를 상속인에게 제공할 수 있다.',
} as const;

const STEPS = [
  {
    id: 'a',
    label: '안심상속 원스톱',
    provider: '정부24 · 주민센터',
    what: '고인 명의의 금융기관·카드사를 한 번에 조회합니다.',
    mobileWhat: '고인 명의 금융기관·카드사 한 번에 조회',
    deadlineLabel: '신청 기한',
    deadline: '사망하신 달의 말일부터 1년 안에',
    url: 'https://www.gov.kr/portal/onestopSvc/safeInheritance',
  },
  {
    id: 'b',
    label: '상속인 금융거래 조회',
    provider: '금융감독원',
    what: '안심상속을 신청하면 함께 접수됩니다. 금융회사별 예금액과 채무액을 알려 줍니다.',
    mobileWhat: '안심상속 신청 시 함께 접수',
    deadlineLabel: '결과 확인',
    deadline: '신청 15~20일 뒤부터 결과 확인 · 3개월간 최대 5회',
    url: undefined,
  },
  {
    id: 'c',
    label: '카드사 정기결제 내역',
    provider: '각 카드사',
    what: '어떤 구독에 결제됐는지는 카드사에 요청해야 알 수 있습니다.',
    mobileWhat: '구독 이름은 카드사에 요청해야 확인',
    deadlineLabel: '처리 기간',
    deadline: '카드사별로 다름',
    url: undefined,
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

/** 받으실 수 없는 것 / 받으실 수 있는 것 — 데스크톱은 종이 상자 둘, 모바일 판 안은 상자 없이 한 열. */
function DoColumns({ boxed }: { boxed?: boolean }) {
  const cls = boxed ? 'rd-af-do rd-af-do--box' : 'rd-af-do';
  return (
    <div className="rd-af-docols">
      <section className={cls}>
        <h4 className="rd-af-do__head">받으실 수 없는 것</h4>
        <ul className="rd-af-do__list">
          <li>
            <span className="rd-af-do__mark rd-af-do__mark--no"><IconClose size={16} /></span>
            <div className="rd-af-do__text">
              <span>고인의 아이디·비밀번호는 받으실 수 없습니다</span>
              <Source clause="①" />
            </div>
          </li>
          <li>
            <span className="rd-af-do__mark rd-af-do__mark--no"><IconClose size={16} /></span>
            <div className="rd-af-do__text rd-af-do__text--lines">
              <span>개인정보 포털(privacy.go.kr)</span>
              <span>「본인확인 내역 조회」는 본인만 이용할 수 있습니다.</span>
              <span>고인 명의로는 유족이 조회하실 수 없습니다.</span>
            </div>
          </li>
        </ul>
      </section>
      <section className={cls}>
        <h4 className="rd-af-do__head">받으실 수 있는 것</h4>
        <ul className="rd-af-do__list rd-af-do__list--yes">
          {['계정 폐쇄', '구독 해지', '추모 전환'].map((t) => (
            <li key={t}>
              <span className="rd-af-do__mark rd-af-do__mark--yes"><IconCheck size={16} /></span>
              <div className="rd-af-do__text"><span>{t}</span></div>
            </li>
          ))}
          <li>
            <span className="rd-af-do__mark rd-af-do__mark--yes"><IconCheck size={16} /></span>
            <div className="rd-af-do__text">
              <span>공개 게시물 백업</span>
              <span className="rd-af-do__sub">사업자 재량</span>
            </div>
          </li>
          <li className="rd-af-do__wide">
            <span className="rd-af-do__mark rd-af-do__mark--yes"><IconCheck size={16} /></span>
            <div className="rd-af-do__text">
              <span>사이버머니 등 경제적 가치가 있는 것의 청구</span>
              <Source clause="②" />
            </div>
          </li>
        </ul>
      </section>
    </div>
  );
}

const DEMOS: DemoOption[] = [
  { value: 'normal', label: '기본 (모바일은 안내 판이 열린 채)' },
  { value: 'login', label: '로그인 전' },
];

export function DigitalPage() {
  const phone = useIsPhone();
  const [demo, setDemo] = useState('normal');
  const [sheet, setSheet] = useState(true);
  const desc = '고인의 금융·구독 계정을 공공 서비스로 찾아보세요.';
  const bar = <DemoBar value={demo} options={DEMOS} onChange={(v) => { setDemo(v); setSheet(true); }} />;

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
      <h2 className="rd-t-section rd-af-h2">고인의 금융·구독 계정 찾기</h2>

      {phone ? (
        <>
          <ul className="rd-list">
            <li className="rd-list__li">
              <button type="button" className="rd-row" aria-haspopup="dialog" onClick={() => setSheet(true)}>
                <span className="rd-row__main">
                  <span className="rd-row__title">먼저 아셔야 할 것</span>
                  <span className="rd-row__info">고인의 아이디·비밀번호는 받으실 수 없습니다.</span>
                </span>
                <span className="rd-row__chev"><IconChevronRight /></span>
              </button>
            </li>
            {STEPS.map((s) => (
              <li className="rd-list__li" key={s.id}>
                {s.url ? (
                  <a className="rd-row" href={s.url} target="_blank" rel="noopener noreferrer">
                    <span className="rd-row__main">
                      <span className="rd-row__title">{s.label}</span>
                      <span className="rd-row__info">{s.mobileWhat}</span>
                    </span>
                    <span className="rd-row__chev"><IconArrowOut size={16} /></span>
                  </a>
                ) : (
                  <div className="rd-row rd-af-static">
                    <span className="rd-row__main">
                      <span className="rd-row__title">{s.label}</span>
                      <span className="rd-row__info">{s.mobileWhat}</span>
                    </span>
                  </div>
                )}
              </li>
            ))}
          </ul>
          {sheet && (
            <RdDialog title="먼저 아셔야 할 것" onClose={() => setSheet(false)} footer={<RdButton place="dialog" onClick={() => setSheet(false)}>닫기</RdButton>}>
              <DoColumns />
            </RdDialog>
          )}
        </>
      ) : (
        <div className="rd-af-split">
          <DoColumns boxed />
          <div className="rd-af-steps">
            {STEPS.map((s) => (
              <RdCard
                key={s.id}
                tone="paper"
                title={s.label}
                desc={s.provider}
              >
                <p className="rd-af-step__what">{s.what}</p>
                <p className="rd-af-step__meta">{s.deadlineLabel} · {s.deadline}</p>
                {s.url && (
                  <a className="rd-btn rd-btn--primary rd-btn--row rd-af-step__go" href={s.url} target="_blank" rel="noopener noreferrer">
                    <span>신청 페이지로 이동</span>
                    <IconArrowOut size={15} />
                  </a>
                )}
              </RdCard>
            ))}
          </div>
        </div>
      )}
      {bar}
    </div>
  );
}
