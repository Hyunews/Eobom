import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, ChevronRight } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { OBITUARY_CARD_IMAGE_URL } from '../config';
import { formatKST, formatObituaryCardTitle, formatObituaryCardDescription } from '../utils/obituaryCard';
import { ensureKakaoShareReady, shareViaKakao, shareViaWebShareApi, copyObituaryLink, reportObituaryShare } from '../utils/kakaoShare';
import '../styles/design-v2.css';
import { backdropCloseProps } from '../utils/backdropClose';

// 00-06 §8(SCR-018, "내 부고장·추모관") — Header "추모관" 메뉴가 홈 박스③(링크 입력창)으로만
// 보내서, 부고장을 만든 당사자가 정작 본인이 만든 부고장·추모관에 다시 들어갈 방법이 없다는
// 사용자 리포트 대응으로 신설됐다. 이 화면은 항상 로그인 사용자만 본다.
// 🔄 09-07 사용자 지시 — 헤더의 직행 메뉴를 없애고 마이페이지에서만 들어오게 했다(Header.tsx·
// MyPage.tsx 참고). 같은 지시로 이 화면도 부고장 목록만 있던 것에서 부고장·추모관을 좌우
// 반반으로 나눠 보여주도록 바뀌었고, 주소도 `/my-obituaries` → `/my-obituaries-memorials`로,
// 제목도 "내 부고장"에서 "내 부고장·추모관"으로 정정했다(App.tsx 라우트 참고).
// 추모관 생성·삭제·주소복사 같은 관리 액션은 여전히 `/memorial` 화면 몫이다 — 여기서는 두
// 목록을 나란히 읽기 전용으로 보여주고, 실제 만들기·닫기는 그 화면으로 안내만 한다.
// 00-39 §9.1 — 그룹①(목록·체크리스트) 대표 care-guide에서 뽑은 클래스를 시안 없이 그대로 적용.
// 행 액션(열기·공유·수정·삭제)은 §6-8·9(체크/안내 분리)와 같은 원리로 행 클릭 → 모달로 옮겼다.

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

interface MyMemorial {
  id: string;
  slug: string;
  deceasedName: string;
  closedAt: string | null;
  createdAt: string;
}

type ModalTarget = { type: 'obituary'; id: string } | { type: 'memorial'; id: string } | null;

