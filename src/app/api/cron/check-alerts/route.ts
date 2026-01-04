import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// 가격 포맷팅 함수 (밈코인 소수점 지원)
function formatPrice(price: number): string {
  if (price === 0 || price === undefined || price === null) return '가격 없음'
  if (price >= 1) return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  if (price >= 0.01) return `$${price.toFixed(4)}`
  if (price >= 0.0001) return `$${price.toFixed(6)}`
  if (price >= 0.00000001) return `$${price.toFixed(8)}`
  return `$${price.toExponential(4)}`
}

async function sendTelegramMessage(chatId: string, message: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  if (!botToken) {
    console.error('TELEGRAM_BOT_TOKEN not set')
    return false
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      })
    })
    
    const result = await response.json()
    if (!result.ok) {
      console.error('Telegram API error:', result)
      return false
    }
    return true
  } catch (error) {
    console.error('Failed to send telegram message:', error)
    return false
  }
}

async function getCoinPrice(symbol: string) {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${symbol}&vs_currencies=usd&include_24hr_change=true`,
      { next: { revalidate: 60 } }
    )
    return await response.json()
  } catch {
    return null
  }
}

async function searchCoin(query: string) {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/search?query=${query}`
    )
    const data = await response.json()
    if (data.coins && data.coins.length > 0) {
      const coinId = data.coins[0].id
      const priceResponse = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`
      )
      const priceData = await priceResponse.json()
      return {
        id: coinId,
        symbol: data.coins[0].symbol,
        name: data.coins[0].name,
        price: priceData[coinId]?.usd || 0,
        change24h: priceData[coinId]?.usd_24h_change || 0
      }
    }
    return null
  } catch {
    return null
  }
}

// 점수 계산 (대시보드와 동일한 로직)
function calculateScore(priceChange: number): number {
  const macro = Math.min(20, Math.max(5, 12 + (Math.random() * 6 - 3)))
  const etf = Math.min(25, Math.max(8, 15 + (Math.random() * 8 - 4)))
  const onchain = Math.min(25, Math.max(10, 18 + priceChange * 0.3))
  const ai = Math.min(20, Math.max(5, 10 + (Math.random() * 8 - 4)))
  const futures = Math.min(20, Math.max(5, 12 + (Math.random() * 6 - 3)))
  const technical = Math.min(20, Math.max(5, 10 + priceChange * 0.2))
  const strategy = Math.min(10, Math.max(3, 5 + (Math.random() * 4 - 2)))
  return Math.round(macro + etf + onchain + ai + futures + technical + strategy)
}

function getSignal(score: number): string {
  if (score >= 115) return '🚀 강력 매수'
  if (score >= 95) return '📈 매수'
  if (score >= 70) return '⏸️ 관망'
  if (score >= 50) return '📉 매도'
  return '🔻 강력 매도'
}

export async function GET(request: NextRequest) {
  // Vercel Cron 인증 확인
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    // 개발 환경에서는 통과
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  try {
    // 텔레그램 ID가 있는 알림 설정 조회
    const { data: alertSettings, error } = await supabase
      .from('alert_settings')
      .select('*')
      .not('telegram_id', 'is', null)
    
    if (error) {
      console.error('Failed to fetch alert settings:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!alertSettings || alertSettings.length === 0) {
      return NextResponse.json({ message: 'No alert settings with telegram' })
    }

    let alertsSent = 0

    for (const settings of alertSettings) {
      const { telegram_id, selected_coins, score_threshold } = settings
      
      if (!telegram_id || !selected_coins || selected_coins.length === 0) continue

      const alertMessages: string[] = []

      for (const symbol of selected_coins) {
        try {
          const coinData = await searchCoin(symbol)
          if (!coinData) continue

          const score = calculateScore(coinData.change24h || 0)
          
          if (score >= score_threshold) {
            const signal = getSignal(score)
            const changeStr = coinData.change24h >= 0 
              ? `+${coinData.change24h.toFixed(2)}%` 
              : `${coinData.change24h.toFixed(2)}%`
            
            alertMessages.push(
              `📊 <b>${symbol.toUpperCase()}</b>\n` +
              `점수: ${score}/140 (임계점: ${score_threshold})\n` +
              `시그널: ${signal}\n` +
              `가격: ${formatPrice(coinData.price)}\n` +
              `24h: ${changeStr}`
            )
          }
        } catch (e) {
          console.error(`Error checking ${symbol}:`, e)
        }
      }

      if (alertMessages.length > 0) {
        const fullMessage = `🚀 <b>크립토 대시보드 PRO 알림</b>\n\n${alertMessages.join('\n\n')}\n\n⏰ ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`
        
        const sent = await sendTelegramMessage(telegram_id, fullMessage)
        if (sent) {
          alertsSent++
          
          // 알림 로그 저장
          await supabase.from('alert_logs').insert({
            user_id: settings.user_id,
            alert_type: 'telegram',
            coins: selected_coins,
            message: fullMessage,
            sent_at: new Date().toISOString()
          })
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      alertsSent,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
