-- CreateEnum
CREATE TYPE "AgencyKind" AS ENUM ('AGENCY', 'CLUB', 'STUDIO', 'MASSAGE', 'SAUNA', 'BAR');

-- AlterTable
ALTER TABLE "Agency" ADD COLUMN     "acceptsCards" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "barrierFree" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "cityId" TEXT,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'CHF',
ADD COLUMN     "district" TEXT,
ADD COLUMN     "hasBar" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasParking" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "headline" TEXT,
ADD COLUMN     "isOpen24h" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPublished" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "kind" "AgencyKind" NOT NULL DEFAULT 'AGENCY',
ADD COLUMN     "priceFrom" INTEGER,
ADD COLUMN     "whatsapp" TEXT,
ALTER COLUMN "countryCode" SET DEFAULT 'CH';

-- CreateTable
CREATE TABLE "AgencyService" (
    "agencyId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,

    CONSTRAINT "AgencyService_pkey" PRIMARY KEY ("agencyId","serviceId")
);

-- CreateTable
CREATE TABLE "AgencyLanguage" (
    "agencyId" TEXT NOT NULL,
    "languageId" TEXT NOT NULL,

    CONSTRAINT "AgencyLanguage_pkey" PRIMARY KEY ("agencyId","languageId")
);

-- CreateTable
CREATE TABLE "AgencyHour" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "opensAt" TEXT,
    "closesAt" TEXT,
    "closed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "AgencyHour_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AgencyService_serviceId_idx" ON "AgencyService"("serviceId");

-- CreateIndex
CREATE INDEX "AgencyLanguage_languageId_idx" ON "AgencyLanguage"("languageId");

-- CreateIndex
CREATE UNIQUE INDEX "AgencyHour_agencyId_weekday_key" ON "AgencyHour"("agencyId", "weekday");

-- CreateIndex
CREATE INDEX "Agency_isPublished_cityId_idx" ON "Agency"("isPublished", "cityId");

-- CreateIndex
CREATE INDEX "Agency_kind_idx" ON "Agency"("kind");

-- CreateIndex
CREATE INDEX "Agency_lat_lng_idx" ON "Agency"("lat", "lng");

-- AddForeignKey
ALTER TABLE "Agency" ADD CONSTRAINT "Agency_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgencyService" ADD CONSTRAINT "AgencyService_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgencyService" ADD CONSTRAINT "AgencyService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgencyLanguage" ADD CONSTRAINT "AgencyLanguage_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgencyLanguage" ADD CONSTRAINT "AgencyLanguage_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "Language"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgencyHour" ADD CONSTRAINT "AgencyHour_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;
