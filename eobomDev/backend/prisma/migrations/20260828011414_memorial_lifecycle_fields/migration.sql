-- AlterTable
ALTER TABLE "Memorial" ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "frozenAt" TIMESTAMP(3),
ADD COLUMN     "purgeAt" TIMESTAMP(3);
