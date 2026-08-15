-- CreateTable
CREATE TABLE "CheckinSet" (
    "id" SERIAL NOT NULL,
    "idcompany" TEXT DEFAULT '',
    "radius" DOUBLE PRECISION DEFAULT 100,
    "latitude" DOUBLE PRECISION DEFAULT 0,
    "longitude" DOUBLE PRECISION DEFAULT 0,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CheckinSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Checkstock" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "month" TEXT DEFAULT '',
    "idcompany" TEXT DEFAULT '',
    "id_product" INTEGER,
    "name_product" TEXT DEFAULT '',
    "balance" DOUBLE PRECISION DEFAULT 0,
    "actual" DOUBLE PRECISION DEFAULT 0,
    "diff" DOUBLE PRECISION DEFAULT 0,
    "person" TEXT DEFAULT '',
    "status" TEXT DEFAULT '',

    CONSTRAINT "Checkstock_pkey" PRIMARY KEY ("id")
);
