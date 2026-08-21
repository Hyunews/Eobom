// 연락처 정규화 — 사업자등록번호(partnerController.ts의 normalizeBizRegNo)와 같은 원칙:
// 하이픈 유무에 따라 "010-1234-5678"과 "01012345678"이 다른 값으로 저장되면 안 된다.
// 숫자만 남겨서 저장하고, 화면 표시는 formatPhoneForDisplay로 따로 한다.

export const MIN_PHONE_DIGITS = 9; // 서울 지역번호(02) + 국번3 + 번호4 = 9자리가 최소
export const MAX_PHONE_DIGITS = 11; // 010-XXXX-XXXX = 11자리가 최대

export const normalizePhone = (raw: string): string => raw.replace(/[^0-9]/g, '');

export const isValidPhoneLength = (digits: string): boolean =>
  digits.length >= MIN_PHONE_DIGITS && digits.length <= MAX_PHONE_DIGITS;

// 마스킹 표시용 — leadController.ts의 동일 규칙(§7.3)과 같은 그룹 구분을 쓴다.
// 00-28 §6.1(회원 프로필 연락처)·00-27 §8.1(가족 지정 연락처) 응답에서 평문 대신 이걸 내려보낸다.
export const maskPhone = (digits: string): string => {
  if (!digits) return digits;
  if (digits.length === 11) return `${digits.slice(0, 3)}-****-${digits.slice(7)}`;
  if (digits.length === 10) {
    return digits.startsWith('02') ? `${digits.slice(0, 2)}-****-${digits.slice(6)}` : `${digits.slice(0, 3)}-***-${digits.slice(6)}`;
  }
  if (digits.length === 9) {
    return digits.startsWith('02') ? `${digits.slice(0, 2)}-***-${digits.slice(5)}` : digits;
  }
  return digits;
};
