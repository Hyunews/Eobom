-- 00-42 L-1 후속(10-01 개발자 결정) — 운영 기록 3개 표의 createdAt 기본값을 한국 시간(KST) 벽시계 값으로.
-- 기본값만 바꾼다(기존 행은 건드리지 않는다). 타입은 그대로 timestamp(시간대 없음).

-- AlterTable
ALTER TABLE "AccessLog" ALTER COLUMN "createdAt" SET DEFAULT timezone('Asia/Seoul', now());

-- AlterTable
ALTER TABLE "ErrorLog" ALTER COLUMN "createdAt" SET DEFAULT timezone('Asia/Seoul', now());

-- AlterTable
ALTER TABLE "AdminAuditLog" ALTER COLUMN "createdAt" SET DEFAULT timezone('Asia/Seoul', now());
