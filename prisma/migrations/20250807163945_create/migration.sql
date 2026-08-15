-- CreateTable
CREATE TABLE "public"."Fixname" (
    "id" SERIAL NOT NULL,
    "shortlist" TEXT,
    "list" TEXT,
    "company" TEXT,

    CONSTRAINT "Fixname_pkey" PRIMARY KEY ("id")
);
