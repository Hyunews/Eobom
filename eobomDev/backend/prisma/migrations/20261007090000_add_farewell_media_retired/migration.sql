-- 06-05 §5.6-9-4·§6.6 (10-07 개발자 결정) — 삭제 유예 중인 음성을 새 음성이 밀어낼 때 이전 R2 키를 옮겨 두는 표 신설. 추가형(기존 행 변경 없음).
-- createdAt 칸이 없는 표라 createdAtKst 칸·트리거는 붙이지 않는다(ArchivePurgeQueue와 같다).

-- CreateTable
CREATE TABLE "FarewellMediaRetired" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "mediaKey" TEXT NOT NULL,
    "mediaMime" TEXT,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "retiredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "purgedAt" TIMESTAMP(3),

    CONSTRAINT "FarewellMediaRetired_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FarewellMediaRetired_purgedAt_deletedAt_idx" ON "FarewellMediaRetired"("purgedAt", "deletedAt");
