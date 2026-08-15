/*
  Warnings:

  - You are about to drop the column `biography` on the `Profile` table. All the data in the column will be lost.
  - Added the required column `biograpy` to the `Profile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Profile" DROP COLUMN "biography",
ADD COLUMN     "biograpy" TEXT NOT NULL;

ALTER TABLE "Profile" RENAME COLUMN "biograpy" TO "biography"


