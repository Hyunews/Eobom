-- 10-06 개발자 결정(00-20 §8.1-3 · 00-19 제8조) — 추모관 통지 기록 표 + 파기·마스킹 실행 이력 표 신설. 추가형(기존 행 변경 없음).
-- 🔴 새 표라 createdAtKst 칸·트리거를 같이 붙인다(.harness/systems.md §4, tests/created-at-kst.test.ts).

-- CreateTable
CREATE TABLE "MemorialNotice" (
    "id" TEXT NOT NULL,
    "memorialId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "channel" TEXT,
    "result" TEXT NOT NULL,
    "failReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAtKst" TIMESTAMP(3),

    CONSTRAINT "MemorialNotice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurgeRunLog" (
    "id" TEXT NOT NULL,
    "step" TEXT NOT NULL,
    "affected" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAtKst" TIMESTAMP(3),

    CONSTRAINT "PurgeRunLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MemorialNotice_memorialId_kind_createdAt_idx" ON "MemorialNotice"("memorialId", "kind", "createdAt");

-- CreateIndex
CREATE INDEX "PurgeRunLog_createdAt_idx" ON "PurgeRunLog"("createdAt");

-- AddForeignKey
ALTER TABLE "MemorialNotice" ADD CONSTRAINT "MemorialNotice_memorialId_fkey" FOREIGN KEY ("memorialId") REFERENCES "Memorial"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 트리거(함수 set_created_at_kst는 20261001180000이 만들었다)
CREATE TRIGGER "MemorialNotice_created_at_kst" BEFORE INSERT OR UPDATE ON "MemorialNotice" FOR EACH ROW EXECUTE FUNCTION set_created_at_kst();
CREATE TRIGGER "PurgeRunLog_created_at_kst" BEFORE INSERT OR UPDATE ON "PurgeRunLog" FOR EACH ROW EXECUTE FUNCTION set_created_at_kst();
