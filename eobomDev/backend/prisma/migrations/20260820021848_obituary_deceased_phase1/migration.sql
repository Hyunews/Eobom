/*
  Warnings:

  - Added the required column `deceasedId` to the `Memorial` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Memorial" ADD COLUMN     "deceasedId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Deceased" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3),
    "deathDate" TIMESTAMP(3),
    "registeredBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Deceased_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Obituary" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "deceasedId" TEXT NOT NULL,
    "memorialId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "funeralHall" TEXT,
    "mourningRoom" TEXT,
    "funeralHallAddr" TEXT,
    "facilityId" TEXT,
    "coffinAt" TIMESTAMP(3),
    "funeralAt" TIMESTAMP(3) NOT NULL,
    "burialSite" TEXT,
    "contactPhone" TEXT,
    "accountEnabled" BOOLEAN NOT NULL DEFAULT false,
    "accountBankCode" TEXT,
    "accountNumberEnc" TEXT,
    "accountHolder" TEXT,
    "portraitShareEnabled" BOOLEAN NOT NULL DEFAULT false,
    "falseReportAgreedAt" TIMESTAMP(3) NOT NULL,
    "resharedNoticeAckAt" TIMESTAMP(3) NOT NULL,
    "shareCount" INTEGER NOT NULL DEFAULT 0,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "cardFieldsUpdatedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Obituary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ObituaryMourner" (
    "id" TEXT NOT NULL,
    "obituaryId" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isChief" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ObituaryMourner_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Deceased_userId_key" ON "Deceased"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Obituary_slug_key" ON "Obituary"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Obituary_memorialId_key" ON "Obituary"("memorialId");

-- CreateIndex
CREATE INDEX "Obituary_createdByUserId_idx" ON "Obituary"("createdByUserId");

-- CreateIndex
CREATE INDEX "ObituaryMourner_obituaryId_sortOrder_idx" ON "ObituaryMourner"("obituaryId", "sortOrder");

-- AddForeignKey
ALTER TABLE "Memorial" ADD CONSTRAINT "Memorial_deceasedId_fkey" FOREIGN KEY ("deceasedId") REFERENCES "Deceased"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Obituary" ADD CONSTRAINT "Obituary_deceasedId_fkey" FOREIGN KEY ("deceasedId") REFERENCES "Deceased"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Obituary" ADD CONSTRAINT "Obituary_memorialId_fkey" FOREIGN KEY ("memorialId") REFERENCES "Memorial"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Obituary" ADD CONSTRAINT "Obituary_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObituaryMourner" ADD CONSTRAINT "ObituaryMourner_obituaryId_fkey" FOREIGN KEY ("obituaryId") REFERENCES "Obituary"("id") ON DELETE CASCADE ON UPDATE CASCADE;
