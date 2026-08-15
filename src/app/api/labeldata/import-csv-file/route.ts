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

    const fileName = file.name.toLowerCase();
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
    
    let header: string[] = [];
    let dataLines: any[][] = [];

    if (isExcel) {
      // Parse Excel file - Sheet2
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      // Get Sheet2 (index 1)
      const sheetName = workbook.SheetNames[1]; // Sheet2
      if (!sheetName) {
        return Response.json({ error: 'ไม่พบ Sheet2 ในไฟล์ Excel' }, { status: 400 });
      }
      
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
      
      if (jsonData.length < 2) {
        return Response.json({ error: 'Sheet2 ไม่มีข้อมูล' }, { status: 400 });
      }
      
      header = (jsonData[0] as any[]).map(h => String(h || '').trim().toLowerCase());
      dataLines = jsonData.slice(1) as any[][];
    } else {
      // Parse CSV file
      const csvContent = await file.text();
      const lines = csvContent.split('\n').filter(line => line.trim() !== '');
      
      if (lines.length < 2) {
        return Response.json({ error: 'ไฟล์ไม่มีข้อมูล' }, { status: 400 });
      }
      
      header = lines[0].split(',').map(h => h.trim().toLowerCase());
      
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
    
    // Find column indices for Labeldata model
    const codeIndex = header.findIndex(h => h === 'code');
    const indicatorlistSIndex = header.findIndex(h => h === 'indicatorlists');
    const timeSIndex = header.findIndex(h => h === 'times');
    const useSIndex = header.findIndex(h => h === 'uses');
    const timeuseSIndex = header.findIndex(h => h === 'timeuses');
    const keepSIndex = header.findIndex(h => h === 'keeps');
    const remarkSIndex = header.findIndex(h => h === 'remarks');

    // Helper functions
    const parseString = (val: any) => {
      if (val === null || val === undefined || val === 'NULL') return '';
      return String(val);
    };

    const getValue = (values: any[], index: number) => index >= 0 ? values[index] : undefined;

    // Parse data rows
    const dataRows = dataLines.map(values => {
      return {
        company: company,
        code: parseString(getValue(values, codeIndex)),
        indicatorlistS: parseString(getValue(values, indicatorlistSIndex)),
        timeS: parseString(getValue(values, timeSIndex)),
        useS: parseString(getValue(values, useSIndex)),
        timeuseS: parseString(getValue(values, timeuseSIndex)),
        keepS: parseString(getValue(values, keepSIndex)),
        remarkS: parseString(getValue(values, remarkSIndex))
      };
    }).filter(row => row.code !== null && row.code !== '');

    // Upsert: ถ้ามีข้อมูลฉลากยาอยู่แล้วให้อัปเดต ถ้าไม่มีให้สร้างใหม่
    let createdCount = 0;
    let updatedCount = 0;
    for (const row of dataRows) {
      const existing = await prisma.labeldata.findFirst({
        where: { company, code: row.code }
      });
      if (existing) {
        await prisma.labeldata.update({
          where: { id: existing.id },
          data: {
            indicatorlistS: row.indicatorlistS,
            timeS: row.timeS,
            useS: row.useS,
            timeuseS: row.timeuseS,
            keepS: row.keepS,
            remarkS: row.remarkS,
          }
        });
        updatedCount++;
      } else {
        await prisma.labeldata.create({ data: row });
        createdCount++;
      }
    }

    // Requirement 4: Duplicate and save lookup columns
    const getUnique = (field: keyof typeof dataRows[0]) => Array.from(new Set(dataRows.map(r => r[field]).filter(v => v !== null && v !== '')));

    const indicators = getUnique('indicatorlistS');
    for (const name of indicators) {
      const exists = await prisma.indicator.findFirst({ where: { company, list: name as string } });
      if (!exists) await prisma.indicator.create({ data: { company, list: name as string } });
    }

    const times = getUnique('timeS');
    for (const name of times) {
      const exists = await prisma.timeL.findFirst({ where: { company, list: name as string } });
      if (!exists) await prisma.timeL.create({ data: { company, list: name as string } });
    }

    const uses = getUnique('useS');
    for (const name of uses) {
      const exists = await prisma.useL.findFirst({ where: { company, list: name as string } });
      if (!exists) await prisma.useL.create({ data: { company, list: name as string } });
    }

    const timeuses = getUnique('timeuseS');
    for (const name of timeuses) {
      const exists = await prisma.timeUseL.findFirst({ where: { company, list: name as string } });
      if (!exists) await prisma.timeUseL.create({ data: { company, list: name as string } });
    }

    const keeps = getUnique('keepS');
    for (const name of keeps) {
      const exists = await prisma.keepL.findFirst({ where: { company, list: name as string } });
      if (!exists) await prisma.keepL.create({ data: { company, list: name as string } });
    }

    const remarks = getUnique('remarkS');
    for (const name of remarks) {
      const exists = await prisma.remarkL.findFirst({ where: { company, list: name as string } });
      if (!exists) await prisma.remarkL.create({ data: { company, list: name as string } });
    }

    return Response.json({
      success: true,
      count: createdCount + updatedCount,
      message: `นำเข้าข้อมูลฉลากยาสำเร็จ สร้างใหม่ ${createdCount} รายการ${updatedCount > 0 ? ` อัปเดต ${updatedCount} รายการ` : ''}`
    });

  } catch (error) {
    console.error('Import Labeldata error:', error);
    return Response.json(
      { error: 'Failed to import Labeldata', details: String(error) },
      { status: 500 }
    );
  }
}
