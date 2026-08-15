-- CreateTable
CREATE TABLE "ConfirmRC" (
    "id" SERIAL NOT NULL,
    "company" TEXT,
    "receiveId" INTEGER NOT NULL,
    "status" TEXT DEFAULT 'confirmed',
    "confirmedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "confirmedBy" TEXT DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfirmRC_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConfirmRC_receiveId_key" ON "ConfirmRC"("receiveId");

-- CreateIndex
CREATE INDEX "ConfirmRC_company_status_idx" ON "ConfirmRC"("company", "status");

-- AddForeignKey
ALTER TABLE "ConfirmRC" ADD CONSTRAINT "ConfirmRC_receiveId_fkey" FOREIGN KEY ("receiveId") REFERENCES "Receive"("id") ON DELETE CASCADE ON UPDATE CASCADE;