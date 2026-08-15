/*
  Warnings:

  - You are about to drop the column `company` on the `Getagory` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Getagory" DROP COLUMN "company",
ADD COLUMN     "list" TEXT;
