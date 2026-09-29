import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiFetch, apiFetchRaw, ApiError } from '../lib/api';
import { getToken, PENDING_INVITE_TOKEN_KEY } from '../lib/storage';
import { backdropCloseProps } from '../utils/backdropClose';
import { PageLink } from '../components/common/PageLink';

interface FamilyInvitePageProps {
  // App.tsx의 React state를 그대로 받는다 — 예전엔 sessionStorage를 직접 읽었는데, 데모
  // 로그인은 페이지 리다이렉트 없이 같은 화면에서 즉시 완료돼서 그 방식으론 재렌더가 안
  // 트리거됐다(실제 소셜 로그인은 전체 리다이렉트로 컴포넌트가 새로 마운트돼 우연히 동작했음).
  currentUser: string | null;
  onOpenLogin: () => void;
}

// 00-27 §9.1 — 가족 지정 초대 수락/거절 화면. App.tsx 레이아웃(Header/Sidebar/Footer) 밖의
// 독립 페이지다(isObituaryLandingRoute·isMemorialLandingRoute와 같은 처리) — 받는 사람은
// 아직 회원이 아닐 수 있어 사이드바·모드가 무의미하다.
// 🔴 §9.1-3 불변식 — 이 화면에 지정자의 연락처를 절대 넣지 않는다. 성함·관계·scope 3개뿐.
// 🔴 §9.1-2 — 수락 판정은 서버가 초대 토큰 + JWT로만 한다. sessionStorage는 로그인 후 이
// 화면으로 되돌아오기 위한 "복귀 경로" 기억용일 뿐, 권한 근거가 아니다(07-03 §5.3-2와 동일 원칙).
// 🔄 00-39 §6.7(2026-09-28 Opus, 시안 없음 §9.1) — 부고장 틀(.v2-obit-page > .v2-obit-content >
// .v2-obit-box)을 모든 상태(불러오는 중·만료·없음·오류·수락됨·거절됨·기본)에 공용으로 쓴다.

const RELATIONSHIP_LABEL: Record<string, string> = {
  SPOUSE: '배우자',
  CHILD: '자녀',
  PARENT: '부모',
  SIBLING: '형제자매',
  OTHER: '기타',
};

const SCOPE_LABEL: Record<string, { label: string; hint: string }> = {
  PRIMARY: { label: '대표 지정인', hint: '엔딩노트 전달 · 정산 실행 요청' },
  VIEWER: { label: '연락 대상', hint: '사망 통지 수신 · 추모관 접근' },
};

interface InviteData {
  designatorName: string;
  relationship: string;
  relationshipEtc: string | null;
  scope: string;
}

type ViewState = 'loading' | 'ready' | 'expired' | 'notfound' | 'accepted' | 'declined' | 'error';

