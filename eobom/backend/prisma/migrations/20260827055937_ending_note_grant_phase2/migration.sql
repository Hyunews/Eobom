-- CreateTable
CREATE TABLE "EndingNoteGrant" (
    "id" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "designationId" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "timing" TEXT NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EndingNoteGrant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EndingNoteGrant_noteId_idx" ON "EndingNoteGrant"("noteId");

-- CreateIndex
CREATE INDEX "EndingNoteGrant_designationId_idx" ON "EndingNoteGrant"("designationId");

-- CreateIndex
CREATE UNIQUE INDEX "EndingNoteGrant_noteId_designationId_section_key" ON "EndingNoteGrant"("noteId", "designationId", "section");

-- AddForeignKey
ALTER TABLE "EndingNoteGrant" ADD CONSTRAINT "EndingNoteGrant_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "EndingNote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EndingNoteGrant" ADD CONSTRAINT "EndingNoteGrant_designationId_fkey" FOREIGN KEY ("designationId") REFERENCES "FamilyDesignation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
