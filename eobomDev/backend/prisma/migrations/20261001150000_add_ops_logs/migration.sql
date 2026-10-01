-- 00-42 L-1 — 운영 기록(접속기록·에러 기록) 표 신설 + AdminAuditLog 칸 추가. 추가형(기존 행 변경 없음).

-- AlterTable
ALTER TABLE "AdminAuditLog" ADD COLUMN     "ip" TEXT,
ADD COLUMN     "requestId" TEXT,
ADD COLUMN     "result" TEXT NOT NULL DEFAULT 'SUCCESS';

-- CreateTable
CREATE TABLE "AccessLog" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requestId" TEXT NOT NULL,
    "subjectType" TEXT NOT NULL,
    "subjectId" TEXT,
    "ip" TEXT,
    "method" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "status" INTEGER NOT NULL,
    "durationMs" INTEGER NOT NULL,

    CONSTRAINT "AccessLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ErrorLog" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requestId" TEXT,
    "path" TEXT,
    "status" INTEGER,
    "errorName" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "stackHead" TEXT,

    CONSTRAINT "ErrorLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AccessLog_createdAt_idx" ON "AccessLog"("createdAt");

-- CreateIndex
CREATE INDEX "AccessLog_requestId_idx" ON "AccessLog"("requestId");

-- CreateIndex
CREATE INDEX "AccessLog_subjectType_subjectId_idx" ON "AccessLog"("subjectType", "subjectId");

-- CreateIndex
CREATE INDEX "ErrorLog_createdAt_idx" ON "ErrorLog"("createdAt");

-- CreateIndex
CREATE INDEX "ErrorLog_requestId_idx" ON "ErrorLog"("requestId");

-- CreateIndex
CREATE INDEX "AdminAuditLog_createdAt_idx" ON "AdminAuditLog"("createdAt");
