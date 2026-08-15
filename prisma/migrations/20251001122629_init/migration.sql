-- CreateTable
CREATE TABLE "public"."Promotion" (
    "id" SERIAL NOT NULL,
    "company" TEXT,
    "name_promotion" TEXT,
    "customer" TEXT,
    "conditionid" INTEGER,
    "condition" TEXT,
    "startdate" TIMESTAMP(3),
    "enddate" TIMESTAMP(3),
    "unit" TEXT,
    "pay_condition" INTEGER,
    "discount" INTEGER,
    "status" TEXT,
    "person" TEXT,

    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);
