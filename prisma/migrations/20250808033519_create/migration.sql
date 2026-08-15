/*
  Warnings:

  - You are about to alter the column `CostActual` on the `Datalist` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal`.
  - You are about to alter the column `price` on the `Datalist` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal`.
  - You are about to alter the column `wholesaleprice` on the `Datalist` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal`.
  - You are about to alter the column `online` on the `Datalist` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal`.
  - You are about to alter the column `PriceA` on the `Datalist` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal`.
  - You are about to alter the column `PriceB` on the `Datalist` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal`.
  - You are about to alter the column `Max` on the `Datalist` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal`.
  - You are about to alter the column `Min` on the `Datalist` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal`.
  - You are about to alter the column `ROP` on the `Datalist` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal`.
  - You are about to alter the column `AlarmExp` on the `Datalist` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal`.
  - Made the column `CostActual` on table `Datalist` required. This step will fail if there are existing NULL values in that column.
  - Made the column `price` on table `Datalist` required. This step will fail if there are existing NULL values in that column.
  - Made the column `wholesaleprice` on table `Datalist` required. This step will fail if there are existing NULL values in that column.
  - Made the column `online` on table `Datalist` required. This step will fail if there are existing NULL values in that column.
  - Made the column `PriceA` on table `Datalist` required. This step will fail if there are existing NULL values in that column.
  - Made the column `PriceB` on table `Datalist` required. This step will fail if there are existing NULL values in that column.
  - Made the column `Max` on table `Datalist` required. This step will fail if there are existing NULL values in that column.
  - Made the column `Min` on table `Datalist` required. This step will fail if there are existing NULL values in that column.
  - Made the column `ROP` on table `Datalist` required. This step will fail if there are existing NULL values in that column.
  - Made the column `AlarmExp` on table `Datalist` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."Datalist" ALTER COLUMN "CostActual" SET NOT NULL,
ALTER COLUMN "CostActual" SET DATA TYPE DECIMAL,
ALTER COLUMN "price" SET NOT NULL,
ALTER COLUMN "price" SET DATA TYPE DECIMAL,
ALTER COLUMN "wholesaleprice" SET NOT NULL,
ALTER COLUMN "wholesaleprice" SET DATA TYPE DECIMAL,
ALTER COLUMN "online" SET NOT NULL,
ALTER COLUMN "online" SET DATA TYPE DECIMAL,
ALTER COLUMN "PriceA" SET NOT NULL,
ALTER COLUMN "PriceA" SET DATA TYPE DECIMAL,
ALTER COLUMN "PriceB" SET NOT NULL,
ALTER COLUMN "PriceB" SET DATA TYPE DECIMAL,
ALTER COLUMN "Max" SET NOT NULL,
ALTER COLUMN "Max" SET DATA TYPE DECIMAL,
ALTER COLUMN "Min" SET NOT NULL,
ALTER COLUMN "Min" SET DATA TYPE DECIMAL,
ALTER COLUMN "ROP" SET NOT NULL,
ALTER COLUMN "ROP" SET DATA TYPE DECIMAL,
ALTER COLUMN "AlarmExp" SET NOT NULL,
ALTER COLUMN "AlarmExp" SET DATA TYPE DECIMAL;
