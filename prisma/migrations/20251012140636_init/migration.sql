-- AlterTable
ALTER TABLE "public"."Indicator" ADD COLUMN     "list_eng" TEXT DEFAULT '',
ADD COLUMN     "list_km" TEXT DEFAULT '',
ADD COLUMN     "list_lo" TEXT DEFAULT '',
ADD COLUMN     "list_my" TEXT DEFAULT '',
ADD COLUMN     "list_zh" TEXT DEFAULT '';

-- AlterTable
ALTER TABLE "public"."KeepL" ADD COLUMN     "list_eng" TEXT DEFAULT '',
ADD COLUMN     "list_km" TEXT DEFAULT '',
ADD COLUMN     "list_lo" TEXT DEFAULT '',
ADD COLUMN     "list_my" TEXT DEFAULT '',
ADD COLUMN     "list_zh" TEXT DEFAULT '';

-- AlterTable
ALTER TABLE "public"."Methodlist" ADD COLUMN     "list_eng" TEXT DEFAULT '',
ADD COLUMN     "list_km" TEXT DEFAULT '',
ADD COLUMN     "list_lo" TEXT DEFAULT '',
ADD COLUMN     "list_my" TEXT DEFAULT '',
ADD COLUMN     "list_zh" TEXT DEFAULT '';

-- AlterTable
ALTER TABLE "public"."RemarkL" ADD COLUMN     "list_eng" TEXT DEFAULT '',
ADD COLUMN     "list_km" TEXT DEFAULT '',
ADD COLUMN     "list_lo" TEXT DEFAULT '',
ADD COLUMN     "list_my" TEXT DEFAULT '',
ADD COLUMN     "list_zh" TEXT DEFAULT '';

-- AlterTable
ALTER TABLE "public"."TimeL" ADD COLUMN     "list_eng" TEXT DEFAULT '',
ADD COLUMN     "list_km" TEXT DEFAULT '',
ADD COLUMN     "list_lo" TEXT DEFAULT '',
ADD COLUMN     "list_my" TEXT DEFAULT '',
ADD COLUMN     "list_zh" TEXT DEFAULT '';

-- AlterTable
ALTER TABLE "public"."TimeUseL" ADD COLUMN     "list_eng" TEXT DEFAULT '',
ADD COLUMN     "list_km" TEXT DEFAULT '',
ADD COLUMN     "list_lo" TEXT DEFAULT '',
ADD COLUMN     "list_my" TEXT DEFAULT '',
ADD COLUMN     "list_zh" TEXT DEFAULT '';

-- AlterTable
ALTER TABLE "public"."UseL" ADD COLUMN     "list_eng" TEXT DEFAULT '',
ADD COLUMN     "list_km" TEXT DEFAULT '',
ADD COLUMN     "list_lo" TEXT DEFAULT '',
ADD COLUMN     "list_my" TEXT DEFAULT '',
ADD COLUMN     "list_zh" TEXT DEFAULT '';
