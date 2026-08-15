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
    // Check if data already imported (prevent duplicate import)
    const existingCount = await prisma.getagory.count();
    if (existingCount > 0) {
      return Response.json(
        { error: 'ข้อมูลถูกนำเข้าแล้ว ไม่สามารถนำเข้าซ้ำได้', imported: false },
        { status: 400 }
      );
    }

    // Read CSV file
    const csvPath = path.join(process.cwd(), 'src', 'app', 'csv', 'getagory.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    
    // Parse CSV
    const lines = csvContent.split('\n').filter(line => line.trim() !== '');
    const header = lines[0].split(',');
    
    // Find column indices
    const listIndex = header.findIndex(h => h.trim().toLowerCase() === 'list');
    const companyIndex = header.findIndex(h => h.trim().toLowerCase() === 'company');
    
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
        list: values[listIndex] || '',
        company: values[companyIndex] || ''
      };
    }).filter(row => row.list !== '');

    // Insert data in bulk
    const result = await prisma.getagory.createMany({
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
    const count = await prisma.getagory.count();
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
