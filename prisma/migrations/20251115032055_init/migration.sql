/*
  Warnings:

  - You are about to drop the column `code` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `dept` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `position` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `username` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Company` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "public"."User_code_key";

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "code",
DROP COLUMN "dept",
DROP COLUMN "position",
DROP COLUMN "username",
ADD COLUMN     "company" TEXT,
ADD COLUMN     "enddate" TIMESTAMP(3),
ADD COLUMN     "lineid" TEXT,
ADD COLUMN     "status" TEXT,
ADD COLUMN     "tel" TEXT,
ALTER COLUMN "level" SET DATA TYPE TEXT;

-- DropTable
DROP TABLE "public"."Company";
