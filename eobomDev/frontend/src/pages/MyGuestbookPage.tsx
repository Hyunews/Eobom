import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { apiFetch, ApiError } from '../lib/api';
import { backdropCloseProps } from '../utils/backdropClose';
import '../styles/design-v2.css';

// 00-36 §4.7(SCR-021) — "내가 남긴 방명록". 마이페이지 `내가 남긴 것` 구간의 행이 여는 화면.
// 데이터: `GET /api/me/guestbook-entries`(M-2, meActivityController.ts) — 회원으로 쓴 글만(비회원 글은 userId가
// null이라 애초에 안 잡힌다), 상주가 지웠거나(deletedByOwnerAt)·운영자가 숨겼거나(hiddenAt)·본인이 지운
// (deletedByAuthorAt) 글은 서버가 뺐다.
// 화면 규칙: 00-39 §6 훑는 목록. 열 = 어디에(추모관 성함 → /m/:slug) · 무엇을(내 글 한 줄, 말줄임) · 언제.
//
// 🔵 본문을 보여도 된다 — 00-36 §4.2의 "내용은 안 보여준다"는 암호화 저장된 사적 기록(편지·엔딩노트)에 대한
// 규칙이고 방명록은 애초에 공개 글이다. 🔴 빈 상태에 권유 문구를 붙이지 않는다.
// 🔄 M-3(2026-09-21) — 내 글 삭제를 켰다(허용 확정, 00-36 §4.7-1). `DELETE /api/me/guestbook-entries/:id`는
// 행을 지우지 않고 `deletedByAuthorAt`만 찍는 **소프트 삭제**라 이 화면·추모관 공개 목록에서만 사라진다.
// 규칙: 확인 모달(되돌릴 수 없는 행동) + 규칙 19(누르면 버튼이 잠기고 `삭제 중…`).
// 🔴 00-36 §6 #9와 같은 이유로 100건까지만 그리고, 서버가 101건째를 내려주면 잘렸다는 한 줄을 단다.

const LIST_LIMIT = 100;

interface GuestbookEntry {
  id: string;
  message: string;
  relationToDeceased: string | null;
  createdAt: string;
  memorial: { slug: string; deceasedName: string; isClosed: boolean };
}

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}.${mm}.${dd}`;
};

interface MyGuestbookPageProps {
  currentUser?: string | null;
  onOpenLogin?: () => void;
}

export const MyGuestbookPage: React.FC<MyGuestbookPageProps> = ({ currentUser, onOpenLogin }) => {
  const [entries, setEntries] = useState<GuestbookEntry[] | null>(null);
  const [truncated, setTruncated] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<GuestbookEntry | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    apiFetch<GuestbookEntry[]>('/api/me/guestbook-entries', 'USER')
      .then((rows) => {
        setTruncated(rows.length > LIST_LIMIT);
        setEntries(rows.slice(0, LIST_LIMIT));
      })
      .catch(() => setLoadError(true));
  }, [currentUser]);

  const confirmDelete = async () => {
    if (!confirmTarget || deleting) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await apiFetch(`/api/me/guestbook-entries/${confirmTarget.id}`, 'USER', { method: 'DELETE' });
      setEntries((prev) => (prev ? prev.filter((e) => e.id !== confirmTarget.id) : prev));
      setConfirmTarget(null);
    } catch (e) {
      setDeleteError(e instanceof ApiError ? e.message : '삭제 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setDeleting(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="v2-page">
        <div className="v2-content">
          <h1 className="v2-page-title">내가 남긴 방명록</h1>
          <p className="v2-empty">로그인 후 확인하실 수 있습니다.</p>
          <button type="button" className="v2-btn-primary" onClick={onOpenLogin}>로그인 / 회원가입</button>
        </div>
      </div>
    );
  }

  return (
    <div className="v2-page">
      <div className="v2-content">
        <h1 className="v2-page-title">내가 남긴 방명록</h1>

        {loadError && <p className="v2-error-text">불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>}
        {!loadError && entries === null && <p className="v2-empty">불러오는 중…</p>}
        {!loadError && entries !== null && entries.length === 0 && <p className="v2-empty">아직 남기신 글이 없습니다.</p>}

        {entries && entries.length > 0 && (
          <div className="v2-hub-section">
            {entries.map((entry) => (
              <div key={entry.id} className="v2-nav-row-wrap">
                <Link className="v2-nav-row" to={`/m/${entry.memorial.slug}`}>
                  <span className="v2-nav-row-text">
                    <span className="v2-nav-row-label">{entry.memorial.deceasedName}</span>
                    <span className="v2-nav-row-sub">{entry.message}</span>
                  </span>
                  <span className="v2-nav-row-meta">{formatDate(entry.createdAt)}</span>
                  <span className="v2-nav-row-arrow"><ChevronRight size={18} /></span>
                </Link>
                <button type="button" className="v2-row-action" onClick={() => { setDeleteError(null); setConfirmTarget(entry); }}>삭제</button>
              </div>
            ))}
            {truncated && <p className="v2-hub-foot">최근 {LIST_LIMIT}건까지만 표시됩니다.</p>}
          </div>
        )}
      </div>

      {confirmTarget && (
        <div className="v2-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="my-guestbook-delete-title" {...backdropCloseProps(() => { if (!deleting) setConfirmTarget(null); })}>
          <div className="v2-modal" onClick={(e) => e.stopPropagation()}>
            <h3 id="my-guestbook-delete-title" className="v2-modal-title">이 글을 삭제할까요?</h3>
            <p className="v2-modal-value" style={{ margin: '0 0 8px' }}>
              {confirmTarget.memorial.deceasedName} 추모관에 남긴 글이 삭제되어 다른 분들에게도 보이지 않게 됩니다.
            </p>
            <p className="v2-check-sub" style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{confirmTarget.message}</p>
            {deleteError && <p role="alert" className="v2-error-text" style={{ margin: '12px 0 0' }}>{deleteError}</p>}
            <div className="v2-modal-actions">
              <button type="button" className="v2-btn-outline" onClick={() => setConfirmTarget(null)} disabled={deleting}>취소</button>
              <button type="button" className="v2-btn-solid" onClick={confirmDelete} disabled={deleting} aria-busy={deleting}>
                {deleting ? '삭제 중…' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
