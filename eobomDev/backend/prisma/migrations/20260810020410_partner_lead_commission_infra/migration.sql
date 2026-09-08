-- AlterTable
ALTER TABLE "Facility" ADD COLUMN     "partnerId" TEXT;

-- CreateTable
CREATE TABLE "Partner" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "refreshTokenHash" TEXT,
    "bizRegNo" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "bizLicenseUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "rejectReason" TEXT,
    "approvedAt" TIMESTAMP(3),
    "settlementBank" TEXT,
    "settlementAccount" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacilityClaim" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "evidenceUrl" TEXT,
    "reviewNote" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FacilityClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadNumberCounter" (
    "dateKey" TEXT NOT NULL,
    "seq" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "LeadNumberCounter_pkey" PRIMARY KEY ("dateKey")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "leadNo" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "partnerId" TEXT,
    "userId" TEXT,
    "applicantName" TEXT,
    "applicantPhone" TEXT,
    "maskedAt" TIMESTAMP(3),
    "payload" JSONB NOT NULL,
    "thirdPartyConsentAt" TIMESTAMP(3),
    "consentSnapshot" JSONB,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "statusHistory" JSONB NOT NULL DEFAULT '[]',
    "billable" BOOLEAN NOT NULL DEFAULT false,
    "billedAmount" INTEGER,
    "commissionPolicyId" TEXT,
    "settlementId" TEXT,
    "disputeReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommissionPolicy" (
    "id" TEXT NOT NULL,
    "basis" TEXT NOT NULL,
    "amount" INTEGER,
    "rate" DECIMAL(5,4),
    "currency" TEXT NOT NULL DEFAULT 'KRW',
    "partnerId" TEXT,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "memo" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommissionPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settlement" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "periodYm" TEXT NOT NULL,
    "leadCount" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "issuedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Settlement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Partner_email_key" ON "Partner"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Partner_bizRegNo_key" ON "Partner"("bizRegNo");

-- CreateIndex
CREATE INDEX "Partner_status_idx" ON "Partner"("status");

-- CreateIndex
CREATE INDEX "FacilityClaim_status_idx" ON "FacilityClaim"("status");

-- CreateIndex
CREATE UNIQUE INDEX "FacilityClaim_partnerId_facilityId_key" ON "FacilityClaim"("partnerId", "facilityId");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_leadNo_key" ON "Lead"("leadNo");

-- CreateIndex
CREATE INDEX "Lead_partnerId_status_idx" ON "Lead"("partnerId", "status");

-- CreateIndex
CREATE INDEX "Lead_facilityId_createdAt_idx" ON "Lead"("facilityId", "createdAt");

-- CreateIndex
CREATE INDEX "Lead_createdAt_idx" ON "Lead"("createdAt");

-- CreateIndex
CREATE INDEX "CommissionPolicy_partnerId_effectiveFrom_idx" ON "CommissionPolicy"("partnerId", "effectiveFrom");

-- CreateIndex
CREATE UNIQUE INDEX "Settlement_partnerId_periodYm_key" ON "Settlement"("partnerId", "periodYm");

-- CreateIndex
CREATE INDEX "Facility_partnerId_idx" ON "Facility"("partnerId");

-- AddForeignKey
ALTER TABLE "Facility" ADD CONSTRAINT "Facility_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacilityClaim" ADD CONSTRAINT "FacilityClaim_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacilityClaim" ADD CONSTRAINT "FacilityClaim_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_commissionPolicyId_fkey" FOREIGN KEY ("commissionPolicyId") REFERENCES "CommissionPolicy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "Settlement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionPolicy" ADD CONSTRAINT "CommissionPolicy_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

