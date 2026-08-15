-- CreateTable
CREATE TABLE "public"."Indicator" (
    "id" SERIAL NOT NULL,
    "list" TEXT,
    "company" TEXT,

    CONSTRAINT "Indicator_pkey" PRIMARY KEY ("id")
);
