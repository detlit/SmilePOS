-- CreateTable
CREATE TABLE "public"."SettingStore" (
    "id" SERIAL NOT NULL,
    "list" TEXT,
    "company" TEXT,
    "namestore" TEXT,
    "address" TEXT,
    "tel" TEXT,
    "lineid" TEXT,
    "taxnumber" TEXT,
    "publicId" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "version" TEXT NOT NULL,

    CONSTRAINT "SettingStore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SettingStore_namestore_key" ON "public"."SettingStore"("namestore");

-- CreateIndex
CREATE UNIQUE INDEX "SettingStore_publicId_key" ON "public"."SettingStore"("publicId");
