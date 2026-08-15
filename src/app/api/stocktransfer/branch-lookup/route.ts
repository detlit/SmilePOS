import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeStockBalance, getLotsWithCalculatedBalance, transferableLotQty } from "@/lib/stockBalance";
import { productCodesMatchingAlias } from "@/lib/barcodeResolve";
import { lotUnitCost } from "@/lib/lotCost";

// Helper: คำนวณยอด StockTransaction (TRANSFER_OUT, TRANSFER_IN, ADJUST) สำหรับสินค้า
async function getStockTransactionTotals(companyId: string, productCode: string) {
    const txns: any[] = await prisma.$queryRaw`
        SELECT "transaction_type", "quantity_change"
        FROM "StockTransaction"
        WHERE "company" = ${companyId}
          AND "itemcode" = ${productCode}
    `;
    let transferOut = 0, transferIn = 0, adjust = 0;
    for (const tx of txns) {
        const type = (tx.transaction_type || '').toUpperCase();
        const qtyChange = parseFloat(String(tx.quantity_change)) || 0;
        if (type === 'TRANSFER_OUT') transferOut += Math.abs(qtyChange);
        else if (type === 'TRANSFER_IN') transferIn += Math.abs(qtyChange);
        else if (type === 'ADJUST') adjust += qtyChange;
    }
    return { transferOut, transferIn, adjust };
}

// Helper: หา User ID จากชื่อสาขา (company name)
async function resolveCompanyId(branchName: string, remoteCompany: string, logPrefix: string): Promise<string | null> {
    // 1. ลองหาจากชื่อสาขาที่ส่งมา (branchName)
    if (branchName) {
        const user: any = await prisma.user.findFirst({
            where: { company: branchName }
        });
        if (user) {
            console.log(`${logPrefix} ✅ Found User by branchName "${branchName}" → id=${user.id}`);
            return String(user.id);
        }
    }
    // 2. ลองหาจาก remoteCompany (อาจเป็นชื่อภาษาไทย)
    if (remoteCompany && remoteCompany !== branchName) {
        const user: any = await prisma.user.findFirst({
            where: { company: remoteCompany }
        });
        if (user) {
            console.log(`${logPrefix} ✅ Found User by remoteCompany "${remoteCompany}" → id=${user.id}`);
            return String(user.id);
        }
    }
    console.log(`${logPrefix} ⚠️ No User found with branchName="${branchName}" or remoteCompany="${remoteCompany}"`);
    // ไม่ fallback ไป remoteUserId เพราะอาจผิด — return null
    return null;
}

