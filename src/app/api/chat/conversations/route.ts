import { NextRequest, NextResponse } from 'next/server';
import { getConversations, getUnreadCount } from '@/lib/chat/chat-service';

// GET /api/chat/conversations?company=xxx&status=open&search=xxx
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const company = searchParams.get('company') || '';
    const status = searchParams.get('status') || 'all';
    const search = searchParams.get('search') || '';

    if (!company) {
      return NextResponse.json({ error: 'Company required' }, { status: 400 });
    }

    const conversations = await getConversations(company, status, search);
    const unreadCount = await getUnreadCount(company);

    return NextResponse.json({ conversations, unreadCount });
  } catch (error: any) {
    console.error('Chat conversations error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
