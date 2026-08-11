import React, { useState } from 'react';
import { Building2, Scale, Lock, Mail } from 'lucide-react';
import { BACKEND_URL } from '../config';
import { BizDashboard } from './BizDashboard';

// 사업자(장사시설) / 전문가(변호사·세무사·행정사·장례지도사) 전용 포털.
// B2C 소셜 로그인(LoginModal)과 완전히 분리된 이메일/비밀번호 회원가입·로그인.
// docs/01_.../01-05(장사시설)·docs/02_.../02-02(전문가) 근거. 백엔드 /api/partner, /api/expert 사용.
//
// 승인 전 어드민 화면이 아직 없어(§4 구현 범위) 가입해도 즉시 로그인은 안 되고, 운영자가
// DB에서 status를 APPROVED로 바꿔야 한다 — 이 페이지는 그 상태를 있는 그대로 보여준다.

type AccountType = 'FACILITY' | 'EXPERT';
type Mode = 'LOGIN' | 'SIGNUP';

const EXPERT_CATEGORY_LABELS: Record<string, string> = {
  LAWYER: '상속 전문 변호사',
  TAX_ACCOUNTANT: '상속세 전문 세무사',
  ADMINISTRATIVE_SCRIVENER: '디지털 유품 행정사',
  FUNERAL_DIRECTOR: '장례·장지 지도사',
};

