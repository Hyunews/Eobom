import { RELATIONSHIP_LABEL } from '../../../components/endingNote/constants';

// 8단계 묶음 8 · 내 정보 나머지 미리보기의 예시 값과 규칙 함수.
// 🔴 값은 미리보기용으로 지어낸 것이다(10단계 교체 때 서버 응답으로 바꾼다). 규칙(가족 지정 상태 글 · 조사 · 지정 문구)은
// 지금 코드(MyPageFamilyDesignation · FamilySharedPage)의 판정을 그대로 옮긴 것이다 — 두 파일이 내보내지 않아 복사해 둔 것이라
// 교체 때 한 곳으로 합친다. 관계 이름표는 지금 코드의 RELATIONSHIP_LABEL을 가져다 쓴다.

export { RELATIONSHIP_LABEL };

/** 미리보기가 폭을 흉내 내는 데 쓰는 짧은 지연 */
export const FAKE_MS = 700;

// ───── 내 정보(4-2) ─────
export const CONTACT_TIME_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: '선택 안 함' },
  { value: 'ANYTIME', label: '언제나 괜찮음' },
  { value: 'MORNING', label: '오전' },
  { value: 'AFTERNOON', label: '오후' },
  { value: 'EVENING', label: '저녁' },
];

export interface ProfileData {
  name: string;
  email: string | null;
  contactPhone: string | null; // 마스킹된 값
  addressZonecode: string | null;
  addressRoad: string | null;
  addressDetail: string | null; // 마스킹된 값
  contactTimePref: string | null;
}

export const PROFILE_FILLED: ProfileData = {
  name: '홍길동',
  email: 'hong@example.com',
  contactPhone: '010-****-1234',
  addressZonecode: '04524',
  addressRoad: '서울 중구 세종대로 110',
  addressDetail: '***동 ***호',
  contactTimePref: 'EVENING',
};

export const PROFILE_FIRST: ProfileData = {
  name: '홍길동',
  email: null,
  contactPhone: null,
  addressZonecode: null,
  addressRoad: null,
  addressDetail: null,
  contactTimePref: null,
};

/** [주소 검색]이 채우는 예시 주소(묶음 5 견적 신청 창과 같은 방식 — 교체 때 AddressSearchModal로 잇는다) */
export const EXAMPLE_ADDRESS = { zonecode: '04524', road: '서울 중구 세종대로 110' };

// ───── 가족 지정(4-3) ─────
export const FAMILY_RELATIONS: { value: string; label: string }[] = [
  { value: 'SPOUSE', label: '배우자' },
  { value: 'CHILD', label: '자녀' },
  { value: 'PARENT', label: '부모' },
  { value: 'SIBLING', label: '형제자매' },
  { value: 'OTHER', label: '기타' },
];

export const FAMILY_SCOPES: { value: string; label: string; hint: string }[] = [
  { value: 'VIEWER', label: '연락 대상', hint: '사망 통지 수신 · 추모관 접근' },
  { value: 'PRIMARY', label: '대표 지정인', hint: '엔딩노트 전달 · 정산 실행 요청' },
];
const SCOPE_LABEL: Record<string, string> = Object.fromEntries(FAMILY_SCOPES.map((o) => [o.value, o.label]));
export const scopeLabel = (v: string) => SCOPE_LABEL[v] || v;

export interface FamilyItem {
  id: string;
  name: string;
  phone: string; // 마스킹된 값
  email: string | null;
  relationship: string;
  relationshipEtc: string | null;
  scope: string;
  priority: number;
  status: string;
  tokenExpiresAt: string | null;
  declinedAt: string | null;
  acceptedAt: string | null;
}

export const FAMILY_MAX = 10;

