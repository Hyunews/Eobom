import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Phone, Flower2, Navigation } from 'lucide-react';
import { BACKEND_URL } from '../config';
import { formatKST } from '../utils/obituaryCard';

// 부고장 랜딩 — docs 07-03 §6.3. App.tsx 레이아웃(Header/Sidebar/Footer) 밖의 독립 페이지다
// (isPortalRoute 패턴 확장, §6.1). 카톡으로 링크를 받은 조문객이 보는 화면이라 로그인 불필요.

interface Mourner {
  name: string;
  relationship: string;
  isChief: boolean;
}

interface ObituaryData {
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
  memorialSlug: string;
  cardFieldsUpdatedAt: string | null;
  updatedAt: string;
  account?: { bankCode: string | null; accountNumber: string | null; holder: string | null };
}

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ display: 'flex', gap: '1rem', padding: '0.6rem 0', borderBottom: '1px solid #EAE5DC' }}>
    <span style={{ width: '52px', flexShrink: 0, fontSize: '0.85rem', fontWeight: 700, color: '#6C7A89' }}>{label}</span>
    <span style={{ fontSize: '0.95rem', color: '#1A2B4C', lineHeight: 1.5 }}>{children}</span>
  </div>
);

// 07-03 §5 체감 개선(2026-08-21) — 백엔드(Render 오리건)↔DB(Supabase 서울) 왕복 지연(§5 실측
// ~1.5초)은 이번 범위에서 못 없앤다(인프라 문제, render.yaml 밖). 대신 흰 화면에 "불러오는 중"
// 텍스트만 뜨던 것을, 실제 렌더와 같은 자리에 회색 블록을 먼저 잡아 레이아웃이 안 튀게 한다.
const ObituaryLandingSkeleton: React.FC = () => (
  <div style={{ width: '100%', maxWidth: '460px' }}>
    <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', boxShadow: '0 12px 35px rgba(26,43,76,0.08)', overflow: 'hidden' }}>
      {/* 근조 헤더 자리 */}
      <div style={{ backgroundColor: '#1A2B4C', padding: '2rem 1.75rem', textAlign: 'center' }}>
        <div className="skeleton-block" style={{ width: '160px', height: '12px', margin: '0 auto 0.9rem', backgroundColor: 'rgba(255,255,255,0.18)' }} />
        <div className="skeleton-block" style={{ width: '190px', height: '24px', margin: '0 auto', backgroundColor: 'rgba(255,255,255,0.24)' }} />
      </div>

      <div style={{ padding: '1.5rem 1.75rem' }}>
        {/* 빈소·발인 자리 */}
        <div style={{ marginBottom: '1.2rem' }}>
          {[0, 1].map((i) => (
            <div key={i} style={{ display: 'flex', gap: '1rem', padding: '0.6rem 0', borderBottom: '1px solid #EAE5DC' }}>
              <div className="skeleton-block" style={{ width: '40px', height: '13px', flexShrink: 0 }} />
              <div className="skeleton-block" style={{ width: '70%', height: '13px' }} />
            </div>
          ))}
        </div>
        {/* 상주 자리 */}
        <div>
          <div style={{ display: 'flex', gap: '1rem', padding: '0.6rem 0' }}>
            <div className="skeleton-block" style={{ width: '40px', height: '13px', flexShrink: 0 }} />
            <div className="skeleton-block" style={{ width: '45%', height: '13px' }} />
          </div>
        </div>
      </div>

      {/* 추모관 들어가기 바 자리 */}
      <div style={{ height: '52px', backgroundColor: 'var(--secondary-color)', borderTop: '1px solid #EAE5DC' }} />
    </div>
  </div>
);

