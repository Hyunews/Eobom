// 연락처 정규화 — 사업자등록번호(partnerController.ts의 normalizeBizRegNo)와 같은 원칙:
// 하이픈 유무에 따라 "010-1234-5678"과 "01012345678"이 다른 값으로 저장되면 안 된다.
// 숫자만 남겨서 저장하고, 화면 표시는 formatPhoneForDisplay로 따로 한다.

export const MIN_PHONE_DIGITS = 9; // 서울 지역번호(02) + 국번3 + 번호4 = 9자리가 최소
export const MAX_PHONE_DIGITS = 11; // 010-XXXX-XXXX = 11자리가 최대

export const normalizePhone = (raw: string): string => raw.replace(/[^0-9]/g, '');

export const isValidPhoneLength = (digits: string): boolean =>
  digits.length >= MIN_PHONE_DIGITS && digits.length <= MAX_PHONE_DIGITS;
