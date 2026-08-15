/*
  Warnings:

  - You are about to drop the column `code_costomer` on the `Sale` table. All the data in the column will be lost.
  - You are about to drop the column `group_price` on the `Sale` table. All the data in the column will be lost.
  - You are about to drop the column `id_costomer` on the `Sale` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Sale" DROP COLUMN "code_costomer",
DROP COLUMN "group_price",
DROP COLUMN "id_costomer",
ADD COLUMN     "id_main" TEXT;

-- CreateTable
CREATE TABLE "public"."SaleMain" (
    "id" SERIAL NOT NULL,
    "createDate" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "id_main" TEXT,
    "company" TEXT,
    "id_costomer" INTEGER,
    "code_costomer" TEXT,
    "group_price" TEXT,
    "pay" TEXT,
    "bill" INTEGER,
    "total" DOUBLE PRECISION,
    "discount" DOUBLE PRECISION,
    "sumtotal" DOUBLE PRECISION,
    "addreward" DOUBLE PRECISION,
    "usereward" DOUBLE PRECISION,
    "person" TEXT,
    "statuss" TEXT,

    CONSTRAINT "SaleMain_pkey" PRIMARY KEY ("id")
);
