import { NextRequest, NextResponse } from 'next/server'

const COINGECKO_API = 'https://api.coingecko.com/api/v3'

// 심볼 -> CoinGecko ID 매핑
const SYMBOL_TO_ID: Record<string, string> = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'XRP': 'ripple',
  'BNB': 'binancecoin',
  'SOL': 'solana',
  'ADA': 'cardano',
  'DOGE': 'dogecoin',
  'MATIC': 'matic-network',
  'DOT': 'polkadot',
  'SHIB': 'shiba-inu',
  'AVAX': 'avalanche-2',
  'LINK': 'chainlink',
  'UNI': 'uniswap',
  'ATOM': 'cosmos',
  'LTC': 'litecoin',
  'ETC': 'ethereum-classic',
  'PEPE': 'pepe',
  'BONK': 'bonk',
  'FLOKI': 'floki',
  'WIF': 'dogwifcoin',
  'ENA': 'ethena',
  'PENDLE': 'pendle',
  'ARB': 'arbitrum',
  'OP': 'optimism',
  'SUI': 'sui',
  'SEI': 'sei-network',
  'INJ': 'injective-protocol',
  'FET': 'fetch-ai',
  'RNDR': 'render-token',
  'NEAR': 'near',
  'APT': 'aptos',
  'TON': 'the-open-network',
  'TRX': 'tron',
  'HBAR': 'hedera-hashgraph',
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol')?.toUpperCase() || 'BTC'
  const days = parseInt(searchParams.get('days') || '90')
  const interval = searchParams.get('interval') || 'daily' // daily, hourly

  try {
    const coinId = SYMBOL_TO_ID[symbol] || 'bitcoin'
    
    // CoinGecko API 호출 - 과거 데이터
    const response = await fetch(
      `${COINGECKO_API}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}&interval=${interval}`,
      { next: { revalidate: 3600 } } // 1시간 캐시
    )
    
    if (!response.ok) {
      throw new Error('Failed to fetch historical data')
    }
    
    const data = await response.json()
    
    // 가격 데이터 포맷팅
    const prices = data.prices.map((item: [number, number]) => ({
      timestamp: item[0],
      date: new Date(item[0]).toISOString(),
      price: item[1]
    }))
    
    return NextResponse.json({
      symbol,
      coinId,
      days,
      interval,
      prices,
      totalDataPoints: prices.length
    })
    
  } catch (error) {
    console.error('Backtest API error:', error)
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      symbol = 'BTC',
      days = 90,
      timeframe = '1d', // 15m, 1h, 4h, 1d
      initialCapital = 10000000, // 1천만원
      entryThreshold = 90, // 진입 기준 점수
      investmentRatio = 10, // 1회 투자 비율 %
      targetMultiplier = 1.04, // 목표가 배율
      stopLossMultiplier = 0.97, // 손절가 배율
    } = body

    const coinId = SYMBOL_TO_ID[symbol.toUpperCase()] || 'bitcoin'
    
    // interval 결정
    let interval = 'daily'
    let fetchDays = days
    if (timeframe === '15m' || timeframe === '1h') {
      interval = 'hourly'
      fetchDays = Math.min(days, 90) // hourly는 최대 90일
    }
    
    // 과거 데이터 가져오기
    const response = await fetch(
      `${COINGECKO_API}/coins/${coinId}/market_chart?vs_currency=usd&days=${fetchDays}`,
      { next: { revalidate: 3600 } }
    )
    
    if (!response.ok) {
      throw new Error('Failed to fetch historical data')
    }
    
    const data = await response.json()
    let prices = data.prices.map((item: [number, number]) => ({
      timestamp: item[0],
      price: item[1]
    }))
    
    // 타임프레임에 맞게 데이터 리샘플링
    if (timeframe === '4h') {
      prices = resampleData(prices, 4)
    } else if (timeframe === '1d' && interval === 'hourly') {
      prices = resampleData(prices, 24)
    }
    
    // 백테스트 시뮬레이션 실행
    const result = runBacktest({
      prices,
      initialCapital,
      entryThreshold,
      investmentRatio,
      targetMultiplier,
      stopLossMultiplier,
      timeframe
    })
    
    return NextResponse.json({
      symbol,
      timeframe,
      days,
      ...result
    })
    
  } catch (error) {
    console.error('Backtest simulation error:', error)
    return NextResponse.json({ error: 'Simulation failed' }, { status: 500 })
  }
}

