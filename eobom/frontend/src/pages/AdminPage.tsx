import React, { useEffect, useState } from 'react';
import { ShieldCheck, Lock, Mail, CheckCircle2, XCircle, Pencil, Save, X } from 'lucide-react';
import { BACKEND_URL, formatPhoneForDisplay } from '../config';

// 운영자 전용 — 사업자(Partner)·전문가(Expert) 가입 심사 + 시설 클레임(연동) 심사.
// docs/01-05 §6.2, docs/02-02. 계정은 seed-admin.ts로만 생성되므로 여기엔 가입 폼이 없다.
// 공개 메뉴·Footer 어디에도 링크하지 않는다 — 직접 URL(#admin)로만 접근.

type QueueTab = 'PARTNERS' | 'EXPERTS' | 'CLAIMS' | 'FACILITIES';

const TAB_LABELS: Record<QueueTab, string> = {
  PARTNERS: '사업자 가입',
  EXPERTS: '전문가 가입',
  CLAIMS: '시설 연동(클레임)',
  FACILITIES: '전체 시설',
};

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
  const [memberSearch, setMemberSearch] = useState('');
  const [loadError, setLoadError] = useState('');
  const [sessionNotice, setSessionNotice] = useState('');

  // 전체 시설 DB 조회 (기존 공개 검색 API `/api/facilities` 재사용 — 새 백엔드 불필요, 1,552건 규모라 페이지네이션)
  const [facilities, setFacilities] = useState<any[]>([]);
  const [facilitySearch, setFacilitySearch] = useState('');
  const [facilityPage, setFacilityPage] = useState(1);
  const [facilityTotalPages, setFacilityTotalPages] = useState(1);
  const [facilityCount, setFacilityCount] = useState(0);
  const [facilityLoading, setFacilityLoading] = useState(false);

  // 사업자 담당자명/연락처, 전문가 연락처/소개 인라인 수정 상태 (검증된 신원 필드는 대상 아님)
  const [editingPartnerId, setEditingPartnerId] = useState<string | null>(null);
  const [partnerEditForm, setPartnerEditForm] = useState({ contactName: '', contactPhone: '' });
  const [editingExpertId, setEditingExpertId] = useState<string | null>(null);
  const [expertEditForm, setExpertEditForm] = useState({ contactPhone: '', bio: '' });

  const authHeaders = { Authorization: `Bearer ${token}` };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setLoginError('');
    setSessionNotice('');
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

  const handleLogout = (notice?: string) => {
    localStorage.removeItem('eobom_admin_token');
    localStorage.removeItem('eobom_admin_refresh_token');
    localStorage.removeItem('eobom_admin_name');
    setToken(null);
    setAdminName(null);
    setSessionNotice(notice || '');
  };

  // 인증 헤더 fetch 공통 래퍼 — 액세스 토큰(2h) 만료로 401이 오면 로그인 화면으로 되돌리고
  // 세션 만료 안내를 띄운다. 이게 없으면 토큰이 죽어도 화면은 "로그인된 것처럼" 보이면서
  // 데이터만 조용히 비어버린다(실제로 있었던 버그).
  const authFetch = async (url: string, options: RequestInit = {}) => {
    const res = await fetch(url, { ...options, headers: { ...(options.headers || {}), ...authHeaders } });
    if (res.status === 401) {
      handleLogout('세션이 만료되어 로그아웃되었습니다. 다시 로그인해주세요.');
      return null;
    }
    return res;
  };

  const loadQueue = async () => {
    if (!token) return;
    setLoadError('');
    try {
      if (tab === 'PARTNERS') {
        const res = await authFetch(`${BACKEND_URL}/api/admin/partners?status=${statusFilter}`);
        if (!res) return;
        const data = await res.json();
        if (data.status === 'success') setPartners(data.data);
        else setLoadError(data.message || '조회 실패');
      } else if (tab === 'EXPERTS') {
        const res = await authFetch(`${BACKEND_URL}/api/admin/experts?status=${statusFilter}`);
        if (!res) return;
        const data = await res.json();
        if (data.status === 'success') setExperts(data.data);
        else setLoadError(data.message || '조회 실패');
      } else {
        const res = await authFetch(`${BACKEND_URL}/api/admin/claims?status=${statusFilter}`);
        if (!res) return;
        const data = await res.json();
        if (data.status === 'success') setClaims(data.data);
        else setLoadError(data.message || '조회 실패');
      }
    } catch {
      setLoadError('서버와 통신 중 오류가 발생했습니다.');
    }
  };

  // 전체 시설 DB 조회/검색 — 공개 API라 인증 헤더 불필요, 관리자 로그인 뒤 화면에서만 노출
  const loadFacilities = async (page = 1) => {
    setFacilityLoading(true);
    setLoadError('');
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: '20' });
      if (facilitySearch.trim()) params.set('q', facilitySearch.trim());
      const res = await fetch(`${BACKEND_URL}/api/facilities?${params.toString()}`);
      const data = await res.json();
      if (data.status === 'success') {
        setFacilities(data.data);
        setFacilityPage(data.page);
        setFacilityTotalPages(data.totalPages);
        setFacilityCount(data.count);
      } else {
        setLoadError(data.message || '조회 실패');
      }
    } catch {
      setLoadError('서버와 통신 중 오류가 발생했습니다.');
    } finally {
      setFacilityLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'FACILITIES') {
      loadFacilities(1);
    } else {
      loadQueue();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, tab, statusFilter]);

  // 사업자/전문가 "전체 회원" 검색 — 목록 규모가 작아(수십~수백 건) 클라이언트에서 필터
  const normalizedSearch = memberSearch.trim().toLowerCase();
  const filteredPartners = normalizedSearch
    ? partners.filter((p) => [p.companyName, p.ownerName, p.contactName, p.email].some((v) => (v || '').toLowerCase().includes(normalizedSearch)))
    : partners;
  const filteredExperts = normalizedSearch
    ? experts.filter((ex) => [ex.name, ex.email, ex.licenseNo].some((v) => (v || '').toLowerCase().includes(normalizedSearch)))
    : experts;

  const decidePartner = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    const rejectReason = status === 'REJECTED' ? window.prompt('반려 사유를 입력해주세요') || '' : undefined;
    const res = await authFetch(`${BACKEND_URL}/api/admin/partners/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, rejectReason }),
    });
    if (!res) return;
    loadQueue();
  };

  const decideExpert = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    const rejectReason = status === 'REJECTED' ? window.prompt('반려 사유를 입력해주세요') || '' : undefined;
    const res = await authFetch(`${BACKEND_URL}/api/admin/experts/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, rejectReason }),
    });
    if (!res) return;
    loadQueue();
  };

  const startEditPartner = (p: any) => {
    setEditingPartnerId(p.id);
    setPartnerEditForm({ contactName: p.contactName || '', contactPhone: p.contactPhone || '' });
  };

  const saveEditPartner = async (id: string) => {
    const res = await authFetch(`${BACKEND_URL}/api/admin/partners/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(partnerEditForm),
    });
    if (!res) return;
    const data = await res.json();
    if (!res.ok) {
      alert(data.message || '정보 수정에 실패했습니다.');
      return;
    }
    setEditingPartnerId(null);
    loadQueue();
  };

  const startEditExpert = (ex: any) => {
    setEditingExpertId(ex.id);
    setExpertEditForm({ contactPhone: ex.contactPhone || '', bio: ex.bio || '' });
  };

  const saveEditExpert = async (id: string) => {
    const res = await authFetch(`${BACKEND_URL}/api/admin/experts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expertEditForm),
    });
    if (!res) return;
    const data = await res.json();
    if (!res.ok) {
      alert(data.message || '정보 수정에 실패했습니다.');
      return;
    }
    setEditingExpertId(null);
    loadQueue();
  };

  // 전문가 공개 노출 토글 (docs 02-03 §5.4) — 승인(status)과 별개 축. 승인된 전문가만 켤 수 있다.
  const toggleExpertPublish = async (id: string, isPublished: boolean) => {
    const res = await authFetch(`${BACKEND_URL}/api/admin/experts/${id}/publish`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublished }),
    });
    if (!res) return;
    const data = await res.json();
    if (!res.ok) alert(data.message || '공개 설정 변경에 실패했습니다.');
    loadQueue();
  };

  const decideClaim = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    const reviewNote = window.prompt(status === 'APPROVED' ? '승인 메모(선택)' : '반려 사유를 입력해주세요') || '';
    const res = await authFetch(`${BACKEND_URL}/api/admin/claims/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, reviewNote }),
    });
    if (!res) return;
    const data = await res.json();
    if (!res.ok) alert(data.message || '처리 실패');
    loadQueue();
  };

  if (!token) {
    return (
      <div className="container" style={{ maxWidth: '420px', padding: '2.75rem 1rem' }}>
        <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: '20px', padding: '1.75rem', boxShadow: 'var(--box-shadow)' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.1rem' }}>
            <ShieldCheck size={32} color="var(--point-color)" />
            <h2 style={{ color: 'var(--primary-color)', margin: '0.6rem 0 0 0' }}>운영자 로그인</h2>
          </div>
          {sessionNotice && (
            <div style={{ backgroundColor: '#FEF3C7', color: '#92400E', padding: '0.7rem 0.9rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem' }}>
              {sessionNotice}
            </div>
          )}
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
    <div className="container" style={{ padding: '1.75rem 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.1rem' }}>
        <h1 style={{ color: 'var(--primary-color)', fontSize: '1.6rem', fontWeight: 800 }}>운영자 승인 대시보드</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{adminName}님</span>
          <button onClick={() => handleLogout()} className="btn" style={{ backgroundColor: '#E2E8F0', fontSize: '0.85rem' }}>
            로그아웃
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {(['PARTNERS', 'EXPERTS', 'CLAIMS', 'FACILITIES'] as QueueTab[]).map((t) => (
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
            {TAB_LABELS[t]}
          </button>
        ))}

        {tab === 'FACILITIES' ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              loadFacilities(1);
            }}
            style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}
          >
            <input value={facilitySearch} onChange={(e) => setFacilitySearch(e.target.value)} placeholder="시설명 검색" className="form-select" style={{ width: '200px' }} />
            <button type="submit" className="btn btn-primary">검색</button>
          </form>
        ) : (
          <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
            <input value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} placeholder="이름·상호·이메일 검색" className="form-select" style={{ width: '200px' }} />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="form-select" style={{ width: '140px' }}>
              <option value="">전체</option>
              <option value="PENDING">심사 대기</option>
              <option value="APPROVED">승인됨</option>
              <option value="REJECTED">반려됨</option>
              {tab !== 'CLAIMS' && <option value="SUSPENDED">정지됨</option>}
            </select>
          </div>
        )}
      </div>

      {loadError && <div style={{ color: '#991B1B', marginBottom: '1rem' }}>{loadError}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
        {tab === 'PARTNERS' &&
          (filteredPartners.length === 0 ? (
            <EmptyState />
          ) : (
            filteredPartners.map((p) => (
              <div key={p.id} className="card" style={{ padding: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.8rem' }}>
                {editingPartnerId === p.id ? (
                  <div style={{ flex: 1, minWidth: '260px', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div>
                      <strong style={{ color: 'var(--primary-color)' }}>{p.companyName}</strong>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '0.6rem' }}>
                        대표 {p.ownerName} · 사업자번호 {p.bizRegNo} · {p.email}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                      <input
                        value={partnerEditForm.contactName}
                        onChange={(e) => setPartnerEditForm((f) => ({ ...f, contactName: e.target.value }))}
                        placeholder="담당자명"
                        className="form-select"
                        style={{ flex: 1, minWidth: '140px' }}
                      />
                      <input
                        value={partnerEditForm.contactPhone}
                        onChange={(e) => setPartnerEditForm((f) => ({ ...f, contactPhone: e.target.value }))}
                        placeholder="연락처"
                        className="form-select"
                        style={{ flex: 1, minWidth: '140px' }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => saveEditPartner(p.id)} className="btn" style={{ backgroundColor: '#DEF7EC', color: '#03543F', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem' }}>
                        <Save size={14} /> 저장
                      </button>
                      <button onClick={() => setEditingPartnerId(null)} className="btn" style={{ backgroundColor: '#F1F5F9', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem' }}>
                        <X size={14} /> 취소
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <strong style={{ color: 'var(--primary-color)' }}>{p.companyName}</strong>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginLeft: '0.6rem' }}>
                      대표 {p.ownerName} · 사업자번호 {p.bizRegNo} · 담당 {p.contactName}({formatPhoneForDisplay(p.contactPhone)}) · {p.email}
                    </span>
                    {p.rejectReason && <div style={{ color: '#991B1B', fontSize: '0.8rem' }}>반려 사유: {p.rejectReason}</div>}
                  </div>
                )}
                {editingPartnerId !== p.id && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => startEditPartner(p)} className="btn" style={{ backgroundColor: '#F1F5F9', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Pencil size={14} /> 정보 수정
                    </button>
                    {p.status === 'PENDING' && (
                      <>
                        <ApproveButton onClick={() => decidePartner(p.id, 'APPROVED')} />
                        <RejectButton onClick={() => decidePartner(p.id, 'REJECTED')} />
                      </>
                    )}
                  </div>
                )}
              </div>
            ))
          ))}

        {tab === 'EXPERTS' &&
          (filteredExperts.length === 0 ? (
            <EmptyState />
          ) : (
            filteredExperts.map((ex) => (
              <div key={ex.id} className="card" style={{ padding: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.8rem' }}>
                {editingExpertId === ex.id ? (
                  <div style={{ flex: 1, minWidth: '260px', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div>
                      <strong style={{ color: 'var(--primary-color)' }}>{ex.name}</strong>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '0.6rem' }}>
                        자격번호 {ex.licenseNo} {ex.licenseOrg && `(${ex.licenseOrg})`} · {ex.email}
                      </span>
                    </div>
                    <input
                      value={expertEditForm.contactPhone}
                      onChange={(e) => setExpertEditForm((f) => ({ ...f, contactPhone: e.target.value }))}
                      placeholder="연락처"
                      className="form-select"
                    />
                    <textarea
                      value={expertEditForm.bio}
                      onChange={(e) => setExpertEditForm((f) => ({ ...f, bio: e.target.value }))}
                      placeholder="소개"
                      style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.9rem', height: '70px' }}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => saveEditExpert(ex.id)} className="btn" style={{ backgroundColor: '#DEF7EC', color: '#03543F', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem' }}>
                        <Save size={14} /> 저장
                      </button>
                      <button onClick={() => setEditingExpertId(null)} className="btn" style={{ backgroundColor: '#F1F5F9', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem' }}>
                        <X size={14} /> 취소
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <strong style={{ color: 'var(--primary-color)' }}>{ex.name}</strong>
                    <span style={{ fontSize: '0.75rem', backgroundColor: 'var(--secondary-color)', padding: '0.15rem 0.5rem', borderRadius: '6px', marginLeft: '0.5rem' }}>
                      {EXPERT_CATEGORY_LABELS[ex.category] || ex.category}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginLeft: '0.6rem' }}>
                      자격번호 {ex.licenseNo} {ex.licenseOrg && `(${ex.licenseOrg})`} · {formatPhoneForDisplay(ex.contactPhone)} · {ex.email}
                    </span>
                    {ex.bio && <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.2rem' }}>{ex.bio}</div>}
                    {ex.rejectReason && <div style={{ color: '#991B1B', fontSize: '0.8rem' }}>반려 사유: {ex.rejectReason}</div>}
                  </div>
                )}
                {editingExpertId !== ex.id && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button onClick={() => startEditExpert(ex)} className="btn" style={{ backgroundColor: '#F1F5F9', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Pencil size={14} /> 정보 수정
                    </button>
                    {ex.status === 'PENDING' && (
                      <>
                        <ApproveButton onClick={() => decideExpert(ex.id, 'APPROVED')} />
                        <RejectButton onClick={() => decideExpert(ex.id, 'REJECTED')} />
                      </>
                    )}
                    {ex.status === 'APPROVED' && (
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                        <input type="checkbox" checked={!!ex.isPublished} onChange={(e) => toggleExpertPublish(ex.id, e.target.checked)} />
                        소비자 화면 공개
                      </label>
                    )}
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

        {tab === 'FACILITIES' &&
          (facilityLoading ? (
            <div style={{ textAlign: 'center', padding: '2.2rem', color: 'var(--text-muted)' }}>불러오는 중...</div>
          ) : facilities.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {facilities.map((f) => (
                <div key={f.id} className="card" style={{ padding: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.8rem' }}>
                  <div>
                    <strong style={{ color: 'var(--primary-color)' }}>{f.name}</strong>
                    <span style={{ fontSize: '0.75rem', backgroundColor: 'var(--secondary-color)', padding: '0.15rem 0.5rem', borderRadius: '6px', marginLeft: '0.5rem' }}>
                      {f.type}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginLeft: '0.6rem' }}>{f.location}</span>
                  </div>
                  <span
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      padding: '0.2rem 0.6rem',
                      borderRadius: '10px',
                      backgroundColor: f.isPartner ? '#DEF7EC' : '#F1F5F9',
                      color: f.isPartner ? '#03543F' : '#6B7280',
                    }}
                  >
                    {f.isPartner ? '사업자 연동됨' : '미연동'}
                  </span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.8rem', marginTop: '0.5rem' }}>
                <button disabled={facilityPage <= 1} onClick={() => loadFacilities(facilityPage - 1)} className="btn" style={{ backgroundColor: '#F1F5F9', opacity: facilityPage <= 1 ? 0.5 : 1 }}>
                  이전
                </button>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {facilityPage} / {facilityTotalPages} 페이지 (총 {facilityCount}건)
                </span>
                <button disabled={facilityPage >= facilityTotalPages} onClick={() => loadFacilities(facilityPage + 1)} className="btn" style={{ backgroundColor: '#F1F5F9', opacity: facilityPage >= facilityTotalPages ? 0.5 : 1 }}>
                  다음
                </button>
              </div>
            </>
          ))}
      </div>
    </div>
  );
};

const EmptyState: React.FC = () => (
  <div style={{ textAlign: 'center', padding: '2.2rem', color: 'var(--text-muted)' }}>해당 조건의 항목이 없습니다.</div>
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
