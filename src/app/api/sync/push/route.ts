import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const BATCH_SIZE = 500;

// POST: สาขาหลัก push ข้อมูลไปยังสาขาย่อย
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { company, userId, targetBranches, types, productSyncOptions = {} } = body;
        const normalizedProductSyncOptions = normalizeProductSyncOptions(productSyncOptions);

        if (!company || !userId) {
            return NextResponse.json({ error: "company and userId are required" }, { status: 400 });
        }

        if (!types || !Array.isArray(types) || types.length === 0) {
            return NextResponse.json({ error: "types[] is required" }, { status: 400 });
        }

        // ดึง branch connections ที่ accepted
        let connections = await prisma.branchConnection.findMany({
            where: { fromUserId: parseInt(userId), status: "accepted" }
        });

        // ถ้าระบุ targetBranches → filter เฉพาะที่เลือก
        if (targetBranches && Array.isArray(targetBranches) && targetBranches.length > 0) {
            connections = connections.filter(c => targetBranches.includes(c.tunnelUrl));
        }

        if (connections.length === 0) {
            return NextResponse.json({ error: "ไม่พบสาขาที่เชื่อมต่อ" }, { status: 404 });
        }

        // ดึงข้อมูลจาก DB ของสาขาหลัก
        const dataToSync: Record<string, any> = {};
        const fetchedCounts: Record<string, number> = {};

        console.log(`[SyncPush] company="${company}", userId=${userId}, types=${types.join(",")}, targetBranches=${targetBranches?.length || "all"}`);

        for (const type of types) {
            switch (type) {
                case "datalist":
                    dataToSync.datalist = await fetchDatalistWithConversions(company);
                    fetchedCounts.datalist = dataToSync.datalist.length;
                    break;
                case "labeldata":
                    dataToSync.labeldata = await fetchLabeldataWithMasters(company);
                    fetchedCounts.labeldata = dataToSync.labeldata[0]?.labels?.length || 0;
                    break;
                case "supplier":
                    dataToSync.supplier = await fetchSuppliers(company);
                    fetchedCounts.supplier = dataToSync.supplier.length;
                    break;
                case "gift":
                    dataToSync.gift = await fetchGifts(company);
                    fetchedCounts.gift = dataToSync.gift.length;
                    break;
                case "getagory":
                    dataToSync.getagory = await fetchGetagory(company);
                    fetchedCounts.getagory = dataToSync.getagory.length;
                    break;
                case "fixname":
                    dataToSync.fixname = await fetchFixname(company);
                    fetchedCounts.fixname = dataToSync.fixname.length;
                    break;
                case "group":
                    dataToSync.group = await fetchGroup(company);
                    fetchedCounts.group = dataToSync.group.length;
                    break;
                case "type":
                    dataToSync.type = await fetchType(company);
                    fetchedCounts.type = dataToSync.type.length;
                    break;
                case "unit":
                    dataToSync.unit = await fetchUnit(company);
                    fetchedCounts.unit = dataToSync.unit.length;
                    break;
                case "area":
                    dataToSync.area = await fetchArea(company);
                    fetchedCounts.area = dataToSync.area.length;
                    break;
                case "interaction":
                    dataToSync.interaction = await fetchInteraction(company);
                    fetchedCounts.interaction = dataToSync.interaction.length;
                    break;
            }
        }

        console.log(`[SyncPush] Fetched counts:`, fetchedCounts);

        // Push ไปแต่ละสาขา
        const results: any[] = [];

        for (const conn of connections) {
            if (!conn.tunnelUrl || !conn.apiToken || !conn.remoteUserId) {
                results.push({
                    branch: conn.branchName || conn.tunnelUrl || "unknown",
                    tunnelUrl: conn.tunnelUrl,
                    status: "skipped",
                    error: "ข้อมูลสาขาไม่ครบ (tunnelUrl/apiToken/remoteUserId)"
                });
                continue;
            }

            const branchResult: any = {
                branch: conn.branchName || conn.remoteCompany || conn.tunnelUrl,
                tunnelUrl: conn.tunnelUrl,
                types: {}
            };

            let hasError = false;

            for (const type of types) {
                const typeData = dataToSync[type];
                if (!typeData) continue;

                const pushResult = await pushToRemoteBranch(
                    conn.tunnelUrl,
                    conn.apiToken,
                    conn.remoteUserId,
                    type,
                    typeData,
                    company,
                    normalizedProductSyncOptions
                );

                branchResult.types[type] = pushResult;

                // บันทึก SyncLog
                await prisma.syncLog.create({
                    data: {
                        company,
                        targetBranch: conn.tunnelUrl,
                        branchName: conn.branchName || conn.remoteCompany || "",
                        syncType: type,
                        recordCount: Array.isArray(typeData) ? typeData.length : (typeData.labels?.length || 0),
                        created: pushResult.created || 0,
                        updated: pushResult.updated || 0,
                        status: pushResult.success ? "success" : "failed",
                        error: pushResult.error || null,
                    }
                });

                if (!pushResult.success) hasError = true;
            }

            branchResult.status = hasError ? "partial" : "success";
            results.push(branchResult);
        }

        return NextResponse.json({
            success: true,
            message: `Sync เสร็จสิ้น (${connections.length} สาขา)`,
            results,
            fetchedCounts,
            debugInfo: { company, userId, connectionCount: connections.length }
        });
    } catch (error: any) {
        console.error("[SyncPush] Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to push sync" },
            { status: 500 }
        );
    }
}

