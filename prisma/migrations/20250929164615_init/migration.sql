/*
  Warnings:

  - You are about to drop the column `format` on the `Settingpayment` table. All the data in the column will be lost.
  - You are about to drop the column `version` on the `Settingpayment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Settingpayment" DROP COLUMN "format",
DROP COLUMN "version";
