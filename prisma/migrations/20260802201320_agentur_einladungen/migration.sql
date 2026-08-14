-- CreateEnum
CREATE TYPE "AgencyInviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'REVOKED');

-- AlterTable
ALTER TABLE "AgencyMember" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "AgencyInvite" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "status" "AgencyInviteStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "invitedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "AgencyInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AgencyInvite_profileId_status_idx" ON "AgencyInvite"("profileId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "AgencyInvite_agencyId_profileId_key" ON "AgencyInvite"("agencyId", "profileId");

-- CreateIndex
CREATE INDEX "AgencyMember_userId_idx" ON "AgencyMember"("userId");

-- AddForeignKey
ALTER TABLE "AgencyInvite" ADD CONSTRAINT "AgencyInvite_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgencyInvite" ADD CONSTRAINT "AgencyInvite_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
