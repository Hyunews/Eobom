import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { BACKEND_URL } from '../config';
import { ObituaryView, type ObituaryData } from '../components/ObituaryView';

// 부고장 랜딩 — docs 07-03 §6.3. App.tsx 레이아웃(Header/Sidebar/Footer) 밖의 독립 페이지다
// (isPortalRoute 패턴 확장, §6.1). 카톡으로 링크를 받은 조문객이 보는 화면이라 로그인 불필요.
// 🔄 07-03 §6.4 ⓑ — 표현부는 `ObituaryView`로 추출됐다. 이 파일은 껍데기(useParams·fetch·
// noindex meta·loading·notFound)만 남는다 — noindex를 표현부에 딸려 보내면 관리 페이지에도 붙는다.

// 07-03 §5 체감 개선(2026-08-21) — 백엔드(Render 오리건)↔DB(Supabase 서울) 왕복 지연(§5 실측
// ~1.5초)은 이번 범위에서 못 없앤다(인프라 문제, render.yaml 밖). 대신 흰 화면에 "불러오는 중"
// 텍스트만 뜨던 것을, 실제 렌더와 같은 자리에 회색 블록을 먼저 잡아 레이아웃이 안 튀게 한다.
const ObituaryLandingSkeleton: React.FC = () => (
  <div style={{ width: '100%', maxWidth: '460px' }}>
    <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--r-lg)', boxShadow: 'var(--el-2)', overflow: 'hidden' }}>
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
          <p style={{ fontSize: 'var(--fs-body)', color: '#6C7A89' }}>링크가 만료되었거나 잘못된 주소일 수 있습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={pageShellStyle}>
      <ObituaryView data={data} />
    </div>
  );
};
