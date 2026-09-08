-- CreateTable
CREATE TABLE "EndingNote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "sealedAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),
    "policyAgreedAt" TIMESTAMP(3),
    "lastConfirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EndingNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FarewellMessage" (
    "id" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "title" TEXT,
    "bodyEnc" TEXT NOT NULL,
    "mediaKey" TEXT,
    "mediaMime" TEXT,
    "mediaDurationSec" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FarewellMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EndingNote_userId_key" ON "EndingNote"("userId");

-- CreateIndex
CREATE INDEX "EndingNote_userId_status_idx" ON "EndingNote"("userId", "status");

-- CreateIndex
CREATE INDEX "FarewellMessage_noteId_idx" ON "FarewellMessage"("noteId");

-- CreateIndex
CREATE INDEX "FarewellMessage_recipientId_idx" ON "FarewellMessage"("recipientId");

-- AddForeignKey
ALTER TABLE "EndingNote" ADD CONSTRAINT "EndingNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FarewellMessage" ADD CONSTRAINT "FarewellMessage_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "EndingNote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FarewellMessage" ADD CONSTRAINT "FarewellMessage_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "FamilyDesignation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
