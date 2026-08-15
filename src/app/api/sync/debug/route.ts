import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Debug endpoint สำหรับตรวจสอบข้อมูล sync
export async function GET(request: NextRequest) {
    const searchParam = request.nextUrl.searchParams;
    const company = searchParam.get("company") || "";
    const userId = searchParam.get("userId") || "";

    try {
        // นับจำนวน records ในแต่ละ table ตาม company
        const datalistCount = await prisma.datalist.count({ where: { company } });
        const supplierCount = await prisma.supplier.count({ where: { company } });
        const labeldataCount = await prisma.labeldata.count({ where: { company } });

        // ดึง distinct company values จาก datalist (ดูว่ามีค่าอะไรบ้าง)
        const distinctCompanies = await prisma.datalist.findMany({
            select: { company: true },
            distinct: ['company'],
            take: 20,
        });

        // ตรวจสอบ branch connections
        let connections: any[] = [];
        if (userId) {
            connections = await prisma.branchConnection.findMany({
                where: { fromUserId: parseInt(userId), status: "accepted" },
                select: {
                    id: true,
                    tunnelUrl: true,
                    apiToken: true,
                    remoteUserId: true,
                    branchName: true,
                    remoteCompany: true,
                    isOnline: true,
                }
            });
        }

        // ดึง User info
        let userInfo = null;
        if (userId) {
            userInfo = await prisma.user.findUnique({
                where: { id: parseInt(userId) },
                select: { id: true, company: true, email: true, apiToken: true, tunnelUrl: true }
            });
        }

        return NextResponse.json({
            queryCompany: company,
            queryUserId: userId,
            counts: {
                datalist: datalistCount,
                supplier: supplierCount,
                labeldata: labeldataCount,
            },
            distinctCompanyValues: distinctCompanies.map(d => d.company),
            connections,
            userInfo: userInfo ? { ...userInfo, apiToken: userInfo.apiToken ? `${userInfo.apiToken.substring(0, 8)}...` : null } : null,
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
