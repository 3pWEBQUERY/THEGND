-- AlterTable
ALTER TABLE "User" ADD COLUMN     "managedByAgencyId" TEXT;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_managedByAgencyId_fkey" FOREIGN KEY ("managedByAgencyId") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE;
