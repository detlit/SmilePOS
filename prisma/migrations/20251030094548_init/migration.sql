/*
  Warnings:

  - You are about to drop the column `drugallergy` on the `Customer` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Customer" DROP COLUMN "drugallergy";

-- CreateTable
CREATE TABLE "public"."Drugallergy" (
    "id" SERIAL NOT NULL,
    "company" TEXT,
    "drugallergy" TEXT,
    "remark" TEXT,
    "id_cus" INTEGER NOT NULL,

    CONSTRAINT "Drugallergy_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Drugallergy" ADD CONSTRAINT "Drugallergy_id_cus_fkey" FOREIGN KEY ("id_cus") REFERENCES "public"."Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
