/*
  Warnings:

  - You are about to drop the column `status` on the `Customer` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Customer" DROP COLUMN "status",
ADD COLUMN     "statuss" TEXT;
