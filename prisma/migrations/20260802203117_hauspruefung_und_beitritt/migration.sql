-- CreateEnum
CREATE TYPE "AgencyInviteOrigin" AS ENUM ('AGENCY', 'PROFILE');

-- AlterTable
ALTER TABLE "AgencyInvite" ADD COLUMN     "origin" "AgencyInviteOrigin" NOT NULL DEFAULT 'AGENCY';

-- CreateTable
CREATE TABLE "AgencyVerification" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "status" "VerificationStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "legalName" TEXT,
    "uid" TEXT,
    "contactName" TEXT,
    "contactRole" TEXT,
    "registryKey" TEXT,
    "permitKey" TEXT,
    "idKey" TEXT,
    "note" TEXT,
    "reviewerId" TEXT,
    "submittedById" TEXT,
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgencyVerification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AgencyVerification_agencyId_key" ON "AgencyVerification"("agencyId");

-- CreateIndex
CREATE INDEX "AgencyVerification_status_idx" ON "AgencyVerification"("status");

-- AddForeignKey
ALTER TABLE "AgencyVerification" ADD CONSTRAINT "AgencyVerification_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;
