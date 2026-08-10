import React, { useEffect, useState } from 'react';
import { ShieldCheck, Search, Link2 } from 'lucide-react';
import { BACKEND_URL } from '../config';

// 로그인 후 화면 — 장사시설은 "내 시설" + 검색/클레임 신청, 전문가는 내 프로필/승인 상태만 보여준다.
// 전문가는 Facility 같은 사전 마스터 데이터가 없어 "클레임"이라는 별도 연동 절차가 없다 —
// 가입 승인 자체가 곧 프로필 공개다(docs 17 §4).

type AccountType = 'FACILITY' | 'EXPERT';

interface BizDashboardProps {
  type: AccountType;
  name: string;
  onLogout: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: '심사 대기',
  APPROVED: '승인됨',
  REJECTED: '반려됨',
};

export const BizDashboard: React.FC<BizDashboardProps> = ({ type, name, onLogout }) => {
  const token = localStorage.getItem('eobom_biz_token');
  const authHeaders = { Authorization: `Bearer ${token}` };

  // 장사시설 전용 상태
  const [myFacilities, setMyFacilities] = useState<any[]>([]);
  const [myClaims, setMyClaims] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // 전문가 전용 상태
  const [expertProfile, setExpertProfile] = useState<any | null>(null);

  const loadFacilityData = async () => {
    const [facRes, claimRes] = await Promise.all([
      fetch(`${BACKEND_URL}/api/partner/facilities`, { headers: authHeaders }),
      fetch(`${BACKEND_URL}/api/partner/claims`, { headers: authHeaders }),
    ]);
    const facData = await facRes.json();
    const claimData = await claimRes.json();
    if (facData.status === 'success') setMyFacilities(facData.data);
    if (claimData.status === 'success') setMyClaims(claimData.data);
  };

  const loadExpertProfile = async () => {
    const res = await fetch(`${BACKEND_URL}/api/expert/me`, { headers: authHeaders });
    const data = await res.json();
    if (data.status === 'success') setExpertProfile(data.data);
  };

  useEffect(() => {
    if (type === 'FACILITY') loadFacilityData();
    else loadExpertProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

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
    const res = await fetch(`${BACKEND_URL}/api/partner/claims`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ facilityId }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.message || '클레임 신청에 실패했습니다.');
      return;
    }
    alert('클레임 신청이 접수되었습니다. 운영자 심사 후 연동됩니다.');
    loadFacilityData();
  };

  return (
    <div className="container" style={{ maxWidth: '720px', padding: '3rem 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <ShieldCheck size={24} color="var(--point-color)" />
          <h2 style={{ color: 'var(--primary-color)', margin: 0 }}>{name}</h2>
        </div>
        <button onClick={onLogout} className="btn" style={{ backgroundColor: '#E2E8F0' }}>
          로그아웃
        </button>
      </div>

      {type === 'EXPERT' ? (
        expertProfile && (
          <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: '16px', padding: '1.5rem', boxShadow: 'var(--box-shadow)' }}>
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
            <p style={{ margin: '0.2rem 0' }}>연락처: {expertProfile.contactPhone}</p>
            {expertProfile.bio && <p style={{ margin: '0.2rem 0', color: 'var(--text-muted)' }}>{expertProfile.bio}</p>}
            {expertProfile.status === 'PENDING' && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.8rem' }}>
                자격 확인 후 프로필이 공개됩니다. 승인 전까지는 소비자 화면에 노출되지 않습니다.
              </p>
            )}
          </div>
        )
      ) : (
        <>
          {/* 시설 검색 + 클레임 신청 */}
          <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: '16px', padding: '1.5rem', boxShadow: 'var(--box-shadow)', marginBottom: '1.2rem' }}>
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
          <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: '16px', padding: '1.5rem', boxShadow: 'var(--box-shadow)', marginBottom: '1.2rem' }}>
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

          {/* 연동 완료된 내 시설 */}
          <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: '16px', padding: '1.5rem', boxShadow: 'var(--box-shadow)' }}>
            <h3 style={{ color: 'var(--primary-color)', marginBottom: '0.8rem' }}>연동된 내 시설</h3>
            {myFacilities.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>아직 연동된 시설이 없습니다. 위에서 검색 후 클레임을 신청해주세요.</p>
            ) : (
              myFacilities.map((f) => (
                <div key={f.id} style={{ padding: '0.5rem 0', borderTop: '1px solid var(--border-color)' }}>
                  <strong>{f.name}</strong>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginLeft: '0.5rem' }}>{f.location}</span>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};
