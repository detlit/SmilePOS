import { NextRequest } from 'next/server'

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

    // Get all datalist records for this company
    const data = await prisma.datalist.findMany({
      where: { company: company },
      select: {
        code: true,
        ProductName: true,
        fixname: true,
        group: true,
        type: true,
        subtype: true,
        Category: true,
        DrugRegistor: true,
        Area: true,
        Unit: true,
        Barcode: true,
        AlarmExp: true,
        Remark: true,
        Show: true,
        Child: true,
        CI: true,
        CostActual: true,
        price: true,
        wholesaleprice: true,
        online: true,
        PriceA: true,
        PriceB: true,
        PriceC: true,
        PriceD: true,
        PriceE: true,
        PriceF: true,
        PriceG: true,
        PriceH: true,
        Max: true,
        Min: true,
        ROP: true,
        pic: true,
        memberDiscountEligible: true,
        requireLot: true
      }
    });

    if (data.length === 0) {
      return Response.json({ error: 'ไม่พบข้อมูลสินค้า' }, { status: 404 });
    }

    // Create CSV header
    const headers = [
      'code', 'ProductName', 'fixname', 'group', 'type', 'subtype', 
      'Category', 'DrugRegistor', 'Area', 'Unit', 'Barcode', 'AlarmExp',
      'Remark', 'Show', 'Child', 'CI', 'CostActual', 'price', 
      'wholesaleprice', 'online', 'PriceA', 'PriceB', 'PriceC', 'PriceD', 'PriceE', 'PriceF', 'PriceG', 'PriceH',
      'Max', 'Min', 'ROP', 'pic', 'memberDiscountEligible', 'requireLot'
    ];

    // Create CSV content
    const csvRows = [headers.join(',')];
    
    for (const row of data) {
      const values = headers.map(header => {
        const value = (row as any)[header];
        if (value === null || value === undefined) return '';
        // Escape values with commas or quotes
        const strValue = String(value);
        if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
          return `"${strValue.replace(/"/g, '""')}"`;
        }
        return strValue;
      });
      csvRows.push(values.join(','));
    }

    const csvContent = csvRows.join('\n');

    // Return CSV file
    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="datalist_${company}_${new Date().toISOString().split('T')[0]}.csv"`
      }
    });

  } catch (error) {
    console.error('Export CSV error:', error);
    return Response.json(
      { error: 'Failed to export CSV data', details: String(error) },
      { status: 500 }
    );
  }
}
