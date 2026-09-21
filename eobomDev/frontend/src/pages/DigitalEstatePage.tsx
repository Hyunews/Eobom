import React, { useId, useState } from 'react';
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

// 04-01 §0.2 STEP 1 — 두 경로만 노출한다. 1-C(정보주체 권리행사 서비스)는 사망자 대행이
// ❌ 불가로 확정돼 삭제됐다(04-03 §2.2-1) — 대신 아래 STEP 0의 「본인확인 내역 조회」 항목으로 들어갔다.
const DISCOVERY_PATHS = [
  {
    id: '1-A',
    label: '안심상속 원스톱',
    provider: '정부24 · 주민센터',
    what: '고인 명의로 거래 중인 금융기관·카드사 목록이 나옵니다.',
    deadline: '사망하신 달의 말일부터 1년 안에',
    url: 'https://www.gov.kr/portal/onestopSvc/safeInheritance',
  },
  {
    id: '1-B',
    label: '상속인 금융거래 조회',
    provider: '금융감독원 → 확인된 카드사에 정기결제 내역 개별 청구',
    what: '구독 서비스가 이름 그대로 나옵니다.',
    deadline: '조회 결과 확인 20일 이내 · 결과 보관 3개월',
    url: 'https://www.fss.or.kr/fss/cvpl/inhCerEc/main.do?menuNo=200010',
  },
] as const;

const GUIDE_TITLE = '먼저 아셔야 할 것';
const GUIDE_TITLE_ID = 'digital-estate-guide-title';

// KISO 정책규정 제28조 원문 — 04-03 §1.1 표(카카오 고객센터가 이 조문을 그대로 인용해 안내함을 확인한 것)를 그대로 옮겼다.
// 🔴 문구를 고치거나 요약하지 않는다. 바뀌어야 하면 04-03을 먼저 고친다(Opus).
const KISO_28 = {
  '①': '회원사는 상속인에게 피상속인의 계정 접속권 등을 원칙적으로 제공하지 아니한다.',
  '②': '다만 피상속인의 계정 중 사이버머니 등 경제적 가치가 있는 디지털 정보의 경우 관계 법령 및 약관에 따라 이를 상속인에게 제공할 수 있다.',
} as const;

// 근거 표기 — 데스크톱에서 마우스를 올리거나 키보드로 포커스하면 조문 원문을 띄운다(2026-09-21 사람 지시).
// 모바일은 호버가 없고 화면이 좁아 CSS가 원문 카드를 숨긴다(표기만 남는다). useId — 같은 목록이 웹 칸과 모달에 두 번 그려져 id가 겹치면 안 된다.
const Kiso28Src: React.FC<{ clause: keyof typeof KISO_28 }> = ({ clause }) => {
  const tipId = useId();
  return (
    <span className="v2-do-src">
      <span className="v2-tip">
        <button type="button" className="v2-tip-trigger" aria-describedby={tipId}>
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
// 구간 제목은 두 링크를 함께 설명하는 말이다 — 안심상속은 금융기관·카드사 목록, 금융거래 조회는 카드사 정기결제(구독)를 알려준다.
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
                <span className="v2-nav-row-sub">고인의 아이디·비밀번호는 받으실 수 없습니다</span>
              </span>
              <span className="v2-nav-row-arrow">
                <ChevronRight size={18} />
              </span>
            </button>
          </div>

          {/* STEP 1 — 계정 찾기 경로 2개. 신청·수령은 유족 본인이 직접 한다(§0.5) — 이어봄이 대신 신청하지 않는다.
              (2026-09-21 사람 지시로 이 사실을 알리던 안내 문장 "아래 두 곳은 전부 무료 공공 서비스입니다…"을 화면에서 뺐다) */}

          {/* 웹 — 카드 2장을 세로로 */}
          <div className="v2-web-block">
            <div className="v2-card-grid is-stack">
              {DISCOVERY_PATHS.map((path) => (
                <div key={path.id} className="v2-card">
                  <h3 className="v2-card-title is-static">{path.label}</h3>
                  <p className="v2-card-provider">{path.provider}</p>
                  <p className="v2-card-text">{path.what}</p>
                  <p className="v2-card-meta">기한 · {path.deadline}</p>
                  <a href={path.url} target="_blank" rel="noopener noreferrer" className="v2-btn-primary v2-card-cta">
                    신청 페이지로 이동 <ExternalLink size={15} />
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* 모바일 — 제목 + 간단설명 행. 행 전체가 외부 링크(규칙 8-1). 제공처·기한은 생략한다 */}
          <div className="v2-mobile-block">
            {DISCOVERY_PATHS.map((path) => (
              <a key={path.id} href={path.url} target="_blank" rel="noopener noreferrer" className="v2-nav-row">
                <span className="v2-nav-row-text">
                  <span className="v2-nav-row-label">{path.label}</span>
                  <span className="v2-nav-row-sub">{path.what}</span>
                </span>
                <span className="v2-nav-row-arrow">
                  <ExternalLink size={16} />
                </span>
              </a>
            ))}
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
