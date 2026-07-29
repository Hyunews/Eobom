import React, { useState } from 'react';
import { ShieldCheck, MapPin, Map, CalendarCheck, X } from 'lucide-react';
import facilitiesData from '../mockData/facilities.json';

interface FacilityPageProps {
  currentUser?: string | null;
  onOpenLogin?: () => void;
}

export const FacilityPage: React.FC<FacilityPageProps> = ({ currentUser, onOpenLogin }) => {
  const [selectedMapFacility, setSelectedMapFacility] = useState<{ name: string; location: string } | null>(null);

  // 필터 상태
  const [category, setCategory] = useState('전체');
  const [region, setRegion] = useState('전체');
  const [religion, setReligion] = useState('전체');
  const [guestCount, setGuestCount] = useState('전체');
  const [budget, setBudget] = useState('전체');

  const facilities = facilitiesData;

  const handleBookVisit = (facilityName: string) => {
    if (!currentUser) {
      alert('⚠️ 장례식장/묘지 답사 예약은 로그인 후 이용하실 수 있습니다.');
      onOpenLogin?.();
      return;
    }
    alert(`📅 [${facilityName}] 답사 예약 신청이 완료되었습니다. 담당 매니저가 곧 연락드립니다.`);
  };

  const filteredFacilities = facilities.filter((f) => {
    if (category !== '전체' && f.type !== category) return false;
    if (budget === '500이하' && f.priceValue > 500) return false;
    if (budget === '500_1000' && (f.priceValue < 500 || f.priceValue > 1000)) return false;
    if (budget === '1000이상' && f.priceValue < 1000) return false;
    if (region !== '전체') {
      const matchKey = region.split('/')[0].trim();
      if (!f.location.includes(matchKey)) return false;
    }
    if (religion !== '전체' && !f.religion.includes(religion) && !f.religion.includes('전체')) return false;
    if (guestCount !== '전체' && f.guests !== guestCount) return false;
    return true;
  });

  return (
    <div className="container">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ color: 'var(--primary-color)', fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldCheck color="var(--primary-color)" /> 장례·묘지 맞춤 비교 매칭
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          위치, 종교, 예상 하객 수 및 예산에 맞춘 장례식장/봉안당 투명 비교 및 지도 보기 서비스
        </p>
      </div>

      {/* 개편된 필터 옵션 (지역, 종교, 하객수, 예산 포함) */}
      <div style={{
        backgroundColor: 'var(--card-bg)',
        padding: '1.5rem',
        borderRadius: 'var(--border-radius)',
        marginBottom: '2rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '1rem',
        boxShadow: 'var(--box-shadow)'
      }}>
        <div>
          <label className="form-label">구분</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="form-select">
            <option value="전체">전체 (장례식장/묘지)</option>
            <option value="장례식장">장례식장</option>
            <option value="묘지/수목장">묘지/봉안당/수목장</option>
          </select>
        </div>
        <div>
          <label className="form-label">예산 범위</label>
          <select value={budget} onChange={(e) => setBudget(e.target.value)} className="form-select">
            <option value="전체">전체 예산</option>
            <option value="500이하">500만원 이하</option>
            <option value="500_1000">500만원 ~ 1,000만원</option>
            <option value="1000이상">1,000만원 이상</option>
          </select>
        </div>
        <div>
          <label className="form-label">지역 선택</label>
          <select value={region} onChange={(e) => setRegion(e.target.value)} className="form-select">
            <option value="전체">전체 지역</option>
            <option value="서울">서울</option>
            <option value="경기">경기/인천</option>
            <option value="강원">강원</option>
            <option value="충청">충청</option>
            <option value="경상">경상/대구/부산</option>
            <option value="전라">전라/광주</option>
            <option value="제주">제주</option>
          </select>
        </div>
        <div>
          <label className="form-label">종교 선택</label>
          <select value={religion} onChange={(e) => setReligion(e.target.value)} className="form-select">
            <option value="전체">전체 종교</option>
            <option value="무교">무교 (일반)</option>
            <option value="기독교">기독교</option>
            <option value="천주교">천주교</option>
            <option value="불교">불교</option>
          </select>
        </div>
        <div>
          <label className="form-label">예상 하객 수</label>
          <select value={guestCount} onChange={(e) => setGuestCount(e.target.value)} className="form-select">
            <option value="전체">전체 규모</option>
            <option value="100명 미만">100명 미만 (소규모 가족장)</option>
            <option value="100~300명">100명 ~ 300명</option>
            <option value="300명 이상">300명 이상 (대규모)</option>
          </select>
        </div>
      </div>

      {/* 시설 카드 목록 */}
      <div className="grid">
        {filteredFacilities.map((item) => (
          <div key={item.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', backgroundColor: 'var(--secondary-color)', padding: '0.3rem 0.6rem', borderRadius: '4px', fontWeight: 600, color: 'var(--point-color)' }}>
                {item.type}
              </span>
              <span style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>★ {item.rating}</span>
            </div>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--primary-color)', marginBottom: '0.5rem' }}>{item.name}</h3>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.3rem' }}>
              <MapPin size={16} /> {item.location}
            </p>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
              • 종교: {item.religion} | • 예상 하객: {item.guests}
            </p>
            <p style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--point-color)', marginBottom: '1rem' }}>
              {item.price}
            </p>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              {item.tags.map((tag, idx) => (
                <span key={idx} style={{ fontSize: '0.8rem', backgroundColor: '#EAE5DC', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                  #{tag}
                </span>
              ))}
            </div>
            <div style={{ marginTop: 'auto', display: 'flex', gap: '0.5rem' }}>
              {/* 지도 보기 버튼 (VR 버튼 대체) */}
              <button 
                onClick={() => setSelectedMapFacility({ name: item.name, location: item.location })} 
                className="btn" 
                style={{ 
                  flex: 1, 
                  backgroundColor: 'var(--secondary-color)', 
                  color: 'var(--primary-color)', 
                  fontSize: '0.9rem',
                  padding: '0 0.5rem',
                  whiteSpace: 'nowrap',
                  gap: '0.3rem'
                }}
              >
                <Map size={16} style={{ flexShrink: 0 }} /> 지도 보기
              </button>
              <button 
                onClick={() => handleBookVisit(item.name)} 
                className="btn btn-primary" 
                style={{ 
                  flex: 1, 
                  fontSize: '0.9rem',
                  padding: '0 0.5rem',
                  whiteSpace: 'nowrap',
                  gap: '0.3rem'
                }}
              >
                <CalendarCheck size={16} style={{ flexShrink: 0 }} /> 답사 예약
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 지도 보기 모달 (카카오맵 연동 느낌의 지도 뷰어) */}
      {selectedMapFacility && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            padding: '2rem',
            maxWidth: '650px',
            width: '100%',
            position: 'relative'
          }}>
            <button
              onClick={() => setSelectedMapFacility(null)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', border: 'none', background: 'none', cursor: 'pointer' }}
            >
              <X size={24} />
            </button>
            <h3 style={{ color: 'var(--primary-color)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Map color="var(--point-color)" /> {selectedMapFacility.name} 위치 지도
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              주소: {selectedMapFacility.location} (추후 카카오맵 LBS API 연동)
            </p>
            
            {/* 가상 지도 영역 */}
            <div style={{
              backgroundColor: '#E5E9F0',
              height: '300px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary-color)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <MapPin size={48} color="var(--accent-red)" style={{ marginBottom: '0.5rem' }} />
              <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>[{selectedMapFacility.name}]</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>📍 GPS 위도/경도 데이터 매핑 좌표</span>
            </div>

            <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
              <button onClick={() => setSelectedMapFacility(null)} className="btn btn-primary">
                확인 닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
