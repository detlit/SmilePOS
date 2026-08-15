import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

const BATCH_SIZE = 500;

export async function POST(request: NextRequest) {
    const body = await request.json();
    const { company, userId, targetBranches, types, selectedCodes = [], branchPriceOverrides = {}, mirror = true, productSyncOptions = {} } = body;

    const normalizedSelectedCodes = normalizeSelectedCodes(selectedCodes);
    const normalizedProductSyncOptions = normalizeProductSyncOptions(productSyncOptions);

    if (!company || !userId || !types || !Array.isArray(types) || types.length === 0) {
        return new Response(JSON.stringify({ error: "company, userId, types[] required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }

    let connections = await prisma.branchConnection.findMany({
        where: { fromUserId: parseInt(userId), status: "accepted" }
    });

    if (targetBranches && Array.isArray(targetBranches) && targetBranches.length > 0) {
        connections = connections.filter(c => targetBranches.includes(c.tunnelUrl));
    }

    if (connections.length === 0) {
        return new Response(JSON.stringify({ error: "ไม่พบสาขาที่เชื่อมต่อ" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
        });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        async start(controller) {
            const send = (event: string, data: any) => {
                controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
            };

            const totalSteps = types.length * connections.length;
            let currentStep = 0;

            send("start", { totalSteps, types, branches: connections.map(c => c.branchName || c.remoteCompany || c.tunnelUrl) });

            for (const type of types) {
                send("fetch", { type, status: "fetching" });

                let typeData: any = null;
                let recordCount = 0;

                try {
                    typeData = await fetchDataForType(type, company, normalizedSelectedCodes);
                    recordCount = Array.isArray(typeData) ? typeData.length : (typeData?.[0]?.labels?.length || 0);
                    send("fetch", { type, status: "done", count: recordCount });
                } catch (err: any) {
                    send("fetch", { type, status: "error", error: err.message });
                    currentStep += connections.length;
                    send("progress", { current: currentStep, total: totalSteps });
                    continue;
                }

                for (const conn of connections) {
                    currentStep++;
                    const branchLabel = conn.branchName || conn.remoteCompany || conn.tunnelUrl || "unknown";

                    if (!conn.tunnelUrl || !conn.apiToken || !conn.remoteUserId) {
                        send("type-branch", { type, branch: branchLabel, status: "skipped", error: "ข้อมูลสาขาไม่ครบ" });
                        send("progress", { current: currentStep, total: totalSteps });
                        continue;
                    }

                    send("type-branch", { type, branch: branchLabel, status: "pushing" });

                    const branchOverrides = branchPriceOverrides?.[conn.tunnelUrl || ""] || {};
                    const branchTypeData = type === "datalist" && normalizedSelectedCodes.length > 0
                        ? applyBranchOverrides(typeData, branchOverrides)
                        : typeData;

                    try {
                        const pushResult = await pushToRemoteBranch(
                            conn.tunnelUrl,
                            conn.apiToken,
                            conn.remoteUserId,
                            type,
                            branchTypeData,
                            company,
                            mirror,
                            normalizedProductSyncOptions,
                        );

                        await prisma.syncLog.create({
                            data: {
                                company,
                                targetBranch: conn.tunnelUrl,
                                branchName: conn.branchName || conn.remoteCompany || "",
                                syncType: type,
                                recordCount,
                                created: pushResult.created || 0,
                                updated: pushResult.updated || 0,
                                status: pushResult.success ? "success" : "failed",
                                error: pushResult.error || null,
                            }
                        });

                        send("type-branch", {
                            type,
                            branch: branchLabel,
                            status: pushResult.success ? "success" : "failed",
                            created: pushResult.created || 0,
                            updated: pushResult.updated || 0,
                            error: pushResult.error || null,
                        });
                    } catch (err: any) {
                        send("type-branch", { type, branch: branchLabel, status: "failed", error: err.message });
                    }

                    send("progress", { current: currentStep, total: totalSteps });
                }
            }

            send("done", { totalSteps });
            controller.close();
        }
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    });
}

async function fetchDataForType(type: string, company: string, selectedCodes: string[] = []): Promise<any> {
    switch (type) {
        case "datalist": return await fetchDatalistWithConversions(company, selectedCodes);
        case "labeldata": return await fetchLabeldataWithMasters(company, selectedCodes);
        case "supplier": return await fetchSuppliers(company);
        case "gift": return await fetchGifts(company, selectedCodes);
        case "getagory": return await fetchSimple(prisma.getagory, company);
        case "fixname": return await fetchSimple(prisma.fixname, company);
        case "group": return await fetchSimple(prisma.group, company);
        case "type": return await fetchSimple(prisma.type, company);
        case "unit": return await fetchSimple(prisma.unit, company);
        case "area": return await fetchSimple(prisma.area, company);
        case "interaction": return await fetchSimple(prisma.interaction, company);
        default: throw new Error(`Unknown type: ${type}`);
    }
}

async function fetchSimple(model: any, company: string) {
    const items = await model.findMany({ where: { company } });
    return items.map(({ id, ...rest }: any) => rest);
}

function normalizeSelectedCodes(selectedCodes: any[] = []) {
    return Array.from(new Set((selectedCodes || []).map((code: any) => String(code || "").trim()).filter(Boolean)));
}

function normalizeProductSyncOptions(options: any = {}) {
    return {
        preserveCostActual: Boolean(options?.preserveCostActual),
        preservePrices: Boolean(options?.preservePrices),
        preserveStockLimits: Boolean(options?.preserveStockLimits),
    };
}

function normalizeSyncNumber(value: any) {
    if (value === null || value === undefined || value === "") return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
}

function applyBranchOverrides(records: any[], branchOverrides: Record<string, Record<string, string>>) {
    if (!Array.isArray(records) || !branchOverrides || Object.keys(branchOverrides).length === 0) return records;

    return records.map(record => {
        const code = String(record?.code || "").trim();
        const overrides = branchOverrides[code];
        if (!code || !overrides) return record;

        const nextRecord = { ...record };
        for (const [field, value] of Object.entries(overrides)) {
            const normalized = normalizeSyncNumber(value);
            if (normalized !== undefined) {
                nextRecord[field] = normalized;
            }
        }

        return nextRecord;
    });
}

async function fetchDatalistWithConversions(company: string, selectedCodes: string[] = []) {
    const products = await prisma.datalist.findMany({
        where: selectedCodes.length > 0
            ? { company, code: { in: selectedCodes } }
            : { company },
    });

    const conversions = await prisma.unitConversion.findMany({
        where: selectedCodes.length > 0
            ? { company, productCode: { in: selectedCodes } }
            : { company },
    });

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
        return { ...rest, unitConversions: convMap.get(p.code || "") || [] };
    });
}

async function fetchLabeldataWithMasters(company: string, selectedCodes: string[] = []) {
    const [labels, indicators, methods, times, uses, timeuses, keeps, remarks] = await Promise.all([
        prisma.labeldata.findMany({
            where: selectedCodes.length > 0
                ? { company, code: { in: selectedCodes } }
                : { company },
        }),
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

async function fetchSuppliers(company: string) {
    const suppliers = await prisma.supplier.findMany({ where: { company } });
    return suppliers.map(({ id, ...rest }) => rest);
}

async function fetchGifts(company: string, selectedCodes: string[] = []) {
    const gifts = await prisma.gifts.findMany({
        where: selectedCodes.length > 0
            ? { company, code_product: { in: selectedCodes } }
            : { company },
    });

    return gifts.map(({ id, ...rest }) => rest);
}

async function pushToRemoteBranch(
    tunnelUrl: string,
    apiToken: string,
    remoteUserId: number,
    type: string,
    data: any,
    company: string,
    mirror: boolean,
    productSyncOptions: ReturnType<typeof normalizeProductSyncOptions>,
): Promise<{ success: boolean; created?: number; updated?: number; error?: string }> {
    const cleanUrl = tunnelUrl.replace(/\/+$/, "");

    if (type !== "labeldata") {
        const records = data as any[];
        const totalBatches = Math.ceil(records.length / BATCH_SIZE);
        let totalCreated = 0;
        let totalUpdated = 0;

        const needsOrphanCleanup = mirror && (type === "datalist" || type === "supplier");
        const allCodes = needsOrphanCleanup ? records.map((r: any) => r.code).filter(Boolean) : undefined;

        for (let i = 0; i < totalBatches; i++) {
            const batch = records.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
            const isLastBatch = i === totalBatches - 1;
            const result = await sendBatch(cleanUrl, apiToken, remoteUserId, type, batch, isLastBatch ? allCodes : undefined, mirror, productSyncOptions);
            if (!result.success) {
                return { success: false, created: totalCreated, updated: totalUpdated, error: `Batch ${i + 1} failed: ${result.error}` };
            }
            totalCreated += result.created || 0;
            totalUpdated += result.updated || 0;
        }

        return { success: true, created: totalCreated, updated: totalUpdated };
    }

    return await sendBatch(cleanUrl, apiToken, remoteUserId, type, data, undefined, mirror, productSyncOptions);
}

async function sendBatch(
    cleanUrl: string,
    apiToken: string,
    remoteUserId: number,
    type: string,
    data: any,
    allCodes?: string[],
    mirror: boolean = true,
    productSyncOptions: ReturnType<typeof normalizeProductSyncOptions> = normalizeProductSyncOptions(),
): Promise<{ success: boolean; created?: number; updated?: number; error?: string }> {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);

        const res = await fetch(`${cleanUrl}/api/sync/receive`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ toCompanyId: remoteUserId, apiToken, type, data, ...(allCodes ? { allCodes } : {}), mirror, productSyncOptions }),
            signal: controller.signal,
        });
        clearTimeout(timeoutId);

        const responseText = await res.text().catch(() => "");
        let responseData: any = null;
        try { responseData = JSON.parse(responseText); } catch { }

        if (!res.ok) return { success: false, error: responseData?.error || `HTTP ${res.status}` };
        if (!responseData || !responseData.success) return { success: false, error: "Invalid response from remote" };

        return { success: true, created: responseData.created || 0, updated: responseData.updated || 0 };
    } catch (err: any) {
        if (err.name === "AbortError") return { success: false, error: "Timeout (60s)" };
        return { success: false, error: err.message || "Network error" };
    }
}
