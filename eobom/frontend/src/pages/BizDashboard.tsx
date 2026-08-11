import React, { useEffect, useState } from 'react';
import { ShieldCheck, Search, Link2, Upload, X, Image as ImageIcon } from 'lucide-react';
import { BACKEND_URL, formatPhoneForDisplay } from '../config';

// 로그인 후 화면 — 장사시설은 "내 시설" + 검색/클레임 신청, 전문가는 내 프로필/승인 상태만 보여준다.
// 전문가는 Facility 같은 사전 마스터 데이터가 없어 "클레임"이라는 별도 연동 절차가 없다 —
// 가입 승인 자체가 곧 프로필 공개다(docs 02-02 §4).

type AccountType = 'FACILITY' | 'EXPERT';

interface BizDashboardProps {
  type: AccountType;
  name: string;
  onLogout: (notice?: string) => void;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: '심사 대기',
  APPROVED: '승인됨',
  REJECTED: '반려됨',
};

const CONSULT_STATUS_LABELS: Record<string, string> = {
  REQUESTED: '신청 접수',
  ACCEPTED: '수락함',
  COMPLETED: '상담 완료',
  CANCELLED: '취소됨',
  INVALID: '무효 처리',
};
const CONSULT_STATUS_COLOR: Record<string, string> = {
  REQUESTED: '#92400E',
  ACCEPTED: '#1D4ED8',
  COMPLETED: '#03543F',
  CANCELLED: '#6B7280',
  INVALID: '#991B1B',
};

