import { NextRequest, NextResponse } from 'next/server';
import { runHourlySummaryForAll, runDailySummaryForAll, runWeeklyTopForAll } from '@/lib/telegram/summary';
import { cfgCronSecret } from '@/lib/telegram/config';

// Endpoint ให้ Windows Task Scheduler หรือ cron ภายนอกเรียก
// GET /api/telegram/cron/hourly?secret=xxx  → ส่งสรุปรายชั่วโมง
// GET /api/telegram/cron/daily?secret=xxx   → ส่งสรุปรายวัน
// GET /api/telegram/cron/weekly?secret=xxx  → ส่ง Top 10 สินค้าประจำสัปดาห์

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ type: string }> }
) {
  try {
    const params = await context.params;
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get('secret') || '';

    const expected = cfgCronSecret();
    if (expected && secret !== expected) {
      return NextResponse.json({ error: 'invalid secret' }, { status: 401 });
    }

    if (params.type === 'hourly') {
      await runHourlySummaryForAll();
      return NextResponse.json({ ok: true, type: 'hourly', at: new Date().toISOString() });
    }
    if (params.type === 'daily') {
      await runDailySummaryForAll();
      return NextResponse.json({ ok: true, type: 'daily', at: new Date().toISOString() });
    }
    if (params.type === 'weekly') {
      await runWeeklyTopForAll();
      return NextResponse.json({ ok: true, type: 'weekly', at: new Date().toISOString() });
    }
    return NextResponse.json({ error: 'unknown type' }, { status: 400 });
  } catch (error: any) {
    console.error('[Telegram cron]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
