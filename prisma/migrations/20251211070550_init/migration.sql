-- CreateTable
CREATE TABLE "Checkin" (
    "id" SERIAL NOT NULL,
    "idcompany" TEXT DEFAULT '',
    "company" TEXT DEFAULT '',
    "personId" INTEGER DEFAULT 0,
    "person" TEXT DEFAULT '',
    "status" TEXT DEFAULT '',
    "checkin" TIMESTAMP(3),
    "checkout" TIMESTAMP(3),
    "checkinLat" DOUBLE PRECISION DEFAULT 0,
    "checkinLng" DOUBLE PRECISION DEFAULT 0,
    "checkoutLat" DOUBLE PRECISION DEFAULT 0,
    "checkoutLng" DOUBLE PRECISION DEFAULT 0,
    "gpsRadius" DOUBLE PRECISION DEFAULT 10,
    "targetLat" DOUBLE PRECISION DEFAULT 0,
    "targetLng" DOUBLE PRECISION DEFAULT 0,
    "approve" TEXT DEFAULT '',
    "approveDate" TIMESTAMP(3),
    "approvePerson" TEXT DEFAULT '',
    "remark" TEXT DEFAULT '',

    CONSTRAINT "Checkin_pkey" PRIMARY KEY ("id")
);
