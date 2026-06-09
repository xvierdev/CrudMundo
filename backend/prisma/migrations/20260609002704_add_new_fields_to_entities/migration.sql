-- AlterTable
ALTER TABLE "cities" ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "population" INTEGER;

-- AlterTable
ALTER TABLE "continents" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "countries" ADD COLUMN     "currency" TEXT,
ADD COLUMN     "officialLanguage" TEXT,
ADD COLUMN     "population" INTEGER;
