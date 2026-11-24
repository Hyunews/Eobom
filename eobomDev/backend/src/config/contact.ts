// 이용자에게 보이는 문의 이메일 — 프런트 `config.ts`의 CONTACT_EMAIL과 같은 값(2026-10-27 개발자 결정, 00-44 §9-5). 00-19 제12조도 같은 값이다.
// 🔴 운영 서버 환경변수 CONTACT_EMAIL이 따로 들어 있으면 그 값이 이긴다 — 배포 뒤 같은 값인지 확인(00-44 §9-5-5 ③).
export const CONTACT_EMAIL = process.env.CONTACT_EMAIL || 'yhw@samil25.co.kr';
