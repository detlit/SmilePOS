/*
  Warnings:

  - A unique constraint covering the columns `[pic]` on the table `Datalist` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Datalist" ADD COLUMN     "pic" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Datalist_pic_key" ON "Datalist"("pic");