// Helper: ค้นหาสินค้าจากสาขา remote ผ่าน Tunnel
async function remoteBranchLookup(
    remoteBranch: { branchId: string; tunnelUrl: string; apiToken: string; remoteUserId: number; branchName?: string; remoteCompany?: string },
    query: string,
    barcode: string
): Promise<any> {
    const logPrefix = `[RemoteLookup ${remoteBranch.branchId}]`;
    const branchName = remoteBranch.branchName || "";
    const remoteCompany = remoteBranch.remoteCompany || "";

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!remoteBranch.tunnelUrl) {
        console.warn(`${logPrefix} ❌ No tunnelUrl`);
        return { branchId: remoteBranch.branchId, productCode: null, productName: null, barcode, totalBalance: 0, hasProduct: false, isRemote: true, remoteError: "ไม่มี Tunnel URL" };
    }
    if (!remoteBranch.apiToken) {
        console.warn(`${logPrefix} ❌ No apiToken`);
        return { branchId: remoteBranch.branchId, productCode: null, productName: null, barcode, totalBalance: 0, hasProduct: false, isRemote: true, remoteError: "ไม่มี apiToken" };
    }

    // หา companyId ที่ถูกต้องจากชื่อสาขา
    const resolvedCompanyId = await resolveCompanyId(branchName, remoteCompany, logPrefix);
    console.log(`${logPrefix} 🏢 branchName="${branchName}", remoteCompany="${remoteCompany}", resolvedCompanyId=${resolvedCompanyId}`);

    const cleanUrl = remoteBranch.tunnelUrl.replace(/\/+$/, "");
    const companyId = resolvedCompanyId || String(remoteBranch.remoteUserId);

    // === Strategy 1: ลอง remote-lookup endpoint (custom ของเรา) ===
    try {
        const fetchUrl = `${cleanUrl}/api/stocktransfer/remote-lookup`;
        const requestBody = {
            query: barcode || query,
            companyId,
            apiToken: remoteBranch.apiToken
        };

        console.log(`${logPrefix} 🔍 [Strategy 1] Fetching: ${fetchUrl}`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const res = await fetch(fetchUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (res.ok) {
            const data = await res.json();
            const match = data.results?.[0];
            if (match) {
                console.log(`${logPrefix} ✅ [Strategy 1] Found product via remote-lookup`);
                // ใช้ stock-balance-summary เพื่อดึงยอดที่ถูกต้อง (รวม transfers/adjustments)
                let correctedBalance = match.totalBalance || 0;
                try {
                    const pCode = match.productCode || "";
                    const sbsUrl = `${cleanUrl}/api/stock-balance-summary?company=${companyId}&itemcode=${encodeURIComponent(pCode)}`;
                    console.log(`${logPrefix} 📊 [Strategy 1+] Verifying balance via stock-balance-summary: ${sbsUrl}`);
                    const sbsCtrl = new AbortController();
                    const sbsTimeout = setTimeout(() => sbsCtrl.abort(), 10000);
                    const sbsRes = await fetch(sbsUrl, { signal: sbsCtrl.signal });
                    clearTimeout(sbsTimeout);
                    if (sbsRes.ok) {
                        const sbsData = await sbsRes.json();
                        if (sbsData?.calculatedBalance !== undefined) {
                            correctedBalance = sbsData.calculatedBalance;
                            console.log(`${logPrefix} ✅ [Strategy 1+] Corrected balance: ${correctedBalance}`);
                        }
                    }
                } catch (sbsErr: any) {
                    console.log(`${logPrefix} ⚠️ [Strategy 1+] stock-balance-summary failed: ${sbsErr.message}, using remote-lookup balance`);
                }
                return {
                    branchId: remoteBranch.branchId,
                    productCode: match.productCode || null,
                    productName: match.productName || null,
                    barcode: match.barcode || barcode,
                    totalBalance: correctedBalance,
                    hasProduct: true,
                    isRemote: true,
                    queriedCompanyId: companyId,
                    source: "tunnel (remote-lookup + stock-balance-summary)"
                };
            }
        }
        console.log(`${logPrefix} ⚠️ [Strategy 1] remote-lookup returned ${res.status}, trying Strategy 2...`);
    } catch (err: any) {
        console.log(`${logPrefix} ⚠️ [Strategy 1] remote-lookup error: ${err.message}, trying Strategy 2...`);
    }

    // === Strategy 2: ใช้ endpoint เดิมที่มีอยู่บน remote server ===
    // GET /api/datalist?company=X&Barcode=BARCODE (หรือ &code=CODE) → หาข้อมูลสินค้า
    // GET /api/sale_cal/sale_balance?company=X&code_product=CODE → หายอดคงเหลือ
    try {
        const searchValue = barcode || query;
        // ค้นจาก Barcode ก่อน ถ้าไม่เจอค้นจาก code
        let productUrl = `${cleanUrl}/api/datalist?company=${companyId}&Barcode=${encodeURIComponent(searchValue)}`;
        console.log(`${logPrefix} 🔍 [Strategy 2] Fetching product: ${productUrl}`);

        const controller2 = new AbortController();
        const timeoutId2 = setTimeout(() => controller2.abort(), 10000);

        let productRes = await fetch(productUrl, { signal: controller2.signal });
        let products: any[] = [];
        if (productRes.ok) {
            products = await productRes.json();
        }

        // ถ้าค้น Barcode ไม่เจอ ลองค้นจาก code
        if (products.length === 0) {
            const codeUrl = `${cleanUrl}/api/datalist?company=${companyId}&code=${encodeURIComponent(searchValue)}`;
            console.log(`${logPrefix} 🔍 [Strategy 2] Barcode not found, trying code: ${codeUrl}`);
            const codeRes = await fetch(codeUrl, { signal: controller2.signal });
            if (codeRes.ok) {
                products = await codeRes.json();
            }
        }
        clearTimeout(timeoutId2);

        if (products.length === 0) {
            console.log(`${logPrefix} ⚠️ [Strategy 2] No product found on remote server`);
            return localFallbackLookup(remoteBranch, query, barcode, logPrefix, resolvedCompanyId);
        }

        const product = products[0];
        const productCode = product.code || "";

        // ดึงยอดคงเหลือจาก stock-balance-summary API (สูตรที่ถูกต้อง: received - sale - transferOut + transferIn + adjust)
        let totalBalance = 0;
        try {
            const summaryUrl = `${cleanUrl}/api/stock-balance-summary?company=${companyId}&itemcode=${encodeURIComponent(productCode)}`;
            console.log(`${logPrefix} 📊 [Strategy 2a] Fetching stock-balance-summary: ${summaryUrl}`);
            const controller3a = new AbortController();
            const timeoutId3a = setTimeout(() => controller3a.abort(), 10000);
            const summaryRes = await fetch(summaryUrl, { signal: controller3a.signal });
            clearTimeout(timeoutId3a);
            if (summaryRes.ok) {
                const summaryData = await summaryRes.json();
                totalBalance = summaryData?.calculatedBalance ?? 0;
                console.log(`${logPrefix} ✅ [Strategy 2a] stock-balance-summary calculatedBalance=${totalBalance}`);
            } else {
                throw new Error(`stock-balance-summary returned ${summaryRes.status}`);
            }
        } catch (summaryErr: any) {
            // Fallback to sale_balance if stock-balance-summary not available
            console.log(`${logPrefix} ⚠️ [Strategy 2a] stock-balance-summary failed: ${summaryErr.message}, trying sale_balance...`);
            const balanceUrl = `${cleanUrl}/api/sale_cal/sale_balance?company=${companyId}&code_product=${encodeURIComponent(productCode)}`;
            console.log(`${logPrefix} 💰 [Strategy 2b] Fetching balance: ${balanceUrl}`);
            const controller3 = new AbortController();
            const timeoutId3 = setTimeout(() => controller3.abort(), 10000);
            const balanceRes = await fetch(balanceUrl, { signal: controller3.signal });
            clearTimeout(timeoutId3);
            if (balanceRes.ok) {
                const balanceData = await balanceRes.json();
                totalBalance = balanceData?.[0]?.balance ?? 0;
            }
        }

        console.log(`${logPrefix} ✅ [Strategy 2] Found: ${product.ProductName}, balance=${totalBalance}`);
        return {
            branchId: remoteBranch.branchId,
            productCode: productCode,
            productName: product.ProductName || null,
            barcode: product.Barcode || barcode,
            totalBalance: totalBalance,
            hasProduct: true,
            isRemote: true,
            queriedCompanyId: companyId,
            source: "tunnel (stock-balance-summary)"
        };
    } catch (err: any) {
        const errMsg = err.name === "AbortError" ? "Timeout" : (err.message || "Network error");
        console.warn(`${logPrefix} ❌ [Strategy 2] Error: ${errMsg}`);
    }

    // === Strategy 3: Local DB fallback ===
    console.log(`${logPrefix} 🔄 Trying local DB fallback...`);
    return localFallbackLookup(remoteBranch, query, barcode, logPrefix, resolvedCompanyId);
}

// Fallback: ค้นสินค้าจาก local DB ด้วย companyId ที่ resolve จากชื่อสาขา
async function localFallbackLookup(
    remoteBranch: { branchId: string; remoteUserId: number; branchName?: string; remoteCompany?: string },
    query: string,
    barcode: string,
    logPrefix: string,
    preResolvedCompanyId?: string | null
): Promise<any> {
    try {
        // ใช้ companyId ที่ resolve แล้ว หรือ resolve ใหม่จากชื่อสาขา
        const companyId = preResolvedCompanyId
            || await resolveCompanyId(remoteBranch.branchName || "", remoteBranch.remoteCompany || "", logPrefix);

        // ถ้าหา companyId ไม่ได้ → ไม่มีข้อมูลสาขาปลายทางใน DB → คืน balance 0 แต่แสดงชื่อสินค้าจาก DB ทั่วไป
        if (!companyId) {
            console.log(`${logPrefix} 🔄 Local fallback: no companyId resolved, looking up product info with balance 0`);
            const searchPattern = `%${barcode || query}%`;
            const anyProduct: any[] = await prisma.$queryRaw`
                SELECT "code", "ProductName", "Barcode" FROM "Datalist"
                WHERE (
                    COALESCE("Barcode", '') ILIKE ${searchPattern}
                    OR COALESCE("code", '') ILIKE ${searchPattern}
                    OR COALESCE("ProductName", '') ILIKE ${searchPattern}
                )
                ORDER BY "code" ASC LIMIT 1
            `;
            const p = anyProduct?.[0];
            return { branchId: remoteBranch.branchId, productCode: p?.code || null, productName: p?.ProductName || null, barcode: p?.Barcode || barcode, totalBalance: 0, hasProduct: true, isRemote: true, queriedCompanyId: "N/A", source: "localFallback (no company)" };
        }
        const searchPattern = `%${barcode || query}%`;

        console.log(`${logPrefix} 🔄 Local fallback: searching with companyId=${companyId}, pattern=${searchPattern}`);

        const products: any[] = await prisma.$queryRaw`
            SELECT * FROM "Datalist"
            WHERE "company" = ${companyId}
              AND (
                COALESCE("Barcode", '') ILIKE ${searchPattern}
                OR COALESCE("code", '') ILIKE ${searchPattern}
                OR COALESCE("ProductName", '') ILIKE ${searchPattern}
              )
            ORDER BY "code" ASC
            LIMIT 1
        `;

        if (products.length === 0) {
            console.log(`${logPrefix} 🔄 Local fallback: no product found for company=${companyId}`);
            return { branchId: remoteBranch.branchId, productCode: null, productName: null, barcode, totalBalance: 0, hasProduct: false, isRemote: true, remoteError: `ไม่พบสินค้าในสาขาปลายทาง (company=${companyId})` };
        }

        const product = products[0];
        const prodBarcode = product.Barcode || "";

        // คำนวณยอดคงเหลือด้วย helper กลาง (สูตรเดียวกับ /api/stock-balance-summary)
        const breakdown = await computeStockBalance({
            company: companyId,
            itemcode: product.code || "",
            barcode: prodBarcode,
        });
        const totalBalance = breakdown.calculatedBalance;

        console.log(`${logPrefix} 🔄 Local fallback: found ${product.ProductName}, balance=${totalBalance}, companyId=${companyId}`);
        return {
            branchId: remoteBranch.branchId,
            productCode: product.code,
            productName: product.ProductName,
            barcode: prodBarcode,
            totalBalance: totalBalance,
            hasProduct: true,
            isRemote: true,
            queriedCompanyId: companyId,
            source: "localFallback"
        };
    } catch (fallbackErr: any) {
        console.warn(`${logPrefix} 🔄 Local fallback also failed:`, fallbackErr.message);
        return { branchId: remoteBranch.branchId, productCode: null, productName: null, barcode, totalBalance: 0, hasProduct: false, isRemote: true, remoteError: "ค้นหาล้มเหลว" };
    }
}

// POST: ค้นหาสินค้าจาก barcode/code/name แล้วคืนข้อมูลคงเหลือแต่ละสาขา
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { query, mainCompanyId, branchIds, remoteBranches } = body;

        if (!query || !mainCompanyId) {
            return NextResponse.json(
                { error: "query and mainCompanyId are required" },
                { status: 400 }
            );
        }

        const searchPattern = `%${query}%`;

        // สินค้าหนึ่งหน่วยมีบาร์โค้ดได้หลายตัว — สแกนบาร์โค้ดสำรองต้องเจอสินค้าเจ้าของ
        // ตัวเดียวกัน จากนั้นทุกอย่างต่อจากนี้ (ยอดคงเหลือ / lot / เอกสารโอน) ยังใช้
        // product.Barcode ซึ่งเป็นบาร์โค้ดหลักตามเดิม → ยอดโอนคำนวณเหมือนเดิมทุกประการ
        const aliasCodes = await productCodesMatchingAlias(String(mainCompanyId), query, "contains");

        // 1. ค้นหาสินค้าจาก Datalist ของสาขาหลัก
        const mainProducts: any[] = await prisma.$queryRaw`
            SELECT * FROM "Datalist"
            WHERE "company" = ${String(mainCompanyId)}
              AND (
                COALESCE("Barcode", '') ILIKE ${searchPattern}
                OR COALESCE("code", '') ILIKE ${searchPattern}
                OR COALESCE("ProductName", '') ILIKE ${searchPattern}
                OR COALESCE("code", '') = ANY(${aliasCodes}::text[])
              )
            ORDER BY "code" ASC
            LIMIT 20
        `;

        if (mainProducts.length === 0) {
            return NextResponse.json([]);
        }

        // 2. สำหรับแต่ละสินค้า ดึงยอดคงเหลือจาก RCitemlist ของสาขาหลัก
        const results = [];

        for (const product of mainProducts) {
            const barcode = product.Barcode || "";

            // ยอดคงเหลือสาขาหลัก: ใช้ helper กลาง (สูตรเดียวกับ /api/stock-balance-summary)
            const mainBreakdown = await computeStockBalance({
                company: String(mainCompanyId),
                itemcode: product.code || "",
                barcode,
            });
            const mainTotalBalance = mainBreakdown.calculatedBalance;

            // ดึงรายการ Lot สำหรับเลือกโอน — ใช้สูตรกลางเดียวกับหน้า Lot สินค้า/ปุ่มยืนยันโอน
            // ยอดที่โอนได้ = min(balance ที่บันทึกจริง, ยอดคำนวณจาก transaction)
            const calculatedMainLots = await getLotsWithCalculatedBalance({
                company: String(mainCompanyId),
                itemcode: product.code || "",
                barcode
            });

            const availableLots = calculatedMainLots
                .map(lot => ({
                    id: lot.id,
                    lot: lot.lot,
                    dateExp: lot.dateExp,
                    qty: lot.qty,
                    // ทุนสุทธิหลังหักส่วนลด (src/lib/lotCost.ts) — สาขาปลายทางรับต้นทุนที่จ่ายจริง
                    newCost: lotUnitCost(lot),
                    itemcode: lot.itemcode,
                    itemName: lot.itemName,
                    unit: lot.unit,
                    codevender: lot.codevender,
                    namevender: lot.namevender,
                    type: lot.type,
                    subtype: lot.subtype,
                    Barcode: lot.Barcode,
                    balance: transferableLotQty(lot)
                }))
                .filter(lot => lot.balance > 0)
                .sort((a, b) => {
                    const da = a.dateExp ? new Date(a.dateExp).getTime() : Number.MAX_SAFE_INTEGER;
                    const db = b.dateExp ? new Date(b.dateExp).getTime() : Number.MAX_SAFE_INTEGER;
                    return da - db; // FEFO: หมดอายุก่อน ขึ้นก่อน
                });

            // 3. ยอดคงเหลือแต่ละสาขาปลายทาง (local)
            const branchBalances: any[] = [];

            if (branchIds && Array.isArray(branchIds)) {
                for (const branchId of branchIds) {
                    // ค้นหาสินค้าจาก Datalist ของสาขาปลายทาง (ด้วย Barcode)
                    let branchProduct = null;
                    if (barcode) {
                        branchProduct = await prisma.datalist.findFirst({
                            where: {
                                company: String(branchId),
                                Barcode: barcode
                            }
                        });
                    }

                    // ยอดคงเหลือสาขาปลายทาง: ใช้ helper กลาง
                    const branchItemCode = branchProduct?.code || product.code || '';
                    const branchBreakdown = await computeStockBalance({
                        company: String(branchId),
                        itemcode: branchItemCode,
                        barcode: branchProduct?.Barcode || barcode,
                    });

                    branchBalances.push({
                        branchId: branchId,
                        productCode: branchProduct?.code || null,
                        productName: branchProduct?.ProductName || null,
                        barcode: branchProduct?.Barcode || barcode,
                        totalBalance: branchBreakdown.calculatedBalance,
                        hasProduct: !!branchProduct,
                        isRemote: false
                    });
                }
            }

            // 4. ยอดคงเหลือสาขาปลายทาง (remote ผ่าน Tunnel)
            if (remoteBranches && Array.isArray(remoteBranches)) {
                const remotePromises = remoteBranches.map((rb: any) =>
                    remoteBranchLookup(rb, query, barcode)
                );
                const remoteResults = await Promise.all(remotePromises);
                branchBalances.push(...remoteResults);
            }

            results.push({
                // ข้อมูลสินค้าหลัก (จาก Datalist)
                id: product.id,
                code: product.code,
                ProductName: product.ProductName,
                Barcode: barcode,
                Unit: product.Unit,
                CostActual: product.CostActual,
                // นโยบาย lot — false = หน้าโอนไม่ต้องให้ผู้ใช้เลือก lot (ระบบปันส่วนให้เอง)
                requireLot: (product as any).requireLot !== false,
                // ยอดคงเหลือสาขาหลัก (คำนวณจาก รับ - ขาย)
                mainTotalBalance: mainTotalBalance,
                mainLots: availableLots,
                // ยอดคงเหลือแต่ละสาขา
                branchBalances: branchBalances
            });
        }

        return NextResponse.json(results);
    } catch (error) {
        console.error("Error in branch-lookup:", error);
        return NextResponse.json(
            { error: "Failed to lookup branch products" },
            { status: 500 }
        );
    }
}