function normalizeProductSyncOptions(options: any = {}) {
    return {
        preserveCostActual: Boolean(options?.preserveCostActual),
        preservePrices: Boolean(options?.preservePrices),
        preserveStockLimits: Boolean(options?.preserveStockLimits),
    };
}

// === ดึงข้อมูลสินค้า + UnitConversion ===
async function fetchDatalistWithConversions(company: string) {
    const products = await prisma.datalist.findMany({ where: { company } });
    const conversions = await prisma.unitConversion.findMany({ where: { company } });

    const convMap = new Map<string, any[]>();
    for (const uc of conversions) {
        const key = uc.productCode || "";
        if (!convMap.has(key)) convMap.set(key, []);
        convMap.get(key)!.push({
            qty: uc.qty,
            saleUnit: uc.saleUnit,
            subQty: uc.subQty,
            subUnit: uc.subUnit,
            priceRetail: uc.priceRetail,
            priceWholesale: uc.priceWholesale,
            priceOnline: uc.priceOnline,
            priceA: uc.priceA,
            priceB: uc.priceB,
            priceC: uc.priceC,
            priceD: uc.priceD,
            priceE: uc.priceE,
            priceF: uc.priceF,
            priceG: uc.priceG,
            priceH: uc.priceH,
            Barcode: uc.Barcode,
        });
    }

    return products.map(p => {
        const { id, ...rest } = p;
        return {
            ...rest,
            unitConversions: convMap.get(p.code || "") || []
        };
    });
}

// === ดึงข้อมูลฉลากยา + master lists ===
async function fetchLabeldataWithMasters(company: string) {
    const [labels, indicators, methods, times, uses, timeuses, keeps, remarks] = await Promise.all([
        prisma.labeldata.findMany({ where: { company } }),
        prisma.indicator.findMany({ where: { company } }),
        prisma.methodlist.findMany({ where: { company } }),
        prisma.timeL.findMany({ where: { company } }),
        prisma.useL.findMany({ where: { company } }),
        prisma.timeUseL.findMany({ where: { company } }),
        prisma.keepL.findMany({ where: { company } }),
        prisma.remarkL.findMany({ where: { company } }),
    ]);

    const stripId = (arr: any[]) => arr.map(({ id, company, ...rest }) => rest);

    return [{
        labels: labels.map(({ id, company, ...rest }) => rest),
        indicators: stripId(indicators),
        methods: stripId(methods),
        times: stripId(times),
        uses: stripId(uses),
        timeuses: stripId(timeuses),
        keeps: stripId(keeps),
        remarks: stripId(remarks),
    }];
}

// === ดึงข้อมูลผู้ขาย ===
async function fetchSuppliers(company: string) {
    const suppliers = await prisma.supplier.findMany({ where: { company } });
    return suppliers.map(({ id, ...rest }) => rest);
}

// === ดึงข้อมูลค่าหยิบยา (Gifts) ===
async function fetchGifts(company: string) {
    const gifts = await prisma.gifts.findMany({ where: { company } });
    return gifts.map(({ id, ...rest }) => rest);
}

// === ดึงข้อมูลหมวดสินค้า (Getagory) ===
async function fetchGetagory(company: string) {
    const items = await prisma.getagory.findMany({ where: { company } });
    return items.map(({ id, ...rest }) => rest);
}

// === ดึงข้อมูลชื่อทางการ (Fixname) ===
async function fetchFixname(company: string) {
    const items = await prisma.fixname.findMany({ where: { company } });
    return items.map(({ id, ...rest }) => rest);
}

