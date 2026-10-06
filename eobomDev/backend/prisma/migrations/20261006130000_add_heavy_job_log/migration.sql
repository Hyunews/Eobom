-- 06-04 §6.4-11-10-1 (10-06 개발자 결정) — 사진 인식·음성 변환 처리 결과 건별 기록 표 신설. 추가형(기존 행 변경 없음).
-- 🔴 새 표라 createdAtKst 칸·트리거를 같이 붙인다(.harness/systems.md §4, tests/created-at-kst.test.ts).

-- CreateTable
CREATE TABLE "HeavyJobLog" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "waitMs" INTEGER NOT NULL,
    "workMs" INTEGER,
    "audioSec" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAtKst" TIMESTAMP(3),

    CONSTRAINT "HeavyJobLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HeavyJobLog_createdAt_idx" ON "HeavyJobLog"("createdAt");

-- CreateIndex
CREATE INDEX "HeavyJobLog_kind_result_idx" ON "HeavyJobLog"("kind", "result");

-- 트리거(함수 set_created_at_kst는 20261001180000이 만들었다)
CREATE TRIGGER "HeavyJobLog_created_at_kst" BEFORE INSERT OR UPDATE ON "HeavyJobLog" FOR EACH ROW EXECUTE FUNCTION set_created_at_kst();
