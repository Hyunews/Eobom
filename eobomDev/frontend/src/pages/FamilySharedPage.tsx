import React, { useCallback, useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { apiFetch, apiFetchRaw, ApiError } from '../lib/api';
import { SECTIONS, RELATIONSHIP_LABEL } from '../components/endingNote/constants';
import '../styles/design-v2.css';
import { LoginGate } from '../components/LoginGate';
import { backdropCloseProps } from '../utils/backdropClose';
import { formatKstDate, formatKstMonthDayTime } from '../utils/kstDate';
import { entryFields } from '../components/familyShared/sectionFields';
import { ReleaseRequestModal } from '../components/familyShared/ReleaseRequestModal';
import { PendingFamilyPanel } from '../components/familyShared/PendingFamilyPanel';

// 00-36 §4.6-1(SCR-020) — "나에게 공유된 것". 나를 가족으로 지정한 분별로, 지금 열람할 수 있는
// 엔딩노트 섹션을 보여준다. 데이터는 `GET /api/ending-note/family-view`.
// 시안: Design 캔버스 "그룹② mypage 시안" v4(S1~S4). 규칙 정본은 00-39 §6 훑는 목록 + 폼 모달 뼈대(.v2-modal).
//
// 🔴 보이지 않아야 하는 것(§4.6-1) — 응답에 애초에 없으므로 그릴 수도 없다. 응답 필드를 늘려도 여기
// 표시를 늘리지 말 것: 지정자 연락처·이메일(00-27 §3 불변식 2) · 같은 노트의 다른 수락자 ·
// 열리지 않은 사후 섹션의 존재 자체(06-04 §7.4 "잠긴 섹션은 제목도 보이지 않는다" — API가 이미 그렇게 내려준다).
// 🔴 과장 금지 — "○○님의 엔딩노트를 볼 수 있습니다" 류 문구를 쓰지 않는다. 열린 것만 그린다. 🔴 빈 상태에 권유 문구를 붙이지 않는다.
//
// 🔄 2026-09-21 M-2(00-36 §4.6-1-1) — family-view 응답에 scope·acceptedAt이 더해져 표시한다. 🔴 문구는 초대
// 수락 화면과 같은 말이다: relationship은 **지정자가 적은 값**이라 "자녀"는 내가 그분의 자녀라는 뜻 —
// "지정 관계 · 자녀"는 방향이 빠져 반대로 읽히므로 "나를 자녀로 지정 · 주 연락자"로 쓴다.
//
// 🔄 2026-09-30 00-41 3-B — 사후 개봉. ① 요청 폼(§8.1) ② 요청 상태(§8.2: 접수·반려·취소) ③ 개봉(RELEASED) 뒤 자기 권한
// 섹션 + 자기 앞 편지 ④ [가족에게 알리기](§6 — 이어봄은 보내지 않는다, 링크는 /family-shared 주소만, 토큰 없음)
// ⑤ 아직 수락하지 않은 가족 재초대(§7.3). 🔴 이어봄이 발송한다는 뜻의 문구 금지(00-41 §6). 개봉 여부 판정은 서버뿐이다.

interface FamilyViewEntry {
  section: string;
  title: string | null;
  value: unknown;
  updatedAt: string;
}

interface FamilyViewLetter {
  id: string;
  title: string | null;
  body: string;
  hasAudio: boolean;
  audioDurationSec: number | null;
  createdAt: string;
}

interface FamilyViewItem {
  designationId: string;
  ownerName: string;
  relationship: string;
  relationshipEtc: string | null;
  // 서버 확장 전 응답과도 호환되도록 선택값으로 둔다(00-36 §4.6-1-1, 00-41)
  scope?: string;
  acceptedAt?: string | null;
  released?: boolean;
  releasedAt?: string | null;
  entries: FamilyViewEntry[];
  letters?: FamilyViewLetter[];
}

// `GET /api/ending-note/release-requests/mine` — 분마다 가장 최근 1건
interface MyReleaseRequest {
  designationId: string;
  id: string;
  status: 'REQUESTED' | 'VERIFIED' | 'REJECTED' | 'CANCELLED';
  requestedAt: string;
  rejectReasonText: string | null;
  isMine: boolean;
  canCancel: boolean;
}

type OpenModal =
  | { kind: 'entry'; item: FamilyViewItem; entry: FamilyViewEntry }
  | { kind: 'letter'; item: FamilyViewItem; letter: FamilyViewLetter };

interface FamilySharedPageProps {
  currentUser?: string | null;
  onOpenLogin?: () => void;
}

const formatDate = (iso: string): string => formatKstDate(iso, '.');

// "2026-09-14 수락함" — 초대 화면과 같은 날짜 표기(하이픈)
const formatDashDate = (iso: string): string => formatDate(iso).replace(/\./g, '-');

// "9월 30일 14시 5분" — 접수·확인 마감 시각
const formatDateTime = (iso: string): string => formatKstMonthDayTime(iso);

const SCOPE_LABEL: Record<string, string> = { PRIMARY: '주 연락자', VIEWER: '열람자' };

// 조사 "로/으로" — 받침이 없거나 ㄹ이면 "로", 그 밖의 받침이면 "으로"
const withRo = (word: string): string => {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  if (code < 0 || code > 11171) return `${word}로`;
  const jong = code % 28;
  return jong === 0 || jong === 8 ? `${word}로` : `${word}으로`;
};

const sectionTitle = (code: string): string => SECTIONS.find((s) => s.code === code)?.title ?? code;

const relationLabel = (item: FamilyViewItem): string =>
  item.relationship === 'OTHER' && item.relationshipEtc
    ? item.relationshipEtc
    : RELATIONSHIP_LABEL[item.relationship] ?? item.relationship;

// 제목 줄 오른쪽 문구 — 관계 + scope(00-36 §4.6-1-1 확정 문구: "나를 자녀로 지정 · 주 연락자")
const designationPhrase = (item: FamilyViewItem): string => {
  const base = `나를 ${withRo(relationLabel(item))} 지정`;
  const scope = item.scope ? SCOPE_LABEL[item.scope] : undefined;
  return scope ? `${base} · ${scope}` : base;
};

// 00-41 §7.1 — 수신자용 편지 음성. 본인용(FarewellMessageCard.handleListen)과 같은 방식: presigned URL 없이 인증 fetch →
// blob → objectURL. 모달이 닫히면(언마운트) objectURL을 해제한다.
const LetterAudio: React.FC<{ letterId: string }> = ({ letterId }) => {
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => () => { if (src) URL.revokeObjectURL(src); }, [src]);

  const listen = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetchRaw(`/api/ending-note/family-view/letters/${letterId}/audio`, 'USER');
      if (!res.ok) {
        setError('음성을 불러오지 못했습니다.');
        return;
      }
      setSrc(URL.createObjectURL(await res.blob()));
    } catch {
      setError('음성을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      {src ? (
        <audio controls autoPlay src={src} style={{ width: '100%' }} />
      ) : (
        <button type="button" className="v2-btn-outline" onClick={listen} disabled={loading}>
          {loading ? '불러오는 중…' : '음성 듣기'}
        </button>
      )}
      {error && <p className="v2-error-text">{error}</p>}
    </div>
  );
};

