import React from 'react';
import { Phone, Flower2, Navigation } from 'lucide-react';
import { formatKST } from '../utils/obituaryCard';

// 07-03 §6.4 ⓑ — ObituaryLandingPage.tsx의 표현부를 추출한 것. 조문객 화면(/o/{slug})과
// 관리 모드 미리보기 모달(ObituaryPage.tsx)이 이 컴포넌트 하나를 공유한다.
// 🔴 fetch·useParams·noindex meta·loading·notFound는 여기 없다 — 껍데기(랜딩 페이지)의 몫이다.
// noindex가 이 컴포넌트에 딸려가면 관리 페이지(/obituary)에도 noindex가 붙는다.
// 🔄 00-39 §6.7(2026-09-28 시안 확정) — 카드·그림자·남색 근조 띠를 없애고 문서형(라벨 + 1px 선
// 행)으로 다시 짰다. 스타일은 전부 design-v2.css의 .v2-obit-* 클래스(인라인 없음).
// 🔄 2026-09-28(후속) — 데스크톱(768px↑)만 캔버스 "데스크톱 C"대로 박스형(.v2-obit-box)으로
// 재구성. 모바일은 1차 그대로. 박스는 머리+세 묶음만 감싸고, 추모관 버튼·꼬리는 박스 밖(§6.7-1).

export interface Mourner {
  name: string;
  relationship: string;
  isChief: boolean;
}

export interface ObituaryData {
  deceasedName: string;
  deceasedDeathDate: string | null;
  funeralHall: string | null;
  funeralHallAddr: string | null;
  mourningRoom: string | null;
  coffinAt: string | null;
  funeralAt: string;
  burialSite: string | null;
  mourners: Mourner[];
  contactPhone?: string;
  // 🔄 09-07 — 부고장에 추모관이 연결 안 돼 있을 수 있다(체크박스 안 켜고 만든 경우).
  memorialSlug: string | null;
  cardFieldsUpdatedAt: string | null;
  updatedAt: string;
  account?: { bankCode: string | null; accountNumber: string | null; holder: string | null };
}

// §6.7 머리 — "{YYYY년 M월 D일} 별세"는 formatKST(월·일·시각만, 연도 없음)와 다른 표기라 별도로
// 만든다. 🔴 formatKST 자체는 바꾸지 않는다(다른 화면·카톡 카드가 그 형식을 그대로 쓴다).
const formatDeathDate = (value: string): string => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Seoul',
  }).format(d);
};

