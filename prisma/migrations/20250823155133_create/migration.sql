/*
  Warnings:

  - You are about to drop the `ReceiveItem` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "public"."ReceiveItem";

-- CreateTable
CREATE TABLE "public"."RCitemlist" (
    "id" SERIAL NOT NULL,
    "company" TEXT,
    "codenames" TEXT,
    "itemcode" TEXT,
    "itemName" TEXT,
    "unit" TEXT,
    "createDate" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "newCost" DOUBLE PRECISION,
    "qty" DOUBLE PRECISION,
    "totalcost" DOUBLE PRECISION,
    "lot" TEXT,
    "dateExp" TIMESTAMP(3),
    "freebaht" DOUBLE PRECISION,
    "discountbaht" DOUBLE PRECISION,
    "sale" DOUBLE PRECISION,
    "balance" DOUBLE PRECISION,
    "Barcode" TEXT,
    "type" TEXT,
    "person" TEXT,
    "statuss" TEXT,

    CONSTRAINT "RCitemlist_pkey" PRIMARY KEY ("id")
);
