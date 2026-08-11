-- AlterTable
ALTER TABLE "Expert" ADD COLUMN     "isPublished" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "ConsultRequest" (
    "id" TEXT NOT NULL,
    "requestNo" TEXT NOT NULL,
    "expertId" TEXT NOT NULL,
    "categorySnapshot" TEXT NOT NULL,
    "userId" TEXT,
    "applicantName" TEXT,
    "applicantPhone" TEXT,
    "maskedAt" TIMESTAMP(3),
    "channel" TEXT NOT NULL,
    "preferredAt" TIMESTAMP(3),
    "content" TEXT NOT NULL,
    "thirdPartyConsentAt" TIMESTAMP(3),
    "consentSnapshot" JSONB,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "statusHistory" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConsultRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsultNumberCounter" (
    "dateKey" TEXT NOT NULL,
    "seq" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ConsultNumberCounter_pkey" PRIMARY KEY ("dateKey")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConsultRequest_requestNo_key" ON "ConsultRequest"("requestNo");

-- CreateIndex
CREATE INDEX "ConsultRequest_expertId_status_idx" ON "ConsultRequest"("expertId", "status");

-- CreateIndex
CREATE INDEX "ConsultRequest_createdAt_idx" ON "ConsultRequest"("createdAt");

-- AddForeignKey
ALTER TABLE "ConsultRequest" ADD CONSTRAINT "ConsultRequest_expertId_fkey" FOREIGN KEY ("expertId") REFERENCES "Expert"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsultRequest" ADD CONSTRAINT "ConsultRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