export const PartnerPortalPage: React.FC = () => {
  const [accountType, setAccountType] = useState<AccountType>('FACILITY');
  const [mode, setMode] = useState<Mode>('LOGIN');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultMessage, setResultMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [loggedIn, setLoggedIn] = useState<{ type: AccountType; name: string; status: string } | null>(() => {
    const savedType = localStorage.getItem('eobom_biz_type') as AccountType | null;
    const savedName = localStorage.getItem('eobom_biz_name');
    return savedType && savedName ? { type: savedType, name: savedName, status: 'APPROVED' } : null;
  });

  // 로그인 공통 필드
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  // 장사시설 가입 필드
  const [bizRegNo, setBizRegNo] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [contactName, setContactName] = useState('');
  const [facilityPhone, setFacilityPhone] = useState('');

  // 전문가 가입 필드
  const [category, setCategory] = useState('LAWYER');
  const [expertName, setExpertName] = useState('');
  const [licenseNo, setLicenseNo] = useState('');
  const [licenseOrg, setLicenseOrg] = useState('');
  const [expertPhone, setExpertPhone] = useState('');
  const [bio, setBio] = useState('');

  const endpointBase = accountType === 'FACILITY' ? `${BACKEND_URL}/api/partner` : `${BACKEND_URL}/api/expert`;

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setPasswordConfirm('');
    setBizRegNo('');
    setCompanyName('');
    setOwnerName('');
    setContactName('');
    setFacilityPhone('');
    setCategory('LAWYER');
    setExpertName('');
    setLicenseNo('');
    setLicenseOrg('');
    setExpertPhone('');
    setBio('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setResultMessage(null);
    try {
      const res = await fetch(`${endpointBase}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || data.status !== 'success') {
        setResultMessage({ type: 'error', text: data.message || '로그인에 실패했습니다.' });
        return;
      }
      const name = accountType === 'FACILITY' ? data.partner.companyName : data.expert.name;
      localStorage.setItem('eobom_biz_token', data.accessToken);
      localStorage.setItem('eobom_biz_refresh_token', data.refreshToken);
      localStorage.setItem('eobom_biz_type', accountType);
      localStorage.setItem('eobom_biz_name', name);
      setLoggedIn({ type: accountType, name, status: 'APPROVED' });
      setResultMessage({ type: 'success', text: `${name}님, 로그인되었습니다.` });
    } catch {
      setResultMessage({ type: 'error', text: '서버와 통신 중 오류가 발생했습니다.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== passwordConfirm) {
      setResultMessage({ type: 'error', text: '비밀번호가 일치하지 않습니다.' });
      return;
    }
    setIsSubmitting(true);
    setResultMessage(null);
    try {
      const payload =
        accountType === 'FACILITY'
          ? { email, password, bizRegNo, companyName, ownerName, contactName, contactPhone: facilityPhone }
          : { email, password, category, name: expertName, licenseNo, licenseOrg, contactPhone: expertPhone, bio };

      const res = await fetch(`${endpointBase}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || data.status !== 'success') {
        setResultMessage({ type: 'error', text: data.message || '가입 신청에 실패했습니다.' });
        return;
      }
      setResultMessage({ type: 'info', text: data.message || '가입 신청이 접수되었습니다. 승인 후 로그인하실 수 있습니다.' });
      resetForm();
      setMode('LOGIN');
    } catch {
      setResultMessage({ type: 'error', text: '서버와 통신 중 오류가 발생했습니다.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = (notice?: string) => {
    localStorage.removeItem('eobom_biz_token');
    localStorage.removeItem('eobom_biz_refresh_token');
    localStorage.removeItem('eobom_biz_type');
    localStorage.removeItem('eobom_biz_name');
    setLoggedIn(null);
    setResultMessage(notice ? { type: 'error', text: notice } : null);
  };

  if (loggedIn) {
    return (
      <BizDashboard type={loggedIn.type} name={loggedIn.name} onLogout={handleLogout} />
    );
  }

  return (
    <div className="container" style={{ maxWidth: '560px', padding: '2.2rem 1rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.8rem', color: 'var(--primary-color)', fontWeight: 800, marginBottom: '0.5rem' }}>
          사업자·전문가 파트너 포털
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          이메일과 비밀번호로 가입·로그인합니다. 소셜 로그인이 아닙니다.
        </p>
      </div>

      {/* 계정 유형 선택 */}
      <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.1rem' }}>
        <button
          type="button"
          onClick={() => setAccountType('FACILITY')}
          className="btn"
          style={{
            flex: 1,
            backgroundColor: accountType === 'FACILITY' ? 'var(--primary-color)' : 'var(--card-bg)',
            color: accountType === 'FACILITY' ? '#FFFFFF' : 'var(--primary-color)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
          }}
        >
          <Building2 size={16} /> 장사시설 사업자
        </button>
        <button
          type="button"
          onClick={() => setAccountType('EXPERT')}
          className="btn"
          style={{
            flex: 1,
            backgroundColor: accountType === 'EXPERT' ? 'var(--primary-color)' : 'var(--card-bg)',
            color: accountType === 'EXPERT' ? '#FFFFFF' : 'var(--primary-color)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
          }}
        >
          <Scale size={16} /> 전문가
        </button>
      </div>

      {/* 로그인 / 가입 토글 */}
      <div style={{ display: 'flex', gap: '1.1rem', marginBottom: '1.1rem', justifyContent: 'center', borderBottom: '1px solid var(--border-color)' }}>
        {(['LOGIN', 'SIGNUP'] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setResultMessage(null);
            }}
            style={{
              background: 'none',
              border: 'none',
              padding: '0.8rem 0.2rem',
              fontSize: '0.95rem',
              fontWeight: 700,
              cursor: 'pointer',
              color: mode === m ? 'var(--primary-color)' : 'var(--text-muted)',
              borderBottom: mode === m ? '2px solid var(--point-color)' : '2px solid transparent',
            }}
          >
            {m === 'LOGIN' ? '로그인' : '회원가입'}
          </button>
        ))}
      </div>

      {resultMessage && (
        <div
          style={{
            padding: '0.8rem 1rem',
            borderRadius: '10px',
            marginBottom: '1.2rem',
            fontSize: '0.88rem',
            backgroundColor: resultMessage.type === 'error' ? '#FEE2E2' : resultMessage.type === 'success' ? '#DEF7EC' : '#FEF3C7',
            color: resultMessage.type === 'error' ? '#991B1B' : resultMessage.type === 'success' ? '#03543F' : '#92400E',
          }}
        >
          {resultMessage.text}
        </div>
      )}

      <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: '20px', padding: '1.5rem', boxShadow: 'var(--box-shadow)' }}>
        {mode === 'LOGIN' ? (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label className="form-label">이메일</label>
              <div style={{ position: 'relative' }}>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="form-select" style={{ paddingLeft: '2.4rem' }} />
                <Mail size={16} style={{ position: 'absolute', left: '0.8rem', top: '12px', color: '#9CA3AF' }} />
              </div>
            </div>
            <div>
              <label className="form-label">비밀번호</label>
              <div style={{ position: 'relative' }}>
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="form-select" style={{ paddingLeft: '2.4rem' }} />
                <Lock size={16} style={{ position: 'absolute', left: '0.8rem', top: '12px', color: '#9CA3AF' }} />
              </div>
            </div>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary">
              {isSubmitting ? '처리 중...' : '로그인'}
            </button>
          </form>
        ) : accountType === 'FACILITY' ? (
          <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label className="form-label">이메일</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="form-select" />
            </div>
            <div>
              <label className="form-label">비밀번호 (8자 이상)</label>
              <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="form-select" />
            </div>
            <div>
              <label className="form-label">비밀번호 확인</label>
              <input type="password" required minLength={8} value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} className="form-select" />
            </div>
            <div>
              <label className="form-label">사업자등록번호</label>
              <input required placeholder="000-00-00000" value={bizRegNo} onChange={(e) => setBizRegNo(e.target.value)} className="form-select" />
            </div>
            <div>
              <label className="form-label">상호</label>
              <input required value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="form-select" />
            </div>
            <div>
              <label className="form-label">대표자명</label>
              <input required value={ownerName} onChange={(e) => setOwnerName(e.target.value)} className="form-select" />
            </div>
            <div>
              <label className="form-label">담당자명</label>
              <input required value={contactName} onChange={(e) => setContactName(e.target.value)} className="form-select" />
            </div>
            <div>
              <label className="form-label">담당자 연락처</label>
              <input required type="tel" value={facilityPhone} onChange={(e) => setFacilityPhone(e.target.value)} className="form-select" />
            </div>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary">
              {isSubmitting ? '처리 중...' : '가입 신청'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label className="form-label">이메일</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="form-select" />
            </div>
            <div>
              <label className="form-label">비밀번호 (8자 이상)</label>
              <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="form-select" />
            </div>
            <div>
              <label className="form-label">비밀번호 확인</label>
              <input type="password" required minLength={8} value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} className="form-select" />
            </div>
            <div>
              <label className="form-label">전문 분야</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="form-select">
                {Object.entries(EXPERT_CATEGORY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">성명</label>
              <input required value={expertName} onChange={(e) => setExpertName(e.target.value)} className="form-select" />
            </div>
            <div>
              <label className="form-label">자격증 등록번호</label>
              <input required value={licenseNo} onChange={(e) => setLicenseNo(e.target.value)} className="form-select" />
            </div>
            <div>
              <label className="form-label">등록 기관 (선택)</label>
              <input placeholder="예: 대한변호사협회" value={licenseOrg} onChange={(e) => setLicenseOrg(e.target.value)} className="form-select" />
            </div>
            <div>
              <label className="form-label">연락처</label>
              <input required type="tel" value={expertPhone} onChange={(e) => setExpertPhone(e.target.value)} className="form-select" />
            </div>
            <div>
              <label className="form-label">소개 (선택)</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.9rem', height: '70px' }}
              />
            </div>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary">
              {isSubmitting ? '처리 중...' : '가입 신청'}
            </button>
          </form>
        )}
      </div>

      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '1.2rem' }}>
        가입 신청 후 운영자 심사를 거쳐 승인되면 로그인하실 수 있습니다.
      </p>
    </div>
  );
};
