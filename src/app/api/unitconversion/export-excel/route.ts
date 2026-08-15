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

    const unitConversions = await prisma.unitConversion.findMany({
      where: { company },
      orderBy: [{ productCode: 'asc' }, { id: 'asc' }],
    });

    const productCodes = Array.from(new Set(unitConversions.map(u => u.productCode).filter((c): c is string => !!c)));

    const products = await prisma.datalist.findMany({
      where: { company, code: { in: productCodes } },
      select: { code: true, ProductName: true, Unit: true },
    });
    const productMap = new Map(products.map(p => [p.code, p]));

    const headers = [
      'productCode', 'ProductName', 'baseUnit', 'saleUnit', 'subQty',
      'priceRetail', 'priceWholesale', 'priceOnline',
      'priceA', 'priceB', 'priceC', 'priceD', 'priceE', 'priceF', 'priceG', 'priceH',
      'Barcode'
    ];

    const rows = unitConversions.map(u => {
      const product = productMap.get(u.productCode || '');
      return [
        u.productCode ?? '',
        product?.ProductName ?? '',
        product?.Unit ?? '',
        u.saleUnit ?? '',
        u.subQty ?? '',
        u.priceRetail ?? '',
        u.priceWholesale ?? '',
        u.priceOnline ?? '',
        u.priceA ?? '',
        u.priceB ?? '',
        u.priceC ?? '',
        u.priceD ?? '',
        u.priceE ?? '',
        u.priceF ?? '',
        u.priceG ?? '',
        u.priceH ?? '',
        u.Barcode ?? '',
      ];
    });

    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    sheet['!cols'] = headers.map(() => ({ wch: 16 }));
    XLSX.utils.book_append_sheet(workbook, sheet, 'หน่วยในการขาย');

    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new Response(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="unitconversion_${company}_${new Date().toISOString().split('T')[0]}.xlsx"`
      }
    });

  } catch (error) {
    console.error('Export UnitConversion Excel error:', error);
    return Response.json(
      { error: 'Failed to export Excel data', details: String(error) },
      { status: 500 }
    );
  }
}
