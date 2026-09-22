import React, { useEffect, useId, useRef, useState } from 'react';
import { X, Check, ExternalLink, ChevronRight } from 'lucide-react';
import { backdropCloseProps } from '../utils/backdropClose';

// 08-19 9차(개발자 직접 지시) — 기존 3서브탭(digital/physical/memorial) 중 "디지털 자산·계정
// 정산"만 남기고, 나머지 둘은 PickupPage(유품 수거)·MemorialPage(디지털 추모관)로 분리했다.
//
// 00-39 그룹② 재구현(2026-09-21) — 표현 계층만 v2 클래스로 옮겼다. 인라인 스타일 0.
// 🔄 2026-09-21 사람 지시 — 예시 데이터 카탈로그("고인 디지털 계정 정산 신청": 증빙 업로드 + 계정별 신청 목록)를
// 이 화면에서 뺐다. 남은 것은 "계정 찾기"(04-01 §0.2 STEP 0·1)뿐이라 이 화면은 로그인·API 없이 정적으로 완결된다.
// 🔄 같은 날 사람이 디자인 데모 A안(받으실 수 없는 것 / 있는 것 두 열)을 확정했다. 데모 정본은 Design 캔버스
// (디지털 정산 · 계정 찾기 안내 — 표현 방식 데모)의 W-A·M-A다.
// 🔄 같은 날 사람 지시 — 모바일은 대부분의 내용을 생략하고 "제목 + 간단설명" 행으로만 보여준다. "먼저 아셔야 할 것"
// (받으실 수 있는 것 / 없는 것)은 모바일에서 화면에 들어올 때 바텀시트 모달로 먼저 띄우고, [닫기]로 닫는다(닫은 뒤에도
// 첫 행을 누르면 다시 열린다). 웹은 모달 없이 두 열 + 카드를 그대로 보여준다. 전환은 JS 분기 없이 CSS
// (.v2-web-block / .v2-mobile-block / .v2-mobile-flex)로 한다.
// ⚠️ 스펙 편차(walkthrough `편차`로 Opus에): 사람이 안내 문장("아래 두 곳은 전부 무료 공공 서비스입니다. 이어봄은 대신
// 신청하지 않으며, 신청과 결과 수령은 직접 하셔야 합니다.")도 뺐다 — 04-01 §0.5의 "이어봄이 대신 신청하지 않는다"는 고지가
// 화면에서 사라진 상태다.
// ⚠️ 스펙 편차(walkthrough `편차`로 Opus에): 사람이 데모에서 STEP 0의 3번째 줄("플랫폼은 사망 사실을 자동으로 알지
// 못합니다 — 알리지 않으면 그대로 남습니다")을 지웠고 1번 문구의 "어디서도"를 뺐다. 04-01 §0.2는 4줄을 펼침 없이
// 항상 노출하는 것으로 적고 있다. 또 카드의 "— 실무상 가장 강력한 경로입니다"도 사람 지시로 뺐다(AI어투 금지).
// 모바일은 기한·제공처도 생략한다 — 04-01이 요구하는 표시 항목 범위를 넘는지 Opus 확인 필요.

// App이 authProps를 그대로 펼쳐 넘기므로 타입은 남기되, 이 화면은 더 이상 쓰지 않는다.
interface DigitalEstatePageProps {
  currentUser?: string | null;
  onOpenLogin?: () => void;
}

