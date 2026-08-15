ALTER TABLE "public"."SettingStore"
ADD COLUMN IF NOT EXISTS "blockNegativeStockSale" TEXT DEFAULT 'false';