export const FamilyInvitePage: React.FC<FamilyInvitePageProps> = ({ currentUser, onOpenLogin }) => {
  const { token } = useParams<{ token: string }>();
  const [view, setView] = useState<ViewState>('loading');
  const [data, setData] = useState<InviteData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // 00-27 §9.1-4-3 — 지정 당시 입력받은 이름과 대조하기 위해 수락 시점에 다시 받는다.
  // 저장하지 않고 accept 요청 본문으로만 보낸다 — 지정된 이름은 이 화면에 노출되지 않는다(§9.1-3 ②).
  const [enteredName, setEnteredName] = useState('');
  // 🔄 00-39 §6.7 — window.confirm 대신 §6.4 모달(MemorialPage.tsx 삭제 확인과 같은 방식).
  const [showDeclineConfirm, setShowDeclineConfirm] = useState(false);

  // authToken은 currentUser와 항상 같은 타이밍에 저장소에 같이 쓰인다(App.tsx
  // handleLoginSuccess) — currentUser prop이 바뀌어 리렌더될 때마다 이 줄도 다시 실행되므로
  // useState로 따로 안 감싸도 항상 최신 값을 읽는다.
  const authToken = getToken('USER');

  useEffect(() => {
    if (!token) return;
    apiFetchRaw(`/api/family-designations/invite/${token}`)
      .then(async (res) => {
        const json = await res.json();
        if (res.status === 410) {
          setView('expired');
          return;
        }
        if (!res.ok || json.status !== 'success') {
          setView('notfound');
          return;
        }
        setData(json.data);
        setView('ready');
      })
      .catch(() => setView('error'));
  }, [token]);

  // 2026-08-24 — 이 화면이 자체 소셜 버튼 3개로 직접 /api/auth/:provider를 호출하던 방식은
  // 필수 동의(이용약관·개인정보) 쿼리가 없어 새 라우트가드에 전부 튕긴다(authRoutes.ts).
  // 공용 LoginModal(App.tsx에 이미 라우트 무관하게 항상 렌더돼 있음)을 대신 띄운다 — 동의
  // 체크박스·데모 로그인까지 그 모달이 전부 처리한다.
  const handleOpenLogin = () => {
    if (!token) return;
    // §9.1-2 — 로그인 왕복에서 사라지는 토큰 컨텍스트를 로그인 시작 "전에" 보관해둔다.
    sessionStorage.setItem(PENDING_INVITE_TOKEN_KEY, token);
    onOpenLogin();
  };

  const handleAccept = async () => {
    if (!token || !authToken) return;
    if (!enteredName.trim()) {
      setErrorMsg('성함을 입력해 주세요.');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await apiFetch(`/api/family-designations/invite/${token}/accept`, 'USER', {
        method: 'POST',
        body: JSON.stringify({ name: enteredName.trim() }),
      });
      setView('accepted');
    } catch (err) {
      setErrorMsg(err instanceof ApiError ? err.message : '서버와 통신 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeDeclineConfirm = () => {
    if (isSubmitting) return;
    setShowDeclineConfirm(false);
  };

  const confirmDecline = async () => {
    if (!token) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await apiFetch(`/api/family-designations/invite/${token}/decline`, undefined, { method: 'POST' });
      setShowDeclineConfirm(false);
      setView('declined');
    } catch (err) {
      setErrorMsg(err instanceof ApiError ? err.message : '서버와 통신 중 오류가 발생했습니다.');
      setShowDeclineConfirm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  let body: React.ReactNode;

  if (view === 'loading') {
    body = (
      <div className="v2-obit-notfound">
        <p className="v2-obit-notfound-sub">불러오는 중...</p>
      </div>
    );
  } else if (view === 'expired') {
    body = (
      <div className="v2-obit-notfound">
        <p className="v2-obit-notfound-title">초대 링크가 만료되었습니다.</p>
        <p className="v2-obit-notfound-sub">보내신 분에게 새 링크를 다시 요청해 주세요.</p>
      </div>
    );
  } else if (view === 'notfound' || view === 'error') {
    body = (
      <div className="v2-obit-notfound">
        <p className="v2-obit-notfound-title">초대 링크를 찾을 수 없습니다.</p>
        <p className="v2-obit-notfound-sub">이미 처리되었거나 잘못된 주소일 수 있습니다.</p>
        <PageLink to="/" className="v2-btn-primary v2-obit-invite-cta">
          이어봄 홈으로
        </PageLink>
      </div>
    );
  } else if (view === 'accepted') {
    body = (
      <div className="v2-obit-notfound">
        <p className="v2-obit-notfound-title">수락되었습니다.</p>
        {/* 00-27 §9.1-4-2 — 수락 결과를 과장하지 않는다. 열람은 사망 확인 이후다(06-04 §8.1). */}
        <p className="v2-obit-notfound-sub">{data?.designatorName}님의 가족으로 연결됐습니다.</p>
        <div className="v2-obit-invite-actions is-center v2-obit-invite-body">
          <PageLink to="/" className="v2-btn-primary">
            이어봄 홈으로
          </PageLink>
          <PageLink
            to="/ending-note"
            className="v2-btn-outline"
            loginRequired
            currentUser={currentUser}
            onOpenLogin={onOpenLogin}
          >
            내 엔딩노트 만들기
          </PageLink>
        </div>
      </div>
    );
  } else if (view === 'declined') {
    body = (
      <div className="v2-obit-notfound">
        <p className="v2-obit-notfound-title">거절되었습니다.</p>
        <p className="v2-obit-notfound-sub">아무 권한도 부여되지 않았습니다.</p>
        {/* §9.1-4-2 — 거절한 사람에게 서비스 권유를 붙이지 않는다. "홈으로" 하나뿐. */}
        <PageLink to="/" className="v2-btn-outline v2-obit-invite-cta">
          이어봄 홈으로
        </PageLink>
      </div>
    );
  } else {
    // view === 'ready'
    const scope = data ? SCOPE_LABEL[data.scope] : undefined;
    const relationshipText = data
      ? `${RELATIONSHIP_LABEL[data.relationship] || data.relationship}${data.relationship === 'OTHER' && data.relationshipEtc ? `(${data.relationshipEtc})` : ''}`
      : '';

    body = (
      <>
        <h1 className="v2-obit-name">{data?.designatorName}님이 당신을 가족으로 지정했습니다</h1>
        <p className="v2-obit-invite-desc">관계: {relationshipText}</p>
        <p className="v2-obit-invite-desc">
          권한: {scope?.label}{scope ? ` (${scope.hint})` : ''}
        </p>

        <div className="v2-obit-invite-body">
          <p className="v2-notice-warn">수락하시면 사망 통지 등 위 권한이 생깁니다. 거절하셔도 어떤 불이익도 없습니다.</p>

          {errorMsg && <p className="v2-error-text">{errorMsg}</p>}

          {currentUser && authToken ? (
            <>
              {/* 00-27 §9.1-4-3 — 오조작 방지 가드레일. 지정된 이름 자체는 이 화면에 노출하지
                  않는다(§9.1-3 ②) — 입력값이 맞는지는 수락을 눌러야 서버가 알려준다. */}
              <div className="v2-field v2-obit-invite-field">
                <label htmlFor="invite-name">성함</label>
                <input
                  id="invite-name"
                  className="v2-input"
                  value={enteredName}
                  onChange={(e) => setEnteredName(e.target.value)}
                  placeholder="본인 성함을 입력해 주세요"
                />
              </div>
              <div className="v2-obit-invite-actions">
                <button type="button" onClick={() => setShowDeclineConfirm(true)} disabled={isSubmitting} className="v2-btn-outline">
                  거절
                </button>
                <button type="button" onClick={handleAccept} disabled={isSubmitting} aria-busy={isSubmitting} className="v2-btn-primary">
                  {isSubmitting ? '처리 중...' : '수락'}
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="v2-notice">수락하려면 먼저 로그인해 주세요.</p>
              <button type="button" onClick={handleOpenLogin} className="v2-btn-primary v2-obit-invite-cta">
                로그인하고 계속하기
              </button>
              <button type="button" onClick={() => setShowDeclineConfirm(true)} disabled={isSubmitting} className="v2-obit-invite-textlink">
                로그인 없이 거절만 하기
              </button>
            </>
          )}
        </div>
      </>
    );
  }

  return (
    <div className="v2-obit-page">
      <div className="v2-obit-content">
        <div className="v2-obit-box">{body}</div>
      </div>

      {showDeclineConfirm && (
        <div className="v2-modal-overlay" role="dialog" aria-modal="true" {...backdropCloseProps(closeDeclineConfirm)}>
          <div className="v2-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="v2-modal-title">이 지정을 거절하시겠어요?</h3>
            <div className="v2-modal-actions">
              <button type="button" className="v2-btn-outline" onClick={closeDeclineConfirm} disabled={isSubmitting}>
                취소
              </button>
              <button type="button" className="v2-btn-solid" onClick={confirmDecline} disabled={isSubmitting} aria-busy={isSubmitting}>
                {isSubmitting ? '처리 중…' : '거절'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
