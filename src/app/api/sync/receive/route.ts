import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type ProductSyncOptions = {
    preserveCostActual: boolean;
    preservePrices: boolean;
    preserveStockLimits: boolean;
};

function normalizeProductSyncOptions(options: any = {}): ProductSyncOptions {
    return {
        preserveCostActual: Boolean(options?.preserveCostActual),
        preservePrices: Boolean(options?.preservePrices),
        preserveStockLimits: Boolean(options?.preserveStockLimits),
    };
}

// POST: รับข้อมูล sync จากสาขาหลัก
// สาขาหลักจะเรียก endpoint นี้ผ่าน Tunnel เพื่อ push ข้อมูลเข้ามา
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { toCompanyId, apiToken, type, data, company, allCodes, mirror = true, productSyncOptions = {} } = body;
        const normalizedProductSyncOptions = normalizeProductSyncOptions(productSyncOptions);

        if (!toCompanyId || !apiToken || !type || !data || !Array.isArray(data)) {
            return NextResponse.json(
                { error: "toCompanyId, apiToken, type, and data[] are required" },
                { status: 400 }
            );
        }

        // ตรวจสอบ apiToken
        const user = await prisma.user.findUnique({
            where: { id: parseInt(toCompanyId) }
        });

        if (!user) {
            return NextResponse.json({ error: `User id=${toCompanyId} not found` }, { status: 401 });
        }

        if (user.apiToken !== apiToken) {
            return NextResponse.json({ error: "Invalid apiToken" }, { status: 401 });
        }

        // company_ ทั้งระบบเก็บเป็น User ID (ไม่ใช่ชื่อบริษัท)
        const targetCompany = String(toCompanyId);
        console.log(`[SyncReceive] 📥 type=${type}, records=${data.length}, targetCompany="${targetCompany}"`);

        let result: { created: number; updated: number; errors: string[] };

        switch (type) {
            case "datalist":
                result = await syncDatalist(data, targetCompany, allCodes, mirror, normalizedProductSyncOptions);
                break;
            case "labeldata":
                result = await syncLabeldata(data, targetCompany);
                break;
            case "supplier":
                result = await syncSupplier(data, targetCompany, allCodes, mirror);
                break;
            case "gift":
                result = await syncGifts(data, targetCompany, mirror);
                break;
            case "getagory":
                result = await syncGetagory(data, targetCompany);
                break;
            case "fixname":
                result = await syncFixname(data, targetCompany);
                break;
            case "group":
                result = await syncGroup(data, targetCompany);
                break;
            case "type":
                result = await syncType(data, targetCompany);
                break;
            case "unit":
                result = await syncUnit(data, targetCompany);
                break;
            case "area":
                result = await syncArea(data, targetCompany);
                break;
            case "interaction":
                result = await syncInteraction(data, targetCompany);
                break;
            default:
                return NextResponse.json({ error: `Unknown sync type: ${type}` }, { status: 400 });
        }

        console.log(`[SyncReceive] ✅ type=${type}: created=${result.created}, updated=${result.updated}, errors=${result.errors.length}`);

        return NextResponse.json({
            success: true,
            type,
            created: result.created,
            updated: result.updated,
            errors: result.errors.slice(0, 10),
        });
    } catch (error: any) {
        console.error("[SyncReceive] Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to receive sync data" },
            { status: 500 }
        );
    }
}

function applyDatalistPreserves(data: any, existing: any, options: ProductSyncOptions) {
    const next = { ...data };

    if (options.preserveCostActual) {
        next.CostActual = existing.CostActual;
    }

    if (options.preservePrices) {
        next.price = existing.price;
        next.wholesaleprice = existing.wholesaleprice;
        next.online = existing.online;
        next.PriceA = existing.PriceA;
        next.PriceB = existing.PriceB;
        next.PriceC = existing.PriceC;
        next.PriceD = existing.PriceD;
        next.PriceE = existing.PriceE;
        next.PriceF = existing.PriceF;
        next.PriceG = existing.PriceG;
        next.PriceH = existing.PriceH;
    }

    if (options.preserveStockLimits) {
        next.Max = existing.Max;
        next.Min = existing.Min;
        next.ROP = existing.ROP;
    }

    return next;
}

