import { NextRequest, NextResponse } from 'next/server';
import { getMessages, markAsRead, sendAgentMessage } from '@/lib/chat/chat-service';

// GET /api/chat/messages?conversationId=xxx&limit=50&before=xxx
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const conversationId = parseInt(searchParams.get('conversationId') || '0');
    const limit = parseInt(searchParams.get('limit') || '50');
    const before = searchParams.get('before') ? parseInt(searchParams.get('before')!) : undefined;

    if (!conversationId) {
      return NextResponse.json({ error: 'conversationId required' }, { status: 400 });
    }

    const messages = await getMessages(conversationId, limit, before);

    // Mark as read
    await markAsRead(conversationId);

    return NextResponse.json({ messages });
  } catch (error: any) {
    console.error('Chat messages error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/chat/messages - Send a message from agent
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { conversationId, agentName, content, messageType, mediaUrl, origin } = body;

    if (!conversationId || !content) {
      return NextResponse.json({ error: 'conversationId and content required' }, { status: 400 });
    }

    // Resolve base URL: prefer origin from frontend, fallback to request headers
    let baseUrl = typeof origin === 'string' && origin ? origin : '';
    if (!baseUrl) {
      const proto = req.headers.get('x-forwarded-proto') || 'https';
      const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || '';
      baseUrl = host ? `${proto}://${host}` : '';
    }
    console.log('[Chat] baseUrl resolved:', baseUrl, 'mediaUrl:', mediaUrl);

    const message = await sendAgentMessage(
      conversationId,
      agentName || 'Agent',
      content,
      messageType || 'text',
      mediaUrl,
      baseUrl,
    );

    return NextResponse.json({ message });
  } catch (error: any) {
    console.error('Send message error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
