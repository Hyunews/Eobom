import type { RdBadgeKind } from '../../parts/RdButtons';

// 8단계 묶음 7 · 마이페이지·추모관 미리보기의 예시 값과 규칙 함수.
// 🔴 값은 미리보기용으로 지어낸 것이다(10단계 교체 때 서버 응답으로 바꾼다). 규칙(상태 판정 · 날짜 줄 · 버튼 조건)은
// 00-36 §4.8-1·§4.8-3과 지금 코드(MyObituaryListPage · MemorialPage)의 판정을 그대로 옮긴 것이라 교체 때 한 곳으로 합친다.

// ───── 미리보기 주소 ─────
export const PV = {
  hub: '/preview/mypage',
  list: '/preview/my-obituaries-memorials',
  memorial: '/preview/memorial',
  guestbook: '/preview/my-guestbook',
  consult: '/preview/my-consultations',
  obituary: '/preview/obituary',
  openObituary: '/preview/visitor/obituary',
  openMemorial: '/preview/visitor/memorial',
  endingNote: '/preview/ending-note',
  farewell: '/preview/farewell-messages',
  digital: '/preview/digital-estate',
  counseling: '/preview/counseling',
  // 묶음 8
  familyShared: '/preview/family-shared',
  login: '/preview/login',
} as const;

export const memorialManageUrl = (slug: string) => `${PV.memorial}?slug=${slug}`;

// ───── 부고장 ─────
export interface MyObit {
  id: string;
  slug: string;
  deceasedName: string;
  deceasedDeathDate: string | null;
  createdAt: string;
  isClosed: boolean;
}

export const OBITS: MyObit[] = [
  { id: 'o1', slug: 'hong-gildong-2610', deceasedName: '홍길동', deceasedDeathDate: '2026-10-02', createdAt: '2026-10-03', isClosed: false },
  { id: 'o2', slug: 'kim-younghee-2609', deceasedName: '김영희', deceasedDeathDate: null, createdAt: '2026-09-18', isClosed: true },
];

// ───── 추모관 ─────
// GET /api/me/memorials 응답의 모양 — 방명록 수·헌화 수(guestbookCount · tributeCount)는 이번 묶음에서 더한 칸이다.
export interface MyMemorial {
  id: string;
  slug: string;
  deceasedName: string;
  deceasedDeathDate: string | null;
  epitaph: string | null;
  visibility: 'LINK' | 'PRIVATE';
  createdAt: string;
  closedAt: string | null;
  hiddenAt: string | null;
  expiresAt: string | null;
  frozenAt: string | null;
  purgeAt: string | null;
  canExtend: boolean; // 서버 판정(00-20 §8.1-4 ②-가) — 화면은 이것만 본다
  guestbookCount: number;
  tributeCount: number;
}

const base: Omit<MyMemorial, 'id' | 'slug' | 'deceasedName' | 'createdAt'> = {
  deceasedDeathDate: null,
  epitaph: null,
  visibility: 'LINK',
  closedAt: null,
  hiddenAt: null,
  expiresAt: null,
  frozenAt: null,
  purgeAt: null,
  canExtend: false,
  guestbookCount: 0,
  tributeCount: 0,
};

export const MEMORIALS: MyMemorial[] = [
  {
    ...base, id: 'm1', slug: 'hong-gildong', deceasedName: '홍길동', createdAt: '2026-10-03',
    deceasedDeathDate: '2026-10-02', epitaph: '늘 그리운 모습으로 기억합니다', expiresAt: '2027-10-02',
    guestbookCount: 12, tributeCount: 34,
  },
  {
    ...base, id: 'm2', slug: 'kim-younghee', deceasedName: '김영희', createdAt: '2026-09-19',
    visibility: 'PRIVATE', frozenAt: '2026-10-01', purgeAt: '2026-10-31', canExtend: true,
    guestbookCount: 5, tributeCount: 18,
  },
  {
    ...base, id: 'm3', slug: 'park-cheolsu', deceasedName: '박철수', createdAt: '2026-08-05',
    deceasedDeathDate: '2026-07-30', closedAt: '2026-10-15', purgeAt: '2026-12-15',
    guestbookCount: 8, tributeCount: 21,
  },
  {
    ...base, id: 'm4', slug: 'lee-sunja', deceasedName: '이순자', createdAt: '2026-07-21',
    hiddenAt: '2026-08-01', guestbookCount: 3, tributeCount: 6,
  },
];

