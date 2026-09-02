import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Heart, MessageSquarePlus, Flag, Share2 } from 'lucide-react';
import { BACKEND_URL } from '../config';
import { formatKST } from '../utils/obituaryCard';
import { shareViaWebShareApi, copyObituaryLink } from '../utils/kakaoShare';

// 추모관 랜딩 — docs 05-01 §6.1-1. App.tsx isMemorialLandingRoute 패턴(ObituaryLandingPage.tsx와
// 같은 꼴)으로 Header/Sidebar/Footer 밖에서 뜬다. 부고장(ObituaryLandingPage.tsx:213)이 이미
// `/m/${slug}` 링크를 뿌리고 있어 로그인 불필요 — slug를 아는 누구나 들어올 수 있다.
// 🔴 사진 앨범은 이번 범위에서 뺀다(공개 조회 API 없음 + 로컬디스크라 재배포 시 소실,
// systems.md §5).

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
  const [tributeState, setTributeState] = useState<'idle' | 'submitting' | 'error' | 'duplicate'>('idle');

  const [authorName, setAuthorName] = useState('');
  const [relationToDeceased, setRelationToDeceased] = useState('');
  const [message, setMessage] = useState('');
  const [guestSubmitting, setGuestSubmitting] = useState(false);
  const [guestError, setGuestError] = useState<string | null>(null);

  const [reportState, setReportState] = useState<'idle' | 'confirming' | 'submitting' | 'done' | 'error'>('idle');
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

  const handleTribute = async () => {
    if (!slug || tributeState === 'submitting') return;
    setTributeState('submitting');
    try {
      const res = await fetch(`${BACKEND_URL}/api/memorials/${slug}/tributes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (res.status === 409) {
        setTributeState('duplicate');
        return;
      }
      if (json.status !== 'success') {
        setTributeState('error');
        return;
      }
      setTributeCount(json.data.tributeCount);
      setTributeState('idle');
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
      const res = await fetch(`${BACKEND_URL}/api/memorials/${slug}/guestbook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  const handleReportConfirm = async () => {
    if (!slug) return;
    setReportState('submitting');
    try {
      const res = await fetch(`${BACKEND_URL}/api/memorials/${slug}/report`, { method: 'POST' });
      const json = await res.json();
      if (json.status !== 'success') {
        setReportState('error');
        return;
      }
      setReportState('done');
    } catch {
      setReportState('error');
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

  const pageShellStyle: React.CSSProperties = {
    minHeight: '100vh',
    backgroundColor: '#FBF9F5',
    display: 'flex',
    justifyContent: 'center',
    padding: '2.5rem 1rem',
  };
  const cardStyle: React.CSSProperties = {
    backgroundColor: '#FFFFFF',
    borderRadius: '20px',
    boxShadow: '0 12px 35px rgba(26,43,76,0.08)',
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
          <p style={{ fontSize: '0.9rem', color: '#6C7A89' }}>링크가 만료되었거나 잘못된 주소일 수 있습니다.</p>
        </div>
      </div>
    );
  }

  if (reportState === 'done') {
    return (
      <div style={pageShellStyle}>
        <div style={{ textAlign: 'center', maxWidth: '360px', paddingTop: '3rem' }}>
          <p style={{ fontSize: '1.05rem', color: '#1A2B4C', fontWeight: 700, marginBottom: '0.5rem' }}>신고가 접수되었습니다.</p>
          <p style={{ fontSize: '0.9rem', color: '#6C7A89' }}>확인이 끝날 때까지 이 추모관은 비공개로 전환됩니다.</p>
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
            <p style={{ fontSize: '0.85rem', color: '#94A3B8', letterSpacing: '0.1em', marginBottom: '0.6rem' }}>삼가 고인의 명복을 빕니다</p>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, fontFamily: "'KoPub World Batang', serif" }}>
              故 {data.deceasedName}
              {data.deceasedDeathDate && (
                <span style={{ fontSize: '0.95rem', fontWeight: 400, color: '#CBD5E1' }}> ( ~ {formatKST(data.deceasedDeathDate).split(' ').slice(0, 2).join(' ')})</span>
              )}
            </h1>
            {data.epitaph && (
              <p style={{ fontSize: '0.9rem', color: '#CBD5E1', marginTop: '0.8rem', fontStyle: 'italic' }}>{data.epitaph}</p>
            )}
          </div>

          {/* 링크 공유 — 상시 노출(07-03 §7과 같은 원칙). 부고장을 거치지 않고 이 화면에
              들어온 사람도 다른 유족·조문객에게 이 추모관 주소를 넘길 수 있어야 한다. */}
          <div style={{ padding: '0.9rem 1.75rem', borderBottom: '1px solid #EAE5DC', textAlign: 'center' }}>
            <button
              type="button"
              onClick={handleShare}
              style={{ background: 'none', border: '1px solid #CBD5E1', borderRadius: '20px', padding: '0.45rem 1rem', fontSize: '0.85rem', color: 'var(--primary-color)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Share2 size={14} /> 이 추모관 링크 공유하기
            </button>
            {shareFeedback && (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>{shareFeedback}</p>
            )}
          </div>

          {/* 헌화 */}
          <div style={{ textAlign: 'center', padding: '1.5rem', backgroundColor: 'var(--secondary-color)' }}>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginBottom: '0.9rem' }}>
              지금까지 <strong style={{ color: 'var(--primary-color)' }}>{tributeCount}번</strong> 헌화되었습니다.
            </p>
            <button
              onClick={handleTribute}
              disabled={tributeState === 'submitting'}
              className="btn btn-point"
              style={{ opacity: tributeState === 'submitting' ? 0.6 : 1 }}
            >
              <Heart color="#FFFFFF" size={18} /> 헌화하기
            </button>
            {tributeState === 'duplicate' && (
              <p style={{ fontSize: '0.85rem', color: '#92400E', marginTop: '0.6rem' }}>이미 헌화하셨습니다.</p>
            )}
            {tributeState === 'error' && (
              <p style={{ fontSize: '0.85rem', color: '#92400E', marginTop: '0.6rem' }}>헌화 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.</p>
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
                  style={{ height: '80px', padding: '0.75rem' }}
                  required
                />
              </div>
              {guestError && (
                <p style={{ fontSize: '0.85rem', color: '#92400E', marginBottom: '0.6rem' }}>{guestError}</p>
              )}
              <button type="submit" disabled={guestSubmitting} className="btn btn-primary" style={{ width: '100%', height: '44px', fontSize: '0.95rem', opacity: guestSubmitting ? 0.6 : 1 }}>
                방명록 남기기
              </button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto' }}>
              {guestbook.length === 0 && (
                <p style={{ fontSize: '0.85rem', color: '#94A3B8', textAlign: 'center', padding: '1rem 0' }}>아직 남겨진 글이 없습니다.</p>
              )}
              {guestbook.map((g) => (
                <div key={g.id} style={{ padding: '0.9rem', backgroundColor: 'var(--secondary-color)', borderRadius: '8px', borderLeft: '3px solid var(--primary-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--primary-color)' }}>
                      {g.authorName}{g.relationToDeceased ? ` · ${g.relationToDeceased}` : ''}
                    </span>
                    <span>{formatKST(g.createdAt)}</span>
                  </div>
                  <p style={{ fontSize: '0.95rem', color: 'var(--text-main)', whiteSpace: 'pre-wrap' }}>{g.message}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 신고 */}
          <div style={{ borderTop: '1px solid #EAE5DC', padding: '1rem 1.75rem' }}>
            {reportState === 'idle' && (
              <button
                type="button"
                onClick={() => setReportState('confirming')}
                style={{ background: 'none', border: 'none', padding: 0, fontSize: '0.8rem', color: '#94A3B8', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
              >
                <Flag size={12} /> 이 추모관 신고하기
              </button>
            )}
            {reportState === 'confirming' && (
              <div style={{ fontSize: '0.85rem', color: '#1A2B4C' }}>
                <p style={{ marginBottom: '0.6rem' }}>정말 신고하시겠습니까? 접수 즉시 이 추모관은 비공개로 전환됩니다.</p>
                <div style={{ display: 'flex', gap: '0.6rem' }}>
                  <button type="button" onClick={handleReportConfirm} style={{ background: '#9A3412', color: '#FFFFFF', border: 'none', borderRadius: '6px', padding: '0.4rem 0.8rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                    신고 확정
                  </button>
                  <button type="button" onClick={() => setReportState('idle')} style={{ background: '#E2E8F0', color: '#1A2B4C', border: 'none', borderRadius: '6px', padding: '0.4rem 0.8rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                    취소
                  </button>
                </div>
              </div>
            )}
            {reportState === 'submitting' && (
              <p style={{ fontSize: '0.8rem', color: '#94A3B8' }}>신고 접수 중...</p>
            )}
            {reportState === 'error' && (
              <p style={{ fontSize: '0.8rem', color: '#92400E' }}>신고 접수 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.</p>
            )}
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.85rem', color: '#CBD5E1', marginTop: '1rem' }}>이어봄</p>
      </div>
    </div>
  );
};
