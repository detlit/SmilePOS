/*
  Warnings:

  - You are about to drop the column `formatline` on the `SettingStore` table. All the data in the column will be lost.
  - You are about to drop the column `formatlogo` on the `SettingStore` table. All the data in the column will be lost.
  - You are about to drop the column `publiclineId` on the `SettingStore` table. All the data in the column will be lost.
  - You are about to drop the column `publiclogoId` on the `SettingStore` table. All the data in the column will be lost.
  - You are about to drop the column `versionline` on the `SettingStore` table. All the data in the column will be lost.
  - You are about to drop the column `versionlogo` on the `SettingStore` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[publiclogo]` on the table `SettingStore` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[publicline]` on the table `SettingStore` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."SettingStore_publiclineId_key";

-- DropIndex
DROP INDEX "public"."SettingStore_publiclogoId_key";

-- AlterTable
ALTER TABLE "public"."SettingStore" DROP COLUMN "formatline",
DROP COLUMN "formatlogo",
DROP COLUMN "publiclineId",
DROP COLUMN "publiclogoId",
DROP COLUMN "versionline",
DROP COLUMN "versionlogo",
ADD COLUMN     "publicline" TEXT,
ADD COLUMN     "publiclogo" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "SettingStore_publiclogo_key" ON "public"."SettingStore"("publiclogo");

-- CreateIndex
CREATE UNIQUE INDEX "SettingStore_publicline_key" ON "public"."SettingStore"("publicline");
