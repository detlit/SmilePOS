import { NextRequest } from 'next/server'
import fs from 'fs'
import path from 'path'

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  if (!prisma) throw new Error("Prisma is not available during build.");
  return prisma;
}

export async function POST(req: NextRequest) {
  const prisma = await getPrisma();
  
  try {
    // Check if sample data (company='1000') already imported (prevent duplicate import)
    const existingCount = await prisma.datalist.count({
      where: { company: '1000' }
    });
    if (existingCount > 0) {
      return Response.json(
        { error: 'ข้อมูลถูกนำเข้าแล้ว ไม่สามารถนำเข้าซ้ำได้', imported: false },
        { status: 400 }
      );
    }

    // Read CSV file
    const csvPath = path.join(process.cwd(), 'src', 'app', 'csv', 'Datalist_EX.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    
    // Parse CSV
    const lines = csvContent.split('\n').filter(line => line.trim() !== '');
    const header = lines[0].split(',');
    
    // Find column indices
    const companyIndex = header.findIndex(h => h.trim().toLowerCase() === 'company');
    const codeIndex = header.findIndex(h => h.trim().toLowerCase() === 'code');
    const productNameIndex = header.findIndex(h => h.trim().toLowerCase() === 'productname');
    const fixnameIndex = header.findIndex(h => h.trim().toLowerCase() === 'fixname');
    const groupIndex = header.findIndex(h => h.trim().toLowerCase() === 'group');
    const typeIndex = header.findIndex(h => h.trim().toLowerCase() === 'type');
    const subtypeIndex = header.findIndex(h => h.trim().toLowerCase() === 'subtype');
    const categoryIndex = header.findIndex(h => h.trim().toLowerCase() === 'category');
    const drugRegistorIndex = header.findIndex(h => h.trim().toLowerCase() === 'drugregistor');
    const areaIndex = header.findIndex(h => h.trim().toLowerCase() === 'area');
    const unitIndex = header.findIndex(h => h.trim().toLowerCase() === 'unit');
    const barcodeIndex = header.findIndex(h => h.trim().toLowerCase() === 'barcode');
    const alarmExpIndex = header.findIndex(h => h.trim().toLowerCase() === 'alarmexp');
    const remarkIndex = header.findIndex(h => h.trim().toLowerCase() === 'remark');
    const showIndex = header.findIndex(h => h.trim().toLowerCase() === 'show');
    const childIndex = header.findIndex(h => h.trim().toLowerCase() === 'child');
    const ciIndex = header.findIndex(h => h.trim().toLowerCase() === 'ci');
    const costActualIndex = header.findIndex(h => h.trim().toLowerCase() === 'costactual');
    const priceIndex = header.findIndex(h => h.trim().toLowerCase() === 'price');
    const wholesalepriceIndex = header.findIndex(h => h.trim().toLowerCase() === 'wholesaleprice');
    const onlineIndex = header.findIndex(h => h.trim().toLowerCase() === 'online');
    const priceAIndex = header.findIndex(h => h.trim().toLowerCase() === 'pricea');
    const priceBIndex = header.findIndex(h => h.trim().toLowerCase() === 'priceb');
    const priceCIndex = header.findIndex(h => h.trim().toLowerCase() === 'pricec');
    const priceDIndex = header.findIndex(h => h.trim().toLowerCase() === 'priced');
    const priceEIndex = header.findIndex(h => h.trim().toLowerCase() === 'pricee');
    const priceFIndex = header.findIndex(h => h.trim().toLowerCase() === 'pricef');
    const priceGIndex = header.findIndex(h => h.trim().toLowerCase() === 'priceg');
    const priceHIndex = header.findIndex(h => h.trim().toLowerCase() === 'priceh');
    const maxIndex = header.findIndex(h => h.trim().toLowerCase() === 'max');
    const minIndex = header.findIndex(h => h.trim().toLowerCase() === 'min');
    const ropIndex = header.findIndex(h => h.trim().toLowerCase() === 'rop');
    const picIndex = header.findIndex(h => h.trim().toLowerCase() === 'pic');

    // Parse data rows (skip header)
    const dataRows = lines.slice(1).map(line => {
      // Handle CSV with quoted values containing commas
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

      const parseFloat2 = (val: string) => {
        if (!val || val === 'NULL' || val === '') return null;
        const num = parseFloat(val);
        return isNaN(num) ? null : num;
      };

      const parseString = (val: string) => {
        if (!val || val === 'NULL') return null;
        return val;
      };
      
      return {
        company: parseString(values[companyIndex]),
        code: parseString(values[codeIndex]),
        ProductName: parseString(values[productNameIndex]),
        fixname: parseString(values[fixnameIndex]),
        group: parseString(values[groupIndex]),
        type: parseString(values[typeIndex]),
        subtype: parseString(values[subtypeIndex]),
        Category: parseString(values[categoryIndex]),
        DrugRegistor: parseString(values[drugRegistorIndex]),
        Area: parseString(values[areaIndex]),
        Unit: parseString(values[unitIndex]),
        Barcode: parseString(values[barcodeIndex]),
        AlarmExp: parseString(values[alarmExpIndex]),
        Remark: parseString(values[remarkIndex]),
        Show: parseString(values[showIndex]),
        Child: parseString(values[childIndex]),
        CI: parseString(values[ciIndex]),
        CostActual: parseFloat2(values[costActualIndex]),
        price: parseFloat2(values[priceIndex]),
        wholesaleprice: parseFloat2(values[wholesalepriceIndex]),
        online: parseFloat2(values[onlineIndex]),
        PriceA: parseFloat2(values[priceAIndex]),
        PriceB: parseFloat2(values[priceBIndex]),
        PriceC: parseFloat2(values[priceCIndex]),
        PriceD: parseFloat2(values[priceDIndex]),
        PriceE: parseFloat2(values[priceEIndex]),
        PriceF: parseFloat2(values[priceFIndex]),
        PriceG: parseFloat2(values[priceGIndex]),
        PriceH: parseFloat2(values[priceHIndex]),
        Max: parseFloat2(values[maxIndex]),
        Min: parseFloat2(values[minIndex]),
        ROP: parseFloat2(values[ropIndex]),
        pic: parseString(values[picIndex])
      };
    }).filter(row => row.code !== null && row.code !== '');

    // Insert data in bulk
    const result = await prisma.datalist.createMany({
      data: dataRows,
      skipDuplicates: true
    });

    return Response.json({
      success: true,
      imported: true,
      count: result.count,
      message: `นำเข้าข้อมูลสำเร็จ ${result.count} รายการ`
    });

  } catch (error) {
    console.error('Import CSV error:', error);
    return Response.json(
      { error: 'Failed to import CSV data', details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  const prisma = await getPrisma();
  
  try {
    const count = await prisma.datalist.count({
      where: { company: '1000' }
    });
    return Response.json({
      imported: count > 0,
      count
    });
  } catch (error) {
    return Response.json(
      { error: 'Failed to check import status' },
      { status: 500 }
    );
  }
}
