import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ txId: string }> }
) {
  try {
    const { txId } = await params

    if (!txId) {
      return NextResponse.json({ error: "txId is required" }, { status: 400 })
    }

    const transaction = await (prisma as any).paymentTransaction.findUnique({
      where: { txId },
    })

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    // Check if expired
    if (
      transaction.status === "pending" &&
      transaction.expiresAt &&
      new Date() > new Date(transaction.expiresAt)
    ) {
      await (prisma as any).paymentTransaction.update({
        where: { txId },
        data: { status: "expired" },
      })
      transaction.status = "expired"
    }

    return NextResponse.json({
      txId: transaction.txId,
      status: transaction.status,
      provider: transaction.provider,
      amount: transaction.amount,
      paidAt: transaction.paidAt,
      expiresAt: transaction.expiresAt,
    })
  } catch (error: any) {
    console.error("check-status error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
