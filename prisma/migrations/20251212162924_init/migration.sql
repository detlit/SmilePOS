-- CreateTable
CREATE TABLE "RCstockchange" (
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
    "Barcode" TEXT,
    "type" TEXT,
    "person" TEXT,
    "statuss" TEXT,
    "dateRC" TIMESTAMP(3),
    "balance" DOUBLE PRECISION,
    "codevender" TEXT DEFAULT '',
    "namevender" TEXT DEFAULT '',

    CONSTRAINT "RCstockchange_pkey" PRIMARY KEY ("id")
);
