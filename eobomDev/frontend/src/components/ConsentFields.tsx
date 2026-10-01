import React from 'react';
import { Check } from 'lucide-react';

// 만 14세 확인 + 필수 동의 2개(이용약관·개인정보) + 선택 1개(마케팅) — 회원가입 탭(LoginModal)과
// 기존 회원 재동의 창(ConsentRequiredModal, 00-36 §4.5-1)이 **같은 규칙**을 쓰도록 분리한 묶음이다.
// 상태는 부모가 가진다(제출 방식이 두 곳에서 다르다).

// 필수/선택 동의 한 줄
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

interface ConsentFieldsProps {
  ageConfirmed: boolean;
  onAgeConfirmedChange: (next: boolean) => void;
  agreedTerms: boolean;
  onTermsChange: (next: boolean) => void;
  agreedPrivacy: boolean;
  onPrivacyChange: (next: boolean) => void;
  agreedMarketing: boolean;
  onMarketingChange: (next: boolean) => void;
}

export const ConsentFields: React.FC<ConsentFieldsProps> = ({
  ageConfirmed,
  onAgeConfirmedChange,
  agreedTerms,
  onTermsChange,
  agreedPrivacy,
  onPrivacyChange,
  agreedMarketing,
  onMarketingChange,
}) => {
  // 만 14세 확인은 "전체 동의"에 포함하지 않는다(00-19 §9-2-1 요구2) — 별도 state·별도 박스.
  const allAgreed = agreedTerms && agreedPrivacy && agreedMarketing;
  const toggleAll = () => {
    const next = !allAgreed;
    onTermsChange(next);
    onPrivacyChange(next);
    onMarketingChange(next);
  };

  return (
    <>
      {/* 만 14세 이상 자기신고(00-19 §9-2-1) — 아래 동의 박스와 절대 섞지 않는다(요구2).
      생년월일은 받지 않고, 체크 여부도 어디에도 저장하지 않는다(요구3) — 버튼을 잠그는 순수 로컬 게이트일 뿐이다. */}
      <label
        onClick={() => onAgeConfirmedChange(!ageConfirmed)}
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

      {/* 필수 동의(이용약관·개인정보) 2개 + 선택(마케팅 수신) 1개 */}
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
        <ConsentCheckbox checked={agreedTerms} onChange={onTermsChange} label="서비스 이용약관 동의" required href="/terms" />
        <ConsentCheckbox checked={agreedPrivacy} onChange={onPrivacyChange} label="개인정보 수집 및 이용 동의" required href="/privacy" />
        <ConsentCheckbox checked={agreedMarketing} onChange={onMarketingChange} label="마케팅 정보 수신 동의" required={false} />
      </div>
    </>
  );
};
