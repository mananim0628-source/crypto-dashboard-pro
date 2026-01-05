import { NextRequest, NextResponse } from 'next/server'

const COINGECKO_API = 'https://api.coingecko.com/api/v3'

// 심볼 -> CoinGecko ID 매핑 (정확한 매칭용)
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
  'XLM': 'stellar',
  'ALGO': 'algorand',
  'VET': 'vechain',
  'FIL': 'filecoin',
  'AAVE': 'aave',
  'AXS': 'axie-infinity',
  'SAND': 'the-sandbox',
  'MANA': 'decentraland',
  'GALA': 'gala',
  'ENJ': 'enjincoin',
  'CHZ': 'chiliz',
  'APE': 'apecoin',
  'LDO': 'lido-dao',
  'ARB': 'arbitrum',
  'OP': 'optimism',
  'IMX': 'immutable-x',
  'NEAR': 'near',
  'APT': 'aptos',
  'SUI': 'sui',
  'SEI': 'sei-network',
  'TIA': 'celestia',
  'INJ': 'injective-protocol',
  'FET': 'fetch-ai',
  'RNDR': 'render-token',
  'GRT': 'the-graph',
  'SNX': 'havven',
  'CRV': 'curve-dao-token',
  'MKR': 'maker',
  'COMP': 'compound-governance-token',
  '1INCH': '1inch',
  'SUSHI': 'sushi',
  'YFI': 'yearn-finance',
  'BAL': 'balancer',
  'CAKE': 'pancakeswap-token',
  'PEPE': 'pepe',
  'BONK': 'bonk',
  'FLOKI': 'floki',
  'WIF': 'dogwifcoin',
  'ENA': 'ethena',  // ← 이게 핵심! ENA = Ethena (USDe 아님)
  'PENDLE': 'pendle',
  'JUP': 'jupiter-exchange-solana',
  'WLD': 'worldcoin-wld',
  'STRK': 'starknet',
  'PYTH': 'pyth-network',
  'JTO': 'jito-governance-token',
  'MEME': 'memecoin-2',
  'BLUR': 'blur',
  'ORDI': 'ordinals',
  'SATS': '1000sats',
  'RATS': 'rats',
  'LEO': 'leo-token',
  'TON': 'the-open-network',
  'TRX': 'tron',
  'HBAR': 'hedera-hashgraph',
  'KAS': 'kaspa',
  'OKB': 'okb',
  'CRO': 'crypto-com-chain',
  'RUNE': 'thorchain',
  'STX': 'blockstack',
  'FTM': 'fantom',
  'EGLD': 'elrond-erd-2',
  'FLOW': 'flow',
  'THETA': 'theta-token',
  'XTZ': 'tezos',
  'NEO': 'neo',
  'KLAY': 'klay-token',
  'ZEC': 'zcash',
  'IOTA': 'iota',
  'EOS': 'eos',
  'USDE': 'ethena-usde',  // USDe는 별도
  'USDT': 'tether',
  'USDC': 'usd-coin',
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  const query = searchParams.get('query')

  try {
    if (action === 'core') {
      // 핵심 코인 4개
      const response = await fetch(
        `${COINGECKO_API}/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,ripple,binancecoin&order=market_cap_desc&sparkline=false`,
        { next: { revalidate: 60 } }
      )
      const data = await response.json()
      return NextResponse.json({ coins: data })
    }

    if (action === 'gainers') {
      // 상승률 상위 코인
      const response = await fetch(
        `${COINGECKO_API}/coins/markets?vs_currency=usd&order=price_change_percentage_24h_desc&per_page=50&page=1&sparkline=false`,
        { next: { revalidate: 60 } }
      )
      const data = await response.json()
      // 상위 6개 필터링
      const filtered = data.filter((coin: any) => 
        coin.market_cap > 10000000 && // 시총 1000만 달러 이상
        coin.price_change_percentage_24h > 0
      ).slice(0, 6)
      return NextResponse.json({ coins: filtered })
    }

    if (action === 'search' && query) {
      const cleanQuery = query.toUpperCase().replace('USDT', '').replace('USD', '').trim()
      
      // 1. 먼저 매핑된 ID가 있는지 확인 (정확한 심볼 매칭)
      const mappedId = SYMBOL_TO_ID[cleanQuery]
      
      if (mappedId) {
        // 정확히 매핑된 코인 가져오기
        const response = await fetch(
          `${COINGECKO_API}/coins/markets?vs_currency=usd&ids=${mappedId}&sparkline=false`,
          { next: { revalidate: 60 } }
        )
        const data = await response.json()
        
        if (data && data.length > 0) {
          return NextResponse.json({ coin: data[0] })
        }
      }
      
      // 2. 매핑에 없으면 CoinGecko 검색 API 사용
      const searchResponse = await fetch(
        `${COINGECKO_API}/search?query=${encodeURIComponent(cleanQuery)}`
      )
      const searchData = await searchResponse.json()
      
      if (searchData.coins && searchData.coins.length > 0) {
        // 심볼이 정확히 일치하는 코인 우선 찾기
        const exactMatch = searchData.coins.find(
          (c: any) => c.symbol.toUpperCase() === cleanQuery
        )
        
        const targetCoin = exactMatch || searchData.coins[0]
        
        // 해당 코인의 상세 정보 가져오기
        const coinResponse = await fetch(
          `${COINGECKO_API}/coins/markets?vs_currency=usd&ids=${targetCoin.id}&sparkline=false`,
          { next: { revalidate: 60 } }
        )
        const coinData = await coinResponse.json()
        
        if (coinData && coinData.length > 0) {
          return NextResponse.json({ coin: coinData[0] })
        }
      }
      
      return NextResponse.json({ coin: null, error: 'Coin not found' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Crypto API error:', error)
    return NextResponse.json({ error: 'API error' }, { status: 500 })
  }
}
