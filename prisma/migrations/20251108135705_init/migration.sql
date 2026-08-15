-- CreateTable
CREATE TABLE "public"."Level" (
    "id" SERIAL NOT NULL,
    "company" TEXT,
    "number" INTEGER,
    "list" TEXT,
    "level1" TEXT,
    "level2" TEXT,
    "level3" TEXT,

    CONSTRAINT "Level_pkey" PRIMARY KEY ("id")
);