// 데이터 리샘플링 (시간 단위로 그룹화)
function resampleData(prices: {timestamp: number, price: number}[], hours: number) {
  const grouped: {timestamp: number, price: number}[] = []
  const msPerGroup = hours * 60 * 60 * 1000
  
  let currentGroup: {timestamp: number, prices: number[]} | null = null
  
  for (const p of prices) {
    const groupTime = Math.floor(p.timestamp / msPerGroup) * msPerGroup
    
    if (!currentGroup || currentGroup.timestamp !== groupTime) {
      if (currentGroup) {
        grouped.push({
          timestamp: currentGroup.timestamp,
          price: currentGroup.prices[currentGroup.prices.length - 1] // 종가
        })
      }
      currentGroup = { timestamp: groupTime, prices: [p.price] }
    } else {
      currentGroup.prices.push(p.price)
    }
  }
  
  if (currentGroup) {
    grouped.push({
      timestamp: currentGroup.timestamp,
      price: currentGroup.prices[currentGroup.prices.length - 1]
    })
  }
  
  return grouped
}

// 체크리스트 점수 시뮬레이션 (과거 데이터 기반)
function simulateScore(
  currentPrice: number, 
  prevPrice: number, 
  priceHistory: number[]
): number {
  const priceChange = ((currentPrice - prevPrice) / prevPrice) * 100
  
  // 이동평균 계산
  const ma20 = priceHistory.slice(-20).reduce((a, b) => a + b, 0) / Math.min(20, priceHistory.length)
  const maRatio = currentPrice / ma20
  
  // 변동성 계산
  const returns = []
  for (let i = 1; i < Math.min(20, priceHistory.length); i++) {
    returns.push((priceHistory[i] - priceHistory[i-1]) / priceHistory[i-1])
  }
  const volatility = returns.length > 0 
    ? Math.sqrt(returns.reduce((a, b) => a + b * b, 0) / returns.length) * 100 
    : 5
  
  // 점수 계산 (실제 체크리스트 로직 시뮬레이션)
  let score = 70 // 기본 점수
  
  // 가격 변화 반영 (최대 ±15점)
  score += Math.min(15, Math.max(-15, priceChange * 2))
  
  // 이동평균 대비 위치 (최대 ±10점)
  if (maRatio > 1.02) score += 8
  else if (maRatio > 1) score += 4
  else if (maRatio < 0.98) score -= 8
  else if (maRatio < 1) score -= 4
  
  // 변동성 반영 (최대 ±10점)
  if (volatility < 3) score += 5
  else if (volatility > 8) score -= 5
  
  // 랜덤 요소 (시장 상황 시뮬레이션)
  score += (Math.random() - 0.5) * 20
  
  return Math.min(140, Math.max(40, Math.round(score)))
}

