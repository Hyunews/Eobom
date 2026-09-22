import React, { useState, useEffect, useMemo } from 'react';
import digitalEstateData from '../mockData/digitalEstate.json';
import { BACKEND_URL, GEOLOCATION_FALLBACK, LOCATION_FEATURE_ENABLED } from '../config';
import { LocationSearchBox } from '../components/LocationSearchBox';
import '../styles/design-v2.css';
import { backdropCloseProps } from '../utils/backdropClose';

// 08-19 9차(개발자 직접 지시) — DigitalEstatePage 서브탭 3개(digital/physical/memorial) 중
// "현물 유품 정리(physical)"를 별도 도메인(tab: 'pickup')으로 분리. 내용은 그대로 옮겼다
// (예시 업체 데이터 — 00-14 §2.2 원칙 유지, "예시" 배지·CTA 문구·alert로 계속 고지한다).
// 00-39 §9.1 — 그룹①(목록·체크리스트) 대표 care-guide에서 뽑은 클래스를 시안 없이 그대로 적용.
// 🔄 2026-09-18 사용자 지시 — 위치 자동감지 표시·검색 기능을 FacilityPage 수준으로 맞춘다.
// 다만 업체(vendors) 데이터에 좌표가 없어 거리순 정렬은 만들지 않는다(province/district
// 텍스트 필터 + 자유 검색만).

interface PickupPageProps {
  currentUser?: string | null;
  onOpenLogin?: () => void;
}

