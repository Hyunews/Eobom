-- CreateTable
CREATE TABLE "DigitalPlatform" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "officialUrl" TEXT,
    "requiredDocs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "guideSummary" TEXT NOT NULL,
    "estimatedDays" INTEGER,
    "needsAgentHelp" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "lastVerifiedAt" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DigitalPlatform_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DigitalCleanupItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platformId" TEXT,
    "customName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'TODO',
    "statusHistory" JSONB NOT NULL DEFAULT '[]',
    "memo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DigitalCleanupItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Memorial" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "deceasedName" TEXT NOT NULL,
    "deceasedBirthDate" TIMESTAMP(3),
    "deceasedDeathDate" TIMESTAMP(3),
    "portraitUrl" TEXT,
    "epitaph" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'LINK',
    "falseReportAgreedAt" TIMESTAMP(3) NOT NULL,
    "reportedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Memorial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemorialTribute" (
    "id" TEXT NOT NULL,
    "memorialId" TEXT NOT NULL,
    "userId" TEXT,
    "visitorHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemorialTribute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemorialGuestbook" (
    "id" TEXT NOT NULL,
    "memorialId" TEXT NOT NULL,
    "userId" TEXT,
    "authorName" TEXT NOT NULL,
    "relationToDeceased" TEXT,
    "message" TEXT NOT NULL,
    "deletedByOwnerAt" TIMESTAMP(3),
    "hiddenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemorialGuestbook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemorialPhoto" (
    "id" TEXT NOT NULL,
    "memorialId" TEXT NOT NULL,
    "uploadedByUserId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemorialPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DigitalPlatform_category_isPublished_idx" ON "DigitalPlatform"("category", "isPublished");

-- CreateIndex
CREATE INDEX "DigitalCleanupItem_userId_status_idx" ON "DigitalCleanupItem"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Memorial_slug_key" ON "Memorial"("slug");

-- CreateIndex
CREATE INDEX "Memorial_createdByUserId_idx" ON "Memorial"("createdByUserId");

-- CreateIndex
CREATE INDEX "Memorial_visibility_idx" ON "Memorial"("visibility");

-- CreateIndex
CREATE UNIQUE INDEX "MemorialTribute_memorialId_userId_key" ON "MemorialTribute"("memorialId", "userId");

-- CreateIndex
CREATE INDEX "MemorialGuestbook_memorialId_createdAt_idx" ON "MemorialGuestbook"("memorialId", "createdAt");

-- CreateIndex
CREATE INDEX "MemorialPhoto_memorialId_sortOrder_idx" ON "MemorialPhoto"("memorialId", "sortOrder");

-- AddForeignKey
ALTER TABLE "DigitalCleanupItem" ADD CONSTRAINT "DigitalCleanupItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DigitalCleanupItem" ADD CONSTRAINT "DigitalCleanupItem_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "DigitalPlatform"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Memorial" ADD CONSTRAINT "Memorial_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemorialTribute" ADD CONSTRAINT "MemorialTribute_memorialId_fkey" FOREIGN KEY ("memorialId") REFERENCES "Memorial"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemorialTribute" ADD CONSTRAINT "MemorialTribute_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemorialGuestbook" ADD CONSTRAINT "MemorialGuestbook_memorialId_fkey" FOREIGN KEY ("memorialId") REFERENCES "Memorial"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemorialGuestbook" ADD CONSTRAINT "MemorialGuestbook_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemorialPhoto" ADD CONSTRAINT "MemorialPhoto_memorialId_fkey" FOREIGN KEY ("memorialId") REFERENCES "Memorial"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemorialPhoto" ADD CONSTRAINT "MemorialPhoto_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
