import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Heart, Copy } from 'lucide-react';
import { BACKEND_URL } from '../config';
import { apiFetchRaw } from '../lib/api';
import { formatKST, formatDeathDate } from '../utils/obituaryCard';
import { copyObituaryLink } from '../utils/kakaoShare';
import { backdropCloseProps } from '../utils/backdropClose';
import { ConnectionFailed } from '../components/ConnectionFailed';

// 추모관 랜딩 — docs 05-01 §6.1-1. App.tsx isMemorialLandingRoute 패턴(ObituaryLandingPage.tsx와
// 같은 꼴)으로 Header/Sidebar/Footer 밖에서 뜬다. 부고장(ObituaryLandingPage.tsx:213)이 이미
// `/m/${slug}` 링크를 뿌리고 있어 로그인 불필요 — slug를 아는 누구나 들어올 수 있다.
// 🔴 사진 앨범은 이번 범위에서 뺀다(공개 조회 API 없음 + 로컬디스크라 재배포 시 소실,
// systems.md §5).
// 🔄 09-07 사용자 지시 — 조문객이 직접 누르는 "신고하기" 버튼(+확인 단계)을 없앴다. 서버 주소
// (`POST /api/memorials/:slug/report`)도 09-29 제거했다. 운영자 콘솔의 심사(`reviewMemorialReport`)도 09-30 삭제했다 —
// 방명록 개별 글 숨기기(`hideMemorialGuestbookEntry`, AdminPage.tsx "방명록 보기")만 남아 동작한다.
// 🔄 09-29 사람 결정 — 방명록 쓰기는 로그인 필수(보기·헌화는 비로그인 그대로). 작성자 이름은
// 서버가 로그인 사용자 이름으로 스냅샷하므로 이름 칸은 없다.
// 🔄 00-39 §6.7(2026-09-28 Opus, 시안 없음 §9.1) — `/o/:slug` 규칙을 그대로 적용한다. 틀은
// `.v2-obit-page > .v2-obit-content > .v2-obit-box`(ObituaryLandingPage.tsx·ObituaryView.tsx와
// 같은 구조), 머리·묶음 제목·점선 구분도 부고장 클래스를 그대로 쓴다. 새 요소(영정·추모 문구·
// 방명록 행)만 `.v2-obit-*` 접두사로 새 클래스를 더한다.

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

interface MemorialLandingPageProps {
  currentUser: string | null;
  onOpenLogin: () => void;
}

