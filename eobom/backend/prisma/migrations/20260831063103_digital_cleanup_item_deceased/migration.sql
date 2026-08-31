-- DropIndex
DROP INDEX "DigitalCleanupItem_userId_status_idx";

-- AlterTable
ALTER TABLE "DigitalCleanupItem" ADD COLUMN     "deceasedId" TEXT,
ADD COLUMN     "origin" TEXT NOT NULL DEFAULT 'MANUAL';

-- CreateIndex
CREATE INDEX "DigitalCleanupItem_userId_deceasedId_status_idx" ON "DigitalCleanupItem"("userId", "deceasedId", "status");

-- AddForeignKey
ALTER TABLE "DigitalCleanupItem" ADD CONSTRAINT "DigitalCleanupItem_deceasedId_fkey" FOREIGN KEY ("deceasedId") REFERENCES "Deceased"("id") ON DELETE SET NULL ON UPDATE CASCADE;
