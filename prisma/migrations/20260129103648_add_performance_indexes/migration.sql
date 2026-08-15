-- CreateIndex
CREATE INDEX "RCitemlist_company_dateRC_idx" ON "RCitemlist"("company", "dateRC");

-- CreateIndex
CREATE INDEX "Sale_company_statuss_createDate_idx" ON "Sale"("company", "statuss", "createDate");

-- CreateIndex
CREATE INDEX "SaleMain_companyall_statussall_createDate_idx" ON "SaleMain"("companyall", "statussall", "createDate");