// === ดึงข้อมูลกลุ่มยา (Group) ===
async function fetchGroup(company: string) {
    const items = await prisma.group.findMany({ where: { company } });
    return items.map(({ id, ...rest }) => rest);
}

// === ดึงข้อมูลประเภท (Type) ===
async function fetchType(company: string) {
    const items = await prisma.type.findMany({ where: { company } });
    return items.map(({ id, ...rest }) => rest);
}

// === ดึงข้อมูลหน่วยสินค้า (Unit) ===
async function fetchUnit(company: string) {
    const items = await prisma.unit.findMany({ where: { company } });
    return items.map(({ id, ...rest }) => rest);
}

// === ดึงข้อมูลพื้นที่เก็บ (Area) ===
async function fetchArea(company: string) {
    const items = await prisma.area.findMany({ where: { company } });
    return items.map(({ id, ...rest }) => rest);
}

// === ดึงข้อมูล Drug Interaction ===
async function fetchInteraction(company: string) {
    const items = await prisma.interaction.findMany({ where: { company } });
    return items.map(({ id, ...rest }) => rest);
}

// === ส่งข้อมูลไปยังสาขา remote ===
async function pushToRemoteBranch(
    tunnelUrl: string,
    apiToken: string,
    remoteUserId: number,
    type: string,
    data: any,
    company: string,
    productSyncOptions: ReturnType<typeof normalizeProductSyncOptions>
): Promise<{ success: boolean; created?: number; updated?: number; error?: string }> {
    const cleanUrl = tunnelUrl.replace(/\/+$/, "");

    // แบ่ง batch สำหรับ array ของ records (ทุก type ยกเว้น labeldata)
    if (type !== "labeldata") {
        const records = data as any[];
        const totalBatches = Math.ceil(records.length / BATCH_SIZE);
        let totalCreated = 0, totalUpdated = 0;

        // รวบรวม allCodes สำหรับ datalist/supplier → ส่งไปกับ batch สุดท้ายเพื่อลบ orphans
        const needsOrphanCleanup = type === "datalist" || type === "supplier";
        const allCodes = needsOrphanCleanup ? records.map((r: any) => r.code).filter(Boolean) : undefined;

        for (let i = 0; i < totalBatches; i++) {
            const batch = records.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
            const isLastBatch = i === totalBatches - 1;
            console.log(`[SyncPush] 📤 ${type} batch ${i + 1}/${totalBatches} (${batch.length} records) → ${cleanUrl}`);

            const result = await sendBatch(cleanUrl, apiToken, remoteUserId, type, batch, isLastBatch ? allCodes : undefined, productSyncOptions);
            if (!result.success) {
                return { success: false, created: totalCreated, updated: totalUpdated, error: `Batch ${i + 1} failed: ${result.error}` };
            }
            totalCreated += result.created || 0;
            totalUpdated += result.updated || 0;
        }

        return { success: true, created: totalCreated, updated: totalUpdated };
    }

    // labeldata ส่งทั้ง chunk เดียว (มี master lists รวมอยู่)
    console.log(`[SyncPush] 📤 ${type} → ${cleanUrl}`);
    return await sendBatch(cleanUrl, apiToken, remoteUserId, type, data, undefined, productSyncOptions);
}

async function sendBatch(
    cleanUrl: string,
    apiToken: string,
    remoteUserId: number,
    type: string,
    data: any,
    allCodes?: string[],
    productSyncOptions: ReturnType<typeof normalizeProductSyncOptions> = normalizeProductSyncOptions()
): Promise<{ success: boolean; created?: number; updated?: number; error?: string }> {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);

        const res = await fetch(`${cleanUrl}/api/sync/receive`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                toCompanyId: remoteUserId,
                apiToken,
                type,
                data,
                ...(allCodes ? { allCodes } : {}),
                productSyncOptions,
            }),
            signal: controller.signal,
        });
        clearTimeout(timeoutId);

        const responseText = await res.text().catch(() => "");
        let responseData: any = null;
        try { responseData = JSON.parse(responseText); } catch { }

        if (!res.ok) {
            return { success: false, error: responseData?.error || `HTTP ${res.status}` };
        }

        if (!responseData || !responseData.success) {
            return { success: false, error: "Invalid response from remote" };
        }

        return {
            success: true,
            created: responseData.created || 0,
            updated: responseData.updated || 0,
        };
    } catch (err: any) {
        if (err.name === "AbortError") {
            return { success: false, error: "Timeout (60s)" };
        }
        return { success: false, error: err.message || "Network error" };
    }
}