function applyUnitConversionPreserves(data: any, existing: any, options: ProductSyncOptions) {
    if (!options.preservePrices) return data;

    return {
        ...data,
        priceRetail: existing.priceRetail,
        priceWholesale: existing.priceWholesale,
        priceOnline: existing.priceOnline,
        priceA: existing.priceA,
        priceB: existing.priceB,
        priceC: existing.priceC,
        priceD: existing.priceD,
        priceE: existing.priceE,
        priceF: existing.priceF,
        priceG: existing.priceG,
        priceH: existing.priceH,
    };
}

// === Sync Datalist (สินค้า) + UnitConversion ===
async function syncDatalist(data: any[], targetCompany: string, allCodes?: string[], mirror: boolean = true, productSyncOptions: ProductSyncOptions = normalizeProductSyncOptions()) {
    let created = 0, updated = 0;
    const errors: string[] = [];

    for (const item of data) {
        try {
            const { unitConversions, ...productData } = item;
            const code = productData.code;
            if (!code) { errors.push("Missing code for a datalist item"); continue; }

            // Upsert สินค้า by company + code
            const existing = await prisma.datalist.findFirst({
                where: { company: targetCompany, code }
            });

            const upsertData = {
                company: targetCompany,
                code,
                ProductName: productData.ProductName ?? null,
                fixname: productData.fixname ?? null,
                group: productData.group ?? null,
                type: productData.type ?? null,
                subtype: productData.subtype ?? null,
                Category: productData.Category ?? null,
                DrugRegistor: productData.DrugRegistor ?? null,
                Area: productData.Area ?? null,
                Unit: productData.Unit ?? null,
                Barcode: productData.Barcode ?? null,
                AlarmExp: productData.AlarmExp ?? null,
                Remark: productData.Remark ?? null,
                Show: productData.Show ?? null,
                Child: productData.Child ?? null,
                CI: productData.CI ?? null,
                CostActual: productData.CostActual ?? null,
                price: productData.price ?? null,
                wholesaleprice: productData.wholesaleprice ?? null,
                online: productData.online ?? null,
                PriceA: productData.PriceA ?? null,
                PriceB: productData.PriceB ?? null,
                PriceC: productData.PriceC ?? null,
                PriceD: productData.PriceD ?? null,
                PriceE: productData.PriceE ?? null,
                PriceF: productData.PriceF ?? null,
                PriceG: productData.PriceG ?? null,
                PriceH: productData.PriceH ?? null,
                Max: productData.Max ?? null,
                Min: productData.Min ?? null,
                ROP: productData.ROP ?? null,
                pic: productData.pic ?? null,
                maker: productData.maker ?? "",
                qty_unit: productData.qty_unit ?? "",
                concentration: productData.concentration ?? null,
                dosePerKg: productData.dosePerKg ?? null,
                doseFrequency: productData.doseFrequency ?? null,
                maxDosePerDay: productData.maxDosePerDay ?? null,
            };

            if (existing) {
                await prisma.datalist.update({ where: { id: existing.id }, data: applyDatalistPreserves(upsertData, existing, productSyncOptions) });
                updated++;
            } else {
                await prisma.datalist.create({ data: upsertData });
                created++;
            }

            // Sync UnitConversion ที่เกี่ยวข้อง
            if (unitConversions && Array.isArray(unitConversions)) {
                for (const uc of unitConversions) {
                    const existingUC = await prisma.unitConversion.findFirst({
                        where: { company: targetCompany, productCode: code, Barcode: uc.Barcode || "" }
                    });

                    const ucData = {
                        company: targetCompany,
                        productCode: code,
                        qty: uc.qty ?? 1,
                        saleUnit: uc.saleUnit ?? null,
                        subQty: uc.subQty ?? 12,
                        subUnit: uc.subUnit ?? null,
                        priceRetail: uc.priceRetail ?? null,
                        priceWholesale: uc.priceWholesale ?? null,
                        priceOnline: uc.priceOnline ?? null,
                        priceA: uc.priceA ?? null,
                        priceB: uc.priceB ?? null,
                        priceC: uc.priceC ?? null,
                        priceD: uc.priceD ?? null,
                        priceE: uc.priceE ?? null,
                        priceF: uc.priceF ?? null,
                        priceG: uc.priceG ?? null,
                        priceH: uc.priceH ?? null,
                        Barcode: uc.Barcode ?? "",
                    };

                    if (existingUC) {
                        await prisma.unitConversion.update({ where: { id: existingUC.id }, data: applyUnitConversionPreserves(ucData, existingUC, productSyncOptions) });
                    } else {
                        await prisma.unitConversion.create({ data: ucData });
                    }
                }
            }
        } catch (e: any) {
            errors.push(`datalist code=${item.code}: ${e.message}`);
        }
    }

    // Full Mirror: ลบ records ที่ไม่มีใน main branch — ทำเฉพาะเมื่อได้รับ allCodes (batch สุดท้าย)
    if (mirror && allCodes && allCodes.length > 0) {
        try {
            const deleted = await prisma.datalist.deleteMany({
                where: { company: targetCompany, code: { notIn: allCodes } }
            });
            await prisma.unitConversion.deleteMany({
                where: { company: targetCompany, productCode: { notIn: allCodes } }
            });
            if (deleted.count > 0) console.log(`[SyncReceive] 🗑️ datalist: deleted ${deleted.count} orphan records`);
        } catch (e: any) {
            errors.push(`datalist orphan cleanup: ${e.message}`);
        }
    }

    return { created, updated, errors };
}

