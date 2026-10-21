// 랜딩 문구 — 00-45 §5(바로 보기 11칸) · §6-2(소개 표). 기능이 바뀌면 00-45 표를 먼저 고친다.
import { KAKAO_CHANNEL_CHAT_URL } from '../../config';

export type QuickKind = 'link' | 'external' | 'memorial-entry';
export type QuickIcon =
  | 'pin' | 'phone' | 'box' | 'users' | 'note' | 'mail' | 'list' | 'tree' | 'card' | 'chat' | 'link';

export interface QuickItem {
  name: string;
  kind: QuickKind;
  /** link · external 일 때 가는 곳 */
  to?: string;
  icon: QuickIcon;
}

// 데스크톱 묶음 3개(00-45 §5). 모바일은 같은 순서로 이어 붙여 11칸을 한 화면에 보인다.
export const QUICK_PAGES: QuickItem[][] = [
  [
    { name: '장사시설 검색', kind: 'link', to: '/facility', icon: 'pin' },
    { name: '모바일 부고장', kind: 'link', to: '/obituary', icon: 'phone' },
    { name: '유품 정리 업체', kind: 'link', to: '/pickup', icon: 'box' },
    { name: '전문가 상담', kind: 'link', to: '/counseling', icon: 'users' },
  ],
  [
    { name: '디지털 엔딩노트', kind: 'link', to: '/ending-note', icon: 'note' },
    { name: '유족 메시지 보관함', kind: 'link', to: '/farewell-messages', icon: 'mail' },
    { name: '상중 행정 가이드', kind: 'link', to: '/care-guide', icon: 'list' },
    { name: '디지털 추모관', kind: 'link', to: '/memorial', icon: 'tree' },
  ],
  [
    { name: '디지털 정산', kind: 'link', to: '/digital-estate', icon: 'card' },
    { name: '카카오톡 문의', kind: 'external', to: KAKAO_CHANNEL_CHAT_URL, icon: 'chat' },
    { name: '추모관 링크로 입장', kind: 'memorial-entry', icon: 'link' },
  ],
];

export interface IntroItem {
  /** 제2부 단계 이름(묶음 머리) */
  stage?: string;
  title: string;
  desc: string;
  points: string[];
  cta: string;
  to: string;
  /** 이미지 대체 글 — 무슨 화면인지 한 줄(00-45 §9) */
  alt: string;
}

export const PART1_INTRO = '미리 적어 두고, 남길 말을 담아 두고, 필요한 것은 전문가에게 묻습니다.';
export const PART2_INTRO = '장례 기간부터 그 이후까지, 해야 할 일의 순서대로 놓았습니다.';

export const PART1: IntroItem[] = [
  {
    title: '디지털 엔딩노트',
    desc: '연명의료 의향, 장례 희망 방식, 유언장 초안까지 정해진 항목을 차근차근 채워 둡니다.',
    points: [
      '손으로 쓴 유언장을 사진으로 찍어 올리면 글자를 읽어 옮겨 적고, 빠진 요건이 없는지 함께 살펴봅니다.',
      '다 쓴 노트는 종이로 인쇄해 보관할 수 있습니다.',
    ],
    cta: '엔딩노트 쓰기',
    to: '/ending-note',
    alt: '디지털 엔딩노트 쓰기 화면',
  },
  {
    title: '유족 메시지 보관함',
    desc: '가족에게 남기고 싶은 말을 글이나 목소리로 담아 둡니다.',
    points: ['말로 녹음하면 글자로 받아 적어 줍니다.', '미리 녹음해 둔 음성 파일을 올려도 됩니다.'],
    cta: '메시지 남기기',
    to: '/farewell-messages',
    alt: '유족 메시지 보관함 화면',
  },
  {
    title: '전문가 상담',
    desc: '변호사·법무사·세무사·행정사·장례지도사에게 분야별로 상담을 신청합니다.',
    points: ['상속세가 얼마쯤 나올지 미리 계산해 볼 수 있습니다.'],
    cta: '상담 신청하기',
    to: '/counseling',
    alt: '전문가 상담 신청 화면',
  },
];

export const PART2: IntroItem[] = [
  {
    stage: '장례 기간',
    title: '장사시설 검색',
    desc: '장례식장·화장시설 등 장사시설을 찾습니다.',
    points: ['지금 있는 곳에서 가까운 순서로 보여 줍니다.', '지도에서 위치를 바로 확인합니다.'],
    cta: '장사시설 찾기',
    to: '/facility',
    alt: '장사시설 검색 화면',
  },
  {
    stage: '장례 기간',
    title: '모바일 부고장',
    desc: '부고를 링크 하나로 만들어 알립니다.',
    points: ['카카오톡으로 바로 보낼 수 있습니다.', '문자나 링크 복사로도 전할 수 있습니다.'],
    cta: '부고장 만들기',
    to: '/obituary',
    alt: '모바일 부고장 만들기 화면',
  },
  {
    stage: '장례 후',
    title: '상중 행정 가이드',
    desc: '사망 후 해야 할 행정 절차를 기한 순서대로 모았습니다.',
    points: [
      '장례 기간부터 6개월 이후까지 시기별 체크리스트로 하나씩 표시하며 챙깁니다.',
      '상속포기·한정승인처럼 기한이 있는 일(3개월)은 따로 알려 줍니다.',
    ],
    cta: '할 일 확인하기',
    to: '/care-guide',
    alt: '상중 행정 가이드 화면',
  },
  {
    stage: '장례 후',
    title: '전문가 상담',
    desc: '상속·세금·행정 문제를 분야별 전문가에게 묻습니다.',
    points: ['상속세가 얼마쯤 나올지 미리 계산해 볼 수 있습니다.'],
    cta: '상담 신청하기',
    to: '/counseling',
    alt: '전문가 상담 신청 화면',
  },
  {
    stage: '정리와 기억',
    title: '유품 정리 업체',
    desc: '유품 정리·수거 업체를 찾아 연결합니다.',
    points: ['시·도와 시·군·구를 골라 가까운 업체를 찾습니다.'],
    cta: '업체 찾기',
    to: '/pickup',
    alt: '유품 정리 업체 검색 화면',
  },
  {
    stage: '정리와 기억',
    title: '디지털 정산',
    desc: '고인의 금융 거래와 재산을 찾는 방법을 안내합니다.',
    points: ['한 번에 조회하는 공공 서비스(정부24 안심상속 원스톱) 신청 방법을 단계별로 알려 줍니다.'],
    cta: '정산 안내 보기',
    to: '/digital-estate',
    alt: '디지털 정산 안내 화면',
  },
  {
    stage: '정리와 기억',
    title: '디지털 추모관',
    desc: '조문객이 헌화와 방명록을 남기는 추모 공간을 만듭니다.',
    points: ['링크를 아는 사람에게만 보이도록 공개 범위를 정할 수 있습니다.'],
    cta: '추모관 만들기',
    to: '/memorial',
    alt: '디지털 추모관 만들기 화면',
  },
];
