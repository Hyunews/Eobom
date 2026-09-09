import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flower2, FileEdit, ExternalLink, Share2, ArrowRight, Trash2 } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { OBITUARY_CARD_IMAGE_URL } from '../config';
import { formatKST, formatObituaryCardTitle, formatObituaryCardDescription } from '../utils/obituaryCard';
import { ensureKakaoShareReady, shareViaKakao, shareViaWebShareApi, copyObituaryLink, reportObituaryShare } from '../utils/kakaoShare';

// 00-06 §8(SCR-018, "내 부고장·추모관") — Header "추모관" 메뉴가 홈 박스③(링크 입력창)으로만
// 보내서, 부고장을 만든 당사자가 정작 본인이 만든 부고장·추모관에 다시 들어갈 방법이 없다는
// 사용자 리포트 대응으로 신설됐다. 이 화면은 항상 로그인 사용자만 본다.
// 🔄 09-07 사용자 지시 — 헤더의 직행 메뉴를 없애고 마이페이지에서만 들어오게 했다(Header.tsx·
// MyPage.tsx 참고). 같은 지시로 이 화면도 부고장 목록만 있던 것에서 부고장·추모관을 좌우
// 반반으로 나눠 보여주도록 바뀌었고, 주소도 `/my-obituaries` → `/my-obituaries-memorials`로,
// 제목도 "내 부고장"에서 "내 부고장·추모관"으로 정정했다(App.tsx 라우트 참고).
// 추모관 생성·삭제·주소복사 같은 관리 액션은 여전히 `/memorial` 화면 몫이다 — 여기서는 두
// 목록을 나란히 읽기 전용으로 보여주고, 실제 만들기·닫기는 그 화면으로 안내만 한다.

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

