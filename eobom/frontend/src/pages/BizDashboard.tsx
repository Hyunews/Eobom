import React, { useEffect, useState } from 'react';
import { ShieldCheck, Search, Link2, Upload, X, Image as ImageIcon, Inbox, CheckCircle2, XCircle, Star } from 'lucide-react';
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

// 업체 문의 리드 상태 라벨·색상 (docs 01-05 §4.3 상태머신)
const LEAD_STATUS_LABELS: Record<string, string> = {
  REQUESTED: '접수',
  NOTIFIED: '전달됨',
  RESPONDED: '응답완료',
  CONVERTED: '성사',
  LOST: '무산',
  INVALID: '무효 처리',
};
const LEAD_STATUS_COLOR: Record<string, string> = {
  REQUESTED: '#92400E',
  NOTIFIED: '#1D4ED8',
  RESPONDED: '#5B7065',
  CONVERTED: '#03543F',
  LOST: '#6B7280',
  INVALID: '#991B1B',
};
const LEAD_TYPE_LABELS: Record<string, string> = { QUOTE: '업체 문의', CONSULT: '상담신청', CALL: '전화클릭' };

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

  // 받은 업체 문의(리드) — docs 01-05 §11 4단계
  const [leads, setLeads] = useState<any[]>([]);
  const [leadStatusFilter, setLeadStatusFilter] = useState('');
  const [leadPage, setLeadPage] = useState(1);
  const [leadTotalPages, setLeadTotalPages] = useState(1);
  const [leadCount, setLeadCount] = useState(0);
  const [updatingLeadNo, setUpdatingLeadNo] = useState<string | null>(null);

  // 전문가 전용 상태
  const [expertProfile, setExpertProfile] = useState<any | null>(null);
  const [consultRequests, setConsultRequests] = useState<any[]>([]);
  const [updatingConsultId, setUpdatingConsultId] = useState<string | null>(null);

  // 이미지 업로드 진행 상태 (시설 id -> 업로드 중 여부)
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  // 선택했지만 아직 "저장"을 안 누른 이미지 — 선택 즉시 업로드하지 않고 미리보기만 보여준다
  const [pendingImages, setPendingImages] = useState<Record<string, { file: File; previewUrl: string }>>({});
  // 대표 사진 지정 진행 상태 (이미지 경로 -> 지정 중 여부)
  const [settingCoverPath, setSettingCoverPath] = useState<string | null>(null);

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

  // 받은 업체 문의(리드) 목록 — 조회하는 순간 서버에서 REQUESTED→NOTIFIED로 자동 전이된다(§4.3)
  const loadLeads = async (page: number = leadPage, status: string = leadStatusFilter) => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    params.set('page', String(page));
    params.set('pageSize', '20');
    const res = await authFetch(`${BACKEND_URL}/api/partner/leads?${params.toString()}`);
    if (!res) return;
    const data = await res.json();
    if (data.status === 'success') {
      setLeads(data.data);
      setLeadTotalPages(data.totalPages);
      setLeadCount(data.count);
      setLeadPage(data.page);
    }
  };

  const changeLeadStatusFilter = (status: string) => {
    setLeadStatusFilter(status);
    loadLeads(1, status);
  };

  const goToLeadPage = (page: number) => {
    loadLeads(page, leadStatusFilter);
  };

  useEffect(() => {
    if (type === 'FACILITY') {
      loadFacilityData();
      loadLeads(1, '');
    } else {
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

  // 리드 응답/성사/무산 신고 (§4.3) — CONVERTED/LOST는 RESPONDED 이후에만 허용(서버가 재확인).
  const updateLeadStatus = async (leadNo: string, status: string) => {
    let note: string | undefined;
    if (status === 'LOST') {
      note = window.prompt('무산 처리 사유를 남겨주세요 (선택)') || undefined;
    }
    setUpdatingLeadNo(leadNo);
    try {
      const res = await authFetch(`${BACKEND_URL}/api/partner/leads/${leadNo}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, note }),
      });
      if (!res) return;
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || '상태 변경에 실패했습니다.');
        return;
      }
      loadLeads();
    } catch {
      alert('서버와 통신 중 오류가 발생했습니다.');
    } finally {
      setUpdatingLeadNo(null);
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
      alert(data.message || '연동 신청에 실패했습니다.');
      return;
    }
    alert('연동 신청이 접수되었습니다. 운영자 심사 후 연동됩니다.');
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

  // 파일 선택 시 즉시 업로드하지 않고 미리보기만 준비 — "저장" 클릭 시에만 실제 업로드된다
  const selectPendingImage = (facilityId: string, file: File) => {
    const previewUrl = URL.createObjectURL(file);
    setPendingImages((prev) => {
      const existing = prev[facilityId];
      if (existing) URL.revokeObjectURL(existing.previewUrl);
      return { ...prev, [facilityId]: { file, previewUrl } };
    });
  };

  const cancelPendingImage = (facilityId: string) => {
    setPendingImages((prev) => {
      const existing = prev[facilityId];
      if (existing) URL.revokeObjectURL(existing.previewUrl);
      const next = { ...prev };
      delete next[facilityId];
      return next;
    });
  };

  const savePendingImage = async (facilityId: string) => {
    const pending = pendingImages[facilityId];
    if (!pending) return;
    await handleImageUpload(facilityId, pending.file);
    setPendingImages((prev) => {
      const existing = prev[facilityId];
      if (existing) URL.revokeObjectURL(existing.previewUrl);
      const next = { ...prev };
      delete next[facilityId];
      return next;
    });
  };

  // 대표 사진 지정 — 소비자 화면(FacilityPage.tsx)은 항상 images[0]을 카드 썸네일로 쓰므로,
  // 선택한 사진을 배열 맨 앞으로 옮기는 것만으로 대표 지정이 된다(백엔드도 같은 방식).
  const setCoverImage = async (facilityId: string, imagePath: string) => {
    setSettingCoverPath(imagePath);
    try {
      const res = await authFetch(`${BACKEND_URL}/api/partner/facilities/${facilityId}/images/cover`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imagePath }),
      });
      if (!res) return;
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || '대표 사진 지정에 실패했습니다.');
        return;
      }
      loadFacilityData();
    } catch {
      alert('서버와 통신 중 오류가 발생했습니다.');
    } finally {
      setSettingCoverPath(null);
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
          {/* 받은 업체 문의(리드) — docs 01-05 §11 4단계. 지금까지 적재만 되고 볼 방법이 없던 화면 */}
          <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: '16px', padding: '1.1rem', boxShadow: 'var(--box-shadow)', marginBottom: '1.2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '0.8rem' }}>
              <h3 style={{ color: 'var(--primary-color)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Inbox size={18} /> 받은 업체 문의 <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.85rem' }}>(총 {leadCount}건)</span>
              </h3>
              <select
                value={leadStatusFilter}
                onChange={(e) => changeLeadStatusFilter(e.target.value)}
                className="form-select"
                style={{ width: 'auto', height: '38px', fontSize: '0.85rem' }}
              >
                <option value="">전체 상태</option>
                {Object.entries(LEAD_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            {leads.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>아직 받은 업체 문의가 없습니다.</p>
            ) : (
              leads.map((lead) => (
                <div key={lead.leadNo} style={{ padding: '0.8rem 0', borderTop: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.3rem' }}>
                    <strong style={{ fontSize: '0.9rem' }}>{lead.leadNo}</strong>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: LEAD_STATUS_COLOR[lead.status] || '#444' }}>
                      {LEAD_STATUS_LABELS[lead.status] || lead.status}
                    </span>
                  </div>
                  <p style={{ margin: '0.15rem 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {LEAD_TYPE_LABELS[lead.type] || lead.type} · {lead.facility?.name}
                  </p>
                  <p style={{ margin: '0.15rem 0', fontSize: '0.85rem' }}>
                    {lead.applicantName} · {lead.applicantPhone ? formatPhoneForDisplay(lead.applicantPhone) : ''}
                  </p>
                  {lead.payload?.message && (
                    <p style={{ margin: '0.15rem 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{lead.payload.message}</p>
                  )}
                  {(lead.status === 'REQUESTED' || lead.status === 'NOTIFIED') && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <button
                        disabled={updatingLeadNo === lead.leadNo}
                        onClick={() => updateLeadStatus(lead.leadNo, 'RESPONDED')}
                        className="btn"
                        style={{ backgroundColor: 'var(--secondary-color)', color: 'var(--primary-color)', fontSize: '0.8rem', padding: '0.35rem 0.7rem' }}
                      >
                        응답 완료로 표시
                      </button>
                    </div>
                  )}
                  {lead.status === 'RESPONDED' && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <button
                        disabled={updatingLeadNo === lead.leadNo}
                        onClick={() => updateLeadStatus(lead.leadNo, 'CONVERTED')}
                        className="btn"
                        style={{ backgroundColor: '#DEF7EC', color: '#03543F', fontSize: '0.8rem', padding: '0.35rem 0.7rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        <CheckCircle2 size={14} /> 성사 처리
                      </button>
                      <button
                        disabled={updatingLeadNo === lead.leadNo}
                        onClick={() => updateLeadStatus(lead.leadNo, 'LOST')}
                        className="btn"
                        style={{ backgroundColor: '#F1F5F9', color: '#6B7280', fontSize: '0.8rem', padding: '0.35rem 0.7rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        <XCircle size={14} /> 무산 처리
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}

            {leadTotalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.8rem', marginTop: '0.8rem' }}>
                <button disabled={leadPage <= 1} onClick={() => goToLeadPage(leadPage - 1)} className="btn" style={{ backgroundColor: '#F1F5F9', fontSize: '0.8rem', padding: '0.35rem 0.7rem', opacity: leadPage <= 1 ? 0.5 : 1 }}>
                  이전
                </button>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{leadPage} / {leadTotalPages} 페이지</span>
                <button disabled={leadPage >= leadTotalPages} onClick={() => goToLeadPage(leadPage + 1)} className="btn" style={{ backgroundColor: '#F1F5F9', fontSize: '0.8rem', padding: '0.35rem 0.7rem', opacity: leadPage >= leadTotalPages ? 0.5 : 1 }}>
                  다음
                </button>
              </div>
            )}
          </div>

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
                  <Link2 size={14} /> 연동 신청
                </button>
              </div>
            ))}
          </div>

          {/* 내 연동 신청 상태 (FacilityClaim) */}
          <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: '16px', padding: '1.1rem', boxShadow: 'var(--box-shadow)', marginBottom: '1.2rem' }}>
            <h3 style={{ color: 'var(--primary-color)', marginBottom: '0.8rem' }}>연동 신청 현황</h3>
            {myClaims.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>신청한 연동이 없습니다.</p>
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
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>아직 연동된 시설이 없습니다. 위에서 검색 후 연동을 신청해주세요.</p>
            ) : (
              myFacilities.map((f) => (
                <div key={f.id} style={{ padding: '0.8rem 0', borderTop: '1px solid var(--border-color)' }}>
                  <div style={{ marginBottom: '0.6rem' }}>
                    <strong>{f.name}</strong>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginLeft: '0.5rem' }}>{f.location}</span>
                  </div>

                  {/* 업로드된 사진 썸네일 — 첫 번째(images[0])가 소비자 화면(FacilityPage.tsx)의 대표 썸네일 */}
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
                    {(f.images || []).map((img: string, idx: number) => {
                      const isCover = idx === 0;
                      return (
                        <div key={img} style={{ position: 'relative', width: '72px', height: '72px' }}>
                          <img
                            src={`${BACKEND_URL}${img}`}
                            alt={f.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px', border: isCover ? '2px solid var(--accent-gold)' : '1px solid var(--border-color)' }}
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
                          <button
                            onClick={() => !isCover && setCoverImage(f.id, img)}
                            disabled={isCover || settingCoverPath === img}
                            title={isCover ? '대표 사진' : '대표 사진으로 지정'}
                            style={{
                              position: 'absolute',
                              bottom: '-6px',
                              left: '-6px',
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              border: 'none',
                              backgroundColor: isCover ? 'var(--accent-gold)' : '#FFFFFF',
                              color: isCover ? '#FFFFFF' : '#9CA3AF',
                              boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
                              cursor: isCover ? 'default' : 'pointer',
                              opacity: settingCoverPath === img ? 0.5 : 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Star size={11} fill={isCover ? '#FFFFFF' : 'none'} />
                          </button>
                        </div>
                      );
                    })}
                    {(!f.images || f.images.length === 0) && !pendingImages[f.id] && (
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
                    {pendingImages[f.id] && (
                      <div style={{ position: 'relative', width: '72px', height: '72px' }}>
                        <img
                          src={pendingImages[f.id].previewUrl}
                          alt="선택한 사진 미리보기"
                          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px', border: '2px dashed var(--point-color)', opacity: uploadingId === f.id ? 0.5 : 1 }}
                        />
                        <span
                          style={{
                            position: 'absolute',
                            bottom: '-4px',
                            left: 0,
                            right: 0,
                            textAlign: 'center',
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            color: '#fff',
                            backgroundColor: 'var(--point-color)',
                            borderRadius: '0 0 8px 8px',
                            padding: '0.1rem 0',
                          }}
                        >
                          저장 대기
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 사진 선택 후 "저장"을 눌러야 실제로 업로드된다 */}
                  {pendingImages[f.id] ? (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        disabled={uploadingId === f.id}
                        onClick={() => savePendingImage(f.id)}
                        className="btn"
                        style={{ backgroundColor: 'var(--point-color)', color: '#fff', fontSize: '0.82rem', padding: '0.45rem 0.8rem' }}
                      >
                        {uploadingId === f.id ? '저장 중...' : '저장'}
                      </button>
                      <button
                        disabled={uploadingId === f.id}
                        onClick={() => cancelPendingImage(f.id)}
                        className="btn"
                        style={{ backgroundColor: '#F1F5F9', color: '#6B7280', fontSize: '0.82rem', padding: '0.45rem 0.8rem' }}
                      >
                        취소
                      </button>
                    </div>
                  ) : (
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
                      cursor: 'pointer',
                    }}
                  >
                    <Upload size={14} />
                    사진 추가 (최대 5MB)
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) selectPendingImage(f.id, file);
                        e.target.value = '';
                      }}
                      style={{ display: 'none' }}
                    />
                  </label>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};
