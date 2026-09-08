-- CreateTable
CREATE TABLE "ArchivePurgeQueue" (
    "id" TEXT NOT NULL,
    "mediaKey" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "queuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "purgedAt" TIMESTAMP(3),

    CONSTRAINT "ArchivePurgeQueue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FarewellPurgeAuditLog" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "adminName" TEXT NOT NULL,
    "targetIds" TEXT NOT NULL,
    "mediaKeys" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FarewellPurgeAuditLog_pkey" PRIMARY KEY ("id")
);
