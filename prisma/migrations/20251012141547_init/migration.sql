-- CreateTable
CREATE TABLE "public"."Label_language" (
    "id" SERIAL NOT NULL,
    "list" TEXT,
    "list_lo" TEXT DEFAULT '',
    "list_my" TEXT DEFAULT '',
    "list_km" TEXT DEFAULT '',
    "list_zh" TEXT DEFAULT '',
    "list_eng" TEXT DEFAULT '',

    CONSTRAINT "Label_language_pkey" PRIMARY KEY ("id")
);
