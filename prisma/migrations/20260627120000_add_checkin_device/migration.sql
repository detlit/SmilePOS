-- CreateTable
CREATE TABLE IF NOT EXISTS "CheckinDevice" (
    "id" SERIAL NOT NULL,
    "idcompany" TEXT DEFAULT '',
    "deviceId" TEXT NOT NULL,
    "name" TEXT DEFAULT '',
    "branch" TEXT DEFAULT '',
    "deviceType" TEXT DEFAULT 'Web',
    "status" TEXT DEFAULT 'active',
    "registeredBy" TEXT DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CheckinDevice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "CheckinDevice_deviceId_key" ON "CheckinDevice"("deviceId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CheckinDevice_idcompany_idx" ON "CheckinDevice"("idcompany");
