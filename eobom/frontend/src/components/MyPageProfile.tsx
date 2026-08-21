import React, { useEffect, useState } from 'react';
import { X, CheckCircle2, AlertCircle, MapPin, Loader2 } from 'lucide-react';
import { BACKEND_URL } from '../config';
import { AddressSearchModal } from './AddressSearchModal';

// 00-28 §6.3·§8 Phase 1 — 마이페이지 > 내 정보. MyPageAuthSettings.tsx와 같은 모달 패턴.
// 🔴 연락처·상세주소는 GET 응답이 마스킹돼서 온다(§6.1) — 그래서 이 두 필드만 "현재 값 표시 +
// 새로 입력해야 바뀜" 방식이고, 나머지(주소 도로명·우편번호·연락시간대 등)는 평문 그대로 와서
// 바로 편집 가능한 입력칸에 채운다.

const CONTACT_TIME_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: '선택 안 함' },
  { value: 'ANYTIME', label: '언제나 괜찮음' },
  { value: 'MORNING', label: '오전' },
  { value: 'AFTERNOON', label: '오후' },
  { value: 'EVENING', label: '저녁' },
];

interface ProfileData {
  name: string;
  email: string | null;
  contactPhone: string | null; // 마스킹된 값(010-****-5678)
  addressZonecode: string | null;
  addressRoad: string | null;
  addressDetail: string | null; // 마스킹된 값
  contactTimePref: string | null;
  marketingAgreedAt: string | null;
}

