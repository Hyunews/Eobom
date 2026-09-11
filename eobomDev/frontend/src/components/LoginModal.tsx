import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ShieldCheck, Check, AlertCircle } from 'lucide-react';
import { BACKEND_URL } from '../config';
import { PENDING_RETURN_PATH_KEY } from '../lib/storage';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (username: string, provider?: string, token?: string) => void;
  // 2026-08-25 — 로그인/회원가입 탭 분리. 기본은 항상 "로그인" 탭. App.tsx가 mode=login 소셜
  // 로그인이 "가입되지 않은 계정"으로 돌아왔을 때만 "signup"+안내문과 함께 연다.
  initialTab?: 'login' | 'signup';
  initialNotice?: string | null;
}

// 필수/선택 동의 한 줄 — LoginModal 전용이라 여기서만 쓴다(재사용 시점이 오면 그때 분리).
const ConsentCheckbox: React.FC<{
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  required: boolean;
  href?: string;
}> = ({ checked, onChange, label, required, href }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', padding: '0.3rem 0' }}>
    <label style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', cursor: 'pointer', fontSize: 'var(--fs-body)', color: '#4B5563' }}>
      <span
        onClick={() => onChange(!checked)}
        role="checkbox"
        aria-checked={checked}
        style={{
          width: '19px',
          height: '19px',
          flexShrink: 0,
          borderRadius: 'var(--r-sm)',
          border: checked ? 'none' : '1.5px solid var(--border-color)',
          backgroundColor: checked ? 'var(--point-color)' : '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer'
        }}
      >
        {checked && <Check size={13} color="#FFFFFF" strokeWidth={3} />}
      </span>
      <span>
        <span style={{ color: required ? 'var(--primary-color)' : 'var(--text-muted)', fontWeight: 600 }}>
          {required ? '[필수] ' : '[선택] '}
        </span>
        {label}
      </span>
    </label>
    {href && (
      <a href={href} target="_blank" rel="noopener noreferrer" style={{ fontSize: 'var(--fs-body)', color: 'var(--text-hint)', textDecoration: 'underline', flexShrink: 0 }}>
        보기
      </a>
    )}
  </div>
);

// 소셜 로그인 3종 버튼 — 2026-08-25 탭 분리로 "로그인" 탭(항상 활성)과 "회원가입" 탭(동의 게이트로
// disabled)이 같은 버튼 마크업을 필요로 해서 분리했다. onSelect만 탭마다 다르다
// (handleLoginTabSocial vs handleSocialLogin).
const SocialLoginButtons: React.FC<{
  onSelect: (provider: 'kakao' | 'naver' | 'google') => void;
  disabled?: boolean;
}> = ({ onSelect, disabled = false }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)', opacity: disabled ? 0.45 : 1, pointerEvents: disabled ? 'none' : 'auto', transition: 'opacity 0.2s ease' }}>
    {/* 1. 카카오 로그인 */}
    <button
      onClick={() => onSelect('kakao')}
      disabled={disabled}
      style={{
        width: '100%',
        height: '52px',
        backgroundColor: '#FEE500',
        color: '#191919',
        border: 'none',
        borderRadius: 'var(--r-md)',
        fontSize: 'var(--fs-body)',
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--sp-3)',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(254, 229, 0, 0.3)',
        transition: 'transform 0.15s'
      }}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" clipRule="evenodd" d="M12 3C6.477 3 2 6.484 2 10.782C2 13.567 3.791 16.002 6.5 17.388L5.59 20.738C5.474 21.164 5.952 21.492 6.31 21.254L10.378 18.55C10.906 18.625 11.446 18.665 12 18.665C17.523 18.665 22 15.181 22 10.883C22 6.584 17.523 3 12 3Z" fill="#191919"/>
      </svg>
      카카오로 시작하기
    </button>

    {/* 2. 네이버 로그인 */}
    <button
      onClick={() => onSelect('naver')}
      disabled={disabled}
      style={{
        width: '100%',
        height: '52px',
        backgroundColor: '#03C75A',
        color: '#FFFFFF',
        border: 'none',
        borderRadius: 'var(--r-md)',
        fontSize: 'var(--fs-body)',
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--sp-3)',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(3, 199, 90, 0.3)',
        transition: 'transform 0.15s'
      }}
    >
      <span style={{ fontWeight: 'var(--fw-bold)', fontSize: '1.2rem', fontFamily: 'sans-serif' }}>N</span>
      네이버로 시작하기
    </button>

    {/* 3. 구글 로그인 */}
    <button
      onClick={() => onSelect('google')}
      disabled={disabled}
      style={{
        width: '100%',
        height: '52px',
        backgroundColor: '#FFFFFF',
        color: '#3C4043',
        border: '1.5px solid var(--secondary-dark)',
        borderRadius: 'var(--r-md)',
        fontSize: 'var(--fs-body)',
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--sp-3)',
        cursor: 'pointer',
        boxShadow: 'var(--el-1)',
        transition: 'transform 0.15s'
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
      </svg>
      구글 계정으로 시작하기
    </button>
  </div>
);

