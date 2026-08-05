import React, { useState } from 'react';
import { X, Star, MessageSquare } from 'lucide-react';
import { BACKEND_URL } from '../../config';

interface ReviewItem {
  id: string;
  rating: number;
  content: string;
  createdAt: string;
  user: { name: string };
}

interface FacilityReviewModalProps {
  facility: {
    id: string;
    name: string;
    effectiveRating?: number;
    rating: number;
    reviews: ReviewItem[];
  };
  currentUser?: string | null;
  onOpenLogin?: () => void;
  onClose: () => void;
  onReviewSubmitted: (updatedFacility: any) => void;
}

export const FacilityReviewModal: React.FC<FacilityReviewModalProps> = ({
  facility,
  currentUser,
  onOpenLogin,
  onClose,
  onReviewSubmitted,
}) => {
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSubmitted, setJustSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      alert('⚠️ 리뷰 작성은 로그인 후 이용하실 수 있습니다.');
      onOpenLogin?.();
      return;
    }

    const token = localStorage.getItem('k_ending_token');
    if (!token) {
      alert('⚠️ 리뷰 작성은 로그인 후 이용하실 수 있습니다.');
      onOpenLogin?.();
      return;
    }
    if (!content.trim()) {
      setError('리뷰 내용을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/facilities/${facility.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rating, content }),
      });
      const data = await res.json();
      if (!res.ok || data.status !== 'success') {
        setError(data.message || '리뷰 작성에 실패했습니다.');
        return;
      }
      onReviewSubmitted(data.data);
      setContent('');
      setJustSubmitted(true);
      setTimeout(() => setJustSubmitted(false), 3000);
    } catch (e) {
      setError('서버와 통신 중 오류가 발생했습니다.');
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
          padding: '2rem',
          maxWidth: '520px',
          width: '100%',
          maxHeight: '85vh',
          overflowY: 'auto',
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
          <MessageSquare color="var(--point-color)" /> [{facility.name}] 이용 후기
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          평균 평점 ★ {facility.effectiveRating ?? facility.rating} · 리뷰 {facility.reviews.length}건
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1.5rem', maxHeight: '260px', overflowY: 'auto' }}>
          {facility.reviews.length === 0 && (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>아직 작성된 리뷰가 없습니다. 첫 리뷰를 남겨주세요.</p>
          )}
          {facility.reviews.map((r) => (
            <div key={r.id} style={{ border: '1px solid var(--border-color)', borderRadius: '10px', padding: '0.8rem 1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                <strong style={{ fontSize: '0.9rem', color: 'var(--primary-color)' }}>{r.user.name}</strong>
                <span style={{ fontSize: '0.85rem', color: 'var(--point-color)', fontWeight: 700 }}>★ {r.rating}</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', margin: 0 }}>{r.content}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                {new Date(r.createdAt).toLocaleDateString('ko-KR')}
              </p>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          <div>
            <label className="form-label">별점</label>
            <div style={{ display: 'flex', gap: '0.3rem' }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  <Star size={24} fill={n <= rating ? 'var(--point-color)' : 'none'} color="var(--point-color)" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="form-label">후기 내용</label>
            <textarea
              placeholder="답사/장례 이용 경험을 남겨주세요."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              style={{
                width: '100%',
                padding: '0.8rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                fontSize: '0.9rem',
                height: '70px',
              }}
            />
          </div>

          {error && <p style={{ color: '#DC2626', fontSize: '0.8rem', margin: 0 }}>{error}</p>}
          {justSubmitted && (
            <p style={{ color: '#059669', fontSize: '0.8rem', margin: 0 }}>✅ 리뷰가 등록되었습니다. 감사합니다!</p>
          )}

          <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ width: '100%' }}>
            {isSubmitting ? '등록 중...' : '리뷰 등록'}
          </button>
        </form>
      </div>
    </div>
  );
};