// 04-01 §0.2 STEP 1 — 1-A → 1-B → 1-B-1 단계 구조(2026-09-22 §0.2-1 정정).
// 병렬 두 경로가 아니다 — 1-B(금감원 상속인 금융거래 조회)는 1-A(안심상속)를 신청하면 함께 신청되는
// 연계 서비스라 별도 신청 버튼을 두지 않는다(은행연합회 소비자포털). 구독 서비스 이름은 1-B 결과에 없고
// 1-B-1(확인된 카드사에 개별 청구)에서 나온다. url이 있는 단계만 신청 버튼/외부 링크 행을 그린다.
// 1-C(정보주체 권리행사 서비스)는 사망자 대행이 ❌ 불가로 확정돼 삭제됐다(04-03 §2.2-1) — 대신 아래
// STEP 0의 「본인확인 내역 조회」 항목으로 들어갔다.
// 🔄 2026-09-22 §0.2-0 — 카드 문구(기관 줄·웹/모바일 설명·3번 카드 제목)를 §0.2-0 표 그대로 옮겼다.
// 아래 줄 라벨도 "기한"으로 고정하지 않고 카드마다 다른 성격을 그대로 말한다(신청 기한·결과 확인·
// 처리 기간, §0.2-0 규칙 ④). 3번 카드의 옛 `provider`("1-B에서 확인된 카드사에 개별 청구")는 화면에
// 내부 번호(1-B)가 그대로 노출되는 자리였다 — §0.2-0 규칙 ①(내부 번호 화면 노출 금지) 위반이라
// 표대로 "각 카드사"로 고쳤다.
type DiscoveryStep = {
  id: string;
  label: string;
  provider: string;
  what: string;
  mobileWhat: string;
  deadlineLabel: string;
  deadline: string;
  url?: string;
};

const DISCOVERY_STEPS: DiscoveryStep[] = [
  {
    id: '1-A',
    label: '안심상속 원스톱',
    provider: '정부24 · 주민센터',
    what: '고인 명의의 금융기관·카드사를 한 번에 조회합니다.',
    mobileWhat: '고인 명의 금융기관·카드사 한 번에 조회',
    deadlineLabel: '신청 기한',
    deadline: '사망하신 달의 말일부터 1년 안에',
    url: 'https://www.gov.kr/portal/onestopSvc/safeInheritance',
  },
  {
    id: '1-B',
    label: '상속인 금융거래 조회',
    provider: '금융감독원',
    what: '안심상속을 신청하면 함께 접수됩니다. 금융회사별 예금액과 채무액을 알려 줍니다.',
    mobileWhat: '안심상속 신청 시 함께 접수',
    deadlineLabel: '결과 확인',
    deadline: '신청 15~20일 뒤부터 결과 확인 · 3개월간 최대 5회',
  },
  {
    id: '1-B-1',
    label: '카드사 정기결제 내역',
    provider: '각 카드사',
    what: '어떤 구독에 결제됐는지는 카드사에 요청해야 알 수 있습니다.',
    mobileWhat: '구독 이름은 카드사에 요청해야 확인',
    deadlineLabel: '처리 기간',
    deadline: '카드사별로 다름',
  },
];

const GUIDE_TITLE = '먼저 아셔야 할 것';
const GUIDE_TITLE_ID = 'digital-estate-guide-title';

// KISO 정책규정 제28조 원문 — 04-03 §1.1 표(카카오 고객센터가 이 조문을 그대로 인용해 안내함을 확인한 것)를 그대로 옮겼다.
// 🔴 문구를 고치거나 요약하지 않는다. 바뀌어야 하면 04-03을 먼저 고친다(Opus).
const KISO_28 = {
  '①': '회원사는 상속인에게 피상속인의 계정 접속권 등을 원칙적으로 제공하지 아니한다.',
  '②': '다만 피상속인의 계정 중 사이버머니 등 경제적 가치가 있는 디지털 정보의 경우 관계 법령 및 약관에 따라 이를 상속인에게 제공할 수 있다.',
} as const;

// 근거 표기 — 데스크톱은 마우스를 올리거나 키보드로 포커스하면 조문 원문을 띄운다(2026-09-21 사람 지시 — 이 동작은 그대로).
// 🔄 2026-09-22 보완 — 호버가 없는 모바일도 표기를 누르면 열린다(기본은 접힘). 원문 카드는 닫혀 있을 때도 sr-only로 DOM에 남아
// aria-describedby가 스크린리더에 원문을 읽어준다. Escape로 닫을 수 있다(WCAG 1.4.13 Dismissible).
// 열림 = 눌러 열어둠(open) 또는 (마우스 호버 · 키보드 포커스) 중 Escape로 닫지 않은 것. CSS는 .is-open만 본다.
// useId — 같은 목록이 웹 칸과 모달에 두 번 그려져 id가 겹치면 안 된다.
const isWideScreen = () => window.matchMedia('(min-width: 768px)').matches;

