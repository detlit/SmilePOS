import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import generatePayload from "promptpay-qr"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { company, provider, amount, saleId } = body

    if (!provider || !amount) {
      return NextResponse.json({ error: "provider and amount are required" }, { status: 400 })
    }

    // Fetch provider config
    const providerConfig = await (prisma as any).paymentProvider.findFirst({
      where: { company, provider, enabled: true },
    })

    if (!providerConfig) {
      return NextResponse.json({ error: `Provider "${provider}" is not enabled` }, { status: 404 })
    }

    // Create transaction record
    const transaction = await (prisma as any).paymentTransaction.create({
      data: {
        company,
        provider,
        amount: Number(amount),
        status: "pending",
        saleId: saleId || null,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 min expiry
      },
    })

    // Route based on provider
    let qrData: string | null = null
    let qrImageUrl: string | null = null
    let message: string | null = null

    switch (provider) {
      case "promptpay": {
        // Auto-generate QR using promptpay-qr lib
        const promptPayId = providerConfig.accountId || ""
        if (!promptPayId) {
          return NextResponse.json({ error: "PromptPay ID not configured" }, { status: 400 })
        }
        qrData = generatePayload(promptPayId, { amount: Number(amount) })

        // Save QR payload to transaction
        await (prisma as any).paymentTransaction.update({
          where: { id: transaction.id },
          data: { qrPayload: qrData },
        })
        break
      }

      case "edc": {
        message = "กรุณารูดบัตร"
        break
      }

      default: {
        // maemanee, kshop, alipay, wechat, truemoney
        if (providerConfig.apiKey) {
          // TODO: Call provider API when API keys are available
          // For now, fall back to static QR
          qrImageUrl = providerConfig.qrImageUrl || null
          message = providerConfig.apiKey ? "API integration pending" : null
        } else {
          // Fallback: use static QR image
          qrImageUrl = providerConfig.qrImageUrl || null
        }
        break
      }
    }

    return NextResponse.json({
      txId: transaction.txId,
      status: transaction.status,
      provider,
      amount: Number(amount),
      qrData,
      qrImageUrl,
      message,
      expiresAt: transaction.expiresAt,
    })
  } catch (error: any) {
    console.error("create-payment error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
