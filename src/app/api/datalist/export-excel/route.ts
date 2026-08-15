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

    // Get Datalist data (hide id and company)
    const datalistData = await prisma.datalist.findMany({
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

    // Get Labeldata data (hide id and company)
    const labeldataData = await prisma.labeldata.findMany({
      where: { company: company },
      select: {
        code: true,
        indicatorlistS: true,
        timeS: true,
        useS: true,
        timeuseS: true,
        keepS: true,
        remarkS: true
      }
    });

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Sheet1 - Datalist
    const datalistHeaders = [
      'code', 'ProductName', 'fixname', 'group', 'type', 'subtype', 
      'Category', 'DrugRegistor', 'Area', 'Unit', 'Barcode', 'AlarmExp',
      'Remark', 'Show', 'Child', 'CI', 'CostActual', 'price', 
      'wholesaleprice', 'online', 'PriceA', 'PriceB', 'PriceC', 'PriceD', 'PriceE', 'PriceF', 'PriceG', 'PriceH',
      'Max', 'Min', 'ROP', 'pic', 'memberDiscountEligible', 'requireLot'
    ];
    
    const datalistRows = datalistData.map(row => 
      datalistHeaders.map(header => (row as any)[header] ?? '')
    );
    
    const datalistSheet = XLSX.utils.aoa_to_sheet([datalistHeaders, ...datalistRows]);
    XLSX.utils.book_append_sheet(workbook, datalistSheet, 'Sheet1');

    // Sheet2 - Labeldata
    const labeldataHeaders = ['code', 'indicatorlistS', 'timeS', 'useS', 'timeuseS', 'keepS', 'remarkS'];
    
    const labeldataRows = labeldataData.map(row => 
      labeldataHeaders.map(header => (row as any)[header] ?? '')
    );
    
    const labeldataSheet = XLSX.utils.aoa_to_sheet([labeldataHeaders, ...labeldataRows]);
    XLSX.utils.book_append_sheet(workbook, labeldataSheet, 'Sheet2');

    // Generate Excel buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Return Excel file
    return new Response(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="data_${company}_${new Date().toISOString().split('T')[0]}.xlsx"`
      }
    });

  } catch (error) {
    console.error('Export Excel error:', error);
    return Response.json(
      { error: 'Failed to export Excel data', details: String(error) },
      { status: 500 }
    );
  }
}
