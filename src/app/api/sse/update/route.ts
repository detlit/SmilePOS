import { NextRequest, NextResponse } from "next/server";
import { updateOrder, updateSummary } from "@/lib/sse";

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (body.order) updateOrder(body.order);
  if (body.summary) updateSummary(body.summary);

  return NextResponse.json({ message: "ok" });
}
