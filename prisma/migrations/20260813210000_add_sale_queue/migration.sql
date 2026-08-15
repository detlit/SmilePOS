-- คิวรับสินค้าของหน้าขาย — 1 บิล = 1 คิว
--
-- ตารางนี้เป็น "สถานะการเตรียมของ" อย่างเดียว ไม่ใช่ข้อมูลธุรกรรม:
-- ยอดขาย/สต๊อก/แต้ม ยังอยู่ที่ SaleMain, Sale, History เหมือนเดิมทุกประการ
-- ลบตารางนี้ทิ้งก็ไม่กระทบยอดใด ๆ (เสียแค่ประวัติคิว)
--
-- เขียนแบบ idempotent (IF NOT EXISTS) ตามแนวเดียวกับ migration อื่นในโปรเจกต์
-- เพราะเครื่องลูกค้าอาจ restore ฐานข้อมูลเก่าทับแล้วบูตใหม่

CREATE TABLE IF NOT EXISTS "SaleQueue" (
    "id"          SERIAL PRIMARY KEY,
    "company"     TEXT NOT NULL,
    "branch"      TEXT DEFAULT '',
    "queueNo"     INTEGER NOT NULL,
    "queueDate"   TEXT NOT NULL,
    "orderNo"     TEXT,
    "id_salemain" INTEGER,
    "customer"    TEXT DEFAULT '',
    "seller"      TEXT DEFAULT '',
    "itemCount"   INTEGER NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "items"       JSONB,
    "status"      TEXT NOT NULL DEFAULT 'waiting',
    "note"        TEXT DEFAULT '',
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readyAt"     TIMESTAMP(3),
    "doneAt"      TIMESTAMP(3)
);

-- เลขคิวห้ามซ้ำภายในวันเดียวกันของบริษัทเดียวกัน
-- API อาศัย unique ตัวนี้ตัดสินตอนสองเครื่องกดชำระพร้อมกัน (ใครแพ้ได้ P2002 แล้ววนขอเลขใหม่)
CREATE UNIQUE INDEX IF NOT EXISTS "SaleQueue_company_queueDate_queueNo_key"
    ON "SaleQueue" ("company", "queueDate", "queueNo");

-- หนึ่งบิล (orderNo) มีได้คิวเดียว — กันคิวเบิ้ลเวลากดชำระซ้ำ/retry
-- NULL ใน Postgres ถือว่าไม่ซ้ำกัน จึงยังบันทึกคิวที่ไม่มี orderNo ได้หลายใบ
CREATE UNIQUE INDEX IF NOT EXISTS "SaleQueue_company_orderNo_key"
    ON "SaleQueue" ("company", "orderNo");

-- แผงสถานะคิวอ่านด้วย company + วันนี้ + สถานะที่ยังไม่จบ
CREATE INDEX IF NOT EXISTS "SaleQueue_company_queueDate_status_idx"
    ON "SaleQueue" ("company", "queueDate", "status");
