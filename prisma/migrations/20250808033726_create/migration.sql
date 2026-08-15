/*
  Warnings:

  - You are about to alter the column `Max` on the `Datalist` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Integer`.
  - You are about to alter the column `Min` on the `Datalist` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Integer`.
  - You are about to alter the column `ROP` on the `Datalist` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Integer`.
  - You are about to alter the column `AlarmExp` on the `Datalist` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Integer`.

*/
-- AlterTable
ALTER TABLE "public"."Datalist" ALTER COLUMN "CostActual" DROP NOT NULL,
ALTER COLUMN "price" DROP NOT NULL,
ALTER COLUMN "wholesaleprice" DROP NOT NULL,
ALTER COLUMN "online" DROP NOT NULL,
ALTER COLUMN "PriceA" DROP NOT NULL,
ALTER COLUMN "PriceB" DROP NOT NULL,
ALTER COLUMN "Max" DROP NOT NULL,
ALTER COLUMN "Max" SET DATA TYPE INTEGER,
ALTER COLUMN "Min" DROP NOT NULL,
ALTER COLUMN "Min" SET DATA TYPE INTEGER,
ALTER COLUMN "ROP" DROP NOT NULL,
ALTER COLUMN "ROP" SET DATA TYPE INTEGER,
ALTER COLUMN "AlarmExp" DROP NOT NULL,
ALTER COLUMN "AlarmExp" SET DATA TYPE INTEGER;
