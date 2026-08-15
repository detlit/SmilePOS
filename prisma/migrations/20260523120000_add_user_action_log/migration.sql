-- CreateTable
CREATE TABLE "UserActionLog" (
    "id" SERIAL NOT NULL,
    "company" TEXT,
    "personId" INTEGER,
    "personName" TEXT DEFAULT 'ไม่ทราบผู้ใช้',
    "actionType" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "entityCode" TEXT,
    "route" TEXT,
    "buttonLabel" TEXT,
    "status" TEXT NOT NULL DEFAULT 'success',
    "message" TEXT,
    "errorMessage" TEXT,
    "metadata" JSONB,
    "durationMs" INTEGER,
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserActionLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserActionLog_company_createdAt_idx" ON "UserActionLog"("company", "createdAt");

-- CreateIndex
CREATE INDEX "UserActionLog_company_personName_createdAt_idx" ON "UserActionLog"("company", "personName", "createdAt");

-- CreateIndex
CREATE INDEX "UserActionLog_company_actionType_createdAt_idx" ON "UserActionLog"("company", "actionType", "createdAt");

-- CreateIndex
CREATE INDEX "UserActionLog_company_entityType_entityId_idx" ON "UserActionLog"("company", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "UserActionLog_company_status_createdAt_idx" ON "UserActionLog"("company", "status", "createdAt");
