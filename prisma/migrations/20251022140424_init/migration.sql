/*
  Warnings:

  - The `qt_number` column on the `DocMain` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `bl_number` column on the `DocMain` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `inv_number` column on the `DocMain` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `re_number` column on the `DocMain` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "public"."DocMain" DROP COLUMN "qt_number",
ADD COLUMN     "qt_number" INTEGER,
DROP COLUMN "bl_number",
ADD COLUMN     "bl_number" INTEGER,
DROP COLUMN "inv_number",
ADD COLUMN     "inv_number" INTEGER,
DROP COLUMN "re_number",
ADD COLUMN     "re_number" INTEGER;