const Kiso28Src: React.FC<{ clause: keyof typeof KISO_28 }> = ({ clause }) => {
  const tipId = useId();
  const ref = useRef<HTMLSpanElement>(null);
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const visible = pinned || (!dismissed && (hovered || focused));

  // Escape로 닫은 표시는 마우스도 포커스도 떠나면 풀어, 다음에 다시 호버·포커스하면 열리게 한다
  useEffect(() => {
    if (!hovered && !focused) setDismissed(false);
  }, [hovered, focused]);

  // 열려 있는 동안만 듣는다. Escape는 캡처 단계에서 먼저 받아 멈춘다 — 안 그러면 카드만 닫으려던 Escape가 바텀시트 모달까지 닫는다.
  // 마우스만 올린 상태(포커스 없음)에서도 닫혀야 해서 요소가 아니라 document에서 듣는다.
  useEffect(() => {
    if (!visible) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      setPinned(false);
      setDismissed(true);
    };
    const onPointerDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setPinned(false);
    };
    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [visible]);

  const toggle = () => {
    if (visible) {
      setPinned(false);
      setDismissed(true);
    } else {
      setPinned(true);
    }
  };

  return (
    <span className="v2-do-src">
      <span
        ref={ref}
        className={visible ? 'v2-tip is-open' : 'v2-tip'}
        // 호버는 마우스 + 넓은 화면만 — 터치의 가짜 mouseenter나 좁은 창에서 카드가 펼쳐져 줄이 밀리지 않게 한다
        onPointerEnter={(e) => e.pointerType === 'mouse' && isWideScreen() && setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        // 포커스는 키보드로 온 것만 — 눌러서 생긴 포커스까지 세면 두 번째 누름으로 접히지 않는다
        onFocus={(e) => e.target.matches(':focus-visible') && setFocused(true)}
        onBlur={() => setFocused(false)}
      >
        <button type="button" className="v2-tip-trigger" aria-describedby={tipId} aria-expanded={visible} onClick={toggle}>
          KISO 정책규정 §28{clause}
        </button>
        <span role="tooltip" id={tipId} className="v2-tip-panel">
          <span className="v2-tip-box">
            <span className="v2-tip-label">KISO 정책규정 제28조 {clause}</span>
            {KISO_28[clause]}
          </span>
        </span>
      </span>
    </span>
  );
};

// STEP 0 — 받으실 수 없는 것 / 있는 것. KISO 정책규정 §28①·§28②를 근거로 인용한다(04-01 §0.2, 04-03 §2.2-1).
// 🔴 줄바꿈을 코드에 박지 않는다(00-39 규칙 13) — `<br>` 대신 의미 단위를 블록(.v2-do-line)으로 나누고,
// 어절 단위 끊김·마지막 줄 균형은 .v2-prose(word-break: keep-all · text-wrap: pretty)가 맡는다.
// 웹은 화면에 두 열로, 모바일은 모달 안에 한 열로 같은 내용을 쓴다(stack).
const DoColumns: React.FC<{ stack?: boolean }> = ({ stack }) => (
  <div className={stack ? 'v2-do-cols is-stack' : 'v2-do-cols'}>
    <section>
      <h3 className="v2-do-head">받으실 수 없는 것</h3>
      <ul className="v2-do-list">
        <li className="is-no">
          <X size={16} />
          <div className="v2-do-text">
            <span className="v2-do-line">고인의 아이디·비밀번호는 받으실 수 없습니다</span>
            <Kiso28Src clause="①" />
          </div>
        </li>
        <li className="is-no">
          <X size={16} />
          <div className="v2-do-text">
            <span className="v2-do-line">개인정보 포털(privacy.go.kr)</span>
            <span className="v2-do-line">「본인확인 내역 조회」는 본인만 이용할 수 있습니다.</span>
            <span className="v2-do-line">— 고인 명의로는 유족이 조회하실 수 없습니다</span>
          </div>
        </li>
      </ul>
    </section>
    <section>
      <h3 className="v2-do-head">받으실 수 있는 것</h3>
      {/* is-compact — 짧은 한 줄 항목이 이어지는 목록이라 위아래 간격을 좁힌다(2026-09-21 사람 지시). 없는 것 목록은 문장이 길어 그대로 둔다 */}
      <ul className="v2-do-list is-compact">
        <li className="is-yes">
          <Check size={16} />
          <div className="v2-do-text">
            <span className="v2-do-line">계정 폐쇄</span>
          </div>
        </li>
        <li className="is-yes">
          <Check size={16} />
          <div className="v2-do-text">
            <span className="v2-do-line">구독 해지</span>
          </div>
        </li>
        <li className="is-yes">
          <Check size={16} />
          <div className="v2-do-text">
            <span className="v2-do-line">추모 전환</span>
          </div>
        </li>
        <li className="is-yes">
          <Check size={16} />
          <div className="v2-do-text">
            <span className="v2-do-line">공개 게시물 백업</span>
            <span className="v2-do-src">사업자 재량</span>
          </div>
        </li>
        <li className="is-yes">
          <Check size={16} />
          <div className="v2-do-text">
            <span className="v2-do-line">사이버머니 등 경제적 가치가 있는 것의 청구</span>
            <Kiso28Src clause="②" />
          </div>
        </li>
      </ul>
    </section>
  </div>
);

