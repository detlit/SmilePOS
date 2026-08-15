ALTER TABLE "public"."SettingStore"
ADD COLUMN IF NOT EXISTS "expiryColorRules" TEXT DEFAULT '[]';