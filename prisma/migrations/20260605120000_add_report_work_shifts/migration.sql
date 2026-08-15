CREATE TABLE IF NOT EXISTS "ReportWorkShift" (
  "id" SERIAL PRIMARY KEY,
  "company" TEXT NOT NULL,
  "shiftKey" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "ReportWorkShift_company_shiftKey_key" ON "ReportWorkShift"("company", "shiftKey");
CREATE INDEX IF NOT EXISTS "ReportWorkShift_company_sortOrder_idx" ON "ReportWorkShift"("company", "sortOrder");