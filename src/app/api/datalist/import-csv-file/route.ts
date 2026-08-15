import { NextRequest } from 'next/server'
import * as XLSX from 'xlsx'
import { normalizeRequireLot } from '@/lib/lotPolicy'

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
    const overwrite = formData.get('overwrite') === 'true';

    if (!file) {
      return Response.json({ error: 'ไม่พบไฟล์' }, { status: 400 });
    }

    if (!company) {
      return Response.json({ error: 'ไม่พบข้อมูล company' }, { status: 400 });
    }

    const fileName = file.name.toLowerCase();
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
    
    let header: string[] = [];
    let dataLines: string[][] = [];

    if (isExcel) {
      // Parse Excel file
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0]; // Sheet1
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1 });
      
      if (jsonData.length < 2) {
        return Response.json({ error: 'ไฟล์ไม่มีข้อมูล' }, { status: 400 });
      }
      
      header = (jsonData[0] as string[]).map(h => String(h || '').trim().toLowerCase());
      dataLines = jsonData.slice(1) as string[][];
    } else {
      // Parse CSV file
      const csvContent = await file.text();
      const lines = csvContent.split('\n').filter(line => line.trim() !== '');
      
      if (lines.length < 2) {
        return Response.json({ error: 'ไฟล์ไม่มีข้อมูล' }, { status: 400 });
      }
      
      header = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      // Parse CSV lines to arrays
      dataLines = lines.slice(1).map(line => {
        const values: string[] = [];
        let current = '';
        let inQuotes = false;
        
        for (const char of line) {
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        values.push(current.trim());
        return values;
      });
    }
    
    // Find column indices
    const codeIndex = header.findIndex(h => h === 'code');
    const productNameIndex = header.findIndex(h => h === 'productname');
    const fixnameIndex = header.findIndex(h => h === 'fixname');
    const groupIndex = header.findIndex(h => h === 'group');
    const typeIndex = header.findIndex(h => h === 'type');
    const subtypeIndex = header.findIndex(h => h === 'subtype');
    const categoryIndex = header.findIndex(h => h === 'category');
    const drugRegistorIndex = header.findIndex(h => h === 'drugregistor');
    const areaIndex = header.findIndex(h => h === 'area');
    const unitIndex = header.findIndex(h => h === 'unit');
    const barcodeIndex = header.findIndex(h => h === 'barcode');
    const alarmExpIndex = header.findIndex(h => h === 'alarmexp');
    const remarkIndex = header.findIndex(h => h === 'remark');
    const showIndex = header.findIndex(h => h === 'show');
    const childIndex = header.findIndex(h => h === 'child');
    const ciIndex = header.findIndex(h => h === 'ci');
    const costActualIndex = header.findIndex(h => h === 'costactual');
    const priceIndex = header.findIndex(h => h === 'price');
    const wholesalepriceIndex = header.findIndex(h => h === 'wholesaleprice');
    const onlineIndex = header.findIndex(h => h === 'online');
    const priceAIndex = header.findIndex(h => h === 'pricea');
    const priceBIndex = header.findIndex(h => h === 'priceb');
    const priceCIndex = header.findIndex(h => h === 'pricec');
    const priceDIndex = header.findIndex(h => h === 'priced');
    const priceEIndex = header.findIndex(h => h === 'pricee');
    const priceFIndex = header.findIndex(h => h === 'pricef');
    const priceGIndex = header.findIndex(h => h === 'priceg');
    const priceHIndex = header.findIndex(h => h === 'priceh');
    const maxIndex = header.findIndex(h => h === 'max');
    const minIndex = header.findIndex(h => h === 'min');
    const ropIndex = header.findIndex(h => h === 'rop');
    const picIndex = header.findIndex(h => h === 'pic');
    const memberDiscountEligibleIndex = header.findIndex(h => h === 'memberdiscounteligible');
    const requireLotIndex = header.findIndex(h => h === 'requirelot');

    // Helper functions
    const parseFloat2 = (val: any) => {
      if (val === null || val === undefined || val === 'NULL' || val === '') return null;
      const num = parseFloat(String(val));
      return isNaN(num) ? null : num;
    };

    const parseString = (val: any) => {
      if (val === null || val === undefined || val === 'NULL') return null;
      return String(val);
    };

    const getValue = (values: any[], index: number) => index >= 0 ? values[index] : undefined;

    const parseBooleanDefaultTrue = (val: any) => {
      if (val === null || val === undefined || val === 'NULL' || val === '') return true;
      if (typeof val === 'boolean') return val;
      return String(val).trim().toLowerCase() === 'true';
    };

    // Parse data rows
    const dataRows = dataLines.map(values => {
      return {
        company: company,
        code: parseString(getValue(values, codeIndex)),
        ProductName: parseString(getValue(values, productNameIndex)),
        fixname: parseString(getValue(values, fixnameIndex)),
        group: parseString(getValue(values, groupIndex)),
        type: parseString(getValue(values, typeIndex)),
        subtype: parseString(getValue(values, subtypeIndex)),
        Category: parseString(getValue(values, categoryIndex)),
        DrugRegistor: parseString(getValue(values, drugRegistorIndex)),
        Area: parseString(getValue(values, areaIndex)),
        Unit: parseString(getValue(values, unitIndex)),
        Barcode: parseString(getValue(values, barcodeIndex)),
        AlarmExp: parseString(getValue(values, alarmExpIndex)),
        Remark: parseString(getValue(values, remarkIndex)),
        Show: parseString(getValue(values, showIndex)),
        Child: parseString(getValue(values, childIndex)),
        CI: parseString(getValue(values, ciIndex)),
        CostActual: parseFloat2(getValue(values, costActualIndex)),
        price: parseFloat2(getValue(values, priceIndex)),
        wholesaleprice: parseFloat2(getValue(values, wholesalepriceIndex)),
        online: parseFloat2(getValue(values, onlineIndex)),
        PriceA: parseFloat2(getValue(values, priceAIndex)),
        PriceB: parseFloat2(getValue(values, priceBIndex)),
        PriceC: parseFloat2(getValue(values, priceCIndex)),
        PriceD: parseFloat2(getValue(values, priceDIndex)),
        PriceE: parseFloat2(getValue(values, priceEIndex)),
        PriceF: parseFloat2(getValue(values, priceFIndex)),
        PriceG: parseFloat2(getValue(values, priceGIndex)),
        PriceH: parseFloat2(getValue(values, priceHIndex)),
        Max: parseFloat2(getValue(values, maxIndex)),
        Min: parseFloat2(getValue(values, minIndex)),
        ROP: parseFloat2(getValue(values, ropIndex)),
        pic: parseString(getValue(values, picIndex)),
        memberDiscountEligible: parseBooleanDefaultTrue(getValue(values, memberDiscountEligibleIndex)),
        // ไม่มีคอลัมน์ requireLot ในไฟล์ = สินค้าต้องมี lot (ค่าเริ่มต้นของระบบ)
        requireLot: normalizeRequireLot(getValue(values, requireLotIndex))
      };
    }).filter(row => row.code !== null && row.code !== '');

    // Requirement 2: Duplicate Code Check
    const incomingCodes = dataRows.map(r => r.code).filter(c => c !== null) as string[];
    if (incomingCodes.length > 0) {
      const existingDatalistCodes = await prisma.datalist.findMany({
        where: { company, code: { in: incomingCodes } },
        select: { code: true }
      });
      const existingLabeldataCodes = await prisma.labeldata.findMany({
        where: { company, code: { in: incomingCodes } },
        select: { code: true }
      });
      
      const duplicateCodes = Array.from(new Set([
        ...existingDatalistCodes.map((d: any) => d.code),
        ...existingLabeldataCodes.map((d: any) => d.code)
      ]));

      if (duplicateCodes.length > 0) {
        return Response.json({
          error: `มีรหัสสินค้าซ้ำ: ${duplicateCodes.join(', ')}`,
          duplicateCodes
        }, { status: 400 });
      }
    }

    // Requirement 1: Duplicate Barcode Check and Overwrite
    const incomingBarcodes = dataRows.map(r => r.Barcode).filter(b => b !== null) as string[];
    if (incomingBarcodes.length > 0) {
      const existingDatalistBarcodes = await prisma.datalist.findMany({
        where: { company, Barcode: { in: incomingBarcodes } },
        select: { Barcode: true }
      });
      const existingUnitConversionBarcodes = await prisma.unitConversion.findMany({
        where: { company, Barcode: { in: incomingBarcodes } },
        select: { Barcode: true }
      });
      
      const duplicateBarcodes = Array.from(new Set([
        ...existingDatalistBarcodes.map((d: any) => d.Barcode),
        ...existingUnitConversionBarcodes.map((d: any) => d.Barcode)
      ]));

      if (duplicateBarcodes.length > 0 && !overwrite) {
        return Response.json({
          requiresConfirmation: true,
          duplicateCount: duplicateBarcodes.length,
          message: `พบ Barcode ซ้ำจำนวน ${duplicateBarcodes.length} รายการ ต้องการ save ข้อมูลทับข้อมูลเดิมหรือไม่?`
        });
      }
    }

    // Process data rows
    let successCount = 0;
    if (overwrite) {
      for (const row of dataRows) {
        if (row.Barcode) {
          const existing = await prisma.datalist.findFirst({
            where: { company, Barcode: row.Barcode }
          });
          if (existing) {
            await prisma.datalist.update({
              where: { id: existing.id },
              data: row
            });
            successCount++;
            continue;
          }
        }
        await prisma.datalist.create({ data: row });
        successCount++;
      }
    } else {
      const result = await prisma.datalist.createMany({
        data: dataRows,
        skipDuplicates: true
      });
      successCount = result.count;
    }

    // Requirement 3: Duplicate and save lookup columns
    const getUnique = (field: keyof typeof dataRows[0]) => Array.from(new Set(dataRows.map(r => r[field]).filter(v => v !== null && v !== '')));

    const fixnames = getUnique('fixname');
    for (const name of fixnames) {
      const exists = await prisma.fixname.findFirst({ where: { company, list: name as string } });
      if (!exists) await prisma.fixname.create({ data: { company, list: name as string } });
    }

    const groups = getUnique('group');
    for (const name of groups) {
      const exists = await prisma.group.findFirst({ where: { company, list: name as string } });
      if (!exists) await prisma.group.create({ data: { company, list: name as string } });
    }

    const types = getUnique('type');
    for (const name of types) {
      const exists = await prisma.type.findFirst({ where: { company, list: name as string } });
      if (!exists) await prisma.type.create({ data: { company, list: name as string } });
    }

    const categories = getUnique('Category');
    for (const name of categories) {
      const exists = await prisma.getagory.findFirst({ where: { company, list: name as string } });
      if (!exists) await prisma.getagory.create({ data: { company, list: name as string } });
    }

    const areas = getUnique('Area');
    for (const name of areas) {
      const exists = await prisma.area.findFirst({ where: { company, list: name as string } });
      if (!exists) await prisma.area.create({ data: { company, list: name as string } });
    }

    const units = getUnique('Unit');
    for (const name of units) {
      const exists = await prisma.unit.findFirst({ where: { company, list: name as string } });
      if (!exists) await prisma.unit.create({ data: { company, list: name as string } });
    }

    return Response.json({
      success: true,
      count: successCount,
      message: `นำเข้าข้อมูลสำเร็จ ${successCount} รายการ`
    });

  } catch (error) {
    console.error('Import CSV error:', error);
    return Response.json(
      { error: 'Failed to import CSV data', details: String(error) },
      { status: 500 }
    );
  }
}
