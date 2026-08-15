import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// GET: ดึงรายการสาขาที่เชื่อมต่อ
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const userId = searchParams.get("userId");
        const type = searchParams.get("type"); // "from" หรือ "to" หรือ "all"

        if (!userId) {
            return NextResponse.json({ error: "userId is required" }, { status: 400 });
        }

        let whereClause: any = {};

        if (type === "from") {
            // สาขาที่เราเชื่อมไปหา
            whereClause.fromUserId = parseInt(userId);
        } else if (type === "to") {
            // สาขาที่เชื่อมมาหาเรา (คำขอที่รอดำเนินการ)
            whereClause.toUserId = parseInt(userId);
        } else {
            // ทั้งหมด
            whereClause.OR = [
                { fromUserId: parseInt(userId) },
                { toUserId: parseInt(userId) }
            ];
        }

        const connections = await prisma.branchConnection.findMany({
            where: whereClause,
            include: {
                fromUser: {
                    select: {
                        id: true,
                        company: true,
                        email: true,
                        name: true
                    }
                },
                toUser: {
                    select: {
                        id: true,
                        company: true,
                        email: true,
                        name: true
                    }
                }
            },
            orderBy: {
                requestedAt: "desc"
            }
        });

        // เสริมข้อมูล remote branch สำหรับ connection ที่ไม่มี toUser (remote)
        const enriched = connections.map((conn: any) => ({
            ...conn,
            displayName: conn.branchName || conn.toUser?.company || conn.remoteCompany || conn.tunnelUrl || "ไม่ทราบชื่อ",
        }));

        return NextResponse.json(enriched);
    } catch (error) {
        console.error("Error fetching connections:", error);
        return NextResponse.json(
            { error: "Failed to fetch connections" },
            { status: 500 }
        );
    }
}

// POST: สร้างคำขอเชื่อมสาขาใหม่ (ต้องยืนยัน email + password)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { fromUserId, email, password } = body;

        if (!fromUserId || !email || !password) {
            return NextResponse.json(
                { error: "fromUserId, email, and password are required" },
                { status: 400 }
            );
        }

        // ค้นหา user ปลายทางจาก email
        const targetUser = await prisma.user.findUnique({
            where: { email }
        });

        if (!targetUser) {
            return NextResponse.json(
                { error: "ไม่พบสาขาที่ต้องการเชื่อม" },
                { status: 404 }
            );
        }

        // ตรวจสอบรหัสผ่าน
        if (!targetUser.password) {
            return NextResponse.json(
                { error: "สาขาปลายทางไม่ได้ตั้งรหัสผ่าน" },
                { status: 400 }
            );
        }

        const isPasswordValid = await bcrypt.compare(password, targetUser.password);
        if (!isPasswordValid) {
            return NextResponse.json(
                { error: "รหัสผ่านไม่ถูกต้อง" },
                { status: 401 }
            );
        }

        // ตรวจสอบว่าเป็นสาขาเดียวกันหรือไม่
        if (fromUserId === targetUser.id) {
            return NextResponse.json(
                { error: "ไม่สามารถเชื่อมกับสาขาตัวเองได้" },
                { status: 400 }
            );
        }

        // ตรวจสอบว่าเชื่อมแล้วหรือยัง
        const existingConnection = await prisma.branchConnection.findFirst({
            where: {
                fromUserId: parseInt(fromUserId),
                toUserId: targetUser.id
            }
        });

        if (existingConnection) {
            return NextResponse.json(
                { error: "มีคำขอเชื่อมสาขานี้อยู่แล้ว", existing: existingConnection },
                { status: 409 }
            );
        }

        // สร้างคำขอเชื่อมใหม่
        const newConnection = await prisma.branchConnection.create({
            data: {
                fromUserId: parseInt(fromUserId),
                toUserId: targetUser.id,
                status: "pending"
            },
            include: {
                fromUser: {
                    select: { id: true, company: true, email: true }
                },
                toUser: {
                    select: { id: true, company: true, email: true }
                }
            }
        });

        return NextResponse.json(newConnection, { status: 201 });
    } catch (error) {
        console.error("Error creating connection:", error);
        return NextResponse.json(
            { error: "Failed to create connection" },
            { status: 500 }
        );
    }
}
