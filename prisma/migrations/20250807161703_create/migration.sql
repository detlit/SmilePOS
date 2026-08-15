-- CreateTable
CREATE TABLE "public"."Group" (
    "id" SERIAL NOT NULL,
    "list" TEXT,
    "company" TEXT,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);
