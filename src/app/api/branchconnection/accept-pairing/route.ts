import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

// POST: สาขาอื่นเรียกมาเพื่อแจ้งว่าเชื่อมต่อเข้ามาแล้ว
// ตรวจสอบ pairing code + สร้าง reverse connection ในฝั่งเรา
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { pairingCode, remoteTunnelUrl, remoteCompany, remoteUserId, remoteApiToken } = body;

        const incomingRemoteApiToken = (remoteApiToken || "").trim();

        if (!pairingCode || !remoteTunnelUrl || !remoteUserId || !incomingRemoteApiToken) {
            return NextResponse.json(
                { error: "pairingCode, remoteTunnelUrl, remoteUserId, and remoteApiToken are required" },
                { status: 400 }
            );
        }

        const code = pairingCode.trim().toUpperCase();

        // ค้นหา user ที่มี pairingCode ตรงกัน + ยังไม่หมดอายุ
        const localUser = await prisma.user.findFirst({
            where: {
                pairingCode: code,
                pairingCodeExpiresAt: { gte: new Date() }
            },
            select: {
                id: true,
                company: true,
                email: true,
                tunnelUrl: true,
                apiToken: true,
            }
        });

        if (!localUser) {
            return NextResponse.json(
                { error: "รหัสจับคู่ไม่ถูกต้องหรือหมดอายุแล้ว" },
                { status: 401 }
            );
        }

        let localApiToken = (localUser.apiToken || "").trim();
        if (!localApiToken) {
            localApiToken = crypto.randomBytes(48).toString("hex");
            await prisma.user.update({
                where: { id: localUser.id },
                data: { apiToken: localApiToken }
            });
        }

        const cleanRemoteUrl = remoteTunnelUrl.trim().replace(/\/+$/, "");

        // ตรวจสอบว่าเชื่อม URL นี้แล้วหรือยัง
        const existingConnection = await prisma.branchConnection.findFirst({
            where: {
                fromUserId: localUser.id,
                tunnelUrl: cleanRemoteUrl,
            }
        });

        if (existingConnection) {
            // อัปเดต connection เดิม — ใช้ apiToken ของฝั่งตรงข้าม (remote) เพื่อให้ sync กลับไปได้
            await prisma.branchConnection.update({
                where: { id: existingConnection.id },
                data: {
                    remoteUserId: remoteUserId || null,
                    remoteCompany: remoteCompany || null,
                    branchName: remoteCompany || existingConnection.branchName || "",
                    apiToken: incomingRemoteApiToken,
                    status: "accepted",
                    isOnline: true,
                    lastCheckedAt: new Date(),
                    respondedAt: new Date(),
                }
            });
        } else {
            // สร้าง reverse connection ใหม่ — apiToken ต้องเป็นของฝั่ง remote ไม่ใช่ local
            await prisma.branchConnection.create({
                data: {
                    fromUserId: localUser.id,
                    tunnelUrl: cleanRemoteUrl,
                    remoteUserId: remoteUserId || null,
                    remoteCompany: remoteCompany || null,
                    branchName: remoteCompany || "",
                    apiToken: incomingRemoteApiToken,
                    status: "accepted",
                    isOnline: true,
                    lastCheckedAt: new Date(),
                    respondedAt: new Date(),
                }
            });
        }

        // ส่งข้อมูลสาขาเรากลับไปให้ฝั่งที่เรียก
        return NextResponse.json({
            accepted: true,
            userId: localUser.id,
            company: localUser.company,
            email: localUser.email,
            tunnelUrl: localUser.tunnelUrl,
            apiToken: localApiToken,
        });
    } catch (error) {
        console.error("Error accepting pairing:", error);
        return NextResponse.json(
            { error: "Failed to accept pairing" },
            { status: 500 }
        );
    }
}
