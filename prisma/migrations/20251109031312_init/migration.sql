/*
  Warnings:

  - You are about to drop the column `number` on the `Level` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Level" DROP COLUMN "number",
ADD COLUMN     "codename" TEXT DEFAULT '',
ADD COLUMN     "main" TEXT DEFAULT '',
ALTER COLUMN "list" SET DEFAULT '';
