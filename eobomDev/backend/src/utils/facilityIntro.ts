// 시설 소개 글 저장 때 막는 것 (docs 01-05 §14-5 "소개 글 규칙", 2026-10-19 개발자).
// 이어봄 밖 연락을 유도하면 수수료 근거가 사라진다(§9) — 전화번호 모양 · 홈페이지(링크) · 카톡/카카오/오픈채팅 낱말을 막는다.
// 가격 글·비방은 저장 때 못 거르고, 나중에 운영자가 숨긴다(사유 코드 INTRO_HIDE_REASONS).

export const INTRO_MAX_LENGTH = 1000;

// 한국 전화번호 모양: 0으로 시작하는 지역번호·휴대폰, 1588류 대표번호. 구분자(-, ., 공백, 괄호)가 끼어도 잡는다.
const PHONE_PATTERNS = [
  /(?:\+?82[-.\s]?)?\(?0\d{1,2}\)?[-.\s]*\d{3,4}[-.\s]*\d{4}/,
  /\b1[5-9]\d{2}[-.\s]?\d{4}\b/,
];
const LINK_PATTERN = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(?:com|co\.kr|net|org|kr|io|me|biz|info|kakao)\b)/i;
const KAKAO_PATTERN = /카톡|카카오|오픈\s*채팅|kakao/i;

/** 막을 이유가 있으면 칸 오류 글을, 없으면 null. */
export function findBlockedIntroMessage(text: string): string | null {
  if (PHONE_PATTERNS.some((re) => re.test(text))) return '소개 글에는 전화번호를 쓸 수 없습니다.';
  if (LINK_PATTERN.test(text)) return '소개 글에는 홈페이지 주소를 쓸 수 없습니다.';
  if (KAKAO_PATTERN.test(text)) return '소개 글에는 카카오톡·오픈채팅 안내를 쓸 수 없습니다.';
  return null;
}

// 운영자 숨김 사유 코드(묶음 13에서 숨기기 API가 쓴다). 컬럼은 이 묶음에서 먼저 생긴다.
export const INTRO_HIDE_REASONS = ['EXTERNAL_CONTACT', 'PRICE', 'DEFAMATION'] as const;

// 사업자가 고를 수 있는 값 (01-05 §14-5 종교·수용 규모 입력 꼴, 2026-10-21 개발자 확정)
export const RELIGION_OPTIONS = ['종교 없음', '불교', '개신교', '천주교', '원불교', '기타'] as const;
export const AMENITY_OPTIONS = ['식당', '매점', '주차장', '유족대기실', '장애인편의시설'] as const;
export const CAPACITY_MAX = 100000;

// 무산 사유 코드 4개 (01-05 §4.3) — 이 순서·이 글자. OTHER일 때만 글이 필수.
export const LOST_REASONS = ['CONDITION', 'NO_CONTACT', 'PLAN_CHANGED', 'OTHER'] as const;
export const LOST_REASON_LABELS: Record<(typeof LOST_REASONS)[number], string> = {
  CONDITION: '조건(가격, 수용인원 등)이 맞지 않음',
  NO_CONTACT: '신청자와 연락이 닿지 않음',
  PLAN_CHANGED: '신청자의 계획 변경',
  OTHER: '기타',
};
