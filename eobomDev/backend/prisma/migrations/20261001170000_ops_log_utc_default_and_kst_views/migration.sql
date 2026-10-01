-- 00-42 L-1 후속(10-01 개발자 결정) — 운영 기록 3개 표 저장은 UTC로 되돌리고, 사람이 DB를 볼 때 한국 시간으로 보이는 읽기 전용 뷰를 둔다.
-- 배경: 20261001160000이 createdAt 기본값을 KST 벽시계로 바꿨는데, 이전 클라이언트가 만든 행은 UTC로 들어가 한 표에 UTC/KST가 섞일 위험이 확인됐다.
-- 🔴 이 마이그레이션은 기본값만 바꾼다 — 기존 행의 값은 건드리지 않는다(시험 시점 로컬 DB에 KST 행 0건 확인).
-- 🔴 뷰는 Prisma 모델이 아니다(schema.prisma에 없음) — 이 SQL로만 관리한다. 뷰에는 ORDER BY를 넣지 않는다(조회할 때 정렬).

-- AlterTable
ALTER TABLE "AccessLog" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "ErrorLog" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "AdminAuditLog" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;

-- 한국 시간 뷰 — 원래 칸 전부 + createdAtKst(= createdAt을 UTC로 읽어 한국 시간으로 옮긴 값)
CREATE VIEW "AccessLog_kst" AS
SELECT t.*, (t."createdAt" AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Seoul' AS "createdAtKst"
FROM "AccessLog" t;

CREATE VIEW "ErrorLog_kst" AS
SELECT t.*, (t."createdAt" AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Seoul' AS "createdAtKst"
FROM "ErrorLog" t;

CREATE VIEW "AdminAuditLog_kst" AS
SELECT t.*, (t."createdAt" AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Seoul' AS "createdAtKst"
FROM "AdminAuditLog" t;
