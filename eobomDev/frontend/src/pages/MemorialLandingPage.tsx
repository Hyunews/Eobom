import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Heart, MessageSquarePlus, Share2 } from 'lucide-react';
import { BACKEND_URL } from '../config';
import { apiFetchRaw } from '../lib/api';
import { formatKST } from '../utils/obituaryCard';
import { shareViaWebShareApi, copyObituaryLink } from '../utils/kakaoShare';

// 추모관 랜딩 — docs 05-01 §6.1-1. App.tsx isMemorialLandingRoute 패턴(ObituaryLandingPage.tsx와
// 같은 꼴)으로 Header/Sidebar/Footer 밖에서 뜬다. 부고장(ObituaryLandingPage.tsx:213)이 이미
// `/m/${slug}` 링크를 뿌리고 있어 로그인 불필요 — slug를 아는 누구나 들어올 수 있다.
// 🔴 사진 앨범은 이번 범위에서 뺀다(공개 조회 API 없음 + 로컬디스크라 재배포 시 소실,
// systems.md §5).
// 🔄 09-07 사용자 지시 — 조문객이 직접 누르는 "신고하기" 버튼(+확인 단계)을 없앴다. 백엔드
// `POST /api/memorials/:slug/report`·운영자 콘솔의 심사(`reviewMemorialReport`)는 코드는
// 그대로 두지만, 이 버튼이 유일한 호출부였다 — 이제 새 `reportedAt`이 채워질 방법이 없으므로
// 운영자 화면의 "복구/비공개 유지" 버튼(reportedAt 있을 때만 노출)도 앞으로는 사실상 안 뜬다.
// 방명록 개별 글 숨기기(`hideMemorialGuestbookEntry`, AdminPage.tsx "방명록 보기")는 신고
// 여부와 무관하게 그대로 동작한다.

interface MemorialData {
  deceasedName: string;
  deceasedDeathDate: string | null;
  portraitUrl: string | null;
  epitaph: string | null;
  tributeCount: number;
}

interface GuestbookEntry {
  id: string;
  authorName: string;
  relationToDeceased: string | null;
  message: string;
  createdAt: string;
}