export const FAMILY_ITEMS: FamilyItem[] = [
  { id: 'f1', name: '홍민수', phone: '010-****-5678', email: 'm***@example.com', relationship: 'CHILD', relationshipEtc: null, scope: 'PRIMARY', priority: 1, status: 'ACCEPTED', tokenExpiresAt: null, declinedAt: null, acceptedAt: '2026-09-14' },
  { id: 'f2', name: '김서연', phone: '010-****-2210', email: null, relationship: 'SPOUSE', relationshipEtc: null, scope: 'VIEWER', priority: 2, status: 'PENDING', tokenExpiresAt: '2099-01-01', declinedAt: null, acceptedAt: null },
  { id: 'f3', name: '박지훈', phone: '010-****-7741', email: null, relationship: 'SIBLING', relationshipEtc: null, scope: 'VIEWER', priority: 3, status: 'PENDING', tokenExpiresAt: '2026-09-01', declinedAt: null, acceptedAt: null },
  { id: 'f4', name: '이수민', phone: '010-****-9032', email: 's***@example.com', relationship: 'OTHER', relationshipEtc: '사촌', scope: 'VIEWER', priority: 4, status: 'DRAFT', tokenExpiresAt: null, declinedAt: null, acceptedAt: null },
  { id: 'f5', name: '최현우', phone: '010-****-1180', email: null, relationship: 'PARENT', relationshipEtc: null, scope: 'VIEWER', priority: 5, status: 'DECLINED', tokenExpiresAt: null, declinedAt: '2026-09-20', acceptedAt: null },
  { id: 'f6', name: '정하윤', phone: '010-****-3305', email: null, relationship: 'CHILD', relationshipEtc: null, scope: 'VIEWER', priority: 6, status: 'DECLINED', tokenExpiresAt: null, declinedAt: '2026-10-01', acceptedAt: '2026-09-18' },
];

/** 지금 코드(MyPageFamilyDesignation.statusLabel)와 같은 판정 — ✅ 이모지만 완료색 표시로 바꿨다(화면에서 따로 그린다) */
export const familyStatusText = (item: FamilyItem): string => {
  if (item.status === 'ACCEPTED') return '수락 완료';
  if (item.status === 'DECLINED') {
    return item.acceptedAt ? '지금은 보지 않으십니다 · 다시 알리기 가능' : '거절됨 · 다시 알리기 가능';
  }
  if (item.status === 'PENDING') {
    const expired = item.tokenExpiresAt && new Date(item.tokenExpiresAt).getTime() < Date.now();
    return expired ? '링크 만료 · 다시 알리기 필요' : '알림 발송됨 · 수락 대기 중';
  }
  return '아직 알리지 않음';
};

export const familyRelationText = (relationship: string, etc: string | null) =>
  `${RELATIONSHIP_LABEL[relationship] || relationship}${relationship === 'OTHER' && etc ? `(${etc})` : ''}`;

// ───── 계정 연동(4-4) ─────
export const PROVIDERS = ['KAKAO', 'NAVER', 'GOOGLE'] as const;
export const PROVIDER_DOT: Record<string, string> = { KAKAO: '#FEE500', NAVER: '#03C75A', GOOGLE: '#4285F4' };
export const LINKED_SAMPLE: Record<string, string> = { KAKAO: 'hong@example.com', NAVER: 'hong@naver.com' };

// ───── 개인정보·동의(4-9) ─────
export const CONSENT_SAMPLE = { termsAgreedAt: '2026-09-14', privacyAgreedAt: '2026-09-14' };

// ───── 회원 탈퇴(4-10~12) ─────
export interface WithdrawPreview {
  graceDays: number;
  deletionScheduledAt: string | null;
  willDelete: { letters: number; voices: number; endingNoteItems: number; guestbookEntries: number; familyDesignations: number };
  willClose: { memorials: number; obituaries: number };
  willRemain: { consultations: number };
}

export const WITHDRAW_RECORDS: WithdrawPreview = {
  graceDays: 30,
  deletionScheduledAt: null,
  willDelete: { letters: 3, voices: 1, endingNoteItems: 5, guestbookEntries: 2, familyDesignations: 2 },
  willClose: { memorials: 1, obituaries: 1 },
  willRemain: { consultations: 2 },
};

export const WITHDRAW_EMPTY: WithdrawPreview = {
  graceDays: 30,
  deletionScheduledAt: null,
  willDelete: { letters: 0, voices: 0, endingNoteItems: 0, guestbookEntries: 0, familyDesignations: 0 },
  willClose: { memorials: 0, obituaries: 0 },
  willRemain: { consultations: 2 },
};

export const WITHDRAW_ALREADY: WithdrawPreview = { ...WITHDRAW_RECORDS, deletionScheduledAt: '2026-11-15' };

// ───── 나에게 공유된 것(4-13~4-14) ─────
export interface SharedEntry {
  section: string;
  value: Record<string, unknown>;
  updatedAt: string;
}
export interface SharedLetter {
  id: string;
  title: string | null;
  body: string;
  hasAudio: boolean;
  createdAt: string;
}
export type RequestState =
  | { status: 'NONE' }
  | { status: 'REQUESTED'; isMine: boolean; requestedAt: string }
  | { status: 'REJECTED'; reason: string };

