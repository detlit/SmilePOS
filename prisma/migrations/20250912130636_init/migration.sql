-- CreateTable
CREATE TABLE "public"."Methodlist" (
    "id" SERIAL NOT NULL,
    "company" TEXT,
    "list" TEXT,
    "qty" TEXT,
    "unit" TEXT,
    "fullname" TEXT,

    CONSTRAINT "Methodlist_pkey" PRIMARY KEY ("id")
);
