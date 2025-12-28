import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { paymentKey, orderId, amount } = await request.json()

    const secretKey = process.env.TOSS_SECRET_KEY
    const encryptedSecretKey = Buffer.from(secretKey + ':').toString('base64')

    const response = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${encryptedSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || '결제 승인 실패' },
        { status: 400 }
      )
    }

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 30)

      await supabase
        .from('profiles')
        .update({
          plan: 'pro',
          plan_expires_at: expiresAt.toISOString(),
        })
        .eq('id', user.id)

      await supabase
        .from('payments')
        .insert({
          user_id: user.id,
          amount: amount,
          payment_key: paymentKey,
          order_id: orderId,
          status: 'completed',
          plan_type: 'pro',
        })
    }

    return NextResponse.json({ success: true, data })

  } catch (error: any) {
    console.error('Payment confirmation error:', error)
    return NextResponse.json(
      { error: '결제 처리 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
