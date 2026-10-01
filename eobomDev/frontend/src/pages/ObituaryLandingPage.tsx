import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { BACKEND_URL } from '../config';
import { ObituaryView, type ObituaryData } from '../components/ObituaryView';
import { ConnectionFailed } from '../components/ConnectionFailed';

// 부고장 랜딩 — docs 07-03 §6.3. App.tsx 레이아웃(Header/Sidebar/Footer) 밖의 독립 페이지다
// (isPortalRoute 패턴 확장, §6.1). 카톡으로 링크를 받은 조문객이 보는 화면이라 로그인 불필요.
// 🔄 07-03 §6.4 ⓑ — 표현부는 `ObituaryView`로 추출됐다. 이 파일은 껍데기(useParams·fetch·
// noindex meta·loading·notFound)만 남는다 — noindex를 표현부에 딸려 보내면 관리 페이지에도 붙는다.
// 🔄 00-39 §6.7(2026-09-28) — 껍데기 스타일도 .v2-obit-page/.v2-obit-content로 옮겼다(인라인 없음).

// 07-03 §5 체감 개선(2026-08-21) — 백엔드(Render 오리건)↔DB(Supabase 서울) 왕복 지연(§5 실측
// ~1.5초)은 이번 범위에서 못 없앤다(인프라 문제, render.yaml 밖). 대신 흰 화면에 "불러오는 중"
// 텍스트만 뜨던 것을, 실제 렌더와 같은 자리에 회색 블록을 먼저 잡아 레이아웃이 안 튀게 한다.
// 🔄 2026-09-28(후속) — 데스크톱 박스형(.v2-obit-box)에 맞춰 머리·행 자리를 그 안에 넣는다.
// 모바일은 .v2-obit-box가 투명 래퍼라 겉모습은 1차 그대로. 추모관 버튼 자리는 박스 밖(실제
// 컴포넌트와 같은 위치)에 남긴다.
const ObituaryLandingSkeleton: React.FC = () => (
  <div className="v2-obit-content">
    <div className="v2-obit-box">
      <div className="v2-obit-header">
        <div className="skeleton-block" style={{ width: '160px', height: '13px', margin: '0 0 8px' }} />
        <div className="skeleton-block" style={{ width: '190px', height: '28px' }} />
      </div>

      {/* 빈소·발인 자리 */}
      <div className="v2-obit-section">
        {[0, 1].map((i) => (
          <div key={i} className="v2-obit-row">
            <span className="v2-obit-row-label">
              <span className="skeleton-block" style={{ width: '32px', height: '13px' }} />
            </span>
            <div className="v2-obit-row-value">
              <span className="skeleton-block" style={{ width: '70%', height: '16px' }} />
            </div>
          </div>
        ))}
      </div>

      {/* 상주 자리 */}
      <div className="v2-obit-section">
        <div className="v2-obit-row">
          <span className="v2-obit-row-label">
            <span className="skeleton-block" style={{ width: '32px', height: '13px' }} />
          </span>
          <div className="v2-obit-row-value">
            <span className="skeleton-block" style={{ width: '45%', height: '16px' }} />
          </div>
        </div>
      </div>
    </div>

    {/* 추모관 들어가기 버튼 자리 */}
    <div className="skeleton-block" style={{ width: '100%', height: '52px', marginTop: '8px' }} />
  </div>
);

export const ObituaryLandingPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<ObituaryData | null>(null);
  const [notFound, setNotFound] = useState(false);
  // 00-42 §5.2 ③ — 네트워크 실패·5xx는 "없음"이 아니라 "접속 실패"로 가른다(404만 notFound).
  const [connectionFailed, setConnectionFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [retryKey, setRetryKey] = useState(0);

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
    setLoading(true);
    setConnectionFailed(false);
    fetch(`${BACKEND_URL}/api/obituaries/${slug}`)
      .then(async (res) => {
        if (res.status === 404) {
          setNotFound(true);
          return null;
        }
        if (res.status >= 500 || res.status === 429) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (!json) return;
        if (json.status === 'success') setData(json.data);
        else setNotFound(true);
      })
      .catch(() => setConnectionFailed(true))
      .finally(() => setLoading(false));
  }, [slug, retryKey]);

  if (loading) {
    return (
      <div className="v2-obit-page">
        <ObituaryLandingSkeleton />
      </div>
    );
  }

  if (connectionFailed) {
    return (
      <div className="v2-obit-page">
        <div className="v2-obit-content">
          <ConnectionFailed onRetry={() => setRetryKey((k) => k + 1)} />
        </div>
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="v2-obit-page">
        <div className="v2-obit-content v2-obit-notfound">
          <p className="v2-obit-notfound-title">부고장을 찾을 수 없습니다.</p>
          <p className="v2-obit-notfound-sub">링크가 만료되었거나 잘못된 주소일 수 있습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="v2-obit-page">
      <ObituaryView data={data} />
    </div>
  );
};
