/*
  Warnings:

  - A unique constraint covering the columns `[name,stateId]` on the table `cities` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "cities_name_countryId_key";

-- CreateIndex
CREATE UNIQUE INDEX "cities_name_stateId_key" ON "cities"("name", "stateId");
