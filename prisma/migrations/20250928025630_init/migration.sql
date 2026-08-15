/*
  Warnings:

  - You are about to drop the column `format` on the `SettingStore` table. All the data in the column will be lost.
  - You are about to drop the column `list` on the `SettingStore` table. All the data in the column will be lost.
  - You are about to drop the column `publicId` on the `SettingStore` table. All the data in the column will be lost.
  - You are about to drop the column `version` on the `SettingStore` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[publiclogoId]` on the table `SettingStore` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[publiclineId]` on the table `SettingStore` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."SettingStore_publicId_key";

-- AlterTable
ALTER TABLE "public"."SettingStore" DROP COLUMN "format",
DROP COLUMN "list",
DROP COLUMN "publicId",
DROP COLUMN "version",
ADD COLUMN     "formatline" TEXT,
ADD COLUMN     "formatlogo" TEXT,
ADD COLUMN     "publiclineId" TEXT,
ADD COLUMN     "publiclogoId" TEXT,
ADD COLUMN     "versionline" TEXT,
ADD COLUMN     "versionlogo" TEXT;

-- CreateTable
CREATE TABLE "public"."SettingEmployee" (
    "id" SERIAL NOT NULL,
    "company" TEXT,
    "name" TEXT,
    "position" TEXT,
    "level" TEXT,
    "status" TEXT,

    CONSTRAINT "SettingEmployee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SettingLabel" (
    "id" SERIAL NOT NULL,
    "company" TEXT,
    "list" TEXT,
    "status" TEXT,

    CONSTRAINT "SettingLabel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Settingpoint" (
    "id" SERIAL NOT NULL,
    "company" TEXT,
    "sale" INTEGER,
    "pointeq" INTEGER,
    "pointset" INTEGER,
    "discount" INTEGER,
    "status" TEXT,

    CONSTRAINT "Settingpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Settingpayment" (
    "id" SERIAL NOT NULL,
    "company" TEXT,
    "bank" TEXT,
    "name" TEXT,
    "bookbankno" INTEGER,
    "promtpayno" INTEGER,
    "status" TEXT,
    "publicId" TEXT,
    "format" TEXT,
    "version" TEXT,

    CONSTRAINT "Settingpayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Settingpayment_publicId_key" ON "public"."Settingpayment"("publicId");

-- CreateIndex
CREATE UNIQUE INDEX "SettingStore_publiclogoId_key" ON "public"."SettingStore"("publiclogoId");

-- CreateIndex
CREATE UNIQUE INDEX "SettingStore_publiclineId_key" ON "public"."SettingStore"("publiclineId");
