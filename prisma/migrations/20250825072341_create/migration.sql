/*
  Warnings:

  - You are about to drop the column `id_main` on the `SaleMain` table. All the data in the column will be lost.
  - Added the required column `id_salemain` to the `Sale` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Sale" ADD COLUMN     "id_salemain" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "public"."SaleMain" DROP COLUMN "id_main";

-- AddForeignKey
ALTER TABLE "public"."Sale" ADD CONSTRAINT "Sale_id_salemain_fkey" FOREIGN KEY ("id_salemain") REFERENCES "public"."SaleMain"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
