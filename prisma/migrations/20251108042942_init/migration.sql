-- CreateTable
CREATE TABLE "public"."Interaction" (
    "id" SERIAL NOT NULL,
    "company" TEXT,
    "fixname1" TEXT,
    "fixname2" TEXT,
    "status" TEXT,

    CONSTRAINT "Interaction_pkey" PRIMARY KEY ("id")
);
