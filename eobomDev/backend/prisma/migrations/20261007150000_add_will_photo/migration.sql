-- 06-06 §5-2-3 (10-07 개발자 결정) — 유언장 사진 보관 표 2건 신설. 추가형(기존 행 변경 없음).
-- 🔴 userId·setId FK는 ON DELETE RESTRICT(Cascade 금지) — 탈퇴 파기가 R2 키를 먼저 치워야 고아가 안 남는다.
-- 🔴 WillPhotoSet은 createdAt이 있어 createdAtKst 칸·트리거를 같이 붙인다(.harness/systems.md §4, tests/created-at-kst.test.ts). WillPhoto는 createdAt이 없다.

-- CreateTable
CREATE TABLE "WillPhotoSet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pageCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAtKst" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "purgedAt" TIMESTAMP(3),

    CONSTRAINT "WillPhotoSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WillPhoto" (
    "id" TEXT NOT NULL,
    "setId" TEXT NOT NULL,
    "pageIndex" INTEGER NOT NULL,
    "mediaKey" TEXT NOT NULL,
    "mediaMime" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "purgedAt" TIMESTAMP(3),

    CONSTRAINT "WillPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WillPhotoSet_userId_deletedAt_idx" ON "WillPhotoSet"("userId", "deletedAt");

-- CreateIndex
CREATE INDEX "WillPhotoSet_purgedAt_deletedAt_idx" ON "WillPhotoSet"("purgedAt", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "WillPhoto_setId_pageIndex_key" ON "WillPhoto"("setId", "pageIndex");

-- AddForeignKey
ALTER TABLE "WillPhotoSet" ADD CONSTRAINT "WillPhotoSet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WillPhoto" ADD CONSTRAINT "WillPhoto_setId_fkey" FOREIGN KEY ("setId") REFERENCES "WillPhotoSet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 트리거(함수 set_created_at_kst는 20261001180000이 만들었다)
CREATE TRIGGER "WillPhotoSet_created_at_kst" BEFORE INSERT OR UPDATE ON "WillPhotoSet" FOR EACH ROW EXECUTE FUNCTION set_created_at_kst();
