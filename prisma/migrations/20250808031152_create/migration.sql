/*
  Warnings:

  - You are about to alter the column `company` on the `Datalist` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `code` on the `Datalist` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `ProductName` on the `Datalist` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(500)`.
  - You are about to alter the column `fixname` on the `Datalist` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(500)`.
  - You are about to alter the column `group` on the `Datalist` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(500)`.
  - You are about to alter the column `type` on the `Datalist` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(500)`.
  - You are about to alter the column `subtype` on the `Datalist` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(200)`.
  - You are about to alter the column `Category` on the `Datalist` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(500)`.
  - You are about to alter the column `DrugRegistor` on the `Datalist` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(500)`.
  - You are about to alter the column `Area` on the `Datalist` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(200)`.
  - The `Show` column on the `Datalist` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `Child` column on the `Datalist` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `CI` column on the `Datalist` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "public"."Datalist" ALTER COLUMN "company" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "code" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "ProductName" SET DATA TYPE VARCHAR(500),
ALTER COLUMN "fixname" SET DATA TYPE VARCHAR(500),
ALTER COLUMN "group" SET DATA TYPE VARCHAR(500),
ALTER COLUMN "type" SET DATA TYPE VARCHAR(500),
ALTER COLUMN "subtype" SET DATA TYPE VARCHAR(200),
ALTER COLUMN "Category" SET DATA TYPE VARCHAR(500),
ALTER COLUMN "DrugRegistor" SET DATA TYPE VARCHAR(500),
ALTER COLUMN "Area" SET DATA TYPE VARCHAR(200),
DROP COLUMN "Show",
ADD COLUMN     "Show" BOOLEAN,
DROP COLUMN "Child",
ADD COLUMN     "Child" BOOLEAN,
DROP COLUMN "CI",
ADD COLUMN     "CI" BOOLEAN;
