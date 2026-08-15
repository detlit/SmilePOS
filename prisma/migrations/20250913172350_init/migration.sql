-- CreateTable
CREATE TABLE "public"."Labeldata" (
    "id" SERIAL NOT NULL,
    "company" TEXT,
    "id_code" INTEGER,
    "code" TEXT,
    "ProductName" TEXT,
    "indicatorlistS" TEXT,
    "timeS" TEXT,
    "useS" TEXT,
    "timeuseS" TEXT,
    "keepS" TEXT,
    "remarkS" TEXT,

    CONSTRAINT "Labeldata_pkey" PRIMARY KEY ("id")
);
