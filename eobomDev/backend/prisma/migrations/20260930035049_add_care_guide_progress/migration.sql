-- CreateTable
CREATE TABLE "CareGuideProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "taskId" INTEGER NOT NULL,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CareGuideProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CareGuideProgress_userId_taskId_key" ON "CareGuideProgress"("userId", "taskId");

-- AddForeignKey
ALTER TABLE "CareGuideProgress" ADD CONSTRAINT "CareGuideProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
