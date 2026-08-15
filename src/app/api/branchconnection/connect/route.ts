import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

// POST: เชื่อมต่อสาขาด้วย Tunnel URL + Pairing Code (6 ตัว)
// Step 1: ยิง HTTP ไปสาขาปลายทางเพื่อ verify pairing code + สร้าง reverse connection
// Step 2: บันทึก connection ในฝั่งเรา พร้อมข้อมูลสาขาปลายทาง
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { fromUserId, tunnelUrl, pairingCode, branchName } = body;

        if (!fromUserId || !tunnelUrl || !pairingCode) {
            return NextResponse.json(
                { error: "กรุณากรอก Tunnel URL และ รหัสจับคู่" },
                { status: 400 }
            );
        }

        const cleanUrl = tunnelUrl.trim().replace(/\/+$/, "");
        const code = pairingCode.trim().toUpperCase();

        if (code.length !== 6) {
            return NextResponse.json(
                { error: "รหัสจับคู่ต้องเป็น 6 ตัวอักษร" },
                { status: 400 }
            );
        }

        // ตรวจสอบว่า Tunnel URL ไม่ใช่ของตัวเอง
        const currentUser = await prisma.user.findUnique({
            where: { id: parseInt(fromUserId) },
            select: { id: true, company: true, email: true, tunnelUrl: true, apiToken: true }
        });

        if (!currentUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const currentTunnelUrl = (currentUser.tunnelUrl || "").trim().replace(/\/+$/, "");

        if (!currentTunnelUrl) {
            return NextResponse.json(
                { error: "กรุณาตั้งค่า Tunnel URL ของสาขานี้ก่อนเชื่อมต่อ เพื่อให้สาขาปลายทางโอนกลับมาได้" },
                { status: 400 }
            );
        }

        let currentApiToken = (currentUser.apiToken || "").trim();
        if (!currentApiToken) {
            currentApiToken = crypto.randomBytes(48).toString("hex");
            await prisma.user.update({
                where: { id: parseInt(fromUserId) },
                data: { apiToken: currentApiToken }
            });
        }

        if (currentTunnelUrl === cleanUrl) {
            return NextResponse.json(
                { error: "ไม่สามารถเชื่อมกับสาขาตัวเองได้" },
                { status: 400 }
            );
        }

        // Step 1: ยิง HTTP ไปสาขาปลายทาง เพื่อ verify + สร้าง reverse connection
        let remoteData: any = null;
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);

            const acceptRes = await fetch(`${cleanUrl}/api/branchconnection/accept-pairing`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    pairingCode: code,
                    remoteTunnelUrl: currentTunnelUrl,
                    remoteCompany: currentUser.company || "",
                    remoteUserId: currentUser.id,
                    remoteApiToken: currentApiToken,
                }),
                signal: controller.signal,
            });
            clearTimeout(timeoutId);

            if (!acceptRes.ok) {
                const errBody = await acceptRes.json().catch(() => ({}));
                if (acceptRes.status === 401) {
                    return NextResponse.json(
                        { error: "รหัสจับคู่ไม่ถูกต้องหรือหมดอายุแล้ว กรุณาขอรหัสใหม่จากสาขาปลายทาง" },
                        { status: 401 }
                    );
                }
                return NextResponse.json(
                    { error: errBody.error || "ไม่สามารถเชื่อมต่อกับสาขาปลายทางได้" },
                    { status: acceptRes.status }
                );
            }

            remoteData = await acceptRes.json();
        } catch (fetchErr: any) {
            if (fetchErr.name === "AbortError") {
                return NextResponse.json(
                    { error: "สาขาปลายทางไม่ตอบสนอง (Timeout) กรุณาตรวจสอบว่าเปิดเครื่องและ Tunnel ทำงานอยู่" },
                    { status: 504 }
                );
            }
            return NextResponse.json(
                { error: `ไม่สามารถเชื่อมต่อสาขาปลายทางได้: ${fetchErr.message || "Connection failed"}` },
                { status: 502 }
            );
        }

        if (!remoteData || !remoteData.accepted) {
            return NextResponse.json(
                { error: "สาขาปลายทางปฏิเสธการเชื่อมต่อ" },
                { status: 401 }
            );
        }

        if (!remoteData.userId || !remoteData.apiToken) {
            return NextResponse.json(
                { error: "สาขาปลายทางส่งข้อมูลเชื่อมต่อไม่ครบ กรุณาอัปเดตโปรแกรมปลายทางแล้วเชื่อมสาขาใหม่" },
                { status: 502 }
            );
        }

        // Step 2: บันทึก connection ในฝั่งเรา พร้อมข้อมูลจากสาขาปลายทาง
        const existingConnection = await prisma.branchConnection.findFirst({
            where: {
                fromUserId: parseInt(fromUserId),
                tunnelUrl: cleanUrl,
            }
        });

        if (existingConnection) {
            const updated = await prisma.branchConnection.update({
                where: { id: existingConnection.id },
                data: {
                    branchName: branchName?.trim() || remoteData.company || existingConnection.branchName || "",
                    apiToken: remoteData.apiToken,
                    remoteUserId: remoteData.userId || null,
                    remoteCompany: remoteData.company || null,
                    status: "accepted",
                    isOnline: true,
                    lastCheckedAt: new Date(),
                    respondedAt: new Date(),
                },
                include: {
                    fromUser: { select: { id: true, company: true, email: true, tunnelUrl: true } },
                }
            });

            return NextResponse.json({ ...updated, message: "อัปเดตการเชื่อมต่อเรียบร้อย" });
        }

        const newConnection = await prisma.branchConnection.create({
            data: {
                fromUserId: parseInt(fromUserId),
                tunnelUrl: cleanUrl,
                apiToken: remoteData.apiToken,
                branchName: branchName?.trim() || remoteData.company || "",
                remoteUserId: remoteData.userId || null,
                remoteCompany: remoteData.company || null,
                status: "accepted",
                isOnline: true,
                lastCheckedAt: new Date(),
                respondedAt: new Date(),
            },
            include: {
                fromUser: { select: { id: true, company: true, email: true, tunnelUrl: true } },
            }
        });

        return NextResponse.json(newConnection, { status: 201 });
    } catch (error) {
        console.error("Error connecting branch:", error);
        return NextResponse.json(
            { error: "Failed to connect branch" },
            { status: 500 }
        );
    }
}