// 목록에는 없고 관리 화면에서 "보기 상태"로만 고르는 변형 — 버튼 조건을 모두 볼 수 있게 한다
export const MEMORIAL_VARIANTS: MyMemorial[] = [
  {
    ...base, id: 'm5', slug: 'choi-minsu', deceasedName: '최민수', createdAt: '2026-10-10',
    visibility: 'PRIVATE', expiresAt: '2027-10-10', guestbookCount: 0, tributeCount: 2,
  },
  {
    ...base, id: 'm6', slug: 'jung-hana', deceasedName: '정하나', createdAt: '2026-09-02',
    deceasedDeathDate: '2026-08-28', frozenAt: '2026-10-01', purgeAt: '2026-10-31', canExtend: true,
    guestbookCount: 7, tributeCount: 12,
  },
];

export const findMemorial = (slug: string | null): MyMemorial | undefined =>
  slug ? [...MEMORIALS, ...MEMORIAL_VARIANTS].find((m) => m.slug === slug) : undefined;

export type MemorialState = 'running' | 'frozen' | 'closed' | 'hidden';

/** 지금 코드(MyObituaryListPage)의 판정과 같은 우선순위 — 운영자 내림 > 닫음 > 동결 > 운영중 */
export const memorialState = (m: MyMemorial): MemorialState => (m.hiddenAt ? 'hidden' : m.closedAt ? 'closed' : m.frozenAt ? 'frozen' : 'running');

export const MEMORIAL_STATE_LABEL: Record<MemorialState, string> = {
  running: '운영중',
  frozen: '열람만 가능',
  closed: '종료됨',
  hidden: '운영자가 비공개 처리함',
};

// 딱지 색(00-44 §6-4): 운영중 = 완료색 · 종료됨 = 회색 · 열람만 가능 = 갈색 · 운영자가 비공개 처리함 = 위험색
export const MEMORIAL_STATE_BADGE: Record<MemorialState, RdBadgeKind> = {
  running: 'done',
  frozen: 'draft',
  closed: 'state',
  hidden: 'danger',
};

export const VISIBILITY_LABEL: Record<string, string> = { PRIVATE: '비공개', LINK: '링크로만 공개' };

/** 00-36 §4.8-3 날짜 줄 표 — 운영중 = 보존 기간 종료일 · 열람만 가능·종료됨 = 삭제 예정일 · 운영자 비공개 = 줄 없음 */
export function memorialDateLine(m: MyMemorial): { label: string; value: string } | null {
  const s = memorialState(m);
  if (s === 'running' && m.expiresAt) return { label: '보존 기간 종료일', value: m.expiresAt };
  if ((s === 'frozen' || s === 'closed') && m.purgeAt) return { label: '삭제 예정일', value: m.purgeAt };
  return null;
}

/** 00-36 §4.8-3 버튼 조건. 운영자 비공개에서 [수정]을 숨기는 것은 2026-10-16 개발자 결정(묶음 2 점검 ①) */
export function memorialButtons(m: MyMemorial) {
  const s = memorialState(m);
  const open = s === 'running' || s === 'frozen';
  return {
    // 공개 화면이 열리는 때만 — 공개 범위 LINK이고 종료됨·운영자 비공개가 아닐 때
    openCopy: open && m.visibility === 'LINK',
    edit: open,
    extend: open && m.canExtend,
    remove: s !== 'closed',
  };
}

// ───── 헌화·방명록을 남긴 추모관 (GET /api/me/visited-memorials 응답 모양) ─────
export interface VisitedMemorial {
  slug: string;
  deceasedName: string;
  tributed: boolean;
  wrote: boolean;
  lastAt: string;
}

export const VISITED: VisitedMemorial[] = [
  { slug: 'kim-sunja', deceasedName: '김순자', tributed: true, wrote: true, lastAt: '2026-10-09' },
  { slug: 'lee-cheolsu', deceasedName: '이철수', tributed: false, wrote: true, lastAt: '2026-09-30' },
  { slug: 'park-jeonghui', deceasedName: '박정희', tributed: true, wrote: false, lastAt: '2026-09-12' },
];

export const visitedKind = (v: VisitedMemorial): string => (v.tributed && v.wrote ? '헌화 · 방명록' : v.wrote ? '방명록' : '헌화');

// ───── 내가 남긴 방명록 ─────
export interface MyGuestbook {
  id: string;
  deceasedName: string;
  message: string;
  createdAt: string;
}

