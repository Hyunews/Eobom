// 8단계 묶음 5 · 장사시설 미리보기용 예시 시설. 실제 시설이 아니다(판 2-6~2-27 예시 이름). 서버를 부르지 않는다.
// 태그 값·분류는 지금 코드(components/facility/tagCatalog.ts)를 그대로 읽어 쓴다.

export interface DemoFacility {
  id: string;
  name: string;
  type: '장례식장' | '묘지/수목장';
  location: string;
  province: string;
  district: string;
  tags: string[];
  distanceKm: number;
  lat: number;
  lng: number;
  isPartner: boolean;
  religion: string;
  guests: string;
  amenities: string[];
  intro: string | null;
}

const f = (
  id: string,
  name: string,
  type: DemoFacility['type'],
  location: string,
  province: string,
  district: string,
  tags: string[],
  distanceKm: number,
  lat: number,
  lng: number,
): DemoFacility => ({
  id, name, type, location, province, district, tags, distanceKm, lat, lng,
  isPartner: false, religion: '전체 종교', guests: '전체 규모', amenities: [], intro: null,
});

export const DEMO_FACILITIES: DemoFacility[] = [
  // 제휴 시설 예시 — 판 2-25. 사업자가 소개 글·종교·수용 규모·부대시설을 고친 시설
  {
    ...f('example-partner', '한결 장례식장', '장례식장', '인천 연수구 송도과학로 100 한결의료원 지하 1층', '인천', '연수구', ['사설', '병원'], 3.2, 37.38, 126.66),
    isPartner: true,
    religion: '종교 없음',
    guests: '100~300명',
    amenities: ['식당', '매점', '주차장'],
    intro: '24시간 빈소 운영. 주차 30대 가능.',
  },
  f('example-public', '하늘 추모공원', '묘지/수목장', '인천 남동구 장수동 산 12-3', '인천', '남동구', ['공설', '봉안당'], 5.8, 37.45, 126.74),
  f('d3', '새봄 장례문화원', '장례식장', '인천 미추홀구 매소홀로 305 새봄병원 별관 1층 2층', '인천', '미추홀구', ['사설', '병원'], 7.4, 37.44, 126.67),
  f('d4', '연수 구립 추모원', '묘지/수목장', '인천 연수구 청량로 130', '인천', '연수구', ['공설', '봉안당'], 8.1, 37.41, 126.69),
  f('d5', '부평 가족 안식원', '묘지/수목장', '인천 부평구 평온로 5', '인천', '부평구', ['사설', '자연장'], 9.6, 37.5, 126.72),
  f('d6', '평안 장례식장', '장례식장', '서울 구로구 경인로 662 평안병원 1층', '서울', '구로구', ['사설', '병원'], 21.2, 37.5, 126.88),
  f('d7', '부천 승화원', '묘지/수목장', '경기 부천시 원미구 소향로 88', '경기', '부천시', ['공설', '봉안당'], 17.3, 37.5, 126.78),
  f('d8', '시흥 영락원', '묘지/수목장', '경기 시흥시 하중로 77', '경기', '시흥시', ['사설', '자연장'], 19.8, 37.38, 126.8),
  f('d9', '안산 하늘원', '장례식장', '경기 안산시 단원구 선단로 232', '경기', '안산시', ['사설', '전문'], 24.5, 37.32, 126.83),
  f('d10', '고양 평온원', '장례식장', '경기 고양시 덕양구 통일로 113', '경기', '고양시', ['공설', '전문'], 38.6, 37.64, 126.83),
  f('d11', '서울 시립 장례식장', '장례식장', '서울 중구 소공로 52', '서울', '중구', ['공설', '병원'], 33.0, 37.56, 126.98),
  f('d12', '강남 수목장림', '묘지/수목장', '서울 강남구 헌릉로 590', '서울', '강남구', ['사설', '자연장'], 35.4, 37.46, 127.1),
];

/** 상세 쪽 "비제휴 예시" — 판 2-26. 공공 데이터에 있는 것만(기본값 종교·수용 규모, 부대시설 일부) */
export const DEMO_PUBLIC_DETAIL: DemoFacility = {
  ...DEMO_FACILITIES[1],
  amenities: ['식당', '주차장', '장애인편의시설'],
};

export const PREVIEW_PROVINCES = ['서울', '인천', '경기'];
export const PREVIEW_DISTRICTS: Record<string, string[]> = {
  서울: ['강남구', '구로구', '중구'],
  인천: ['남동구', '미추홀구', '부평구', '연수구'],
  경기: ['고양시', '부천시', '시흥시', '안산시'],
};
