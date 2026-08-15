/*
  Warnings:

  - The `order_date` column on the `Receive` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `receive_date` column on the `Receive` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `tax_date` column on the `Receive` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `pay_date` column on the `Receive` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "public"."Receive" DROP COLUMN "order_date",
ADD COLUMN     "order_date" TIMESTAMP(3),
DROP COLUMN "receive_date",
ADD COLUMN     "receive_date" TIMESTAMP(3),
DROP COLUMN "tax_date",
ADD COLUMN     "tax_date" TIMESTAMP(3),
DROP COLUMN "pay_date",
ADD COLUMN     "pay_date" TIMESTAMP(3);
