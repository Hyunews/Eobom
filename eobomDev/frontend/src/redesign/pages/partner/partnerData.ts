// 8단계 묶음 10 · 파트너 장사시설 미리보기 값. 정본: 01-05 §14 · 판 6-1~6-9.
// 🔴 이 파일의 시설·문의 값은 미리보기가 지어낸 예시다(10단계 교체 때 서버 응답으로 바꾼다). 이름 앞 [예시]는 판과 같다.

export const PV_PARTNER = {
  index: '/preview/partner',
  login: '/preview/partner/login',
  home: '/preview/partner/home',
  inquiries: '/preview/partner/inquiries',
  facility: '/preview/partner/facility',
  link: '/preview/partner/link',
  account: '/preview/partner/account',
  settlement: '/preview/partner/settlement',
  site: '/preview',
} as const;

// ───── 메뉴 (01-05 §14-1) ─────
export interface PartnerMenuItem {
  key: string;
  label: string;
  to: string;
  /** 응답 전 문의 수 같은 갈색 숫자 */
  badge?: number;
  /** 결정 대기 — 자물쇠 그림 + 보조 글색 */
  locked?: boolean;
}

/** 장사시설 사업자 메뉴. 🔴 제휴 혜택 안내·유품 정리 업체 유형은 넣지 않는다(01-01 §3.3 · 03-03 §8 결정 대기). 전문가 메뉴는 묶음 11. */
export const facilityMenu = (waitingInquiries: number): PartnerMenuItem[] => [
  { key: 'home', label: '홈', to: PV_PARTNER.home },
  { key: 'inquiries', label: '받은 문의', to: PV_PARTNER.inquiries, badge: waitingInquiries },
  { key: 'facility', label: '내 시설', to: PV_PARTNER.facility },
  { key: 'link', label: '시설 연동', to: PV_PARTNER.link },
  { key: 'account', label: '계정 정보', to: PV_PARTNER.account },
  { key: 'settlement', label: '정산', to: PV_PARTNER.settlement, locked: true },
];

export const PARTNER_NAME = '[예시] 한결 장례식장';

// ───── 받은 문의 (01-05 §14-4 · §4.3) ─────
export type LeadStatus = 'REQUESTED' | 'NOTIFIED' | 'RESPONDED' | 'CONVERTED' | 'LOST' | 'INVALID';
export type LeadType = 'QUOTE' | 'CONSULT' | 'CALL';
/** 상태 색(00-44 §6-4): 접수·전달됨·응답완료 = 갈색(처리할 차례) · 성사 = 완료 · 무산·무효 처리 = 보조 */
export type StatusTone = 'state' | 'done' | 'faint';

export const LEAD_STATUS_LABEL: Record<LeadStatus, string> = {
  REQUESTED: '접수',
  NOTIFIED: '전달됨',
  RESPONDED: '응답완료',
  CONVERTED: '성사',
  LOST: '무산',
  INVALID: '무효 처리',
};
export const LEAD_STATUS_TONE: Record<LeadStatus, StatusTone> = {
  REQUESTED: 'state',
  NOTIFIED: 'state',
  RESPONDED: 'state',
  CONVERTED: 'done',
  LOST: 'faint',
  INVALID: 'faint',
};
export const LEAD_TYPE_LABEL: Record<LeadType, string> = { QUOTE: '업체 상담', CONSULT: '상담신청', CALL: '전화클릭' };

/** 목록 위 상태 고르기 — 맨 위 "전체 상태" (코드 값은 지금 코드와 같다) */
export const LEAD_FILTER: { value: '' | LeadStatus; label: string }[] = [
  { value: '', label: '전체 상태' },
  { value: 'REQUESTED', label: '접수' },
  { value: 'NOTIFIED', label: '전달됨' },
  { value: 'RESPONDED', label: '응답완료' },
  { value: 'CONVERTED', label: '성사' },
  { value: 'LOST', label: '무산' },
  { value: 'INVALID', label: '무효 처리' },
];

export interface LeadItem {
  leadNo: string;
  type: LeadType;
  status: LeadStatus;
  facilityName: string;
  applicantName: string;
  applicantPhone: string;
  message?: string;
}

export const LEADS: LeadItem[] = [
  { leadNo: '#1024', type: 'QUOTE', status: 'RESPONDED', facilityName: '한결 장례식장', applicantName: '김○○', applicantPhone: '010-1234-5678', message: '아버님 장례 일정 문의드립니다. 오늘 오후에 통화 가능한 시간을 알려주세요.' },
  { leadNo: '#1023', type: 'CALL', status: 'REQUESTED', facilityName: '한결 장례식장', applicantName: '이○○', applicantPhone: '010-2345-6789' },
  { leadNo: '#1021', type: 'CONSULT', status: 'NOTIFIED', facilityName: '한결 장례식장 별관', applicantName: '박○○', applicantPhone: '010-3456-7890', message: '빈소 두 곳 가능한지 알고 싶습니다.' },
  { leadNo: '#1018', type: 'QUOTE', status: 'CONVERTED', facilityName: '한결 장례식장', applicantName: '최○○', applicantPhone: '010-4567-8901' },
];
/** 목록 쪽 수(미리보기 값 — 실제는 서버 totalPages). 한 쪽 4줄은 판 그대로 */
export const LEAD_TOTAL_COUNT = 12;
export const LEAD_TOTAL_PAGES = 3;

