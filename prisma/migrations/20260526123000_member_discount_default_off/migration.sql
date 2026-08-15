ALTER TABLE "public"."Settingpoint"
ALTER COLUMN "memberDiscountEnabled" SET DEFAULT false;

UPDATE "public"."Settingpoint"
SET "memberDiscountEnabled" = false
WHERE "memberDiscountEnabled" = true;