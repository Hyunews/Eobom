import React, { useState, useEffect } from 'react';
import { MapPin, Map, Image as ImageIcon, Send, MessageSquare } from 'lucide-react';
import { BACKEND_URL, GEOLOCATION_FALLBACK } from '../config';
import { KakaoMapModal } from '../components/KakaoMapModal';
import { InquiryModal } from '../components/facility/InquiryModal';
import { FacilityReviewModal } from '../components/facility/FacilityReviewModal';
import { HouseLeafIcon } from '../components/MenuIcons';
import { TAG_CATALOG, isFilterableTag } from '../components/facility/tagCatalog';

interface FacilityPageProps {
  currentUser?: string | null;
  onOpenLogin?: () => void;
}

// 2026-08-10 대표 지시로 대폭 개편:
// - 필터: 예산/종교/하객수/지역(대분류) 삭제 → 위치(시/도·시/군/구, 거리순 정렬)+구분만 남기고 한 섹션으로 병합
// - 전화번호 비노출: 직통 전화 대신 "업체 문의"(InquiryModal, 견적요청 리드) 폼으로 유도
// - 견적비교·답사예약 삭제 → 업체 문의로 대체
// - 이미지 박스 추가: 파트너가 BizDashboard에서 올린 Facility.images 노출
export const FacilityPage: React.FC<FacilityPageProps> = ({ currentUser, onOpenLogin }) => {
  // 시설 목록 (백엔드 API 연동, 서버사이드 필터링 + 페이지네이션)
  const [facilities, setFacilities] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 30;

  // 모달 상태
  const [selectedMapFacility, setSelectedMapFacility] = useState<any | null>(null);
  const [inquiryFacility, setInquiryFacility] = useState<any | null>(null);
  const [reviewFacility, setReviewFacility] = useState<any | null>(null);

  // 위치 상태 (반경 필터 대신 항상 이 위치 기준 가까운 순으로 정렬)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationName, setLocationName] = useState<string>('위치 확인 중...');
  const [regionsData, setRegionsData] = useState<Record<string, string[]>>({});
  const [locationProvince, setLocationProvince] = useState('');
  const [locationDistrict, setLocationDistrict] = useState('');
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // 필터 상태 — 구분(예산/종교/하객수/지역 대분류 삭제, 2026-08-10) + 태그(운영주체 등, 2026-08-10 추가)
  const [category, setCategory] = useState('전체');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // 필터/페이지 변경 시 서버에 조건 그대로 위임해서 재조회
  useEffect(() => {
    const params = new URLSearchParams();
    if (category !== '전체') params.set('category', category);
    if (selectedTag) params.set('tag', selectedTag);
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
  }, [category, selectedTag, userLocation, page]);

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    setPage(1);
  };

  // 카드의 태그를 클릭하면 그 태그로 필터, 이미 선택된 태그를 다시 누르면 해제(토글)
  const handleTagClick = (tag: string) => {
    setSelectedTag((prev) => (prev === tag ? null : tag));
    setPage(1);
  };

  const goToPage = (p: number) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 사용자의 현위치 자동 감지 (Geolocation API) — "선택 안함" 시 되돌아갈 기본 위치로도 보관
  const [detectedLocation, setDetectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  // 위치 API가 실패해 기본값(서울 서초)으로 대체됐는지 — 이 경우 실제 위치가 아니므로 UI에 반드시 알린다
  const [isLocationFallback, setIsLocationFallback] = useState(false);
  useEffect(() => {
    const applyDetected = (loc: { lat: number; lng: number }, isFallback: boolean) => {
      setUserLocation(loc);
      setDetectedLocation(loc);
      setIsLocationFallback(isFallback);
    };
    // Geolocation API는 보안 컨텍스트(HTTPS 또는 localhost)에서만 동작한다.
    // http://<LAN IP>:5173처럼 암호화 없는 일반 IP로 접속하면 브라우저가 요청 자체를 거부해
    // 아래 실패 콜백으로 떨어진다 — 코드 버그가 아니라 브라우저 보안 정책이다.
    if (navigator.geolocation && window.isSecureContext) {
      navigator.geolocation.getCurrentPosition(
        (pos) => applyDetected({ lat: pos.coords.latitude, lng: pos.coords.longitude }, false),
        () => applyDetected(GEOLOCATION_FALLBACK, true)
      );
    } else {
      applyDetected(GEOLOCATION_FALLBACK, true);
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
      setIsLocationFallback(false); // 사용자가 직접 지정한 위치이므로 더 이상 기본값이 아님
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
    <div className="container" style={{ paddingBottom: '3rem' }}>
      {/* 히어로 헤더 */}
      <div
        style={{
          marginBottom: '1.75rem',
          backgroundColor: 'var(--primary-color)',
          color: '#FFFFFF',
          padding: '1.75rem',
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
            장례·묘지 맞춤 비교 매칭
          </h1>
          <p style={{ fontSize: '1.05rem', color: '#CBD5E1', lineHeight: '1.6', margin: 0 }}>
            현재 위치 기반 거리순 정렬과 카카오맵 LBS 핀 마커 연동을 만나보세요.
          </p>
        </div>
      </div>

      {/* 위치 + 구분 (2026-08-10 병합 — 예산/종교/하객수/지역 대분류 필터는 삭제) */}
      <div
        style={{
          backgroundColor: 'var(--card-bg)',
          padding: '1.1rem',
          borderRadius: '20px',
          marginBottom: '1.75rem',
          boxShadow: 'var(--box-shadow)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-end',
          gap: '1.2rem'
        }}
      >
        <div style={{ flex: '2 1 320px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary-color)', fontWeight: 700, marginBottom: '0.6rem' }}>
            <MapPin size={18} color="var(--point-color)" /> 위치: {locationName}
            {isLocationFallback && (
              <span
                title="실제 위치를 확인하지 못해 기본 위치로 표시 중입니다. https 또는 localhost가 아닌 주소에서는 브라우저가 위치 확인을 차단합니다. 아래에서 시/도·시/군/구를 직접 선택해주세요."
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: '#92400E',
                  backgroundColor: '#FEF3C7',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '10px',
                  cursor: 'help'
                }}
              >
                ⚠ 실제 위치 아님(기본값)
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <select value={locationProvince} onChange={(e) => handleProvinceChange(e.target.value)} className="form-select" style={{ flex: '1 1 140px' }}>
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
              style={{ flex: '1 1 140px' }}
            >
              <option value="">선택 안함</option>
              {districtOptions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          {locationError && <p style={{ color: '#DC2626', fontSize: '0.8rem', margin: '0.4rem 0 0 0' }}>{locationError}</p>}
        </div>

        <div style={{ flex: '1 1 180px' }}>
          <label className="form-label">구분</label>
          <select value={category} onChange={(e) => handleCategoryChange(e.target.value)} className="form-select">
            <option value="전체">전체 (장례식장/묘지)</option>
            <option value="장례식장">장례식장</option>
            <option value="묘지/수목장">묘지/봉안당/수목장</option>
          </select>
        </div>
      </div>

      {/* 태그 필터 칩 — 카드까지 스크롤하지 않고도 TAG_CATALOG 등록 태그를 바로 클릭할 수 있게 필터 박스 바로 아래 노출 (2026-08-12 대표 피드백) */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem', marginBottom: '1.2rem' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>태그:</span>
        {Object.keys(TAG_CATALOG).map((tag) => {
          const active = selectedTag === tag;
          return (
            <button
              key={tag}
              onClick={() => handleTagClick(tag)}
              className="btn"
              style={{
                backgroundColor: active ? 'var(--point-color)' : 'var(--card-bg)',
                color: active ? '#fff' : 'var(--primary-color)',
                border: active ? 'none' : '1px solid var(--border-color)',
                padding: '0.3rem 0.7rem',
                borderRadius: '999px',
                fontSize: '0.78rem',
                fontWeight: 600,
                minHeight: 'auto',
                lineHeight: 1.4
              }}
            >
              #{TAG_CATALOG[tag].label}
            </button>
          );
        })}
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
          const thumbnail = Array.isArray(item.images) && item.images.length > 0 ? `${BACKEND_URL}${item.images[0]}` : null;

          return (
            <div key={item.id} className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* 이미지 박스 — 파트너가 BizDashboard에서 올린 사진(없으면 플레이스홀더) */}
              <div
                style={{
                  width: 'calc(100% + 2.5rem)',
                  margin: '-1.25rem -1.25rem 1rem -1.25rem',
                  height: '160px',
                  backgroundColor: 'var(--secondary-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden'
                }}
              >
                {thumbnail ? (
                  <img src={thumbnail} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem', color: 'var(--text-muted)' }}>
                    <ImageIcon size={28} />
                    <span style={{ fontSize: '0.75rem' }}>등록된 이미지 없음</span>
                  </div>
                )}
              </div>

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

              {/* 태그 목록 — TAG_CATALOG에 등록된 값(예: 공설/사설)만 클릭 가능한 필터, 나머지는 그냥 라벨 */}
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.2rem' }}>
                {item.tags.map((tag: string, idx: number) =>
                  isFilterableTag(tag) ? (
                    <button
                      key={idx}
                      onClick={() => handleTagClick(tag)}
                      title={`"${TAG_CATALOG[tag].label}" 태그로 필터`}
                      style={{
                        fontSize: '0.75rem',
                        backgroundColor: selectedTag === tag ? 'var(--point-color)' : '#EAE5DC',
                        color: selectedTag === tag ? '#fff' : '#444',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      #{TAG_CATALOG[tag].label}
                    </button>
                  ) : (
                    <span key={idx} style={{ fontSize: '0.75rem', backgroundColor: '#EAE5DC', padding: '0.2rem 0.5rem', borderRadius: '4px', color: '#444' }}>
                      #{tag}
                    </span>
                  )
                )}
              </div>

              {/* 액션 버튼 그룹 — 전화 직통·견적비교·답사예약 삭제(2026-08-10), 업체 문의로 대체 */}
              <div style={{ marginTop: 'auto', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
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

                  {/* 업체 문의 버튼 */}
                  <button
                    onClick={() => setInquiryFacility(item)}
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
                    <Send size={16} /> 업체 문의
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
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
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

      {/* 업체 문의 모달 */}
      {inquiryFacility && (
        <InquiryModal
          facilityId={inquiryFacility.id}
          facilityName={inquiryFacility.name}
          onClose={() => setInquiryFacility(null)}
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
