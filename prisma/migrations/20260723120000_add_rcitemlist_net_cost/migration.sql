-- ทุนสุทธิต่อหน่วยย่อยหลังหักส่วนลดต่อบรรทัด (สูตร: src/lib/lotCost.ts)
-- nullable ล้วน ไม่มี default โดยตั้งใจ: null = "ยังไม่คำนวณ" ซึ่งตัวอ่านจะคำนวณสดให้เอง
-- และทำให้ prisma db push บนเครื่องลูกค้าไม่เห็น drift จนต้อง drop+recreate คอลัมน์
ALTER TABLE "public"."RCitemlist"
ADD COLUMN IF NOT EXISTS "netCost" DOUBLE PRECISION;
