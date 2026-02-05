// src/app/api/push/send/route.ts
// N8N에서 이 API를 호출하면 모든 구독자에게 푸시 알림 발송

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// VAPID 설정
webpush.setVapidDetails(
  'mailto:navcp@navcp.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // API Key 인증 (N8N에서 보내는 키)
    const authHeader = request.headers.get('x-api-key');
    if (authHeader !== process.env.PUSH_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, body, url, tag } = await request.json();

    // 모든 구독자 가져오기
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*');

    if (error || !subscriptions) {
      return NextResponse.json({ error: 'No subscriptions' }, { status: 500 });
    }

    const payload = JSON.stringify({
      title: title || '투자나침반',
      body: body || '새로운 분석이 업데이트되었습니다.',
      url: url || '/dashboard',
      tag: tag || 'navcp-signal',
    });

    // 모든 구독자에게 전송
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            payload
          );
          return { endpoint: sub.endpoint, status: 'sent' };
        } catch (err: any) {
          // 410 Gone = 구독 만료 → DB에서 삭제
          if (err.statusCode === 410 || err.statusCode === 404) {
            await supabase
              .from('push_subscriptions')
              .delete()
              .eq('endpoint', sub.endpoint);
          }
          return { endpoint: sub.endpoint, status: 'failed', error: err.message };
        }
      })
    );

    const sent = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    return NextResponse.json({ sent, failed, total: subscriptions.length });
  } catch (err) {
    console.error('Send push error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

