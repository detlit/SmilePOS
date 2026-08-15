-- AlterTable
ALTER TABLE "public"."DocMain" ADD COLUMN     "tax_credit" INTEGER,
ADD COLUMN     "tax_date" TIMESTAMP(3),
ADD COLUMN     "tax_enddate" TIMESTAMP(3),
ADD COLUMN     "tax_number" INTEGER,
ADD COLUMN     "tax_orderNo" TEXT,
ADD COLUMN     "tax_orderfull" TEXT,
ADD COLUMN     "tax_person" TEXT,
ADD COLUMN     "tax_remark" TEXT,
ADD COLUMN     "tax_status" TEXT,
ALTER COLUMN "bl_orderfull" DROP DEFAULT,
ALTER COLUMN "inv_orderfull" DROP DEFAULT,
ALTER COLUMN "qt_orderfull" DROP DEFAULT,
ALTER COLUMN "re_orderfull" DROP DEFAULT;