export const ObituaryLandingPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<ObituaryData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  // §6.3 — noindex, nofollow(§8 #2). X-Robots-Tag HTTP 헤더는 Phase 2(OG 서버 렌더, §9)에서
  // 서버가 붙인다 — 지금은 SPA라 클라이언트 <meta>가 최선이다.
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => {
      document.head.removeChild(meta);
    };
  }, []);

  useEffect(() => {
    if (!slug) return;
    fetch(`${BACKEND_URL}/api/obituaries/${slug}`)
      .then(async (res) => {
        if (res.status === 404) {
          setNotFound(true);
          return null;
        }
        return res.json();
      })
      .then((json) => {
        if (!json) return;
        if (json.status === 'success') setData(json.data);
        else setNotFound(true);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  const pageShellStyle: React.CSSProperties = {
    minHeight: '100vh',
    backgroundColor: '#FBF9F5',
    display: 'flex',
    justifyContent: 'center',
    padding: '2.5rem 1rem',
  };

  if (loading) {
    return (
      <div style={pageShellStyle}>
        <ObituaryLandingSkeleton />
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div style={pageShellStyle}>
        <div style={{ textAlign: 'center', maxWidth: '360px', paddingTop: '3rem' }}>
          <p style={{ fontSize: '1.05rem', color: '#1A2B4C', fontWeight: 700, marginBottom: '0.5rem' }}>부고장을 찾을 수 없습니다.</p>
          <p style={{ fontSize: '0.9rem', color: '#6C7A89' }}>링크가 만료되었거나 잘못된 주소일 수 있습니다.</p>
        </div>
      </div>
    );
  }

  const chief = data.mourners.find((m) => m.isChief);
  const rest = data.mourners.filter((m) => !m.isChief);

  // 길찾기(§6.3) — KakaoMapModal.tsx의 map.kakao.com/link/to 패턴은 좌표가 필요하다. Phase 1엔
  // Facility 검색 연동(§6.2, Phase 3 예정)이 없어 좌표가 없으므로, 자유입력 빈소명/주소로
  // 검색하는 map.kakao.com/link/search 변형을 대신 쓴다(좌표가 생기면 link/to로 교체).
  const mapQuery = [data.funeralHall, data.funeralHallAddr].filter(Boolean).join(' ');
  const kakaoMapUrl = mapQuery ? `https://map.kakao.com/link/search/${encodeURIComponent(mapQuery)}` : null;

  return (
    <div style={pageShellStyle}>
      <div style={{ width: '100%', maxWidth: '460px' }}>
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', boxShadow: '0 12px 35px rgba(26,43,76,0.08)', overflow: 'hidden' }}>
          {/* 근조 헤더 */}
          <div style={{ backgroundColor: '#1A2B4C', color: '#FFFFFF', padding: '2rem 1.75rem', textAlign: 'center' }}>
            <p style={{ fontSize: '0.85rem', color: '#94A3B8', letterSpacing: '0.1em', marginBottom: '0.6rem' }}>삼가 고인의 명복을 빕니다</p>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, fontFamily: "'KoPub World Batang', serif" }}>
              故 {data.deceasedName}
              {data.deceasedDeathDate && (
                <span style={{ fontSize: '0.95rem', fontWeight: 400, color: '#CBD5E1' }}> ( ~ {formatKST(data.deceasedDeathDate).split(' ').slice(0, 2).join(' ')})</span>
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
                    <a href={kakaoMapUrl} target="_blank" rel="noreferrer" style={{ marginLeft: '0.5rem', fontSize: '0.85rem', color: 'var(--point-color)', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
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
                  <a href={`tel:${data.contactPhone}`} style={{ marginLeft: '0.6rem', fontSize: '0.85rem', color: 'var(--point-color)', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                    <Phone size={12} /> 전화 걸기
                  </a>
                </Row>
              )}
            </div>

            {/* 마음 전하실 곳 — accountEnabled일 때만(Phase 1~2엔 화면 토글이 없어 항상 비어 있음) */}
            {data.account && (
              <div style={{ backgroundColor: '#F1F5F9', borderRadius: '10px', padding: '0.9rem 1rem', marginBottom: '0.5rem' }}>
                <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1A2B4C', marginBottom: '0.3rem' }}>마음 전하실 곳</p>
                <p style={{ fontSize: '0.95rem', color: '#1A2B4C', margin: 0 }}>
                  {data.account.bankCode} {data.account.accountNumber} ({data.account.holder})
                </p>
              </div>
            )}
          </div>

          {/* 추모관 — 링크는 여기서만 노출(00-13 §4.5-1 (나)) */}
          <a
            href={`/m/${data.memorialSlug}`}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              padding: '1rem', backgroundColor: 'var(--secondary-color)', color: 'var(--point-color)',
              fontWeight: 700, fontSize: '0.95rem', textDecoration: 'none', borderTop: '1px solid #EAE5DC',
            }}
          >
            <Flower2 size={18} /> 추모관 들어가기
          </a>
        </div>

        {/* §5.4-2 — 조문객 쪽 방어선. 카드는 공유 시점 스냅샷이라 바뀔 수 있으니 최종 수정 시각을 알린다. */}
        <p style={{ textAlign: 'center', fontSize: '0.85rem', color: '#94A3B8', marginTop: '1rem' }}>
          최종 수정: {formatKST(data.updatedAt)} · 정보는 유족이 언제든 바꿀 수 있습니다.
        </p>
        <p style={{ textAlign: 'center', fontSize: '0.85rem', color: '#CBD5E1', marginTop: '0.4rem' }}>이어봄</p>
      </div>
    </div>
  );
};
