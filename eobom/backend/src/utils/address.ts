// 2026 전남광주통합특별시 출범 반영 — 광주·전남 소속 구/시/군 목록과 주소 선두 시/도 정규화.
// geoController(PROVINCE_ALIASES/resolveKakaoQuery)와 시설 데이터 임포트 스크립트가 공용으로 쓴다.
export const MERGED_PROVINCE = '전남광주통합특별시';
export const GWANGJU_DISTRICTS = new Set(['동구', '서구', '남구', '북구', '광산구']);

const LEGACY_PREFIXES = new Set(['광주광역시', '광주', '전라남도', '전남']);

// CSV/카카오 원본 주소의 선두 시/도 토큰을 병합 명칭으로 치환한다. 나머지 주소는 그대로 둔다.
export const normalizeAddressProvince = (address: string): string => {
  const tokens = address.trim().split(/\s+/);
  if (tokens.length < 2 || !LEGACY_PREFIXES.has(tokens[0])) return address;
  return [MERGED_PROVINCE, ...tokens.slice(1)].join(' ');
};
