-- 00-42 §5.3 L-2 (10-14) — 동의 이력(ConsentLog)·사후개봉 열람 기록(EndingNoteViewLog) 새 표 + PurgeRunLog에 실행자·대상 id 목록 칸. 추가형(기존 행 변경 없음).
-- 🔴 새 표라 createdAtKst 칸·트리거를 같이 붙인다(.harness/systems.md §4, tests/created-at-kst.test.ts).
-- PurgeRunLog 새 칸은 기본값이 있어 옛 행도 그대로 유효하다(executor = 'script', targetIds = {}). 소급 행은 만들지 않는다.

-- AlterTable
ALTER TABLE "PurgeRunLog" ADD COLUMN "executor" TEXT NOT NULL DEFAULT 'script',
ADD COLUMN "targetIds" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "ConsentLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAtKst" TIMESTAMP(3),

    CONSTRAINT "ConsentLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EndingNoteViewLog" (
    "id" TEXT NOT NULL,
    "viewerId" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "sections" TEXT[],
    "ip" TEXT,
    "requestId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAtKst" TIMESTAMP(3),

    CONSTRAINT "EndingNoteViewLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConsentLog_userId_createdAt_idx" ON "ConsentLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ConsentLog_createdAt_idx" ON "ConsentLog"("createdAt");

-- CreateIndex
CREATE INDEX "EndingNoteViewLog_noteId_createdAt_idx" ON "EndingNoteViewLog"("noteId", "createdAt");

-- CreateIndex
CREATE INDEX "EndingNoteViewLog_viewerId_idx" ON "EndingNoteViewLog"("viewerId");

-- AddForeignKey
ALTER TABLE "ConsentLog" ADD CONSTRAINT "ConsentLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EndingNoteViewLog" ADD CONSTRAINT "EndingNoteViewLog_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EndingNoteViewLog" ADD CONSTRAINT "EndingNoteViewLog_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "EndingNote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 트리거(함수 set_created_at_kst는 20261001180000이 만들었다)
CREATE TRIGGER "ConsentLog_created_at_kst" BEFORE INSERT OR UPDATE ON "ConsentLog" FOR EACH ROW EXECUTE FUNCTION set_created_at_kst();
CREATE TRIGGER "EndingNoteViewLog_created_at_kst" BEFORE INSERT OR UPDATE ON "EndingNoteViewLog" FOR EACH ROW EXECUTE FUNCTION set_created_at_kst();
