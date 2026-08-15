import { NextRequest, NextResponse } from "next/server";

// POST: ตรวจสอบการเชื่อมต่อสาขา remote ผ่าน server-side (หลีกเลี่ยง CORS)
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { branches } = body; // [{ tunnelUrl, apiToken, remoteUserId, branchName, isRemote }]

        if (!branches || !Array.isArray(branches)) {
            return NextResponse.json({ error: "branches required" }, { status: 400 });
        }

        const results: { branchName: string; ok: boolean; error?: string }[] = [];

        for (const branch of branches) {
            if (branch.isRemote) {
                const cleanUrl = (branch.tunnelUrl || "").replace(/\/+$/, "");
                if (!cleanUrl) {
                    results.push({ branchName: branch.branchName, ok: false, error: "ไม่มี Tunnel URL" });
                    continue;
                }
                if (!branch.apiToken) {
                    results.push({ branchName: branch.branchName, ok: false, error: "ไม่มี apiToken" });
                    continue;
                }
                if (!branch.remoteUserId) {
                    results.push({ branchName: branch.branchName, ok: false, error: "ไม่มี remoteUserId" });
                    continue;
                }

                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 8000);
                    const res = await fetch(`${cleanUrl}/api/branchconnection/verify-token`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            apiToken: branch.apiToken,
                            userId: branch.remoteUserId,
                        }),
                        signal: controller.signal,
                    });
                    clearTimeout(timeoutId);

                    if (res.ok) {
                        const data = await res.json().catch(() => ({}));
                        if (data.userId && Number(data.userId) !== Number(branch.remoteUserId)) {
                            results.push({ branchName: branch.branchName, ok: false, error: "Token ไม่ตรงกับสาขาปลายทาง" });
                        } else {
                            results.push({ branchName: branch.branchName, ok: true });
                        }
                    } else if (res.status === 401) {
                        results.push({ branchName: branch.branchName, ok: false, error: "Token ไม่ถูกต้อง กรุณาเชื่อมสาขาใหม่" });
                    } else {
                        results.push({ branchName: branch.branchName, ok: false, error: `HTTP ${res.status}` });
                    }
                } catch (err: any) {
                    results.push({
                        branchName: branch.branchName,
                        ok: false,
                        error: err.name === "AbortError" ? "Timeout" : (err.message || "เชื่อมต่อไม่ได้"),
                    });
                }
            } else {
                // Local branch - always reachable (same server)
                results.push({ branchName: branch.branchName, ok: true });
            }
        }

        const allOk = results.every((r) => r.ok);
        const failed = results.filter((r) => !r.ok);

        return NextResponse.json({ allOk, results, failed });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Unknown error" }, { status: 500 });
    }
}
