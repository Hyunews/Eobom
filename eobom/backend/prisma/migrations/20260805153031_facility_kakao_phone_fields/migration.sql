-- AlterTable
ALTER TABLE "Facility" ADD COLUMN     "kakaoPlaceId" TEXT,
ADD COLUMN     "phone" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Facility_kakaoPlaceId_key" ON "Facility"("kakaoPlaceId");
