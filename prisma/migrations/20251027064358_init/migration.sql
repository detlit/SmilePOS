-- AlterTable
ALTER TABLE "public"."Sale" ADD COLUMN     "gifts" DOUBLE PRECISION DEFAULT 0;

-- CreateTable
CREATE TABLE "public"."History" (
    "id" SERIAL NOT NULL,
    "createDate" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "company" TEXT,
    "behavior" TEXT,
    "Solution" TEXT,
    "duedate1" TIMESTAMP(3),
    "date_1" TIMESTAMP(3),
    "followup1" TEXT,
    "Solution1" TEXT,
    "person1" TEXT,
    "duedate2" TIMESTAMP(3),
    "date_2" TIMESTAMP(3),
    "followup2" TEXT,
    "Solution2" TEXT,
    "person2" TEXT,
    "duedate3" TIMESTAMP(3),
    "date_3" TIMESTAMP(3),
    "followup3" TEXT,
    "Solution3" TEXT,
    "person3" TEXT,
    "remark" TEXT,
    "id_salemain" INTEGER NOT NULL,

    CONSTRAINT "History_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."History" ADD CONSTRAINT "History_id_salemain_fkey" FOREIGN KEY ("id_salemain") REFERENCES "public"."SaleMain"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
