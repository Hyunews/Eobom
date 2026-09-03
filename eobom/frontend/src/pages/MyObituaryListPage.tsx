import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flower2, FileEdit, ExternalLink, Share2, ArrowRight } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { formatKST, formatObituaryCardTitle, formatObituaryCardDescription } from '../utils/obituaryCard';
import { parseMemorialLink } from '../utils/memorialLink';
import { shareViaWebShareApi, copyObituaryLink } from '../utils/kakaoShare';

// 00-06 §8(SCR-018) — Header "추모관" 메뉴가 홈 박스③(링크 입력창)으로만 보내서, 부고장을 만든
// 당사자가 정작 본인이 만든 부고장·추모관에 다시 들어갈 방법이 없다는 사용자 리포트 대응.
// Header 메뉴는 로그인 상태에서만 렌더되므로(Header.tsx currentUser 가드) 이 화면은 항상
// 로그인 사용자만 본다. `/api/me/memorials`(기존, 손대지 않음)와 별개인 새 엔드포인트
// `GET /api/me/obituaries`를 쓴다 — 부고장 링크(/o/:slug)까지 함께 내려줘야 해서다.

interface MyObituary {
  id: string;
  slug: string;
  memorialSlug: string;
  deceasedName: string;
  deceasedDeathDate: string | null;
  funeralHall: string | null;
  mourningRoom: string | null;
  funeralAt: string | null;
  closedAt: string | null;
  isClosed: boolean;
  createdAt: string;
}

