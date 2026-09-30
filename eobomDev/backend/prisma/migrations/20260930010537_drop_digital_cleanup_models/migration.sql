/*
  Warnings:

  - You are about to drop the `DigitalCleanupItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DigitalPlatform` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "DigitalCleanupItem" DROP CONSTRAINT "DigitalCleanupItem_deceasedId_fkey";

-- DropForeignKey
ALTER TABLE "DigitalCleanupItem" DROP CONSTRAINT "DigitalCleanupItem_platformId_fkey";

-- DropForeignKey
ALTER TABLE "DigitalCleanupItem" DROP CONSTRAINT "DigitalCleanupItem_userId_fkey";

-- DropTable
DROP TABLE "DigitalCleanupItem";

-- DropTable
DROP TABLE "DigitalPlatform";
