import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { txId, company } = body

    if (!txId) {
      return NextResponse.json({ error: "txId is required" }, { status: 400 })
    }

    const transaction = await (prisma as any).paymentTransaction.findUnique({
      where: { txId },
    })

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    if (transaction.status === "success") {
      return NextResponse.json({ success: true, message: "Already confirmed", transaction })
    }

    // Update transaction to success
    const updated = await (prisma as any).paymentTransaction.update({
      where: { txId },
      data: {
        status: "success",
        paidAt: new Date(),
      },
    })

    // Broadcast SSE payment_success event
    try {
      await fetch(`${req.nextUrl.origin}/api/sse/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "payment_success",
          data: {
            txId: updated.txId,
            provider: updated.provider,
            amount: updated.amount,
            saleId: updated.saleId,
            paidAt: updated.paidAt,
          },
        }),
      })
    } catch (sseError) {
      console.error("SSE broadcast error:", sseError)
    }

    return NextResponse.json({ success: true, transaction: updated })
  } catch (error: any) {
    console.error("confirm error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
