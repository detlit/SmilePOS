CREATE TABLE "public"."DrugSet" (
    "id" SERIAL NOT NULL,
    "company" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT DEFAULT '',
    "status" TEXT DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DrugSet_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."DrugSetItem" (
    "id" SERIAL NOT NULL,
    "drugSetId" INTEGER NOT NULL,
    "productId" INTEGER,
    "code" TEXT DEFAULT '',
    "name" TEXT DEFAULT '',
    "fixname" TEXT DEFAULT '',
    "drugGroup" TEXT DEFAULT '',
    "barcode" TEXT DEFAULT '',
    "unit" TEXT DEFAULT '',
    "qty" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "salePrice" DOUBLE PRECISION DEFAULT 0,
    "cost" DOUBLE PRECISION DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DrugSetItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DrugSet_company_name_idx" ON "public"."DrugSet"("company", "name");
CREATE INDEX "DrugSet_company_status_idx" ON "public"."DrugSet"("company", "status");
CREATE INDEX "DrugSetItem_drugSetId_idx" ON "public"."DrugSetItem"("drugSetId");
CREATE INDEX "DrugSetItem_productId_idx" ON "public"."DrugSetItem"("productId");
CREATE INDEX "DrugSetItem_code_idx" ON "public"."DrugSetItem"("code");

ALTER TABLE "public"."DrugSetItem" ADD CONSTRAINT "DrugSetItem_drugSetId_fkey" FOREIGN KEY ("drugSetId") REFERENCES "public"."DrugSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."DrugSetItem" ADD CONSTRAINT "DrugSetItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Datalist"("id") ON DELETE SET NULL ON UPDATE CASCADE;