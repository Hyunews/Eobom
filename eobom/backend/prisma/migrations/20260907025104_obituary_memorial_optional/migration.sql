-- DropForeignKey
ALTER TABLE "Obituary" DROP CONSTRAINT "Obituary_memorialId_fkey";

-- AlterTable
ALTER TABLE "Obituary" ALTER COLUMN "memorialId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Obituary" ADD CONSTRAINT "Obituary_memorialId_fkey" FOREIGN KEY ("memorialId") REFERENCES "Memorial"("id") ON DELETE SET NULL ON UPDATE CASCADE;
