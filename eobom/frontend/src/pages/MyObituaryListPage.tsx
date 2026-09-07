import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flower2, FileEdit, ExternalLink, Share2, ArrowRight, Trash2 } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { OBITUARY_CARD_IMAGE_URL } from '../config';
import { formatKST, formatObituaryCardTitle, formatObituaryCardDescription } from '../utils/obituaryCard';
import { parseMemorialLink } from '../utils/memorialLink';
import { ensureKakaoShareReady, shareViaKakao, shareViaWebShareApi, copyObituaryLink, reportObituaryShare } from '../utils/kakaoShare';

// 00-06 §8(SCR-018) — Header "추모관" 메뉴가 홈 박스③(링크 입력창)으로만 보내서, 부고장을 만든
// 당사자가 정작 본인이 만든 부고장·추모관에 다시 들어갈 방법이 없다는 사용자 리포트 대응.
// Header 메뉴는 로그인 상태에서만 렌더되므로(Header.tsx currentUser 가드) 이 화면은 항상
// 로그인 사용자만 본다. `GET /api/me/obituaries` — 부고장 링크(/o/:slug)까지 함께 내려줘야 해서다.
// 🔄 09-07 사용자 지시 — "부고장과 추모관은 구분해서 관리되어야 한다." 추모관 생성·삭제·
// 주소복사 같은 관리 액션은 전부 `/memorial` 화면으로 옮겼다. 여기는 부고장만 관리하고,
// 연결된 추모관이 있으면 "있다면" 열어볼 수 있는 링크 하나만 읽기 전용으로 보여준다
// (ObituaryLandingPage.tsx의 "추모관 들어가기"와 같은 최소 노출 원칙).

interface MyObituary {
  id: string;
  slug: string;
  memorialSlug: string | null;
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
  // 카드별로 다른 부고장을 다루므로, 문구도 어느 카드 것인지(id) 함께 들고 그 카드
  // 아래에만 렌더한다 — 예전엔 전역 문자열 하나라 목록 맨 아래(마지막 카드 밖)에 떴다(사람 리포트).
  const [feedback, setFeedback] = useState<{ id: string; message: string } | null>(null);

