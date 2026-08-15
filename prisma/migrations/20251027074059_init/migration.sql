/*
  Warnings:

  - You are about to drop the column `Solution1` on the `History` table. All the data in the column will be lost.
  - You are about to drop the column `Solution2` on the `History` table. All the data in the column will be lost.
  - You are about to drop the column `Solution3` on the `History` table. All the data in the column will be lost.
  - You are about to drop the column `behavior` on the `History` table. All the data in the column will be lost.
  - You are about to drop the column `date_1` on the `History` table. All the data in the column will be lost.
  - You are about to drop the column `date_2` on the `History` table. All the data in the column will be lost.
  - You are about to drop the column `date_3` on the `History` table. All the data in the column will be lost.
  - You are about to drop the column `duedate1` on the `History` table. All the data in the column will be lost.
  - You are about to drop the column `duedate2` on the `History` table. All the data in the column will be lost.
  - You are about to drop the column `duedate3` on the `History` table. All the data in the column will be lost.
  - You are about to drop the column `followup1` on the `History` table. All the data in the column will be lost.
  - You are about to drop the column `followup2` on the `History` table. All the data in the column will be lost.
  - You are about to drop the column `followup3` on the `History` table. All the data in the column will be lost.
  - You are about to drop the column `person1` on the `History` table. All the data in the column will be lost.
  - You are about to drop the column `person2` on the `History` table. All the data in the column will be lost.
  - You are about to drop the column `person3` on the `History` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."History" DROP COLUMN "Solution1",
DROP COLUMN "Solution2",
DROP COLUMN "Solution3",
DROP COLUMN "behavior",
DROP COLUMN "date_1",
DROP COLUMN "date_2",
DROP COLUMN "date_3",
DROP COLUMN "duedate1",
DROP COLUMN "duedate2",
DROP COLUMN "duedate3",
DROP COLUMN "followup1",
DROP COLUMN "followup2",
DROP COLUMN "followup3",
DROP COLUMN "person1",
DROP COLUMN "person2",
DROP COLUMN "person3",
ADD COLUMN     "count" INTEGER,
ADD COLUMN     "date" TIMESTAMP(3),
ADD COLUMN     "duedate" TIMESTAMP(3),
ADD COLUMN     "followup" TEXT,
ADD COLUMN     "id_history" INTEGER,
ADD COLUMN     "person" TEXT,
ADD COLUMN     "statusH" TEXT;
