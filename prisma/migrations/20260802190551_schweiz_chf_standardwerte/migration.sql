-- AlterTable
ALTER TABLE "Booking" ALTER COLUMN "currency" SET DEFAULT 'CHF';

-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "currency" SET DEFAULT 'CHF';

-- AlterTable
ALTER TABLE "Package" ALTER COLUMN "currency" SET DEFAULT 'CHF';

-- AlterTable
ALTER TABLE "Profile" ALTER COLUMN "currency" SET DEFAULT 'CHF';

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "timezone" SET DEFAULT 'Europe/Zurich';
