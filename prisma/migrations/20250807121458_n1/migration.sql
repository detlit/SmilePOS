/*
  Warnings:

  - You are about to drop the column `code` on the `Getagory` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Getagory" DROP COLUMN "code",
ADD COLUMN     "company" TEXT;
