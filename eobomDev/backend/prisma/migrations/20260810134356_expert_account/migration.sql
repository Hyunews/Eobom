-- CreateTable
CREATE TABLE "Expert" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "refreshTokenHash" TEXT,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "licenseNo" TEXT NOT NULL,
    "licenseOrg" TEXT,
    "licenseDocUrl" TEXT,
    "contactPhone" TEXT NOT NULL,
    "bio" TEXT,
    "specialties" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "rejectReason" TEXT,
    "approvedAt" TIMESTAMP(3),
    "settlementBank" TEXT,
    "settlementAccount" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Expert_email_key" ON "Expert"("email");

-- CreateIndex
CREATE INDEX "Expert_status_idx" ON "Expert"("status");

-- CreateIndex
CREATE INDEX "Expert_category_idx" ON "Expert"("category");

-- CreateIndex
CREATE UNIQUE INDEX "Expert_category_licenseNo_key" ON "Expert"("category", "licenseNo");

