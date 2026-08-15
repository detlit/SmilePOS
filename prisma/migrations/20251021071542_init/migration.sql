-- CreateTable
CREATE TABLE "public"."DocMain" (
    "id" SERIAL NOT NULL,
    "createDate" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "id_costomer" INTEGER,
    "code_costomer" TEXT,
    "group_price" TEXT,
    "pay" TEXT,
    "bill" INTEGER,
    "discount" DOUBLE PRECISION,
    "sumtotal" DOUBLE PRECISION,
    "addreward" DOUBLE PRECISION,
    "usereward" DOUBLE PRECISION,
    "companyall" TEXT,
    "personall" TEXT,
    "statussall" TEXT,
    "totalall" DOUBLE PRECISION,
    "qt_number" TEXT,
    "qt_status" TEXT DEFAULT '',
    "qt_person" TEXT,
    "qt_remark" TEXT,
    "bl_number" TEXT,
    "bl_status" TEXT DEFAULT '',
    "bl_date" TIMESTAMP(3),
    "bl_credit" INTEGER,
    "bl_person" TEXT,
    "bl_remark" TEXT,
    "inv_number" TEXT,
    "inv_status" TEXT DEFAULT '',
    "inv_date" TIMESTAMP(3),
    "inv_credit" INTEGER,
    "inv_person" TEXT,
    "inv_remark" TEXT,
    "re_number" TEXT,
    "re_status" TEXT DEFAULT '',
    "re_date" TIMESTAMP(3),
    "re_credit" INTEGER,
    "re_person" TEXT,
    "re_remark" TEXT,

    CONSTRAINT "DocMain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DocDetail" (
    "id" SERIAL NOT NULL,
    "createDate" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "company" TEXT,
    "id_product" INTEGER,
    "code_product" TEXT,
    "name_product" TEXT,
    "cetagory" TEXT DEFAULT '',
    "unit" TEXT,
    "qty" DOUBLE PRECISION,
    "cost" DOUBLE PRECISION DEFAULT 0,
    "price" DOUBLE PRECISION,
    "discount" DOUBLE PRECISION DEFAULT 0,
    "total" DOUBLE PRECISION,
    "person" TEXT,
    "statuss" TEXT,
    "id_docmain" INTEGER NOT NULL,

    CONSTRAINT "DocDetail_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."DocDetail" ADD CONSTRAINT "DocDetail_id_docmain_fkey" FOREIGN KEY ("id_docmain") REFERENCES "public"."DocMain"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