export const MyObituaryListPage: React.FC = () => {
  const navigate = useNavigate();
  const [obituaries, setObituaries] = useState<MyObituary[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  // 카드별로 다른 부고장을 다루므로, 문구도 어느 카드 것인지(id) 함께 들고 그 카드
  // 아래에만 렌더한다 — 예전엔 전역 문자열 하나라 목록 맨 아래(마지막 카드 밖)에 떴다(사람 리포트).
  const [feedback, setFeedback] = useState<{ id: string; message: string } | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);

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
    height: '32px', padding: '0 0.6rem', fontSize: 'var(--fs-caption)', backgroundColor: 'var(--card-bg)',
    border: '1px solid var(--border-color)', borderRadius: 'var(--r-sm)', cursor: 'pointer', display: 'inline-flex',
    alignItems: 'center', gap: '0.3rem',
  };

  const moreLinkStyle: React.CSSProperties = {
    marginTop: '1rem', background: 'none', border: 'none', padding: 0, color: 'var(--point-color)',
    fontWeight: 700, fontSize: 'var(--fs-body)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
  };

  return (
    <div className="container" style={{ paddingBottom: '3rem', maxWidth: '860px' }}>
      <h2 style={{ marginBottom: '0.3rem' }}>내 부고장·추모관</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: 'var(--fs-body)' }}>
        내가 만든 부고장과 추모관을 한곳에서 확인할 수 있습니다.
      </p>

      {/* 부고장·추모관을 좌우 반반으로 — 00-29 §6.1 .auto-grid(min 280px, 375px 가로스크롤 방지) */}
      <div className="auto-grid" style={{ alignItems: 'start' }}>
        {/* ① 내가 만든 부고장 목록 */}
        <div style={cardStyle}>
          <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileEdit size={18} color="var(--primary-color)" /> 내가 만든 부고장
          </h4>

          {obituaries === null && !loadError && (
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-body)' }}>불러오는 중...</p>
          )}
          {loadError && (
            <p style={{ color: 'var(--state-warn-fg)', fontSize: 'var(--fs-body)' }}>목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.</p>
          )}
          {obituaries !== null && obituaries.length === 0 && (
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-body)' }}>아직 만든 부고장이 없습니다.</p>
          )}

          {obituaries !== null && obituaries.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              {obituaries.map((o) => (
                <div
                  key={o.id}
                  style={{
                    padding: '0.9rem 1rem', backgroundColor: 'var(--secondary-color)', borderRadius: 'var(--r-sm)',
                    display: 'flex', flexDirection: 'column', gap: '0.6rem',
                  }}
                >
                  {/* 🔄 09-07 사용자 리포트 — 이 카드가 좌우 반반 레이아웃(auto-grid)으로
                      들어가 폭이 줄면서, "진행중"(수정+삭제 2버튼)일 때만 이름·버튼이
                      한 줄에 다 안 들어가 깨졌다. flexWrap+minWidth:0으로 좁을 때 버튼 줄이
                      아래로 떨어지게 한다("종료됨"=삭제 1버튼은 원래도 안 깨졌던 경우). */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.6rem 1rem', flexWrap: 'wrap' }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                        故 {o.deceasedName}
                        {o.isClosed && (
                          <span style={{ marginLeft: '0.5rem', fontSize: 'var(--fs-caption)', fontWeight: 400, color: 'var(--text-muted)' }}>· 종료됨</span>
                        )}
                        {!o.isClosed && (
                          <span style={{ marginLeft: '0.5rem', fontSize: 'var(--fs-caption)', fontWeight: 400, color: 'var(--point-color)' }}>· 진행중</span>
                        )}
                      </p>
                      <p style={{ fontSize: 'var(--fs-body)', color: 'var(--text-muted)' }}>
                        {o.deceasedDeathDate ? `사망일 ${formatKST(o.deceasedDeathDate)}` : `개설일 ${formatKST(o.createdAt)}`}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                      {!o.isClosed && (
                        <button
                          type="button"
                          onClick={() => navigate(`/obituary?slug=${o.slug}`)}
                          className="btn"
                          style={{ height: '36px', padding: '0 var(--sp-4)', fontSize: 'var(--fs-body)', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
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
                          height: '36px', padding: '0 var(--sp-4)', fontSize: 'var(--fs-body)', backgroundColor: 'var(--card-bg)',
                          border: '1px solid var(--state-danger-bg)', color: 'var(--state-danger-fg)', opacity: deletingId === o.id ? 0.6 : 1,
                          display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                        }}
                      >
                        <Trash2 size={14} /> 삭제
                      </button>
                    </div>
                  </div>

                  <div style={linkGroupStyle}>
                    <span style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-muted)', width: '3.4rem' }}>부고장</span>
                    <button type="button" onClick={() => navigate(`/o/${o.slug}`)} style={iconBtnStyle}>
                      <ExternalLink size={13} /> 열기
                    </button>
                    <button type="button" onClick={() => shareObituary(o)} style={iconBtnStyle}>
                      <Share2 size={13} /> 공유
                    </button>
                  </div>

                  {feedback?.id === o.id && (
                    <p style={{ fontSize: 'var(--fs-body)', color: 'var(--text-muted)' }}>{feedback.message}</p>
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
            style={moreLinkStyle}
          >
            새 부고장 만들기 <ArrowRight size={14} />
          </button>
        </div>

        {/* ② 내가 만든 추모관 목록 — 읽기 전용. 만들기·닫기·주소복사는 /memorial 몫(09-07 사용자
            지시 — "부고장과 추모관은 구분해서 관리되어야 한다") */}
        <div style={cardStyle}>
          <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Flower2 size={18} color="var(--primary-color)" /> 내가 만든 추모관
          </h4>

          {memorials === null && !memorialLoadError && (
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-body)' }}>불러오는 중...</p>
          )}
          {memorialLoadError && (
            <p style={{ color: 'var(--state-warn-fg)', fontSize: 'var(--fs-body)' }}>목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.</p>
          )}
          {memorials !== null && memorials.length === 0 && (
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-body)' }}>아직 만든 추모관이 없습니다.</p>
          )}

          {memorials !== null && memorials.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              {memorials.map((m) => (
                <div
                  key={m.id}
                  style={{
                    padding: '0.9rem 1rem', backgroundColor: 'var(--secondary-color)', borderRadius: 'var(--r-sm)',
                    display: 'flex', flexDirection: 'column', gap: '0.6rem',
                  }}
                >
                  <div>
                    <p style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                      故 {m.deceasedName}
                      {m.closedAt ? (
                        <span style={{ marginLeft: '0.5rem', fontSize: 'var(--fs-caption)', fontWeight: 400, color: 'var(--text-muted)' }}>· 종료됨</span>
                      ) : (
                        <span style={{ marginLeft: '0.5rem', fontSize: 'var(--fs-caption)', fontWeight: 400, color: 'var(--point-color)' }}>· 운영중</span>
                      )}
                    </p>
                    <p style={{ fontSize: 'var(--fs-body)', color: 'var(--text-muted)' }}>개설일 {formatKST(m.createdAt)}</p>
                  </div>
                  <div style={linkGroupStyle}>
                    <span style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-muted)', width: '3.4rem' }}>추모관</span>
                    <button type="button" onClick={() => navigate(`/m/${m.slug}`)} style={iconBtnStyle}>
                      <ExternalLink size={13} /> 열기
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button type="button" onClick={() => navigate('/memorial')} style={moreLinkStyle}>
            추모관 만들기·관리 <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
