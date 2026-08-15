import { NextRequest, NextResponse } from "next/server";

// Proxy API สำหรับดึงข้อมูลยอดขายจากสาขา remote ผ่าน Tunnel (หลีกเลี่ยง CORS)
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const tunnelUrl = searchParams.get("tunnelUrl");
    const apiPath = searchParams.get("apiPath");
    const company = searchParams.get("company");
    const createDate = searchParams.get("createDate");

    if (!tunnelUrl || !apiPath) {
        return NextResponse.json({ error: "tunnelUrl and apiPath required" }, { status: 400 });
    }

    const cleanUrl = tunnelUrl.replace(/\/+$/, "");
    const monthyear = searchParams.get("monthyear");
    const sort = searchParams.get("sort");

    const params = new URLSearchParams();
    if (company) params.set("company", company);
    if (createDate) params.set("createDate", createDate);
    if (monthyear) params.set("monthyear", monthyear);
    if (sort) params.set("sort", sort);

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);
        const res = await fetch(`${cleanUrl}${apiPath}?${params.toString()}`, {
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!res.ok) {
            return NextResponse.json({ error: `Remote API returned ${res.status}` }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error(`[BranchProxy] Error fetching ${apiPath} from ${cleanUrl}:`, error.message);
        return NextResponse.json({ error: error.message || "Failed to fetch remote data" }, { status: 502 });
    }
}
