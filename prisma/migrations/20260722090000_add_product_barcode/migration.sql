-- บาร์โค้ดสำรอง (alias) ของสินค้า — หนึ่งสินค้า/หนึ่งหน่วยขาย มีได้หลายบาร์โค้ด
--
-- ตารางนี้เป็นดัชนีสำหรับ "ค้นหา/สแกน" เท่านั้น ไม่แตะข้อมูลธุรกรรม:
-- เอกสารรับ/ขาย/โอน/ปรับยอด ยังบันทึก Datalist.Barcode (บาร์โค้ดหลัก) เหมือนเดิม
-- จึงไม่กระทบยอดคงเหลือและยอดสะสมใด ๆ
--
-- เขียนแบบ idempotent (IF NOT EXISTS) เพราะเครื่องลูกค้าอาจ restore ฐานข้อมูลเก่าทับ
-- แล้วบูตใหม่ — src/lib/selfHeal.ts จะรัน DDL ชุดเดียวกันนี้ซ้ำได้เสมอ

CREATE TABLE IF NOT EXISTS "ProductBarcode" (
    "id"          SERIAL PRIMARY KEY,
    "company"     TEXT,
    "productCode" TEXT NOT NULL,
    "productId"   INTEGER,
    "barcode"     TEXT NOT NULL,
    "note"        TEXT DEFAULT '',
    "isActive"    BOOLEAN NOT NULL DEFAULT true,
    "createdBy"   TEXT DEFAULT '',
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- บาร์โค้ดหนึ่งตัวชี้ได้สินค้าเดียวต่อบริษัท (กันสแกนแล้วกำกวม)
CREATE UNIQUE INDEX IF NOT EXISTS "ProductBarcode_company_barcode_key"
    ON "ProductBarcode" ("company", "barcode");

CREATE INDEX IF NOT EXISTS "ProductBarcode_company_productCode_idx"
    ON "ProductBarcode" ("company", "productCode");

CREATE INDEX IF NOT EXISTS "ProductBarcode_company_isActive_idx"
    ON "ProductBarcode" ("company", "isActive");
