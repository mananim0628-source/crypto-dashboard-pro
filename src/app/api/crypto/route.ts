import { NextRequest, NextResponse } from 'next/server'

const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY

const CORE_COINS = ['bitcoin', 'ethereum', 'ripple', 'binancecoin']

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action') || 'core'
  const query = searchParams.get('query')

  try {
    if (action === 'core') {
      // 핵심 코인 4개
      const response = await fetch(
        `https://pro-api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${CORE_COINS.join(',')}&order=market_cap_desc&sparkline=false&price_change_percentage=24h`,
        {
          headers: {
            'x-cg-pro-api-key': COINGECKO_API_KEY || '',
          },
          next: { revalidate: 60 }
        }
      )
      const data = await response.json()
      return NextResponse.json({ coins: data })
    }

    if (action === 'gainers') {
      // 상승 코인 TOP (시가총액 상위 100개 중 상승률 기준)
      const response = await fetch(
        `https://pro-api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h`,
        {
          headers: {
            'x-cg-pro-api-key': COINGECKO_API_KEY || '',
          },
          next: { revalidate: 60 }
        }
      )
      const data = await response.json()
      
      // 상승률 기준 정렬
      const sorted = data
        .filter((coin: any) => coin.price_change_percentage_24h > 0)
        .sort((a: any, b: any) => b.price_change_percentage_24h - a.price_change_percentage_24h)
        .slice(0, 10)
      
      return NextResponse.json({ coins: sorted })
    }

    if (action === 'search' && query) {
      // 코인 검색
      const searchResponse = await fetch(
        `https://pro-api.coingecko.com/api/v3/search?query=${query}`,
        {
          headers: {
            'x-cg-pro-api-key': COINGECKO_API_KEY || '',
          },
        }
      )
      const searchData = await searchResponse.json()
      
      if (searchData.coins && searchData.coins.length > 0) {
        const coinId = searchData.coins[0].id
        
        // 해당 코인 상세 정보
        const detailResponse = await fetch(
          `https://pro-api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coinId}&sparkline=false&price_change_percentage=24h`,
          {
            headers: {
              'x-cg-pro-api-key': COINGECKO_API_KEY || '',
            },
          }
        )
        const detailData = await detailResponse.json()
        
        if (detailData && detailData.length > 0) {
          return NextResponse.json({ coin: detailData[0] })
        }
      }
      
      return NextResponse.json({ coin: null, error: '코인을 찾을 수 없습니다' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'API 요청 실패', message: error.message },
      { status: 500 }
    )
  }
}
