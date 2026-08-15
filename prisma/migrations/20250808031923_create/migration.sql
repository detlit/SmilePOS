/*
  Warnings:

  - You are about to alter the column `CostActual` on the `Datalist` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.
  - You are about to alter the column `price` on the `Datalist` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.
  - You are about to alter the column `wholesaleprice` on the `Datalist` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.
  - You are about to alter the column `online` on the `Datalist` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.
  - You are about to alter the column `PriceA` on the `Datalist` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.
  - You are about to alter the column `PriceB` on the `Datalist` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.
  - You are about to alter the column `Max` on the `Datalist` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.
  - You are about to alter the column `Min` on the `Datalist` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.
  - You are about to alter the column `ROP` on the `Datalist` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.
  - You are about to alter the column `AlarmExp` on the `Datalist` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.

*/
-- AlterTable
ALTER TABLE "public"."Datalist" ALTER COLUMN "CostActual" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "price" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "wholesaleprice" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "online" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "PriceA" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "PriceB" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "Max" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "Min" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "ROP" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "AlarmExp" SET DATA TYPE DOUBLE PRECISION;
