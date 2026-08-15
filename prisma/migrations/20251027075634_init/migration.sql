/*
  Warnings:

  - You are about to drop the column `Solution` on the `History` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."History" DROP COLUMN "Solution",
ADD COLUMN     "solution" TEXT;
