-- ตัวช่วยฉลากยา (Label Helper) - แม่แบบฉลากช่วยที่ผู้ใช้สร้างเอง พร้อมตัวหนา 6 บรรทัด, QR และบาร์โค้ด
CREATE TABLE "LabelHelper" (
    "id" SERIAL NOT NULL,
    "company" TEXT,
    "name" TEXT DEFAULT '',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "suspended" BOOLEAN NOT NULL DEFAULT false,
    "paperSize" TEXT DEFAULT '80x50',
    "labelStyle" TEXT DEFAULT 'current',
    "line1" TEXT DEFAULT '',
    "line1On" BOOLEAN NOT NULL DEFAULT true,
    "line2" TEXT DEFAULT '',
    "line2On" BOOLEAN NOT NULL DEFAULT true,
    "line3" TEXT DEFAULT '',
    "line3On" BOOLEAN NOT NULL DEFAULT true,
    "line4" TEXT DEFAULT '',
    "line4On" BOOLEAN NOT NULL DEFAULT true,
    "line5" TEXT DEFAULT '',
    "line5On" BOOLEAN NOT NULL DEFAULT true,
    "line6" TEXT DEFAULT '',
    "line6On" BOOLEAN NOT NULL DEFAULT true,
    "url" TEXT DEFAULT '',
    "showBarcode" BOOLEAN NOT NULL DEFAULT false,
    "barcode" TEXT DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LabelHelper_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LabelHelper_company_idx" ON "LabelHelper"("company");
