-- CreateTable
CREATE TABLE "public"."Receive" (
    "id" SERIAL NOT NULL,
    "company" TEXT,
    "code" TEXT,
    "names" TEXT,
    "invoice_No" TEXT,
    "order_date" TEXT,
    "receive_date" INTEGER,
    "tax_date" TEXT,
    "pay_date" TEXT,
    "statuss" TEXT,

    CONSTRAINT "Receive_pkey" PRIMARY KEY ("id")
);