// 04-01 §0.2 STEP 0·1 — "계정 찾기". 정적 콘텐츠 + 외부 링크뿐이라 스키마·API 없이 이 파일 안에서만
// 완결된다. 🔴 사망일 입력칸을 두지 않는다 — 기한은 항상 구간 라벨만 보여준다(§0.6 · 07-04 §3.1-1과 같은 규칙).
// 구간 제목은 STEP 1 세 단계를 함께 설명하는 말이다 — 안심상속(1-A)은 금융기관·카드사 목록,
// 금융거래 조회(1-B)는 예금액·채무액(안심상속에 포함), 카드사 개별 청구(1-B-1)가 구독 이름을 알려준다.
const AccountDiscoveryGuide: React.FC = () => {
  // 모바일은 화면에 들어올 때 열려 있다. 웹에서는 모달 자체가 CSS로 숨겨져(.v2-mobile-flex) 이 값이 화면에 영향이 없다.
  const [guideOpen, setGuideOpen] = useState(true);
  const closeGuide = () => setGuideOpen(false);

  return (
    // 🔴 is-active-section 필수 — 모바일에서 .v2-section은 기본이 display:none이고(care-guide의 구간 탭 전환용, design-v2.css)
    // 이 클래스가 붙은 구간만 보인다. 이 화면은 구간이 하나뿐이라 항상 활성이다. 빼면 모바일에서 본문이 통째로 사라진다.
    <section className="v2-section is-active-section v2-prose">
      <div className="v2-section-head">
        <h2 className="v2-section-title">고인의 금융·구독 계정 찾기</h2>
      </div>

      {/* 웹은 좌우 2단(왼쪽 = 받으실 수 없는 것/있는 것, 오른쪽 = 안내 문장 + 서비스 2개를 세로로). 모바일은 1단이라
          왼쪽 칸(.v2-web-block)이 숨겨지고 오른쪽 칸만 남는다 */}
      <div className="v2-guide-split">
        {/* 웹 왼쪽 — STEP 0은 펼침 없이 항상 노출(04-01 §0.2) */}
        <div className="v2-web-block">
          <DoColumns stack />
        </div>

        <div className="v2-guide-side">
          {/* 모바일 — 제목 + 간단설명 한 행. 누르면 STEP 0이 바텀시트로 열린다(들어올 때도 먼저 열려 있다) */}
          <div className="v2-mobile-block">
            <button type="button" className="v2-nav-row" onClick={() => setGuideOpen(true)} aria-haspopup="dialog">
              <span className="v2-nav-row-text">
                <span className="v2-nav-row-label">{GUIDE_TITLE}</span>
                <span className="v2-nav-row-sub">고인의 아이디·비밀번호는 받으실 수 없습니다.</span>
              </span>
              <span className="v2-nav-row-arrow">
                <ChevronRight size={18} />
              </span>
            </button>
          </div>

          {/* STEP 1 — 계정 찾기 1-A→1-B→1-B-1 단계 3개. 신청 버튼은 1-A(url 있음)에만 둔다 — 1-B는 1-A를
              신청하면 함께 신청되는 연계 서비스라 따로 누를 데가 없다(§0.2-1). 신청·수령은 유족 본인이
              직접 한다(§0.5) — 이어봄이 대신 신청하지 않는다.
              (2026-09-21 사람 지시로 이 사실을 알리던 안내 문장 "아래 두 곳은 전부 무료 공공 서비스입니다…"을 화면에서 뺐다) */}

          {/* 웹 — 카드 3장을 세로로. url 없는 카드는 신청 버튼을 그리지 않는다 */}
          <div className="v2-web-block">
            <div className="v2-card-grid is-stack">
              {DISCOVERY_STEPS.map((step) => (
                <div key={step.id} className="v2-card">
                  <h3 className="v2-card-title is-static">{step.label}</h3>
                  <p className="v2-card-provider">{step.provider}</p>
                  <p className="v2-card-text">{step.what}</p>
                  <p className="v2-card-meta">{step.deadlineLabel} · {step.deadline}</p>
                  {step.url && (
                    <a href={step.url} target="_blank" rel="noopener noreferrer" className="v2-btn-primary v2-card-cta">
                      신청 페이지로 이동 <ExternalLink size={15} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 모바일 — 제목 + 간단설명 행. url이 있으면 행 전체가 외부 링크(규칙 8-1), 없으면(1-B·1-B-1)
              누를 데가 없는 정보 행(.is-static)이라 화살표 없이 정적으로 둔다. 제공처·기한은 생략한다 */}
          <div className="v2-mobile-block">
            {DISCOVERY_STEPS.map((step) =>
              step.url ? (
                <a key={step.id} href={step.url} target="_blank" rel="noopener noreferrer" className="v2-nav-row">
                  <span className="v2-nav-row-text">
                    <span className="v2-nav-row-label">{step.label}</span>
                    <span className="v2-nav-row-sub">{step.mobileWhat}</span>
                  </span>
                  <span className="v2-nav-row-arrow">
                    <ExternalLink size={16} />
                  </span>
                </a>
              ) : (
                <div key={step.id} className="v2-nav-row is-static">
                  <span className="v2-nav-row-text">
                    <span className="v2-nav-row-label">{step.label}</span>
                    <span className="v2-nav-row-sub">{step.mobileWhat}</span>
                  </span>
                </div>
              ),
            )}
          </div>
        </div>
      </div>

      {guideOpen && (
        <div
          className="v2-modal-overlay v2-mobile-flex"
          role="dialog"
          aria-modal="true"
          aria-labelledby={GUIDE_TITLE_ID}
          onKeyDown={(e) => {
            if (e.key === 'Escape') closeGuide();
          }}
          {...backdropCloseProps(closeGuide)}
        >
          <div className="v2-modal is-scroll v2-prose" onClick={(e) => e.stopPropagation()}>
            <h3 id={GUIDE_TITLE_ID} className="v2-modal-title">
              {GUIDE_TITLE}
            </h3>
            <div className="v2-modal-body">
              <DoColumns stack />
            </div>
            {/* 닫기는 X 아이콘이 아니라 하단 버튼(규칙 12). 열리면 여기로 포커스가 온다 */}
            <button type="button" className="v2-modal-close" onClick={closeGuide} autoFocus>
              닫기
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export const DigitalEstatePage: React.FC<DigitalEstatePageProps> = () => (
  <div className="v2-page">
    <div className="v2-page-head">
      <h1 className="v2-page-title">디지털 정산</h1>
      <p className="v2-page-subtitle">고인이 이용하던 금융·구독 계정을 공공 서비스로 찾아보세요.</p>
    </div>

    <div className="v2-content">
      <AccountDiscoveryGuide />
    </div>
  </div>
);
