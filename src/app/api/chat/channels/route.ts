import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/chat/channels?company=xxx
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const company = searchParams.get('company') || '';

    const channels = await prisma.chatChannel.findMany({
      where: { company },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ channels });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/chat/channels - Create or update channel
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const id = Number(body?.id) || 0;
    const company = typeof body?.company === 'string' ? body.company.trim() : '';
    const platform = typeof body?.platform === 'string' ? body.platform.trim() : '';
    const channelName = typeof body?.channelName === 'string' ? body.channelName.trim() : '';
    const accessToken = typeof body?.accessToken === 'string' ? body.accessToken.trim() : '';
    const channelSecret = typeof body?.channelSecret === 'string' ? body.channelSecret.trim() : '';
    const pageId = typeof body?.pageId === 'string' ? body.pageId.trim() : '';

    if (!platform) {
      return NextResponse.json({ error: 'platform required' }, { status: 400 });
    }

    let channel;
    if (id) {
      channel = await prisma.chatChannel.update({
        where: { id },
        data: { channelName, accessToken, channelSecret, pageId, platform },
      });
    } else {
      if (!company) {
        return NextResponse.json({ error: 'company required' }, { status: 400 });
      }

      channel = await prisma.chatChannel.create({
        data: { company, platform, channelName, accessToken, channelSecret, pageId },
      });
    }

    return NextResponse.json({ channel });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/chat/channels
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get('id') || '0');

    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    await prisma.chatChannel.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
