import { NextRequest } from 'next/server'
import * as XLSX from 'xlsx'

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  if (!prisma) throw new Error("Prisma is not available during build.");
  return prisma;
}

export async function GET(req: NextRequest) {
  const prisma = await getPrisma();

  try {
    const { searchParams } = new URL(req.url);
    const company = searchParams.get('company');

    if (!company) {
      return Response.json({ error: 'ไม่พบข้อมูล company' }, { status: 400 });
    }

    const headers = [
      'productCode', 'ProductName', 'baseUnit', 'saleUnit', 'subQty',
      'priceRetail', 'priceWholesale', 'priceOnline',
      'priceA', 'priceB', 'priceC', 'priceD', 'priceE', 'priceF', 'priceG', 'priceH',
      'Barcode'
    ];

    const exampleRow = [
      'D0001', 'ตัวอย่างสินค้า (ไม่ต้องกรอก ใช้สำหรับอ้างอิง)', 'เม็ด', 'แผง', 10,
      50, 45, 48, '', '', '', '', '', '', '', '',
      ''
    ];

    const workbook = XLSX.utils.book_new();

    // Sheet1 - Template with example row
    const templateSheet = XLSX.utils.aoa_to_sheet([headers, exampleRow]);
    templateSheet['!cols'] = headers.map(h => ({ wch: h === 'ProductName' ? 30 : 16 }));
    XLSX.utils.book_append_sheet(workbook, templateSheet, 'หน่วยในการขาย');

    // Sheet2 - Product reference list (productCode + ProductName + baseUnit)
    const products = await prisma.datalist.findMany({
      where: { company },
      select: { code: true, ProductName: true, Unit: true },
      orderBy: { code: 'asc' },
    });
    const refHeaders = ['productCode', 'ProductName', 'baseUnit'];
    const refRows = products.map(p => [p.code ?? '', p.ProductName ?? '', p.Unit ?? '']);
    const refSheet = XLSX.utils.aoa_to_sheet([refHeaders, ...refRows]);
    refSheet['!cols'] = [{ wch: 16 }, { wch: 30 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(workbook, refSheet, 'รายการสินค้า');

    // Sheet3 - Instructions
    const instructions = [
      ['คำอธิบายการกรอกข้อมูล - หน่วยในการขาย'],
      [''],
      ['คอลัมน์', 'คำอธิบาย', 'จำเป็นต้องกรอก'],
      ['productCode', 'รหัสสินค้า (ดูได้จากชีต "รายการสินค้า")', 'จำเป็น'],
      ['ProductName', 'ชื่อสินค้า (สำหรับอ้างอิงเท่านั้น ไม่ถูกบันทึก)', 'ไม่จำเป็น'],
      ['baseUnit', 'หน่วยฐานของสินค้า (สำหรับอ้างอิงเท่านั้น ไม่ถูกบันทึก)', 'ไม่จำเป็น'],
      ['saleUnit', 'ชื่อหน่วยขาย เช่น แผง, กล่อง, ลัง', 'จำเป็น'],
      ['subQty', 'จำนวนหน่วยฐานต่อ 1 หน่วยขาย เช่น 1 แผง = 10 เม็ด ให้กรอก 10', 'จำเป็น'],
      ['priceRetail', 'ราคาขายปลีกต่อหน่วยขาย', 'ไม่จำเป็น'],
      ['priceWholesale', 'ราคาขายส่งต่อหน่วยขาย', 'ไม่จำเป็น'],
      ['priceOnline', 'ราคาขายออนไลน์ต่อหน่วยขาย', 'ไม่จำเป็น'],
      ['priceA - priceH', 'ราคาตามระดับสมาชิก A-H ต่อหน่วยขาย', 'ไม่จำเป็น'],
      ['Barcode', 'บาร์โค้ดของหน่วยขายนี้ (ถ้ามี)', 'ไม่จำเป็น'],
      [''],
      ['หมายเหตุ:'],
      ['- หากสินค้าตามรหัส (productCode) และหน่วยขาย (saleUnit) มีอยู่แล้ว ระบบจะอัปเดตข้อมูลแถวนั้น'],
      ['- หากยังไม่มี ระบบจะเพิ่มเป็นหน่วยขายใหม่ให้กับสินค้านั้น'],
      ['- ลบแถวตัวอย่างก่อนนำเข้าจริง'],
    ];
    const instructionSheet = XLSX.utils.aoa_to_sheet(instructions);
    instructionSheet['!cols'] = [{ wch: 18 }, { wch: 55 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(workbook, instructionSheet, 'คำอธิบาย');

    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new Response(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="template_unitconversion_${company}.xlsx"`
      }
    });

  } catch (error) {
    console.error('Template UnitConversion Excel error:', error);
    return Response.json(
      { error: 'Failed to generate template', details: String(error) },
      { status: 500 }
    );
  }
}
