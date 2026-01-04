
// /src/app/api/telegram/send/route.ts
// 텔레그램 메시지 전송 API

import { NextRequest, NextResponse } from 'next/server'

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

export async function POST(request: NextRequest) {
  try {
    const { chatId, message } = await request.json()

    if (!TELEGRAM_BOT_TOKEN) {
      return NextResponse.json({ error: 'Telegram bot token not configured' }, { status: 500 })
    }

    if (!chatId || !message) {
      return NextResponse.json({ error: 'chatId and message are required' }, { status: 400 })
    }

    const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`

    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      })
    })

    const data = await response.json()

    if (!data.ok) {
      console.error('Telegram API error:', data)
      return NextResponse.json({ error: data.description || 'Failed to send message' }, { status: 400 })
    }

    return NextResponse.json({ success: true, message_id: data.result.message_id })

  } catch (error) {
    console.error('Telegram send error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
