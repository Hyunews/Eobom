import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { HeartHandshake, CheckCircle2, XCircle } from 'lucide-react';
import { BACKEND_URL } from '../config';

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

const shellStyle: React.CSSProperties = {
  minHeight: '100vh',
  backgroundColor: '#FBF9F5',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '2.5rem 1rem',
};

const cardStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '420px',
  backgroundColor: '#FFFFFF',
  borderRadius: '20px',
  boxShadow: '0 12px 35px rgba(26,43,76,0.08)',
  padding: '2rem 1.75rem',
  textAlign: 'center',
};

export const FamilyInvitePage: React.FC<FamilyInvitePageProps> = ({ currentUser, onOpenLogin }) => {
  const { token } = useParams<{ token: string }>();
  const [view, setView] = useState<ViewState>('loading');
  const [data, setData] = useState<InviteData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // authToken은 currentUser와 항상 같은 타이밍에 sessionStorage에 같이 쓰인다(App.tsx
  // handleLoginSuccess) — currentUser prop이 바뀌어 리렌더될 때마다 이 줄도 다시 실행되므로
  // useState로 따로 안 감싸도 항상 최신 값을 읽는다.
  const authToken = sessionStorage.getItem('k_ending_token');

  useEffect(() => {
    if (!token) return;
    fetch(`${BACKEND_URL}/api/family-designations/invite/${token}`)
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
    sessionStorage.setItem('eobom_pending_invite_token', token);
    onOpenLogin();
  };

  const handleAccept = async () => {
    if (!token || !authToken) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/family-designations/invite/${token}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
      });
      const json = await res.json();
      if (!res.ok || json.status !== 'success') {
        setErrorMsg(json.message || '수락 처리에 실패했습니다.');
        return;
      }
      setView('accepted');
    } catch {
      setErrorMsg('서버와 통신 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDecline = async () => {
    if (!token) return;
    if (!window.confirm('이 지정을 거절하시겠어요?')) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/family-designations/invite/${token}/decline`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok || json.status !== 'success') {
        setErrorMsg(json.message || '거절 처리에 실패했습니다.');
        return;
      }
      setView('declined');
    } catch {
      setErrorMsg('서버와 통신 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (view === 'loading') {
    return (
      <div style={shellStyle}>
        <p style={{ color: '#6C7A89' }}>불러오는 중...</p>
      </div>
    );
  }

  if (view === 'expired') {
    return (
      <div style={shellStyle}>
        <div style={cardStyle}>
          <p style={{ fontSize: '1.05rem', color: '#1A2B4C', fontWeight: 700, marginBottom: '0.5rem' }}>초대 링크가 만료되었습니다.</p>
          <p style={{ fontSize: '0.9rem', color: '#6C7A89' }}>보내신 분에게 새 링크를 다시 요청해 주세요.</p>
        </div>
      </div>
    );
  }

  if (view === 'notfound' || view === 'error') {
    return (
      <div style={shellStyle}>
        <div style={cardStyle}>
          <p style={{ fontSize: '1.05rem', color: '#1A2B4C', fontWeight: 700, marginBottom: '0.5rem' }}>초대 링크를 찾을 수 없습니다.</p>
          <p style={{ fontSize: '0.9rem', color: '#6C7A89' }}>이미 처리되었거나 잘못된 주소일 수 있습니다.</p>
        </div>
      </div>
    );
  }

  if (view === 'accepted') {
    return (
      <div style={shellStyle}>
        <div style={cardStyle}>
          <CheckCircle2 size={40} color="var(--point-color)" style={{ marginBottom: '0.75rem' }} />
          <p style={{ fontSize: '1.1rem', color: '#1A2B4C', fontWeight: 700, marginBottom: '0.5rem' }}>수락되었습니다.</p>
          <p style={{ fontSize: '0.9rem', color: '#6C7A89' }}>{data?.designatorName}님의 가족으로 연결됐습니다.</p>
        </div>
      </div>
    );
  }

  if (view === 'declined') {
    return (
      <div style={shellStyle}>
        <div style={cardStyle}>
          <XCircle size={40} color="#94A3B8" style={{ marginBottom: '0.75rem' }} />
          <p style={{ fontSize: '1.1rem', color: '#1A2B4C', fontWeight: 700, marginBottom: '0.5rem' }}>거절되었습니다.</p>
          <p style={{ fontSize: '0.9rem', color: '#6C7A89' }}>아무 권한도 부여되지 않았습니다.</p>
        </div>
      </div>
    );
  }

  // view === 'ready'
  const scope = data ? SCOPE_LABEL[data.scope] : undefined;
  const relationshipText = data
    ? `${RELATIONSHIP_LABEL[data.relationship] || data.relationship}${data.relationship === 'OTHER' && data.relationshipEtc ? `(${data.relationshipEtc})` : ''}`
    : '';

  return (
    <div style={shellStyle}>
      <div style={cardStyle}>
        <HeartHandshake size={40} color="var(--point-color)" style={{ marginBottom: '0.75rem' }} />
        <h1 style={{ fontSize: '1.3rem', color: '#1A2B4C', fontFamily: "'KoPub World Batang', serif", marginBottom: '0.6rem' }}>
          {data?.designatorName}님이 당신을 가족으로 지정했습니다
        </h1>
        <p style={{ fontSize: '0.92rem', color: '#6C7A89', lineHeight: 1.6, marginBottom: '1.4rem' }}>
          관계: {relationshipText}
          <br />
          권한: {scope?.label}{scope ? ` (${scope.hint})` : ''}
        </p>

        <div style={{ fontSize: '0.78rem', color: '#92400E', backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '8px', padding: '0.7rem 0.85rem', marginBottom: '1.4rem', lineHeight: 1.6, textAlign: 'left' }}>
          수락하시면 사망 통지 등 위 권한이 생깁니다. 거절하셔도 어떤 불이익도 없습니다.
        </div>

        {errorMsg && (
          <div style={{ fontSize: '0.85rem', color: '#991B1B', backgroundColor: '#FEE2E2', border: '1px solid #FECACA', borderRadius: '8px', padding: '0.7rem 0.9rem', marginBottom: '1rem' }}>
            {errorMsg}
          </div>
        )}

        {currentUser && authToken ? (
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button
              type="button"
              onClick={handleDecline}
              disabled={isSubmitting}
              className="btn"
              style={{ flex: 1, backgroundColor: 'var(--secondary-color)', color: 'var(--primary-color)' }}
            >
              거절
            </button>
            <button type="button" onClick={handleAccept} disabled={isSubmitting} className="btn btn-primary" style={{ flex: 1 }}>
              {isSubmitting ? '처리 중...' : '수락'}
            </button>
          </div>
        ) : (
          <>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.8rem' }}>
              수락하려면 먼저 로그인해 주세요.
            </p>
            <button
              type="button"
              onClick={handleOpenLogin}
              className="btn btn-primary"
              style={{ width: '100%', height: '52px' }}
            >
              로그인하고 계속하기
            </button>
            <button
              type="button"
              onClick={handleDecline}
              disabled={isSubmitting}
              style={{ marginTop: '1rem', background: 'none', border: 'none', fontSize: '0.82rem', color: 'var(--text-muted)', textDecoration: 'underline', cursor: 'pointer' }}
            >
              로그인 없이 거절만 하기
            </button>
          </>
        )}
      </div>
    </div>
  );
};
