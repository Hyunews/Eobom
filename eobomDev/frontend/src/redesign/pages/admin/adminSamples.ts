// 8단계 묶음 13 · 운영자 화면 미리보기 값. 정본: 00-37 §4.1 · 01-05 §14-9 · 02-03 §7.4 · 00-41 §5.3 · 판 6-15~6-25.
// 🔴 이름·번호·건수는 미리보기가 지어낸 예시다(10단계 교체 때 서버 응답 — adminOpsController.ts · moderationController.ts 등 — 으로 바꾼다).
// 아래 타입은 서버 응답 모양과 같다. 값에 "[예시]"를 붙인 것은 요율처럼 사장님 결정 대기 값이라 진짜처럼 보이면 안 되는 것이다.

export type Tone = 'state' | 'done' | 'faint' | 'danger';

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();
const daysAgo = (d: number, h = 0) => minutesAgo(d * 24 * 60 + h * 60);
const daysLater = (d: number) => new Date(Date.now() + d * 24 * 60 * 60_000).toISOString();

/** 2026.10.23 */
export function ymd(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}
/** 2026.10.23 14:05 */
export function ymdHm(iso: string): string {
  const d = new Date(iso);
  return `${ymd(iso)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
/** 10월 23일 */
export function monthDay(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

/** 미리보기 쪽당 건수 — 쪽 넘김을 보이려고 작게 잡았다(실제 서버는 20건, 시설 격자는 12건) */
export const PREVIEW_PAGE_SIZE = 6;

// ───────────── 심사 — 사업자 / 전문가 / 시설 연동 ─────────────
export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
export const REVIEW_LABEL: Record<ReviewStatus, string> = { PENDING: '심사 대기', APPROVED: '승인됨', REJECTED: '반려됨', SUSPENDED: '정지됨' };
/** 갈색 = 처리할 차례 · 완료 = 승인됨 · 🔴 위험 = 운영자·심사가 막은 상태(반려됨 · 정지됨) — 00-37 §4.1 상태 색 */
export const REVIEW_TONE: Record<ReviewStatus, Tone> = { PENDING: 'state', APPROVED: 'done', REJECTED: 'danger', SUSPENDED: 'danger' };
export const REVIEW_FILTER = [
  { value: '', label: '전체 상태' },
  { value: 'PENDING', label: '심사 대기' },
  { value: 'APPROVED', label: '승인됨' },
  { value: 'REJECTED', label: '반려됨' },
  { value: 'SUSPENDED', label: '정지됨' },
];

export interface PartnerRow {
  id: string;
  companyName: string;
  bizRegNo: string;
  ownerName: string;
  contactName: string;
  contactPhone: string;
  email: string;
  status: ReviewStatus;
  rejectReason: string | null;
  suspendReason: string | null;
  createdAt: string;
}
export const PARTNERS: PartnerRow[] = [
  { id: 'p1', companyName: '[예시] 한빛장례식장', bizRegNo: '123-45-67890', ownerName: '김하늘', contactName: '이서준', contactPhone: '010-0000-1111', email: 'hanbit@example.test', status: 'PENDING', rejectReason: null, suspendReason: null, createdAt: daysAgo(0, 3) },
  { id: 'p2', companyName: '[예시] 소담추모공원', bizRegNo: '234-56-78901', ownerName: '박도윤', contactName: '최지아', contactPhone: '010-0000-2222', email: 'sodam@example.test', status: 'PENDING', rejectReason: null, suspendReason: null, createdAt: daysAgo(1, 2) },
  { id: 'p3', companyName: '[예시] 늘푸른장례문화원', bizRegNo: '345-67-89012', ownerName: '정민재', contactName: '한유나', contactPhone: '010-0000-3333', email: 'neulpureun@example.test', status: 'APPROVED', rejectReason: null, suspendReason: null, createdAt: daysAgo(9) },
  { id: 'p4', companyName: '[예시] 햇살수목장', bizRegNo: '456-78-90123', ownerName: '오세린', contactName: '윤태오', contactPhone: '010-0000-4444', email: 'haetsal@example.test', status: 'APPROVED', rejectReason: null, suspendReason: null, createdAt: daysAgo(15) },
  { id: 'p5', companyName: '[예시] 가온장례식장', bizRegNo: '567-89-01234', ownerName: '강하준', contactName: '신예린', contactPhone: '010-0000-5555', email: 'gaon@example.test', status: 'SUSPENDED', rejectReason: null, suspendReason: '10-20 소개 글에 외부 연락처 반복 게시 — 숨김 2회 뒤 정지', createdAt: daysAgo(30) },
  { id: 'p6', companyName: '[예시] 은하봉안당', bizRegNo: '678-90-12345', ownerName: '문서아', contactName: '배지후', contactPhone: '010-0000-6666', email: 'eunha@example.test', status: 'REJECTED', rejectReason: '사업자등록증과 상호가 다릅니다.', suspendReason: null, createdAt: daysAgo(20) },
  { id: 'p7', companyName: '[예시] 다온장례식장', bizRegNo: '789-01-23456', ownerName: '송은우', contactName: '임나경', contactPhone: '010-0000-7777', email: 'daon@example.test', status: 'APPROVED', rejectReason: null, suspendReason: null, createdAt: daysAgo(40) },
];

export const EXPERT_CATEGORY_LABEL: Record<string, string> = {
  LAWYER: '변호사',
  JUDICIAL_SCRIVENER: '상속 법무사',
  TAX_ACCOUNTANT: '세무사',
  ADMINISTRATIVE_SCRIVENER: '행정사',
  FUNERAL_DIRECTOR: '장례지도사',
};
export interface ExpertRow {
  id: string;
  name: string;
  category: keyof typeof EXPERT_CATEGORY_LABEL;
  licenseNo: string;
  licenseOrg: string | null;
  contactPhone: string;
  officeAddress: string | null;
  bio: string | null;
  email: string;
  status: ReviewStatus;
  isPublished: boolean;
  rejectReason: string | null;
  suspendReason: string | null;
  createdAt: string;
}
export const EXPERTS: ExpertRow[] = [
  { id: 'e1', name: '[예시] 김서윤', category: 'LAWYER', licenseNo: '제00-0001호', licenseOrg: '대한변호사협회', contactPhone: '010-1000-1111', officeAddress: '서울특별시 예시구 예시로 1', bio: '상속·유언 분쟁을 주로 맡습니다.', email: 'seoyun@example.test', status: 'PENDING', isPublished: false, rejectReason: null, suspendReason: null, createdAt: daysAgo(0, 5) },
  { id: 'e2', name: '[예시] 이도현', category: 'TAX_ACCOUNTANT', licenseNo: '제00-0002호', licenseOrg: '한국세무사회', contactPhone: '010-1000-2222', officeAddress: '경기도 예시시 예시대로 22', bio: '상속세·증여세 신고를 도와드립니다.', email: 'dohyun@example.test', status: 'APPROVED', isPublished: true, rejectReason: null, suspendReason: null, createdAt: daysAgo(12) },
  { id: 'e3', name: '[예시] 박하은', category: 'JUDICIAL_SCRIVENER', licenseNo: '제00-0003호', licenseOrg: '대한법무사협회', contactPhone: '010-1000-3333', officeAddress: null, bio: null, email: 'haeun@example.test', status: 'APPROVED', isPublished: false, rejectReason: null, suspendReason: null, createdAt: daysAgo(18) },
  { id: 'e4', name: '[예시] 최민준', category: 'ADMINISTRATIVE_SCRIVENER', licenseNo: '제00-0004호', licenseOrg: '한국행정사회', contactPhone: '010-1000-4444', officeAddress: '부산광역시 예시구 예시길 3', bio: '사망 후 행정 절차 대행.', email: 'minjun@example.test', status: 'SUSPENDED', isPublished: false, rejectReason: null, suspendReason: '10-18 자격 정지 통보 확인', createdAt: daysAgo(33) },
  { id: 'e5', name: '[예시] 정수아', category: 'FUNERAL_DIRECTOR', licenseNo: '제00-0005호', licenseOrg: null, contactPhone: '010-1000-5555', officeAddress: null, bio: null, email: 'sooa@example.test', status: 'REJECTED', isPublished: false, rejectReason: '자격증 사본이 식별되지 않습니다.', suspendReason: null, createdAt: daysAgo(22) },
];

export type ClaimStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export interface ClaimRow {
  id: string;
  facilityName: string;
  region: string;
  partnerName: string;
  note: string | null;
  status: ClaimStatus;
  createdAt: string;
}
export const CLAIM_LABEL: Record<ClaimStatus, string> = { PENDING: '심사 대기', APPROVED: '승인됨', REJECTED: '반려됨' };
export const CLAIM_TONE: Record<ClaimStatus, Tone> = { PENDING: 'state', APPROVED: 'done', REJECTED: 'danger' };
export const CLAIM_FILTER = [
  { value: '', label: '전체 상태' },
  { value: 'PENDING', label: '심사 대기' },
  { value: 'APPROVED', label: '승인됨' },
  { value: 'REJECTED', label: '반려됨' },
];
export const CLAIMS: ClaimRow[] = [
  { id: 'c1', facilityName: '[예시] 한빛장례식장', region: '서울 예시구', partnerName: '[예시] 한빛장례식장', note: '대표 직접 신청', status: 'PENDING', createdAt: daysAgo(0, 2) },
  { id: 'c2', facilityName: '[예시] 소담추모공원', region: '경기 예시시', partnerName: '[예시] 소담추모공원', note: null, status: 'PENDING', createdAt: daysAgo(1) },
  { id: 'c3', facilityName: '[예시] 늘푸른 제2장례식장', region: '인천 예시구', partnerName: '[예시] 늘푸른장례문화원', note: '이미 연동된 시설과 같은 주소 — 분쟁 건', status: 'PENDING', createdAt: daysAgo(2) },
  { id: 'c4', facilityName: '[예시] 햇살수목장', region: '강원 예시군', partnerName: '[예시] 햇살수목장', note: '확인 완료', status: 'APPROVED', createdAt: daysAgo(14) },
  { id: 'c5', facilityName: '[예시] 은하봉안당', region: '충남 예시시', partnerName: '[예시] 은하봉안당', note: null, status: 'REJECTED', createdAt: daysAgo(19) },
];

// ───────────── 전체 시설 — 소개 글 숨김 ─────────────
export const INTRO_HIDE_LABEL: Record<string, string> = {
  EXTERNAL_CONTACT: '이어봄 밖 연락 유도',
  PRICE: '가격 글',
  DEFAMATION: '다른 업체 비방·욕설',
};
export interface FacilityAdminRow {
  id: string;
  name: string;
  type: string;
  location: string;
  linked: boolean;
  partnerName: string | null;
  religion: string;
  capacity: string;
  amenities: string[];
  intro: string | null;
  introHidden: { at: string; reason: keyof typeof INTRO_HIDE_LABEL; note: string | null } | null;
}
export const FACILITIES: FacilityAdminRow[] = [
  { id: 'f1', name: '[예시] 한빛장례식장', type: '장례식장', location: '서울특별시 예시구 예시로 10', linked: true, partnerName: '[예시] 한빛장례식장', religion: '종교 없음', capacity: '300명', amenities: ['식당', '주차장', '유족대기실'], intro: '24시간 상담이 가능하고, 유족 대기실을 따로 마련해 두었습니다.', introHidden: null },
  { id: 'f2', name: '[예시] 늘푸른장례문화원', type: '장례식장', location: '인천광역시 예시구 예시길 5', linked: true, partnerName: '[예시] 늘푸른장례문화원', religion: '불교', capacity: '200명', amenities: ['식당', '매점'], intro: '자세한 문의는 카카오 오픈채팅으로 연락 주세요.', introHidden: { at: daysAgo(3), reason: 'EXTERNAL_CONTACT', note: '저장 때 못 거른 표현' } },
  { id: 'f3', name: '[예시] 소담추모공원', type: '묘지/수목장', location: '경기도 예시시 예시대로 77', linked: true, partnerName: '[예시] 소담추모공원', religion: '전체 종교', capacity: '—', amenities: ['주차장'], intro: '전국 최저가 보장, 타 업체보다 항상 저렴합니다.', introHidden: null },
  { id: 'f4', name: '[예시] 보람장례식장', type: '장례식장', location: '대전광역시 예시구 예시로 3', linked: false, partnerName: null, religion: '전체 종교', capacity: '100~300명', amenities: [], intro: null, introHidden: null },
  { id: 'f5', name: '[예시] 하늘공원 봉안당', type: '묘지/수목장', location: '충청북도 예시군 예시면 12', linked: false, partnerName: null, religion: '전체 종교', capacity: '—', amenities: [], intro: null, introHidden: null },
  { id: 'f6', name: '[예시] 그린장례식장', type: '장례식장', location: '광주광역시 예시구 예시로 8', linked: false, partnerName: null, religion: '전체 종교', capacity: '100~300명', amenities: [], intro: null, introHidden: null },
  { id: 'f7', name: '[예시] 평안추모원', type: '묘지/수목장', location: '전라북도 예시시 예시로 41', linked: true, partnerName: '[예시] 햇살수목장', religion: '개신교', capacity: '—', amenities: ['주차장', '장애인편의시설'], intro: '조용한 숲속에서 고인을 기릴 수 있습니다.', introHidden: null },
];

// ───────────── 업체 문의 ─────────────
export type LeadStatus = 'REQUESTED' | 'NOTIFIED' | 'RESPONDED' | 'CONVERTED' | 'LOST' | 'INVALID';
export const LEAD_LABEL: Record<LeadStatus, string> = { REQUESTED: '접수', NOTIFIED: '전달됨', RESPONDED: '응답완료', CONVERTED: '성사', LOST: '무산', INVALID: '무효 처리' };
/** 접수 · 전달됨 · 응답완료 = 갈색(처리할 차례) · 성사 = 완료 · 무산 · 무효 처리 = 보조 — 01-05 §14-4 */
export const LEAD_TONE: Record<LeadStatus, Tone> = { REQUESTED: 'state', NOTIFIED: 'state', RESPONDED: 'state', CONVERTED: 'done', LOST: 'faint', INVALID: 'faint' };
export const LEAD_FILTER = [{ value: '', label: '전체 상태' }, ...(Object.keys(LEAD_LABEL) as LeadStatus[]).map((v) => ({ value: v, label: LEAD_LABEL[v] }))];
export const LEAD_TYPE_LABEL: Record<string, string> = { QUOTE: '업체 상담', CONSULT: '상담신청', CALL: '전화클릭' };
export const LOST_REASON_LABEL: Record<string, string> = {
  CONDITION: '조건(가격, 수용인원 등)이 맞지 않음',
  NO_CONTACT: '신청자와 연락이 닿지 않음',
  PLAN_CHANGED: '신청자의 계획 변경',
  OTHER: '기타',
};
export interface LeadAdminRow {
  id: string;
  leadNo: string;
  type: keyof typeof LEAD_TYPE_LABEL;
  status: LeadStatus;
  facilityName: string;
  partnerName: string | null;
  applicantName: string;
  applicantPhone: string;
  message: string | null;
  lostReason: keyof typeof LOST_REASON_LABEL | null;
  lostNote: string | null;
  billable: boolean;
  createdAt: string;
}
export const LEADS: LeadAdminRow[] = [
  { id: 'l1', leadNo: 'EB-261023-0004', type: 'QUOTE', status: 'RESPONDED', facilityName: '[예시] 한빛장례식장', partnerName: '[예시] 한빛장례식장', applicantName: '김*수', applicantPhone: '010-****-1234', message: '3일장으로 100명 정도 예상합니다. 견적 부탁드립니다.', lostReason: null, lostNote: null, billable: false, createdAt: daysAgo(0, 4) },
  { id: 'l2', leadNo: 'EB-261022-0003', type: 'CONSULT', status: 'CONVERTED', facilityName: '[예시] 늘푸른장례문화원', partnerName: '[예시] 늘푸른장례문화원', applicantName: '이*영', applicantPhone: '010-****-5678', message: '불교식 장례 가능한지 문의합니다.', lostReason: null, lostNote: null, billable: false, createdAt: daysAgo(1) },
  { id: 'l3', leadNo: 'EB-261021-0002', type: 'QUOTE', status: 'LOST', facilityName: '[예시] 소담추모공원', partnerName: '[예시] 소담추모공원', applicantName: '박*호', applicantPhone: '010-****-9012', message: '수목장 비용이 궁금합니다.', lostReason: 'CONDITION', lostNote: null, billable: false, createdAt: daysAgo(2) },
  { id: 'l4', leadNo: 'EB-261020-0001', type: 'CALL', status: 'NOTIFIED', facilityName: '[예시] 한빛장례식장', partnerName: '[예시] 한빛장례식장', applicantName: '(비회원)', applicantPhone: '—', message: null, lostReason: null, lostNote: null, billable: false, createdAt: daysAgo(3) },
  { id: 'l5', leadNo: 'EB-261019-0003', type: 'QUOTE', status: 'CONVERTED', facilityName: '[예시] 햇살수목장', partnerName: '[예시] 햇살수목장', applicantName: '최*아', applicantPhone: '010-****-3456', message: '부모님 두 분을 함께 모시고 싶습니다.', lostReason: null, lostNote: null, billable: true, createdAt: daysAgo(4) },
  { id: 'l6', leadNo: 'EB-261018-0002', type: 'QUOTE', status: 'REQUESTED', facilityName: '[예시] 늘푸른장례문화원', partnerName: '[예시] 늘푸른장례문화원', applicantName: '정*민', applicantPhone: '010-****-7890', message: '테스트', lostReason: null, lostNote: null, billable: false, createdAt: daysAgo(5) },
  { id: 'l7', leadNo: 'EB-261017-0001', type: 'QUOTE', status: 'INVALID', facilityName: '[예시] 한빛장례식장', partnerName: '[예시] 한빛장례식장', applicantName: '장*난', applicantPhone: '010-****-0000', message: 'ㅋㅋㅋ', lostReason: null, lostNote: null, billable: false, createdAt: daysAgo(6) },
];

// ───────────── 상담 신청(조회만) ─────────────
export const CONSULT_STATUS_LABEL: Record<string, string> = { REQUESTED: '접수', ACCEPTED: '수락됨', COMPLETED: '상담 완료', CANCELLED: '취소됨', INVALID: '무효 처리' };
export const CONSULT_STATUS_TONE: Record<string, Tone> = { REQUESTED: 'state', ACCEPTED: 'state', COMPLETED: 'done', CANCELLED: 'faint', INVALID: 'faint' };
export const CONSULT_FILTER = [{ value: '', label: '전체 상태' }, ...Object.entries(CONSULT_STATUS_LABEL).map(([value, label]) => ({ value, label }))];
/** 경로 = 한글(2026-10-19 개발자, 02-03 §7.3-1) — 알림톡 · 전화 · 화상 · 방문 */
export const CONSULT_CHANNEL_LABEL: Record<string, string> = { ALIMTALK: '알림톡', PHONE: '전화', VIDEO: '화상', VISIT: '방문' };
export interface ConsultAdminRow {
  id: string;
  consultNo: string;
  status: keyof typeof CONSULT_STATUS_LABEL;
  applicantName: string | null;
  applicantPhone: string;
  channel: keyof typeof CONSULT_CHANNEL_LABEL;
  /** 구분 — 생전 상담 · 사후 상담 */
  kind: '생전 상담' | '사후 상담';
  expertName: string;
  expertCategory: keyof typeof EXPERT_CATEGORY_LABEL;
  content: string;
  createdAt: string;
}
export const CONSULTS: ConsultAdminRow[] = [
  { id: 'q1', consultNo: 'CS-261023-0002', status: 'REQUESTED', applicantName: '김*수', applicantPhone: '010-****-1111', channel: 'ALIMTALK', kind: '사후 상담', expertName: '[예시] 김서윤', expertCategory: 'LAWYER', content: '형제 사이에 유언장 효력을 두고 다툼이 있습니다.', createdAt: daysAgo(0, 2) },
  { id: 'q2', consultNo: 'CS-261022-0001', status: 'ACCEPTED', applicantName: null, applicantPhone: '010-****-2222', channel: 'PHONE', kind: '생전 상담', expertName: '[예시] 이도현', expertCategory: 'TAX_ACCOUNTANT', content: '상속세 신고 기한이 궁금합니다.', createdAt: daysAgo(1) },
  { id: 'q3', consultNo: 'CS-261020-0004', status: 'COMPLETED', applicantName: '박*연', applicantPhone: '010-****-3333', channel: 'VIDEO', kind: '사후 상담', expertName: '[예시] 박하은', expertCategory: 'JUDICIAL_SCRIVENER', content: '부동산 상속 등기 절차를 알고 싶습니다.', createdAt: daysAgo(3) },
  { id: 'q4', consultNo: 'CS-261019-0002', status: 'CANCELLED', applicantName: '최*훈', applicantPhone: '010-****-4444', channel: 'VISIT', kind: '사후 상담', expertName: '[예시] 최민준', expertCategory: 'ADMINISTRATIVE_SCRIVENER', content: '사망신고 뒤 정리할 서류가 궁금합니다.', createdAt: daysAgo(4) },
  { id: 'q5', consultNo: 'CS-261018-0001', status: 'INVALID', applicantName: null, applicantPhone: '010-****-5555', channel: 'ALIMTALK', kind: '생전 상담', expertName: '[예시] 김서윤', expertCategory: 'LAWYER', content: '시험', createdAt: daysAgo(5) },
];

// ───────────── 회원 ─────────────
export const VISIBILITY_LABEL: Record<string, string> = { LINK_ONLY: '링크로만 공개', PRIVATE: '비공개' };
export interface MemberRow {
  id: string;
  name: string;
  email: string | null;
  role: 'USER' | 'EXPERT' | 'ADMIN';
  createdAt: string;
  guestbookCount: number;
  memorials: { id: string; deceasedName: string; visibility: keyof typeof VISIBILITY_LABEL }[];
  obituaries: { id: string; deceasedName: string }[];
  suspendedAt: string | null;
  /** 운영자 메모 — 운영자 화면에만 보인다(회원에게는 고정 문구만) */
  suspendReason: string | null;
  /** 탈퇴 유예 중이면 파기 예정 시각 */
  deletionScheduledAt: string | null;
}
export const MEMBERS: MemberRow[] = [
  { id: 'm1', name: '[예시] 김지우', email: 'jiwoo@example.test', role: 'USER', createdAt: daysAgo(0, 6), guestbookCount: 2, memorials: [{ id: 'mo1', deceasedName: '이영호', visibility: 'LINK_ONLY' }, { id: 'mo2', deceasedName: '박순자', visibility: 'PRIVATE' }], obituaries: [{ id: 'ob1', deceasedName: '이영호' }], suspendedAt: null, suspendReason: null, deletionScheduledAt: null },
  { id: 'm2', name: '[예시] 이서연', email: null, role: 'USER', createdAt: daysAgo(1), guestbookCount: 0, memorials: [], obituaries: [], suspendedAt: null, suspendReason: null, deletionScheduledAt: null },
  { id: 'm3', name: '[예시] 박준서', email: 'junseo@example.test', role: 'EXPERT', createdAt: daysAgo(4), guestbookCount: 5, memorials: [], obituaries: [], suspendedAt: null, suspendReason: null, deletionScheduledAt: null },
  { id: 'm4', name: '[예시] 최하린', email: 'harin@example.test', role: 'USER', createdAt: daysAgo(8), guestbookCount: 1, memorials: [{ id: 'mo3', deceasedName: '최만수', visibility: 'LINK_ONLY' }], obituaries: [{ id: 'ob2', deceasedName: '최만수' }, { id: 'ob3', deceasedName: '최영자' }], suspendedAt: daysAgo(2), suspendReason: '10-21 방명록 광고 글 반복 게시(약관 위반)', deletionScheduledAt: null },
  { id: 'm5', name: '[예시] 정도윤', email: 'doyun@example.test', role: 'USER', createdAt: daysAgo(12), guestbookCount: 0, memorials: [], obituaries: [], suspendedAt: null, suspendReason: null, deletionScheduledAt: daysLater(21) },
  { id: 'm6', name: '[예시] 한소율', email: 'soyul@example.test', role: 'ADMIN', createdAt: daysAgo(60), guestbookCount: 0, memorials: [], obituaries: [], suspendedAt: null, suspendReason: null, deletionScheduledAt: null },
  { id: 'm7', name: '[예시] 윤재민', email: 'jaemin@example.test', role: 'USER', createdAt: daysAgo(75), guestbookCount: 9, memorials: [{ id: 'mo4', deceasedName: '윤태식', visibility: 'LINK_ONLY' }], obituaries: [], suspendedAt: null, suspendReason: null, deletionScheduledAt: null },
];

// ───────────── 추모관 · 부고장 ─────────────
export interface MemorialAdminRow {
  id: string;
  deceasedName: string;
  ownerName: string;
  visibility: keyof typeof VISIBILITY_LABEL;
  /** 운영자가 내린 시각 · 사유 */
  hidden: { at: string; reason: string } | null;
  createdAt: string;
  guestbook: { id: string; author: string; text: string; hidden: boolean }[];
}
export const MEMORIALS: MemorialAdminRow[] = [
  { id: 'mo1', deceasedName: '이영호', ownerName: '[예시] 김지우', visibility: 'LINK_ONLY', hidden: null, createdAt: daysAgo(3), guestbook: [{ id: 'g1', author: '박*현', text: '편히 쉬세요. 좋은 분이셨습니다.', hidden: false }, { id: 'g2', author: '(방문자)', text: '광고성 글 예시입니다. 링크를 눌러 보세요.', hidden: false }] },
  { id: 'mo2', deceasedName: '박순자', ownerName: '[예시] 김지우', visibility: 'PRIVATE', hidden: null, createdAt: daysAgo(5), guestbook: [] },
  { id: 'mo3', deceasedName: '최만수', ownerName: '[예시] 최하린', visibility: 'LINK_ONLY', hidden: { at: daysAgo(2), reason: '신고 없이 운영자 점검 중 부적절한 사진 확인' }, createdAt: daysAgo(9), guestbook: [{ id: 'g3', author: '최*아', text: '그립습니다.', hidden: false }] },
  { id: 'mo4', deceasedName: '윤태식', ownerName: '[예시] 윤재민', visibility: 'LINK_ONLY', hidden: null, createdAt: daysAgo(20), guestbook: [{ id: 'g4', author: '윤*민', text: '아버지, 감사했습니다.', hidden: false }, { id: 'g5', author: '이*서', text: '삼가 고인의 명복을 빕니다.', hidden: false }, { id: 'g6', author: '한*율', text: '오래 기억하겠습니다.', hidden: true }] },
];
export type ObitStatus = 'ACTIVE' | 'CLOSED' | 'AUTO_CLOSED';
export const OBIT_LABEL: Record<ObitStatus, string> = { ACTIVE: '활성', CLOSED: '종료', AUTO_CLOSED: '자동 종료' };
/** 활성 = 완료 · 종료 · 자동 종료 = 보조(누가 닫았는지는 서버가 저장하지 않아 가르지 않는다) */
export const OBIT_TONE: Record<ObitStatus, Tone> = { ACTIVE: 'done', CLOSED: 'faint', AUTO_CLOSED: 'faint' };
export interface ObituaryAdminRow {
  id: string;
  deceasedName: string;
  ownerName: string;
  status: ObitStatus;
  funeralDate: string;
  createdAt: string;
}
export const OBITUARIES: ObituaryAdminRow[] = [
  { id: 'ob1', deceasedName: '이영호', ownerName: '[예시] 김지우', status: 'ACTIVE', funeralDate: daysLater(1), createdAt: daysAgo(2) },
  { id: 'ob2', deceasedName: '최만수', ownerName: '[예시] 최하린', status: 'ACTIVE', funeralDate: daysLater(2), createdAt: daysAgo(3) },
  { id: 'ob3', deceasedName: '최영자', ownerName: '[예시] 최하린', status: 'CLOSED', funeralDate: daysAgo(6), createdAt: daysAgo(9) },
  { id: 'ob4', deceasedName: '강문식', ownerName: '[예시] 강민아', status: 'AUTO_CLOSED', funeralDate: daysAgo(12), createdAt: daysAgo(16) },
];

// ───────────── 사망 확인 ─────────────
export const DV_METHOD_LABEL: Record<string, string> = { FUNERAL_HALL: '장례식장 전화 확인', OTHER: '기타(최고 관리자만)' };
export const DV_REJECT_LABEL: Record<string, string> = {
  HALL_NOT_FOUND: '장례식장에서 확인되지 않음',
  NAME_MISMATCH: '고인 성함 불일치',
  UNREACHABLE: '연락 닿지 않음',
  OTHER: '기타',
};
export interface DeathVerificationRow {
  id: string;
  deceasedName: string;
  memberName: string;
  requestedAt: string;
  dueAt: string;
  targetAt: string;
  funeralHallName: string | null;
  funeralHallPhone: string | null;
  requesterName: string;
  requesterRelation: string;
  requesterPhone: string;
}
export const DEATH_VERIFICATIONS: DeathVerificationRow[] = [
  { id: 'd1', deceasedName: '[예시] 이영호', memberName: '[예시] 김지우', requestedAt: daysAgo(5), dueAt: daysAgo(0, 2), targetAt: daysAgo(2), funeralHallName: '[예시] 한빛장례식장', funeralHallPhone: '02-0000-0001', requesterName: '[예시] 이민수', requesterRelation: '자녀', requesterPhone: '010-0000-0101' },
  { id: 'd2', deceasedName: '[예시] 박순자', memberName: '[예시] 박준서', requestedAt: daysAgo(3), dueAt: daysLater(1), targetAt: daysAgo(0, 4), funeralHallName: null, funeralHallPhone: null, requesterName: '[예시] 박지원', requesterRelation: '배우자', requesterPhone: '010-0000-0202' },
  { id: 'd3', deceasedName: '[예시] 최만수', memberName: '[예시] 최하린', requestedAt: daysAgo(0, 6), dueAt: daysLater(4), targetAt: daysLater(2), funeralHallName: '[예시] 늘푸른장례문화원', funeralHallPhone: '032-0000-0003', requesterName: '[예시] 최유진', requesterRelation: '형제자매', requesterPhone: '010-0000-0303' },
];
export type DvDeadline = 'over-due' | 'over-target' | 'ok';
export function dvDeadline(r: DeathVerificationRow, now = Date.now()): DvDeadline {
  if (new Date(r.dueAt).getTime() < now) return 'over-due';
  if (new Date(r.targetAt).getTime() < now) return 'over-target';
  return 'ok';
}
export function remaining(iso: string, now = Date.now()): string {
  const diff = new Date(iso).getTime() - now;
  const abs = Math.abs(diff);
  const d = Math.floor(abs / 86_400_000);
  const h = Math.floor((abs % 86_400_000) / 3_600_000);
  const t = d > 0 ? `${d}일 ${h}시간` : `${h}시간`;
  return diff >= 0 ? `${t} 남음` : `${t} 지남`;
}

// ───────────── 유족메시지 파기 ─────────────
export type PurgeKind = 'V' | 'R' | 'L' | 'I';
export const PURGE_KIND_LABEL: Record<PurgeKind, string> = { V: '삭제된 음성', R: '밀려난 음성', L: '편지 통째', I: '유언장 사진' };
export const PURGE_KIND_TIP: Record<PurgeKind, string> = {
  V: '편지는 그대로 두고 음성 파일만 지운 것 — 삭제 뒤 30일이 지난 음성입니다.',
  R: '삭제 유예 중 새 음성이 들어와 옮겨진 이전 음성 — 30일이 지난 것입니다.',
  L: '본인이 편지를 통째로 지운 것 — 삭제 뒤 30일이 지난 편지입니다.',
  I: '본인이 지운 유언장 사진 묶음 — 삭제 뒤 30일이 지난 것입니다.',
};
export interface PurgeItem {
  key: string;
  kind: PurgeKind;
  /** 대상은 짧은 번호만 — 편지 제목·회원 이름은 넣지 않는다(06-05 §5.6-8-1-1) */
  target: string;
  deletedAt: string;
}
export const PURGE_ITEMS: PurgeItem[] = [
  { key: 'V:1', kind: 'V', target: '음성 · …a3f9', deletedAt: daysAgo(37) },
  { key: 'V:2', kind: 'V', target: '음성 · …7c21', deletedAt: daysAgo(34) },
  { key: 'R:1', kind: 'R', target: '음성 · …e08d', deletedAt: daysAgo(33) },
  { key: 'L:1', kind: 'L', target: '편지 · …5b72 (음성 포함)', deletedAt: daysAgo(32) },
  { key: 'L:2', kind: 'L', target: '편지 · …19ac', deletedAt: daysAgo(31) },
  { key: 'I:1', kind: 'I', target: '유언장 사진 · …c4e0 (3쪽)', deletedAt: daysAgo(30) },
];
export interface ArchiveTodo {
  id: string;
  fileKey: string;
  bucket: string;
  step1At: string;
}
export const ARCHIVE_TODOS: ArchiveTodo[] = [
  { id: 'a1', fileKey: 'farewell/2026/09/…a3f9.m4a', bucket: 'eobom-archive', step1At: daysAgo(8) },
  { id: 'a2', fileKey: 'farewell/2026/09/…7c21.m4a', bucket: 'eobom-archive', step1At: daysAgo(6) },
];
export interface PurgeLog {
  id: string;
  at: string;
  by: string;
  counts: Partial<Record<PurgeKind, number>>;
}
export const PURGE_LOGS: PurgeLog[] = [
  { id: 'pl1', at: daysAgo(14), by: '[예시] 운영자', counts: { V: 3, L: 1 } },
  { id: 'pl2', at: daysAgo(44), by: '[예시] 운영자', counts: { V: 2, R: 1, I: 1 } },
];
export const daysSince = (iso: string, now = Date.now()) => Math.floor((now - new Date(iso).getTime()) / 86_400_000);

// ───────────── 요율 등록(값은 예시) ─────────────
export const RATE_BASIS_LABEL: Record<string, string> = {
  PER_CONVERSION: '성사 건당 (예시 이름)',
  PER_LEAD: '문의 건당 (예시 이름)',
  MONTHLY_FLAT: '월 정액 (예시 이름)',
};
export interface RateRow {
  id: string;
  basis: keyof typeof RATE_BASIS_LABEL;
  amount: number | null;
  rate: number | null;
  partnerName: string | null;
  effectiveFrom: string;
  effectiveTo: string | null;
  memo: string | null;
}
export const RATES: RateRow[] = [
  { id: 'r1', basis: 'PER_CONVERSION', amount: 10000, rate: null, partnerName: null, effectiveFrom: '2026-10-01', effectiveTo: null, memo: '[예시] 기본 요율 틀 확인용 값' },
  { id: 'r2', basis: 'PER_CONVERSION', amount: null, rate: 0.05, partnerName: '[예시] 늘푸른장례문화원', effectiveFrom: '2026-10-01', effectiveTo: '2026-12-31', memo: '[예시] 특약 틀 확인용 값' },
];

// ───────────── 감사로그 · 운영자 계정 ─────────────
export interface AuditRow {
  id: string;
  createdAt: string;
  adminName: string;
  action: string;
  targetType: string;
  targetId: string;
  reason: string | null;
  result: 'SUCCESS' | 'FAIL';
  ip: string | null;
  requestId: string | null;
}
export const AUDIT_ACTIONS = [
  'LOGIN', 'LOGIN_FAIL', 'LOCKED', 'LIST', 'VIEW', 'CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'SUSPEND', 'UNSUSPEND',
  'WITHDRAW', 'HIDE', 'UNHIDE', 'CLOSE', 'PURGE', 'MEMORIALIZE', 'CONFIRM_BILLABLE', 'INVALIDATE',
];
export const AUDIT_ROWS: AuditRow[] = [
  { id: 'au1', createdAt: minutesAgo(4), adminName: '[예시] 운영자', action: 'SUSPEND', targetType: 'User', targetId: 'f3b1…c9a2', reason: '약관 위반 — 반복 광고 글', result: 'SUCCESS', ip: '203.0.113.7', requestId: 'req-8f2a91' },
  { id: 'au2', createdAt: minutesAgo(22), adminName: '[예시] 운영자', action: 'PURGE', targetType: 'FarewellPurge', targetId: '(선택 4건)', reason: null, result: 'FAIL', ip: '203.0.113.7', requestId: 'req-8f2a77' },
  { id: 'au3', createdAt: minutesAgo(61), adminName: '[예시] 심사원', action: 'APPROVE', targetType: 'DeathVerification', targetId: 'd1c0…77be', reason: 'FUNERAL_HALL', result: 'SUCCESS', ip: '198.51.100.24', requestId: 'req-8f2a40' },
  { id: 'au4', createdAt: minutesAgo(130), adminName: '[예시] 심사원', action: 'VIEW', targetType: 'User', targetId: 'a82e…10fd', reason: '문의 메일 확인', result: 'SUCCESS', ip: '198.51.100.24', requestId: 'req-8f2a12' },
  { id: 'au5', createdAt: minutesAgo(300), adminName: '', action: 'LOGIN_FAIL', targetType: 'Admin', targetId: '', reason: null, result: 'FAIL', ip: '192.0.2.88', requestId: 'req-8f29c0' },
  { id: 'au6', createdAt: minutesAgo(520), adminName: '[예시] 운영자', action: 'HIDE', targetType: 'Memorial', targetId: '09bd…5e31', reason: '부적절한 사진', result: 'SUCCESS', ip: '203.0.113.7', requestId: 'req-8f2988' },
  { id: 'au7', createdAt: minutesAgo(900), adminName: '[예시] 운영자', action: 'LIST', targetType: 'Partner', targetId: '', reason: null, result: 'SUCCESS', ip: '203.0.113.7', requestId: 'req-8f2931' },
];
export interface AdminAccountRow {
  id: string;
  name: string;
  email: string;
  role: 'SUPERADMIN' | 'OPERATOR';
  createdAt: string;
}
export const ADMIN_ACCOUNTS: AdminAccountRow[] = [
  { id: 'ad1', name: '[예시] 운영자', email: 'ops@example.test', role: 'SUPERADMIN', createdAt: daysAgo(120) },
  { id: 'ad2', name: '[예시] 심사원', email: 'review@example.test', role: 'OPERATOR', createdAt: daysAgo(40) },
  { id: 'ad3', name: '[예시] 조회 전담', email: 'viewer@example.test', role: 'OPERATOR', createdAt: daysAgo(10) },
];
