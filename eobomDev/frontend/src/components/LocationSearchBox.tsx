import React from 'react';
import { MapPin, Search } from 'lucide-react';

// 🔄 2026-09-22 사용자 지시 — "facility의 검색창을 기준으로 pickup의 검색창 수정"으로
// FacilityPage.tsx의 위치·검색 필터 박스(§8 #5로 옛 `.form-select`/`.form-input`/`.form-label`/
// `.btn.btn-primary`를 그대로 쓰던 코드)를 두 화면이 공유하는 컴포넌트로 뽑았다. facility가
// 기준이라 클래스·색·아이콘·글꼴을 전부 facility 쪽 그대로 옮겼다 — pickup이 쓰던 v2 클래스
// (`.v2-filter-row`/`.v2-select`/`.v2-input`)는 이 박스에서 걷어냈다.
// 🔴 편차 — 00-39 §9.1은 그룹①(facility 포함)이 v2 클래스로 이관됐다고 적고 있는데, 이 박스는
// 반대 방향(옛 클래스 쪽으로 pickup을 맞춤)이라 그 흐름과 어긋난다. 사람이 이 화면에 한해
// 직접 지시한 것이라 그대로 구현했다 — walkthrough 편차 필드로 Opus에 올린다.
// `구분`(카테고리)처럼 facility에만 있는 필드는 `extraField`로 끼워 넣고, pickup처럼 없으면 생략한다.

interface LocationSearchBoxProps {
  locationName: string;
  isLocationFallback: boolean;
  fallbackTitle: string;
  locationError?: string | null;
  provinceOptions: string[];
  districtOptions: string[];
  province: string;
  district: string;
  onProvinceChange: (value: string) => void;
  onDistrictChange: (value: string) => void;
  districtDisabled?: boolean;
  extraField?: React.ReactNode;
  searchLabel: string;
  searchPlaceholder: string;
  searchTextDraft: string;
  onSearchTextChange: (value: string) => void;
  onSearchTextKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onSearch: () => void;
  isSearching?: boolean;
}

export const LocationSearchBox: React.FC<LocationSearchBoxProps> = ({
  locationName,
  isLocationFallback,
  fallbackTitle,
  locationError,
  provinceOptions,
  districtOptions,
  province,
  district,
  onProvinceChange,
  onDistrictChange,
  districtDisabled,
  extraField,
  searchLabel,
  searchPlaceholder,
  searchTextDraft,
  onSearchTextChange,
  onSearchTextKeyDown,
  onSearch,
  isSearching,
}) => (
  <div
    style={{
      backgroundColor: 'var(--v2-bg)',
      padding: '0.9rem',
      borderRadius: 'var(--r-lg)',
      marginBottom: '1.75rem',
      boxShadow: 'var(--box-shadow)',
      border: '1px solid var(--v2-divider-strong)',
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'flex-end',
      gap: '0.9rem',
    }}
  >
    <div style={{ flex: '2 1 320px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--v2-text-main)', fontWeight: 700, marginBottom: '0.6rem' }}>
        <MapPin size={18} color="var(--v2-point)" /> 위치: {locationName}
        {isLocationFallback && (
          <span
            title={fallbackTitle}
            style={{
              fontSize: 'var(--v2-fs-support)',
              fontWeight: 700,
              color: 'var(--state-warn-fg)',
              backgroundColor: 'var(--state-warn-bg)',
              padding: '0.15rem 0.5rem',
              borderRadius: 'var(--r-sm)',
              cursor: 'help',
            }}
          >
            ⚠ 실제 위치 아님(기본값)
          </span>
        )}
      </div>
      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
        <select value={province} onChange={(e) => onProvinceChange(e.target.value)} className="form-select" style={{ flex: '1 1 140px' }}>
          <option value="">시/도 선택</option>
          {provinceOptions.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <select
          value={district}
          onChange={(e) => onDistrictChange(e.target.value)}
          disabled={!province || districtDisabled}
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
      {locationError && <p style={{ color: 'var(--state-danger-fg)', fontSize: 'var(--v2-fs-support)', margin: '0.4rem 0 0 0' }}>{locationError}</p>}
    </div>

    {extraField}

    <div style={{ flex: '1.6 1 220px' }}>
      <label className="form-label">{searchLabel}</label>
      <input
        type="text"
        value={searchTextDraft}
        onChange={(e) => onSearchTextChange(e.target.value)}
        onKeyDown={onSearchTextKeyDown}
        placeholder={searchPlaceholder}
        className="form-input"
        style={{ width: '100%' }}
      />
    </div>

    <div style={{ flex: '0 0 auto' }}>
      <label className="form-label" style={{ visibility: 'hidden' }}>검색</label>
      <button
        onClick={onSearch}
        disabled={isSearching}
        className="btn btn-primary"
        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', padding: '0.6rem 1.4rem', whiteSpace: 'nowrap', opacity: isSearching ? 0.7 : 1 }}
      >
        <Search size={16} />
        {isSearching ? '검색 중...' : '검색'}
      </button>
    </div>
  </div>
);
