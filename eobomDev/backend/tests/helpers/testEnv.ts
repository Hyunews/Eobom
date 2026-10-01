// 테스트 환경 고정 — 🔴 모든 DB 테스트 파일의 **맨 첫 import**여야 한다(앱·Prisma보다 먼저 env를 못 박는다).
//
// 가드 본문은 dbGuard.ts(전용 테스트 DB가 아니면 시작 자체를 거부):
//   TEST_DATABASE_URL 없음 → 실패(DATABASE_URL로 폴백하지 않는다) · localhost 아님 → 실패 · DB 이름이 _test로 끝나지 않음 → 실패.
// 통과한 값으로 DATABASE_URL·DIRECT_URL을 **덮어쓴다** — Prisma는 이 둘만 본다.
// 🔴 .env 전체를 불러오지 않는다(dotenv/config 금지). 읽는 건 .env의 TEST_DATABASE_URL 한 줄뿐.
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { assertTestDatabaseUrl } from './dbGuard';

function readTestUrl(): string | undefined {
  if (process.env.TEST_DATABASE_URL) return process.env.TEST_DATABASE_URL;
  // 로컬 편의: backend/.env에서 이 키 하나만 꺼낸다(parse 결과를 process.env에 넣지 않는다).
  const envPath = path.resolve(__dirname, '../../.env');
  if (!fs.existsSync(envPath)) return undefined;
  return dotenv.parse(fs.readFileSync(envPath))['TEST_DATABASE_URL'];
}

const testUrl = assertTestDatabaseUrl(readTestUrl());

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = testUrl;
process.env.DIRECT_URL = testUrl;

// 가짜 시크릿 — 실제 값을 쓰지 않는다(security.md §2). 컨트롤러들이 모듈 로드 시점에 읽으므로 앱 import 전에 고정.
process.env.JWT_SECRET = 'test-only-jwt-secret-not-for-production';
process.env.SETTLEMENT_ENCRYPTION_KEY = 'test-only-settlement-key-0000000000000000';
process.env.ENDING_NOTE_ENCRYPTION_KEY = 'test-only-ending-note-key-000000000000000';
process.env.HASH_INDEX_KEY = 'test-only-hash-index-key-00000000000000000';
// 외부 연동 자격증명은 없다(위 시크릿도 가짜). R2는 끈다.
// STT·OCR 플래그는 켠다 — 꺼져 있으면 컨트롤러가 인증보다 먼저 404를 돌려줘 권한 경계를 시험할 수 없다.
// 자격증명이 없어 실제 외부 호출은 성립하지 않으며, 테스트는 이 두 경로에 정상 토큰 요청을 보내지 않는다.
process.env.CLOVA_STT_ENABLED = 'true';
process.env.CLOVA_OCR_ENABLED = 'true';
process.env.R2_ENABLED = 'false';
// 요청 횟수 제한(middleware/rateLimit.ts)은 기본으로 끈다 — 다른 시험들이 같은 IP(127.0.0.1)로 수십 번 요청해서 한도에 걸린다.
// 제한 자체는 tests/cors-ratelimit.test.ts가 이 값을 지우고 실제 앱으로 시험한다. NODE_ENV=test일 때만 인정되는 스위치다.
process.env.RATE_LIMIT_DISABLED = 'true';

export const TEST_JWT_SECRET = process.env.JWT_SECRET;
