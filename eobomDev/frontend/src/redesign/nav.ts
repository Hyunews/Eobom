// 메뉴 항목 — 랜딩 캔버스 "메뉴 펼침" 판. 번호는 부마다 01부터 센다(개편 §4-1).
// 경로는 지금 화면의 경로다(새 화면으로 교체될 때까지 같은 주소를 쓴다).
export interface NavItem {
  label: string;
  to: string;
}

export const PART1_TITLE = '제1부 · 생전 준비';
export const PART2_TITLE = '제2부 · 임종 및 사후 정리';

export const PART1_ITEMS: NavItem[] = [
  { label: '디지털 엔딩노트', to: '/ending-note' },
  { label: '유족 메시지 보관함', to: '/farewell-messages' },
  { label: '전문가 상담', to: '/counseling' },
];

export const PART2_ITEMS: NavItem[] = [
  { label: '상중 행정 가이드', to: '/care-guide' },
  { label: '장사시설 검색', to: '/facility' },
  { label: '전문가 상담', to: '/counseling' },
  { label: '모바일 부고장', to: '/obituary' },
  { label: '유품 정리 업체 검색', to: '/pickup' },
  { label: '디지털 정산', to: '/digital-estate' },
  { label: '디지털 추모관', to: '/memorial' },
];

// 00-44 §5-2 — 모바일 배치로 넘어가는 폭(767px 이하)
export const MOBILE_MAX = 767;
