import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params
    const body = await req.json()

    // Log raw payload
    console.log(`[webhook/${provider}]`, JSON.stringify(body))

    // Extract reference from provider-specific payload
    let reference: string | null = null
    let amount: number | null = null
    let status: string = "success"

    switch (provider) {
      case "maemanee": {
        // SCB callback format (placeholder — adapt when real API available)
        reference = body.transactionId || body.reference || null
        amount = body.amount ? Number(body.amount) : null
        status = body.status === "success" ? "success" : "failed"
        break
      }
      case "kshop": {
        // KBank callback format (placeholder)
        reference = body.referenceNo || body.ref || null
        amount = body.amount ? Number(body.amount) : null
        status = body.resultCode === "00" ? "success" : "failed"
        break
      }
      case "alipay": {
        reference = body.trade_no || body.out_trade_no || null
        amount = body.total_amount ? Number(body.total_amount) : null
        status = body.trade_status === "TRADE_SUCCESS" ? "success" : "failed"
        break
      }
      case "wechat": {
        reference = body.transaction_id || body.out_trade_no || null
        amount = body.amount?.total ? Number(body.amount.total) / 100 : null
        status = body.trade_state === "SUCCESS" ? "success" : "failed"
        break
      }
      case "truemoney": {
        reference = body.transactionId || body.referenceId || null
        amount = body.amount ? Number(body.amount) : null
        status = body.status === "SUCCESS" ? "success" : "failed"
        break
      }
      default: {
        // Generic fallback
        reference = body.txId || body.reference || body.transactionId || null
        amount = body.amount ? Number(body.amount) : null
        status = "success"
      }
    }

    // Find transaction by reference or txId
    let transaction = null
    if (body.txId) {
      transaction = await (prisma as any).paymentTransaction.findUnique({
        where: { txId: body.txId },
      })
    }
    if (!transaction && reference) {
      transaction = await (prisma as any).paymentTransaction.findFirst({
        where: { reference, provider },
      })
    }

    if (transaction) {
      // Update existing transaction
      const updated = await (prisma as any).paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          status,
          paidAt: status === "success" ? new Date() : null,
          rawPayload: JSON.stringify(body),
          reference: reference || transaction.reference,
        },
      })

      // Broadcast SSE event on success
      if (status === "success") {
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
      }

      return NextResponse.json({ received: true, txId: updated.txId, status: updated.status })
    }

    // No matching transaction — log as orphan
    console.warn(`[webhook/${provider}] No matching transaction for reference: ${reference}`)
    return NextResponse.json({ received: true, matched: false }, { status: 200 })
  } catch (error: any) {
    console.error(`webhook error:`, error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