interface MyPageProfileProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MyPageProfile: React.FC<MyPageProfileProps> = ({ isOpen, onClose }) => {
  const [current, setCurrent] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showAddressSearch, setShowAddressSearch] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [contactPhone, setContactPhone] = useState(''); // 새 번호 입력칸 — 현재 값을 프리필하지 않는다
  const [clearPhone, setClearPhone] = useState(false);
  const [addressZonecode, setAddressZonecode] = useState('');
  const [addressRoad, setAddressRoad] = useState('');
  const [addressDetail, setAddressDetail] = useState(''); // 새 상세주소 입력칸
  const [clearDetail, setClearDetail] = useState(false);
  const [contactTimePref, setContactTimePref] = useState('');
  const [marketingAgreed, setMarketingAgreed] = useState(false);

  const fetchProfile = async () => {
    const token = sessionStorage.getItem('k_ending_token');
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/me/profile`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.status === 'success') {
        const p: ProfileData = data.data;
        setCurrent(p);
        setName(p.name || '');
        setEmail(p.email || '');
        setContactPhone('');
        setClearPhone(false);
        setAddressZonecode(p.addressZonecode || '');
        setAddressRoad(p.addressRoad || '');
        setAddressDetail('');
        setClearDetail(false);
        setContactTimePref(p.contactTimePref || '');
        setMarketingAgreed(!!p.marketingAgreedAt);
      }
    } catch {
      // 조회 실패는 조용히 무시 — 폼이 빈 채로 남아 다시 열면 재시도된다
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setMessage(null);
      fetchProfile();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = sessionStorage.getItem('k_ending_token');
    if (!token) return;

    setIsSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/me/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name,
          email,
          contactPhone: contactPhone.trim() ? contactPhone.trim() : clearPhone ? '' : undefined,
          addressZonecode,
          addressRoad,
          addressDetail: addressDetail.trim() ? addressDetail.trim() : clearDetail ? '' : undefined,
          contactTimePref,
          marketingAgreed,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.status !== 'success') {
        setMessage({ type: 'error', text: data.message || '저장에 실패했습니다.' });
        return;
      }
      setMessage({ type: 'success', text: '저장되었습니다.' });
      const p: ProfileData = data.data;
      setCurrent(p);
      setContactPhone('');
      setClearPhone(false);
      setAddressDetail('');
      setClearDetail(false);
    } catch {
      setMessage({ type: 'error', text: '서버와 통신 중 오류가 발생했습니다.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 3100,
        padding: '1rem',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          maxWidth: '480px',
          width: '100%',
          padding: '1.9rem 1.5rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          position: 'relative',
          margin: '2rem 0',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: '#F3F4F6',
            border: 'none',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#6B7280',
          }}
        >
          <X size={20} />
        </button>

        <h2 style={{ color: 'var(--primary-color)', fontSize: '1.4rem', fontWeight: 800, margin: '0 0 0.4rem 0' }}>내 정보</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 1.1rem 0' }}>
          연락처·주소는 문의·상담을 넣을 때마다 다시 입력하지 않도록 미리 저장해두는 용도입니다. 전부 선택 입력이며 언제든 지울 수 있습니다.
        </p>

        {message && (
          <div
            style={{
              backgroundColor: message.type === 'success' ? '#ECFDF5' : '#FDE8E8',
              color: message.type === 'success' ? '#065F46' : '#9B1C1C',
              padding: '0.75rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              marginBottom: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {message.text}
          </div>
        )}

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem 0', color: '#9CA3AF' }}>
            <Loader2 size={20} />
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">이름</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="form-input" required />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">이메일</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="form-input" placeholder="선택 입력" />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">연락처</label>
              {current?.contactPhone && !clearPhone && (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 0.35rem 0' }}>
                  현재 등록된 번호: {current.contactPhone}
                </p>
              )}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="form-input"
                  placeholder={current?.contactPhone ? '바꾸시려면 새 번호를 입력하세요' : '010-0000-0000'}
                  style={{ flex: 1 }}
                />
                {current?.contactPhone && (
                  <button
                    type="button"
                    onClick={() => {
                      setClearPhone((v) => !v);
                      setContactPhone('');
                    }}
                    className="btn"
                    style={{ backgroundColor: clearPhone ? '#FEE2E2' : 'var(--secondary-color)', color: clearPhone ? '#991B1B' : 'var(--primary-color)', flexShrink: 0, fontSize: '0.85rem' }}
                  >
                    {clearPhone ? '삭제 취소' : '삭제'}
                  </button>
                )}
              </div>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">주소</label>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input value={addressZonecode} readOnly className="form-input" placeholder="우편번호" style={{ width: '110px' }} />
                <button type="button" onClick={() => setShowAddressSearch(true)} className="btn" style={{ backgroundColor: 'var(--secondary-color)', color: 'var(--primary-color)', flexShrink: 0 }}>
                  <MapPin size={15} /> 주소 검색
                </button>
              </div>
              <input value={addressRoad} readOnly className="form-input" placeholder="도로명 주소" style={{ marginBottom: '0.5rem' }} />

              {current?.addressDetail && !clearDetail && (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 0.35rem 0' }}>
                  현재 등록된 상세주소: {current.addressDetail}
                </p>
              )}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  value={addressDetail}
                  onChange={(e) => setAddressDetail(e.target.value)}
                  className="form-input"
                  placeholder={current?.addressDetail ? '바꾸시려면 새 상세주소를 입력하세요' : '동·호수 (방문 서비스에서만 필요)'}
                  style={{ flex: 1 }}
                />
                {current?.addressDetail && (
                  <button
                    type="button"
                    onClick={() => {
                      setClearDetail((v) => !v);
                      setAddressDetail('');
                    }}
                    className="btn"
                    style={{ backgroundColor: clearDetail ? '#FEE2E2' : 'var(--secondary-color)', color: clearDetail ? '#991B1B' : 'var(--primary-color)', flexShrink: 0, fontSize: '0.85rem' }}
                  >
                    {clearDetail ? '삭제 취소' : '삭제'}
                  </button>
                )}
              </div>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">연락 가능 시간대</label>
              <select value={contactTimePref} onChange={(e) => setContactTimePref(e.target.value)} className="form-select">
                {CONTACT_TIME_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', color: 'var(--text-main)', cursor: 'pointer' }}>
              <input type="checkbox" checked={marketingAgreed} onChange={(e) => setMarketingAgreed(e.target.checked)} />
              마케팅 정보 수신에 동의합니다 (선택)
            </label>

            <button type="submit" disabled={isSaving} className="btn btn-primary" style={{ width: '100%', marginTop: '0.4rem' }}>
              {isSaving ? '저장 중...' : '저장'}
            </button>
          </form>
        )}
      </div>

      {showAddressSearch && (
        <AddressSearchModal
          onSelect={(address) => {
            setAddressZonecode(address.zonecode);
            setAddressRoad(address.roadAddress || address.jibunAddress);
          }}
          onClose={() => setShowAddressSearch(false)}
        />
      )}
    </div>
  );
};