export const PickupPage: React.FC<PickupPageProps> = () => {
  const vendors = digitalEstateData.vendors;

  // 지역필터 — 기존 "서울/경기" 같은 임의 권역 대신 장사시설(FacilityPage)과 동일하게
  // 실제 시/도 -> 시/군/구 2단계 선택으로 구현(2026-08-20 지시). 보유 업체(예시) 데이터에서
  // 직접 뽑아 항상 결과가 있는 지역만 노출한다(FacilityPage의 /api/geo/regions와 같은 원칙).
  const regionsData = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    for (const v of vendors) {
      if (!map[v.province]) map[v.province] = new Set();
      map[v.province].add(v.district);
    }
    const result: Record<string, string[]> = {};
    Object.keys(map)
      .sort((a, b) => a.localeCompare(b, 'ko'))
      .forEach((p) => {
        result[p] = Array.from(map[p]).sort((a, b) => a.localeCompare(b, 'ko'));
      });
    return result;
  }, [vendors]);
  const provinceOptions = Object.keys(regionsData);

  // 적용된(검색 버튼을 눌러 실제로 반영된) 조건 — FacilityPage와 같은 draft/적용 분리 패턴.
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [searchText, setSearchText] = useState('');
  // 아직 적용 전인 선택값
  const [provinceDraft, setProvinceDraft] = useState('');
  const [districtDraft, setDistrictDraft] = useState('');
  const [searchTextDraft, setSearchTextDraft] = useState('');

  const [selectedVendorIdx, setSelectedVendorIdx] = useState<number | null>(null);
  const districtDraftOptions = provinceDraft ? regionsData[provinceDraft] || [] : [];

  // 위치 표시 — FacilityPage와 같은 표시(위치명 + 기본값 배지)만 두고, 업체 데이터에
  // 좌표가 없어 거리순 정렬은 만들지 않는다.
  const [locationName, setLocationName] = useState('위치 확인 중...');
  const [isLocationFallback, setIsLocationFallback] = useState(false);

  const handleProvinceDraftChange = (value: string) => {
    setProvinceDraft(value);
    setDistrictDraft('');
  };

  // "검색" 버튼 — 선택값(draft)을 실제 검색 조건으로 반영한다(2026-09-10 FacilityPage와 동일 원칙).
  const handleSearch = () => {
    setProvince(provinceDraft);
    setDistrict(districtDraft);
    setSearchText(searchTextDraft.trim());
  };

  const handleSearchTextKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch();
  };

  // GPS 허용 시 지역 필터를 자동으로 채우고 즉시 적용한다(2026-09-10 사람 결정 — 좌표 정렬은
  // 만들지 않는다, province/district 텍스트 필터만). 거부·실패 시 기본 위치(GEOLOCATION_FALLBACK)를
  // 표시만 하고 필터는 채우지 않는다 — 다른 사람 위치로 검색 결과가 좁아지면 안 되기 때문.
  useEffect(() => {
    if (!LOCATION_FEATURE_ENABLED) return;

    const showLocationName = (lat: number, lng: number, isFallback: boolean, applyAsFilter: boolean) => {
      fetch(`${BACKEND_URL}/api/geo/reverse?lat=${lat}&lng=${lng}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.status !== 'success') {
            setLocationName('위치 확인 실패');
            return;
          }
          setLocationName(data.data.region);
          setIsLocationFallback(isFallback);
          if (!applyAsFilter) return;
          const detectedProvince = data.data.province as string;
          if (!provinceOptions.includes(detectedProvince)) return; // 예시 업체 데이터에 없는 지역이면 그대로 빈 채로 둔다
          setProvinceDraft(detectedProvince);
          setProvince(detectedProvince);
          const detectedDistrict = data.data.district as string;
          if (regionsData[detectedProvince]?.includes(detectedDistrict)) {
            setDistrictDraft(detectedDistrict);
            setDistrict(detectedDistrict);
          }
        })
        .catch(() => setLocationName('위치 확인 실패'));
    };

    if (!(navigator.geolocation && window.isSecureContext)) {
      showLocationName(GEOLOCATION_FALLBACK.lat, GEOLOCATION_FALLBACK.lng, true, false);
      return;
    }

    // enableHighAccuracy:false — IP 수준 정확도면 충분하다. timeout 없이 두면 이용자가
    // 권한 팝업을 무시할 때 콜백이 영영 안 불릴 수 있어 8초로 제한한다.
    const requestPosition = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => showLocationName(pos.coords.latitude, pos.coords.longitude, false, true),
        () => showLocationName(GEOLOCATION_FALLBACK.lat, GEOLOCATION_FALLBACK.lng, true, false),
        { timeout: 8000, maximumAge: 300000, enableHighAccuracy: false }
      );
    };

    // 거부는 브라우저가 기억한다 — 미리 상태를 보고 'denied'면 팝업을 다시 띄우지 않는다.
    if (navigator.permissions?.query) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((status) => {
          if (status.state === 'denied') {
            showLocationName(GEOLOCATION_FALLBACK.lat, GEOLOCATION_FALLBACK.lng, true, false);
          } else {
            requestPosition();
          }
        })
        .catch(requestPosition);
    } else {
      requestPosition();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredVendors = useMemo(() => {
    const q = searchText.trim();
    return vendors.filter((v) => {
      if (province && v.province !== province) return false;
      if (district && v.district !== district) return false;
      if (q && !v.name.includes(q) && !v.region.includes(q)) return false;
      return true;
    });
  }, [vendors, province, district, searchText]);

  const selectedVendor = selectedVendorIdx !== null ? filteredVendors[selectedVendorIdx] : null;

  return (
    <div className="v2-page">
      <div className="v2-page-head">
        <h1 className="v2-page-title">유품 수거</h1>
        <p className="v2-page-subtitle">지역 기반 유품 정리·수거 전문 업체와 연결해 드립니다.</p>
      </div>

      <div className="v2-content">
        {/* 🔴 00-21 §0.2-1 해제 조건 2 — 위치기반서비스 약관(제20조)이 잠긴 동안 이용자가 위치
            수집을 알 수 있는 유일한 자리. GPS 권한 팝업은 마운트 시 자동으로 뜨므로(위 useEffect)
            뷰포트와 무관하게 항상 먼저 렌더한다. FacilityPage와 동일 조건(01·03만 위치 수집,
            §0.2-1). 🔄 2026-09-18 사용자 지시 — 문구가 길다는 지적으로 한 문장으로 축약
            (핵심 고지만 남기고, 직접 선택 가능하다는 부연은 뺀다 — 아래 셀렉트가 그 사실을
            바로 보여준다). */}
        {LOCATION_FEATURE_ENABLED && <p className="v2-notice">가까운 지역 업체를 보여드리기 위해 위치 정보를 사용합니다.</p>}

        {/* 🔄 2026-09-22 사용자 지시 — facility(FacilityPage.tsx)의 검색창을 기준으로 맞춘다.
            "현재 위치: X" 표시·기본값 배지가 이 박스 안으로 옮겨져 위 별도 줄은 없앴다. */}
        <LocationSearchBox
          locationName={locationName}
          isLocationFallback={isLocationFallback}
          fallbackTitle={
            LOCATION_FEATURE_ENABLED
              ? '실제 위치를 확인하지 못해 기본 위치로 표시 중입니다. https 또는 localhost가 아닌 주소에서는 브라우저가 위치 확인을 차단합니다. 아래에서 지역을 직접 선택해주세요.'
              : '현재 위치 자동 감지를 제공하지 않아 기본 위치로 표시 중입니다. 아래에서 지역을 직접 선택해주세요.'
          }
          provinceOptions={provinceOptions}
          districtOptions={districtDraftOptions}
          province={provinceDraft}
          district={districtDraft}
          onProvinceChange={handleProvinceDraftChange}
          onDistrictChange={setDistrictDraft}
          searchLabel="업체명·지역 검색"
          searchPlaceholder="업체명 또는 지역명으로 검색"
          searchTextDraft={searchTextDraft}
          onSearchTextChange={setSearchTextDraft}
          onSearchTextKeyDown={handleSearchTextKeyDown}
          onSearch={handleSearch}
        />

        {filteredVendors.length === 0 && <p className="v2-empty">조건에 맞는 업체가 없습니다.</p>}

        {/* 2026-09-18 사람 확정 — 목업 시안 A(확대 카드형, 2열). 얇은 목록 행 대신 카드로
            바꾸고, 카드 면에는 제목·지역·CTA만 둔다(배지·평점·태그는 제목 클릭 시 모달로). */}
        <div className="v2-card-grid">
          {filteredVendors.map((vendor, idx) => (
            <div key={idx} className="v2-card">
              <button type="button" className="v2-card-title" onClick={() => setSelectedVendorIdx(idx)}>
                {vendor.name}
              </button>
              <p className="v2-card-meta">📍 {vendor.region}</p>
              <button
                type="button"
                className="v2-btn-primary v2-card-cta"
                onClick={() =>
                  alert('🚧 예시 업체입니다. 실제 제휴 서비스는 준비 중이라 이 견적 신청은 접수되지 않습니다.')
                }
              >
                견적 신청
              </button>
            </div>
          ))}
        </div>
      </div>

      {selectedVendor && (
        <div className="v2-modal-overlay" role="dialog" aria-modal="true" {...backdropCloseProps(() => setSelectedVendorIdx(null))}>
          <div className="v2-modal" onClick={(e) => e.stopPropagation()}>
            <p className="v2-modal-eyebrow">예시 데이터</p>
            <h3 className="v2-modal-title">{selectedVendor.name}</h3>

            <div className="v2-modal-row">
              <span className="v2-modal-label">지역</span>
              <span className="v2-modal-value">
                📍 {selectedVendor.region} · ★ {selectedVendor.rating}
              </span>
            </div>

            <div className="v2-modal-row">
              <span className="v2-modal-label">태그</span>
              <span className="v2-modal-value">{selectedVendor.tags.map((t) => `#${t}`).join(' ')}</span>
            </div>

            <div className="v2-modal-actions">
              <button
                type="button"
                className="v2-btn-primary"
                onClick={() =>
                  alert('🚧 예시 업체입니다. 실제 제휴 서비스는 준비 중이라 이 견적 신청은 접수되지 않습니다.')
                }
              >
                무료 방문 견적 신청 (예시)
              </button>
            </div>

            <button type="button" className="v2-modal-close" onClick={() => setSelectedVendorIdx(null)}>
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
