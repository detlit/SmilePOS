-- Add fields for ใบส่งสินค้า (Delivery Note) document type
ALTER TABLE "DocMain" ADD COLUMN "dn_date" TIMESTAMP(3);
ALTER TABLE "DocMain" ADD COLUMN "dn_enddate" TIMESTAMP(3);
ALTER TABLE "DocMain" ADD COLUMN "dn_number" INTEGER;
ALTER TABLE "DocMain" ADD COLUMN "dn_orderNo" TEXT;
ALTER TABLE "DocMain" ADD COLUMN "dn_orderfull" TEXT;
ALTER TABLE "DocMain" ADD COLUMN "dn_status" TEXT;
ALTER TABLE "DocMain" ADD COLUMN "dn_credit" INTEGER;
ALTER TABLE "DocMain" ADD COLUMN "dn_person" TEXT;
ALTER TABLE "DocMain" ADD COLUMN "dn_remark" TEXT;
ALTER TABLE "DocMain" ADD COLUMN "dn_paytype" TEXT;
ALTER TABLE "DocMain" ADD COLUMN "dn_deposit" DOUBLE PRECISION;
ALTER TABLE "DocMain" ADD COLUMN "dn_balance" DOUBLE PRECISION;
