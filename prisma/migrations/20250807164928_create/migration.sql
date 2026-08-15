-- CreateTable
CREATE TABLE "public"."Type" (
    "id" SERIAL NOT NULL,
    "shortlist" TEXT,
    "list" TEXT,
    "company" TEXT,

    CONSTRAINT "Type_pkey" PRIMARY KEY ("id")
);
