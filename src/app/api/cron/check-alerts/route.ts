// /src/app/api/cron/check-alerts/route.ts
// 알림 체크 크론잡 API (Vercel Cron)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const COINGECKO_API = 'https://api.coingecko.com/api/v3'

// Vercel Cron 인증
export async function GET(request: NextRequest) {
  // Cron 인증 확인
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. 모든 알림 설정 가져오기
    const { data: alertSettings, error: alertError } = await supabase
      .from('alert_settings')
      .select('*')
      .not('telegram_id', 'is', null)

    if (alertError || !alertSettings?.length) {
      return NextResponse.json({ message: 'No alert settings with telegram_id found' })
    }

    // 2. 코인 가격 데이터 가져오기
    const allCoins = new Set<string>()
    alertSettings.forEach(setting => {
      setting.selected_coins?.forEach((coin: string) => allCoins.add(coin.toLowerCase()))
    })

    const coinIds = await getCoinIds(Array.from(allCoins))
    if (!coinIds.length) {
      return NextResponse.json({ message: 'No coins to check' })
    }

    const priceResponse = await fetch(
      `${COINGECKO_API}/simple/price?ids=${coinIds.join(',')}&vs_currencies=usd&include_24hr_change=true`
    )
    const priceData = await priceResponse.json()

    // 3. 각 사용자별로 조건 체크 및 알림 전송
    let sentCount = 0
    
    for (const setting of alertSettings) {
      const messages: string[] = []

      for (const symbol of setting.selected_coins || []) {
        const coinId = getCoinIdBySymbol(symbol)
        const coinData = priceData[coinId]
        
        if (!coinData) continue

        // 점수 계산 (간단한 버전)
        const priceChange = coinData.usd_24h_change || 0
        const score = calculateSimpleScore(priceChange)

        // 임계점 체크
        if (score >= setting.score_threshold) {
          const signal = getSignalText(score)
          messages.push(
            `<b>📊 ${symbol.toUpperCase()}</b>\n` +
            `점수: ${score}/140 (임계점: ${setting.score_threshold})\n` +
            `시그널: ${signal}\n` +
            `가격: $${coinData.usd.toLocaleString()}\n` +
            `24h: ${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)}%`
          )
        }
      }

      // 알림 전송
      if (messages.length > 0 && setting.telegram_id) {
        const fullMessage = 
          `🚀 <b>크립토 대시보드 PRO 알림</b>\n\n` +
          messages.join('\n\n') +
          `\n\n⏰ ${new Date().toLocaleString('ko-KR')}`

        try {
          await sendTelegramMessage(setting.telegram_id, fullMessage)
          sentCount++
        } catch (e) {
          console.error(`Failed to send to ${setting.telegram_id}:`, e)
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      checked: alertSettings.length,
      sent: sentCount 
    })

  } catch (error) {
    console.error('Check alerts error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// 심볼 -> CoinGecko ID 매핑
const COIN_ID_MAP: Record<string, string> = {
  'btc': 'bitcoin',
  'eth': 'ethereum',
  'xrp': 'ripple',
  'bnb': 'binancecoin',
  'sol': 'solana',
  'ada': 'cardano',
  'doge': 'dogecoin',
  'pepe': 'pepe',
  'shib': 'shiba-inu',
  'bonk': 'bonk',
  'floki': 'floki',
  'wif': 'dogwifcoin',
  'ena': 'ethena',
  'matic': 'matic-network',
  'dot': 'polkadot',
  'avax': 'avalanche-2',
  'link': 'chainlink',
  'uni': 'uniswap',
  'atom': 'cosmos',
  'ltc': 'litecoin',
  'near': 'near',
  'apt': 'aptos',
  'sui': 'sui',
  'inj': 'injective-protocol',
  'arb': 'arbitrum',
  'op': 'optimism'
}

function getCoinIdBySymbol(symbol: string): string {
  return COIN_ID_MAP[symbol.toLowerCase()] || symbol.toLowerCase()
}

async function getCoinIds(symbols: string[]): Promise<string[]> {
  return symbols.map(s => getCoinIdBySymbol(s)).filter(Boolean)
}

function calculateSimpleScore(priceChange: number): number {
  // 간단한 점수 계산 (실제로는 더 복잡한 로직 필요)
  const base = 70
  const changeBonus = Math.min(30, Math.max(-20, priceChange * 2))
  const randomFactor = Math.random() * 20 - 10
  return Math.round(Math.min(140, Math.max(40, base + changeBonus + randomFactor)))
}

function getSignalText(score: number): string {
  if (score >= 115) return '🚀 강력 매수'
  if (score >= 95) return '📈 매수'
  if (score >= 70) return '⏸️ 관망'
  if (score >= 50) return '📉 매도'
  return '🔻 강력 매도'
}

async function sendTelegramMessage(chatId: string, message: string): Promise<void> {
  if (!TELEGRAM_BOT_TOKEN) throw new Error('No bot token')
  
  const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML'
    })
  })

  const data = await response.json()
  if (!data.ok) throw new Error(data.description)
}
