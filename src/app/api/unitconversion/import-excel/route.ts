import { NextRequest } from 'next/server'
import * as XLSX from 'xlsx'

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  if (!prisma) throw new Error("Prisma is not available during build.");
  return prisma;
}

export async function POST(req: NextRequest) {
  const prisma = await getPrisma();

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const company = formData.get('company') as string;

    if (!file) {
      return Response.json({ error: 'ไม่พบไฟล์' }, { status: 400 });
    }
    if (!company) {
      return Response.json({ error: 'ไม่พบข้อมูล company' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });

    if (jsonData.length < 2) {
      return Response.json({ error: 'ไฟล์ไม่มีข้อมูล' }, { status: 400 });
    }

    const header = (jsonData[0] as string[]).map(h => String(h || '').trim().toLowerCase());
    const dataLines = jsonData.slice(1).filter(row => row.some(v => v !== undefined && v !== null && String(v).trim() !== ''));

    const idx = (name: string) => header.findIndex(h => h === name.toLowerCase());

    const productCodeIdx = idx('productCode');
    const saleUnitIdx = idx('saleUnit');
    const subQtyIdx = idx('subQty');
    const priceRetailIdx = idx('priceRetail');
    const priceWholesaleIdx = idx('priceWholesale');
    const priceOnlineIdx = idx('priceOnline');
    const priceAIdx = idx('priceA');
    const priceBIdx = idx('priceB');
    const priceCIdx = idx('priceC');
    const priceDIdx = idx('priceD');
    const priceEIdx = idx('priceE');
    const priceFIdx = idx('priceF');
    const priceGIdx = idx('priceG');
    const priceHIdx = idx('priceH');
    const barcodeIdx = idx('Barcode');

    if (productCodeIdx === -1 || saleUnitIdx === -1) {
      return Response.json({ error: 'ไฟล์ไม่ถูกต้อง: ต้องมีคอลัมน์ productCode และ saleUnit' }, { status: 400 });
    }

    const getValue = (row: any[], index: number) => index >= 0 ? row[index] : undefined;
    const parseFloat2 = (val: any) => {
      if (val === null || val === undefined || val === '') return null;
      const num = parseFloat(String(val));
      return isNaN(num) ? null : num;
    };
    const parseString = (val: any) => {
      if (val === null || val === undefined) return '';
      return String(val).trim();
    };

    const rows = dataLines.map((row, i) => ({
      lineNumber: i + 2,
      productCode: parseString(getValue(row, productCodeIdx)),
      saleUnit: parseString(getValue(row, saleUnitIdx)),
      subQty: parseFloat2(getValue(row, subQtyIdx)) ?? 1,
      priceRetail: parseFloat2(getValue(row, priceRetailIdx)),
      priceWholesale: parseFloat2(getValue(row, priceWholesaleIdx)),
      priceOnline: parseFloat2(getValue(row, priceOnlineIdx)),
      priceA: parseFloat2(getValue(row, priceAIdx)),
      priceB: parseFloat2(getValue(row, priceBIdx)),
      priceC: parseFloat2(getValue(row, priceCIdx)),
      priceD: parseFloat2(getValue(row, priceDIdx)),
      priceE: parseFloat2(getValue(row, priceEIdx)),
      priceF: parseFloat2(getValue(row, priceFIdx)),
      priceG: parseFloat2(getValue(row, priceGIdx)),
      priceH: parseFloat2(getValue(row, priceHIdx)),
      Barcode: parseString(getValue(row, barcodeIdx)),
    })).filter(row => row.productCode !== '' && row.saleUnit !== '');

    if (rows.length === 0) {
      return Response.json({ error: 'ไม่พบข้อมูลที่ถูกต้องในไฟล์' }, { status: 400 });
    }

    // Validate productCode exists in Datalist
    const productCodes = Array.from(new Set(rows.map(r => r.productCode)));
    const existingProducts = await prisma.datalist.findMany({
      where: { company, code: { in: productCodes } },
      select: { code: true },
    });
    const existingProductCodes = new Set(existingProducts.map(p => p.code));

    const invalidRows = rows.filter(r => !existingProductCodes.has(r.productCode));
    if (invalidRows.length > 0) {
      const invalidCodes = Array.from(new Set(invalidRows.map(r => r.productCode)));
      return Response.json({
        error: `ไม่พบรหัสสินค้าในระบบ: ${invalidCodes.join(', ')}`,
        invalidCodes
      }, { status: 400 });
    }

    // Check Barcode duplicates against Datalist (other products)
    const incomingBarcodes = rows.map(r => r.Barcode).filter(b => b !== '');
    if (incomingBarcodes.length > 0) {
      const conflictingDatalist = await prisma.datalist.findMany({
        where: { company, Barcode: { in: incomingBarcodes } },
        select: { code: true, Barcode: true },
      });
      const conflicts = conflictingDatalist.filter(d => {
        const row = rows.find(r => r.Barcode === d.Barcode);
        return row && row.productCode !== d.code;
      });
      if (conflicts.length > 0) {
        return Response.json({
          error: `Barcode ซ้ำกับสินค้าอื่นในระบบ: ${conflicts.map(c => c.Barcode).join(', ')}`
        }, { status: 409 });
      }
    }

    const validRows = rows;

    let createdCount = 0;
    let updatedCount = 0;

    for (const row of validRows) {
      const existing = await prisma.unitConversion.findFirst({
        where: { company, productCode: row.productCode, saleUnit: row.saleUnit },
      });

      const data = {
        company,
        productCode: row.productCode,
        qty: 1,
        saleUnit: row.saleUnit,
        subQty: row.subQty,
        subUnit: row.saleUnit,
        priceRetail: row.priceRetail,
        priceWholesale: row.priceWholesale,
        priceOnline: row.priceOnline,
        priceA: row.priceA,
        priceB: row.priceB,
        priceC: row.priceC,
        priceD: row.priceD,
        priceE: row.priceE,
        priceF: row.priceF,
        priceG: row.priceG,
        priceH: row.priceH,
        Barcode: row.Barcode || '',
      };

      if (existing) {
        await prisma.unitConversion.update({ where: { id: existing.id }, data });
        updatedCount++;
      } else {
        await prisma.unitConversion.create({ data });
        createdCount++;
      }
    }

    return Response.json({
      success: true,
      created: createdCount,
      updated: updatedCount,
      message: `นำเข้าข้อมูลสำเร็จ: เพิ่มใหม่ ${createdCount} รายการ, อัปเดต ${updatedCount} รายการ`
    });

  } catch (error) {
    console.error('Import UnitConversion Excel error:', error);
    return Response.json(
      { error: 'Failed to import Excel data', details: String(error) },
      { status: 500 }
    );
  }
}
