import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const FB_API = 'https://graph.facebook.com/v19.0';

/**
 * POST /api/chat/facebook-token
 * 
 * Exchanges a short-lived Facebook token for a permanent Page Access Token.
 * Flow:
 *   1. Short-lived User Token → Long-lived User Token (60 days)
 *   2. Long-lived User Token → Permanent Page Access Token (never expires)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { channelId, shortLivedToken, appId, appSecret } = body;

    if (!shortLivedToken || !appId || !appSecret) {
      return NextResponse.json({
        error: 'ต้องกรอก Short-Lived Token, App ID และ App Secret',
      }, { status: 400 });
    }

    // Step 1: Exchange short-lived token for long-lived user token
    console.log('[FB Token] Step 1: Exchanging for long-lived user token...');
    const longLivedRes = await fetch(
      `${FB_API}/oauth/access_token?` +
      `grant_type=fb_exchange_token&` +
      `client_id=${encodeURIComponent(appId)}&` +
      `client_secret=${encodeURIComponent(appSecret)}&` +
      `fb_exchange_token=${encodeURIComponent(shortLivedToken)}`
    );
    const longLivedData = await longLivedRes.json();

    if (!longLivedRes.ok || longLivedData.error) {
      console.error('[FB Token] Step 1 failed:', longLivedData);
      return NextResponse.json({
        error: `แลก Long-Lived Token ไม่สำเร็จ: ${longLivedData.error?.message || 'Unknown error'}`,
      }, { status: 400 });
    }

    const longLivedUserToken = longLivedData.access_token;
    console.log('[FB Token] Step 1 success: Got long-lived user token');

    // Step 2: Get all pages the user manages
    console.log('[FB Token] Step 2: Getting page access tokens...');
    const pagesRes = await fetch(
      `${FB_API}/me/accounts?access_token=${encodeURIComponent(longLivedUserToken)}`
    );
    const pagesData = await pagesRes.json();

    if (!pagesRes.ok || pagesData.error) {
      console.error('[FB Token] Step 2 failed:', pagesData);
      return NextResponse.json({
        error: `ดึงข้อมูล Pages ไม่สำเร็จ: ${pagesData.error?.message || 'Unknown error'}`,
      }, { status: 400 });
    }

    const pages = (pagesData.data || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      accessToken: p.access_token,
    }));

    if (pages.length === 0) {
      return NextResponse.json({
        error: 'ไม่พบ Page ที่คุณจัดการ กรุณาตรวจสอบสิทธิ์ของ Token',
      }, { status: 400 });
    }

    // If channelId provided and there's a matching pageId, auto-save
    if (channelId) {
      const channel = await prisma.chatChannel.findUnique({ where: { id: Number(channelId) } });
      if (channel && channel.pageId) {
        const matchedPage = pages.find((p: any) => p.id === channel.pageId);
        if (matchedPage) {
          await prisma.chatChannel.update({
            where: { id: Number(channelId) },
            data: { accessToken: matchedPage.accessToken },
          });
          console.log(`[FB Token] Auto-saved permanent token for page ${matchedPage.name} (${matchedPage.id})`);
          return NextResponse.json({
            success: true,
            message: `บันทึก Permanent Token สำหรับ ${matchedPage.name} เรียบร้อย`,
            page: { id: matchedPage.id, name: matchedPage.name },
            pages,
          });
        }
      }
    }

    // Return pages list so user can pick one
    return NextResponse.json({
      success: true,
      message: `พบ ${pages.length} Page(s) — เลือก Page เพื่อบันทึก Token`,
      pages,
    });
  } catch (error: any) {
    console.error('[FB Token] Error:', error);
    return NextResponse.json({ error: error.message || 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}

/**
 * PATCH /api/chat/facebook-token
 * Save selected page token to channel
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { channelId, pageAccessToken, pageId, pageName } = body;

    if (!channelId || !pageAccessToken) {
      return NextResponse.json({ error: 'channelId and pageAccessToken required' }, { status: 400 });
    }

    await prisma.chatChannel.update({
      where: { id: Number(channelId) },
      data: {
        accessToken: pageAccessToken,
        ...(pageId ? { pageId } : {}),
      },
    });

    console.log(`[FB Token] Saved permanent token for channel ${channelId}, page: ${pageName || pageId}`);

    return NextResponse.json({
      success: true,
      message: `บันทึก Permanent Token สำหรับ ${pageName || 'Page'} เรียบร้อย`,
    });
  } catch (error: any) {
    console.error('[FB Token] Patch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