// === Sync Labeldata (ฉลากยา) + master lists ===
async function syncLabeldata(data: any[], targetCompany: string) {
    let created = 0, updated = 0;
    const errors: string[] = [];

    // data มีโครงสร้าง:
    // { labels: [...], indicators: [...], methods: [...], times: [...], uses: [...], timeuses: [...], keeps: [...], remarks: [...] }
    const { labels, indicators, methods, times, uses, timeuses, keeps, remarks } = data[0] || {};

    // Sync master lists (ลบเก่าทั้งหมดแล้วใส่ใหม่ — เพราะไม่มี unique key)
    if (indicators && Array.isArray(indicators)) {
        await prisma.indicator.deleteMany({ where: { company: targetCompany } });
        for (const item of indicators) {
            await prisma.indicator.create({
                data: { company: targetCompany, list: item.list, list_lo: item.list_lo || "", list_my: item.list_my || "", list_km: item.list_km || "", list_zh: item.list_zh || "", list_eng: item.list_eng || "" }
            });
        }
    }

    if (methods && Array.isArray(methods)) {
        await prisma.methodlist.deleteMany({ where: { company: targetCompany } });
        for (const item of methods) {
            await prisma.methodlist.create({
                data: { company: targetCompany, list: item.list, qty: item.qty, unit: item.unit, fullname: item.fullname, list_lo: item.list_lo || "", list_my: item.list_my || "", list_km: item.list_km || "", list_zh: item.list_zh || "", list_eng: item.list_eng || "" }
            });
        }
    }

    if (times && Array.isArray(times)) {
        await prisma.timeL.deleteMany({ where: { company: targetCompany } });
        for (const item of times) {
            await prisma.timeL.create({
                data: { company: targetCompany, list: item.list, list_lo: item.list_lo || "", list_my: item.list_my || "", list_km: item.list_km || "", list_zh: item.list_zh || "", list_eng: item.list_eng || "" }
            });
        }
    }

    if (uses && Array.isArray(uses)) {
        await prisma.useL.deleteMany({ where: { company: targetCompany } });
        for (const item of uses) {
            await prisma.useL.create({
                data: { company: targetCompany, list: item.list, list_lo: item.list_lo || "", list_my: item.list_my || "", list_km: item.list_km || "", list_zh: item.list_zh || "", list_eng: item.list_eng || "" }
            });
        }
    }

    if (timeuses && Array.isArray(timeuses)) {
        await prisma.timeUseL.deleteMany({ where: { company: targetCompany } });
        for (const item of timeuses) {
            await prisma.timeUseL.create({
                data: { company: targetCompany, list: item.list, list_lo: item.list_lo || "", list_my: item.list_my || "", list_km: item.list_km || "", list_zh: item.list_zh || "", list_eng: item.list_eng || "" }
            });
        }
    }

    if (keeps && Array.isArray(keeps)) {
        await prisma.keepL.deleteMany({ where: { company: targetCompany } });
        for (const item of keeps) {
            await prisma.keepL.create({
                data: { company: targetCompany, list: item.list, list_lo: item.list_lo || "", list_my: item.list_my || "", list_km: item.list_km || "", list_zh: item.list_zh || "", list_eng: item.list_eng || "" }
            });
        }
    }

    if (remarks && Array.isArray(remarks)) {
        await prisma.remarkL.deleteMany({ where: { company: targetCompany } });
        for (const item of remarks) {
            await prisma.remarkL.create({
                data: { company: targetCompany, list: item.list, list_lo: item.list_lo || "", list_my: item.list_my || "", list_km: item.list_km || "", list_zh: item.list_zh || "", list_eng: item.list_eng || "" }
            });
        }
    }

    // Sync Labeldata by code
    if (labels && Array.isArray(labels)) {
        for (const item of labels) {
            try {
                const code = item.code;
                if (!code) { errors.push("Missing code for labeldata"); continue; }

                const existing = await prisma.labeldata.findFirst({
                    where: { company: targetCompany, code }
                });

                const labelFields = {
                    company: targetCompany,
                    code,
                    indicatorlistS: item.indicatorlistS ?? "",
                    timeS: item.timeS ?? "",
                    useS: item.useS ?? "",
                    timeuseS: item.timeuseS ?? "",
                    keepS: item.keepS ?? "",
                    remarkS: item.remarkS ?? "",
                };

                if (existing) {
                    await prisma.labeldata.update({ where: { id: existing.id }, data: labelFields });
                    updated++;
                } else {
                    await prisma.labeldata.create({ data: labelFields });
                    created++;
                }
            } catch (e: any) {
                errors.push(`labeldata code=${item.code}: ${e.message}`);
            }
        }
    }

    return { created, updated, errors };
}

