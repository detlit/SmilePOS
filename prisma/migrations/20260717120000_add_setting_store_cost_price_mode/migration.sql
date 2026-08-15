ALTER TABLE "public"."SettingStore"
ADD COLUMN IF NOT EXISTS "costPriceMode" TEXT DEFAULT 'latest';
