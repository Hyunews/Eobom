// 2026 전남광주통합특별시 출범 반영 — 광주·전남 소속 구/시/군 목록과 주소 선두 시/도 정규화.
// geoController(resolveKakaoQuery)와 facilityController(지역 필터)·시설 데이터 임포트 스크립트가
// 공용으로 쓴다.
export const MERGED_PROVINCE = '전남광주통합특별시';
export const GWANGJU_DISTRICTS = new Set(['동구', '서구', '남구', '북구', '광산구']);

const LEGACY_PREFIXES = new Set(['광주광역시', '광주', '전라남도', '전남']);

// CSV/카카오 원본 주소의 선두 시/도 토큰을 병합 명칭으로 치환한다. 나머지 주소는 그대로 둔다.
export const normalizeAddressProvince = (address: string): string => {
  const tokens = address.trim().split(/\s+/);
  if (tokens.length < 2 || !LEGACY_PREFIXES.has(tokens[0])) return address;
  return [MERGED_PROVINCE, ...tokens.slice(1)].join(' ');
};

// 시/도 표기 정규화 (CSV 원본은 정식 명칭, 카카오 검색 결과는 축약형이라 하나로 통일)
// 광주·전남은 2026년 전남광주통합특별시 출범으로 하나의 시/도로 합쳐 노출한다.
//
// 🔴 2026-09-10 사람 지시 — 필터·위치 표시에는 정식 명칭(MERGED_PROVINCE, '전남광주통합특별시')
// 대신 축약 표시명 '전남광주'를 보여준다. DB에는 여전히 정식 명칭이 저장돼 있다(wt187로 재적재한
// 1073건 전부 이 파일의 normalizeAddressProvince가 붙인 접두어) — 이 별칭표만 두 값을 이어주므로
// DB 재적재 없이도 기존 데이터가 그대로 축약 표시명에 매핑된다.
export const MERGED_PROVINCE_DISPLAY = '전남광주';
export const PROVINCE_ALIASES: Record<string, string> = {
  서울특별시: '서울', 서울: '서울',
  부산광역시: '부산', 부산: '부산',
  대구광역시: '대구', 대구: '대구',
  인천광역시: '인천', 인천: '인천',
  광주광역시: MERGED_PROVINCE_DISPLAY, 광주: MERGED_PROVINCE_DISPLAY,
  대전광역시: '대전', 대전: '대전',
  울산광역시: '울산', 울산: '울산',
  세종특별자치시: '세종', 세종: '세종',
  경기도: '경기', 경기: '경기',
  강원도: '강원', 강원특별자치도: '강원', 강원: '강원',
  충청북도: '충북', 충북: '충북',
  충청남도: '충남', 충남: '충남',
  전라북도: '전북', 전북특별자치도: '전북', 전북: '전북',
  전라남도: MERGED_PROVINCE_DISPLAY, 전남: MERGED_PROVINCE_DISPLAY,
  [MERGED_PROVINCE]: MERGED_PROVINCE_DISPLAY,
  경상북도: '경북', 경북: '경북',
  경상남도: '경남', 경남: '경남',
  제주특별자치도: '제주', 제주: '제주',
};

// PROVINCE_ALIASES의 역방향 조회 — 표시명 하나가 DB에 실제 저장된 여러 원본 표기(정식 명칭·
// 축약형)를 가리킬 수 있다(예: '충북' 표시명의 실제 저장값은 '충청북도'이지 '충북'이 아니다 —
// '충북'은 '충청북도'의 부분 문자열이 아니라서 location.contains로는 못 잡는다). 2026-09-10
// 지역 필터(facilityController)가 이 함수로 location.startsWith 후보 목록을 얻는다.
export const rawKeysForDisplayProvince = (display: string): string[] => {
  const keys = Object.entries(PROVINCE_ALIASES)
    .filter(([, v]) => v === display)
    .map(([k]) => k);
  return keys.length > 0 ? keys : [display];
};
