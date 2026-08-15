-- CreateTable
CREATE TABLE "public"."TimeL" (
    "id" SERIAL NOT NULL,
    "list" TEXT,
    "company" TEXT,

    CONSTRAINT "TimeL_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UseL" (
    "id" SERIAL NOT NULL,
    "list" TEXT,
    "company" TEXT,

    CONSTRAINT "UseL_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TimeUseL" (
    "id" SERIAL NOT NULL,
    "list" TEXT,
    "company" TEXT,

    CONSTRAINT "TimeUseL_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."KeepL" (
    "id" SERIAL NOT NULL,
    "list" TEXT,
    "company" TEXT,

    CONSTRAINT "KeepL_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RemarkL" (
    "id" SERIAL NOT NULL,
    "list" TEXT,
    "company" TEXT,

    CONSTRAINT "RemarkL_pkey" PRIMARY KEY ("id")
);