export const MyObituaryListPage: React.FC = () => {
  const navigate = useNavigate();
  const [obituaries, setObituaries] = useState<MyObituary[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  // 모달별로 다른 부고장을 다루므로, 문구도 어느 항목 것인지(id) 함께 들고 그 모달 안에만 렌더한다.
  const [feedback, setFeedback] = useState<{ id: string; message: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [modalTarget, setModalTarget] = useState<ModalTarget>(null);

  // 우측 "내 추모관" 목록 — `GET /api/me/memorials`(memorialController.listMyMemorials,
  // 기존 코드 그대로. MemorialPage.tsx가 쓰는 것과 같은 엔드포인트). 만들기·닫기는 여기서
  // 하지 않으므로 필드도 표시에 필요한 것만 뽑아 쓴다.
  const [memorials, setMemorials] = useState<MyMemorial[] | null>(null);
  const [memorialLoadError, setMemorialLoadError] = useState(false);

  useEffect(() => {
    apiFetch<MyObituary[]>('/api/me/obituaries', 'USER')
      .then(setObituaries)
      .catch(() => setLoadError(true));
    apiFetch<MyMemorial[]>('/api/me/memorials', 'USER')
      .then(setMemorials)
      .catch(() => setMemorialLoadError(true));
  }, []);

  // Kakao.Share.sendDefault는 클릭 핸들러 안에서 동기 호출돼야 팝업 차단을 피한다(§7) —
  // 그래서 로드는 마운트 시점에 미리 끝내둔다(ObituaryPage.tsx와 같은 패턴).
  useEffect(() => {
    ensureKakaoShareReady();
  }, []);

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
      setModalTarget(null);
    } catch {
      setFeedback({ id: o.id, message: '부고장 삭제에 실패했습니다. 잠시 후 다시 시도해주세요.' });
    } finally {
      setDeletingId(null);
    }
  };

  const modalObituary = modalTarget?.type === 'obituary' ? obituaries?.find((o) => o.id === modalTarget.id) ?? null : null;
  const modalMemorial = modalTarget?.type === 'memorial' ? memorials?.find((m) => m.id === modalTarget.id) ?? null : null;

  return (
    <div className="v2-page">
      <div className="v2-page-head">
        <h1 className="v2-page-title">내 부고장·추모관</h1>
        <p className="v2-page-subtitle">내가 만든 부고장과 추모관을 한곳에서 확인할 수 있습니다.</p>
      </div>

      <div className="v2-content">
        <div className="v2-two-col">
          {/* ① 내가 만든 부고장 목록 */}
          <div>
            <div className="v2-section-head">
              <h2 className="v2-section-title">내가 만든 부고장</h2>
              {obituaries !== null && <span className="v2-section-count">({obituaries.length})</span>}
            </div>

            {obituaries === null && !loadError && <p className="v2-empty">불러오는 중...</p>}
            {loadError && <p className="v2-error-text">목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.</p>}
            {obituaries !== null && obituaries.length === 0 && <p className="v2-empty">아직 만든 부고장이 없습니다.</p>}

            {obituaries?.map((o) => (
              <div key={o.id} className="v2-list-row">
                <button type="button" className="v2-list-main" onClick={() => setModalTarget({ type: 'obituary', id: o.id })}>
                  <span className="v2-list-title">
                    故 {o.deceasedName}
                    <span className={o.isClosed ? 'v2-status-closed' : 'v2-status-active'}> · {o.isClosed ? '종료됨' : '진행중'}</span>
                  </span>
                </button>
                <span className="v2-list-meta">
                  {o.deceasedDeathDate ? formatKST(o.deceasedDeathDate) : formatKST(o.createdAt)}
                </span>
                <ChevronRight size={16} className="v2-row-chevron" />
              </div>
            ))}

            <button type="button" className="v2-btn-outline v2-list-footer-btn" onClick={() => navigate('/obituary?new=1')}>
              새 부고장 만들기
            </button>
          </div>

          {/* ② 내가 만든 추모관 목록 — 읽기 전용. 만들기·닫기·주소복사는 /memorial 몫(09-07 사용자
              지시 — "부고장과 추모관은 구분해서 관리되어야 한다") */}
          <div>
            <div className="v2-section-head">
              <h2 className="v2-section-title">내가 만든 추모관</h2>
              {memorials !== null && <span className="v2-section-count">({memorials.length})</span>}
            </div>

            {memorials === null && !memorialLoadError && <p className="v2-empty">불러오는 중...</p>}
            {memorialLoadError && <p className="v2-error-text">목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.</p>}
            {memorials !== null && memorials.length === 0 && <p className="v2-empty">아직 만든 추모관이 없습니다.</p>}

            {memorials?.map((m) => (
              <div key={m.id} className="v2-list-row">
                <button type="button" className="v2-list-main" onClick={() => setModalTarget({ type: 'memorial', id: m.id })}>
                  <span className="v2-list-title">
                    故 {m.deceasedName}
                    <span className={m.closedAt ? 'v2-status-closed' : 'v2-status-active'}> · {m.closedAt ? '종료됨' : '운영중'}</span>
                  </span>
                </button>
                <span className="v2-list-meta">{formatKST(m.createdAt)}</span>
                <ChevronRight size={16} className="v2-row-chevron" />
              </div>
            ))}

            <button type="button" className="v2-btn-outline v2-list-footer-btn" onClick={() => navigate('/memorial')}>
              추모관 만들기·관리
            </button>
          </div>
        </div>
      </div>

      {modalObituary && (
        <div className="v2-modal-overlay" role="dialog" aria-modal="true" {...backdropCloseProps(() => setModalTarget(null))}>
          <div className="v2-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="v2-modal-title">故 {modalObituary.deceasedName}</h3>

            <div className="v2-modal-row">
              <span className="v2-modal-label">상태</span>
              <span className="v2-modal-value">{modalObituary.isClosed ? '종료됨' : '진행중'}</span>
            </div>

            <div className="v2-modal-row">
              <span className="v2-modal-label">일자</span>
              <span className="v2-modal-value">
                {modalObituary.deceasedDeathDate
                  ? `사망일 ${formatKST(modalObituary.deceasedDeathDate)}`
                  : `개설일 ${formatKST(modalObituary.createdAt)}`}
              </span>
            </div>

            <div className="v2-modal-actions">
              <button type="button" className="v2-btn-outline" onClick={() => navigate(`/o/${modalObituary.slug}`)}>
                <ExternalLink size={14} /> 열기
              </button>
              <button type="button" className="v2-btn-outline" onClick={() => shareObituary(modalObituary)}>
                공유
              </button>
              {!modalObituary.isClosed && (
                <button type="button" className="v2-btn-outline" onClick={() => navigate(`/obituary?slug=${modalObituary.slug}`)}>
                  수정
                </button>
              )}
              <button
                type="button"
                className="v2-btn-outline"
                onClick={() => deleteObituary(modalObituary)}
                disabled={deletingId === modalObituary.id}
              >
                삭제
              </button>
            </div>

            {feedback?.id === modalObituary.id && <p className="v2-notice">{feedback.message}</p>}

            <button type="button" className="v2-modal-close" onClick={() => setModalTarget(null)}>
              닫기
            </button>
          </div>
        </div>
      )}

      {modalMemorial && (
        <div className="v2-modal-overlay" role="dialog" aria-modal="true" {...backdropCloseProps(() => setModalTarget(null))}>
          <div className="v2-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="v2-modal-title">故 {modalMemorial.deceasedName}</h3>

            <div className="v2-modal-row">
              <span className="v2-modal-label">상태</span>
              <span className="v2-modal-value">{modalMemorial.closedAt ? '종료됨' : '운영중'}</span>
            </div>

            <div className="v2-modal-row">
              <span className="v2-modal-label">일자</span>
              <span className="v2-modal-value">개설일 {formatKST(modalMemorial.createdAt)}</span>
            </div>

            <div className="v2-modal-actions">
              <button type="button" className="v2-btn-outline" onClick={() => navigate(`/m/${modalMemorial.slug}`)}>
                <ExternalLink size={14} /> 열기
              </button>
            </div>

            <button type="button" className="v2-modal-close" onClick={() => setModalTarget(null)}>
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