export const FamilySharedPage: React.FC<FamilySharedPageProps> = ({ currentUser, onOpenLogin }) => {
  const [items, setItems] = useState<FamilyViewItem[] | null>(null);
  const [requests, setRequests] = useState<MyReleaseRequest[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [open, setOpen] = useState<OpenModal | null>(null);
  const [requestTarget, setRequestTarget] = useState<FamilyViewItem | null>(null);
  const [notice, setNotice] = useState<{ designationId: string; text: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  // 00-36 §4.6-2-1 — "더 이상 보지 않기"(수락 철회). 1단계 확인 모달, 사유 입력 없음.
  const [withdrawTarget, setWithdrawTarget] = useState<FamilyViewItem | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [withdrawToast, setWithdrawToast] = useState(false);

  const load = useCallback(async () => {
    try {
      // 요청 상태는 부가 정보다 — 실패해도 열람 목록은 그린다.
      const [view, mine] = await Promise.all([
        apiFetch<FamilyViewItem[]>('/api/ending-note/family-view', 'USER'),
        apiFetch<MyReleaseRequest[]>('/api/ending-note/release-requests/mine', 'USER').catch(() => [] as MyReleaseRequest[]),
      ]);
      setItems(view);
      setRequests(mine);
      setLoadError(false);
    } catch {
      setLoadError(true);
    }
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    load();
  }, [currentUser, load]);

  const cancelRequest = async (item: FamilyViewItem, req: MyReleaseRequest) => {
    if (!window.confirm('개봉 요청을 취소하시겠습니까?')) return;
    setBusyId(item.designationId);
    try {
      await apiFetch(`/api/ending-note/release-requests/${req.id}/cancel`, 'USER', { method: 'POST' });
      await load();
    } catch (e) {
      setNotice({ designationId: item.designationId, text: e instanceof ApiError ? e.message : '서버와 통신 중 오류가 발생했습니다.' });
    } finally {
      setBusyId(null);
    }
  };

  useEffect(() => {
    if (!withdrawToast) return;
    const t = window.setTimeout(() => setWithdrawToast(false), 4000);
    return () => window.clearTimeout(t);
  }, [withdrawToast]);

  // 00-27 §9.2 · 00-36 §4.6-2 — POST /api/family-designations/accepted/:id/withdraw(본인만). 끝나면 그 카드가 목록에서 사라진다.
  // 🔴 지정자에게 알림은 가지 않는다 — 토스트도 그렇게 읽히지 않게 한 줄만.
  const confirmWithdraw = async () => {
    if (!withdrawTarget || withdrawing) return;
    setWithdrawing(true);
    setWithdrawError(null);
    try {
      await apiFetch(`/api/family-designations/accepted/${withdrawTarget.designationId}/withdraw`, 'USER', { method: 'POST' });
      setWithdrawTarget(null);
      setWithdrawToast(true);
      await load();
    } catch (e) {
      setWithdrawError(e instanceof ApiError ? e.message : '서버와 통신 중 오류가 발생했습니다.');
    } finally {
      setWithdrawing(false);
    }
  };

  // §6 — 다른 지정 가족에게 "열렸음"을 알리는 것은 요청한 유족의 몫이다. 🔴 링크에 토큰을 넣지 않는다 — /family-shared 주소만
  // (권한은 로그인 계정으로 판정). 데스크톱 Chrome·Edge에도 navigator.share가 있어 카톡 없이 공유창만 뜨는 문제가 있었으므로
  // (MyPageFamilyDesignation.tsx §9.1-4-1) 터치 기기에서만 쓰고, 그 밖에는 링크 복사로 간다.
  const shareToFamily = async (item: FamilyViewItem) => {
    const url = `${window.location.origin}/family-shared`;
    const text = `${item.ownerName} 님의 기록을 이어봄에서 보실 수 있습니다.`;
    const isTouch = typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
    if (isTouch && navigator.share) {
      try {
        await navigator.share({ title: '이어봄', text, url });
        return;
      } catch (e) {
        if ((e as Error)?.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setNotice({ designationId: item.designationId, text: '안내 문구와 링크를 복사했습니다. 가족에게 붙여넣어 보내 주세요.' });
    } catch {
      setNotice({ designationId: item.designationId, text: `복사하지 못했습니다. 이 주소를 직접 전해 주세요: ${url}` });
    }
  };

  if (!currentUser) {
    // 00-34 §2.4 — 비로그인 가림판(이 화면엔 부제목이 없다)
    return <LoginGate title="나에게 공유된 것" onOpenLogin={onOpenLogin} />;
  }

  const fields = open?.kind === 'entry' ? entryFields(open.entry.section, open.entry.value) : [];

  return (
    <div className="v2-page">
      <div className="v2-content">
        <h1 className="v2-page-title">나에게 공유된 것</h1>

        {withdrawToast && <p role="status" className="v2-notice">철회되었습니다.</p>}
        {loadError && <p className="v2-error-text">불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>}
        {!loadError && items === null && <p className="v2-empty">불러오는 중…</p>}
        {!loadError && items !== null && items.length === 0 && <p className="v2-empty">아직 공유받은 것이 없습니다.</p>}

        {items?.map((item) => {
          const req = requests.find((r) => r.designationId === item.designationId);
          const released = !!item.released;
          const letters = item.letters ?? [];
          const itemNotice = notice?.designationId === item.designationId ? notice.text : '';

          return (
            <section key={item.designationId} className="v2-hub-section">
              <div className="v2-section-head">
                <h2 className="v2-section-title">{item.ownerName} 님</h2>
                <span className="v2-section-head-meta">{designationPhrase(item)}</span>
              </div>

              {item.entries.length === 0 && letters.length === 0 ? (
                <p className="v2-empty" style={{ margin: 0, borderBottom: '1px solid var(--v2-divider)' }}>
                  {released ? '고인이 정해 둔 항목이 없습니다.' : '지금 볼 수 있는 항목이 없습니다.'}
                </p>
              ) : (
                <>
                  {item.entries.map((entry) => (
                    <button type="button" key={entry.section} className="v2-nav-row" onClick={() => setOpen({ kind: 'entry', item, entry })}>
                      <span className="v2-nav-row-label">{sectionTitle(entry.section)}</span>
                      <span className="v2-nav-row-meta">{formatDate(entry.updatedAt)}</span>
                      <span className="v2-nav-row-arrow"><ChevronRight size={18} /></span>
                    </button>
                  ))}
                  {letters.map((letter) => (
                    <button type="button" key={letter.id} className="v2-nav-row" onClick={() => setOpen({ kind: 'letter', item, letter })}>
                      <span className="v2-nav-row-label">편지{letter.title ? ` · ${letter.title}` : ''}</span>
                      <span className="v2-nav-row-meta">{formatDate(letter.createdAt)}</span>
                      <span className="v2-nav-row-arrow"><ChevronRight size={18} /></span>
                    </button>
                  ))}
                </>
              )}

              {/* 00-41 §8.2 — 요청 상태. 열리기 전(released=false)에만 요청 UI를 그린다. */}
              {!released && req?.status === 'REQUESTED' && (
                <div style={{ marginTop: '16px' }}>
                  <p className="v2-notice" style={{ marginBottom: '8px' }}>
                    {req.isMine ? '요청했습니다.' : '가족 중 한 분이 요청했습니다.'} {formatDateTime(req.requestedAt)} 접수
                  </p>
                  {req.canCancel && (
                    <button type="button" className="v2-btn-outline" onClick={() => cancelRequest(item, req)} disabled={busyId === item.designationId}>
                      요청 취소
                    </button>
                  )}
                </div>
              )}
              {!released && req?.status === 'REJECTED' && (
                <div style={{ marginTop: '16px' }}>
                  <p className="v2-notice" style={{ marginBottom: '8px' }}>
                    열지 못했습니다. {req.rejectReasonText}
                  </p>
                  <button type="button" className="v2-btn-outline" onClick={() => setRequestTarget(item)}>
                    다시 요청
                  </button>
                </div>
              )}
              {!released && (!req || req.status === 'CANCELLED') && (
                <div style={{ marginTop: '16px' }}>
                  <button type="button" className="v2-btn-outline" onClick={() => setRequestTarget(item)}>
                    돌아가셨음을 알리고 열람 요청
                  </button>
                </div>
              )}

              {/* 개봉 뒤 — §6 가족에게 알리기 · §7.3 미수락 가족 */}
              {released && (
                <div style={{ marginTop: '16px' }}>
                  <button type="button" className="v2-btn-outline" onClick={() => shareToFamily(item)}>
                    가족에게 알리기
                  </button>
                  {req?.status === 'VERIFIED' && <PendingFamilyPanel verificationId={req.id} />}
                </div>
              )}

              {itemNotice && <p className="v2-notice" style={{ marginTop: '12px' }}>{itemNotice}</p>}
              {item.acceptedAt && <p className="v2-hub-foot">{formatDashDate(item.acceptedAt)} 수락함</p>}
              {/* 00-36 §4.6-2-1 — 카드 맨 아래 한 줄. 🔴 "철회·거부" 단어를 쓰지 않는다(실제로 끊기는 것은 내 열람 권한).
                  되돌릴 수 없는 행동이라 빨간 글자, 버튼 상자는 만들지 않는다(00-39 규칙 5). */}
              <div className="v2-account-foot" style={{ marginTop: 0 }}>
                <button type="button" className="v2-account-foot-btn is-danger" onClick={() => { setWithdrawError(null); setWithdrawTarget(item); }}>
                  더 이상 보지 않기
                </button>
              </div>
            </section>
          );
        })}
      </div>

      {withdrawTarget && (
        <div className="v2-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="family-withdraw-title" {...backdropCloseProps(withdrawing ? () => {} : () => setWithdrawTarget(null))}>
          <div className="v2-modal" onClick={(e) => e.stopPropagation()}>
            <h3 id="family-withdraw-title" className="v2-modal-title">더 이상 보지 않기</h3>
            {/* 사유를 묻는 입력칸을 두지 않는다(§4.6-2 3) */}
            <p className="v2-modal-value" style={{ margin: '0 0 12px' }}>
              {withdrawTarget.ownerName}님이 공유하신 내용을 더 이상 보지 않습니다. 다시 보시려면 {withdrawTarget.ownerName}님께 다시 요청하셔야 합니다.
            </p>
            {withdrawError && <p role="alert" className="v2-error-text" style={{ margin: '0 0 8px' }}>{withdrawError}</p>}
            <div className="v2-modal-actions">
              <button type="button" className="v2-btn-outline" onClick={() => setWithdrawTarget(null)} disabled={withdrawing}>취소</button>
              {/* 규칙 19 — 누르는 순간 버튼을 잠그고 글자를 바꾼다 */}
              <button type="button" className="v2-btn-solid" onClick={confirmWithdraw} disabled={withdrawing} aria-busy={withdrawing}>
                {withdrawing ? '처리 중…' : '더 이상 보지 않기'}
              </button>
            </div>
          </div>
        </div>
      )}

      {requestTarget && (
        <ReleaseRequestModal
          designationId={requestTarget.designationId}
          ownerName={requestTarget.ownerName}
          onClose={() => setRequestTarget(null)}
          onDone={() => {
            setRequestTarget(null);
            load();
          }}
        />
      )}

      {open && (
        <div className="v2-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="family-shared-title" {...backdropCloseProps(() => setOpen(null))}>
          <div className="v2-modal" onClick={(e) => e.stopPropagation()}>
            {open.kind === 'entry' ? (
              <>
                <h3 id="family-shared-title" className="v2-modal-title">{sectionTitle(open.entry.section)}</h3>
                {fields.length === 0 ? (
                  <p className="v2-empty" style={{ padding: 0 }}>작성된 내용이 없습니다.</p>
                ) : (
                  fields.map((f) => (
                    <div key={f.label} className="v2-modal-row">
                      <span className="v2-modal-label">{f.label}</span>
                      <span className="v2-modal-value" style={{ whiteSpace: 'pre-wrap' }}>{f.text}</span>
                    </div>
                  ))
                )}
                <div className="v2-modal-row">
                  <span className="v2-modal-label">최종 수정</span>
                  <span className="v2-modal-value">{formatDate(open.entry.updatedAt)}</span>
                </div>
              </>
            ) : (
              <>
                <h3 id="family-shared-title" className="v2-modal-title">{open.letter.title || '편지'}</h3>
                <p className="v2-modal-value" style={{ whiteSpace: 'pre-wrap', margin: '0 0 16px' }}>{open.letter.body}</p>
                {open.letter.hasAudio && <LetterAudio letterId={open.letter.id} />}
                <div className="v2-modal-row">
                  <span className="v2-modal-label">작성일</span>
                  <span className="v2-modal-value">{formatDate(open.letter.createdAt)}</span>
                </div>
              </>
            )}
            <div className="v2-modal-actions">
              <button type="button" className="v2-btn-outline" onClick={() => setOpen(null)}>닫기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
