/*
  Warnings:

  - You are about to drop the column `status` on the `SettingEmployee` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."SettingEmployee" DROP COLUMN "status",
ADD COLUMN     "password" TEXT,
ADD COLUMN     "username" TEXT;
