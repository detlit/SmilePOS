/*
  Warnings:

  - You are about to drop the column `Dui` on the `Profile` table. All the data in the column will be lost.
  - You are about to drop the column `biograpy` on the `Profile` table. All the data in the column will be lost.
  - You are about to drop the column `jobTitle` on the `User` table. All the data in the column will be lost.
  - Added the required column `biography` to the `Profile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `level` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `username` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Profile" DROP COLUMN "Dui",
DROP COLUMN "biograpy",
ADD COLUMN     "biography" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "jobTitle",
ADD COLUMN     "companyId" INTEGER NOT NULL,
ADD COLUMN     "level" INTEGER NOT NULL,
ADD COLUMN     "password" VARCHAR(500) NOT NULL,
ADD COLUMN     "username" VARCHAR(500) NOT NULL;

-- CreateTable
CREATE TABLE "public"."Company" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(500) NOT NULL,
    "company" TEXT NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
