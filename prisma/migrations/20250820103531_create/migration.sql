-- CreateTable
CREATE TABLE "public"."ReceiveItem" (
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
    "person" TEXT,
    "statuss" TEXT,

    CONSTRAINT "ReceiveItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReceiveItem_itemcode_key" ON "public"."ReceiveItem"("itemcode");
