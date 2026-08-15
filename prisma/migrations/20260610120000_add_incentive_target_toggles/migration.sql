-- Add enable/disable toggles for each bonus target group (default: enabled)
ALTER TABLE "IncentiveSetting" ADD COLUMN "enableTargetMonthly" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "IncentiveSetting" ADD COLUMN "enableTargetDaysOver" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "IncentiveSetting" ADD COLUMN "enableTargetDaily" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "IncentiveSetting" ADD COLUMN "enablePickupFee" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "IncentiveSetting" ADD COLUMN "enableSalesPerBill" BOOLEAN NOT NULL DEFAULT true;
