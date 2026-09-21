-- AlterTable
ALTER TABLE "MemorialGuestbook" ADD COLUMN     "deletedByAuthorAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "deletionRequestedAt" TIMESTAMP(3),
ADD COLUMN     "deletionScheduledAt" TIMESTAMP(3);