// === Sync Supplier (ผู้ขาย) ===
async function syncSupplier(data: any[], targetCompany: string, allCodes?: string[], mirror: boolean = true) {
    let created = 0, updated = 0;
    const errors: string[] = [];

    for (const item of data) {
        try {
            const code = item.code;
            if (!code) { errors.push("Missing code for supplier"); continue; }

            const existing = await prisma.supplier.findFirst({
                where: { company: targetCompany, code }
            });

            const supplierData = {
                company: targetCompany,
                code,
                names: item.names ?? null,
                tel: item.tel ?? null,
                idcode: item.idcode ?? null,
                address: item.address ?? null,
                statuss: item.statuss ?? null,
                leadtime: item.leadtime ?? null,
                email: item.email ?? null,
            };

            if (existing) {
                await prisma.supplier.update({ where: { id: existing.id }, data: supplierData });
                updated++;
            } else {
                await prisma.supplier.create({ data: supplierData });
                created++;
            }
        } catch (e: any) {
            errors.push(`supplier code=${item.code}: ${e.message}`);
        }
    }

    // Full Mirror: ลบ supplier ที่ไม่มีใน main branch — ทำเฉพาะเมื่อได้รับ allCodes (batch สุดท้าย)
    if (mirror && allCodes && allCodes.length > 0) {
        try {
            const deleted = await prisma.supplier.deleteMany({
                where: { company: targetCompany, code: { notIn: allCodes } }
            });
            if (deleted.count > 0) console.log(`[SyncReceive] 🗑️ supplier: deleted ${deleted.count} orphan records`);
        } catch (e: any) {
            errors.push(`supplier orphan cleanup: ${e.message}`);
        }
    }

    return { created, updated, errors };
}

// === Sync Gifts (ค่าหยิบยา) — Full Mirror ===
async function syncGifts(data: any[], targetCompany: string, mirror: boolean = true) {
    let created = 0, updated = 0;
    const errors: string[] = [];

    try {
        if (mirror) {
            await prisma.gifts.deleteMany({ where: { company: targetCompany } });
            for (const item of data) {
                await prisma.gifts.create({
                    data: {
                        company: targetCompany,
                        id_product: item.id_product ?? null,
                        code_product: item.code_product ?? null,
                        name_product: item.name_product ?? null,
                        gift: item.gift ?? null,
                        person: item.person ?? null,
                        createDate: item.createDate ? new Date(item.createDate) : new Date(),
                    }
                });
                created++;
            }
        } else {
            for (const item of data) {
                const lookupCode = String(item.code_product || "").trim();
                const lookupProductId = item.id_product !== undefined && item.id_product !== null ? Number(item.id_product) : null;

                const existing = lookupCode
                    ? await prisma.gifts.findFirst({ where: { company: targetCompany, code_product: lookupCode } })
                    : lookupProductId !== null && Number.isFinite(lookupProductId)
                        ? await prisma.gifts.findFirst({ where: { company: targetCompany, id_product: lookupProductId } })
                        : null;

                const giftData = {
                    company: targetCompany,
                    id_product: item.id_product ?? null,
                    code_product: item.code_product ?? null,
                    name_product: item.name_product ?? null,
                    gift: item.gift ?? null,
                    person: item.person ?? null,
                    createDate: item.createDate ? new Date(item.createDate) : new Date(),
                }

                if (existing) {
                    await prisma.gifts.update({ where: { id: existing.id }, data: giftData });
                    updated++;
                } else {
                    await prisma.gifts.create({ data: giftData });
                    created++;
                }
            }
        }
    } catch (e: any) {
        errors.push(`gifts: ${e.message}`);
    }

    return { created, updated, errors };
}

