import React, { useState, useEffect } from 'react';
import { ShieldCheck, MapPin, Map, CalendarCheck, Eye, PhoneCall, Sparkles, X, Filter, ChevronRight, CheckCircle2, Calculator } from 'lucide-react';
import facilitiesData from '../mockData/facilities.json';
import { VRViewerModal } from '../components/VRViewerModal';
import { KakaoMapModal } from '../components/KakaoMapModal';

interface FacilityPageProps {
  currentUser?: string | null;
  onOpenLogin?: () => void;
}

export const FacilityPage: React.FC<FacilityPageProps> = ({ currentUser, onOpenLogin }) => {
  // 모달 상태
  const [selectedMapFacility, setSelectedMapFacility] = useState<any | null>(null);
  const [selectedVRFacility, setSelectedVRFacility] = useState<any | null>(null);
  const [selectedPriceFacility, setSelectedPriceFacility] = useState<any | null>(null);
  const [bookingFacilityName, setBookingFacilityName] = useState<string | null>(null);

  // 긴급 출동 타임라인 모달 상태
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);

  // 위치 및 LBS 필터 상태
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [lbsRadius, setLbsRadius] = useState<string>('전체'); // 전체, 5km, 10km, 20km

  // 필터 상태
  const [category, setCategory] = useState('전체');
  const [region, setRegion] = useState('전체');
  const [religion, setReligion] = useState('전체');
  const [guestCount, setGuestCount] = useState('전체');
  const [budget, setBudget] = useState('전체');

  // 답사 예약 폼 상태
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('14:00');
  const [bookingCount, setBookingCount] = useState('2');
  const [bookingNote, setBookingNote] = useState('');

  // 사용자의 현위치 자동 감지 (Geolocation API)
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
        },
        () => {
          // Default fallback location (서울 서초)
          setUserLocation({ lat: 37.4925, lng: 127.0078 });
        }
      );
    } else {
      setUserLocation({ lat: 37.4925, lng: 127.0078 });
    }
  }, []);

  // 거리 계산 함수 (Haversine formula)
  const calculateDist = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const facilities = facilitiesData;

  const handleBookVisitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      alert('⚠️ 답사 예약은 로그인 후 이용하실 수 있습니다.');
      onOpenLogin?.();
      return;
    }
    alert(`🎉 [${bookingFacilityName}] 답사 예약 신청이 완료되었습니다!\n\n일시: ${bookingDate} ${bookingTime}\n인원: ${bookingCount}명\n배정된 웰다잉 전문 코디네이터가 30분 이내 해피콜을 드립니다.`);
    setBookingFacilityName(null);
  };

  // 필터링 적용
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

    // LBS 반경 거리 필터링
    if (lbsRadius !== '전체' && userLocation && f.lat && f.lng) {
      const dist = calculateDist(userLocation.lat, userLocation.lng, f.lat, f.lng);
      const maxDist = parseInt(lbsRadius.replace('km', ''), 10);
      if (dist > maxDist) return false;
    }

    return true;
  });

  return (
    <div className="container" style={{ paddingBottom: '4rem' }}>
      {/* 히어로 헤더 */}
      <div
        style={{
          marginBottom: '2.5rem',
          backgroundColor: 'var(--primary-color)',
          color: '#FFFFFF',
          padding: '2.5rem',
          borderRadius: '24px',
          boxShadow: 'var(--box-shadow)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '750px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'rgba(217, 119, 6, 0.25)', color: 'var(--accent-gold)', padding: '0.4rem 0.9rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 700, marginBottom: '1rem' }}>
            <Sparkles size={16} /> LBS 카카오맵 & 360° VR 파노라마 통합 솔루션
          </div>
          <h1 style={{ fontSize: '2.3rem', fontWeight: 800, marginBottom: '0.8rem', color: '#FFFFFF', lineHeight: '1.2' }}>
            장례·묘지 맞춤 비교 매칭 및 VR 답사
          </h1>
          <p style={{ fontSize: '1.05rem', color: '#CBD5E1', lineHeight: '1.6', margin: 0 }}>
            현재 위치 기반 반경 탐색, 카카오맵 LBS 핀 마커 연동, 360도 사이버 공간 투어 및 1-Touch 24시간 긴급 출동 지원을 만나보세요.
          </p>
        </div>

        <button
          onClick={() => setShowEmergencyModal(true)}
          style={{
            position: 'absolute',
            top: '2.5rem',
            right: '2.5rem',
            backgroundColor: 'var(--accent-red)',
            color: '#FFF',
            border: 'none',
            padding: '0.9rem 1.4rem',
            borderRadius: '16px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            boxShadow: '0 10px 20px rgba(239, 68, 68, 0.4)',
            zIndex: 3
          }}
        >
          <PhoneCall size={20} className="animate-pulse" /> 24시간 긴급 출동 요청
        </button>
      </div>

      {/* 스마트 멀티 스펙 필터 바 */}
      <div
        style={{
          backgroundColor: 'var(--card-bg)',
          padding: '1.8rem',
          borderRadius: '20px',
          marginBottom: '2.5rem',
          boxShadow: 'var(--box-shadow)',
          border: '1px solid var(--border-color)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.2rem', color: 'var(--primary-color)', fontWeight: 700 }}>
          <Filter size={20} color="var(--point-color)" /> 조건별 맞춤 필터링
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '1.2rem'
          }}
        >
          {/* LBS 반경 거리 */}
          <div>
            <label className="form-label">📍 내 위치 기준 반경</label>
            <select value={lbsRadius} onChange={(e) => setLbsRadius(e.target.value)} className="form-select">
              <option value="전체">전체 반경 (전국)</option>
              <option value="5km">반경 5km 이내</option>
              <option value="10km">반경 10km 이내</option>
              <option value="20km">반경 20km 이내</option>
            </select>
          </div>

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
              <option value="100명 미만">100명 미만 (가족장)</option>
              <option value="100~300명">100명 ~ 300명</option>
              <option value="300명 이상">300명 이상 (대규모)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 시설 카드 목록 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0 }}>
          총 <strong style={{ color: 'var(--primary-color)' }}>{filteredFacilities.length}개</strong> 시설이 검색되었습니다.
        </p>
      </div>

      <div className="grid">
        {filteredFacilities.map((item) => {
          // 사용자 위치와의 거리 계산
          const distKm = userLocation && item.lat && item.lng ? calculateDist(userLocation.lat, userLocation.lng, item.lat, item.lng).toFixed(1) : null;

          return (
            <div key={item.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', backgroundColor: 'var(--secondary-color)', padding: '0.3rem 0.6rem', borderRadius: '6px', fontWeight: 700, color: 'var(--primary-color)' }}>
                    {item.type}
                  </span>
                  {distKm && (
                    <span style={{ fontSize: '0.75rem', backgroundColor: '#FEF3C7', color: '#D97706', padding: '0.25rem 0.5rem', borderRadius: '6px', fontWeight: 700 }}>
                      📍 {distKm} km
                    </span>
                  )}
                </div>
                <span style={{ fontWeight: 'bold', color: 'var(--point-color)' }}>★ {item.rating}</span>
              </div>

              <h3 style={{ fontSize: '1.25rem', color: 'var(--primary-color)', marginBottom: '0.4rem', fontWeight: 700 }}>{item.name}</h3>

              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.4rem' }}>
                <MapPin size={16} color="var(--point-color)" /> {item.location}
              </p>

              <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '0.8rem' }}>
                • 종교: {item.religion} | • 하객: {item.guests}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', backgroundColor: 'var(--card-bg)', padding: '0.6rem 0.8rem', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>예상 기본 비용</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--point-color)' }}>{item.price}</span>
              </div>

              {/* 태그 목록 */}
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.2rem' }}>
                {item.tags.map((tag, idx) => (
                  <span key={idx} style={{ fontSize: '0.75rem', backgroundColor: '#EAE5DC', padding: '0.2rem 0.5rem', borderRadius: '4px', color: '#444' }}>
                    #{tag}
                  </span>
                ))}
              </div>

              {/* 액션 버튼 그룹 */}
              <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  {/* 360도 VR 버튼 */}
                  <button
                    onClick={() => setSelectedVRFacility(item)}
                    className="btn"
                    style={{
                      flex: 1,
                      backgroundColor: 'var(--primary-color)',
                      color: '#FFFFFF',
                      fontSize: '0.85rem',
                      padding: '0.6rem 0.4rem',
                      whiteSpace: 'nowrap',
                      gap: '0.3rem',
                      fontWeight: 700
                    }}
                  >
                    <Eye size={16} color="var(--accent-gold)" /> 360° VR 둘러보기
                  </button>

                  {/* 카카오맵 지도 버튼 */}
                  <button
                    onClick={() => setSelectedMapFacility(item)}
                    className="btn"
                    style={{
                      flex: 1,
                      backgroundColor: '#FEE500',
                      color: '#191919',
                      fontSize: '0.85rem',
                      padding: '0.6rem 0.4rem',
                      whiteSpace: 'nowrap',
                      gap: '0.3rem',
                      fontWeight: 700
                    }}
                  >
                    <Map size={16} /> 카카오 지도
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  {/* 상세 견적서 버튼 */}
                  <button
                    onClick={() => setSelectedPriceFacility(item)}
                    className="btn"
                    style={{
                      flex: 1,
                      backgroundColor: 'var(--secondary-color)',
                      color: 'var(--primary-color)',
                      fontSize: '0.85rem',
                      padding: '0.6rem 0.4rem',
                      whiteSpace: 'nowrap',
                      gap: '0.3rem',
                      fontWeight: 700
                    }}
                  >
                    <Calculator size={16} /> 견적 비교
                  </button>

                  {/* 답사 예약 버튼 */}
                  <button
                    onClick={() => setBookingFacilityName(item.name)}
                    className="btn btn-primary"
                    style={{
                      flex: 1,
                      fontSize: '0.85rem',
                      padding: '0.6rem 0.4rem',
                      whiteSpace: 'nowrap',
                      gap: '0.3rem',
                      fontWeight: 700
                    }}
                  >
                    <CalendarCheck size={16} /> 답사 예약
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 360° VR 뷰어 모달 */}
      {selectedVRFacility && (
        <VRViewerModal
          facilityName={selectedVRFacility.name}
          scenes={selectedVRFacility.vrImages || [
            { id: 'default', title: '시설 메인 전경', url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1600&q=80' }
          ]}
          onClose={() => setSelectedVRFacility(null)}
        />
      )}

      {/* 카카오맵 LBS 모달 */}
      {selectedMapFacility && (
        <KakaoMapModal
          facility={selectedMapFacility}
          userLocation={userLocation}
          onClose={() => setSelectedMapFacility(null)}
        />
      )}

      {/* 표준 공시 견적 비교 모달 */}
      {selectedPriceFacility && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 2100,
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
              maxWidth: '550px',
              width: '100%',
              position: 'relative'
            }}
          >
            <button
              onClick={() => setSelectedPriceFacility(null)}
              style={{ position: 'absolute', top: '1.2rem', right: '1.2rem', border: 'none', background: 'none', cursor: 'pointer' }}
            >
              <X size={22} />
            </button>
            <h3 style={{ color: 'var(--primary-color)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calculator color="var(--point-color)" /> [{selectedPriceFacility.name}] 세부 가격 공시표
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              보건복지부 e하늘 장사정보시스템 표준 공시 가격 기준 (투명 견적 보증)
            </p>

            <div style={{ backgroundColor: 'var(--card-bg)', padding: '1.2rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
              {selectedPriceFacility.detailedPrices ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.9rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>• 빈소 사용료 (2일 기준):</span>
                    <strong>{selectedPriceFacility.detailedPrices.facilityFee}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>• 관 (Casket) 비용:</span>
                    <strong>{selectedPriceFacility.detailedPrices.casketFee}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>• 수의 (Shroud) 비용:</span>
                    <strong>{selectedPriceFacility.detailedPrices.shroudFee}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>• 상복 및 유족 용품:</span>
                    <strong>{selectedPriceFacility.detailedPrices.mourningDress}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>• 제단 생화 장식:</span>
                    <strong>{selectedPriceFacility.detailedPrices.altarFlower}</strong>
                  </div>
                  <hr style={{ border: 'none', borderTop: '1px dashed #CBD5E1', margin: '0.5rem 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', color: 'var(--point-color)', fontWeight: 800 }}>
                    <span>총 예상 소요 견적:</span>
                    <span>{selectedPriceFacility.detailedPrices.totalEst}</span>
                  </div>
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', margin: 0 }}>기본 팩 500만원 ~ 850만원 예상</p>
              )}
            </div>

            <button onClick={() => setSelectedPriceFacility(null)} className="btn btn-primary" style={{ width: '100%' }}>
              확인 닫기
            </button>
          </div>
        </div>
      )}

      {/* 답사 예약 모달 */}
      {bookingFacilityName && (
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
              onClick={() => setBookingFacilityName(null)}
              style={{ position: 'absolute', top: '1.2rem', right: '1.2rem', border: 'none', background: 'none', cursor: 'pointer' }}
            >
              <X size={22} />
            </button>

            <h3 style={{ color: 'var(--primary-color)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CalendarCheck color="var(--point-color)" /> [{bookingFacilityName}] 답사 예약
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              전담 웰다잉 지도사가 동행하여 시설 안내 및 할인 혜택 상담을 도와드립니다.
            </p>

            <form onSubmit={handleBookVisitSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                <button type="button" onClick={() => setBookingFacilityName(null)} className="btn" style={{ flex: 1, backgroundColor: '#E2E8F0' }}>
                  취소
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  예약 신청 완료
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 24시간 긴급 출동 요청 타임라인 모달 */}
      {showEmergencyModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(10px)',
            zIndex: 3000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '24px',
              padding: '2.5rem',
              maxWidth: '600px',
              width: '100%',
              position: 'relative'
            }}
          >
            <button
              onClick={() => setShowEmergencyModal(false)}
              style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', border: 'none', background: 'none', cursor: 'pointer' }}
            >
              <X size={24} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ width: '60px', height: '60px', backgroundColor: '#FEE2E2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                <PhoneCall size={32} color="var(--accent-red)" className="animate-pulse" />
              </div>
              <h3 style={{ fontSize: '1.6rem', color: 'var(--primary-color)', fontWeight: 800 }}>🚨 24시간 긴급 장례 지원 센터</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>임종 직후 1-Touch 원클릭으로 15분 내 전담 장례지도사 배정</p>
            </div>

            {/* 4단계 프로세스 타임라인 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ backgroundColor: 'var(--accent-red)', color: '#FFF', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>
                  1
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--primary-color)', fontWeight: 700 }}>긴급 접수 & 위치 확인</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>GPS 위치 파악 및 앰뷸런스 운구차 즉시 배차 조치</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ backgroundColor: 'var(--point-color)', color: '#FFF', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>
                  2
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--primary-color)', fontWeight: 700 }}>1:1 전담 장례지도사 전화 연결</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>병원/자택 안치 수속 및 사망진단서 수령 가이드</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ backgroundColor: 'var(--primary-color)', color: '#FFF', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>
                  3
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--primary-color)', fontWeight: 700 }}>희망 장례식장 안치실 우선 예약</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>실시간 빈소 잔여 현황 조회 후 맞춤 안치 연결</p>
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: '#FEF2F2', padding: '1rem', borderRadius: '12px', border: '1px solid #FCA5A5', textAlign: 'center', marginBottom: '1.5rem' }}>
              <p style={{ margin: 0, fontWeight: 700, color: '#991B1B', fontSize: '1.1rem' }}>📞 직통 대표전화: 1588-0000 (24시간 무료)</p>
            </div>

            <button onClick={() => alert('🚨 긴급 센터로 자동 다이얼 연결 중입니다...')} className="btn" style={{ width: '100%', backgroundColor: 'var(--accent-red)', color: '#FFF', padding: '1rem', fontSize: '1.1rem', fontWeight: 800 }}>
              전화 연결하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