export const ObituaryView: React.FC<{ data: ObituaryData }> = ({ data }) => {
  const chief = data.mourners.find((m) => m.isChief);
  const rest = data.mourners.filter((m) => !m.isChief);

  // 길찾기(§6.3) — KakaoMapModal.tsx의 map.kakao.com/link/to 패턴은 좌표가 필요하다. Phase 1엔
  // Facility 검색 연동(§6.2, Phase 3 예정)이 없어 좌표가 없으므로, 자유입력 빈소명/주소로
  // 검색하는 map.kakao.com/link/search 변형을 대신 쓴다(좌표가 생기면 link/to로 교체).
  const mapQuery = [data.funeralHall, data.funeralHallAddr].filter(Boolean).join(' ');
  const kakaoMapUrl = mapQuery ? `https://map.kakao.com/link/search/${encodeURIComponent(mapQuery)}` : null;

  return (
    <div className="v2-obit-content">
      <div className="v2-obit-box">
        <div className="v2-obit-header">
          <p className="v2-obit-lede">삼가 고인의 명복을 빕니다</p>
          <h1 className="v2-obit-name">故 {data.deceasedName}</h1>
          {data.deceasedDeathDate && (
            <p className="v2-obit-death">{formatDeathDate(data.deceasedDeathDate)} 별세</p>
          )}
        </div>

        {/* 장례 일정 — 빈소·입관·발인·장지 */}
        <div className="v2-obit-section">
          <p className="v2-obit-section-title">장례 일정</p>
          {data.funeralHall && (
            <div className="v2-obit-row">
              <span className="v2-obit-row-label">빈소</span>
              <div className="v2-obit-row-value">
                <div>
                  {data.funeralHall}
                  {data.mourningRoom ? ` ${data.mourningRoom}` : ''}
                </div>
                {data.funeralHallAddr && <div className="v2-obit-addr">{data.funeralHallAddr}</div>}
                {/* 모바일 — 값 칸 안, 주소 아래 */}
                {kakaoMapUrl && (
                  <a href={kakaoMapUrl} target="_blank" rel="noreferrer" className="v2-btn-outline v2-obit-row-btn v2-obit-hall-cta">
                    <Navigation size={16} /> 길찾기
                  </a>
                )}
              </div>
              {/* 데스크톱 — 행 오른쪽 끝(시안 "데스크톱 C") */}
              {kakaoMapUrl && (
                <a href={kakaoMapUrl} target="_blank" rel="noreferrer" className="v2-btn-outline v2-obit-hall-cta-desktop">
                  <Navigation size={16} /> 길찾기
                </a>
              )}
            </div>
          )}
          {data.coffinAt && (
            <div className="v2-obit-row">
              <span className="v2-obit-row-label">입관</span>
              <div className="v2-obit-row-value">{formatKST(data.coffinAt)}</div>
            </div>
          )}
          <div className="v2-obit-row">
            <span className="v2-obit-row-label">발인</span>
            <div className="v2-obit-row-value">{formatKST(data.funeralAt)}</div>
          </div>
          {data.burialSite && (
            <div className="v2-obit-row">
              <span className="v2-obit-row-label">장지</span>
              <div className="v2-obit-row-value">{data.burialSite}</div>
            </div>
          )}
        </div>

        {/* 상주·유족 — 상주·유족·연락처 */}
        <div className="v2-obit-section">
          <p className="v2-obit-section-title">상주·유족</p>
          {chief && (
            <div className="v2-obit-row">
              <span className="v2-obit-row-label">상주</span>
              <div className="v2-obit-row-value">{chief.relationship} {chief.name}</div>
            </div>
          )}
          {rest.length > 0 && (
            <div className="v2-obit-row">
              <span className="v2-obit-row-label">유족</span>
              <div className="v2-obit-row-value">
                <div className="v2-obit-mourner-list v2-obit-mobile-only">
                  {rest.map((m) => (
                    <div key={`${m.relationship}-${m.name}`}>{m.relationship} {m.name}</div>
                  ))}
                </div>
                <span className="v2-obit-desktop-only">
                  {rest.map((m) => `${m.relationship} ${m.name}`).join(' · ')}
                </span>
              </div>
            </div>
          )}
          {data.contactPhone && (
            <div className="v2-obit-row">
              <span className="v2-obit-row-label">연락처</span>
              <div className="v2-obit-row-value">
                <span>{data.contactPhone}</span>
                {/* 규칙: 전화 걸기는 모바일에서만(데스크톱은 전화를 걸 수 없어 번호만 보인다) */}
                <a href={`tel:${data.contactPhone}`} className="v2-btn-outline v2-obit-row-btn v2-obit-mobile-only">
                  <Phone size={16} /> 전화 걸기
                </a>
              </div>
            </div>
          )}
        </div>

        {/* 마음 전하실 곳 — accountEnabled일 때만(Phase 1~2엔 화면 토글이 없어 항상 비어 있음) */}
        {data.account && (
          <div className="v2-obit-section">
            <p className="v2-obit-section-title">마음 전하실 곳</p>
            <div className="v2-obit-row">
              <span className="v2-obit-row-label">계좌</span>
              <div className="v2-obit-row-value">
                <div>{data.account.bankCode} {data.account.accountNumber}</div>
                <div className="v2-obit-addr">예금주 {data.account.holder}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 추모관 — 링크는 여기서만 노출(00-13 §4.5-1 (나)). 🔄 09-07 — "있다면"만 보여준다.
          부고장 개설 시 추모관 체크박스를 켜지 않았으면 연결이 없다. */}
      {data.memorialSlug && (
        <a href={`/m/${data.memorialSlug}`} className="v2-btn-outline v2-obit-memorial-btn">
          <Flower2 size={18} /> 추모관 들어가기
        </a>
      )}

      {/* §5.4-2 — 조문객 쪽 방어선. 카드는 공유 시점 스냅샷이라 바뀔 수 있으니 최종 수정 시각을 알린다. */}
      <div className="v2-obit-foot">
        <p className="v2-obit-foot-updated">최종 수정: {formatKST(data.updatedAt)}</p>
        <p className="v2-obit-foot-brand">이어봄</p>
      </div>
    </div>
  );
};
