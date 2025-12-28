'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// 타입 정의
interface CoinData {
  id: string
  symbol: string
  name: string
  icon: string
  price: number
  change: number
  volume: number
  marketCap: number
}

interface Profile {
  id: string
  email: string
  nickname: string
  plan: 'free' | 'pro' | 'vip'
  plan_expires_at: string | null
}

interface ChecklistItem {
  id: string
  name: string
  max: number
  score: number
}

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [coreCoins, setCoreCoins] = useState<CoinData[]>([])
  const [gainers, setGainers] = useState<CoinData[]>([])
  const [searchResults, setSearchResults] = useState<CoinData | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [countdown, setCountdown] = useState(120)
  const [lastUpdate, setLastUpdate] = useState<string>('')
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    { id: 'macro', name: '🌍 거시환경', max: 20, score: 0 },
    { id: 'etf', name: '📊 ETF·제도권 자금', max: 25, score: 0 },
    { id: 'onchain', name: '🔗 온체인 핵심', max: 25, score: 0 },
    { id: 'ai', name: '🤖 AI·메타버스', max: 20, score: 0 },
    { id: 'futures', name: '📈 선물시장', max: 20, score: 0 },
    { id: 'technical', name: '📉 기술적 분석', max: 20, score: 0 },
    { id: 'strategy', name: '🎯 전략', max: 10, score: 0 },
  ])
  
  const router = useRouter()
  const supabase = createClientComponentClient()

  const isPro = profile?.plan === 'pro' || profile?.plan === 'vip'

  // 사용자 정보 가져오기
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        setProfile(profileData)
      }
      
      setLoading(false)
    }

    getUser()
  }, [supabase])

  // 데이터 fetch
  const fetchData = useCallback(async () => {
    try {
      // 핵심 코인 (무료)
      const coreRes = await fetch('/api/crypto?action=core')
      const coreData = await coreRes.json()
      if (coreData.coins) {
        setCoreCoins(coreData.coins)
      }

      // 상승 코인 (PRO만)
      if (isPro) {
        const gainersRes = await fetch('/api/crypto?action=gainers')
        const gainersData = await gainersRes.json()
        if (gainersData.gainers) {
          setGainers(gainersData.gainers)
        }
      }

      // 체크리스트 점수 계산
      calculateChecklistScores(coreData.coins || [])

      setLastUpdate(new Date().toLocaleTimeString('ko-KR'))
      setCountdown(120)
    } catch (error) {
      console.error('Data fetch error:', error)
    }
  }, [isPro])

  // 초기 데이터 로드 및 자동 업데이트
  useEffect(() => {
    if (!loading) {
      fetchData()
      const interval = setInterval(fetchData, 120000) // 2분마다
      return () => clearInterval(interval)
    }
  }, [loading, fetchData])

  // 카운트다운
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => (prev > 0 ? prev - 1 : 120))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // 체크리스트 점수 계산
  const calculateChecklistScores = (coins: CoinData[]) => {
    if (!coins.length) return

    const avgChange = coins.reduce((sum, coin) => sum + (coin.change || 0), 0) / coins.length
    const totalVolume = coins.reduce((sum, coin) => sum + (coin.volume || 0), 0)
    const btc = coins.find(coin => coin.symbol === 'BTC')

    setChecklist(prev => prev.map(item => {
      let score = 0
      switch (item.id) {
        case 'macro':
          score = Math.min(20, Math.max(0, Math.floor(12 + avgChange * 1.5)))
          break
        case 'etf':
          score = Math.min(25, Math.max(5, btc ? Math.floor(15 + (btc.price > 95000 ? 8 : 3)) : 15))
          break
        case 'onchain':
          score = Math.min(25, Math.max(5, Math.floor(totalVolume / 3000000000)))
          break
        case 'ai':
          score = Math.min(20, Math.max(5, Math.floor(12 + avgChange * 0.8)))
          break
        case 'futures':
          score = Math.min(20, Math.max(5, Math.floor(18 - Math.abs(avgChange) * 1.2)))
          break
        case 'technical':
          score = Math.min(20, Math.max(5, btc ? Math.floor(12 + btc.change * 2) : 12))
          break
        case 'strategy':
          score = Math.min(10, Math.max(2, Math.floor(6 + avgChange * 0.5)))
          break
      }
      return { ...item, score }
    }))
  }

  // 코인 검색
  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    if (!isPro) {
      alert('검색 기능은 PRO 회원만 이용 가능합니다')
      return
    }

    try {
      const searchRes = await fetch(`/api/crypto?action=search&q=${encodeURIComponent(searchQuery)}`)
      const searchData = await searchRes.json()
      
      if (searchData.coins?.length > 0) {
        const coinId = searchData.coins[0].id
        const coinRes = await fetch(`/api/crypto?action=coin&id=${coinId}`)
        const coinData = await coinRes.json()
        
        if (coinData.coin) {
          setSearchResults(coinData.coin)
        }
      } else {
        alert('검색 결과가 없습니다')
      }
    } catch (error) {
      console.error('Search error:', error)
    }
  }

  // 로그아웃
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  // 총 점수 계산
  const totalScore = checklist.reduce((sum, item) => sum + item.score, 0)

  // 전략 결정
  const getStrategy = () => {
    if (totalScore >= 120) return { signal: '🚀 강한 매수 신호', leverage: '5-7x', position: '90%', status: '강세장', rr: '1:4' }
    if (totalScore >= 100) return { signal: '📈 매수 우위', leverage: '3-5x', position: '70%', status: '상승장', rr: '1:2.5' }
    if (totalScore >= 80) return { signal: '⚖️ 중립 시장', leverage: '1-3x', position: '50%', status: '횡보장', rr: '1:1.5' }
    return { signal: '⚠️ 주의 필요', leverage: '무레버리지', position: '30%', status: '약세장', rr: '1:1' }
  }

  const strategy = getStrategy()

  // 코인 점수 계산
  const calculateCoinScore = (coin: CoinData) => {
    let score = 0
    if (coin.symbol === 'BTC' && coin.price > 95000) score += 20
    else if (coin.symbol === 'ETH' && coin.price > 3500) score += 18
    else if (coin.price > 0) score += 15

    if (coin.change > 5) score += 25
    else if (coin.change > 2) score += 20
    else if (coin.change > 0) score += 15
    else if (coin.change > -2) score += 10
    else score += 5

    if (coin.volume > 20000000000) score += 25
    else if (coin.volume > 10000000000) score += 20
    else score += 10

    if (coin.marketCap > 1000000000000) score += 20
    else if (coin.marketCap > 100000000000) score += 15
    else score += 8

    score += 20 // 기본 점수
    return Math.min(140, Math.max(0, score))
  }

  // 트레이딩 가격 계산
  const getTradingPrices = (coin: CoinData) => {
    const price = coin.price
    const isLong = coin.change > 0
    
    return {
      entry: isLong ? price * 1.002 : price * 0.998,
      target: isLong ? price * 1.08 : price * 0.92,
      stop: isLong ? price * 0.95 : price * 1.05,
      rr: '1.00',
    }
  }

  // 가격 포맷팅
  const formatPrice = (price: number) => {
    if (!price) return '0'
    if (price > 10000) return price.toLocaleString()
    if (price > 100) return price.toFixed(2)
    if (price > 1) return price.toFixed(3)
    return price.toFixed(4)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner w-12 h-12"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* 헤더 */}
      <header className="bg-crypto-dark/80 backdrop-blur-lg border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold gradient-text">🚀 크립토 대시보드 PRO</h1>
            <p className="text-xs text-white/50">
              마지막 업데이트: {lastUpdate || '-'} | 다음 업데이트: {countdown}초
              <span className={`ml-2 px-2 py-0.5 rounded text-xs ${isPro ? 'bg-crypto-green/20 text-crypto-green' : 'bg-white/10 text-white/50'}`}>
                {isPro ? 'PRO' : 'FREE'}
              </span>
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="text-sm text-white/70">{profile?.nickname || user.email}</span>
                {!isPro && (
                  <Link href="/pricing" className="btn-primary text-xs px-3 py-2">
                    PRO 업그레이드
                  </Link>
                )}
                <button onClick={handleLogout} className="text-sm text-white/50 hover:text-white">
                  로그아웃
                </button>
              </>
            ) : (
              <Link href="/login" className="btn-primary text-sm">
                로그인
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* 검색 (PRO만) */}
        <div className="mb-6">
          <div className="flex gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder={isPro ? "코인명 입력 (예: doge, shib, matic)" : "🔒 검색은 PRO 전용 기능입니다"}
              className="input-field flex-1"
              disabled={!isPro}
            />
            <button
              onClick={handleSearch}
              disabled={!isPro}
              className="btn-primary disabled:opacity-50"
            >
              🔍 분석
            </button>
          </div>
        </div>

        {/* 검색 결과 */}
        {searchResults && isPro && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-bold text-crypto-blue">🔍 검색 결과</h2>
              <button
                onClick={() => setSearchResults(null)}
                className="text-sm text-crypto-red hover:underline"
              >
                닫기
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <CoinCard coin={searchResults} isPro={isPro} />
            </div>
          </div>
        )}

        {/* 핵심 코인 */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-crypto-green mb-4">🎯 핵심 코인 (BTC, ETH, XRP, BNB)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {coreCoins.map(coin => (
              <CoinCard key={coin.id} coin={coin} isPro={isPro} />
            ))}
          </div>
        </section>

        {/* 상승 코인 (PRO만) */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-bold text-crypto-green">📈 실시간 상승 코인 TOP 6</h2>
            {!isPro && <span className="pro-badge text-xs">PRO</span>}
          </div>
          
          {isPro ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {gainers.map(coin => (
                <CoinCard key={coin.id} coin={coin} isPro={isPro} />
              ))}
            </div>
          ) : (
            <div className="card text-center py-12">
              <p className="text-white/50 mb-4">상승 코인 TOP 6는 PRO 회원 전용입니다</p>
              <Link href="/pricing" className="btn-primary inline-block">
                PRO 업그레이드
              </Link>
            </div>
          )}
        </section>

        {/* 7단계 체크리스트 */}
        <section className="mb-8">
          <div className="card">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-crypto-green">📊 7단계 체크리스트 분석</h2>
              <div className="text-2xl font-bold px-6 py-3 rounded-xl bg-gradient-to-r from-crypto-green to-crypto-blue text-crypto-dark">
                {totalScore}/140점
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {checklist.map(item => (
                <div key={item.id} className="bg-white/5 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm">{item.name}</span>
                  </div>
                  <div className="text-crypto-blue font-bold">
                    {isPro ? `${item.score}/${item.max}점` : '🔒'}
                  </div>
                  <div className="h-2 bg-white/10 rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-crypto-blue to-crypto-green"
                      style={{ width: isPro ? `${(item.score / item.max) * 100}%` : '0%' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 전략 추천 */}
        <section>
          <div className="card">
            <h2 className="text-xl font-bold mb-6">{strategy.signal}</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <p className="text-sm text-white/50 mb-2">추천 레버리지</p>
                <p className="text-2xl font-bold text-crypto-green">{strategy.leverage}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <p className="text-sm text-white/50 mb-2">포지션 비중</p>
                <p className="text-2xl font-bold text-crypto-green">{strategy.position}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <p className="text-sm text-white/50 mb-2">평균 손익비</p>
                <p className="text-2xl font-bold text-crypto-green">{strategy.rr}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <p className="text-sm text-white/50 mb-2">시장 상태</p>
                <p className="text-2xl font-bold text-crypto-green">{strategy.status}</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

// 코인 카드 컴포넌트
function CoinCard({ coin, isPro }: { coin: CoinData; isPro: boolean }) {
  const isPositive = coin.change >= 0
  const cardClass = isPositive ? 'bullish' : 'bearish'
  
  const score = Math.min(140, Math.max(0, 
    (coin.price > 1000 ? 20 : 10) + 
    (coin.change > 0 ? 25 : 5) + 
    (coin.volume > 1000000000 ? 20 : 10) + 40
  ))

  const formatPrice = (price: number) => {
    if (!price) return '0'
    if (price > 10000) return '$' + price.toLocaleString()
    if (price > 100) return '$' + price.toFixed(2)
    if (price > 1) return '$' + price.toFixed(3)
    return '$' + price.toFixed(4)
  }

  const entry = isPositive ? coin.price * 1.002 : coin.price * 0.998
  const target = isPositive ? coin.price * 1.08 : coin.price * 0.92
  const stop = isPositive ? coin.price * 0.95 : coin.price * 1.05

  return (
    <div className={`price-card ${cardClass}`}>
      <div className="flex justify-between items-center mb-3">
        <span className="text-lg font-bold">{coin.icon} {coin.symbol}</span>
        <span className="text-sm bg-crypto-blue/20 text-crypto-blue px-2 py-1 rounded">
          {score}/140
        </span>
      </div>
      
      <p className="text-3xl font-bold text-crypto-green mb-2">
        {formatPrice(coin.price)}
      </p>
      
      <p className={`inline-block px-3 py-1 rounded-lg text-sm font-bold ${isPositive ? 'bg-crypto-green/20 text-crypto-green' : 'bg-crypto-red/20 text-crypto-red'}`}>
        {isPositive ? '+' : ''}{coin.change.toFixed(2)}%
      </p>

      <div className={`mt-4 text-center font-bold ${isPositive ? 'text-crypto-green' : 'text-crypto-red'}`}>
        {isPositive ? '📈 매수' : '📉 약세'}
      </div>

      {/* PRO 전용: 트레이딩 정보 */}
      {isPro ? (
        <div className="mt-4 bg-crypto-blue/10 rounded-lg p-3 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex justify-between">
              <span className="text-white/50">{isPositive ? '롱' : '숏'} 진입가:</span>
              <span className="text-crypto-blue font-bold">{formatPrice(entry)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">목표가:</span>
              <span className="text-crypto-green font-bold">{formatPrice(target)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">손절가:</span>
              <span className="text-crypto-red font-bold">{formatPrice(stop)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">손익비:</span>
              <span className="text-crypto-yellow font-bold">1:1.00</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-4 bg-white/5 rounded-lg p-3 text-center text-sm text-white/50">
          🔒 트레이딩 정보는 PRO 전용
        </div>
      )}
    </div>
  )
}
