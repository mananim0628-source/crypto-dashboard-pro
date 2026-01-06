// /app/api/ai-comment/route.ts
// Perplexity 기반 AI 코멘트 생성 API

import { NextRequest, NextResponse } from 'next/server'

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY

// 핵심 코인 목록
const CORE_COINS = ['BTC', 'ETH', 'XRP', 'BNB']

// 기본 코멘트 생성 (API 호출 없이)
function getBasicComment(symbol: string, score: number, signal: string): string {
  if (score >= 90) {
    return `${symbol} ${signal === 'buy' ? '매수' : signal === 'sell' ? '매도' : '관망'} 관점. 점수 ${score}/140.`
  } else if (score >= 70) {
    return `${symbol} 관망. 점수 ${score}/140.`
  } else {
    return `${symbol} 약세. 점수 ${score}/140.`
  }
}

// Perplexity로 상세 코멘트 생성
async function getDetailedComment(
  symbol: string, 
  name: string, 
  score: number, 
  signal: string,
  price: number,
  priceChange24h: number
): Promise<string> {
  
  if (!PERPLEXITY_API_KEY) {
    console.error('PERPLEXITY_API_KEY not found')
    return getBasicComment(symbol, score, signal)
  }

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: `너는 암호화폐 분석가야. 아래 코인에 대해 최신 뉴스와 시장 상황을 분석해서 3줄 이내로 간결하게 코멘트해줘.

규칙:
- 반말 사용 (친근하게)
- 최신 뉴스나 이슈 1개 언급
- 기술적 분석 또는 온체인 지표 1줄
- 종합 의견 1줄
- 총 3줄, 150자 이내
- 이모지 2~3개 사용
- "~입니다", "~네요" 금지 (AI티 나니까)`
          },
          {
            role: 'user',
            content: `코인: ${name} (${symbol})
현재가: $${price.toLocaleString()}
24시간 변동: ${priceChange24h >= 0 ? '+' : ''}${priceChange24h.toFixed(2)}%
체크리스트 점수: ${score}/140
시그널: ${signal}

이 코인에 대한 최신 뉴스와 분석 코멘트 작성해줘.`
          }
        ],
        max_tokens: 300,
        temperature: 0.3
      })
    })

    if (!response.ok) {
      console.error('Perplexity API error:', response.status)
      return getBasicComment(symbol, score, signal)
    }

    const data = await response.json()
    return data.choices[0]?.message?.content || getBasicComment(symbol, score, signal)

  } catch (error) {
    console.error('Perplexity API error:', error)
    return getBasicComment(symbol, score, signal)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { coins } = await request.json()
    
    if (!coins || !Array.isArray(coins)) {
      return NextResponse.json({ error: 'coins array required' }, { status: 400 })
    }

    const comments: Record<string, string> = {}

    for (const coin of coins) {
      const { symbol, name, score, signal, price, priceChange24h } = coin
      const upperSymbol = symbol.toUpperCase()

      // 핵심 코인이거나 90점 이상이면 상세 코멘트
      if (CORE_COINS.includes(upperSymbol) || score >= 90) {
        comments[upperSymbol] = await getDetailedComment(
          upperSymbol, 
          name, 
          score, 
          signal, 
          price, 
          priceChange24h
        )
      } else {
        // 나머지는 기본 코멘트
        comments[upperSymbol] = getBasicComment(upperSymbol, score, signal)
      }
    }

    return NextResponse.json({ comments })

  } catch (error) {
    console.error('AI Comment API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET 요청으로 단일 코인 코멘트 가져오기
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol')
  const name = searchParams.get('name') || symbol
  const score = parseInt(searchParams.get('score') || '0')
  const signal = searchParams.get('signal') || 'hold'
  const price = parseFloat(searchParams.get('price') || '0')
  const priceChange24h = parseFloat(searchParams.get('priceChange24h') || '0')

  if (!symbol) {
    return NextResponse.json({ error: 'symbol required' }, { status: 400 })
  }

  const upperSymbol = symbol.toUpperCase()
  let comment: string

  // 핵심 코인이거나 90점 이상이면 상세 코멘트
  if (CORE_COINS.includes(upperSymbol) || score >= 90) {
    comment = await getDetailedComment(upperSymbol, name, score, signal, price, priceChange24h)
  } else {
    comment = getBasicComment(upperSymbol, score, signal)
  }

  return NextResponse.json({ symbol: upperSymbol, comment })
}

