-- CreateTable
CREATE TABLE "public"."Customer" (
    "id" SERIAL NOT NULL,
    "company" TEXT,
    "code" TEXT,
    "name" TEXT,
    "sex" TEXT,
    "idcode" INTEGER,
    "age" INTEGER,
    "birthday" TIMESTAMP(3),
    "address" TEXT,
    "branch" TEXT,
    "levelPrice" TEXT,
    "tel" TEXT,
    "pointStart" INTEGER,
    "point" INTEGER,
    "totalPoint" INTEGER,
    "customer" TEXT,
    "drugallergy" TEXT,
    "congenitalDisease" TEXT,
    "status" TEXT,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);
