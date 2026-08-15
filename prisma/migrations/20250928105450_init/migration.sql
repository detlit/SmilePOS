/*
  Warnings:

  - You are about to drop the column `status` on the `SettingLabel` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."SettingLabel" DROP COLUMN "status",
ADD COLUMN     "all" TEXT,
ADD COLUMN     "line" TEXT,
ADD COLUMN     "logo" TEXT;