// === Sync Getagory (หมวดสินค้า) — Full Mirror ===
async function syncGetagory(data: any[], targetCompany: string) {
    const errors: string[] = [];
    try {
        await prisma.getagory.deleteMany({ where: { company: targetCompany } });
        for (const item of data) {
            await prisma.getagory.create({
                data: { company: targetCompany, list: item.list ?? null }
            });
        }
    } catch (e: any) {
        errors.push(`getagory: ${e.message}`);
    }
    return { created: data.length, updated: 0, errors };
}

// === Sync Fixname (ชื่อทางการ) — Full Mirror ===
async function syncFixname(data: any[], targetCompany: string) {
    const errors: string[] = [];
    try {
        await prisma.fixname.deleteMany({ where: { company: targetCompany } });
        for (const item of data) {
            await prisma.fixname.create({
                data: { company: targetCompany, shortlist: item.shortlist ?? null, list: item.list ?? null }
            });
        }
    } catch (e: any) {
        errors.push(`fixname: ${e.message}`);
    }
    return { created: data.length, updated: 0, errors };
}

// === Sync Group (กลุ่มยา) — Full Mirror ===
async function syncGroup(data: any[], targetCompany: string) {
    const errors: string[] = [];
    try {
        await prisma.group.deleteMany({ where: { company: targetCompany } });
        for (const item of data) {
            await prisma.group.create({
                data: { company: targetCompany, list: item.list ?? null }
            });
        }
    } catch (e: any) {
        errors.push(`group: ${e.message}`);
    }
    return { created: data.length, updated: 0, errors };
}

// === Sync Type (ประเภท) — Full Mirror ===
async function syncType(data: any[], targetCompany: string) {
    const errors: string[] = [];
    try {
        await prisma.type.deleteMany({ where: { company: targetCompany } });
        for (const item of data) {
            await prisma.type.create({
                data: { company: targetCompany, shortlist: item.shortlist ?? null, list: item.list ?? null }
            });
        }
    } catch (e: any) {
        errors.push(`type: ${e.message}`);
    }
    return { created: data.length, updated: 0, errors };
}

// === Sync Unit (หน่วยสินค้า) — Full Mirror ===
async function syncUnit(data: any[], targetCompany: string) {
    const errors: string[] = [];
    try {
        await prisma.unit.deleteMany({ where: { company: targetCompany } });
        for (const item of data) {
            await prisma.unit.create({
                data: { company: targetCompany, list: item.list ?? null }
            });
        }
    } catch (e: any) {
        errors.push(`unit: ${e.message}`);
    }
    return { created: data.length, updated: 0, errors };
}

// === Sync Area (พื้นที่เก็บ) — Full Mirror ===
async function syncArea(data: any[], targetCompany: string) {
    const errors: string[] = [];
    try {
        await prisma.area.deleteMany({ where: { company: targetCompany } });
        for (const item of data) {
            await prisma.area.create({
                data: { company: targetCompany, list: item.list ?? null }
            });
        }
    } catch (e: any) {
        errors.push(`area: ${e.message}`);
    }
    return { created: data.length, updated: 0, errors };
}

// === Sync Interaction (Drug Interaction) — Full Mirror ===
async function syncInteraction(data: any[], targetCompany: string) {
    const errors: string[] = [];
    try {
        await prisma.interaction.deleteMany({ where: { company: targetCompany } });
        for (const item of data) {
            await prisma.interaction.create({
                data: {
                    company: targetCompany,
                    fixname1: item.fixname1 ?? null,
                    fixname2: item.fixname2 ?? null,
                    status: item.status ?? null,
                }
            });
        }
    } catch (e: any) {
        errors.push(`interaction: ${e.message}`);
    }
    return { created: data.length, updated: 0, errors };
}
