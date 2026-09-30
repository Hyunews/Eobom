-- CreateTable
CREATE TABLE "DeathVerification" (
    "id" TEXT NOT NULL,
    "subjectUserId" TEXT NOT NULL,
    "requestedByDesigId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "deceasedName" TEXT NOT NULL,
    "deathDate" TIMESTAMP(3) NOT NULL,
    "funeralHallName" TEXT,
    "funeralHallPhone" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "targetAt" TIMESTAMP(3) NOT NULL,
    "level" TEXT,
    "method" TEXT,
    "reviewedByAdminId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectReason" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "cancelledBy" TEXT,

    CONSTRAINT "DeathVerification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DeathVerification_status_dueAt_idx" ON "DeathVerification"("status", "dueAt");

-- CreateIndex
CREATE INDEX "DeathVerification_subjectUserId_idx" ON "DeathVerification"("subjectUserId");

-- CreateIndex
CREATE INDEX "DeathVerification_requestedByDesigId_idx" ON "DeathVerification"("requestedByDesigId");

-- AddForeignKey
ALTER TABLE "DeathVerification" ADD CONSTRAINT "DeathVerification_subjectUserId_fkey" FOREIGN KEY ("subjectUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeathVerification" ADD CONSTRAINT "DeathVerification_requestedByDesigId_fkey" FOREIGN KEY ("requestedByDesigId") REFERENCES "FamilyDesignation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
