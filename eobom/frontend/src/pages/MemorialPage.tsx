import React, { useState } from 'react';
import { Flower2, Heart, MessageSquarePlus, Image } from 'lucide-react';
import digitalEstateData from '../mockData/digitalEstate.json';

// 08-19 9차(개발자 직접 지시) — DigitalEstatePage 서브탭 3개(digital/physical/memorial) 중
// "디지털 추모관(memorial)"을 별도 도메인(tab: 'memorial')으로 분리. 내용은 그대로 옮겼다
// (헌화·방명록·앨범은 화면 구성 예시 — 00-14 §2.2 원칙 유지).
// 🔵 개발자 지시(모바일 부고장 분리 건과 함께) — 앞으로 실제 추모 페이지가 열리면, 모바일
// 부고장 전송 시 이 페이지 링크를 함께 보낼 예정(ObituaryPage.tsx 코멘트 참고).

interface MemorialPageProps {
  currentUser?: string | null;
  onOpenLogin?: () => void;
}

export const MemorialPage: React.FC<MemorialPageProps> = () => {
  const [tributeFlowerCount, setTributeFlowerCount] = useState<number>(42);
  const [guestbookList, setGuestbookList] = useState<Array<{ name: string; message: string; date: string }>>(digitalEstateData.guestbookList);
  const [newGuestName, setNewGuestName] = useState('');
  const [newGuestMsg, setNewGuestMsg] = useState('');

  const [memorialPhotos, setMemorialPhotos] = useState<Array<{ title: string; url: string }>>(digitalEstateData.memorialPhotos);
  const [newPhotoTitle, setNewPhotoTitle] = useState('');

  const handleAddGuestbook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGuestName || !newGuestMsg) return;
    setGuestbookList([{ name: newGuestName, message: newGuestMsg, date: '오늘' }, ...guestbookList]);
    setNewGuestName('');
    setNewGuestMsg('');
    alert('추모 방명록이 등록되었습니다.');
  };

  const handleAddPhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhotoTitle) return;
    setMemorialPhotos([{ title: newPhotoTitle, url: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=500&auto=format&fit=crop' }, ...memorialPhotos]);
    setNewPhotoTitle('');
    alert('추모 사진이 앨범에 등록되었습니다.');
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
          온라인 방명록과 추모 갤러리를 통해 소중한 기억을 나눠보세요.
        </p>
      </div>

      <div style={{ fontSize: '0.85rem', color: '#92400E', backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '8px', padding: '0.7rem 1rem', marginBottom: '1.25rem', lineHeight: 1.6 }}>
        ⚠️ 이 페이지는 화면 구성을 보여드리기 위한 <strong>예시 데이터</strong>로 채워져 있습니다.
        아래 방명록·사진은 실제 작성자·게시물이 아닙니다.
      </div>

      <div style={{ backgroundColor: 'var(--card-bg)', padding: '1.5rem', borderRadius: 'var(--border-radius)', boxShadow: 'var(--box-shadow)' }}>
        <div style={{ textAlign: 'center', padding: '1.5rem', backgroundColor: 'var(--secondary-color)', borderRadius: '12px', marginBottom: '1.5rem' }}>
          <h3 style={{ color: 'var(--primary-color)', marginBottom: '0.5rem' }}>🌹 고인 온라인 추모관</h3>
          <p style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            현재 <strong>{tributeFlowerCount}송이</strong>의 국화꽃이 헌화되었습니다.
          </p>
          <button
            onClick={() => {
              setTributeFlowerCount(tributeFlowerCount + 1);
              alert('국화꽃 한 송이를 헌화했습니다. 마음을 담아 기도합니다.');
            }}
            className="btn btn-point"
          >
            <Heart color="#FFFFFF" size={18} /> 온라인 국화꽃 헌화하기
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          <div>
            <h4 style={{ color: 'var(--primary-color)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MessageSquarePlus color="var(--primary-color)" /> 추모 방명록 작성
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '-0.5rem', marginBottom: '1rem' }}>
              * 아래 방명록은 화면 구성 예시이며, 실제 작성자·게시물이 아닙니다.
            </p>
            <form onSubmit={handleAddGuestbook} style={{ marginBottom: '1.1rem' }}>
              <div className="form-group">
                <input
                  type="text"
                  placeholder="작성자 이름 (예: 홍길동 친구)"
                  value={newGuestName}
                  onChange={(e) => setNewGuestName(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <textarea
                  placeholder="고인에게 전달할 남기는 글..."
                  value={newGuestMsg}
                  onChange={(e) => setNewGuestMsg(e.target.value)}
                  className="form-input"
                  style={{ height: '80px', padding: '0.75rem' }}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '44px', fontSize: '0.95rem' }}>
                방명록 등록
              </button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto' }}>
              {guestbookList.map((g, idx) => (
                <div key={idx} style={{ padding: '0.9rem', backgroundColor: 'var(--secondary-color)', borderRadius: '8px', borderLeft: '3px solid var(--primary-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--primary-color)' }}>{g.name}</span>
                    <span>{g.date}</span>
                  </div>
                  <p style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>{g.message}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 style={{ color: 'var(--primary-color)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Image color="var(--primary-color)" /> 추모 사진 등록 & 갤러리
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '-0.5rem', marginBottom: '1rem' }}>
              * 아래 사진은 Unsplash 제공 예시 이미지입니다. 실제 고인의 사진이 아닙니다.
            </p>
            <form onSubmit={handleAddPhoto} style={{ marginBottom: '1.1rem' }}>
              <div className="form-group">
                <input
                  type="text"
                  placeholder="사진 제목 (예: 가족 추억 여행)"
                  value={newPhotoTitle}
                  onChange={(e) => setNewPhotoTitle(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
              <button type="submit" className="btn btn-point" style={{ width: '100%', height: '44px', fontSize: '0.95rem' }}>
                🖼️ 사진 추가 등록하기
              </button>
            </form>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem' }}>
              {memorialPhotos.map((photo, idx) => (
                <div key={idx} style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)', backgroundColor: 'var(--secondary-color)' }}>
                  <img src={photo.url} alt={photo.title} style={{ width: '100%', height: '100px', objectFit: 'cover' }} />
                  <p style={{ padding: '0.5rem', fontSize: '0.85rem', fontWeight: 600, textAlign: 'center' }}>{photo.title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
