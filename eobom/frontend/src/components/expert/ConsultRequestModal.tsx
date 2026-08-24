import React, { useState } from 'react';
import { X, Send, ShieldCheck } from 'lucide-react';
import { BACKEND_URL } from '../../config';
import { useProfileContact } from '../../hooks/useProfileContact';

// 전문가 상담 신청 — InquiryModal.tsx(장사시설 업체 문의)와 같은 구조.
// docs/02_전문가_매칭/02-03_전문가_공개노출_및_상담신청_명세서.md §7.2.
// POST /api/experts/:id/consult-requests 에 연결, 접수번호(EC-YYMMDD-NNNN)를 사용자에게 보여준다.
// 00-28 §6.4 — 프로필 연락처 재사용은 InquiryModal.tsx와 완전히 같은 훅(useProfileContact)을
// 쓴다(⚠️ 두 폼의 동작을 다르게 두지 말 것, §6.4-1).

const CHANNEL_OPTIONS: { value: string; label: string }[] = [
  { value: 'ALIMTALK', label: '카카오 알림톡' },
  { value: 'PHONE', label: '전화' },
  { value: 'VIDEO', label: '화상 상담' },
  { value: 'VISIT', label: '방문' },
];

interface ConsultRequestModalProps {
  expertId: string;
  expertName: string;
  onClose: () => void;
}

export const ConsultRequestModal: React.FC<ConsultRequestModalProps> = ({ expertId, expertName, onClose }) => {
  const [applicantName, setApplicantName] = useState('');
  const [applicantPhone, setApplicantPhone] = useState('');
  const [channel, setChannel] = useState(CHANNEL_OPTIONS[0].value);
  const [preferredAt, setPreferredAt] = useState('');
  const [content, setContent] = useState('');
  const [thirdPartyConsent, setThirdPartyConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { maskedPhone, profileName, useProfileContact: useProfile, setUseProfileContact: setUseProfile, saveToProfile, setSaveToProfile } =
    useProfileContact();
  const isLoggedIn = !!sessionStorage.getItem('k_ending_token');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!thirdPartyConsent) {
      alert('⚠️ 개인정보 제3자 제공에 동의해야 상담을 신청할 수 있습니다.');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = sessionStorage.getItem('k_ending_token');
      const res = await fetch(`${BACKEND_URL}/api/experts/${expertId}/consult-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          // §6.4 — 프로필 값을 쓸 때는 값 자체를 안 보낸다. 서버가 로그인 유저의 프로필에서 직접 읽는다.
          ...(useProfile ? {} : { applicantName, applicantPhone }),
          useProfileContact: useProfile,
          saveToProfile: !useProfile && saveToProfile,
          channel,
          preferredAt: preferredAt || undefined,
          content,
          thirdPartyConsent,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.status !== 'success') {
        alert(data.message || '상담 신청에 실패했습니다.');
        return;
      }
      alert(`✅ [${expertName}]님께 상담 신청이 접수되었습니다.\n\n접수번호: ${data.data.requestNo}\n(문의 시 이 번호를 말씀해주시면 빠르게 확인 가능합니다)`);
      onClose();
    } catch {
      alert('서버와 통신 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
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
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 2200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          padding: '1.5rem',
          maxWidth: '520px',
          width: '100%',
          position: 'relative',
        }}
      >
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '1.2rem', right: '1.2rem', border: 'none', background: 'none', cursor: 'pointer' }}
        >
          <X size={22} />
        </button>

        <h3 style={{ color: 'var(--primary-color)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Send color="var(--point-color)" size={20} /> [{expertName}] 상담 신청
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.1rem' }}>
          신청 내용을 남겨주시면 전문가가 확인 후 연락드립니다.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {maskedPhone && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-main)', cursor: 'pointer' }}>
              <input type="checkbox" checked={useProfile} onChange={(e) => setUseProfile(e.target.checked)} />
              내 정보 사용 ({maskedPhone})
            </label>
          )}

          <div>
            <label className="form-label">이름</label>
            <input
              required={!useProfile}
              disabled={useProfile}
              value={useProfile ? profileName || '' : applicantName}
              onChange={(e) => setApplicantName(e.target.value)}
              className="form-select"
              style={useProfile ? { backgroundColor: 'var(--secondary-color)', color: 'var(--text-muted)' } : undefined}
            />
          </div>

          <div>
            <label className="form-label">연락처</label>
            <input
              required={!useProfile}
              disabled={useProfile}
              type="tel"
              placeholder="010-0000-0000"
              value={useProfile ? maskedPhone || '' : applicantPhone}
              onChange={(e) => setApplicantPhone(e.target.value)}
              className="form-select"
              style={useProfile ? { backgroundColor: 'var(--secondary-color)', color: 'var(--text-muted)' } : undefined}
            />
          </div>

          {!useProfile && isLoggedIn && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <input type="checkbox" checked={saveToProfile} onChange={(e) => setSaveToProfile(e.target.checked)} />
              다음에도 쓸 수 있게 내 정보에 저장
            </label>
          )}

          <div>
            <label className="form-label">희망 상담 방식</label>
            <select value={channel} onChange={(e) => setChannel(e.target.value)} className="form-select">
              {CHANNEL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">희망 상담 일시 (선택)</label>
            <input type="datetime-local" value={preferredAt} onChange={(e) => setPreferredAt(e.target.value)} className="form-select" />
          </div>

          <div>
            <label className="form-label">상담 희망 내용</label>
            <textarea
              required
              placeholder="궁금하신 내용을 남겨주세요 (예: 상속세 절세 방안, 유언장 작성 관련 등)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              style={{
                width: '100%',
                padding: '0.8rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                fontSize: '0.9rem',
                height: '100px',
              }}
            />
          </div>

          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem',
              fontSize: '0.85rem',
              color: 'var(--text-muted)',
              backgroundColor: 'var(--card-bg)',
              padding: '0.8rem',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            <input type="checkbox" checked={thirdPartyConsent} onChange={(e) => setThirdPartyConsent(e.target.checked)} style={{ marginTop: '0.15rem' }} />
            <span>
              <strong style={{ color: 'var(--text-main)' }}>[필수]</strong> 개인정보 제3자 제공에 동의합니다.
              <br />
              제공받는 자: {expertName} (이어봄 입점 전문가) · 제공 목적: 상담 안내 및 연락 ·
              제공 항목: 이름, 연락처, 상담 희망 내용 · 보유 기간: 목적 달성 후 파기
            </span>
          </label>

          <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={onClose} className="btn" style={{ flex: 1, backgroundColor: '#E2E8F0' }}>
              취소
            </button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
              {isSubmitting ? '전송 중...' : (
                <>
                  <ShieldCheck size={16} /> 상담 신청
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
