-- AlterTable
ALTER TABLE "User" ADD COLUMN     "addressDetail" TEXT,
ADD COLUMN     "addressRoad" TEXT,
ADD COLUMN     "addressZonecode" TEXT,
ADD COLUMN     "contactPhone" TEXT,
ADD COLUMN     "contactTimePref" TEXT,
ADD COLUMN     "marketingAgreedAt" TIMESTAMP(3),
ADD COLUMN     "phoneVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "profileUpdatedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "FamilyDesignation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phoneEnc" TEXT NOT NULL,
    "phoneHash" TEXT NOT NULL,
    "emailEnc" TEXT,
    "relationship" TEXT NOT NULL,
    "relationshipEtc" TEXT,
    "scope" TEXT NOT NULL DEFAULT 'VIEWER',
    "priority" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "inviteToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "notifiedAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "declinedAt" TIMESTAMP(3),
    "acceptedUserId" TEXT,
    "lastConfirmedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FamilyDesignation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FamilyDesignation_inviteToken_key" ON "FamilyDesignation"("inviteToken");

-- CreateIndex
CREATE INDEX "FamilyDesignation_userId_status_idx" ON "FamilyDesignation"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "FamilyDesignation_userId_phoneHash_key" ON "FamilyDesignation"("userId", "phoneHash");

-- AddForeignKey
ALTER TABLE "FamilyDesignation" ADD CONSTRAINT "FamilyDesignation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