export const MemorialLandingPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<MemorialData | null>(null);
  const [guestbook, setGuestbook] = useState<GuestbookEntry[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  const [tributeCount, setTributeCount] = useState(0);
  const [tributeState, setTributeState] = useState<'idle' | 'submitting' | 'error' | 'duplicate' | 'done'>('idle');

  const [authorName, setAuthorName] = useState('');
  const [relationToDeceased, setRelationToDeceased] = useState('');
  const [message, setMessage] = useState('');
  const [guestSubmitting, setGuestSubmitting] = useState(false);
  const [guestError, setGuestError] = useState<string | null>(null);

  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    fetch(`${BACKEND_URL}/api/memorials/${slug}`)
      .then(async (res) => {
        if (res.status === 404) {
          setNotFound(true);
          return null;
        }
        return res.json();
      })
      .then((json) => {
        if (!json) return;
        if (json.status === 'success') {
          setData(json.data);
          setTributeCount(json.data.tributeCount);
        } else {
          setNotFound(true);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!slug || notFound) return;
    fetch(`${BACKEND_URL}/api/memorials/${slug}/guestbook`)
      .then((res) => res.json())
      .then((json) => {
        if (json.status === 'success') setGuestbook(json.data);
      })
      .catch(() => {});
  }, [slug, notFound]);

  // 🔄 2026-09-21 사용자 지시 — 헌화는 로그인 정보를 보내지 않는다(비회원도 하는 상호작용이라 계정과 무관하게 둔다).
  // 대신 **1인 1회 제한을 이 브라우저의 localStorage에 저장**한다(추모관마다 키 하나). 서버는 비회원 헌화를
  // 막지 않으므로(visitorHash는 느슨한 억제뿐) 여기서 막는 것이 사실상 유일한 제한이다 — 다른 브라우저·기기·
  // 저장소 삭제로는 다시 할 수 있다("큰 문제 아님", 사용자 확인). 저장소가 막힌 환경(시크릿 모드 등)에서는
  // 조용히 넘어가고 제한만 없어진다.
  const tributeStorageKey = slug ? `eobom_tributed_${slug}` : null;
  const markTributed = () => {
    if (!tributeStorageKey) return;
    try { localStorage.setItem(tributeStorageKey, '1'); } catch { /* 저장 불가 환경 — 제한 없이 진행 */ }
  };

  useEffect(() => {
    if (!tributeStorageKey) return;
    try {
      if (localStorage.getItem(tributeStorageKey) === '1') setTributeState('duplicate');
    } catch { /* 저장 불가 환경 */ }
  }, [tributeStorageKey]);

  const handleTribute = async () => {
    if (!slug || tributeState === 'submitting' || tributeState === 'duplicate' || tributeState === 'done') return;
    setTributeState('submitting');
    try {
      const res = await fetch(`${BACKEND_URL}/api/memorials/${slug}/tributes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (res.status === 409) {
        markTributed();
        setTributeState('duplicate');
        return;
      }
      if (json.status !== 'success') {
        setTributeState('error');
        return;
      }
      setTributeCount(json.data.tributeCount);
      markTributed();
      setTributeState('done');
    } catch {
      setTributeState('error');
    }
  };

  const handleGuestbookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug || !authorName.trim() || !message.trim()) return;
    setGuestSubmitting(true);
    setGuestError(null);
    try {
      // 🔄 2026-09-21 — 로그인 토큰을 함께 보낸다(apiFetchRaw 'USER'). 백엔드(createGuestbookEntry)는 토큰이 오면
      // userId를 저장하는데, 예전엔 plain fetch라 토큰이 안 실려 **로그인한 채 쓴 글도 비회원 글(userId=null)** 로
      // 저장됐다 → 마이페이지 "내가 남긴 방명록"(SCR-021, userId 일치)에 안 떴다. 토큰이 없으면 예전처럼 비회원 글.
      // 유효하지 않은 토큰이어도 이 라우트는 401을 내지 않고 비회원으로 취급한다(verifyBearerToken → null).
      const res = await apiFetchRaw(`/api/memorials/${slug}/guestbook`, 'USER', {
        method: 'POST',
        body: JSON.stringify({ authorName, relationToDeceased, message }),
      });
      const json = await res.json();
      if (json.status !== 'success') {
        setGuestError(json.message || '방명록 작성 중 오류가 발생했습니다.');
        return;
      }
      setGuestbook([json.data, ...guestbook]);
      setAuthorName('');
      setRelationToDeceased('');
      setMessage('');
    } catch {
      setGuestError('방명록 작성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setGuestSubmitting(false);
    }
  };

  // 링크 공유(2026-09-02 사용자 리포트) — 부고장에서 들어온 조문객이 이 주소를 다시 알 방법이
  // URL 직접 복사뿐이었다. ObituaryPage.tsx와 같은 07-03 §7 폴백 사다리(WebShare→클립보드)를
  // 그대로 재사용 — Kakao.Share는 페이지 마운트 시 ensureKakaoShareReady()를 부르지 않아 뺀다.
  const handleShare = async () => {
    if (!slug || !data) return;
    const url = `${window.location.origin}/m/${slug}`;
    const shared = await shareViaWebShareApi({
      title: `故 ${data.deceasedName}님 추모관`,
      description: '추모관에서 헌화하고 방명록을 남겨주세요.',
      imageUrl: data.portraitUrl || '',
      url,
      buttonLabel: '추모관 보기',
    });
    if (shared) return;
    const copied = await copyObituaryLink(url);
    setShareFeedback(copied ? '링크가 복사되었습니다.' : '복사에 실패했습니다. 주소창의 링크를 직접 복사해 주세요.');
  };

  // 00-38 §4.1 — 좌우 여백을 토큰화(값은 그대로 16px, --gutter-chrome과 정확히 일치).
  // §8.4 — 토큰·거터만 적용, 본체(MemorialPage)는 범위 밖.
  const pageShellStyle: React.CSSProperties = {
    minHeight: '100vh',
    backgroundColor: '#FBF9F5',
    display: 'flex',
    justifyContent: 'center',
    padding: '2.5rem var(--gutter-chrome)',
  };
  const cardStyle: React.CSSProperties = {
    backgroundColor: '#FFFFFF',
    borderRadius: 'var(--r-lg)',
    boxShadow: 'var(--el-2)',
    overflow: 'hidden',
  };

  if (loading) {
    return (
      <div style={pageShellStyle}>
        <div style={{ width: '100%', maxWidth: '460px', textAlign: 'center', paddingTop: '3rem', color: '#94A3B8' }}>
          불러오는 중...
        </div>
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div style={pageShellStyle}>
        <div style={{ textAlign: 'center', maxWidth: '360px', paddingTop: '3rem' }}>
          <p style={{ fontSize: '1.05rem', color: '#1A2B4C', fontWeight: 700, marginBottom: '0.5rem' }}>추모관을 찾을 수 없습니다.</p>
          <p style={{ fontSize: 'var(--fs-body)', color: '#6C7A89' }}>링크가 만료되었거나 잘못된 주소일 수 있습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={pageShellStyle}>
      <div style={{ width: '100%', maxWidth: '460px' }}>
        <div style={cardStyle}>
          {/* 영정·고인명·사망일 */}
          <div style={{ backgroundColor: '#1A2B4C', color: '#FFFFFF', padding: '2rem 1.75rem', textAlign: 'center' }}>
            {data.portraitUrl && (
              <img
                src={data.portraitUrl}
                alt={data.deceasedName}
                style={{ width: '96px', height: '96px', borderRadius: '50%', objectFit: 'cover', margin: '0 auto 1rem', border: '3px solid rgba(255,255,255,0.3)' }}
              />
            )}
            <p style={{ fontSize: 'var(--fs-body)', color: '#94A3B8', letterSpacing: '0.1em', marginBottom: '0.6rem' }}>삼가 고인의 명복을 빕니다</p>
            {/* 🔄 2026-09-09 — 하드코딩 문자열 → .section-title 프리미티브(폰트 정리 요청). */}
            <h1 className="section-title" style={{ fontSize: '1.6rem', fontWeight: 'var(--fw-bold)', margin: 0 }}>
              故 {data.deceasedName}
              {data.deceasedDeathDate && (
                <span style={{ fontSize: 'var(--fs-body)', fontWeight: 400, color: 'var(--border-color)' }}> ( ~ {formatKST(data.deceasedDeathDate).split(' ').slice(0, 2).join(' ')})</span>
              )}
            </h1>
            {data.epitaph && (
              <p style={{ fontSize: 'var(--fs-body)', color: 'var(--border-color)', marginTop: 'var(--sp-4)', fontStyle: 'italic' }}>{data.epitaph}</p>
            )}
          </div>

          {/* 링크 공유 — 상시 노출(07-03 §7과 같은 원칙). 부고장을 거치지 않고 이 화면에
              들어온 사람도 다른 유족·조문객에게 이 추모관 주소를 넘길 수 있어야 한다. */}
          <div style={{ padding: '0.9rem 1.75rem', borderBottom: '1px solid #EAE5DC', textAlign: 'center' }}>
            <button
              type="button"
              onClick={handleShare}
              style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: 'var(--r-lg)', padding: '0.45rem 1rem', fontSize: 'var(--fs-body)', color: 'var(--primary-color)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Share2 size={14} /> 이 추모관 링크 공유하기
            </button>
            {shareFeedback && (
              <p style={{ fontSize: 'var(--fs-body)', color: 'var(--text-muted)', marginTop: '0.5rem' }}>{shareFeedback}</p>
            )}
          </div>

          {/* 헌화 */}
          <div style={{ textAlign: 'center', padding: '1.5rem', backgroundColor: 'var(--secondary-color)' }}>
            <p style={{ fontSize: 'var(--fs-body)', color: 'var(--text-muted)', marginBottom: '0.9rem' }}>
              지금까지 <strong style={{ color: 'var(--primary-color)' }}>{tributeCount}번</strong> 헌화되었습니다.
            </p>
            <button
              onClick={handleTribute}
              disabled={tributeState === 'submitting' || tributeState === 'duplicate' || tributeState === 'done'}
              className="btn btn-point"
              style={{ opacity: tributeState === 'idle' || tributeState === 'error' ? 1 : 0.6 }}
            >
              <Heart color="#FFFFFF" size={18} /> 헌화하기
            </button>
            {tributeState === 'duplicate' && (
              <p style={{ fontSize: 'var(--fs-body)', color: 'var(--state-warn-fg)', marginTop: '0.6rem' }}>이미 헌화하셨습니다.</p>
            )}
            {tributeState === 'done' && (
              <p style={{ fontSize: 'var(--fs-body)', color: 'var(--text-muted)', marginTop: '0.6rem' }}>헌화하셨습니다.</p>
            )}
            {tributeState === 'error' && (
              <p style={{ fontSize: 'var(--fs-body)', color: 'var(--state-warn-fg)', marginTop: '0.6rem' }}>헌화 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.</p>
            )}
          </div>

          {/* 방명록 */}
          <div style={{ padding: '1.5rem 1.75rem' }}>
            <h4 style={{ color: 'var(--primary-color)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
              <MessageSquarePlus color="var(--primary-color)" size={20} /> 추모 방명록
            </h4>
            <form onSubmit={handleGuestbookSubmit} style={{ marginBottom: '1.1rem' }}>
              <div className="form-group">
                <input
                  type="text"
                  placeholder="이름"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="text"
                  placeholder="고인과의 관계 (선택)"
                  value={relationToDeceased}
                  onChange={(e) => setRelationToDeceased(e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <textarea
                  placeholder="고인에게 전하는 글"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="form-input"
                  style={{ height: '80px', padding: 'var(--sp-3)' }}
                  required
                />
              </div>
              {guestError && (
                <p style={{ fontSize: 'var(--fs-body)', color: 'var(--state-warn-fg)', marginBottom: '0.6rem' }}>{guestError}</p>
              )}
              <button type="submit" disabled={guestSubmitting} className="btn btn-primary" style={{ width: '100%', opacity: guestSubmitting ? 0.6 : 1 }}>
                방명록 남기기
              </button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)', maxHeight: '300px', overflowY: 'auto' }}>
              {guestbook.length === 0 && (
                <p style={{ fontSize: 'var(--fs-body)', color: '#94A3B8', textAlign: 'center', padding: '1rem 0' }}>아직 남겨진 글이 없습니다.</p>
              )}
              {guestbook.map((g) => (
                <div key={g.id} style={{ padding: '0.9rem', backgroundColor: 'var(--secondary-color)', borderRadius: 'var(--r-sm)', borderLeft: '3px solid var(--primary-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-body)', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--primary-color)' }}>
                      {g.authorName}{g.relationToDeceased ? ` · ${g.relationToDeceased}` : ''}
                    </span>
                    <span>{formatKST(g.createdAt)}</span>
                  </div>
                  <p style={{ fontSize: 'var(--fs-body)', color: 'var(--text-main)', whiteSpace: 'pre-wrap' }}>{g.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: 'var(--fs-body)', color: 'var(--border-color)', marginTop: '1rem' }}>이어봄</p>
      </div>
    </div>
  );
};
