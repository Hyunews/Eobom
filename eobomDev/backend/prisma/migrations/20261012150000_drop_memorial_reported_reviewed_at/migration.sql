-- 05-01 §2 (10-12 개발자 결정) — 삭제형. 09-30 신고 폐지로 코드가 안 읽고 안 쓰던 Memorial 두 칸을 지운다.
-- ⚠️ Memorial 표의 칸만이다. DeathVerification·FacilityClaim 등 다른 표의 reviewedAt은 건드리지 않는다.
-- 🔴 삭제형 — 운영 순서: 커밋 → push(배포, 새 코드가 두 칸을 안 읽는다) → 그다음 migrate-prod.ps1.
--    migrate가 먼저 나가면 옛 코드가 지워진 칸을 읽으려다 실패한다.

-- AlterTable
ALTER TABLE "Memorial" DROP COLUMN "reportedAt",
DROP COLUMN "reviewedAt";