// 백테스트 실행
function runBacktest({
  prices,
  initialCapital,
  entryThreshold,
  investmentRatio,
  targetMultiplier,
  stopLossMultiplier,
  timeframe
}: {
  prices: {timestamp: number, price: number}[]
  initialCapital: number
  entryThreshold: number
  investmentRatio: number
  targetMultiplier: number
  stopLossMultiplier: number
  timeframe: string
}) {
  let capital = initialCapital
  let position: {
    entryPrice: number
    targetPrice: number
    stopLoss: number
    amount: number
    entryTime: number
    score: number
  } | null = null
  
  const trades: {
    entryTime: number
    exitTime: number
    entryPrice: number
    exitPrice: number
    score: number
    pnl: number
    pnlPercent: number
    result: 'win' | 'loss'
  }[] = []
  
  const equityCurve: {timestamp: number, equity: number}[] = []
  const priceHistory: number[] = []
  let maxEquity = initialCapital
  let maxDrawdown = 0
  
  for (let i = 1; i < prices.length; i++) {
    const current = prices[i]
    const prev = prices[i - 1]
    priceHistory.push(current.price)
    
    // 포지션이 있으면 청산 체크
    if (position) {
      // 목표가 도달
      if (current.price >= position.targetPrice) {
        const pnl = (current.price - position.entryPrice) * position.amount
        const pnlPercent = ((current.price - position.entryPrice) / position.entryPrice) * 100
        capital += position.amount * current.price
        
        trades.push({
          entryTime: position.entryTime,
          exitTime: current.timestamp,
          entryPrice: position.entryPrice,
          exitPrice: current.price,
          score: position.score,
          pnl,
          pnlPercent,
          result: 'win'
        })
        position = null
      }
      // 손절가 도달
      else if (current.price <= position.stopLoss) {
        const pnl = (current.price - position.entryPrice) * position.amount
        const pnlPercent = ((current.price - position.entryPrice) / position.entryPrice) * 100
        capital += position.amount * current.price
        
        trades.push({
          entryTime: position.entryTime,
          exitTime: current.timestamp,
          entryPrice: position.entryPrice,
          exitPrice: current.price,
          score: position.score,
          pnl,
          pnlPercent,
          result: 'loss'
        })
        position = null
      }
    }
    
    // 포지션이 없고 진입 조건 체크
    if (!position && priceHistory.length >= 5) {
      const score = simulateScore(current.price, prev.price, priceHistory)
      
      if (score >= entryThreshold) {
        const investAmount = capital * (investmentRatio / 100)
        const amount = investAmount / current.price
        
        position = {
          entryPrice: current.price,
          targetPrice: current.price * targetMultiplier,
          stopLoss: current.price * stopLossMultiplier,
          amount,
          entryTime: current.timestamp,
          score
        }
        
        capital -= investAmount
      }
    }
    
    // 현재 자산 계산
    const currentEquity = capital + (position ? position.amount * current.price : 0)
    equityCurve.push({ timestamp: current.timestamp, equity: currentEquity })
    
    // 최대 낙폭 계산
    if (currentEquity > maxEquity) {
      maxEquity = currentEquity
    }
    const drawdown = ((maxEquity - currentEquity) / maxEquity) * 100
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown
    }
  }
  
  // 미청산 포지션 정리
  if (position) {
    const lastPrice = prices[prices.length - 1].price
    capital += position.amount * lastPrice
  }
  
  // 결과 계산
  const wins = trades.filter(t => t.result === 'win').length
  const losses = trades.filter(t => t.result === 'loss').length
  const totalTrades = trades.length
  const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0
  const totalReturn = ((capital - initialCapital) / initialCapital) * 100
  const avgWin = wins > 0 
    ? trades.filter(t => t.result === 'win').reduce((a, t) => a + t.pnlPercent, 0) / wins 
    : 0
  const avgLoss = losses > 0 
    ? Math.abs(trades.filter(t => t.result === 'loss').reduce((a, t) => a + t.pnlPercent, 0) / losses)
    : 0
  const profitFactor = avgLoss > 0 ? avgWin / avgLoss : avgWin
  
  // 월별 수익률 계산
  const monthlyReturns: {month: string, return: number}[] = []
  let prevMonthEquity = initialCapital
  let currentMonth = ''
  
  for (const point of equityCurve) {
    const date = new Date(point.timestamp)
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    
    if (month !== currentMonth && currentMonth !== '') {
      const monthReturn = ((point.equity - prevMonthEquity) / prevMonthEquity) * 100
      monthlyReturns.push({ month: currentMonth, return: monthReturn })
      prevMonthEquity = point.equity
    }
    currentMonth = month
  }
  
  return {
    summary: {
      initialCapital,
      finalCapital: Math.round(capital),
      totalReturn: totalReturn.toFixed(2),
      totalTrades,
      wins,
      losses,
      winRate: winRate.toFixed(1),
      maxDrawdown: maxDrawdown.toFixed(2),
      profitFactor: profitFactor.toFixed(2),
      avgWin: avgWin.toFixed(2),
      avgLoss: avgLoss.toFixed(2),
    },
    trades: trades.slice(-50), // 최근 50개 거래만
    equityCurve: equityCurve.filter((_, i) => i % Math.max(1, Math.floor(equityCurve.length / 100)) === 0), // 100개 포인트로 샘플링
    monthlyReturns
  }
}
