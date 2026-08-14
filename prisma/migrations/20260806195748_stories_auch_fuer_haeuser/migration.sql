-- AlterTable
ALTER TABLE "Story" ADD COLUMN     "agencyId" TEXT,
ALTER COLUMN "profileId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Story_profileId_createdAt_idx" ON "Story"("profileId", "createdAt");

-- CreateIndex
CREATE INDEX "Story_agencyId_createdAt_idx" ON "Story"("agencyId", "createdAt");

-- AddForeignKey
ALTER TABLE "Story" ADD CONSTRAINT "Story_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;
