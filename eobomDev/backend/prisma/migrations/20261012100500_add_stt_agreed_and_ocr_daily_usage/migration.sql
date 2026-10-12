-- 06 코드대기 ③⑤ (10-12) — 추가형(기존 행 변경 없음).
-- ③ User.sttDataAgreedAt: STT 외부 전송 동의 증적(06-04 §6.4-11-6-1).
-- ⑤ OcrDailyUsage: 사진 인식 하루 호출 횟수(06-06 §4.0-1) — 인메모리 카운터 대체. createdAt이 없어 createdAtKst 칸·트리거 대상 아님.

-- AlterTable
ALTER TABLE "User" ADD COLUMN "sttDataAgreedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "OcrDailyUsage" (
    "userId" TEXT NOT NULL,
    "dateKey" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "OcrDailyUsage_pkey" PRIMARY KEY ("userId","dateKey")
);

-- AddForeignKey
ALTER TABLE "OcrDailyUsage" ADD CONSTRAINT "OcrDailyUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
