import React, { useEffect, useState } from 'react';
import { ShieldCheck, Lock, Mail, CheckCircle2, XCircle } from 'lucide-react';
import { BACKEND_URL } from '../config';

// 운영자 전용 — 사업자(Partner)·전문가(Expert) 가입 심사 + 시설 클레임(연동) 심사.
// docs/16 §6.2, docs/17. 계정은 seed-admin.ts로만 생성되므로 여기엔 가입 폼이 없다.
// 공개 메뉴·Footer 어디에도 링크하지 않는다 — 직접 URL(#admin)로만 접근.

type QueueTab = 'PARTNERS' | 'EXPERTS' | 'CLAIMS';

const EXPERT_CATEGORY_LABELS: Record<string, string> = {
  LAWYER: '변호사',
  TAX_ACCOUNTANT: '세무사',
  ADMINISTRATIVE_SCRIVENER: '행정사',
  FUNERAL_DIRECTOR: '장례지도사',
};

export const AdminPage: React.FC = () => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('eobom_admin_token'));
  const [adminName, setAdminName] = useState<string | null>(() => localStorage.getItem('eobom_admin_name'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [tab, setTab] = useState<QueueTab>('PARTNERS');
  const [partners, setPartners] = useState<any[]>([]);
  const [experts, setExperts] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [loadError, setLoadError] = useState('');

  const authHeaders = { Authorization: `Bearer ${token}` };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setLoginError('');
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || data.status !== 'success') {
        setLoginError(data.message || '로그인에 실패했습니다.');
        return;
      }
      localStorage.setItem('eobom_admin_token', data.accessToken);
      localStorage.setItem('eobom_admin_refresh_token', data.refreshToken);
      localStorage.setItem('eobom_admin_name', data.admin.name);
      setToken(data.accessToken);
      setAdminName(data.admin.name);
    } catch {
      setLoginError('서버와 통신 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('eobom_admin_token');
    localStorage.removeItem('eobom_admin_refresh_token');
    localStorage.removeItem('eobom_admin_name');
    setToken(null);
    setAdminName(null);
  };

  const loadQueue = async () => {
    if (!token) return;
    setLoadError('');
    try {
      if (tab === 'PARTNERS') {
        const res = await fetch(`${BACKEND_URL}/api/admin/partners?status=${statusFilter}`, { headers: authHeaders });
        const data = await res.json();
        if (data.status === 'success') setPartners(data.data);
        else setLoadError(data.message || '조회 실패');
      } else if (tab === 'EXPERTS') {
        const res = await fetch(`${BACKEND_URL}/api/admin/experts?status=${statusFilter}`, { headers: authHeaders });
        const data = await res.json();
        if (data.status === 'success') setExperts(data.data);
        else setLoadError(data.message || '조회 실패');
      } else {
        const res = await fetch(`${BACKEND_URL}/api/admin/claims?status=${statusFilter}`, { headers: authHeaders });
        const data = await res.json();
        if (data.status === 'success') setClaims(data.data);
        else setLoadError(data.message || '조회 실패');
      }
    } catch {
      setLoadError('서버와 통신 중 오류가 발생했습니다.');
    }
  };

  useEffect(() => {
    loadQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, tab, statusFilter]);

  const decidePartner = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    const rejectReason = status === 'REJECTED' ? window.prompt('반려 사유를 입력해주세요') || '' : undefined;
    await fetch(`${BACKEND_URL}/api/admin/partners/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ status, rejectReason }),
    });
    loadQueue();
  };

  const decideExpert = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    const rejectReason = status === 'REJECTED' ? window.prompt('반려 사유를 입력해주세요') || '' : undefined;
    await fetch(`${BACKEND_URL}/api/admin/experts/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ status, rejectReason }),
    });
    loadQueue();
  };

  const decideClaim = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    const reviewNote = window.prompt(status === 'APPROVED' ? '승인 메모(선택)' : '반려 사유를 입력해주세요') || '';
    const res = await fetch(`${BACKEND_URL}/api/admin/claims/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ status, reviewNote }),
    });
    const data = await res.json();
    if (!res.ok) alert(data.message || '처리 실패');
    loadQueue();
  };

  if (!token) {
    return (
      <div className="container" style={{ maxWidth: '420px', padding: '4rem 1rem' }}>
        <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: '20px', padding: '2.5rem', boxShadow: 'var(--box-shadow)' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <ShieldCheck size={32} color="var(--point-color)" />
            <h2 style={{ color: 'var(--primary-color)', margin: '0.6rem 0 0 0' }}>운영자 로그인</h2>
          </div>
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
            {loginError && <div style={{ color: '#991B1B', fontSize: '0.85rem' }}>{loginError}</div>}
            <button type="submit" disabled={isSubmitting} className="btn btn-primary">
              {isSubmitting ? '처리 중...' : '로그인'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2.5rem 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ color: 'var(--primary-color)', fontSize: '1.6rem', fontWeight: 800 }}>운영자 승인 대시보드</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{adminName}님</span>
          <button onClick={handleLogout} className="btn" style={{ backgroundColor: '#E2E8F0', fontSize: '0.85rem' }}>
            로그아웃
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1rem' }}>
        {(['PARTNERS', 'EXPERTS', 'CLAIMS'] as QueueTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="btn"
            style={{
              backgroundColor: tab === t ? 'var(--primary-color)' : 'var(--card-bg)',
              color: tab === t ? '#FFFFFF' : 'var(--primary-color)',
              border: '1px solid var(--border-color)',
            }}
          >
            {t === 'PARTNERS' ? '사업자 가입' : t === 'EXPERTS' ? '전문가 가입' : '시설 연동(클레임)'}
          </button>
        ))}
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="form-select" style={{ width: '160px', marginLeft: 'auto' }}>
          <option value="PENDING">심사 대기</option>
          <option value="APPROVED">승인됨</option>
          <option value="REJECTED">반려됨</option>
          {tab !== 'CLAIMS' && <option value="SUSPENDED">정지됨</option>}
        </select>
      </div>

      {loadError && <div style={{ color: '#991B1B', marginBottom: '1rem' }}>{loadError}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
        {tab === 'PARTNERS' &&
          (partners.length === 0 ? (
            <EmptyState />
          ) : (
            partners.map((p) => (
              <div key={p.id} className="card" style={{ padding: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.8rem' }}>
                <div>
                  <strong style={{ color: 'var(--primary-color)' }}>{p.companyName}</strong>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginLeft: '0.6rem' }}>
                    대표 {p.ownerName} · 사업자번호 {p.bizRegNo} · 담당 {p.contactName}({p.contactPhone}) · {p.email}
                  </span>
                  {p.rejectReason && <div style={{ color: '#991B1B', fontSize: '0.8rem' }}>반려 사유: {p.rejectReason}</div>}
                </div>
                {p.status === 'PENDING' && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <ApproveButton onClick={() => decidePartner(p.id, 'APPROVED')} />
                    <RejectButton onClick={() => decidePartner(p.id, 'REJECTED')} />
                  </div>
                )}
              </div>
            ))
          ))}

        {tab === 'EXPERTS' &&
          (experts.length === 0 ? (
            <EmptyState />
          ) : (
            experts.map((ex) => (
              <div key={ex.id} className="card" style={{ padding: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.8rem' }}>
                <div>
                  <strong style={{ color: 'var(--primary-color)' }}>{ex.name}</strong>
                  <span style={{ fontSize: '0.75rem', backgroundColor: 'var(--secondary-color)', padding: '0.15rem 0.5rem', borderRadius: '6px', marginLeft: '0.5rem' }}>
                    {EXPERT_CATEGORY_LABELS[ex.category] || ex.category}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginLeft: '0.6rem' }}>
                    자격번호 {ex.licenseNo} {ex.licenseOrg && `(${ex.licenseOrg})`} · {ex.contactPhone} · {ex.email}
                  </span>
                  {ex.rejectReason && <div style={{ color: '#991B1B', fontSize: '0.8rem' }}>반려 사유: {ex.rejectReason}</div>}
                </div>
                {ex.status === 'PENDING' && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <ApproveButton onClick={() => decideExpert(ex.id, 'APPROVED')} />
                    <RejectButton onClick={() => decideExpert(ex.id, 'REJECTED')} />
                  </div>
                )}
              </div>
            ))
          ))}

        {tab === 'CLAIMS' &&
          (claims.length === 0 ? (
            <EmptyState />
          ) : (
            claims.map((c) => (
              <div key={c.id} className="card" style={{ padding: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.8rem' }}>
                <div>
                  <strong style={{ color: 'var(--primary-color)' }}>{c.facility?.name}</strong>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginLeft: '0.6rem' }}>
                    {c.facility?.location} · 신청 사업자: {c.partner?.companyName}({c.partner?.email})
                  </span>
                  {c.reviewNote && <div style={{ color: '#92400E', fontSize: '0.8rem' }}>메모: {c.reviewNote}</div>}
                </div>
                {c.status === 'PENDING' && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <ApproveButton onClick={() => decideClaim(c.id, 'APPROVED')} />
                    <RejectButton onClick={() => decideClaim(c.id, 'REJECTED')} />
                  </div>
                )}
              </div>
            ))
          ))}
      </div>
    </div>
  );
};

const EmptyState: React.FC = () => (
  <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>해당 조건의 항목이 없습니다.</div>
);

const ApproveButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button onClick={onClick} className="btn" style={{ backgroundColor: '#DEF7EC', color: '#03543F', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
    <CheckCircle2 size={16} /> 승인
  </button>
);

const RejectButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button onClick={onClick} className="btn" style={{ backgroundColor: '#FEE2E2', color: '#991B1B', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
    <XCircle size={16} /> 반려
  </button>
);
