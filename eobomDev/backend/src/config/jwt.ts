// JWT 서명 키 단일 출처 — 기본값 폴백을 두지 않는다(security.md §3).
// 값이 없거나 비어 있으면 모듈 로드 시점(=서버 시작)에 throw. 로그에 값은 찍지 않는다.
// 🔴 dotenv는 server.ts 맨 첫 import가 먼저 불러온다 — 이 모듈은 그 뒤에 평가돼야 한다.
const secret = process.env.JWT_SECRET;

if (!secret || secret.trim() === '') {
  throw new Error('JWT_SECRET 미설정 — 서버를 시작할 수 없습니다(.env 또는 배포 환경변수 확인)');
}

export const JWT_SECRET: string = secret;
