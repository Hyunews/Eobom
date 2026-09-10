-- AlterTable
ALTER TABLE "Facility" ADD COLUMN     "publicName" TEXT,
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'kakao',
ADD COLUMN     "sourceRef" TEXT,
ADD COLUMN     "syncedAt" TIMESTAMP(3);
