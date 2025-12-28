import { NextRequest, NextResponse } from 'next/server'

const API_KEY = process.env.COINGECKO_API_KEY
const API_BASE_URL = 'https://pro-api.coingecko.com/api/v3'

// CORS 헤더 설정
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

// 핵심 코인 ID
const CORE_COINS = ['bitcoin', 'ethereum', 'ripple', 'binancecoin']

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  try {
    switch (action) {
      case 'core':
        return await getCoreCoins()
      case 'gainers':
        return await getGainers()
      case 'search':
        const query = searchParams.get('q')
        return await searchCoins(query || '')
      case 'coin':
        const coinId = searchParams.get('id')
        return await getCoinData(coinId || '')
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400, headers: corsHeaders })
    }
  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: error.message || 'API 요청 실패' },
      { status: 500, headers: corsHeaders }
    )
  }
}

// 핵심 코인 데이터 가져오기
async function getCoreCoins() {
  const url = `${API_BASE_URL}/simple/price?ids=${CORE_COINS.join(',')}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`
  
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'X-Cg-Pro-Api-Key': API_KEY || '',
    },
    next: { revalidate: 60 }, // 1분 캐시
  })

  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.status}`)
  }

  const data = await response.json()

  const coins = [
    {
      id: 'bitcoin',
      symbol: 'BTC',
      name: 'Bitcoin',
      icon: '🔥',
      price: data.bitcoin?.usd || 0,
      change: data.bitcoin?.usd_24h_change || 0,
      volume: data.bitcoin?.usd_24h_vol || 0,
      marketCap: data.bitcoin?.usd_market_cap || 0,
    },
    {
      id: 'ethereum',
      symbol: 'ETH',
      name: 'Ethereum',
      icon: '⭐',
      price: data.ethereum?.usd || 0,
      change: data.ethereum?.usd_24h_change || 0,
      volume: data.ethereum?.usd_24h_vol || 0,
      marketCap: data.ethereum?.usd_market_cap || 0,
    },
    {
      id: 'ripple',
      symbol: 'XRP',
      name: 'Ripple',
      icon: '💎',
      price: data.ripple?.usd || 0,
      change: data.ripple?.usd_24h_change || 0,
      volume: data.ripple?.usd_24h_vol || 0,
      marketCap: data.ripple?.usd_market_cap || 0,
    },
    {
      id: 'binancecoin',
      symbol: 'BNB',
      name: 'BNB',
      icon: '🪙',
      price: data.binancecoin?.usd || 0,
      change: data.binancecoin?.usd_24h_change || 0,
      volume: data.binancecoin?.usd_24h_vol || 0,
      marketCap: data.binancecoin?.usd_market_cap || 0,
    },
  ].filter(coin => coin.price > 0)

  return NextResponse.json({ coins }, { headers: corsHeaders })
}

// 상승 코인 TOP 6 가져오기 (PRO 전용)
async function getGainers() {
  const url = `${API_BASE_URL}/coins/markets?vs_currency=usd&order=percent_change_24h_desc&per_page=50&page=1&sparkline=false&price_change_percentage=24h`
  
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'X-Cg-Pro-Api-Key': API_KEY || '',
    },
    next: { revalidate: 120 }, // 2분 캐시
  })

  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.status}`)
  }

  const data = await response.json()

  const gainers = data
    .filter((coin: any) => 
      !CORE_COINS.includes(coin.id) && 
      coin.price_change_percentage_24h > 1 &&
      coin.market_cap_rank <= 500 &&
      coin.total_volume > 1000000
    )
    .slice(0, 6)
    .map((coin: any) => ({
      id: coin.id,
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      icon: '📈',
      price: coin.current_price,
      change: coin.price_change_percentage_24h,
      volume: coin.total_volume,
      marketCap: coin.market_cap,
    }))

  return NextResponse.json({ gainers }, { headers: corsHeaders })
}

// 코인 검색 (PRO 전용)
async function searchCoins(query: string) {
  if (!query || query.length < 2) {
    return NextResponse.json({ coins: [] }, { headers: corsHeaders })
  }

  const url = `${API_BASE_URL}/search?query=${encodeURIComponent(query)}`
  
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'X-Cg-Pro-Api-Key': API_KEY || '',
    },
  })

  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.status}`)
  }

  const data = await response.json()
  const coins = data.coins?.slice(0, 5) || []

  return NextResponse.json({ coins }, { headers: corsHeaders })
}

// 특정 코인 데이터 가져오기 (PRO 전용)
async function getCoinData(coinId: string) {
  if (!coinId) {
    return NextResponse.json({ error: 'Coin ID required' }, { status: 400, headers: corsHeaders })
  }

  const url = `${API_BASE_URL}/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`
  
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'X-Cg-Pro-Api-Key': API_KEY || '',
    },
  })

  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.status}`)
  }

  const data = await response.json()
  const coinData = data[coinId]

  if (!coinData) {
    return NextResponse.json({ error: 'Coin not found' }, { status: 404, headers: corsHeaders })
  }

  // 이름 매핑
  const nameMapping: Record<string, { name: string; symbol: string }> = {
    'matic-network': { name: 'Polygon', symbol: 'MATIC' },
    'shiba-inu': { name: 'Shiba Inu', symbol: 'SHIB' },
    'avalanche-2': { name: 'Avalanche', symbol: 'AVAX' },
    'binancecoin': { name: 'BNB', symbol: 'BNB' },
  }

  let coinName = coinId.charAt(0).toUpperCase() + coinId.slice(1)
  let coinSymbol = coinId.split('-')[0].toUpperCase()

  if (nameMapping[coinId]) {
    coinName = nameMapping[coinId].name
    coinSymbol = nameMapping[coinId].symbol
  }

  const coin = {
    id: coinId,
    symbol: coinSymbol,
    name: coinName,
    icon: '🔍',
    price: coinData.usd || 0,
    change: coinData.usd_24h_change || 0,
    volume: coinData.usd_24h_vol || 0,
    marketCap: coinData.usd_market_cap || 0,
  }

  return NextResponse.json({ coin }, { headers: corsHeaders })
}

// OPTIONS 요청 처리 (CORS)
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}
