import React, { useState } from 'react';
import { Flower2, Heart, MessageSquarePlus } from 'lucide-react';

// 08-19 9차(개발자 직접 지시) — DigitalEstatePage 서브탭 3개(digital/physical/memorial) 중
// "디지털 추모관(memorial)"을 별도 도메인(tab: 'memorial')으로 분리.
// 🔄 09-07 사용자 지시 — 화면 구성을 실제 추모관 구현(MemorialLandingPage.tsx, `/m/:slug`)과
// 형태를 맞췄다. 실제 구현이 영정·명·사망일·비문을 담은 남색 헤더 → 헌화 → 방명록 순서로
// 쌓이고 사진 앨범이 없으므로(로컬디스크 저장이라 재배포 시 소실 — systems.md §5, 그래서
// 애초에 범위 밖) 이 예시도 같은 순서·같은 앨범 부재를 그대로 따른다. 이 페이지는
// MemorialEntryPage가 "등록된 추모관 없음" 판정일 때만 보여주는 예시 화면이라 실제 백엔드
// 호출은 하지 않는다 — 전부 로컬 state의 가짜 데이터다.

interface MemorialPageProps {
  currentUser?: string | null;
  onOpenLogin?: () => void;
}

const MOCK_GUESTBOOK: Array<{ name: string; relation: string; message: string; date: string }> = [
  { name: '김하늘', relation: '자녀', message: '아버님, 그곳에서는 부디 편안하게 쉬세요. 사랑합니다.', date: '2026-07-28' },
  { name: '이민우', relation: '친구', message: '오랜 친구야, 함께했던 소중한 시간 잊지 않을게. 평안하길 기도한다.', date: '2026-07-29' },
  { name: '박성진', relation: '직장동료', message: '언제나 선후배들에게 따뜻하셨던 팀장님, 그 은혜 가슴 깊이 간직하겠습니다.', date: '2026-07-29' },
];

export const MemorialPage: React.FC<MemorialPageProps> = () => {
  const [tributeCount, setTributeCount] = useState(42);
  const [guestbook, setGuestbook] = useState(MOCK_GUESTBOOK);
  const [authorName, setAuthorName] = useState('');
  const [relation, setRelation] = useState('');
  const [message, setMessage] = useState('');

  const handleTribute = () => {
    setTributeCount((c) => c + 1);
  };

  const handleGuestbookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !message.trim()) return;
    setGuestbook([{ name: authorName, relation, message, date: '오늘' }, ...guestbook]);
    setAuthorName('');
    setRelation('');
    setMessage('');
  };

  return (
    <div className="container">
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', backgroundColor: '#F1F5F9', color: '#6C7A89', padding: '0.3rem 0.8rem', borderRadius: '16px', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.6rem' }}>
          <Flower2 size={18} color="#6C7A89" /> 온라인 추모 공간
        </div>
        <h1 style={{ color: 'var(--primary-color)', fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
          <Flower2 color="var(--point-color)" size={32} /> 디지털 추모관
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.4rem' }}>
          사망 확인 후 개설되는 추모관 화면을 미리 보여드립니다.
        </p>
      </div>

      <div style={{ fontSize: '0.85rem', color: '#92400E', backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '8px', padding: '0.7rem 1rem', marginBottom: '1.25rem', lineHeight: 1.6 }}>
        ⚠️ 이 페이지는 화면 구성을 보여드리기 위한 <strong>예시 데이터</strong>로 채워져 있습니다.
        아래 이름·방명록은 실제 인물·게시물이 아닙니다.
      </div>

      {/* 실제 추모관(/m/:slug, MemorialLandingPage.tsx)과 같은 카드 구성 — 남색 헤더(영정·이름·
          비문) → 헌화 → 방명록. 사진 앨범은 실제 구현에도 없어 여기도 넣지 않는다. */}
      <div style={{ maxWidth: '460px', margin: '0 auto', backgroundColor: '#FFFFFF', borderRadius: '20px', boxShadow: '0 12px 35px rgba(26,43,76,0.08)', overflow: 'hidden' }}>
        <div style={{ backgroundColor: '#1A2B4C', color: '#FFFFFF', padding: '2rem 1.75rem', textAlign: 'center' }}>
          <div
            style={{
              width: '96px', height: '96px', borderRadius: '50%', margin: '0 auto 1rem',
              border: '3px solid rgba(255,255,255,0.3)', backgroundColor: 'rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Flower2 size={40} color="rgba(255,255,255,0.6)" />
          </div>
          <p style={{ fontSize: '0.85rem', color: '#94A3B8', letterSpacing: '0.1em', marginBottom: '0.6rem' }}>삼가 고인의 명복을 빕니다</p>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, fontFamily: "'KoPub World Batang', serif" }}>
            故 홍길동 <span style={{ fontSize: '0.95rem', fontWeight: 400, color: '#CBD5E1' }}>( ~ 2026년 7월 27일)</span>
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#CBD5E1', marginTop: '0.8rem', fontStyle: 'italic' }}>
            평생을 성실하게 살아오신, 늘 그리운 모습으로 기억합니다.
          </p>
        </div>

        <div style={{ textAlign: 'center', padding: '1.5rem', backgroundColor: 'var(--secondary-color)' }}>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginBottom: '0.9rem' }}>
            지금까지 <strong style={{ color: 'var(--primary-color)' }}>{tributeCount}번</strong> 헌화되었습니다.
          </p>
          <button type="button" onClick={handleTribute} className="btn btn-point">
            <Heart color="#FFFFFF" size={18} /> 헌화하기
          </button>
        </div>

        <div style={{ padding: '1.5rem 1.75rem' }}>
          <h4 style={{ color: 'var(--primary-color)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
            <MessageSquarePlus color="var(--primary-color)" size={20} /> 추모 방명록
          </h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '-0.5rem', marginBottom: '1rem' }}>
            * 아래 방명록은 화면 구성 예시이며, 실제 작성자·게시물이 아닙니다.
          </p>
          <form onSubmit={handleGuestbookSubmit} style={{ marginBottom: '1.1rem' }}>
            <div className="form-group">
              <input
                type="text"
                placeholder="이름"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <input
                type="text"
                placeholder="고인과의 관계 (선택)"
                value={relation}
                onChange={(e) => setRelation(e.target.value)}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <textarea
                placeholder="고인에게 전하는 글"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="form-input"
                style={{ height: '80px', padding: '0.75rem' }}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '44px', fontSize: '0.95rem' }}>
              방명록 남기기
            </button>
          </form>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto' }}>
            {guestbook.map((g, idx) => (
              <div key={idx} style={{ padding: '0.9rem', backgroundColor: 'var(--secondary-color)', borderRadius: '8px', borderLeft: '3px solid var(--primary-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--primary-color)' }}>
                    {g.name}{g.relation ? ` · ${g.relation}` : ''}
                  </span>
                  <span>{g.date}</span>
                </div>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>{g.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
