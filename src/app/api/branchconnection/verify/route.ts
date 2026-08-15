import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// POST: ตรวจสอบ email และ password ของสาขาปลายทาง (สำหรับ preview ก่อนเชื่อม)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json(
                { error: "email and password are required" },
                { status: 400 }
            );
        }

        // ค้นหา user ปลายทางจาก email
        const targetUser = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                company: true,
                email: true,
                name: true,
                password: true
            }
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

        // ส่งข้อมูลสาขา (ไม่รวม password)
        return NextResponse.json({
            id: targetUser.id,
            company: targetUser.company,
            email: targetUser.email,
            name: targetUser.name,
            verified: true
        });
    } catch (error) {
        console.error("Error verifying branch:", error);
        return NextResponse.json(
            { error: "Failed to verify branch" },
            { status: 500 }
        );
    }
}
