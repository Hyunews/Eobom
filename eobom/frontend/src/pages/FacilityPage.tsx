import React, { useState, useEffect } from 'react';
import { ShieldCheck, MapPin, Map, CalendarCheck, PhoneCall, Sparkles, Filter, Calculator, MessageSquare } from 'lucide-react';
import { BACKEND_URL } from '../config';
import { KakaoMapModal } from '../components/KakaoMapModal';
import { PriceCompareModal } from '../components/facility/PriceCompareModal';
import { BookingModal } from '../components/facility/BookingModal';
import { EmergencyModal } from '../components/facility/EmergencyModal';
import { FacilityReviewModal } from '../components/facility/FacilityReviewModal';
import { HouseLeafIcon } from '../components/MenuIcons';

interface FacilityPageProps {
  currentUser?: string | null;
  onOpenLogin?: () => void;
}

export const FacilityPage: React.FC<FacilityPageProps> = ({ currentUser, onOpenLogin }) => {
  // 시설 목록 (백엔드 API 연동, 서버사이드 필터링 + 페이지네이션)
  const [facilities, setFacilities] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 30;

  // 모달 상태
  const [selectedMapFacility, setSelectedMapFacility] = useState<any | null>(null);
  const [selectedPriceFacility, setSelectedPriceFacility] = useState<any | null>(null);
  const [bookingFacility, setBookingFacility] = useState<any | null>(null);
  const [reviewFacility, setReviewFacility] = useState<any | null>(null);

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

  // 필터/페이지 변경 시 서버에 조건 그대로 위임해서 재조회
  useEffect(() => {
    const params = new URLSearchParams();
    if (category !== '전체') params.set('category', category);
    if (region !== '전체') params.set('region', region);
    if (religion !== '전체') params.set('religion', religion);
    if (guestCount !== '전체') params.set('guests', guestCount);
    if (budget !== '전체') params.set('budget', budget);
    if (lbsRadius !== '전체') params.set('radius', lbsRadius);
    if (userLocation) {
      params.set('lat', String(userLocation.lat));
      params.set('lng', String(userLocation.lng));
    }
    params.set('page', String(page));
    params.set('pageSize', String(PAGE_SIZE));

    fetch(`${BACKEND_URL}/api/facilities?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'success') {
          setFacilities(data.data);
          setTotalCount(data.count);
          setTotalPages(data.totalPages);
        }
      })
      .catch(() => {
        // 조회 실패 시 빈 목록으로 유지 (필터 UI는 정상 노출)
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, region, religion, guestCount, budget, lbsRadius, userLocation, page]);

  // 필터 select의 onChange에서 값 변경과 함께 page를 1로 리셋해주는 헬퍼
  const withPageReset = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };
  const handleCategoryChange = withPageReset(setCategory);
  const handleRegionChange = withPageReset(setRegion);
  const handleReligionChange = withPageReset(setReligion);
  const handleGuestCountChange = withPageReset(setGuestCount);
  const handleBudgetChange = withPageReset(setBudget);
  const handleLbsRadiusChange = withPageReset(setLbsRadius);

  const goToPage = (p: number) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

  // 리뷰 작성 완료 시 해당 시설의 리뷰/평점을 목록 + 열려있는 리뷰 모달에 즉시 반영
  const handleReviewSubmitted = (updatedFacility: any) => {
    setFacilities((prev) => prev.map((f) => (f.id === updatedFacility.id ? updatedFacility : f)));
    setReviewFacility(updatedFacility);
  };

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
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(212, 163, 89, 0.25)', color: 'var(--accent-gold)', padding: '0.4rem 0.9rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 700, marginBottom: '1rem' }}>
            <HouseLeafIcon size={18} color="var(--accent-gold)" /> 집 &amp; 나뭇잎 | 봉안당·수목장 맞춤 검색 및 장례식장 맞춤 매칭
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
            <select value={lbsRadius} onChange={(e) => handleLbsRadiusChange(e.target.value)} className="form-select">
              <option value="전체">전체 반경 (전국)</option>
              <option value="5km">반경 5km 이내</option>
              <option value="10km">반경 10km 이내</option>
              <option value="20km">반경 20km 이내</option>
            </select>
          </div>

          <div>
            <label className="form-label">구분</label>
            <select value={category} onChange={(e) => handleCategoryChange(e.target.value)} className="form-select">
              <option value="전체">전체 (장례식장/묘지)</option>
              <option value="장례식장">장례식장</option>
              <option value="묘지/수목장">묘지/봉안당/수목장</option>
            </select>
          </div>

          <div>
            <label className="form-label">예산 범위</label>
            <select value={budget} onChange={(e) => handleBudgetChange(e.target.value)} className="form-select">
              <option value="전체">전체 예산</option>
              <option value="500이하">500만원 이하</option>
              <option value="500_1000">500만원 ~ 1,000만원</option>
              <option value="1000이상">1,000만원 이상</option>
            </select>
          </div>

          <div>
            <label className="form-label">지역 선택</label>
            <select value={region} onChange={(e) => handleRegionChange(e.target.value)} className="form-select">
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
            <select value={religion} onChange={(e) => handleReligionChange(e.target.value)} className="form-select">
              <option value="전체">전체 종교</option>
              <option value="무교">무교 (일반)</option>
              <option value="기독교">기독교</option>
              <option value="천주교">천주교</option>
              <option value="불교">불교</option>
            </select>
          </div>

          <div>
            <label className="form-label">예상 하객 수</label>
            <select value={guestCount} onChange={(e) => handleGuestCountChange(e.target.value)} className="form-select">
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
          총 <strong style={{ color: 'var(--primary-color)' }}>{totalCount}개</strong> 시설이 검색되었습니다. ({page}/{totalPages} 페이지)
        </p>
      </div>

      <div className="grid">
        {facilities.map((item) => {
          const distKm = typeof item.distanceKm === 'number' ? item.distanceKm.toFixed(1) : null;

          return (
            <div key={item.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', backgroundColor: 'var(--secondary-color)', padding: '0.3rem 0.6rem', borderRadius: '6px', fontWeight: 700, color: 'var(--primary-color)' }}>
                    {item.type}
                  </span>
                  {distKm && (
                    <span style={{ fontSize: '0.75rem', backgroundColor: '#FEF3C7', color: 'var(--accent-gold)', padding: '0.25rem 0.5rem', borderRadius: '6px', fontWeight: 700 }}>
                      📍 {distKm} km
                    </span>
                  )}
                </div>
                <span style={{ fontWeight: 'bold', color: 'var(--point-color)' }}>★ {item.effectiveRating ?? item.rating}</span>
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
                {item.tags.map((tag: string, idx: number) => (
                  <span key={idx} style={{ fontSize: '0.75rem', backgroundColor: '#EAE5DC', padding: '0.2rem 0.5rem', borderRadius: '4px', color: '#444' }}>
                    #{tag}
                  </span>
                ))}
              </div>

              {/* 액션 버튼 그룹 */}
              <div style={{ marginTop: 'auto', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {/* 전화 문의 버튼 (실데이터 수집된 시설만 노출) */}
                  {item.phone && (
                    <a
                      href={`tel:${item.phone}`}
                      className="btn"
                      style={{
                        flex: '1 1 0',
                        minWidth: '100px',
                        backgroundColor: '#ECFDF5',
                        color: '#059669',
                        fontSize: '0.85rem',
                        padding: '0.6rem 0.4rem',
                        whiteSpace: 'nowrap',
                        gap: '0.3rem',
                        fontWeight: 700,
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <PhoneCall size={16} /> 전화 문의
                    </a>
                  )}

                  {/* 카카오맵 지도 버튼 */}
                  <button
                    onClick={() => setSelectedMapFacility(item)}
                    className="btn"
                    style={{
                      flex: '1 1 0',
                      minWidth: '100px',
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

                  {/* 상세 견적서 버튼 */}
                  <button
                    onClick={() => setSelectedPriceFacility(item)}
                    className="btn"
                    style={{
                      flex: '1 1 0',
                      minWidth: '100px',
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
                    onClick={() => setBookingFacility(item)}
                    className="btn btn-primary"
                    style={{
                      flex: '1 1 0',
                      minWidth: '100px',
                      fontSize: '0.85rem',
                      padding: '0.6rem 0.4rem',
                      whiteSpace: 'nowrap',
                      gap: '0.3rem',
                      fontWeight: 700
                    }}
                  >
                    <CalendarCheck size={16} /> 답사 예약
                  </button>

                  {/* 리뷰 버튼 */}
                  <button
                    onClick={() => setReviewFacility(item)}
                    className="btn"
                    style={{
                      flex: '1 1 0',
                      minWidth: '100px',
                      backgroundColor: 'var(--card-bg)',
                      color: 'var(--primary-color)',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.85rem',
                      padding: '0.6rem 0.4rem',
                      whiteSpace: 'nowrap',
                      gap: '0.3rem',
                      fontWeight: 700
                    }}
                  >
                    <MessageSquare size={16} /> 리뷰 {item.reviews?.length ? `(${item.reviews.length})` : ''}
                  </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem', marginTop: '2rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => goToPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="btn"
            style={{ padding: '0.5rem 0.9rem', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', color: 'var(--primary-color)', opacity: page === 1 ? 0.5 : 1 }}
          >
            이전
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => Math.abs(p - page) <= 2 || p === 1 || p === totalPages)
            .reduce<number[]>((acc, p) => {
              if (acc.length > 0 && p - acc[acc.length - 1] > 1) acc.push(-1); // 생략 표시(...)용 구분자
              acc.push(p);
              return acc;
            }, [])
            .map((p, idx) =>
              p === -1 ? (
                <span key={`ellipsis-${idx}`} style={{ padding: '0.5rem 0.3rem', color: 'var(--text-muted)' }}>
                  …
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => goToPage(p)}
                  className="btn"
                  style={{
                    padding: '0.5rem 0.9rem',
                    backgroundColor: p === page ? 'var(--primary-color)' : 'var(--card-bg)',
                    color: p === page ? '#FFFFFF' : 'var(--primary-color)',
                    border: '1px solid var(--border-color)',
                    fontWeight: p === page ? 700 : 400
                  }}
                >
                  {p}
                </button>
              )
            )}
          <button
            onClick={() => goToPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="btn"
            style={{ padding: '0.5rem 0.9rem', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', color: 'var(--primary-color)', opacity: page === totalPages ? 0.5 : 1 }}
          >
            다음
          </button>
        </div>
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
        <PriceCompareModal
          facility={selectedPriceFacility}
          onClose={() => setSelectedPriceFacility(null)}
          onOpenBooking={() => setBookingFacility(selectedPriceFacility)}
        />
      )}

      {/* 답사 예약 모달 */}
      {bookingFacility && (
        <BookingModal
          facilityId={bookingFacility.id}
          facilityName={bookingFacility.name}
          currentUser={currentUser}
          onOpenLogin={onOpenLogin}
          onClose={() => setBookingFacility(null)}
        />
      )}

      {/* 시설 리뷰 모달 */}
      {reviewFacility && (
        <FacilityReviewModal
          facility={reviewFacility}
          currentUser={currentUser}
          onOpenLogin={onOpenLogin}
          onClose={() => setReviewFacility(null)}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}

      {/* 24시간 긴급 출동 요청 타임라인 모달 */}
      {showEmergencyModal && (
        <EmergencyModal onClose={() => setShowEmergencyModal(false)} />
      )}
    </div>
  );
};
