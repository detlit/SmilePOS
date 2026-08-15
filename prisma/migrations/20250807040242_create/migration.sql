/*
  Warnings:

  - Added the required column `Dui` to the `Profile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `Phen` to the `Profile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Profile" ADD COLUMN     "Dui" VARCHAR(500) NOT NULL,
ADD COLUMN     "Phen" VARCHAR(500) NOT NULL;
