import React, { useState, useEffect } from 'react';
import { ShieldCheck, MapPin, Map, CalendarCheck, PhoneCall, Sparkles, Filter, Calculator, MessageSquare } from 'lucide-react';
import { BACKEND_URL } from '../config';
import { KakaoMapModal } from '../components/KakaoMapModal';
import { PriceCompareModal } from '../components/facility/PriceCompareModal';
import { BookingModal } from '../components/facility/BookingModal';
import { FacilityReviewModal } from '../components/facility/FacilityReviewModal';
import { HouseLeafIcon } from '../components/MenuIcons';

interface FacilityPageProps {
  currentUser?: string | null;
  onOpenLogin?: () => void;
}

export const FacilityPage: React.FC<FacilityPageProps> = ({ currentUser, onOpenLogin }) => {
  // 터치 기반(모바일/태블릿) 기기인지 판별 — 데스크톱은 tel: 링크를 눌러도 통화가 안 되므로 번호만 노출
  const [isTouchDevice] = useState(() => window.matchMedia('(hover: none) and (pointer: coarse)').matches);
  // 데스크톱에서 전화 버튼에 마우스오버 시 번호를 보여줄 커스텀 툴팁 (네이티브 title 속성은 지연/미표시 이슈가 있어 직접 구현)
  const [hoveredPhoneId, setHoveredPhoneId] = useState<string | null>(null);

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

  // 위치 상태 (반경 필터 대신 항상 이 위치 기준 가까운 순으로 정렬)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationName, setLocationName] = useState<string>('위치 확인 중...');
  const [regionsData, setRegionsData] = useState<Record<string, string[]>>({});
  const [locationProvince, setLocationProvince] = useState('');
  const [locationDistrict, setLocationDistrict] = useState('');
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

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
  }, [category, region, religion, guestCount, budget, userLocation, page]);

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

  const goToPage = (p: number) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 사용자의 현위치 자동 감지 (Geolocation API) — "선택 안함" 시 되돌아갈 기본 위치로도 보관
  const [detectedLocation, setDetectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  useEffect(() => {
    const applyDetected = (loc: { lat: number; lng: number }) => {
      setUserLocation(loc);
      setDetectedLocation(loc);
    };
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => applyDetected({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => applyDetected({ lat: 37.4925, lng: 127.0078 }) // Default fallback location (서울 서초)
      );
    } else {
      applyDetected({ lat: 37.4925, lng: 127.0078 });
    }
  }, []);

  // 현위치가 바뀔 때마다(최초 감지 + 시/군/구 선택으로 변경) 대략적인 지역명으로 역지오코딩해서 표시
  useEffect(() => {
    if (!userLocation) return;
    fetch(`${BACKEND_URL}/api/geo/reverse?lat=${userLocation.lat}&lng=${userLocation.lng}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'success') setLocationName(data.data.region);
      })
      .catch(() => {
        setLocationName('위치 확인 실패');
      });
  }, [userLocation]);

  // 시/도 -> 시/군/구 선택 옵션 목록 (실제 보유 시설 데이터 기반)
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/geo/regions`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'success') setRegionsData(data.data);
      })
      .catch(() => {
        // 실패해도 필터/목록 조회에는 영향 없음
      });
  }, []);

  const provinceOptions = Object.keys(regionsData).sort((a, b) => a.localeCompare(b, 'ko'));
  const districtOptions = locationProvince ? regionsData[locationProvince] || [] : [];

  const handleProvinceChange = (value: string) => {
    setLocationProvince(value);
    setLocationDistrict('');
  };

  // 시/군/구까지 선택되면 그 지역명으로 지오코딩해서 기준 위치를 변경. "선택 안함"이면 자동 감지된 위치로 복귀
  const handleDistrictChange = async (value: string) => {
    setLocationDistrict(value);
    if (!value) {
      setLocationProvince('');
      setLocationError(null);
      if (detectedLocation) {
        setUserLocation(detectedLocation);
        setPage(1);
      }
      return;
    }

    setIsSearchingLocation(true);
    setLocationError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/geo/geocode?query=${encodeURIComponent(`${locationProvince} ${value}`)}`);
      const data = await res.json();
      if (!res.ok || data.status !== 'success') {
        setLocationError(data.message || '해당 위치를 찾을 수 없습니다.');
        return;
      }
      setUserLocation({ lat: data.data.lat, lng: data.data.lng });
      setPage(1);
    } catch (e) {
      setLocationError('위치 검색 중 오류가 발생했습니다.');
    } finally {
      setIsSearchingLocation(false);
    }
  };

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
            현재 위치 기반 반경 탐색, 카카오맵 LBS 핀 마커 연동, 360도 사이버 공간 투어를 만나보세요.
          </p>
        </div>
      </div>

      {/* 위치 표시 및 변경 */}
      <div
        style={{
          backgroundColor: 'var(--card-bg)',
          padding: '1.2rem 1.5rem',
          borderRadius: '16px',
          marginBottom: '1.2rem',
          boxShadow: 'var(--box-shadow)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary-color)', fontWeight: 700, whiteSpace: 'nowrap' }}>
          <MapPin size={18} color="var(--point-color)" /> 위치: {locationName}
        </div>
        <div style={{ display: 'flex', gap: '0.8rem' }}>
          <select value={locationProvince} onChange={(e) => handleProvinceChange(e.target.value)} className="form-select" style={{ width: '250px' }}>
            <option value="">시/도 선택</option>
            {provinceOptions.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <select
            value={locationDistrict}
            onChange={(e) => handleDistrictChange(e.target.value)}
            disabled={!locationProvince || isSearchingLocation}
            className="form-select"
            style={{ width: '250px' }}
          >
            <option value="">선택 안함</option>
            {districtOptions.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        {locationError && <p style={{ color: '#DC2626', fontSize: '0.8rem', margin: 0, width: '100%' }}>{locationError}</p>}
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
                  {/* 전화 버튼 (실데이터 수집된 시설만 노출) — 모바일은 탭하면 바로 통화, 데스크톱은 마우스오버 시 번호만 툴팁으로 표시 */}
                  {item.phone && (
                    isTouchDevice ? (
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
                        <PhoneCall size={16} /> 전화
                      </a>
                    ) : (
                      <span
                        onMouseEnter={() => setHoveredPhoneId(item.id)}
                        onMouseLeave={() => setHoveredPhoneId((prev) => (prev === item.id ? null : prev))}
                        className="btn"
                        style={{
                          position: 'relative',
                          flex: '1 1 0',
                          minWidth: '100px',
                          backgroundColor: '#ECFDF5',
                          color: '#059669',
                          fontSize: '0.85rem',
                          padding: '0.6rem 0.4rem',
                          whiteSpace: 'nowrap',
                          gap: '0.3rem',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'default'
                        }}
                      >
                        <PhoneCall size={16} /> 전화
                        {hoveredPhoneId === item.id && (
                          <span
                            style={{
                              position: 'absolute',
                              bottom: 'calc(100% + 6px)',
                              left: '50%',
                              transform: 'translateX(-50%)',
                              backgroundColor: '#111827',
                              color: '#FFFFFF',
                              padding: '0.35rem 0.7rem',
                              borderRadius: '6px',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              whiteSpace: 'nowrap',
                              zIndex: 10,
                              boxShadow: '0 4px 10px rgba(0,0,0,0.25)'
                            }}
                          >
                            {item.phone}
                          </span>
                        )}
                      </span>
                    )
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
    </div>
  );
};