/** 무산 사유 4개 — 이 순서·이 글자(01-05 §4.3). ④ 기타만 글 칸이 열리고 이때 글은 필수. 🔴 허수·장난은 넣지 않는다(INVALID는 운영자만). */
export const LOST_REASONS: { value: 'CONDITION' | 'NO_CONTACT' | 'PLAN_CHANGED' | 'OTHER'; label: string }[] = [
  { value: 'CONDITION', label: '조건(가격, 수용인원 등)이 맞지 않음' },
  { value: 'NO_CONTACT', label: '신청자와 연락이 닿지 않음' },
  { value: 'PLAN_CHANGED', label: '신청자의 계획 변경' },
  { value: 'OTHER', label: '기타(직접 입력)' },
];

// ───── 내 시설 (01-05 §14-5) ─────
export const RELIGIONS = ['종교 없음', '불교', '개신교', '천주교', '원불교', '기타'];
export const AMENITIES = ['식당', '매점', '주차장', '유족대기실', '장애인편의시설'];
/** 숨김 사유 이름(운영자가 고른 코드 → 사업자 화면의 "숨긴 사유: …" 한 줄) */
export const INTRO_HIDE_LABEL: Record<string, string> = {
  EXTERNAL_CONTACT: '이어봄 밖 연락 유도',
  PRICE: '가격 글',
  DEFAMATION: '다른 업체 비방·욕설',
};

export interface MyFacility {
  id: string;
  /** 지역 윗글 */
  region: string;
  name: string;
  kind: string;
  address: string;
  phone: string;
  /** 운영주체(공설/사설) — 서버 tags에서 읽는다 */
  owner: string;
  intro: string;
  religion: string;
  capacity: string;
  amenities: string[];
  /** 운영자가 숨겼으면 사유 코드 */
  hiddenReason?: string;
}

export const MY_FACILITIES: MyFacility[] = [
  {
    id: 'f1',
    region: '서울 강남구',
    name: '[예시] 한결 장례식장',
    kind: '장례식장',
    address: '서울 강남구 [예시]로 12',
    phone: '02-000-0000',
    owner: '사설',
    intro: '[예시] 24시간 빈소 운영. 주차 30대 가능.',
    religion: '종교 없음',
    capacity: '300',
    amenities: ['식당', '매점', '주차장'],
  },
  {
    id: 'f2',
    region: '서울 송파구',
    name: '[예시] 한결 장례식장 별관',
    kind: '장례식장',
    address: '서울 송파구 [예시]로 34',
    phone: '02-000-0001',
    owner: '사설',
    intro: '',
    religion: '종교 없음',
    capacity: '',
    amenities: [],
  },
];

// ───── 시설 연동 (01-05 §14-6) ─────
export interface SearchHit {
  id: string;
  name: string;
  region: string;
  /** 이미 연동된 시설 — 줄에 갈색 글, [연동 신청]은 그대로(코드 그대로 §3.3) */
  linked?: boolean;
}
export const SEARCH_HITS: SearchHit[] = [
  { id: 's1', name: '[예시] 한결 장례식장', region: '서울 강남구' },
  { id: 's2', name: '[예시] 한결 장례식장 별관', region: '서울 송파구', linked: true },
  { id: 's3', name: '[예시] 한결 추모공원', region: '경기 성남시' },
];

export type ClaimStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export const CLAIM_LABEL: Record<ClaimStatus, string> = { PENDING: '심사 대기', APPROVED: '승인됨', REJECTED: '반려됨' };
/** 상태 색: 심사 대기 = 보조 · 승인됨 = 완료 · 반려됨 = 위험 */
export const CLAIM_TONE: Record<ClaimStatus, 'faint' | 'done' | 'danger'> = { PENDING: 'faint', APPROVED: 'done', REJECTED: 'danger' };
export const CLAIMS: { id: string; name: string; status: ClaimStatus }[] = [
  { id: 'c1', name: '[예시] 한결 장례식장 별관', status: 'PENDING' },
  { id: 'c2', name: '[예시] 한결 장례식장', status: 'APPROVED' },
  { id: 'c3', name: '[예시] 한결 봉안당', status: 'REJECTED' },
];

// ───── 입구 (01-05 §14-2) ─────
export const EXPERT_CATEGORIES = [
  { value: 'LAWYER', label: '상속 전문 변호사' },
  { value: 'JUDICIAL_SCRIVENER', label: '상속 법무사' },
  { value: 'TAX_ACCOUNTANT', label: '상속세 전문 세무사' },
  { value: 'ADMINISTRATIVE_SCRIVENER', label: '행정사' },
  { value: 'FUNERAL_DIRECTOR', label: '장례·장지 지도사' },
];

/** 이어봄 밖으로 이끄는 소개 글을 저장 때 막는 규칙(01-05 §14-5) — 서버(backend/src/utils/facilityIntro.ts)와 같은 글. 미리보기가 같은 규칙으로 칸 오류를 보여준다. */
const PHONE_PATTERNS = [/(?:\+?82[-.\s]?)?\(?0\d{1,2}\)?[-.\s]*\d{3,4}[-.\s]*\d{4}/, /\b1[5-9]\d{2}[-.\s]?\d{4}\b/];
const LINK_PATTERN = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(?:com|co\.kr|net|org|kr|io|me|biz|info|kakao)\b)/i;
const KAKAO_PATTERN = /카톡|카카오|오픈\s*채팅|kakao/i;
export function blockedIntroMessage(text: string): string | null {
  if (PHONE_PATTERNS.some((re) => re.test(text))) return '소개 글에는 전화번호를 쓸 수 없습니다.';
  if (LINK_PATTERN.test(text)) return '소개 글에는 홈페이지 주소를 쓸 수 없습니다.';
  if (KAKAO_PATTERN.test(text)) return '소개 글에는 카카오톡·오픈채팅 안내를 쓸 수 없습니다.';
  return null;
}
export const INTRO_MAX = 1000;
