ALTER TABLE "public"."Settingpayment"
ALTER COLUMN "bookbankno" TYPE TEXT USING CASE
  WHEN "bookbankno" IS NULL THEN NULL
  ELSE "bookbankno"::TEXT
END,
ALTER COLUMN "promtpayno" TYPE TEXT USING CASE
  WHEN "promtpayno" IS NULL THEN NULL
  ELSE "promtpayno"::TEXT
END;