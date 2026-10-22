// 8단계 묶음 6 · 조문객 화면 미리보기 예시 값.
// 🔴 전부 지어낸 값이다(00-44 §9-4 "10단계 교체 때 바꿀 미리보기 값") — 실제 서버 응답이 아니다. 확정으로 보지 않는다.
// 모양은 지금 코드의 응답 타입(components/ObituaryView.tsx ObituaryData · pages/MemorialLandingPage.tsx · pages/FamilyInvitePage.tsx)과 같다.

export interface ExMourner {
  name: string;
  relationship: string;
  isChief: boolean;
}

export interface ExObituary {
  deceasedName: string;
  deceasedDeathDate: string | null;
  funeralHall: string | null;
  funeralHallAddr: string | null;
  mourningRoom: string | null;
  coffinAt: string | null;
  funeralAt: string;
  burialSite: string | null;
  mourners: ExMourner[];
  contactPhone?: string;
  memorialSlug: string | null;
  updatedAt: string;
  account?: { bankName: string | null; accountNumber: string | null; holder: string | null };
}

/** 3-1 다 있음 */
export const OBIT_FULL: ExObituary = {
  deceasedName: '홍길동',
  deceasedDeathDate: '2026-10-12T00:00:00+09:00',
  funeralHall: '이어봄장례식장',
  funeralHallAddr: '서울특별시 강남구 예시로 123',
  mourningRoom: '3호실',
  coffinAt: '2026-10-13T10:00:00+09:00',
  funeralAt: '2026-10-14T07:30:00+09:00',
  burialSite: '이어봄공원 가족묘원',
  mourners: [
    { name: '홍길동', relationship: '장남', isChief: true },
    { name: '김영희', relationship: '배우자', isChief: false },
    { name: '홍길준', relationship: '차남', isChief: false },
    { name: '홍길순', relationship: '장녀', isChief: false },
  ],
  contactPhone: '010-1234-5678',
  memorialSlug: 'example',
  updatedAt: '2026-10-13T15:20:00+09:00',
};

/** 3-2 최소(발인·상주만, 추모관 없음) */
export const OBIT_MIN: ExObituary = {
  deceasedName: '홍길동',
  deceasedDeathDate: null,
  funeralHall: null,
  funeralHallAddr: null,
  mourningRoom: null,
  coffinAt: null,
  funeralAt: '2026-10-14T07:30:00+09:00',
  burialSite: null,
  mourners: [{ name: '홍길동', relationship: '장남', isChief: true }],
  memorialSlug: null,
  updatedAt: '2026-10-13T15:20:00+09:00',
};

export interface ExGuestEntry {
  id: string;
  authorName: string;
  relationToDeceased: string | null;
  message: string;
  createdAt: string;
  /** 05-01 §4.2 — 로그인한 요청일 때만 서버가 더하는 칸 */
  mine?: boolean;
}

const MSGS: [string, string | null, string][] = [
  ['박지민', '직장 동료', '갑작스러운 소식에 믿기지 않습니다. 편히 쉬시길 바랍니다.'],
  ['이서연', '이웃', '늘 먼저 인사해 주시던 모습이 기억납니다. 삼가 명복을 빕니다.'],
  ['최민수', '친구', '함께한 시간 고마웠습니다. 편안히 쉬세요.'],
  ['정하윤', null, '삼가 고인의 명복을 빕니다.'],
  ['김도현', '친척', '좋은 곳에서 평안하시길 기도합니다.'],
  ['오세진', '동창', '학창 시절 함께 웃던 기억이 오래 남을 것입니다.'],
  ['강미래', null, '유가족분들께 깊은 위로를 전합니다.'],
  ['윤태호', '직장 동료', '성실하셨던 모습을 오래 기억하겠습니다.'],
  ['한소율', '이웃', '따뜻한 인사에 늘 힘이 되었습니다.'],
  ['서재우', '친구', '편히 쉬시길 바랍니다.'],
  ['문가영', null, '삼가 명복을 빕니다.'],
  ['배준호', '친척', '좋은 곳에서 평안하시길 바랍니다.'],
];

/** 5개씩 쪽 넘김이 되도록 12개 + 로그인한 내가 쓴 글 하나(이서연 · 이웃). 일시는 최신순. */
export const GUESTBOOK: ExGuestEntry[] = MSGS.map(([authorName, relationToDeceased, message], i) => ({
  id: `g${i + 1}`,
  authorName,
  relationToDeceased,
  message,
  createdAt: new Date(Date.UTC(2026, 9, 13, 6, 20) - i * 97 * 60 * 1000).toISOString(),
  mine: authorName === '이서연',
}));

export interface ExMemorial {
  deceasedName: string;
  deceasedDeathDate: string | null;
  portraitUrl: string | null;
  epitaph: string | null;
  tributeCount: number;
}

/** 05-01 §6.1 — 추모 문구가 비면 보이는 기본 문구(표시만, DB에 저장하지 않음). */
export const DEFAULT_EPITAPH = '늘 따뜻한 웃음으로 기억하겠습니다.';

export const MEMORIAL_WITH_PORTRAIT: ExMemorial = {
  deceasedName: '홍길동',
  deceasedDeathDate: '2026-10-12T00:00:00+09:00',
  portraitUrl: 'portrait',
  epitaph: null,
  tributeCount: 12,
};

export const MEMORIAL_PLAIN: ExMemorial = {
  deceasedName: '홍길동',
  deceasedDeathDate: '2026-10-12T00:00:00+09:00',
  portraitUrl: null,
  epitaph: '늘 웃으시던 모습을 기억하겠습니다.',
  tributeCount: 12,
};

// FamilyInvitePage.tsx 안의 RELATIONSHIP_LABEL · SCOPE_LABEL 복사본(지금 파일이 내보내지 않음) — 10단계 교체 때 한 곳으로 합친다.
export const RELATIONSHIP_LABEL: Record<string, string> = {
  SPOUSE: '배우자',
  CHILD: '자녀',
  PARENT: '부모',
  SIBLING: '형제자매',
  OTHER: '기타',
};

export const SCOPE_LABEL: Record<string, { label: string; hint: string }> = {
  PRIMARY: { label: '대표 지정인', hint: '엔딩노트 전달 · 정산 실행 요청' },
  VIEWER: { label: '연락 대상', hint: '사망 통지 수신 · 추모관 접근' },
};

export interface ExInvite {
  designatorName: string;
  relationship: string;
  relationshipEtc: string | null;
  scope: string;
}

export const INVITE_PRIMARY: ExInvite = { designatorName: '홍길동', relationship: 'CHILD', relationshipEtc: null, scope: 'PRIMARY' };
export const INVITE_VIEWER: ExInvite = { designatorName: '홍길동', relationship: 'OTHER', relationshipEtc: '친구', scope: 'VIEWER' };
