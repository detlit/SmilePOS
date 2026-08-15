/*
  Warnings:

  - Made the column `company` on table `Datalist` required. This step will fail if there are existing NULL values in that column.
  - Made the column `code` on table `Datalist` required. This step will fail if there are existing NULL values in that column.
  - Made the column `ProductName` on table `Datalist` required. This step will fail if there are existing NULL values in that column.
  - Made the column `fixname` on table `Datalist` required. This step will fail if there are existing NULL values in that column.
  - Made the column `group` on table `Datalist` required. This step will fail if there are existing NULL values in that column.
  - Made the column `type` on table `Datalist` required. This step will fail if there are existing NULL values in that column.
  - Made the column `subtype` on table `Datalist` required. This step will fail if there are existing NULL values in that column.
  - Made the column `Category` on table `Datalist` required. This step will fail if there are existing NULL values in that column.
  - Made the column `DrugRegistor` on table `Datalist` required. This step will fail if there are existing NULL values in that column.
  - Made the column `Area` on table `Datalist` required. This step will fail if there are existing NULL values in that column.
  - Made the column `CostActual` on table `Datalist` required. This step will fail if there are existing NULL values in that column.
  - Made the column `Unit` on table `Datalist` required. This step will fail if there are existing NULL values in that column.
  - Made the column `price` on table `Datalist` required. This step will fail if there are existing NULL values in that column.
  - Made the column `wholesaleprice` on table `Datalist` required. This step will fail if there are existing NULL values in that column.
  - Made the column `online` on table `Datalist` required. This step will fail if there are existing NULL values in that column.
  - Made the column `PriceA` on table `Datalist` required. This step will fail if there are existing NULL values in that column.
  - Made the column `PriceB` on table `Datalist` required. This step will fail if there are existing NULL values in that column.
  - Made the column `Barcode` on table `Datalist` required. This step will fail if there are existing NULL values in that column.
  - Made the column `Max` on table `Datalist` required. This step will fail if there are existing NULL values in that column.
  - Made the column `Min` on table `Datalist` required. This step will fail if there are existing NULL values in that column.
  - Made the column `ROP` on table `Datalist` required. This step will fail if there are existing NULL values in that column.
  - Made the column `AlarmExp` on table `Datalist` required. This step will fail if there are existing NULL values in that column.
  - Made the column `Remark` on table `Datalist` required. This step will fail if there are existing NULL values in that column.
  - Made the column `Show` on table `Datalist` required. This step will fail if there are existing NULL values in that column.
  - Made the column `Child` on table `Datalist` required. This step will fail if there are existing NULL values in that column.
  - Made the column `CI` on table `Datalist` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."Datalist" ALTER COLUMN "company" SET NOT NULL,
ALTER COLUMN "company" SET DATA TYPE TEXT,
ALTER COLUMN "code" SET NOT NULL,
ALTER COLUMN "code" SET DATA TYPE TEXT,
ALTER COLUMN "ProductName" SET NOT NULL,
ALTER COLUMN "ProductName" SET DATA TYPE TEXT,
ALTER COLUMN "fixname" SET NOT NULL,
ALTER COLUMN "fixname" SET DATA TYPE TEXT,
ALTER COLUMN "group" SET NOT NULL,
ALTER COLUMN "group" SET DATA TYPE TEXT,
ALTER COLUMN "type" SET NOT NULL,
ALTER COLUMN "type" SET DATA TYPE TEXT,
ALTER COLUMN "subtype" SET NOT NULL,
ALTER COLUMN "subtype" SET DATA TYPE TEXT,
ALTER COLUMN "Category" SET NOT NULL,
ALTER COLUMN "Category" SET DATA TYPE TEXT,
ALTER COLUMN "DrugRegistor" SET NOT NULL,
ALTER COLUMN "DrugRegistor" SET DATA TYPE TEXT,
ALTER COLUMN "Area" SET NOT NULL,
ALTER COLUMN "Area" SET DATA TYPE TEXT,
ALTER COLUMN "CostActual" SET NOT NULL,
ALTER COLUMN "Unit" SET NOT NULL,
ALTER COLUMN "price" SET NOT NULL,
ALTER COLUMN "wholesaleprice" SET NOT NULL,
ALTER COLUMN "online" SET NOT NULL,
ALTER COLUMN "PriceA" SET NOT NULL,
ALTER COLUMN "PriceB" SET NOT NULL,
ALTER COLUMN "Barcode" SET NOT NULL,
ALTER COLUMN "Max" SET NOT NULL,
ALTER COLUMN "Min" SET NOT NULL,
ALTER COLUMN "ROP" SET NOT NULL,
ALTER COLUMN "AlarmExp" SET NOT NULL,
ALTER COLUMN "Remark" SET NOT NULL,
ALTER COLUMN "Show" SET NOT NULL,
ALTER COLUMN "Child" SET NOT NULL,
ALTER COLUMN "CI" SET NOT NULL;
