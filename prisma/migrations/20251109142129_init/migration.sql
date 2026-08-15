/*
  Warnings:

  - You are about to drop the column `codename` on the `Level` table. All the data in the column will be lost.
  - You are about to drop the column `company` on the `Level` table. All the data in the column will be lost.
  - You are about to drop the column `level1` on the `Level` table. All the data in the column will be lost.
  - You are about to drop the column `level2` on the `Level` table. All the data in the column will be lost.
  - You are about to drop the column `level3` on the `Level` table. All the data in the column will be lost.
  - You are about to drop the column `list` on the `Level` table. All the data in the column will be lost.
  - You are about to drop the column `main` on the `Level` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Level" DROP COLUMN "codename",
DROP COLUMN "company",
DROP COLUMN "level1",
DROP COLUMN "level2",
DROP COLUMN "level3",
DROP COLUMN "list",
DROP COLUMN "main";

-- CreateTable
CREATE TABLE "public"."MainLevel" (
    "id" SERIAL NOT NULL,
    "company" TEXT,
    "codename" TEXT DEFAULT '',
    "main" TEXT DEFAULT '',
    "list" TEXT DEFAULT '',
    "level1" TEXT DEFAULT '',
    "level2" TEXT DEFAULT '',
    "level3" TEXT DEFAULT '',
    "levelId" INTEGER NOT NULL,

    CONSTRAINT "MainLevel_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."MainLevel" ADD CONSTRAINT "MainLevel_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "public"."Level"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
