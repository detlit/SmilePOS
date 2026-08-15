/*
  Warnings:

  - Added the required column `id_company` to the `SettingEmployee` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SettingEmployee" ADD COLUMN     "id_company" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "SettingEmployee" ADD CONSTRAINT "SettingEmployee_id_company_fkey" FOREIGN KEY ("id_company") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