  const [linkInput, setLinkInput] = useState('');
  const [linkError, setLinkError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<MyObituary[]>('/api/me/obituaries', 'USER')
      .then(setObituaries)
      .catch(() => setLoadError(true));
  }, []);

  // Kakao.Share.sendDefault는 클릭 핸들러 안에서 동기 호출돼야 팝업 차단을 피한다(§7) —
  // 그래서 로드는 마운트 시점에 미리 끝내둔다(ObituaryPage.tsx와 같은 패턴).
  useEffect(() => {
    ensureKakaoShareReady();
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

  // 부고장 공유 — 카카오톡으로 연결(§7 폴백 사다리 1순위 Kakao.Share, ObituaryPage.tsx와 동일
  // 패턴). Kakao SDK가 준비 안 됐거나 실패하면 Web Share API → 링크 복사 순으로 폴백한다.
  const shareObituary = async (o: MyObituary) => {
    const url = `${window.location.origin}/o/${o.slug}`;
    const cardInput = {
      deceasedName: o.deceasedName,
      funeralHall: o.funeralHall,
      mourningRoom: o.mourningRoom,
      funeralAt: o.funeralAt,
    };
    const params = {
      title: formatObituaryCardTitle(cardInput),
      description: formatObituaryCardDescription(cardInput),
      imageUrl: OBITUARY_CARD_IMAGE_URL,
      url,
      buttonLabel: '부고 보기',
    };
    if (shareViaKakao(params)) {
      reportObituaryShare(o.slug);
      return;
    }
    if (await shareViaWebShareApi(params)) {
      reportObituaryShare(o.slug);
      return;
    }
    const copied = await copyObituaryLink(url);
    if (copied) reportObituaryShare(o.slug);
    setFeedback({ id: o.id, message: copied ? '카카오톡 공유를 열 수 없어 링크를 복사했습니다.' : '공유에 실패했습니다. 아래 링크를 직접 복사해 주세요.' });
  };

  // 부고장 삭제 — 진행중·종료 모두 대상, 되돌리기 없음(handleCloseObituary와 같은 window.confirm
  // 패턴, ObituaryPage.tsx). 부고장(봉투)만 지운다 — 추모관(목적지)은 남는다(백엔드 주석 참고).
  const deleteObituary = async (o: MyObituary) => {
    if (!window.confirm(`부고장만 삭제됩니다. 추모관은 삭제되지 않고 그대로 유지됩니다.\n\n故 ${o.deceasedName}님의 부고장을 삭제하시겠어요? 삭제하면 되돌릴 수 없습니다.`)) return;
    setDeletingId(o.id);
    try {
      await apiFetch(`/api/obituaries/${o.id}`, 'USER', { method: 'DELETE' });
      setObituaries((prev) => (prev ? prev.filter((item) => item.id !== o.id) : prev));
    } catch {
      setFeedback({ id: o.id, message: '부고장 삭제에 실패했습니다. 잠시 후 다시 시도해주세요.' });
    } finally {
      setDeletingId(null);
    }
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
      <h2 style={{ marginBottom: '0.3rem' }}>내 부고장</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
        내가 만든 부고장에 다시 들어가거나, 받으신 링크로 다른 추모관에 입장할 수 있습니다.
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
                  <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                    {!o.isClosed && (
                      <button
                        type="button"
                        onClick={() => navigate(`/obituary?slug=${o.slug}`)}
                        className="btn"
                        style={{ height: '36px', padding: '0 0.8rem', fontSize: '0.82rem', backgroundColor: 'var(--card-bg)', border: '1px solid #CBD5E1' }}
                      >
                        수정
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => deleteObituary(o)}
                      disabled={deletingId === o.id}
                      className="btn"
                      style={{
                        height: '36px', padding: '0 0.8rem', fontSize: '0.82rem', backgroundColor: 'var(--card-bg)',
                        border: '1px solid #FCA5A5', color: '#B91C1C', opacity: deletingId === o.id ? 0.6 : 1,
                        display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                      }}
                    >
                      <Trash2 size={14} /> 삭제
                    </button>
                  </div>
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
                {/* 🔄 09-07 — 추모관 관리(생성·삭제·주소복사)는 /memorial로 옮겼다. 여긴
                    "있다면" 열어볼 수 있는 링크 하나만 읽기 전용으로. */}
                {o.memorialSlug && (
                  <div style={linkGroupStyle}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', width: '3.4rem' }}>추모관</span>
                    <button type="button" onClick={() => navigate(`/m/${o.memorialSlug}`)} style={iconBtnStyle}>
                      <ExternalLink size={13} /> 열기
                    </button>
                  </div>
                )}

                {feedback?.id === o.id && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{feedback.message}</p>
                )}
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          // 🔴 09-07 — `/obituary`만 넘기면 그 화면이 localStorage 포인터를 읽어 마지막으로
          // 본(어쩌면 종료된) 부고장을 다시 불러왔다 — "새로" 만들기가 안 됐다. `?new=1`로
          // ObituaryPage.tsx가 포인터를 무시하고 빈 폼으로 시작하게 한다(ObituaryPage.tsx
          // handleStartNew 참고).
          onClick={() => navigate('/obituary?new=1')}
          style={{ marginTop: '1rem', background: 'none', border: 'none', padding: 0, color: 'var(--point-color)', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
        >
          새 부고장 만들기 <ArrowRight size={14} />
        </button>
      </div>

      {/* 🔄 09-07 — 추모관은 완전히 별도 화면에서 만들고 지운다. 부고장 목록에 끼워 넣지
          않고, 그 화면으로 가는 링크만 안내한다. */}
      <div style={{ ...cardStyle, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Flower2 size={18} color="var(--primary-color)" />
          <span style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>추모관은 여기가 아니라 디지털 추모관 화면에서 따로 만들고 관리합니다.</span>
        </div>
        <button
          type="button"
          onClick={() => navigate('/memorial')}
          style={{ background: 'none', border: 'none', padding: 0, color: 'var(--point-color)', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', whiteSpace: 'nowrap' }}
        >
          디지털 추모관으로 <ArrowRight size={14} />
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
