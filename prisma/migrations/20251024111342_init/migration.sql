-- AlterTable
ALTER TABLE "public"."DocMain" ADD COLUMN     "bl_enddate" TIMESTAMP(3),
ADD COLUMN     "inv_enddate" TIMESTAMP(3),
ADD COLUMN     "qt_credit" INTEGER,
ADD COLUMN     "qt_enddate" TIMESTAMP(3),
ADD COLUMN     "re_enddate" TIMESTAMP(3),
ALTER COLUMN "qt_status" DROP DEFAULT,
ALTER COLUMN "bl_status" DROP DEFAULT,
ALTER COLUMN "inv_status" DROP DEFAULT,
ALTER COLUMN "re_status" DROP DEFAULT;
