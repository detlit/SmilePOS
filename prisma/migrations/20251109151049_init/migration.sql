/*
  Warnings:

  - The `level1` column on the `MainLevel` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `level2` column on the `MainLevel` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `level3` column on the `MainLevel` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "public"."MainLevel" DROP COLUMN "level1",
ADD COLUMN     "level1" BOOLEAN DEFAULT true,
DROP COLUMN "level2",
ADD COLUMN     "level2" BOOLEAN DEFAULT true,
DROP COLUMN "level3",
ADD COLUMN     "level3" BOOLEAN DEFAULT true;
