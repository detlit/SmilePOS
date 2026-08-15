-- AlterTable
ALTER TABLE "RCitemlist" ADD COLUMN     "subtype" TEXT DEFAULT '',
ALTER COLUMN "type" SET DEFAULT '';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "numdate" INTEGER DEFAULT 30,
ADD COLUMN     "package" TEXT DEFAULT 'Free',
ALTER COLUMN "status" SET DEFAULT 'Active';

-- CreateTable
CREATE TABLE "StockTransaction" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER,
    "inventory_lot_id" INTEGER,
    "itemcode" TEXT,
    "itemName" TEXT,
    "lot" TEXT,
    "dateExp" TIMESTAMP(3),
    "quantity_change" DOUBLE PRECISION,
    "balance_after" DOUBLE PRECISION,
    "transaction_type" TEXT,
    "createDate" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "company" TEXT,
    "person" TEXT,
    "receiverCompany" TEXT,
    "receiverCompanyName" TEXT,

    CONSTRAINT "StockTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderMain" (
    "id" SERIAL NOT NULL,
    "createDate" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "company" TEXT,
    "orderNo" TEXT DEFAULT '',
    "orderfull" TEXT DEFAULT '',
    "supplierId" INTEGER,
    "supplierCode" TEXT,
    "supplierName" TEXT,
    "totalAmount" DOUBLE PRECISION DEFAULT 0,
    "status" TEXT DEFAULT 'Pending',
    "person" TEXT,
    "remark" TEXT,

    CONSTRAINT "OrderMain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderDetail" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "itemcode" TEXT,
    "itemName" TEXT,
    "qty" DOUBLE PRECISION,
    "unit" TEXT DEFAULT '',
    "cost" DOUBLE PRECISION DEFAULT 0,
    "total" DOUBLE PRECISION DEFAULT 0,
    "status" TEXT DEFAULT 'Pending',

    CONSTRAINT "OrderDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncentiveSetting" (
    "id" SERIAL NOT NULL,
    "company" TEXT,
    "targetMonthly" DOUBLE PRECISION DEFAULT 300000,
    "targetMonthlyBonus" DOUBLE PRECISION DEFAULT 1000,
    "targetDaysOver" DOUBLE PRECISION DEFAULT 13,
    "targetDaysOverBonus" DOUBLE PRECISION DEFAULT 750,
    "targetAmountOver" DOUBLE PRECISION DEFAULT 10000,
    "targetAmountOverBonus" DOUBLE PRECISION DEFAULT 0,
    "targetDaily" DOUBLE PRECISION DEFAULT 12000,
    "targetDailyBonus" DOUBLE PRECISION DEFAULT 80,
    "pickupFeeRate" DOUBLE PRECISION DEFAULT 0.5,
    "pickupFeeBonus" DOUBLE PRECISION DEFAULT 0,
    "salesPerBillTarget" DOUBLE PRECISION DEFAULT 120,
    "salesPerBillBonus" DOUBLE PRECISION DEFAULT 20,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "IncentiveSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BranchConnection" (
    "id" SERIAL NOT NULL,
    "fromUserId" INTEGER NOT NULL,
    "toUserId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "BranchConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockTransfer" (
    "id" SERIAL NOT NULL,
    "transferNo" TEXT,
    "fromUserId" INTEGER NOT NULL,
    "toUserId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "person" TEXT,
    "remark" TEXT,

    CONSTRAINT "StockTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockTransferItem" (
    "id" SERIAL NOT NULL,
    "transferId" INTEGER NOT NULL,
    "itemcode" TEXT,
    "itemName" TEXT,
    "lotId" INTEGER,
    "lot" TEXT,
    "dateExp" TIMESTAMP(3),
    "qty" DOUBLE PRECISION,
    "cost" DOUBLE PRECISION,

    CONSTRAINT "StockTransferItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BranchConnection_fromUserId_toUserId_key" ON "BranchConnection"("fromUserId", "toUserId");

-- AddForeignKey
ALTER TABLE "OrderDetail" ADD CONSTRAINT "OrderDetail_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "OrderMain"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchConnection" ADD CONSTRAINT "BranchConnection_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchConnection" ADD CONSTRAINT "BranchConnection_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransferItem" ADD CONSTRAINT "StockTransferItem_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "StockTransfer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
