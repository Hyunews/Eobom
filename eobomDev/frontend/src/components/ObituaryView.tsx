import React from 'react';
import { Phone, Flower2, Navigation } from 'lucide-react';
import { formatKST } from '../utils/obituaryCard';

// 07-03 §6.4 ⓑ — ObituaryLandingPage.tsx의 표현부를 추출한 것. 조문객 화면(/o/{slug})과
// 관리 모드 미리보기 모달(ObituaryPage.tsx)이 이 컴포넌트 하나를 공유한다.
// 🔴 fetch·useParams·noindex meta·loading·notFound는 여기 없다 — 껍데기(랜딩 페이지)의 몫이다.
// noindex가 이 컴포넌트에 딸려가면 관리 페이지(/obituary)에도 noindex가 붙는다.

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

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ display: 'flex', gap: '1rem', padding: '0.6rem 0', borderBottom: '1px solid #EAE5DC' }}>
    <span style={{ width: '52px', flexShrink: 0, fontSize: 'var(--fs-body)', fontWeight: 700, color: '#6C7A89' }}>{label}</span>
    <span style={{ fontSize: 'var(--fs-body)', color: '#1A2B4C', lineHeight: 1.5 }}>{children}</span>
  </div>
);

export const ObituaryView: React.FC<{ data: ObituaryData }> = ({ data }) => {
  const chief = data.mourners.find((m) => m.isChief);
  const rest = data.mourners.filter((m) => !m.isChief);

  // 길찾기(§6.3) — KakaoMapModal.tsx의 map.kakao.com/link/to 패턴은 좌표가 필요하다. Phase 1엔
  // Facility 검색 연동(§6.2, Phase 3 예정)이 없어 좌표가 없으므로, 자유입력 빈소명/주소로
  // 검색하는 map.kakao.com/link/search 변형을 대신 쓴다(좌표가 생기면 link/to로 교체).
  const mapQuery = [data.funeralHall, data.funeralHallAddr].filter(Boolean).join(' ');
  const kakaoMapUrl = mapQuery ? `https://map.kakao.com/link/search/${encodeURIComponent(mapQuery)}` : null;

  return (
    <div style={{ width: '100%', maxWidth: '460px' }}>
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--r-lg)', boxShadow: 'var(--el-2)', overflow: 'hidden' }}>
        {/* 근조 헤더 */}
        <div style={{ backgroundColor: '#1A2B4C', color: '#FFFFFF', padding: '2rem 1.75rem', textAlign: 'center' }}>
          <p style={{ fontSize: 'var(--fs-body)', color: '#94A3B8', letterSpacing: '0.1em', marginBottom: '0.6rem' }}>삼가 고인의 명복을 빕니다</p>
          <h1 className="section-title" style={{ fontSize: '1.6rem', fontWeight: 'var(--fw-bold)', margin: 0 }}>
            故 {data.deceasedName}
            {data.deceasedDeathDate && (
              <span style={{ fontSize: 'var(--fs-body)', fontWeight: 400, color: 'var(--border-color)' }}> ( ~ {formatKST(data.deceasedDeathDate).split(' ').slice(0, 2).join(' ')})</span>
            )}
          </h1>
        </div>

        <div style={{ padding: '1.5rem 1.75rem' }}>
          {/* 빈소·입관·발인·장지 */}
          <div style={{ marginBottom: '1.2rem' }}>
            {data.funeralHall && (
              <Row label="빈소">
                {data.funeralHall}
                {data.mourningRoom ? ` ${data.mourningRoom}` : ''}
                {kakaoMapUrl && (
                  <a href={kakaoMapUrl} target="_blank" rel="noreferrer" style={{ marginLeft: '0.5rem', fontSize: 'var(--fs-body)', color: 'var(--point-color)', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                    <Navigation size={12} /> 길찾기
                  </a>
                )}
              </Row>
            )}
            {data.coffinAt && <Row label="입관">{formatKST(data.coffinAt)}</Row>}
            <Row label="발인">{formatKST(data.funeralAt)}</Row>
            {data.burialSite && <Row label="장지">{data.burialSite}</Row>}
          </div>

          {/* 상주·유족·연락처 */}
          <div style={{ marginBottom: data.account ? '1.2rem' : 0 }}>
            {chief && <Row label="상주">{chief.relationship} {chief.name}</Row>}
            {rest.length > 0 && (
              <Row label="">{rest.map((m) => `${m.relationship} ${m.name}`).join('  ')}</Row>
            )}
            {data.contactPhone && (
              <Row label="연락처">
                {data.contactPhone}
                <a href={`tel:${data.contactPhone}`} style={{ marginLeft: '0.6rem', fontSize: 'var(--fs-body)', color: 'var(--point-color)', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                  <Phone size={12} /> 전화 걸기
                </a>
              </Row>
            )}
          </div>

          {/* 마음 전하실 곳 — accountEnabled일 때만(Phase 1~2엔 화면 토글이 없어 항상 비어 있음) */}
          {data.account && (
            <div style={{ backgroundColor: 'var(--surface-subtle)', borderRadius: 'var(--r-sm)', padding: '0.9rem 1rem', marginBottom: '0.5rem' }}>
              <p style={{ fontSize: 'var(--fs-body)', fontWeight: 700, color: '#1A2B4C', marginBottom: '0.3rem' }}>마음 전하실 곳</p>
              <p style={{ fontSize: 'var(--fs-body)', color: '#1A2B4C', margin: 0 }}>
                {data.account.bankCode} {data.account.accountNumber} ({data.account.holder})
              </p>
            </div>
          )}
        </div>

        {/* 추모관 — 링크는 여기서만 노출(00-13 §4.5-1 (나)). 🔄 09-07 — 이제 "있다면"만
            보여준다. 부고장 개설 시 추모관 체크박스를 켜지 않았으면 연결이 없다. */}
        {data.memorialSlug && (
          <a
            href={`/m/${data.memorialSlug}`}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              padding: '1rem', backgroundColor: 'var(--secondary-color)', color: 'var(--point-color)',
              fontWeight: 700, fontSize: 'var(--fs-body)', textDecoration: 'none', borderTop: '1px solid #EAE5DC',
            }}
          >
            <Flower2 size={18} /> 추모관 들어가기
          </a>
        )}
      </div>

      {/* §5.4-2 — 조문객 쪽 방어선. 카드는 공유 시점 스냅샷이라 바뀔 수 있으니 최종 수정 시각을 알린다. */}
      <p style={{ textAlign: 'center', fontSize: 'var(--fs-body)', color: '#94A3B8', marginTop: '1rem' }}>
        최종 수정: {formatKST(data.updatedAt)} · 정보는 유족이 언제든 바꿀 수 있습니다.
      </p>
      <p style={{ textAlign: 'center', fontSize: 'var(--fs-body)', color: 'var(--border-color)', marginTop: '0.4rem' }}>이어봄</p>
    </div>
  );
};
