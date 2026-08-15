-- AlterTable
ALTER TABLE "public"."History" ADD COLUMN     "duedate1" TIMESTAMP(3),
ADD COLUMN     "duedate2" TIMESTAMP(3),
ADD COLUMN     "followup1" TEXT DEFAULT '',
ADD COLUMN     "followup2" TEXT DEFAULT '',
ADD COLUMN     "solution1" TEXT DEFAULT '',
ADD COLUMN     "solution2" TEXT DEFAULT '';