// B2C 소비자 로그인 전용. 사업자·전문가는 /partner, 운영자는 /admin — 전부 완전히 분리된
// 별도 인증 체계라 여기엔 관리자 로그인이 없다(2026-08-10, 옛 admin/1234 목업 버튼 제거).
// 하단에 /partner 진입 링크만 둔다(00-06 §7.3 ①, 2026-08-14) — 헤더 로그인 버튼을 누르고
// 여기까지 들어온 사업자·전문가가 막다른 길에 걸리지 않도록.
export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLoginSuccess, initialTab, initialNotice }) => {
  const navigate = useNavigate();

  // 2026-08-25 — 로그인/회원가입 탭. 모달이 새로 열릴 때마다 부모가 지정한 값으로 리셋한다
  // (열려 있는 상태에서 initialTab/initialNotice만 바뀌는 경우는 없음 — App.tsx가 항상
  // openLoginModal()로 값과 열기를 함께 호출하지만, isOpen 전이를 기준으로 확실히 맞춘다).
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>(initialTab ?? 'login');
  const [notice, setNotice] = useState<string | null>(initialNotice ?? null);
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab ?? 'login');
      setNotice(initialNotice ?? null);
    }
  }, [isOpen, initialTab, initialNotice]);

  // 2026-08-24 추가 — 가입(=최초 소셜 로그인) 시점에 이용약관·개인정보 수집·이용 동의를 전혀
  // 받고 있지 않던 걸 확인해서(개인정보보호법상 필수) 여기서 막는다. 필수 2개를 통과해야만
  // 아래 로그인 버튼들이 눌린다 — 링크는 새 탭으로 열어 모달 상태(체크 여부)가 안 날아가게 한다.
  // (회원가입 탭 전용 — 로그인 탭은 동의 UI 자체가 없다, §아래 handleLoginTabSocial.)
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const [agreedMarketing, setAgreedMarketing] = useState(false);
  const allAgreed = agreedTerms && agreedPrivacy && agreedMarketing;
  const toggleAll = () => {
    const next = !allAgreed;
    setAgreedTerms(next);
    setAgreedPrivacy(next);
    setAgreedMarketing(next);
  };

  // 00-19 §9-2-1 구현 요구 — 만 14세 이상 자기신고 게이트(생년월일은 받지 않는다, 최소수집
  // 원칙). 요구2에 따라 위 이용약관/개인정보 동의와 절대 묶지 않는다 — 완전히 별도 state이고
  // "전체 동의"(toggleAll/allAgreed)에도 포함시키지 않는다. 요구3에 따라 이 값은 어디로도
  // 전송하지 않는다(handleSocialLogin의 쿼리, handleMockSocialLogin의 body 어디에도 없음) —
  // 저장하면 그 자체가 새로운 개인정보 항목이 되므로 로그인 버튼을 막는 순수 로컬 게이트로만 쓴다.
  const [ageConfirmed, setAgeConfirmed] = useState(false);

  // 요구1/4 — 만 14세 확인 + 필수 동의 2개를 전부 통과해야 소셜/데모 로그인 버튼이 동작한다.
  const canProceed = agreedTerms && agreedPrivacy && ageConfirmed;

  if (!isOpen) return null;

  const handlePartnerEntry = () => {
    onClose();
    navigate('/partner');
  };

  // 소셜 로그인 처리 (카카오, 네이버, 구글) — 백엔드 OAuth 인가 엔드포인트로 리다이렉트.
  // 동의 여부를 쿼리로 실어보내면 백엔드가 OAuth state에 서명해 콜백까지 들고 가서, 실제
  // 신규 가입(User 생성) 시점에만 termsAgreedAt 등을 스탬프한다(authController.ts 참고).
  // "회원가입" 탭 전용 — mode=signup을 명시해 서버가 신규 가입 경로를 그대로 타게 한다.
  const handleSocialLogin = (provider: 'kakao' | 'naver' | 'google') => {
    if (!canProceed) return;
    const params = new URLSearchParams({
      mode: 'signup',
      consentTerms: agreedTerms ? '1' : '0',
      consentPrivacy: agreedPrivacy ? '1' : '0',
      consentMarketing: agreedMarketing ? '1' : '0',
    });
    // 🆕 2026-09-10 — 전체 페이지 리다이렉트라 SPA 라우트가 끊긴다. 콜백은 항상 '/'로 돌아오므로
    // (App.tsx), 지금 경로를 저장해뒀다가 로그인 성공 후 되돌아가게 한다(prep·bereaved 등).
    sessionStorage.setItem(PENDING_RETURN_PATH_KEY, window.location.pathname);
    window.location.href = `${BACKEND_URL}/api/auth/${provider}?${params.toString()}`;
  };

  // "로그인" 탭 전용 — 동의 체크박스·만14세 확인 UI가 이 탭엔 없으므로 canProceed 게이트를
  // 거치지 않고 바로 진행한다. mode=login을 실어보내면 authRoutes.ts가 이 요청에 한해 door의
  // 동의 쿼리 요구를 건너뛰고, authController.ts가 소셜 인증 후 "이미 가입된 계정"일 때만
  // 로그인시킨다 — 가입 이력이 없는 소셜 계정이면 동의 없이 조용히 새 User를 만드는 대신
  // loginError=not_registered로 돌려보내 App.tsx가 "회원가입" 탭을 열게 한다.
  const handleLoginTabSocial = (provider: 'kakao' | 'naver' | 'google') => {
    sessionStorage.setItem(PENDING_RETURN_PATH_KEY, window.location.pathname);
    window.location.href = `${BACKEND_URL}/api/auth/${provider}?mode=login`;
  };

  // 데모 로그인 (`POST /api/auth/demo-login`) — 2026-08-12 정정: 예전엔 토큰 없이 화면 표시용
  // 이름만 세팅하는 순수 프런트 목업이었다. 그래서 로그인된 것처럼 "OO 회원님"이 뜨는데도
  // 실제로는 인증 토큰이 없어 업체 문의 등 모든 요청이 조용히 익명으로 나가는 혼란이 있었다
  // (walkthrough 2026-08-12 (4)). 실제 백엔드 데모 로그인 API를 호출해 진짜 토큰을 받도록 수정.
  const handleMockSocialLogin = async (providerCode: string) => {
    if (!canProceed) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/demo-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: providerCode, termsAgreed: agreedTerms, privacyAgreed: agreedPrivacy }),
      });
      const data = await res.json();
      if (!res.ok || data.status !== 'success') {
        alert(data.message || '데모 로그인에 실패했습니다.');
        return;
      }
      onLoginSuccess(data.user.name, providerCode, data.token);
      onClose();
    } catch {
      alert('서버와 통신 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="login-modal-backdrop">
      {/* 동의 체크박스 3개 + 소셜 로그인 3종 + 데모 버튼까지 합치면 모바일 화면 높이를
          넘어서는데(2026-08-25 개발자 실기기 확인), maxHeight/overflowY가 없어 위아래가
          화면 밖으로 잘려 나가고 배경(overflow 없는 고정 배경)에서도 스크롤할 방법이 없었다.
          카드 자체를 뷰포트의 90%로 제한하고 내부 스크롤을 허용한다.
          🔄 2026-09-11 모바일 검증 루프 7번 — 인라인 스타일을 .login-modal-backdrop/-panel로
          옮김(값 동일). ≤768px에서는 이 90vh 대신 공통 규칙의 max-height:88dvh(주소창에
          안 잘리는 dvh)가 소스 순서상 나중이라 자동으로 이긴다(index.css). */}
      <div className="login-modal-panel">
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'var(--surface-subtle)',
            border: 'none',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            transition: 'background-color var(--dur-1) var(--ease-out), color var(--dur-1) var(--ease-out)'
          }}
        >
          <X size={20} />
        </button>

        {/* 모달 타이틀 */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.4rem 0.9rem',
            backgroundColor: 'var(--secondary-color)',
            color: 'var(--primary-color)',
            borderRadius: 'var(--r-lg)',
            fontSize: 'var(--fs-body)',
            fontWeight: 600,
            marginBottom: 'var(--sp-3)'
          }}>
            <ShieldCheck size={14} /> 안전하고 빠른 3초 간편로그인
          </div>
          <h2 style={{ color: 'var(--primary-color)', fontSize: '1.6rem', fontWeight: 'var(--fw-bold)', margin: '0 0 0.4rem 0' }}>
            이어봄 시작하기
          </h2>
          <p style={{ fontSize: 'var(--fs-body)', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
            소셜 계정으로 로그인하고<br />엔딩노트 및 웰다잉 토탈 케어 서비스를 이용해보세요.
          </p>
        </div>

        {/* 로그인/회원가입 탭 — 2026-08-25. 기본 "로그인"은 동의 UI 없이 소셜 버튼만 노출하고
            (기존 회원 재로그인 전용), "회원가입"에서만 만14세+필수동의 게이트를 거친다. */}
        <div style={{ display: 'flex', backgroundColor: 'var(--surface-subtle)', borderRadius: 'var(--r-md)', padding: '4px', marginBottom: '1.2rem' }}>
          {(['login', 'signup'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => { setActiveTab(tab); setNotice(null); }}
              style={{
                flex: 1,
                border: 'none',
                borderRadius: 'var(--r-sm)',
                padding: '0.6rem 0',
                fontSize: 'var(--fs-body)',
                fontWeight: 700,
                cursor: 'pointer',
                backgroundColor: activeTab === tab ? '#FFFFFF' : 'transparent',
                color: activeTab === tab ? 'var(--primary-color)' : 'var(--text-muted)',
                boxShadow: activeTab === tab ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'background-color var(--dur-1) var(--ease-out), color var(--dur-1) var(--ease-out), box-shadow var(--dur-1) var(--ease-out)'
              }}
            >
              {tab === 'login' ? '로그인' : '회원가입'}
            </button>
          ))}
        </div>

        {notice && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: 'var(--fs-body)', color: 'var(--state-warn-fg)', backgroundColor: 'var(--state-warn-bg)', border: '1px solid var(--state-warn-bg)', borderRadius: 'var(--r-sm)', padding: 'var(--sp-3) 0.9rem', marginBottom: '1.1rem' }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
            <span>{notice}</span>
          </div>
        )}

        {/* "로그인" 탭 — 이미 가입된 계정 전용. 동의 체크박스·만14세 확인이 없다(작업 지시 원문).
            신규 계정이면 handleLoginTabSocial → authController.ts가 가입시키지 않고 되돌려보내
            App.tsx가 이 모달을 "회원가입" 탭 + 안내문으로 다시 연다. */}
        {activeTab === 'login' && (
          <div style={{ marginBottom: '0.5rem' }}>
            <SocialLoginButtons onSelect={handleLoginTabSocial} />
          </div>
        )}

        {/* "회원가입" 탭 — 기존 UI(만14세 게이트 + 필수동의 2 + 선택 1) 그대로. */}
        {activeTab === 'signup' && (
        <>
        {/* 만 14세 이상 자기신고(00-19 §9-2-1) — 아래 동의 박스와 절대 섞지 않는다(요구2).
            생년월일은 받지 않고, 체크 여부도 어디에도 저장하지 않는다(요구3) — 로그인 버튼을
            잠그는 순수 로컬 게이트일 뿐이다. */}
        <label
          onClick={() => setAgeConfirmed((prev) => !prev)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.55rem',
            cursor: 'pointer',
            fontSize: 'var(--fs-body)',
            color: '#4B5563',
            padding: 'var(--sp-3) 0.9rem',
            border: '1px solid var(--secondary-dark)',
            borderRadius: 'var(--r-sm)',
            marginBottom: '0.9rem'
          }}
        >
          <span
            role="checkbox"
            aria-checked={ageConfirmed}
            style={{
              width: '19px',
              height: '19px',
              flexShrink: 0,
              borderRadius: 'var(--r-sm)',
              border: ageConfirmed ? 'none' : '1.5px solid var(--border-color)',
              backgroundColor: ageConfirmed ? 'var(--primary-color)' : '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {ageConfirmed && <Check size={13} color="#FFFFFF" strokeWidth={3} />}
          </span>
          <span>
            본인은 <strong style={{ color: 'var(--primary-color)' }}>만 14세 이상</strong>입니다.
            이어봄은 만 14세 미만 아동의 가입을 받지 않습니다.
          </span>
        </label>

        {/* 필수 동의(이용약관·개인정보) 2개 + 선택(마케팅 수신) 1개 — 아래 로그인 버튼은
            필수 2개가 체크되기 전까지 눌리지 않는다. 최초 가입(신규 소셜 로그인)일 때만 실제로
            DB에 동의 시각이 기록되고(authController.ts), 기존 회원 재로그인 시에는 이미 최초
            가입 때 받은 값이라 여기서 다시 체크해도 별도로 덮어써지지 않는다. */}
        <div style={{ backgroundColor: 'var(--secondary-color)', borderRadius: 'var(--r-md)', padding: 'var(--sp-4) 1rem 0.4rem', marginBottom: '1.2rem' }}>
          <div
            onClick={toggleAll}
            role="checkbox"
            aria-checked={allAgreed}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.55rem',
              cursor: 'pointer',
              paddingBottom: '0.55rem',
              marginBottom: '0.3rem',
              borderBottom: '1px solid var(--secondary-dark)',
              fontWeight: 700,
              fontSize: 'var(--fs-body)',
              color: 'var(--primary-color)'
            }}
          >
            <span
              style={{
                width: '19px',
                height: '19px',
                flexShrink: 0,
                borderRadius: 'var(--r-sm)',
                border: allAgreed ? 'none' : '1.5px solid var(--border-color)',
                backgroundColor: allAgreed ? 'var(--primary-color)' : '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {allAgreed && <Check size={13} color="#FFFFFF" strokeWidth={3} />}
            </span>
            전체 동의합니다
          </div>
          <ConsentCheckbox checked={agreedTerms} onChange={setAgreedTerms} label="서비스 이용약관 동의" required href="/terms" />
          <ConsentCheckbox checked={agreedPrivacy} onChange={setAgreedPrivacy} label="개인정보 수집 및 이용 동의" required href="/privacy" />
          <ConsentCheckbox checked={agreedMarketing} onChange={setAgreedMarketing} label="마케팅 정보 수신 동의" required={false} />
        </div>

        {/* 소셜 로그인 3종 — 필수 동의 전까지 비활성화(흐리게 + 클릭 무시) */}
        <SocialLoginButtons onSelect={handleSocialLogin} disabled={!canProceed} />
        </>
        )}

        {/* 파트너 진입 링크 + 개발용 데모 로그인 — "로그인"·"회원가입" 두 탭 공통 하단(작업 지시 원문) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)', marginTop: activeTab === 'login' ? 0 : '0.5rem' }}>
            {/* 파트너(사업자·전문가) 진입 분기 — B2C 소셜 로그인과 무관한 별도 인증 체계로 이동
                (00-06 §7.3 ①). 데모 블록은 오픈 시 제거될 것이므로 그 위에 둔다. */}
            <div style={{ marginTop: '0.95rem', paddingTop: '0.95rem', borderTop: '1px solid var(--surface-subtle)', textAlign: 'center' }}>
              <button
                type="button"
                onClick={handlePartnerEntry}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 'var(--fs-body)',
                  fontWeight: 600,
                  color: 'var(--primary-color)',
                  textDecoration: 'underline',
                  padding: 0
                }}
              >
                장사시설 · 전문가 회원이신가요? 파트너 로그인 →
              </button>
            </div>

            {/* 하단 개발용 모의 로그인 버튼 — 백엔드 demo-login이 termsAgreed/privacyAgreed를
                요구해서(authController.ts) canProceed(회원가입 탭의 동의+만14세 게이트)에 계속
                묶어둔다. "로그인" 탭에는 그 게이트 자체가 없어 canProceed가 항상 false이므로,
                데모 버튼은 이 자리에 노출은 되지만 "회원가입" 탭으로 전환해 동의해야 눌린다. */}
            <div style={{ marginTop: '0.95rem', paddingTop: '0.95rem', borderTop: '1px solid var(--surface-subtle)', textAlign: 'center' }}>
              <div style={{ fontSize: 'var(--fs-body)', color: 'var(--text-hint)', marginBottom: '0.6rem' }}>
                [빠른 데모 테스트용 선택]
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: 'var(--sp-3)', opacity: canProceed ? 1 : 0.45, pointerEvents: canProceed ? 'auto' : 'none', transition: 'opacity 0.2s ease' }}>
                <button
                  type="button"
                  onClick={() => handleMockSocialLogin('KAKAO')}
                  style={{ fontSize: 'var(--fs-body)', padding: '0.35rem 0.65rem', borderRadius: 'var(--r-sm)', border: '1px solid #FEE500', backgroundColor: '#FFFDF0', color: '#191919', cursor: 'pointer' }}
                >
                  🟡 카카오(모의)
                </button>
                <button
                  type="button"
                  onClick={() => handleMockSocialLogin('NAVER')}
                  style={{ fontSize: 'var(--fs-body)', padding: '0.35rem 0.65rem', borderRadius: 'var(--r-sm)', border: '1px solid #03C75A', backgroundColor: '#F0FDF4', color: '#03C75A', cursor: 'pointer' }}
                >
                  🟢 네이버(모의)
                </button>
                <button
                  type="button"
                  onClick={() => handleMockSocialLogin('GOOGLE')}
                  style={{ fontSize: 'var(--fs-body)', padding: '0.35rem 0.65rem', borderRadius: 'var(--r-sm)', border: '1px solid var(--border-color)', backgroundColor: '#F9FAFB', color: '#374151', cursor: 'pointer' }}
                >
                  ⚪ 구글(모의)
                </button>
              </div>
            </div>
          </div>
      </div>
    </div>
  );
};
