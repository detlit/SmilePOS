-- CreateTable
CREATE TABLE "CheckinFace" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "faceDescriptor" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CheckinFace_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CheckinFace_employeeId_key" ON "CheckinFace"("employeeId");

-- AddForeignKey
ALTER TABLE "CheckinFace" ADD CONSTRAINT "CheckinFace_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "SettingEmployee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
