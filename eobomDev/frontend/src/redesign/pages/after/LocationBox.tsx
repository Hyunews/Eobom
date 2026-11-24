import React from 'react';
import { RdBadge, RdButton } from '../../parts/RdButtons';
import { RdInput, RdSelect } from '../../parts/RdInputs';
import { RdLocation } from '../../parts/RdNotices';
import { IconErrorCircle, IconSearch } from '../../parts/icons';
import { useIsPhone } from '../../useIsPhone';

// 8단계 묶음 5 · 위치 + 지역 고르기 + 검색 칸. 유품 정리(2-4)와 장사시설(2-6)이 같은 부품이다(지금 코드 LocationSearchBox).
// 개발자용 설명(https/localhost, API 키)은 화면에서 뺀다(2단계 확정 ③). 기본값 설명은 모바일에서 둘째 문장만(묶음 1 검토 결과).

export type LocationState = 'checking' | 'real' | 'fallback' | 'failed';

export interface LocationBoxProps {
  /** 확인 중 / 실제 위치 / 기본값 / 확인 실패 */
  state: LocationState;
  /** "서울 중구" 같은 위치 이름 (실제·기본값일 때) */
  name?: string;
  provinces: string[];
  districts: string[];
  province: string;
  district: string;
  onProvince: (v: string) => void;
  onDistrict: (v: string) => void;
  query: string;
  onQuery: (v: string) => void;
  onSearch: () => void;
  searchLabel: string;
  searchPlaceholder: string;
  /** 시/군/구 옆에 끼우는 칸(장사시설의 구분 고르기) */
  extra?: React.ReactNode;
  /** 위치 검색 오류 글 */
  error?: string;
  busy?: boolean;
  /** 모바일 필터 판 안: 종이 상자·검색 칸·[검색] 없이 위치와 지역 고르기만 (검색 칸은 판 밖에 있다) */
  compact?: boolean;
}

export function LocationBox(p: LocationBoxProps) {
  const phone = useIsPhone();
  const label = p.state === 'checking' ? '위치 확인 중...' : p.state === 'failed' ? '위치 확인 실패' : p.name ?? '';
  return (
    <div className={`rd-af-loc${p.compact ? ' rd-af-loc--compact' : ''}`}>
      <div className="rd-af-loc__top">
        <RdLocation>{label}</RdLocation>
        {p.state === 'fallback' && <RdBadge kind="state">실제 위치 아님(기본값)</RdBadge>}
      </div>
      {p.state === 'fallback' && (
        <p className="rd-af-loc__note">
          {phone ? '아래에서 지역을 직접 선택해주세요.' : '실제 위치를 확인하지 못해 기본 위치로 표시 중입니다. 아래에서 지역을 직접 선택해주세요.'}
        </p>
      )}
      <div className="rd-af-loc__grid">
        <div className="rd-af-loc__pair">
          <RdSelect aria-label="시/도" value={p.province} onChange={(e) => p.onProvince(e.target.value)}>
            <option value="">시/도 선택</option>
            {p.provinces.map((x) => (
              <option key={x} value={x}>{x}</option>
            ))}
          </RdSelect>
          <RdSelect aria-label="시/군/구" value={p.district} disabled={!p.province} onChange={(e) => p.onDistrict(e.target.value)}>
            <option value="">선택 안함</option>
            {p.districts.map((x) => (
              <option key={x} value={x}>{x}</option>
            ))}
          </RdSelect>
          {p.extra}
        </div>
        {!p.compact && (
          <>
            <RdInput
              aria-label={p.searchLabel}
              placeholder={p.searchPlaceholder}
              value={p.query}
              onChange={(e) => p.onQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') p.onSearch();
              }}
            />
            <RdButton busy={p.busy} busyText="검색 중..." onClick={p.onSearch}><IconSearch />검색</RdButton>
          </>
        )}
      </div>
      {p.error && (
        <p className="rd-field__error" role="alert">
          <IconErrorCircle />
          <span>{p.error}</span>
        </p>
      )}
    </div>
  );
}