export const BizDashboard: React.FC<BizDashboardProps> = ({ type, name, onLogout }) => {
  const token = localStorage.getItem('eobom_biz_token');
  const authHeaders = { Authorization: `Bearer ${token}` };

  // 인증 헤더 fetch 공통 래퍼 — 액세스 토큰(2h) 만료로 401이 오면 상위(PartnerPortalPage)의
  // 로그인 화면으로 되돌리고 세션 만료 안내를 띄운다. AdminPage.tsx의 authFetch와 동일 원칙.
  const authFetch = async (url: string, options: RequestInit = {}) => {
    const res = await fetch(url, { ...options, headers: { ...(options.headers || {}), ...authHeaders } });
    if (res.status === 401) {
      onLogout('세션이 만료되어 로그아웃되었습니다. 다시 로그인해주세요.');
      return null;
    }
    return res;
  };

  // 장사시설 전용 상태
  const [myFacilities, setMyFacilities] = useState<any[]>([]);
  const [myClaims, setMyClaims] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // 전문가 전용 상태
  const [expertProfile, setExpertProfile] = useState<any | null>(null);
  const [consultRequests, setConsultRequests] = useState<any[]>([]);
  const [updatingConsultId, setUpdatingConsultId] = useState<string | null>(null);

  // 이미지 업로드 진행 상태 (시설 id -> 업로드 중 여부)
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const loadFacilityData = async () => {
    const [facRes, claimRes] = await Promise.all([
      authFetch(`${BACKEND_URL}/api/partner/facilities`),
      authFetch(`${BACKEND_URL}/api/partner/claims`),
    ]);
    if (!facRes || !claimRes) return;
    const facData = await facRes.json();
    const claimData = await claimRes.json();
    if (facData.status === 'success') setMyFacilities(facData.data);
    if (claimData.status === 'success') setMyClaims(claimData.data);
  };

  const loadExpertProfile = async () => {
    const res = await authFetch(`${BACKEND_URL}/api/expert/me`);
    if (!res) return;
    const data = await res.json();
    if (data.status === 'success') setExpertProfile(data.data);
  };

  // 받은 상담 신청 목록 (docs 02-03 §7.3)
  const loadConsultRequests = async () => {
    const res = await authFetch(`${BACKEND_URL}/api/expert/consult-requests`);
    if (!res) return;
    const data = await res.json();
    if (data.status === 'success') setConsultRequests(data.data);
  };

  useEffect(() => {
    if (type === 'FACILITY') loadFacilityData();
    else {
      loadExpertProfile();
      loadConsultRequests();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const updateConsultStatus = async (requestId: string, status: string) => {
    setUpdatingConsultId(requestId);
    try {
      const res = await authFetch(`${BACKEND_URL}/api/expert/consult-requests/${requestId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res) return;
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || '상태 변경에 실패했습니다.');
        return;
      }
      loadConsultRequests();
    } catch {
      alert('서버와 통신 중 오류가 발생했습니다.');
    } finally {
      setUpdatingConsultId(null);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/facilities?q=${encodeURIComponent(searchQuery)}&pageSize=10`);
      const data = await res.json();
      if (data.status === 'success') setSearchResults(data.data);
    } finally {
      setIsSearching(false);
    }
  };

  const submitClaim = async (facilityId: string) => {
    const res = await authFetch(`${BACKEND_URL}/api/partner/claims`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ facilityId }),
    });
    if (!res) return;
    const data = await res.json();
    if (!res.ok) {
      alert(data.message || '클레임 신청에 실패했습니다.');
      return;
    }
    alert('클레임 신청이 접수되었습니다. 운영자 심사 후 연동됩니다.');
    loadFacilityData();
  };

  const handleImageUpload = async (facilityId: string, file: File) => {
    setUploadingId(facilityId);
    try {
      const formData = new FormData();
      formData.append('image', file);
      // FormData 사용 시 Content-Type을 직접 지정하지 않는다 — 브라우저가 boundary를 포함해 자동 설정
      const res = await authFetch(`${BACKEND_URL}/api/partner/facilities/${facilityId}/images`, {
        method: 'POST',
        body: formData,
      });
      if (!res) return;
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || '이미지 업로드에 실패했습니다.');
        return;
      }
      loadFacilityData();
    } catch {
      alert('서버와 통신 중 오류가 발생했습니다.');
    } finally {
      setUploadingId(null);
    }
  };

  const handleImageDelete = async (facilityId: string, imagePath: string) => {
    const res = await authFetch(`${BACKEND_URL}/api/partner/facilities/${facilityId}/images`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imagePath }),
    });
    if (!res) return;
    const data = await res.json();
    if (!res.ok) {
      alert(data.message || '이미지 삭제에 실패했습니다.');
      return;
    }
    loadFacilityData();
  };

  return (
    <div className="container" style={{ maxWidth: '720px', padding: '2.2rem 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <ShieldCheck size={24} color="var(--point-color)" />
          <h2 style={{ color: 'var(--primary-color)', margin: 0 }}>{name}</h2>
        </div>
        <button onClick={() => onLogout()} className="btn" style={{ backgroundColor: '#E2E8F0' }}>
          로그아웃
        </button>
      </div>

      {type === 'EXPERT' ? (
        <>
          {expertProfile && (
            <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: '16px', padding: '1.1rem', boxShadow: 'var(--box-shadow)', marginBottom: '1.2rem' }}>
              <div style={{ marginBottom: '0.6rem' }}>
                <span
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.6rem',
                    borderRadius: '10px',
                    backgroundColor: expertProfile.status === 'APPROVED' ? '#DEF7EC' : '#FEF3C7',
                    color: expertProfile.status === 'APPROVED' ? '#03543F' : '#92400E',
                  }}
                >
                  {STATUS_LABELS[expertProfile.status] || expertProfile.status}
                </span>
              </div>
              <p style={{ margin: '0.2rem 0' }}>자격증 등록번호: {expertProfile.licenseNo}</p>
              <p style={{ margin: '0.2rem 0' }}>연락처: {formatPhoneForDisplay(expertProfile.contactPhone)}</p>
              {expertProfile.officeAddress && <p style={{ margin: '0.2rem 0' }}>사무실 주소: {expertProfile.officeAddress}</p>}
              {expertProfile.bio && <p style={{ margin: '0.2rem 0', color: 'var(--text-muted)' }}>{expertProfile.bio}</p>}
              {expertProfile.status === 'PENDING' && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.8rem' }}>
                  자격 확인 후 프로필이 공개됩니다. 승인 전까지는 소비자 화면에 노출되지 않습니다.
                </p>
              )}
            </div>
          )}

          {/* 받은 상담 신청 (docs 02-03 §7.3) — 장사시설의 "클레임 신청 현황"과 대칭되는 위치 */}
          <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: '16px', padding: '1.1rem', boxShadow: 'var(--box-shadow)' }}>
            <h3 style={{ color: 'var(--primary-color)', marginBottom: '0.8rem' }}>받은 상담 신청</h3>
            {consultRequests.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>아직 받은 상담 신청이 없습니다.</p>
            ) : (
              consultRequests.map((r) => (
                <div key={r.id} style={{ padding: '0.8rem 0', borderTop: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                    <strong style={{ fontSize: '0.9rem' }}>{r.requestNo}</strong>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: CONSULT_STATUS_COLOR[r.status] || '#444' }}>
                      {CONSULT_STATUS_LABELS[r.status] || r.status}
                    </span>
                  </div>
                  <p style={{ margin: '0.15rem 0', fontSize: '0.85rem' }}>
                    {r.applicantName} · {formatPhoneForDisplay(r.applicantPhone)} · {r.channel}
                  </p>
                  <p style={{ margin: '0.15rem 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{r.content}</p>
                  {r.status === 'REQUESTED' && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <button
                        disabled={updatingConsultId === r.id}
                        onClick={() => updateConsultStatus(r.id, 'ACCEPTED')}
                        className="btn"
                        style={{ backgroundColor: 'var(--secondary-color)', color: 'var(--primary-color)', fontSize: '0.8rem', padding: '0.35rem 0.7rem' }}
                      >
                        수락
                      </button>
                      <button
                        disabled={updatingConsultId === r.id}
                        onClick={() => updateConsultStatus(r.id, 'CANCELLED')}
                        className="btn"
                        style={{ backgroundColor: '#F1F5F9', color: '#6B7280', fontSize: '0.8rem', padding: '0.35rem 0.7rem' }}
                      >
                        거절
                      </button>
                    </div>
                  )}
                  {r.status === 'ACCEPTED' && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <button
                        disabled={updatingConsultId === r.id}
                        onClick={() => updateConsultStatus(r.id, 'COMPLETED')}
                        className="btn"
                        style={{ backgroundColor: 'var(--secondary-color)', color: 'var(--primary-color)', fontSize: '0.8rem', padding: '0.35rem 0.7rem' }}
                      >
                        상담 완료 처리
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <>
          {/* 시설 검색 + 클레임 신청 */}
          <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: '16px', padding: '1.1rem', boxShadow: 'var(--box-shadow)', marginBottom: '1.2rem' }}>
            <h3 style={{ color: 'var(--primary-color)', marginBottom: '0.8rem' }}>내 시설 찾아 연동하기</h3>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.6rem', marginBottom: '1rem' }}>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="시설명으로 검색 (예: OO장례식장)"
                className="form-select"
                style={{ flex: 1 }}
              />
              <button type="submit" disabled={isSearching} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Search size={16} /> 검색
              </button>
            </form>
            {searchResults.map((f) => (
              <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderTop: '1px solid var(--border-color)' }}>
                <div>
                  <strong>{f.name}</strong>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginLeft: '0.5rem' }}>{f.location}</span>
                  {f.isPartner && <span style={{ fontSize: '0.75rem', color: '#92400E', marginLeft: '0.5rem' }}>(이미 연동된 시설)</span>}
                </div>
                <button onClick={() => submitClaim(f.id)} className="btn" style={{ backgroundColor: 'var(--secondary-color)', color: 'var(--primary-color)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Link2 size={14} /> 클레임 신청
                </button>
              </div>
            ))}
          </div>

          {/* 내 클레임 상태 */}
          <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: '16px', padding: '1.1rem', boxShadow: 'var(--box-shadow)', marginBottom: '1.2rem' }}>
            <h3 style={{ color: 'var(--primary-color)', marginBottom: '0.8rem' }}>클레임 신청 현황</h3>
            {myClaims.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>신청한 클레임이 없습니다.</p>
            ) : (
              myClaims.map((c) => (
                <div key={c.id} style={{ padding: '0.5rem 0', borderTop: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
                  <strong>{c.facility?.name}</strong>
                  <span style={{ marginLeft: '0.5rem', color: c.status === 'APPROVED' ? '#03543F' : c.status === 'REJECTED' ? '#991B1B' : '#92400E' }}>
                    {STATUS_LABELS[c.status] || c.status}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* 연동 완료된 내 시설 — 시설 사진 업로드 (소비자 화면 이미지 박스에 그대로 노출됨) */}
          <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: '16px', padding: '1.1rem', boxShadow: 'var(--box-shadow)' }}>
            <h3 style={{ color: 'var(--primary-color)', marginBottom: '0.8rem' }}>연동된 내 시설</h3>
            {myFacilities.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>아직 연동된 시설이 없습니다. 위에서 검색 후 클레임을 신청해주세요.</p>
            ) : (
              myFacilities.map((f) => (
                <div key={f.id} style={{ padding: '0.8rem 0', borderTop: '1px solid var(--border-color)' }}>
                  <div style={{ marginBottom: '0.6rem' }}>
                    <strong>{f.name}</strong>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginLeft: '0.5rem' }}>{f.location}</span>
                  </div>

                  {/* 업로드된 사진 썸네일 */}
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
                    {(f.images || []).map((img: string) => (
                      <div key={img} style={{ position: 'relative', width: '72px', height: '72px' }}>
                        <img
                          src={`${BACKEND_URL}${img}`}
                          alt={f.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                        />
                        <button
                          onClick={() => handleImageDelete(f.id, img)}
                          title="이미지 삭제"
                          style={{
                            position: 'absolute',
                            top: '-6px',
                            right: '-6px',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            border: 'none',
                            backgroundColor: '#991B1B',
                            color: '#FFFFFF',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    {(!f.images || f.images.length === 0) && (
                      <div
                        style={{
                          width: '72px',
                          height: '72px',
                          borderRadius: '8px',
                          border: '1px dashed var(--border-color)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--text-muted)',
                        }}
                      >
                        <ImageIcon size={20} />
                      </div>
                    )}
                  </div>

                  {/* 업로드 */}
                  <label
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      fontSize: '0.82rem',
                      padding: '0.45rem 0.8rem',
                      borderRadius: '8px',
                      backgroundColor: 'var(--secondary-color)',
                      color: 'var(--primary-color)',
                      cursor: uploadingId === f.id ? 'default' : 'pointer',
                      opacity: uploadingId === f.id ? 0.6 : 1,
                    }}
                  >
                    <Upload size={14} />
                    {uploadingId === f.id ? '업로드 중...' : '사진 추가 (최대 5MB)'}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      disabled={uploadingId === f.id}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(f.id, file);
                        e.target.value = '';
                      }}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};
