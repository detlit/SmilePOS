/*
  Warnings:

  - The `CostActual` column on the `Datalist` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `price` column on the `Datalist` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `wholesaleprice` column on the `Datalist` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `online` column on the `Datalist` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `PriceA` column on the `Datalist` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `PriceB` column on the `Datalist` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `Max` column on the `Datalist` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `Min` column on the `Datalist` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `ROP` column on the `Datalist` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "public"."Datalist" DROP COLUMN "CostActual",
ADD COLUMN     "CostActual" DOUBLE PRECISION,
DROP COLUMN "price",
ADD COLUMN     "price" DOUBLE PRECISION,
DROP COLUMN "wholesaleprice",
ADD COLUMN     "wholesaleprice" DOUBLE PRECISION,
DROP COLUMN "online",
ADD COLUMN     "online" DOUBLE PRECISION,
DROP COLUMN "PriceA",
ADD COLUMN     "PriceA" DOUBLE PRECISION,
DROP COLUMN "PriceB",
ADD COLUMN     "PriceB" DOUBLE PRECISION,
DROP COLUMN "Max",
ADD COLUMN     "Max" DOUBLE PRECISION,
DROP COLUMN "Min",
ADD COLUMN     "Min" DOUBLE PRECISION,
DROP COLUMN "ROP",
ADD COLUMN     "ROP" DOUBLE PRECISION;
