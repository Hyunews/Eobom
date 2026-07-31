import React, { useState } from 'react';
import { LogIn, PackageCheck, ShieldAlert, Heart, Upload, Image, MapPin, CheckCircle2, MessageSquarePlus, Trash2 } from 'lucide-react';
import digitalEstateData from '../mockData/digitalEstate.json';
import { PhoneHeartIcon } from '../components/MenuIcons';

interface DigitalEstatePageProps {
  currentUser?: string | null;
  onOpenLogin?: () => void;
}

export const DigitalEstatePage: React.FC<DigitalEstatePageProps> = ({ currentUser, onOpenLogin }) => {
  const [activeSubTab, setActiveSubTab] = useState<'digital' | 'physical' | 'memorial'>('digital');

  // 1. 디지털 계정 정산 상태
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [digitalAccounts, setDigitalAccounts] = useState(digitalEstateData.digitalAccounts);

  // 2. 현물 유품 정리 지역 업체 상태
  const [vendorRegion, setVendorRegion] = useState('전체');
  const vendors = digitalEstateData.vendors;

  // 3. 디지털 추모관 상태 (헌화, 방명록, 앨범)
  const [tributeFlowerCount, setTributeFlowerCount] = useState<number>(42);
  const [guestbookList, setGuestbookList] = useState<Array<{ name: string; message: string; date: string }>>(digitalEstateData.guestbookList);
  const [newGuestName, setNewGuestName] = useState('');
  const [newGuestMsg, setNewGuestMsg] = useState('');

  const [memorialPhotos, setMemorialPhotos] = useState<Array<{ title: string; url: string }>>(digitalEstateData.memorialPhotos);
  const [newPhotoTitle, setNewPhotoTitle] = useState('');

  // 1) 파일 업로드 핸들러
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentUser) {
      alert('⚠️ 증빙 서류 업로드는 로그인 후 이용하실 수 있습니다.');
      onOpenLogin?.();
      return;
    }
    if (e.target.files && e.target.files[0]) {
      const fileName = e.target.files[0].name;
      setUploadedFiles([...uploadedFiles, fileName]);
      alert(`[${fileName}] 파일이 증빙 서류로 성공적으로 업로드되었습니다.`);
    }
  };

  // 1) 정산 신청 클릭 핸들러 (서류 검증)
  const handleApplyAccount = (accName: string) => {
    if (!currentUser) {
      alert('⚠️ 고인 계정 정산 신청은 로그인 후 이용하실 수 있습니다.');
      onOpenLogin?.();
      return;
    }
    if (uploadedFiles.length === 0) {
      alert('⚠️ 증빙 서류(가족관계증명서 또는 사망진단서)가 아직 업로드되지 않았습니다!\n아래 파일 업로드 영역에서 증빙 서류를 먼저 첨부해 주세요.');
    } else {
      alert(`✅ [${accName}] 정산 신청이 정상적으로 접수되었습니다.\nNaver OCR 검증 후 신청이 진행됩니다.`);
    }
  };

  // 3) 방명록 작성
  const handleAddGuestbook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGuestName || !newGuestMsg) return;
    setGuestbookList([{ name: newGuestName, message: newGuestMsg, date: '오늘' }, ...guestbookList]);
    setNewGuestName('');
    setNewGuestMsg('');
    alert('추모 방명록이 등록되었습니다.');
  };

  // 3) 사진 추가
  const handleAddPhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhotoTitle) return;
    setMemorialPhotos([{ title: newPhotoTitle, url: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=500&auto=format&fit=crop' }, ...memorialPhotos]);
    setNewPhotoTitle('');
    alert('추모 사진이 앨범에 등록되었습니다.');
  };

  return (
    <div className="container">
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', backgroundColor: '#FEF3C7', color: '#D97706', padding: '0.3rem 0.8rem', borderRadius: '16px', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.6rem' }}>
          <PhoneHeartIcon size={18} color="#D97706" /> 스마트폰 &amp; 하트 | SNS / 클라우드 영구 삭제 및 유품 정리 원스톱
        </div>
        <h1 style={{ color: 'var(--primary-color)', fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
          <PhoneHeartIcon color="var(--accent-gold)" size={32} /> 디지털 유품 및 현물 정리 서비스
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.4rem' }}>
          고인의 디지털 계정 정산 신청, 지역 기반 현물 유품 정리 수거 및 온라인 추모관 갤러리
        </p>
      </div>

      {/* 서브 탭 */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveSubTab('digital')}
          className={`btn ${activeSubTab === 'digital' ? 'btn-primary' : ''}`}
          style={{ backgroundColor: activeSubTab !== 'digital' ? 'var(--card-bg)' : undefined, color: activeSubTab !== 'digital' ? 'var(--text-main)' : undefined }}
        >
          📱 디지털 자산/계정 정산
        </button>
        <button
          onClick={() => setActiveSubTab('physical')}
          className={`btn ${activeSubTab === 'physical' ? 'btn-primary' : ''}`}
          style={{ backgroundColor: activeSubTab !== 'physical' ? 'var(--card-bg)' : undefined, color: activeSubTab !== 'physical' ? 'var(--text-main)' : undefined }}
        >
          📦 현물 유품 수거/정리 (업체)
        </button>
        <button
          onClick={() => setActiveSubTab('memorial')}
          className={`btn ${activeSubTab === 'memorial' ? 'btn-primary' : ''}`}
          style={{ backgroundColor: activeSubTab !== 'memorial' ? 'var(--card-bg)' : undefined, color: activeSubTab !== 'memorial' ? 'var(--text-main)' : undefined }}
        >
          🖼️ 디지털 추모관 & 앨범
        </button>
      </div>

      {/* 서브탭 1: 디지털 자산 정산 */}
      {activeSubTab === 'digital' && (
        <div style={{ backgroundColor: 'var(--card-bg)', padding: '2rem', borderRadius: 'var(--border-radius)', boxShadow: 'var(--box-shadow)' }}>
          <h3 style={{ color: 'var(--primary-color)', marginBottom: '0.5rem' }}>고인 디지털 계정 정산 신청</h3>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            정당한 상속인 확인을 위해 아래 <strong>증빙 서류(가족관계증명서 / 사망진단서)를 먼저 업로드</strong>해 주세요.
          </p>

          {/* 1. 증빙 서류 업로드 영역 (최상단 이동) */}
          <div style={{ border: '2px dashed var(--border-color)', padding: '2rem', textAlign: 'center', borderRadius: '12px', backgroundColor: 'var(--secondary-color)', marginBottom: '2.5rem' }}>
            <Upload color="var(--primary-color)" size={36} style={{ marginBottom: '0.5rem' }} />
            <h4 style={{ color: 'var(--primary-color)', marginBottom: '0.25rem' }}>📌 필수 증빙 서류 업로드 (가족관계증명서 / 사망진단서)</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Naver OCR 엔진으로 정당한 상속인 여부를 즉시 검증합니다.</p>
            
            <input type="file" id="doc-file-input" onChange={handleFileUpload} style={{ display: 'none' }} />
            <label htmlFor="doc-file-input" className="btn btn-primary" style={{ cursor: 'pointer' }}>
              📁 컴퓨터에서 서류 파일 선택/업로드
            </label>

            {uploadedFiles.length > 0 && (
              <div style={{ marginTop: '1.5rem', textAlign: 'left', backgroundColor: '#FFFFFF', padding: '1rem', borderRadius: '8px', border: '1px solid var(--point-color)' }}>
                <h5 style={{ color: 'var(--point-color)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                  <CheckCircle2 size={16} /> 현재 업로드 완료된 서류 목록:
                </h5>
                <ul style={{ listStyle: 'none', paddingLeft: '0.5rem', fontSize: '0.9rem' }}>
                  {uploadedFiles.map((f, i) => (
                    <li key={i} style={{ padding: '0.25rem 0' }}>📄 {f} (OCR 검증 완료)</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* 2. 계정 정산 신청 목록 */}
          <h4 style={{ color: 'var(--primary-color)', marginBottom: '1rem' }}>계정별 정산/승계 신청</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {digitalAccounts.map((acc) => (
              <div key={acc.id} style={{ padding: '1.2rem', border: '1px solid var(--border-color)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ color: 'var(--primary-color)', fontSize: '1.1rem' }}>{acc.name}</h4>
                  <p style={{ fontSize: '0.9rem', color: 'var(--point-color)', fontWeight: 500 }}>{acc.status}</p>
                </div>
                <button onClick={() => handleApplyAccount(acc.name)} className="btn btn-point" style={{ height: '42px', fontSize: '0.9rem' }}>
                  정산 신청 (개발중)
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 서브탭 2: 현물 유품 정리 (지역 업체 추천) */}
      {activeSubTab === 'physical' && (
        <div style={{ backgroundColor: 'var(--card-bg)', padding: '2rem', borderRadius: 'var(--border-radius)', boxShadow: 'var(--box-shadow)' }}>
          <h3 style={{ color: 'var(--primary-color)', marginBottom: '0.5rem' }}>지역 기반 현물 유품 정리 전문 업체 추천</h3>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            유품 정찰제 수거, 소각 대행 및 특수 청소 제휴 전문 업체 리스트입니다.
          </p>

          <div className="form-group" style={{ maxWidth: '300px', marginBottom: '1.5rem' }}>
            <label className="form-label">지역 필터</label>
            <select value={vendorRegion} onChange={(e) => setVendorRegion(e.target.value)} className="form-select">
              <option value="전체">전체 지역</option>
              <option value="서울/경기">서울/경기</option>
              <option value="충청/대전">충청/대전</option>
              <option value="경상/부산">경상/부산</option>
            </select>
          </div>

          <div className="grid">
            {vendors
              .filter(v => vendorRegion === '전체' || v.region.includes(vendorRegion))
              .map((vendor, idx) => (
                <div key={idx} className="card" style={{ borderTop: '4px solid var(--primary-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--point-color)' }}>📍 {vendor.region}</span>
                    <span style={{ fontWeight: 'bold' }}>★ {vendor.rating}</span>
                  </div>
                  <h4 style={{ color: 'var(--primary-color)', fontSize: '1.2rem', marginBottom: '0.5rem' }}>{vendor.name}</h4>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                    {vendor.tags.map((t, i) => (
                      <span key={i} style={{ fontSize: '0.8rem', backgroundColor: 'var(--secondary-color)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                        #{t}
                      </span>
                    ))}
                  </div>
                  <button onClick={() => alert(`${vendor.name} 방문 무료 견적이 신청되었습니다.`)} className="btn btn-primary" style={{ marginTop: 'auto', width: '100%' }}>
                    무료 방문 견적 신청
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* 서브탭 3: 디지털 추모관 (헌화, 방명록, 앨범) */}
      {activeSubTab === 'memorial' && (
        <div style={{ backgroundColor: 'var(--card-bg)', padding: '2rem', borderRadius: 'var(--border-radius)', boxShadow: 'var(--box-shadow)' }}>
          {/* 상단 헌화 섹션 */}
          <div style={{ textAlign: 'center', padding: '2rem', backgroundColor: 'var(--secondary-color)', borderRadius: '12px', marginBottom: '2rem' }}>
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            {/* 추모 방명록 기능 */}
            <div>
              <h4 style={{ color: 'var(--primary-color)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MessageSquarePlus color="var(--primary-color)" /> 추모 방명록 작성
              </h4>
              <form onSubmit={handleAddGuestbook} style={{ marginBottom: '1.5rem' }}>
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

            {/* 추모 사진 등록 및 갤러리 */}
            <div>
              <h4 style={{ color: 'var(--primary-color)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Image color="var(--primary-color)" /> 추모 사진 등록 & 갤러리
              </h4>
              <form onSubmit={handleAddPhoto} style={{ marginBottom: '1.5rem' }}>
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
                    <p style={{ padding: '0.5rem', fontSize: '0.8rem', fontWeight: 600, textAlign: 'center' }}>{photo.title}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
