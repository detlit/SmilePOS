-- CreateTable
CREATE TABLE "public"."Gifts" (
    "id" SERIAL NOT NULL,
    "createDate" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "company" TEXT,
    "id_product" INTEGER,
    "code_product" TEXT,
    "name_product" TEXT,
    "gift" DOUBLE PRECISION,
    "person" TEXT,

    CONSTRAINT "Gifts_pkey" PRIMARY KEY ("id")
);
