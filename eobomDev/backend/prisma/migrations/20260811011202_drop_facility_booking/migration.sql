/*
  Warnings:

  - You are about to drop the `FacilityBooking` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "FacilityBooking" DROP CONSTRAINT "FacilityBooking_facilityId_fkey";

-- DropForeignKey
ALTER TABLE "FacilityBooking" DROP CONSTRAINT "FacilityBooking_userId_fkey";

-- DropTable
DROP TABLE "FacilityBooking";
