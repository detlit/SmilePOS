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
    // Check if sample data (company='A') already imported (prevent duplicate import)
    const existingCount = await prisma.methodlist.count({
      where: { company: 'A' }
    });
    if (existingCount > 0) {
      return Response.json(
        { error: 'ข้อมูลถูกนำเข้าแล้ว ไม่สามารถนำเข้าซ้ำได้', imported: false },
        { status: 400 }
      );
    }

    // Read CSV file
    const csvPath = path.join(process.cwd(), 'src', 'app', 'csv', 'Methodlistedit.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    
    // Parse CSV
    const lines = csvContent.split('\n').filter(line => line.trim() !== '');
    const header = lines[0].split(',');
    
    // Find column indices
    const companyIndex = header.findIndex(h => h.trim().toLowerCase() === 'company');
    const listIndex = header.findIndex(h => h.trim().toLowerCase() === 'list');
    const qtyIndex = header.findIndex(h => h.trim().toLowerCase() === 'qty');
    const unitIndex = header.findIndex(h => h.trim().toLowerCase() === 'unit');
    const fullnameIndex = header.findIndex(h => h.trim().toLowerCase() === 'fullname');
    const listEngIndex = header.findIndex(h => h.trim().toLowerCase() === 'list_eng');
    const listKmIndex = header.findIndex(h => h.trim().toLowerCase() === 'list_km');
    const listLoIndex = header.findIndex(h => h.trim().toLowerCase() === 'list_lo');
    const listMyIndex = header.findIndex(h => h.trim().toLowerCase() === 'list_my');
    const listZhIndex = header.findIndex(h => h.trim().toLowerCase() === 'list_zh');
    
    if (listIndex === -1 || companyIndex === -1) {
      return Response.json(
        { error: 'Invalid CSV format: missing list or company column' },
        { status: 400 }
      );
    }

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
      
      return {
        company: values[companyIndex] || '',
        list: values[listIndex] || '',
        qty: qtyIndex !== -1 ? (values[qtyIndex] || '') : '',
        unit: unitIndex !== -1 ? (values[unitIndex] || '') : '',
        fullname: fullnameIndex !== -1 ? (values[fullnameIndex] || '') : '',
        list_eng: listEngIndex !== -1 ? (values[listEngIndex] || '') : '',
        list_km: listKmIndex !== -1 ? (values[listKmIndex] || '') : '',
        list_lo: listLoIndex !== -1 ? (values[listLoIndex] || '') : '',
        list_my: listMyIndex !== -1 ? (values[listMyIndex] || '') : '',
        list_zh: listZhIndex !== -1 ? (values[listZhIndex] || '') : ''
      };
    }).filter(row => row.list !== '');

    // Insert data in bulk
    const result = await prisma.methodlist.createMany({
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
    const count = await prisma.methodlist.count({
      where: { company: 'A' }
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
