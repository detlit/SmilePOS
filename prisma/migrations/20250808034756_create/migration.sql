/*
  Warnings:

  - You are about to alter the column `CostActual` on the `Datalist` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Decimal(10,2)`.
  - You are about to alter the column `price` on the `Datalist` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Decimal(10,2)`.
  - You are about to alter the column `wholesaleprice` on the `Datalist` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Decimal(10,2)`.
  - You are about to alter the column `online` on the `Datalist` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Decimal(10,2)`.
  - You are about to alter the column `PriceA` on the `Datalist` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Decimal(10,2)`.
  - You are about to alter the column `PriceB` on the `Datalist` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Decimal(10,2)`.

*/
-- AlterTable
ALTER TABLE "public"."Datalist" ALTER COLUMN "CostActual" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "price" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "wholesaleprice" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "online" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "PriceA" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "PriceB" SET DATA TYPE DECIMAL(10,2);
