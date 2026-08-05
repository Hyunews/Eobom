import React, { useState } from 'react';
import { X, CalendarCheck } from 'lucide-react';
import { BACKEND_URL } from '../../config';

interface BookingModalProps {
  facilityId: string;
  facilityName: string;
  currentUser?: string | null;
  onOpenLogin?: () => void;
  onClose: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({ facilityId, facilityName, currentUser, onOpenLogin, onClose }) => {
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('14:00');
  const [bookingCount, setBookingCount] = useState('2');
  const [bookingNote, setBookingNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      alert('⚠️ 답사 예약은 로그인 후 이용하실 수 있습니다.');
      onOpenLogin?.();
      return;
    }

    const token = localStorage.getItem('k_ending_token');
    if (!token) {
      alert('⚠️ 답사 예약은 로그인 후 이용하실 수 있습니다.');
      onOpenLogin?.();
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/facilities/${facilityId}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bookingDate, bookingTime, bookingCount: Number(bookingCount), bookingNote }),
      });
      const data = await res.json();
      if (!res.ok || data.status !== 'success') {
        alert(data.message || '예약 신청에 실패했습니다.');
        return;
      }
      alert(`🎉 [${facilityName}] 답사 예약 신청이 완료되었습니다!\n\n일시: ${bookingDate} ${bookingTime}\n인원: ${bookingCount}명\n배정된 웰다잉 전문 코디네이터가 30분 이내 해피콜을 드립니다.`);
      onClose();
    } catch (e) {
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
        padding: '1rem'
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          padding: '2rem',
          maxWidth: '520px',
          width: '100%',
          position: 'relative'
        }}
      >
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '1.2rem', right: '1.2rem', border: 'none', background: 'none', cursor: 'pointer' }}
        >
          <X size={22} />
        </button>

        <h3 style={{ color: 'var(--primary-color)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CalendarCheck color="var(--point-color)" /> [{facilityName}] 답사 예약
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          전담 웰다잉 지도사가 동행하여 시설 안내 및 할인 혜택 상담을 도와드립니다.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="form-label">방문 희망 날짜</label>
            <input
              type="date"
              required
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)}
              className="form-select"
            />
          </div>

          <div>
            <label className="form-label">방문 희망 시간</label>
            <select value={bookingTime} onChange={(e) => setBookingTime(e.target.value)} className="form-select">
              <option value="10:00">오전 10:00</option>
              <option value="14:00">오후 02:00</option>
              <option value="16:00">오후 04:00</option>
            </select>
          </div>

          <div>
            <label className="form-label">방문 인원 수</label>
            <select value={bookingCount} onChange={(e) => setBookingCount(e.target.value)} className="form-select">
              <option value="1">1명 (본인)</option>
              <option value="2">2명 (가족 동행)</option>
              <option value="4">3~4명 이상</option>
            </select>
          </div>

          <div>
            <label className="form-label">요청 사항 (선택)</label>
            <textarea
              placeholder="예: 휠체어 지원 필요, 특정 종교 전용관 먼저 둘러보기 희망"
              value={bookingNote}
              onChange={(e) => setBookingNote(e.target.value)}
              style={{
                width: '100%',
                padding: '0.8rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                fontSize: '0.9rem',
                height: '70px'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={onClose} className="btn" style={{ flex: 1, backgroundColor: '#E2E8F0' }}>
              취소
            </button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ flex: 1 }}>
              {isSubmitting ? '신청 중...' : '예약 신청 완료'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
