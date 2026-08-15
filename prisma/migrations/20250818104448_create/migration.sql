/*
  Warnings:

  - You are about to drop the column `leartime` on the `Supplier` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Supplier" DROP COLUMN "leartime",
ADD COLUMN     "leadtime" INTEGER;
