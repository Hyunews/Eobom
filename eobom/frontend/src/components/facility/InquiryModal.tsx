import React, { useState } from 'react';
import { X, Send, ShieldCheck } from 'lucide-react';
import { apiFetch, ApiError } from '../../lib/api';
import { getToken } from '../../lib/storage';
import { useProfileContact } from '../../hooks/useProfileContact';

// 업체 문의 — 전화번호 노출 대신 이 폼을 통해서만 시설에 문의한다(docs 01-05 §9: 전화 문의는
// 수수료 청구 근거로 증명 불가, 견적요청 폼으로 유도). 기존 POST /api/facilities/:id/quotes
// (Lead type=QUOTE)에 그대로 연결 — leadNo가 사용자가 말한 "라벨링"에 해당한다.

// 00-28 §6.4-1 — 2026-08-12에 넣었던 localStorage 자동입력(LAST_APPLICANT_KEY)은 걷어냈다.
// 서버 프로필(useProfileContact 훅)과 두 소스가 충돌하고, 이름·연락처가 브라우저에 무기한
// 남아 세션 보관 위치 판단(sessionStorage 전환, `00-08`)과도 어긋나기 때문.
// 00-34 §4.3 — 위 정리 당시 남겨뒀던 잔재 정리용 removeItem(eobom_last_applicant)은 저장하는
// 곳이 없는 죽은 키라 제거했다.

interface InquiryModalProps {
  facilityId: string;
  facilityName: string;
  onClose: () => void;
}

export const InquiryModal: React.FC<InquiryModalProps> = ({ facilityId, facilityName, onClose }) => {
  const [applicantName, setApplicantName] = useState('');
  const [applicantPhone, setApplicantPhone] = useState('');
  const [message, setMessage] = useState('');
  const [thirdPartyConsent, setThirdPartyConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { maskedPhone, profileName, useProfileContact: useProfile, setUseProfileContact: setUseProfile, saveToProfile, setSaveToProfile } =
    useProfileContact();
  const isLoggedIn = !!getToken('USER');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!thirdPartyConsent) {
      alert('⚠️ 개인정보 제3자 제공에 동의해야 문의를 보낼 수 있습니다.');
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await apiFetch<{ leadNo: string }>(`/api/facilities/${facilityId}/quotes`, 'USER', {
        method: 'POST',
        body: JSON.stringify({
          // §6.4 — 프로필 값을 쓸 때는 값 자체를 안 보낸다. 서버가 로그인 유저의 프로필에서 직접 읽는다.
          ...(useProfile ? {} : { applicantName, applicantPhone }),
          useProfileContact: useProfile,
          saveToProfile: !useProfile && saveToProfile,
          thirdPartyConsent,
          payload: { message },
        }),
      });
      alert(`✅ [${facilityName}]에 문의가 접수되었습니다.\n\n접수번호: ${data.leadNo}\n(문의 시 이 번호를 말씀해주시면 빠르게 확인 가능합니다)`);
      onClose();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : '서버와 통신 중 오류가 발생했습니다.');
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
          <Send color="var(--point-color)" size={20} /> [{facilityName}] 업체 문의
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.1rem' }}>
          문의 내용을 남겨주시면 담당자가 확인 후 연락드립니다.
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
            <label className="form-label">문의 사항</label>
            <textarea
              required
              placeholder="궁금하신 내용을 남겨주세요 (예: 빈소 사용 가능 일정, 비용 문의 등)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
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
              제공받는 자: {facilityName} 등 신청 시설 (또는 비제휴 시 이어봄 상담원) · 제공 목적: 문의 응대 및 연락 ·
              제공 항목: 이름, 연락처, 문의 내용 · 보유 기간: 목적 달성 후 파기
            </span>
          </label>

          <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={onClose} className="btn" style={{ flex: 1, backgroundColor: '#E2E8F0' }}>
              취소
            </button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
              {isSubmitting ? '전송 중...' : (
                <>
                  <ShieldCheck size={16} /> 문의 전송
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
