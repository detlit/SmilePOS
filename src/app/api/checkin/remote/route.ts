import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

// POST: Proxy checkin fetch/create to remote tunnel (avoids CORS)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { tunnelUrl, apiToken, action, ...params } = body;

        if (!tunnelUrl) {
            return NextResponse.json({ error: "tunnelUrl is required" }, { status: 400 });
        }

        const headers: any = apiToken ? { Authorization: `Bearer ${apiToken}` } : {};

        if (action === "get") {
            // GET checkin records from remote
            const { idcompany, personId, month, year, sort } = params;
            const qp = new URLSearchParams();
            if (idcompany) qp.set("idcompany", idcompany);
            if (personId) qp.set("personId", String(personId));
            if (month) qp.set("month", month);
            if (year) qp.set("year", year);
            if (sort) qp.set("sort", sort);

            const res = await axios.get(`${tunnelUrl}/api/checkin?${qp.toString()}`, { headers, timeout: 10000 });
            return NextResponse.json(res.data);
        } else if (action === "create") {
            // POST new checkin record to remote
            const { data } = params;
            const res = await axios.post(`${tunnelUrl}/api/checkin`, data, { headers, timeout: 10000 });
            return NextResponse.json(res.data);
        } else if (action === "update") {
            // PUT update checkin record on remote
            const { recordId, data } = params;
            const res = await axios.put(`${tunnelUrl}/api/checkin/${recordId}`, data, { headers, timeout: 10000 });
            return NextResponse.json(res.data);
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } catch (error: any) {
        console.error("Remote checkin proxy error:", error?.message || error);
        return NextResponse.json(
            { error: "Failed to proxy remote checkin", detail: error?.message || "" },
            { status: 502 }
        );
    }
}