export interface SharedPerson {
  id: string;
  ownerName: string;
  relationship: string;
  scope: 'PRIMARY' | 'VIEWER';
  acceptedAt: string;
  released: boolean;
  request: RequestState;
  entries: SharedEntry[];
  letters: SharedLetter[];
}

/** 열린 뒤 "아직 수락하지 않은 가족" 줄 */
export interface PendingPerson {
  id: string;
  name: string;
  relationship: string;
  linkExpired: boolean;
}

const ENTRIES: SharedEntry[] = [
  { section: 'LIFE_SUPPORT', value: { lifeSupport: '중단을 원함', lifeSupportRegStatus: '등록함', lifeSupportRegDate: '2025-03-12' }, updatedAt: '2026-09-02' },
  { section: 'FUNERAL', value: { funeralType: '가족장, 조용히 치르기를 바랍니다.' }, updatedAt: '2026-08-21' },
  { section: 'CONTACTS', value: { contactsNote: '오랜 친구 박 선생님께 먼저 알려 주세요.' }, updatedAt: '2026-07-30' },
];

const LETTERS: SharedLetter[] = [
  { id: 'l1', title: '고마웠다는 말', body: '살면서 한 번도 제대로 말하지 못했지만, 늘 고마웠다. 건강하게 지내라.', hasAudio: true, createdAt: '2026-08-02' },
  { id: 'l2', title: '아주 길고 긴 제목의 편지라서 말줄임이 되는지 확인하는 예시', body: '두 번째 편지 본문 예시입니다.', hasAudio: false, createdAt: '2026-08-03' },
];

export const PERSON_NONE: SharedPerson = {
  id: 'p1', ownerName: '김영희', relationship: 'CHILD', scope: 'PRIMARY', acceptedAt: '2026-09-14', released: false,
  request: { status: 'NONE' }, entries: [], letters: [],
};
export const PERSON_MINE: SharedPerson = {
  id: 'p2', ownerName: '박정호', relationship: 'SPOUSE', scope: 'VIEWER', acceptedAt: '2026-09-20', released: false,
  request: { status: 'REQUESTED', isMine: true, requestedAt: '2026-10-13T06:20:00.000Z' }, entries: [], letters: [],
};
export const PERSON_FAMILY: SharedPerson = {
  id: 'p3', ownerName: '이순자', relationship: 'CHILD', scope: 'VIEWER', acceptedAt: '2026-09-25', released: false,
  request: { status: 'REQUESTED', isMine: false, requestedAt: '2026-10-13T06:20:00.000Z' }, entries: [], letters: [],
};
export const PERSON_REJECTED: SharedPerson = {
  id: 'p4', ownerName: '최영수', relationship: 'CHILD', scope: 'VIEWER', acceptedAt: '2026-10-01', released: false,
  request: { status: 'REJECTED', reason: '입력하신 장례식장에서 확인되지 않았습니다.' }, entries: [], letters: [],
};
export const PERSON_OPENED: SharedPerson = {
  id: 'p5', ownerName: '김영희', relationship: 'CHILD', scope: 'PRIMARY', acceptedAt: '2026-09-14', released: true,
  request: { status: 'NONE' }, entries: ENTRIES, letters: LETTERS,
};
export const PERSON_OPENED_EMPTY: SharedPerson = { ...PERSON_OPENED, id: 'p6', entries: [], letters: [] };

export const PENDING_PEOPLE: PendingPerson[] = [
  { id: 'q1', name: '김철수', relationship: 'CHILD', linkExpired: false },
  { id: 'q2', name: '김미영', relationship: 'SPOUSE', linkExpired: true },
];

export const EXAMPLE_INVITE_URL = 'https://eobom.example/invite/AbCd1234EfGh5678';

// 지금 코드(FamilySharedPage)와 같은 조사 규칙
const SCOPE_PHRASE: Record<string, string> = { PRIMARY: '주 연락자', VIEWER: '열람자' };
const withRo = (word: string): string => {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  if (code < 0 || code > 11171) return `${word}로`;
  const jong = code % 28;
  return jong === 0 || jong === 8 ? `${word}로` : `${word}으로`;
};
export const designationPhrase = (p: SharedPerson): string =>
  `나를 ${withRo(RELATIONSHIP_LABEL[p.relationship] ?? p.relationship)} 지정 · ${SCOPE_PHRASE[p.scope]}`;
export const relationOf = (relationship: string) => RELATIONSHIP_LABEL[relationship] ?? relationship;
