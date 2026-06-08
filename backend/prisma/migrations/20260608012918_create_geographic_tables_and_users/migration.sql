/*
  Warnings:

  - You are about to drop the column `cityId` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name,countryId]` on the table `cities` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_cityId_fkey";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "cityId";

-- CreateIndex
CREATE UNIQUE INDEX "cities_name_countryId_key" ON "cities"("name", "countryId");
