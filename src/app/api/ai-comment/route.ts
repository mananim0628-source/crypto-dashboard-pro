// /src/app/api/ai-comment/route.ts - 수정된 버전

import { NextRequest, NextResponse } from 'next/server'

// 기본 코멘트 생성
function getBasicComment(symbol: string, score: number, signal: string): string {
  if (signal === 'strong_buy') return `${symbol} 강한 매수 신호. 점수 ${score}/140.`
  if (signal === 'buy') return `${symbol} 매수 구간. 점수 ${score}/140.`
  if (signal === 'hold') return `${symbol} 관망. 점수 ${score}/140.`
  return `${symbol} 조정 가능성. 점수 ${score}/140.`
}

// 상세 코멘트 생성 - ✅ priceChange24h에 기본값 추가
function getDetailedComment(
  symbol: string, 
  name: string, 
  score: number, 
  signal: string, 
  price: number, 
  priceChange24h: string | null  // ✅ null 허용
): string {
  const priceChangeNum = parseFloat(priceChange24h || '0')  // ✅ null 처리
  
  let comment = ''
  
  if (signal === 'strong_buy') {
    comment = `🚀 ${symbol}는 총점 ${score}/140점으로 강력 매수 구간입니다.\n\n`
    comment += `✅ 현재가: $${price.toLocaleString()}\n`
    if (priceChangeNum > 0) {
      comment += `📈 24시간: +${priceChangeNum.toFixed(2)}% 상승\n`
    } else if (priceChangeNum < 0) {
      comment += `📉 24시간: ${priceChangeNum.toFixed(2)}% 하락\n`
    }
    comment += `\n💡 전략: 현재가 부근 분할 매수 후, 목표가까지 홀딩 권장.`
  } else if (signal === 'buy') {
    comment = `📈 ${symbol}는 총점 ${score}/140점으로 매수 관점 유효합니다.\n\n`
    comment += `✅ 현재가: $${price.toLocaleString()}\n`
    if (priceChangeNum !== 0) {
      comment += `📊 24시간: ${priceChangeNum > 0 ? '+' : ''}${priceChangeNum.toFixed(2)}%\n`
    }
    comment += `\n💡 전략: 지지선 부근에서 분할 매수, 손절가 엄수.`
  } else if (signal === 'hold') {
    comment = `⏸️ ${symbol}는 총점 ${score}/140점으로 중립 구간입니다.\n\n`
    comment += `📊 현황: 명확한 방향성이 부재합니다.\n`
    if (priceChangeNum > 3) {
      comment += `⚠️ 24시간 ${priceChangeNum.toFixed(1)}% 상승 후 단기 조정 가능성에 주의하세요.\n`
    } else if (priceChangeNum < -3) {
      comment += `👀 24시간 ${Math.abs(priceChangeNum).toFixed(1)}% 하락 후 반등 가능성을 지켜보세요.\n`
    }
    comment += `\n💡 전략: 추세 확인 후 진입 권장. 현재는 관망.`
  } else {
    comment = `📉 ${symbol}는 총점 ${score}/140점으로 약세 구간입니다.\n\n`
    comment += `❌ 하락 압력이 우세합니다.\n`
    comment += `\n💡 전략: 신규 진입 비권장. 기존 포지션은 손절가 타이트하게 관리.`
  }
  
  return comment
}

const CORE_COINS = ['BTC', 'ETH', 'XRP', 'BNB']

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { coins } = body
    
    if (!coins || !Array.isArray(coins)) {
      return NextResponse.json({ error: 'coins 배열이 필요합니다' }, { status: 400 })
    }
    
    const comments: Record<string, string> = {}
    
    for (const coin of coins) {
      const { 
        symbol, 
        name, 
        score, 
        signal, 
        price, 
        priceChange24h  // string | null 가능
      } = coin
      
      const upperSymbol = symbol?.toUpperCase() || ''
      
      // 핵심 코인이거나 90점 이상이면 상세 코멘트
      if (CORE_COINS.includes(upperSymbol) || score >= 90) {
        comments[upperSymbol] = getDetailedComment(
          upperSymbol, 
          name || '', 
          score || 0, 
          signal || 'hold', 
          price || 0, 
          priceChange24h  // ✅ null도 전달 가능
        )
      } else {
        comments[upperSymbol] = getBasicComment(
          upperSymbol, 
          score || 0, 
          signal || 'hold'
        )
      }
    }
    
    return NextResponse.json({ comments })
    
  } catch (error) {
    console.error('AI Comment API Error:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
