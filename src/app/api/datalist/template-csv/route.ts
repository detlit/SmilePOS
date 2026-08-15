import { NextRequest } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(req: NextRequest) {
  try {
    // Read template XLSX file
    const xlsxPath = path.join(process.cwd(), 'src', 'app', 'csv', 'templete_drug.xlsx');
    
    if (!fs.existsSync(xlsxPath)) {
      return Response.json({ error: 'ไม่พบไฟล์ template' }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(xlsxPath);

    // Return XLSX file
    return new Response(fileBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="template_drug.xlsx"'
      }
    });

  } catch (error) {
    console.error('Template XLSX error:', error);
    return Response.json(
      { error: 'Failed to download template', details: String(error) },
      { status: 500 }
    );
  }
}
