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
    const existingCount = await prisma.labeldata.count({
      where: { company: '1000' }
    });
    if (existingCount > 0) {
      return Response.json(
        { error: 'ข้อมูลถูกนำเข้าแล้ว ไม่สามารถนำเข้าซ้ำได้', imported: false },
        { status: 400 }
      );
    }

    // Read CSV file
    const csvPath = path.join(process.cwd(), 'src', 'app', 'csv', 'Labeldata_EX.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    
    // Parse CSV
    const lines = csvContent.split('\n').filter(line => line.trim() !== '');
    const header = lines[0].split(',');
    
    // Find column indices
    const companyIndex = header.findIndex(h => h.trim().toLowerCase() === 'company');
    const codeIndex = header.findIndex(h => h.trim().toLowerCase() === 'code');
    const indicatorlistSIndex = header.findIndex(h => h.trim().toLowerCase() === 'indicatorlists');
    const timeSIndex = header.findIndex(h => h.trim().toLowerCase() === 'times');
    const useSIndex = header.findIndex(h => h.trim().toLowerCase() === 'uses');
    const timeuseSIndex = header.findIndex(h => h.trim().toLowerCase() === 'timeuses');
    const keepSIndex = header.findIndex(h => h.trim().toLowerCase() === 'keeps');
    const remarkSIndex = header.findIndex(h => h.trim().toLowerCase() === 'remarks');

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

      const parseString = (val: string) => {
        if (!val || val === 'NULL') return null;
        return val;
      };
      
      return {
        company: parseString(values[companyIndex]),
        code: parseString(values[codeIndex]),
        indicatorlistS: parseString(values[indicatorlistSIndex]) || '',
        timeS: parseString(values[timeSIndex]) || '',
        useS: parseString(values[useSIndex]) || '',
        timeuseS: parseString(values[timeuseSIndex]) || '',
        keepS: parseString(values[keepSIndex]) || '',
        remarkS: parseString(values[remarkSIndex]) || ''
      };
    }).filter(row => row.code !== null && row.code !== '');

    // Insert data in bulk
    const result = await prisma.labeldata.createMany({
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
    const count = await prisma.labeldata.count({
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