export const MemorialLandingPage: React.FC<MemorialLandingPageProps> = ({ currentUser, onOpenLogin }) => {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<MemorialData | null>(null);
  const [guestbook, setGuestbook] = useState<GuestbookEntry[]>([]);
  const [notFound, setNotFound] = useState(false);
  // 00-42 §5.2 ③ — 네트워크 실패·5xx는 "없음"이 아니라 "접속 실패"로 가른다(404만 notFound).
  const [connectionFailed, setConnectionFailed] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [loading, setLoading] = useState(true);

  const [tributeCount, setTributeCount] = useState(0);
  const [tributeState, setTributeState] = useState<'idle' | 'submitting' | 'error' | 'duplicate' | 'done'>('idle');

  // 🔄 00-39 §6.7 "방명록 길이"(2026-09-28 사람 결정 A) — 서버는 전부 주지만 화면에서 최근
  // 5개만 먼저 그린다. "10개 더 보기"를 누를 때마다 그 자리에서 10개씩 펼친다.
  const [visibleGuestCount, setVisibleGuestCount] = useState(5);

  // 🔄 2026-09-28 개발자 지시 — 방명록 작성을 페이지에 펼쳐두지 않고 모달로 연다("헌화하기"와
  // 같은 줄의 "방명록 남기기" 버튼이 연다).
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
  const [relationToDeceased, setRelationToDeceased] = useState('');
  const [message, setMessage] = useState('');
  const [guestSubmitting, setGuestSubmitting] = useState(false);
  const [guestError, setGuestError] = useState<string | null>(null);

  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setConnectionFailed(false);
    fetch(`${BACKEND_URL}/api/memorials/${slug}`)
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
        if (json.status === 'success') {
          setData(json.data);
          setTributeCount(json.data.tributeCount);
        } else {
          setNotFound(true);
        }
      })
      .catch(() => setConnectionFailed(true))
      .finally(() => setLoading(false));
  }, [slug, retryKey]);

  useEffect(() => {
    if (!slug || notFound || connectionFailed) return;
    fetch(`${BACKEND_URL}/api/memorials/${slug}/guestbook`)
      .then((res) => res.json())
      .then((json) => {
        if (json.status === 'success') setGuestbook(json.data);
      })
      .catch(() => {});
  }, [slug, notFound, connectionFailed]);

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
    if (!slug || !currentUser || !message.trim()) return;
    setGuestSubmitting(true);
    setGuestError(null);
    try {
      // 로그인 토큰을 함께 보낸다(apiFetchRaw 'USER'). 09-29부터 서버는 토큰이 없거나 유효하지 않으면 401.
      const res = await apiFetchRaw(`/api/memorials/${slug}/guestbook`, 'USER', {
        method: 'POST',
        body: JSON.stringify({ relationToDeceased, message }),
      });
      const json = await res.json();
      if (json.status !== 'success') {
        setGuestError(json.message || '방명록 작성 중 오류가 발생했습니다.');
        return;
      }
      setGuestbook([json.data, ...guestbook]);
      // 🔄 00-39 §6.7 — 새 글이 보이는 개수 안에 들어가게(펼친 개수 + 1). 이미 펼친 나머지는
      // 줄이지 않는다.
      setVisibleGuestCount((prev) => prev + 1);
      setRelationToDeceased('');
      setMessage('');
      setIsGuestModalOpen(false);
    } catch {
      setGuestError('방명록 작성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setGuestSubmitting(false);
    }
  };

  const closeGuestModal = () => {
    if (guestSubmitting) return;
    setIsGuestModalOpen(false);
    setGuestError(null);
  };

  // 🔄 2026-09-28 개발자 지시 — "링크 공유하기" → "링크 복사"로 변경(우상단 배치, 한 줄 차지
  // 안 함). MemorialPage.tsx의 "주소 복사"(copyAddress)와 같은 결로 WebShare 시도 없이
  // 클립보드로 바로 복사한다 — 버튼 문구가 "복사"인데 모바일에서 공유 시트가 뜨면 문구와
  // 동작이 어긋난다.
  const handleCopyLink = async () => {
    if (!slug) return;
    const url = `${window.location.origin}/m/${slug}`;
    const copied = await copyObituaryLink(url);
    setShareFeedback(copied ? '링크가 복사되었습니다.' : '복사에 실패했습니다. 주소창의 링크를 직접 복사해 주세요.');
  };

  if (loading) {
    return (
      <div className="v2-obit-page">
        <div className="v2-obit-content v2-obit-notfound">
          <p className="v2-obit-notfound-sub">불러오는 중...</p>
        </div>
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
          <p className="v2-obit-notfound-title">추모관을 찾을 수 없습니다.</p>
          <p className="v2-obit-notfound-sub">링크가 만료되었거나 잘못된 주소일 수 있습니다.</p>
        </div>
      </div>
    );
  }

  const tributeLocked = tributeState === 'submitting' || tributeState === 'duplicate' || tributeState === 'done';

  return (
    <div className="v2-obit-page">
      <div className="v2-obit-content">
        <div className="v2-obit-box">
          {/* 영정·근조 문구·이름·별세일·추모 문구. 링크 복사는 우상단 코너(한 줄 안 씀) */}
          <div className="v2-obit-header v2-obit-header-has-copy">
            <button type="button" onClick={handleCopyLink} className="v2-btn-outline v2-obit-copy-btn">
              <Copy size={14} /> 링크 복사
            </button>
            {data.portraitUrl && (
              <img src={data.portraitUrl} alt={data.deceasedName} className="v2-obit-portrait" />
            )}
            <p className="v2-obit-lede">삼가 고인의 명복을 빕니다</p>
            <h1 className="v2-obit-name">故 {data.deceasedName}</h1>
            {data.deceasedDeathDate && (
              <p className="v2-obit-death">{formatDeathDate(data.deceasedDeathDate)} 별세</p>
            )}
            {data.epitaph && <p className="v2-obit-epitaph">{data.epitaph}</p>}
            {shareFeedback && <p className="v2-obit-share-feedback">{shareFeedback}</p>}
          </div>

          {/* 🔄 2026-09-28 개발자 지시 — 방명록 목록 → 헌화 → 방명록 작성 순서로 재배치.
              🔄 00-39 §6.7 "방명록 길이" — 최근 5개만 먼저 보이고, 남은 게 있으면 아래에
              "N개 더 보기"(§6.7 목록 아래 CTA `.v2-list-footer-btn`). */}
          <div className="v2-obit-section">
            <p className="v2-obit-guest-heading">추모 방명록</p>
            <div className="v2-obit-guest-list">
              {guestbook.length === 0 ? (
                <p className="v2-empty">아직 남겨진 글이 없습니다.</p>
              ) : (
                guestbook.slice(0, visibleGuestCount).map((g) => (
                  <div key={g.id} className="v2-obit-guest-row">
                    <div className="v2-obit-guest-head">
                      <span className="v2-obit-guest-name">
                        {g.authorName}
                        {g.relationToDeceased ? ` · ${g.relationToDeceased}` : ''}
                      </span>
                      <span className="v2-obit-guest-date">{formatKST(g.createdAt)}</span>
                    </div>
                    <p className="v2-obit-guest-msg">{g.message}</p>
                  </div>
                ))
              )}
            </div>
            {guestbook.length > visibleGuestCount && (
              <button
                type="button"
                className="v2-btn-outline v2-list-footer-btn"
                onClick={() => setVisibleGuestCount((prev) => Math.min(prev + 10, guestbook.length))}
              >
                {guestbook.length - visibleGuestCount >= 10 ? '10개 더 보기' : `${guestbook.length - visibleGuestCount}개 더 보기`}
              </button>
            )}
          </div>

          {/* 🔄 2026-09-28 개발자 지시 — 헌화하기와 같은 줄 왼쪽에 "방명록 남기기"(모달 오픈).
              오른쪽(문구+헌화 버튼)은 이전처럼 우측 정렬 그룹으로 묶는다. */}
          <div className="v2-obit-section v2-obit-tribute">
            <div className="v2-obit-tribute-row">
              <button type="button" onClick={() => setIsGuestModalOpen(true)} className="v2-btn-outline">
                방명록 남기기
              </button>
              <div className="v2-obit-tribute-main">
                <span className="v2-obit-tribute-count">
                  지금까지 <strong>{tributeCount}번</strong> 헌화되었습니다.
                </span>
                <button type="button" onClick={handleTribute} disabled={tributeLocked} className="v2-btn-primary v2-obit-tribute-btn">
                  <Heart size={14} /> 헌화하기
                </button>
              </div>
            </div>
            {tributeState === 'duplicate' && <p className="v2-obit-tribute-status">이미 헌화하셨습니다.</p>}
            {tributeState === 'done' && <p className="v2-obit-tribute-status">헌화하셨습니다.</p>}
            {tributeState === 'error' && <p className="v2-error-text">헌화 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.</p>}
          </div>
        </div>

        <div className="v2-obit-foot">
          <p className="v2-obit-foot-brand">이어봄</p>
        </div>
      </div>

      {/* 🔄 2026-09-28 개발자 지시 — 방명록 작성을 페이지에 펼치지 않고 모달로. ObituaryPage.tsx·
          MemorialPage.tsx와 같은 폼 모달 뼈대(.v2-modal.is-form, §6.7 규칙 21)를 재사용한다. */}
      {isGuestModalOpen && (
        <div
          className="v2-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="guest-modal-title"
          {...backdropCloseProps(closeGuestModal)}
        >
          <div className="v2-modal is-form" onClick={(e) => e.stopPropagation()}>
            <h2 id="guest-modal-title" className="v2-modal-title">방명록 남기기</h2>
            {!currentUser ? (
              <>
                <p className="v2-notice">방명록은 로그인 후 남길 수 있습니다.</p>
                <div className="v2-modal-actions is-form-actions">
                  <button type="button" className="v2-btn-outline" onClick={closeGuestModal}>
                    닫기
                  </button>
                  <button
                    type="button"
                    className="v2-btn-primary"
                    onClick={() => {
                      setIsGuestModalOpen(false);
                      onOpenLogin();
                    }}
                  >
                    로그인
                  </button>
                </div>
              </>
            ) : (
            <form onSubmit={handleGuestbookSubmit} className="v2-form">
              <p className="v2-notice">작성자: {currentUser}</p>
              <div className="v2-field">
                <label htmlFor="guest-relation">
                  고인과의 관계 <span className="v2-opt">선택</span>
                </label>
                <input
                  id="guest-relation"
                  type="text"
                  className="v2-input"
                  value={relationToDeceased}
                  onChange={(e) => setRelationToDeceased(e.target.value)}
                />
              </div>
              <div className="v2-field">
                <label htmlFor="guest-message">
                  고인에게 전하는 글 <span className="v2-req">필수</span>
                </label>
                <textarea
                  id="guest-message"
                  className="v2-input v2-obit-guest-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />
              </div>
              {guestError && <span className="v2-error-text">{guestError}</span>}
              <div className="v2-modal-actions is-form-actions">
                <button type="button" className="v2-btn-outline" onClick={closeGuestModal} disabled={guestSubmitting}>
                  취소
                </button>
                <button type="submit" className="v2-btn-primary" disabled={guestSubmitting} aria-busy={guestSubmitting}>
                  {guestSubmitting ? '남기는 중…' : '방명록 남기기'}
                </button>
              </div>
            </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