export const MyObituaryListPage: React.FC = () => {
  const navigate = useNavigate();
  const [obituaries, setObituaries] = useState<MyObituary[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  const [linkInput, setLinkInput] = useState('');
  const [linkError, setLinkError] = useState('');

  useEffect(() => {
    apiFetch<MyObituary[]>('/api/me/obituaries', 'USER')
      .then(setObituaries)
      .catch(() => setLoadError(true));
  }, []);

  const handleLinkEnter = () => {
    const raw = linkInput.trim();
    if (!raw) {
      setLinkError('받으신 추모관 링크를 입력해 주세요.');
      return;
    }
    const parsed = parseMemorialLink(raw);
    if (!parsed) {
      setLinkError('추모관 링크 형식이 아닙니다. 받으신 링크를 다시 확인해 주세요.');
      return;
    }
    setLinkError('');
    if (parsed.isCrossOrigin) {
      window.location.href = raw;
    } else {
      navigate(parsed.path);
    }
  };

  const shareObituary = async (o: MyObituary) => {
    const url = `${window.location.origin}/o/${o.slug}`;
    const cardInput = {
      deceasedName: o.deceasedName,
      funeralHall: o.funeralHall,
      mourningRoom: o.mourningRoom,
      funeralAt: o.funeralAt,
    };
    const shared = await shareViaWebShareApi({
      title: formatObituaryCardTitle(cardInput),
      description: formatObituaryCardDescription(cardInput),
      imageUrl: '',
      url,
      buttonLabel: '부고 보기',
    });
    if (shared) return;
    const copied = await copyObituaryLink(url);
    setShareFeedback(copied ? '부고장 링크가 복사되었습니다.' : '복사에 실패했습니다. 주소창의 링크를 직접 복사해 주세요.');
  };

  const shareMemorial = async (o: MyObituary) => {
    const url = `${window.location.origin}/m/${o.memorialSlug}`;
    const shared = await shareViaWebShareApi({
      title: `故 ${o.deceasedName}님 추모관`,
      description: '추모관에서 헌화하고 방명록을 남겨주세요.',
      imageUrl: '',
      url,
      buttonLabel: '추모관 보기',
    });
    if (shared) return;
    const copied = await copyObituaryLink(url);
    setShareFeedback(copied ? '추모관 링크가 복사되었습니다.' : '복사에 실패했습니다. 주소창의 링크를 직접 복사해 주세요.');
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--card-bg)',
    borderRadius: 'var(--border-radius)',
    boxShadow: 'var(--box-shadow)',
    padding: '1.5rem',
  };

  const linkGroupStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap',
  };

  const iconBtnStyle: React.CSSProperties = {
    height: '32px', padding: '0 0.6rem', fontSize: '0.78rem', backgroundColor: 'var(--card-bg)',
    border: '1px solid #CBD5E1', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex',
    alignItems: 'center', gap: '0.3rem',
  };

  return (
    <div className="container" style={{ paddingBottom: '3rem', maxWidth: '640px' }}>
      <h2 style={{ marginBottom: '0.3rem' }}>내 부고장·추모관</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
        내가 만든 부고장·추모관에 다시 들어가거나, 받으신 링크로 다른 추모관에 입장할 수 있습니다.
      </p>

      {/* ① 내가 만든 부고장 목록 */}
      <div style={{ ...cardStyle, marginBottom: '1.5rem' }}>
        <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileEdit size={18} color="var(--primary-color)" /> 내가 만든 부고장
        </h4>

        {obituaries === null && !loadError && (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>불러오는 중...</p>
        )}
        {loadError && (
          <p style={{ color: '#92400E', fontSize: '0.9rem' }}>목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.</p>
        )}
        {obituaries !== null && obituaries.length === 0 && (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>아직 만든 부고장이 없습니다.</p>
        )}

        {obituaries !== null && obituaries.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            {obituaries.map((o) => (
              <div
                key={o.id}
                style={{
                  padding: '0.9rem 1rem', backgroundColor: 'var(--secondary-color)', borderRadius: '10px',
                  display: 'flex', flexDirection: 'column', gap: '0.6rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                  <div>
                    <p style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                      故 {o.deceasedName}
                      {o.isClosed && (
                        <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)' }}>· 종료됨</span>
                      )}
                      {!o.isClosed && (
                        <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', fontWeight: 400, color: 'var(--point-color)' }}>· 진행중</span>
                      )}
                    </p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {o.deceasedDeathDate ? `사망일 ${formatKST(o.deceasedDeathDate)}` : `개설일 ${formatKST(o.createdAt)}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(`/obituary?slug=${o.slug}`)}
                    className="btn"
                    style={{ height: '36px', padding: '0 0.8rem', fontSize: '0.82rem', backgroundColor: 'var(--card-bg)', border: '1px solid #CBD5E1', flexShrink: 0 }}
                  >
                    관리
                  </button>
                </div>

                <div style={linkGroupStyle}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', width: '3.4rem' }}>부고장</span>
                  <button type="button" onClick={() => navigate(`/o/${o.slug}`)} style={iconBtnStyle}>
                    <ExternalLink size={13} /> 열기
                  </button>
                  <button type="button" onClick={() => shareObituary(o)} style={iconBtnStyle}>
                    <Share2 size={13} /> 공유
                  </button>
                </div>
                <div style={linkGroupStyle}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', width: '3.4rem' }}>추모관</span>
                  <button type="button" onClick={() => navigate(`/m/${o.memorialSlug}`)} style={iconBtnStyle}>
                    <ExternalLink size={13} /> 열기
                  </button>
                  <button type="button" onClick={() => shareMemorial(o)} style={iconBtnStyle}>
                    <Share2 size={13} /> 공유
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {shareFeedback && (
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.8rem' }}>{shareFeedback}</p>
        )}

        <button
          type="button"
          onClick={() => navigate('/obituary')}
          style={{ marginTop: '1rem', background: 'none', border: 'none', padding: 0, color: 'var(--point-color)', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
        >
          새 부고장 만들기 <ArrowRight size={14} />
        </button>
      </div>

      {/* ② 받으신 링크로 입장 — 홈 박스③과 같은 규칙(parseMemorialLink) */}
      <div style={cardStyle}>
        <h4 style={{ marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Flower2 size={18} color="var(--primary-color)" /> 받으신 추모관 링크로 입장
        </h4>
        <div className="form-group" style={{ marginBottom: '0.5rem' }}>
          <input
            type="text"
            placeholder="받으신 링크를 그대로 붙여넣어 주세요"
            value={linkInput}
            onChange={(e) => {
              setLinkInput(e.target.value);
              if (linkError) setLinkError('');
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleLinkEnter()}
            className="form-input"
          />
        </div>
        {linkError && (
          <p style={{ fontSize: '0.85rem', color: '#B91C1C', marginBottom: '0.6rem' }}>{linkError}</p>
        )}
        <button type="button" onClick={handleLinkEnter} className="btn btn-primary" style={{ width: '100%', height: '44px' }}>
          입장하기
        </button>
      </div>
    </div>
  );
};
