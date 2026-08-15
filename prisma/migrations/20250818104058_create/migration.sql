-- CreateTable
CREATE TABLE "public"."Supplier" (
    "id" SERIAL NOT NULL,
    "company" TEXT,
    "code" TEXT,
    "names" TEXT,
    "tel" TEXT,
    "leartime" INTEGER,
    "idcode" TEXT,
    "address" TEXT,
    "statuss" TEXT,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);
