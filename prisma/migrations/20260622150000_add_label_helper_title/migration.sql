-- เพิ่มหัวข้อเรื่องให้ตัวช่วยฉลากยา
ALTER TABLE "LabelHelper" ADD COLUMN "title" TEXT DEFAULT '';
ALTER TABLE "LabelHelper" ADD COLUMN "titleOn" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "LabelHelper" ADD COLUMN "titleSize" INTEGER NOT NULL DEFAULT 14;
