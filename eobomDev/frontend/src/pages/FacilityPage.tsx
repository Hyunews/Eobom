import React, { useState, useEffect } from 'react';
import { MapPin, Map, Image as ImageIcon, Send, Search, LayoutGrid, List, SlidersHorizontal, ChevronRight, X } from 'lucide-react';
import { BACKEND_URL, GEOLOCATION_FALLBACK, LOCATION_FEATURE_ENABLED } from '../config';
import { KakaoMapModal } from '../components/KakaoMapModal';
import { InquiryModal } from '../components/facility/InquiryModal';
import { HouseLeafIcon } from '../components/MenuIcons';
import { TAG_CATALOG, isFilterableTag } from '../components/facility/tagCatalog';
import { useIsMobile } from '../hooks/useIsMobile';

// 🔴 TEMP(2026-09-10 사람 지시) — 개발 중 테스트 편의로 아래 위치정보 고지 문구를 화면에서만
// 숨긴다. 00-21 §0.2-1 법적 요건 자체는 유지(코드 그대로 둠) — 실서비스 배포 전 반드시 false로
// 되돌릴 것. 한 번 유실됐다가 00-21이 지적해 복구된 이력이 있으니 삭제하지 말고 이 플래그로만 제어.
const HIDE_LOCATION_NOTICE_FOR_DEV = true;

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
  // 00-38 §8.3 FacilityPage 지침 — 필터 박스 압축·리스트형 버튼 텍스트 제거·페이지당 건수에 쓴다.
  const isMobile = useIsMobile();
  // 카드 640px 중 이미지 없는 시설의 "등록된 이미지 없음" 플레이스홀더가 150px을 차지한다
  // (00-38 §8.3 ②) — 768px과 별개 기준이라 useIsMobile을 따로 호출한다(§5.1, 리터럴만 전달).
  const hideImagePlaceholder = useIsMobile(480);

  // 시설 목록 (백엔드 API 연동, 서버사이드 필터링 + 페이지네이션)
  const [facilities, setFacilities] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);

  // 모달 상태
  const [selectedMapFacility, setSelectedMapFacility] = useState<any | null>(null);
  const [inquiryFacility, setInquiryFacility] = useState<any | null>(null);

  // 카드형/리스트형 보기 전환 — 2026-09-10 사람 지시로 추가. 서버 재조회는 필요 없고 같은
  // facilities 배열을 다르게 렌더링만 하면 돼서 페이지/필터와 무관한 순수 UI 상태로 둔다.
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

  // 모바일 필터 바텀시트 — 목업(Artifact) 승인 후 구현. 데스크톱은 기존 한 줄 필터 박스 그대로 두고,
  // 모바일에서만 검색창+요약 칩으로 접었다가 이 상태로 펼친다. 00-38 §8.2가 이미 정한 바텀시트
  // 공통 규칙(position:fixed·bottom:0·dvh)을 따른다.
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  // 🔴 2026-09-10 사람 지시 — "한 페이지에 너무 많은 업체가 나와서 스크롤을 한참 내려야 함"
  // 재분석(dev 서버 실측, DOM getBoundingClientRect): 리스트 행은 90px로 이미 가볍지만, 카드는
  // 이미지 없는 시설도 308px(모바일)·464px(데스크톱, 이미지 자리 항상 있음)나 된다.
  //   모바일 카드 15개 = 카드 영역만 5117px(+헤더/필터/태그/카운트 571px = 총 5688px, ≈7 화면)
  //   모바일 리스트 15개 = 1459px(총 2030px, ≈2.5 화면) — 이미 적정
  //   데스크톱 카드 30개(3열×10행) = 4859px(총 5229px, ≈5.8 화면)
  //   데스크톱 리스트 30개 = 2926px(총 3296px, ≈3.7 화면) — 이미 적정
  // 리스트는 건드릴 필요가 없어 그대로 두고, 카드만 모바일 15→8(≈2600px, ≈3.2화면), 데스크톱
  // 30→24(3열×8행, ≈3900px, ≈4.3화면)로 줄인다 — 24는 3의 배수라 마지막 행이 안 어중간하다.
  const PAGE_SIZE = viewMode === 'list' ? (isMobile ? 15 : 30) : (isMobile ? 8 : 24);

  // 위치 상태 (반경 필터 대신 항상 이 위치 기준 가까운 순으로 정렬)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationName, setLocationName] = useState<string>('위치 확인 중...');
  const [regionsData, setRegionsData] = useState<Record<string, string[]>>({});
  const [locationProvince, setLocationProvince] = useState('');
  const [locationDistrict, setLocationDistrict] = useState('');
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // 필터 상태 — 구분(예산/종교/하객수/지역 대분류 삭제, 2026-08-10) + 태그(운영주체 등, 2026-08-10 추가)
  // category/userLocation/searchText는 "적용된" 검색 조건(=실제 fetch에 쓰이는 값)이고, categoryDraft/
  // locationProvince/locationDistrict/searchTextDraft는 아직 적용 전인 선택값이다. "검색" 버튼을 눌러야
  // 검색이 실행된다(2026-08-20 지시, 버튼 명칭은 2026-09-10 "적용"→"검색"으로 변경 + 텍스트 검색 추가).
  const [category, setCategory] = useState('전체');
  const [categoryDraft, setCategoryDraft] = useState('전체');
  const [searchText, setSearchText] = useState('');
  const [searchTextDraft, setSearchTextDraft] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  // 🔴 2026-09-10 사람 지시 — 지역 선택 후 검색하면 그 지역에 걸리는 시설만 나오게 한다. 지금까지
  // locationProvince/locationDistrict는 geocode해서 userLocation(거리순 정렬용 좌표)만 만들 뿐,
  // 실제 하드 필터로는 안 쓰였다(다른 지역 시설도 거리순으로 섞여 나왔다). appliedProvince/
  // appliedDistrict는 "검색 버튼을 눌러 실제로 적용된" 지역 필터값 — 시/도를 선택 안 하고
  // 검색하면(자동 감지 위치만 쓰는 경우) 둘 다 빈 문자열로 유지돼 필터 없이 거리순 정렬만 된다.
  const [appliedProvince, setAppliedProvince] = useState('');
  const [appliedDistrict, setAppliedDistrict] = useState('');

  // 필터/페이지 변경 시 서버에 조건 그대로 위임해서 재조회
  useEffect(() => {
    const params = new URLSearchParams();
    if (category !== '전체') params.set('category', category);
    if (selectedTag) params.set('tag', selectedTag);
    if (searchText.trim()) params.set('q', searchText.trim());
    if (appliedProvince) params.set('province', appliedProvince);
    if (appliedDistrict) params.set('district', appliedDistrict);
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
  }, [category, selectedTag, searchText, appliedProvince, appliedDistrict, userLocation, page, PAGE_SIZE]);

  // PAGE_SIZE가 바뀌면(뷰포트 768px 경계를 넘나들거나 카드형↔리스트형 전환) 이전 페이지 번호가
  // 새 페이지 크기 기준으로 범위 밖일 수 있어 1페이지로 되돌린다.
  useEffect(() => {
    setPage(1);
  }, [isMobile, viewMode]);

  const handleCategoryChange = (value: string) => {
    setCategoryDraft(value);
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
  // 위치 API가 실패해 기본값(광주 광산구)으로 대체됐는지 — 이 경우 실제 위치가 아니므로 UI에 반드시 알린다
  const [isLocationFallback, setIsLocationFallback] = useState(false);
  useEffect(() => {
    const applyDetected = (loc: { lat: number; lng: number }, isFallback: boolean) => {
      setUserLocation(loc);
      setDetectedLocation(loc);
      setIsLocationFallback(isFallback);
    };

    // 2026-09-10 사람 결정 ① — 방통위 신고는 미루고 기능은 켠다(약관 게시는 별도로
    // LOCATION_LEGAL_PUBLISHED가 잠근다, config.ts 참고). 실서비스 개시 전 신고 예정.
    if (!(LOCATION_FEATURE_ENABLED && navigator.geolocation && window.isSecureContext)) {
      applyDetected(GEOLOCATION_FALLBACK, true);
      return;
    }

    // 결정 ③ — 정확도는 IP 수준이면 충분하고 주소 직접 선택 기능이 이미 있다.
    // enableHighAccuracy:false로 GPS 칩 대신 빠른 위치(WiFi/IP 기반)를 쓴다.
    // timeout 기본값이 무한이라 이용자가 권한 팝업을 무시하면 두 콜백 모두 안 불리고
    // locationName이 "위치 확인 중..."에 영구 고정된다 — 8초 뒤 폴백으로 넘어가게 한다.
    const requestPosition = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => applyDetected({ lat: pos.coords.latitude, lng: pos.coords.longitude }, false),
        () => applyDetected(GEOLOCATION_FALLBACK, true),
        { timeout: 8000, maximumAge: 300000, enableHighAccuracy: false }
      );
    };

    // 거부는 브라우저가 기억한다 — 한 번 거부하면 다시 팝업이 안 뜨고 즉시 실패 콜백만 온다.
    // permissions API로 미리 상태를 보고 'denied'면 아예 호출하지 않고 바로 폴백으로 넘긴다
    // (미지원 브라우저는 permissions?.query가 없으니 그냥 requestPosition으로 진행).
    if (navigator.permissions?.query) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((status) => {
          if (status.state === 'denied') {
            applyDetected(GEOLOCATION_FALLBACK, true);
          } else {
            requestPosition();
          }
        })
        .catch(requestPosition);
    } else {
      requestPosition();
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

  // 시/도·시/군/구·구분 선택은 이제 즉시 검색을 트리거하지 않는다 — 아래 "검색" 버튼을 눌러야
  // 실제 검색(userLocation/category 갱신)이 일어난다. 여기서는 선택값(draft)만 갱신한다.
  const handleProvinceChange = (value: string) => {
    setLocationProvince(value);
    setLocationDistrict('');
  };

  const handleDistrictChange = (value: string) => {
    setLocationDistrict(value);
  };

  // "검색" 버튼(2026-09-10까지 "적용"): 시/도·시/군/구·구분·검색어 선택값을 실제 검색 조건으로 반영한다.
  // 시/군/구가 "선택 안함"이어도(district === '') 검색은 그대로 실행되어야 한다 — 이 경우
  // 시/도만 있으면 시/도 단위로, 시/도도 없으면 자동 감지된(또는 기본) 위치로 검색한다.
  const handleSearch = async () => {
    setIsApplying(true);
    setLocationError(null);
    try {
      if (locationProvince) {
        setIsSearchingLocation(true);
        const query = locationDistrict ? `${locationProvince} ${locationDistrict}` : locationProvince;
        try {
          const res = await fetch(`${BACKEND_URL}/api/geo/geocode?query=${encodeURIComponent(query)}`);
          const data = await res.json();
          if (!res.ok || data.status !== 'success') {
            setLocationError(data.message || '해당 위치를 찾을 수 없습니다.');
            return;
          }
          setUserLocation({ lat: data.data.lat, lng: data.data.lng });
          setIsLocationFallback(false); // 사용자가 직접 지정한 위치이므로 더 이상 기본값이 아님
          setAppliedProvince(locationProvince);
          setAppliedDistrict(locationDistrict);
        } catch (e) {
          setLocationError('위치 검색 중 오류가 발생했습니다.');
          return;
        } finally {
          setIsSearchingLocation(false);
        }
      } else {
        // 시/도까지 선택 안 함 → 지역 하드 필터 없이 자동 감지(또는 기본) 위치로 거리순 정렬만
        if (detectedLocation) setUserLocation(detectedLocation);
        setAppliedProvince('');
        setAppliedDistrict('');
      }

      setCategory(categoryDraft);
      setSearchText(searchTextDraft);
      setPage(1);
    } finally {
      setIsApplying(false);
    }
  };

  // 검색어 입력창에서 Enter로도 검색 버튼과 동일하게 실행
  const handleSearchTextKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="container" style={{ paddingBottom: '3rem' }}>
      {/* 🔄 09-07 사용자 지시 — 다른 도메인 페이지(CounselingPage 등)처럼 타이틀을 감싸던
          히어로 박스(진한 배경·패딩·둥근 모서리 카드)를 없애고 배지+제목+설명만 남긴다. */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'var(--state-warn-bg)', color: 'var(--accent-gold)', padding: '0.3rem var(--sp-4)', borderRadius: 'var(--r-lg)', fontSize: 'var(--fs-body)', fontWeight: 700, marginBottom: '0.6rem' }}>
          <HouseLeafIcon size={18} color="var(--accent-gold)" /> 장사시설 맞춤 검색
        </div>
        <h1 className="page-title" style={{ color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
          <HouseLeafIcon color="var(--point-color)" size={32} /> 장례·묘지 맞춤 비교 매칭
        </h1>
        <p className="page-subtitle" style={{ color: 'var(--text-muted)', marginTop: '0.4rem' }}>
          현재 위치 기반 거리순 정렬과 카카오맵 LBS 핀 마커 연동을 만나보세요.
        </p>
      </div>

      {/* 🔴 00-21 §0.2-1 해제 조건 2 — 위치기반서비스 약관(제20조)이 LOCATION_LEGAL_PUBLISHED=false로
          잠긴 동안, 이용자가 위치 수집을 알 수 있는 유일한 자리다. GPS 권한 팝업은 컴포넌트
          마운트 시 자동으로 뜨므로(아래 useEffect) 이 한 줄은 뷰포트·바텀시트 열림 여부와 무관하게
          항상 먼저 렌더돼야 한다 — .page-subtitle(모바일 숨김 대상)과 달리 절대 숨기지 않는다.
          (2026-09-10 발견 — wt188에서 구현했다가 이후 필터 UI 리팩터 중 유실됨, 00-21이 지적해 복구.) */}
      {LOCATION_FEATURE_ENABLED && !HIDE_LOCATION_NOTICE_FOR_DEV && (
        <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-muted)', margin: '0 0 1rem' }}>
          가까운 장례식장을 먼저 보여드리기 위해 현재 위치를 사용합니다. 허용하지 않아도 아래에서
          지역을 직접 선택할 수 있습니다.
        </p>
      )}

      {/* 🔴 2026-09-10 사람 지시 — Artifact 목업(검색바+바텀시트) 승인 후 구현. 모바일은 검색창+
          요약 칩만 상시 노출하고 위치·구분은 필터 아이콘을 눌러야 열리는 바텀시트로 옮긴다.
          데스크톱(≥769px)은 기존 한 줄 필터 박스를 그대로 둔다 — 목업 노트대로 이 개편은 모바일
          전용이다. 바텀시트는 00-38 §8.2가 이미 정한 공통 규칙(position:fixed·bottom:0·dvh)을
          따른다. 태그 칩(#공설·#사설)은 즉시 적용되는 가벼운 한 줄이라 시트로 옮기지 않고
          그대로 뒀다(목업에서는 시트 안에 넣었지만, 클릭 즉시 적용되는 토글이라 시트를 열고 닫는
          왕복이 오히려 손해라고 판단해 구현 단계에서 조정). */}
      {isMobile && (
        <>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: 'var(--card-bg)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--r-lg)',
              boxShadow: 'var(--box-shadow)',
              padding: '0.6rem 0.7rem',
              marginBottom: '0.5rem'
            }}
          >
            <button
              onClick={handleSearch}
              disabled={isApplying || isSearchingLocation}
              aria-label="검색"
              style={{ flexShrink: 0, background: 'none', border: 'none', padding: 0, display: 'flex', cursor: 'pointer', opacity: isApplying || isSearchingLocation ? 0.5 : 1 }}
            >
              <Search size={18} color="var(--text-muted)" />
            </button>
            <input
              type="text"
              value={searchTextDraft}
              onChange={(e) => setSearchTextDraft(e.target.value)}
              onKeyDown={handleSearchTextKeyDown}
              placeholder="시설 이름 또는 지역명으로 검색"
              style={{ flex: '1 1 auto', minWidth: 0, border: 'none', outline: 'none', background: 'transparent', fontSize: 'var(--fs-body)', color: 'var(--text-main)' }}
            />
            <button
              onClick={() => setIsFilterSheetOpen(true)}
              aria-label="필터 열기"
              style={{
                flexShrink: 0,
                position: 'relative',
                width: '2.4rem',
                height: '2.4rem',
                borderRadius: 'var(--r-sm)',
                border: 'none',
                backgroundColor: 'var(--primary-color)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <SlidersHorizontal size={17} />
              {/* 적용된(draft 아님) 조건이 기본값과 다를 때만 점 배지 — 지금 뭔가 필터링 중임을 알림 */}
              {(appliedProvince || category !== '전체') && (
                <span
                  style={{
                    position: 'absolute',
                    top: -2,
                    right: -2,
                    width: '0.6rem',
                    height: '0.6rem',
                    borderRadius: '50%',
                    backgroundColor: 'var(--accent-gold)',
                    border: '2px solid var(--card-bg)'
                  }}
                />
              )}
            </button>
          </div>

          <button
            onClick={() => setIsFilterSheetOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              background: 'none',
              border: 'none',
              padding: '0 0.2rem',
              marginBottom: '0.6rem',
              fontSize: 'var(--fs-body)',
              fontWeight: 700,
              color: 'var(--point-color)',
              cursor: 'pointer'
            }}
          >
            <MapPin size={14} /> {locationName} · {category} <ChevronRight size={14} />
          </button>
        </>
      )}

      {/* 위치 + 구분 (2026-08-10 병합 — 예산/종교/하객수/지역 대분류 필터는 삭제) — 데스크톱 전용,
          모바일은 위 압축 검색바 + 아래 바텀시트로 대체된다. */}
      {!isMobile && (
        <div
          style={{
            backgroundColor: 'var(--card-bg)',
            padding: '1.1rem',
            borderRadius: 'var(--r-lg)',
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
                  title={
                    LOCATION_FEATURE_ENABLED
                      ? '실제 위치를 확인하지 못해 기본 위치로 표시 중입니다. https 또는 localhost가 아닌 주소에서는 브라우저가 위치 확인을 차단합니다. 아래에서 시/도·시/군/구를 직접 선택해주세요.'
                      : '현재 위치 자동 감지를 제공하지 않아 기본 위치로 표시 중입니다. 아래에서 시/도·시/군/구를 직접 선택해주세요.'
                  }
                  style={{
                    fontSize: 'var(--fs-body)',
                    fontWeight: 700,
                    color: 'var(--state-warn-fg)',
                    backgroundColor: 'var(--state-warn-bg)',
                    padding: '0.15rem 0.5rem',
                    borderRadius: 'var(--r-sm)',
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
                style={{ flex: '1 1 180px' }}
              >
                <option value="">선택 안함</option>
                {districtOptions.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            {locationError && <p style={{ color: 'var(--state-danger-fg)', fontSize: 'var(--fs-body)', margin: '0.4rem 0 0 0' }}>{locationError}</p>}
          </div>

          <div style={{ flex: '1 1 140px' }}>
            <label className="form-label">구분</label>
            <select value={categoryDraft} onChange={(e) => handleCategoryChange(e.target.value)} className="form-select">
              <option value="전체">전체</option>
              <option value="장례식장">장례식장</option>
              <option value="묘지/수목장">묘지/봉안당/수목장</option>
            </select>
          </div>

          <div style={{ flex: '1.6 1 220px' }}>
            <label className="form-label">시설명·지역 검색</label>
            <input
              type="text"
              value={searchTextDraft}
              onChange={(e) => setSearchTextDraft(e.target.value)}
              onKeyDown={handleSearchTextKeyDown}
              placeholder="시설 이름 또는 지역명으로 검색"
              className="form-input"
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ flex: '0 0 auto' }}>
            <label className="form-label" style={{ visibility: 'hidden' }}>검색</label>
            <button
              onClick={handleSearch}
              disabled={isApplying || isSearchingLocation}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', padding: '0.6rem 1.4rem', whiteSpace: 'nowrap', opacity: isApplying || isSearchingLocation ? 0.7 : 1 }}
            >
              <Search size={16} />
              {isApplying || isSearchingLocation ? '검색 중...' : '검색'}
            </button>
          </div>
        </div>
      )}

      {/* 모바일 필터 바텀시트 — 위치·구분만 담는다(검색어는 압축 검색바가 상시 노출, 태그는
          즉시 적용이라 별도 행에 그대로 둠). isMobile일 때만 마운트해서 데스크톱 DOM에는
          아예 안 남게 한다 — 열림/닫힘은 transform으로 애니메이션. */}
      {isMobile && (
        <>
          <div
            onClick={() => setIsFilterSheetOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(26, 43, 76, 0.4)',
              opacity: isFilterSheetOpen ? 1 : 0,
              pointerEvents: isFilterSheetOpen ? 'auto' : 'none',
              transition: 'opacity 0.25s ease',
              zIndex: 2000
            }}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="필터"
            style={{
              position: 'fixed',
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'var(--card-bg)',
              borderRadius: 'var(--r-lg) var(--r-lg) 0 0',
              boxShadow: '0 -12px 30px rgba(26, 43, 76, 0.2)',
              padding: '0.6rem 1.1rem 1.5rem',
              maxHeight: '84dvh',
              overflowY: 'auto',
              transform: isFilterSheetOpen ? 'translateY(0)' : 'translateY(100%)',
              transition: 'transform 0.28s cubic-bezier(.2,.9,.3,1)',
              zIndex: 2001
            }}
          >
            <div style={{ width: '2.25rem', height: '0.25rem', backgroundColor: 'var(--border-color)', borderRadius: '0.15rem', margin: '0 auto 0.9rem' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-color)' }}>필터</span>
              <button
                onClick={() => setIsFilterSheetOpen(false)}
                aria-label="닫기"
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.2rem', display: 'flex' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary-color)', fontWeight: 700, marginBottom: '0.5rem' }}>
              <MapPin size={16} color="var(--point-color)" /> 위치: {locationName}
              {isLocationFallback && (
                <span
                  title={
                    LOCATION_FEATURE_ENABLED
                      ? '실제 위치를 확인하지 못해 기본 위치로 표시 중입니다. https 또는 localhost가 아닌 주소에서는 브라우저가 위치 확인을 차단합니다. 아래에서 시/도·시/군/구를 직접 선택해주세요.'
                      : '현재 위치 자동 감지를 제공하지 않아 기본 위치로 표시 중입니다. 아래에서 시/도·시/군/구를 직접 선택해주세요.'
                  }
                  style={{
                    fontSize: 'var(--fs-caption)',
                    fontWeight: 700,
                    color: 'var(--state-warn-fg)',
                    backgroundColor: 'var(--state-warn-bg)',
                    padding: '0.15rem 0.5rem',
                    borderRadius: 'var(--r-sm)',
                    cursor: 'help'
                  }}
                >
                  ⚠ 실제 위치 아님(기본값)
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <select value={locationProvince} onChange={(e) => handleProvinceChange(e.target.value)} className="form-select" style={{ flex: '1 1 0', minWidth: 0 }}>
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
                style={{ flex: '1 1 0', minWidth: 0 }}
              >
                <option value="">선택 안함</option>
                {districtOptions.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            {locationError && <p style={{ color: 'var(--state-danger-fg)', fontSize: 'var(--fs-body)', margin: '0 0 0.6rem' }}>{locationError}</p>}

            <label className="form-label" style={{ marginTop: '0.6rem' }}>구분</label>
            <select value={categoryDraft} onChange={(e) => handleCategoryChange(e.target.value)} className="form-select" style={{ width: '100%', marginBottom: '1.2rem' }}>
              <option value="전체">전체</option>
              <option value="장례식장">장례식장</option>
              <option value="묘지/수목장">묘지/봉안당/수목장</option>
            </select>

            <button
              onClick={async () => {
                await handleSearch();
                setIsFilterSheetOpen(false);
              }}
              disabled={isApplying || isSearchingLocation}
              className="btn btn-primary"
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', padding: '0.8rem', fontSize: '1rem', fontWeight: 800, opacity: isApplying || isSearchingLocation ? 0.7 : 1 }}
            >
              <Search size={16} />
              {isApplying || isSearchingLocation ? '검색 중...' : '적용하고 검색'}
            </button>
          </div>
        </>
      )}

      {/* 태그 필터 칩 — 카드까지 스크롤하지 않고도 TAG_CATALOG 등록 태그를 바로 클릭할 수 있게 필터 박스 바로 아래 노출 (2026-08-12 대표 피드백) */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem', marginBottom: '1.2rem' }}>
        <span style={{ fontSize: 'var(--fs-body)', color: 'var(--text-muted)' }}>태그:</span>
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
                padding: '0.3rem var(--sp-3)',
                borderRadius: 'var(--r-full)',
                fontSize: 'var(--fs-body)',
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

      {/* 시설 목록 — 카드형/리스트형 전환(2026-09-10) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.6rem' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-body)', margin: 0 }}>
          총 <strong style={{ color: 'var(--primary-color)' }}>{totalCount}개</strong> 시설이 검색되었습니다. ({page}/{totalPages} 페이지)
        </p>
        <div style={{ display: 'flex', gap: '0.3rem', backgroundColor: 'var(--secondary-color)', padding: '0.2rem', borderRadius: 'var(--r-sm)' }}>
          <button
            onClick={() => setViewMode('card')}
            title="카드형 보기"
            style={{
              display: 'flex', alignItems: 'center', gap: '0.3rem',
              padding: '0.4rem 0.7rem', fontSize: 'var(--fs-body)', fontWeight: 700, border: 'none', borderRadius: 'var(--r-sm)', cursor: 'pointer',
              backgroundColor: viewMode === 'card' ? 'var(--card-bg)' : 'transparent',
              color: viewMode === 'card' ? 'var(--primary-color)' : 'var(--text-muted)',
              boxShadow: viewMode === 'card' ? 'var(--box-shadow)' : 'none'
            }}
          >
            <LayoutGrid size={16} /> 카드형
          </button>
          <button
            onClick={() => setViewMode('list')}
            title="리스트형 보기"
            style={{
              display: 'flex', alignItems: 'center', gap: '0.3rem',
              padding: '0.4rem 0.7rem', fontSize: 'var(--fs-body)', fontWeight: 700, border: 'none', borderRadius: 'var(--r-sm)', cursor: 'pointer',
              backgroundColor: viewMode === 'list' ? 'var(--card-bg)' : 'transparent',
              color: viewMode === 'list' ? 'var(--primary-color)' : 'var(--text-muted)',
              boxShadow: viewMode === 'list' ? 'var(--box-shadow)' : 'none'
            }}
          >
            <List size={16} /> 리스트형
          </button>
        </div>
      </div>

      {/* 리스트형 보기 — 2026-09-10 사람 지시로 항목 축소: 기관명·주소(길면 말줄임)·지도/문의
          버튼만. 썸네일·타입/거리 뱃지·평점·리뷰 버튼은 카드형에만 남긴다(리스트형은 빠르게
          훑어보는 용도라 정보를 최소화). */}
      {viewMode === 'list' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {facilities.map((item) => (
            <div key={item.id} className="card" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '1rem', padding: '0.8rem 1.1rem' }}>
              <div style={{ flex: '1 1 auto', minWidth: 0 }}>
                <h3 style={{ fontSize: '1.05rem', color: 'var(--primary-color)', margin: '0 0 0.2rem', fontWeight: 700 }}>{item.name}</h3>
                <p style={{ fontSize: 'var(--fs-body)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <MapPin size={14} color="var(--point-color)" style={{ flexShrink: 0 }} /> {item.location}
                </p>
              </div>

              {/* 2026-09-10 사람 지시 — 아이콘만 있어 너무 좁았다가(라벨+넓은 padding 추가) →
                  너무 커졌다는 피드백으로 10%가량 축소 → 모바일(00-38 §5 useIsMobile)에서는
                  텍스트를 다시 빼 아이콘만 남긴다(공간이 가장 좁은 화면이라 라벨이 줄바꿈을
                  유발했다). title로 접근성 라벨은 유지. */}
              <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                <button
                  onClick={() => setSelectedMapFacility(item)}
                  title="카카오 지도"
                  className="btn"
                  style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 0 : '0.25rem', padding: isMobile ? '0.6rem 1rem' : '0.5rem 1rem', fontSize: 'var(--fs-body)', whiteSpace: 'nowrap', fontWeight: 700, backgroundColor: '#FEE500', color: '#191919' }}
                >
                  <Map size={14} /> {!isMobile && '카카오 지도'}
                </button>
                <button
                  onClick={() => setInquiryFacility(item)}
                  title="상담"
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 0 : '0.25rem', padding: isMobile ? '0.6rem 1rem' : '0.5rem 1rem', fontSize: 'var(--fs-body)', whiteSpace: 'nowrap', fontWeight: 700 }}
                >
                  <Send size={14} /> {!isMobile && '상담'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewMode === 'card' && (
      <div className="grid">
        {facilities.map((item) => {
          const distKm = typeof item.distanceKm === 'number' ? item.distanceKm.toFixed(1) : null;
          const thumbnail = Array.isArray(item.images) && item.images.length > 0 ? `${BACKEND_URL}${item.images[0]}` : null;

          return (
            <div key={item.id} className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* 이미지 박스 — 파트너가 BizDashboard에서 올린 사진(없으면 플레이스홀더).
                  00-38 §8.3 FacilityPage 지침 ② — 이미지가 실제로 있으면 항상 보여주지만,
                  없는 시설의 "등록된 이미지 없음" 플레이스홀더는 ≤480px에서 아예 렌더하지
                  않는다(카드 높이의 150px을 차지해 모바일 스크롤 부담이 컸다). */}
              {(thumbnail || !hideImagePlaceholder) && (
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
                      <span style={{ fontSize: 'var(--fs-body)' }}>등록된 이미지 없음</span>
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginBottom: '0.6rem' }}>
                <span style={{ fontSize: 'var(--fs-body)', backgroundColor: 'var(--secondary-color)', padding: '0.3rem 0.6rem', borderRadius: 'var(--r-sm)', fontWeight: 700, color: 'var(--primary-color)' }}>
                  {item.type}
                </span>
                {distKm && (
                  // 결정 ④ — haversine 직선거리다(실 이동거리 아님). title 툴팁으로 안내하고
                  // 라벨은 "직선" 없이 표기(2026-09-10 사람 지시로 라벨에서만 제거).
                  <span
                    title="지도상 직선거리입니다. 실제 이동 거리는 카카오맵에서 확인해주세요."
                    style={{ fontSize: 'var(--fs-body)', backgroundColor: 'var(--state-warn-bg)', color: 'var(--accent-gold)', padding: '0.25rem 0.5rem', borderRadius: 'var(--r-sm)', fontWeight: 700, cursor: 'help' }}
                  >
                    📍{distKm}km
                  </span>
                )}
              </div>

              <h3 style={{ fontSize: '1.25rem', color: 'var(--primary-color)', marginBottom: '0.4rem', fontWeight: 700 }}>{item.name}</h3>

              {/* 🔴 2026-09-10 사람 지시 — 주소가 한 줄/두 줄이냐에 따라 이 아래(태그·버튼) 시작
                  위치가 카드마다 들쭉날쭉했다. 항상 2줄 높이(minHeight)를 예약하고, 2줄을 넘는
                  주소는 -webkit-line-clamp로 말줄임 처리해 모든 카드의 태그 줄이 같은 높이에서
                  시작하게 고정한다. */}
              <p style={{ fontSize: 'var(--fs-body)', color: 'var(--text-muted)', display: 'flex', alignItems: 'flex-start', gap: '0.3rem', marginBottom: '0.4rem', minHeight: 'calc(var(--fs-body) * 1.3 * 2)', lineHeight: 1.3 }}>
                <MapPin size={16} color="var(--point-color)" style={{ flexShrink: 0, marginTop: '0.15rem' }} />
                <span
                  style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {item.location}
                </span>
              </p>

              {/* 종교/하객/예상 기본 비용 표시 삭제(2026-09-10 사람 지시) — item.religion·item.guests·
                  item.price는 더 이상 카드에서 안 쓰지만 API 응답·DB 필드 자체는 그대로 둔다. */}

              {/* 태그 목록 — TAG_CATALOG에 등록된 값(예: 공설/사설)만 클릭 가능한 필터, 나머지는 그냥 라벨.
                  🔴 2026-09-10 — 주소 블록과 간격이 좁아 붙어 보였다(marginTop 추가) + <button>은
                  브라우저 기본 line-height·font가 <span>과 달라 같은 padding이어도 텍스트 높이가
                  미묘하게 어긋났다(fontFamily:'inherit'+lineHeight+inline-flex로 통일). */}
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.6rem', marginBottom: '1.2rem' }}>
                {item.tags.map((tag: string, idx: number) =>
                  isFilterableTag(tag) ? (
                    <button
                      key={idx}
                      onClick={() => handleTagClick(tag)}
                      title={`"${TAG_CATALOG[tag].label}" 태그로 필터`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        fontFamily: 'inherit',
                        fontSize: 'var(--fs-body)',
                        lineHeight: 'var(--lh-body)',
                        backgroundColor: selectedTag === tag ? 'var(--point-color)' : '#EAE5DC',
                        color: selectedTag === tag ? '#fff' : '#444',
                        padding: '0.2rem 0.5rem',
                        borderRadius: 'var(--r-sm)',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      #{TAG_CATALOG[tag].label}
                    </button>
                  ) : (
                    <span
                      key={idx}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        fontFamily: 'inherit',
                        fontSize: 'var(--fs-body)',
                        lineHeight: 'var(--lh-body)',
                        backgroundColor: '#EAE5DC',
                        padding: '0.2rem 0.5rem',
                        borderRadius: 'var(--r-sm)',
                        color: '#444',
                      }}
                    >
                      #{tag}
                    </span>
                  )
                )}
              </div>

              {/* 액션 버튼 그룹 — 전화 직통·견적비교·답사예약 삭제(2026-08-10), 상담으로 대체 */}
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
                    fontSize: 'var(--fs-body)',
                    padding: '0.6rem 0.4rem',
                    whiteSpace: 'nowrap',
                    gap: '0.3rem',
                    fontWeight: 700
                  }}
                >
                  <Map size={16} /> 카카오 지도
                </button>

                {/* 상담 버튼 — 🔄 2026-09-10 사람 지시, "업체 문의"에서 개명. MyPage 히어로
                    통계의 "상담 내역"(전문가+업체 합산)과 용어를 맞춘다. */}
                <button
                  onClick={() => setInquiryFacility(item)}
                  className="btn btn-primary"
                  style={{
                    flex: '1 1 0',
                    minWidth: '100px',
                    fontSize: 'var(--fs-body)',
                    padding: '0.6rem 0.4rem',
                    whiteSpace: 'nowrap',
                    gap: '0.3rem',
                    fontWeight: 700
                  }}
                >
                  <Send size={16} /> 상담
                </button>
              </div>
            </div>
          );
        })}
      </div>
      )}

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

      {/* 상담 모달 */}
      {inquiryFacility && (
        <InquiryModal
          facilityId={inquiryFacility.id}
          facilityName={inquiryFacility.name}
          onClose={() => setInquiryFacility(null)}
        />
      )}
    </div>
  );
};
