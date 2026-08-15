import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

// POST: Proxy employee fetch to remote tunnel (avoids CORS)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { tunnelUrl, apiToken, id_company, company } = body;

        if (!tunnelUrl) {
            return NextResponse.json({ error: "tunnelUrl is required" }, { status: 400 });
        }

        // Build query params
        const params = new URLSearchParams();
        if (id_company) params.set("id_company", String(id_company));
        if (company) params.set("company", company);

        const url = `${tunnelUrl}/api/setting/employee${params.toString() ? '?' + params.toString() : ''}`;

        const res = await axios.get(url, {
            headers: apiToken ? { Authorization: `Bearer ${apiToken}` } : {},
            timeout: 10000,
        });

        return NextResponse.json(res.data);
    } catch (error: any) {
        console.error("Remote employee proxy error:", error?.message || error);
        return NextResponse.json(
            { error: "Failed to fetch remote employees", detail: error?.message || "" },
            { status: 502 }
        );
    }
}