export const GUESTBOOK: MyGuestbook[] = [
  { id: 'g1', deceasedName: '홍길동', message: '생전에 베풀어 주신 따뜻한 마음 잊지 않겠습니다.', createdAt: '2026-10-09' },
  { id: 'g2', deceasedName: '김순자', message: '편히 쉬시길 바랍니다.', createdAt: '2026-09-30' },
  {
    id: 'g3', deceasedName: '이철수',
    message: '함께했던 시간이 오래 기억에 남을 것입니다. 그곳에서는 아프지 마시고 평안하시길 바랍니다. 가족분들께도 위로의 말씀을 전합니다.',
    createdAt: '2026-09-12',
  },
  { id: 'g4', deceasedName: '박정희', message: '고맙습니다.', createdAt: '2026-08-27' },
];

// ───── 내 상담 내역 ─────
// 아래 라벨 표는 지금 MyConsultationsPage.tsx가 내보내지 않는 것을 복사해 둔 것이다(교체 때 한 곳으로 합친다).
export type StatusGroup = 'RECEIVED' | 'IN_PROGRESS' | 'DONE' | 'CLOSED';

export const CONSULT_STATUS_LABEL: Record<StatusGroup, string> = {
  RECEIVED: '접수됨',
  IN_PROGRESS: '진행 중',
  DONE: '완료',
  CLOSED: '종료',
};

export const CONSULT_STATUS_BADGE: Record<StatusGroup, RdBadgeKind> = {
  RECEIVED: 'state',
  IN_PROGRESS: 'draft',
  DONE: 'done',
  CLOSED: 'faint', // 끝난 상태는 회색 딱지(00-44 §6-4)
};

export const LEAD_TYPE_LABEL: Record<string, string> = { QUOTE: '견적 문의', CONSULT: '상담 문의' };
export const CHANNEL_LABEL: Record<string, string> = { ALIMTALK: '알림톡', PHONE: '전화', VIDEO: '화상', VISIT: '방문' };
export const CATEGORY_LABEL: Record<string, string> = {
  LAWYER: '상속 변호사',
  JUDICIAL_SCRIVENER: '상속 법무사',
  TAX_ACCOUNTANT: '상속세 세무사',
  ADMINISTRATIVE_SCRIVENER: '행정사',
  FUNERAL_DIRECTOR: '장례 지도사',
};

export interface ConsultItem {
  key: string;
  no: string;
  title: string;
  how: string; // "생전 상담 · 전화" 꼴
  summary: string;
  statusGroup: StatusGroup;
  consentAt: string | null;
  createdAt: string;
}

// 제목·둘째 줄을 만드는 규칙은 지금 코드와 같다: 업체 = 시설명(없으면 "비제휴 업체") + 문의 종류 / 전문가 = 직역 라벨
export const CONSULTS: ConsultItem[] = [
  {
    key: 'L-202610-0042', no: '202610-0042', title: '[예시] 한결 유품정리 ' + LEAD_TYPE_LABEL.QUOTE,
    how: '생전 상담 · ' + CHANNEL_LABEL.PHONE, summary: '아파트 30평, 다음 주 중 방문 견적을 받고 싶습니다.',
    statusGroup: 'RECEIVED', consentAt: '2026-10-13', createdAt: '2026-10-13',
  },
  {
    key: 'L-202610-0031', no: '202610-0031', title: '[예시] 마중 정리 ' + LEAD_TYPE_LABEL.CONSULT,
    how: '생전 상담 · ' + CHANNEL_LABEL.PHONE, summary: '이사 전에 정리할 물건이 많아 상담받고 싶습니다.',
    statusGroup: 'IN_PROGRESS', consentAt: '2026-10-09', createdAt: '2026-10-09',
  },
  {
    key: 'C-202609-0017', no: '202609-0017', title: CATEGORY_LABEL.LAWYER,
    how: '생전 상담 · ' + CHANNEL_LABEL.PHONE, summary: '유언장 작성 전에 유류분 기준을 확인하고 싶습니다.',
    statusGroup: 'DONE', consentAt: '2026-09-28', createdAt: '2026-09-28',
  },
  {
    key: 'C-202609-0004', no: '202609-0004', title: CATEGORY_LABEL.TAX_ACCOUNTANT,
    how: '생전 상담 · ' + CHANNEL_LABEL.PHONE, summary: '상속세 신고 대상 여부를 확인하고 싶습니다.',
    statusGroup: 'CLOSED', consentAt: '2026-09-03', createdAt: '2026-09-03',
  },
];

// ───── 날짜 ─────
// 목록 줄 날짜는 "2026-10-02" 꼴(시안) — 서버가 주는 ISO도 formatKstDate가 같은 꼴로 바꾼다. 상담 줄 둘째 줄만 "10월 13일".
export const monthDay = (iso: string): string => {
  const [, m, d] = iso.split('-');
  return `${Number(m)}월 ${Number(d)}일`;
};
