/*
  Warnings:

  - You are about to drop the column `company` on the `SaleMain` table. All the data in the column will be lost.
  - You are about to drop the column `person` on the `SaleMain` table. All the data in the column will be lost.
  - You are about to drop the column `statuss` on the `SaleMain` table. All the data in the column will be lost.
  - You are about to drop the column `total` on the `SaleMain` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."SaleMain" DROP COLUMN "company",
DROP COLUMN "person",
DROP COLUMN "statuss",
DROP COLUMN "total",
ADD COLUMN     "companyall" TEXT,
ADD COLUMN     "personall" TEXT,
ADD COLUMN     "statussall" TEXT,
ADD COLUMN     "totalall" DOUBLE PRECISION;
