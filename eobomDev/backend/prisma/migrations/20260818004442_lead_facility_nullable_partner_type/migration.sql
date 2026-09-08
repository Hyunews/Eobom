-- DropForeignKey
ALTER TABLE "Lead" DROP CONSTRAINT "Lead_facilityId_fkey";

-- AlterTable
ALTER TABLE "Lead" ALTER COLUMN "facilityId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Partner" ADD COLUMN     "partnerType" TEXT NOT NULL DEFAULT 'FUNERAL_FACILITY';

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE SET NULL ON UPDATE CASCADE;
