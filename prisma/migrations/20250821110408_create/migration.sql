-- CreateTable
CREATE TABLE "public"."Sale" (
    "id" SERIAL NOT NULL,
    "createDate" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "company" TEXT,
    "id_costomer" INTEGER,
    "code_costomer" TEXT,
    "id_product" INTEGER,
    "code_product" TEXT,
    "name_product" TEXT,
    "unit" TEXT,
    "group_price" TEXT,
    "qty" DOUBLE PRECISION,
    "price" DOUBLE PRECISION,
    "total" DOUBLE PRECISION,
    "id_receive1" DOUBLE PRECISION,
    "lot_receive1" TEXT,
    "qty_lot1" DOUBLE PRECISION,
    "id_receive2" DOUBLE PRECISION,
    "lot_receive2" TEXT,
    "qty_lot2" DOUBLE PRECISION,
    "id_receive3" DOUBLE PRECISION,
    "lot_receive3" TEXT,
    "qty_lot3" DOUBLE PRECISION,
    "person" TEXT,
    "statuss" TEXT,

    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);
