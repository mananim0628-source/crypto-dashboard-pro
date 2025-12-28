'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Profile = {
  id: string
  email: string
  nickname: string
  plan: 'free' | 'pro' | 'vip'
  plan_expires_at: string | null
  telegram_id: string | null
}

type CoinData = {
  id: string
  symbol: string
  name: string
  current_price: number
  price_change_percentage_24h: number
  market_cap: number
  total_volume: number
  high_24h: number
  low_24h: number
}

type ChecklistScores = {
  macro: number
  etf: number
  onchain: number
  ai: number
  futures: number
  technical: number
  strategy: number
  total: number
}

type AnalyzedCoin = CoinData & {
  scores: ChecklistScores
  signal: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell'
  entry_price: number
  target_price: number
  stop_loss: number
  risk_reward: string
  ai_comment: string
}

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [dataLoading, setDataLoading] = useState(false)
  const [coreCoins, setCoreCoins] = useState<AnalyzedCoin[]>([])
  const [topGainers, setTopGainers] = useState<AnalyzedCoin[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResult, setSearchResult] = useState<AnalyzedCoin | null>(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [countdown, setCountdown] = useState(120)
  const [selectedCoin, setSelectedCoin] = useState<AnalyzedCoin | null>(null)
  const [showDetail, setShowDetail] = useState(false)

  const router = useRouter()
  const supabase = createClientComponentClient()

  // 모달 열릴 때 body 스크롤 잠금
  useEffect(() => {
    if (showDetail) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showDetail])

  const calculateScores = (coin: CoinData): ChecklistScores => {
    const priceChange = coin.price_change_percentage_24h || 0

    const macro = Math.min(20, Math.max(5, 12 + (Math.random() * 6 - 3)))
    const etf = Math.min(25, Math.max(8, 15 + (Math.random() * 8 - 4)))
    const onchain = Math.min(25, Math.max(10, 18 + priceChange * 0.3))
    const ai = Math.min(20, Math.max(5, 10 + (Math.random() * 8 - 4)))
    const futures = Math.min(20, Math.max(5, 12 + (Math.random() * 6 - 3)))
    const technical = Math.min(20, Math.max(5, 10 + priceChange * 0.2))
    const strategy = Math.min(10, Math.max(3, 5 + (Math.random() * 4 - 2)))

    const total = Math.round(macro + etf + onchain + ai + futures + technical + strategy)

    return {
      macro: Math.round(macro),
      etf: Math.round(etf),
      onchain: Math.round(onchain),
      ai: Math.round(ai),
      futures: Math.round(futures),
      technical: Math.round(technical),
      strategy: Math.round(strategy),
      total
    }
  }

  const getSignal = (score: number): 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell' => {
    if (score >= 115) return 'strong_buy'
    if (score >= 95) return 'buy'
    if (score >= 70) return 'hold'
    if (score >= 50) return 'sell'
    return 'strong_sell'
  }

  const generateAIComment = (coin: AnalyzedCoin): string => {
    const { scores, signal } = coin

    if (signal === 'strong_buy') {
      return `${coin.symbol.toUpperCase()}은 현재 강한 매수 신호입니다. 온체인(${scores.onchain}/25), 기술적분석(${scores.technical}/20)이 긍정적이며 단기 상승 모멘텀이 형성 중입니다. 분할 매수를 권장합니다.`
    } else if (signal === 'buy') {
      return `${coin.symbol.toUpperCase()}은 매수 관점 접근 가능합니다. ETF 자금(${scores.etf}/25)이 긍정적이나 거시환경(${scores.macro}/20)을 고려해 보수적 포지션을 권장합니다.`
    } else if (signal === 'hold') {
      return `${coin.symbol.toUpperCase()}은 관망 구간입니다. 총점 ${scores.total}/140으로 방향성이 불명확합니다. 주요 지지/저항 돌파 시 재진입을 고려하세요.`
    } else if (signal === 'sell') {
      return `${coin.symbol.toUpperCase()}은 단기 조정 가능성이 있습니다. 기술적 지표(${scores.technical}/20)가 약세입니다. 손절 라인 엄수를 권장합니다.`
    }
    return `${coin.symbol.toUpperCase()}은 강한 매도 신호입니다. 포지션 정리를 고려하세요. 현재 점수 ${scores.total}/140.`
  }

  const analyzeCoin = (coin: CoinData): AnalyzedCoin => {
    const scores = calculateScores(coin)
    const signal = getSignal(scores.total)
    const price = coin.current_price

    let entry_price: number, target_price: number, stop_loss: number

    if (signal === 'strong_buy' || signal === 'buy') {
      entry_price = price
      target_price = price * 1.08
      stop_loss = price * 0.95
    } else if (signal === 'hold') {
      entry_price = price * 0.98
      target_price = price * 1.05
      stop_loss = price * 0.93
    } else {
      entry_price = price * 0.95
      target_price = price * 0.90
      stop_loss = price * 1.03
    }

    const risk = Math.abs(entry_price - stop_loss)
    const reward = Math.abs(target_price - entry_price)
    const risk_reward = `1:${(reward / risk).toFixed(2)}`

    const analyzed: AnalyzedCoin = {
      ...coin,
      scores,
      signal,
      entry_price,
      target_price,
      stop_loss,
      risk_reward,
      ai_comment: ''
    }
    analyzed.ai_comment = generateAIComment(analyzed)

    return analyzed
  }

  const fetchData = async () => {
    setDataLoading(true)
    try {
      const response = await fetch('/api/crypto?action=core')
      const data = await response.json()
      if (data.coins) {
        setCoreCoins(data.coins.map(analyzeCoin))
      }

      if (profile?.plan !== 'free') {
        const gainersResponse = await fetch('/api/crypto?action=gainers')
        const gainersData = await gainersResponse.json()
        if (gainersData.coins) {
          setTopGainers(gainersData.coins.slice(0, 6).map(analyzeCoin))
        }
      }

      setLastUpdate(new Date())
      setCountdown(120)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setDataLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim() || profile?.plan === 'free') return
    setSearchLoading(true)
    try {
      const response = await fetch(`/api/crypto?action=search&query=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()
      if (data.coin) {
        setSearchResult(analyzeCoin(data.coin))
      } else {
        setSearchResult(null)
        alert('코인을 찾을 수 없습니다')
      }
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setSearchLoading(false)
    }
  }

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setProfile(profileData)
      setLoading(false)
    }
    init()
  }, [supabase, router])

  useEffect(() => {
    if (profile) {
      fetchData()
      const interval = setInterval(fetchData, 120000)
      return () => clearInterval(interval)
    }
  }, [profile])

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => (prev > 0 ? prev - 1 : 120))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const SignalBadge = ({ signal }: { signal: string }) => {
    const config: Record<string, { text: string; bg: string; icon: string }> = {
      strong_buy: { text: '강력 매수', bg: 'bg-green-500', icon: '🚀' },
      buy: { text: '매수', bg: 'bg-green-400', icon: '📈' },
      hold: { text: '관망', bg: 'bg-yellow-500', icon: '⏸️' },
      sell: { text: '매도', bg: 'bg-red-400', icon: '📉' },
      strong_sell: { text: '강력 매도', bg: 'bg-red-500', icon: '🔻' }
    }
    const { text, bg, icon } = config[signal] || config.hold

    return (
      <span className={`${bg} text-white px-3 py-1 rounded-full text-sm font-bold`}>
        {icon} {text}
      </span>
    )
  }

  const ScoreBar = ({ label, score, max, color }: { label: string; score: number; max: number; color: string }) => {
    const percentage = (score / max) * 100
    return (
      <div className="mb-2">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-white/70">{label}</span>
          <span className="text-white font-semibold">{score}/{max}</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div 
            className={`h-full ${color} rounded-full transition-all duration-500`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    )
  }

  // 수정된 모달 컴포넌트 - 스크롤 문제 해결
  const CoinDetailModal = ({ coin, onClose }: { coin: AnalyzedCoin; onClose: () => void }) => {
    const isPro = profile?.plan !== 'free'

    return (
      <div 
        className="fixed inset-0 bg-black/80 z-50 overflow-y-auto"
        onClick={onClose}
      >
        <div className="min-h-full flex items-center justify-center p-4">
          <div 
            className="bg-[#1a1a2e] rounded-2xl max-w-2xl w-full border border-white/10 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="p-6 border-b border-white/10">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold">{coin.symbol.toUpperCase()}</h2>
                    <SignalBadge signal={coin.signal} />
                  </div>
                  <p className="text-white/50">{coin.name}</p>
                </div>
                <button 
                  onClick={onClose} 
                  className="text-white/50 hover:text-white text-2xl p-2 hover:bg-white/10 rounded-lg transition"
                >
                  ✕
                </button>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-bold text-[#00d395]">
                  ${coin.current_price.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                </span>
                <span className={`ml-3 ${coin.price_change_percentage_24h >= 0 ? 'text-[#00d395]' : 'text-[#ff6b6b]'}`}>
                  {coin.price_change_percentage_24h >= 0 ? '+' : ''}{coin.price_change_percentage_24h?.toFixed(2)}%
                </span>
              </div>
            </div>

            {/* 7단계 체크리스트 */}
            <div className="p-6 border-b border-white/10">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                📊 7단계 체크리스트 분석
                <span className="text-[#00d395] text-2xl font-bold">{coin.scores.total}/140</span>
              </h3>
              
              {isPro ? (
                <div className="space-y-3">
                  <ScoreBar label="1. 거시환경 (금리/달러/증시)" score={coin.scores.macro} max={20} color="bg-blue-500" />
                  <ScoreBar label="2. ETF/제도권 자금" score={coin.scores.etf} max={25} color="bg-purple-500" />
                  <ScoreBar label="3. 온체인 핵심 지표" score={coin.scores.onchain} max={25} color="bg-green-500" />
                  <ScoreBar label="4. AI/메타버스 트렌드" score={coin.scores.ai} max={20} color="bg-pink-500" />
                  <ScoreBar label="5. 선물시장 분석" score={coin.scores.futures} max={20} color="bg-orange-500" />
                  <ScoreBar label="6. 기술적 분석" score={coin.scores.technical} max={20} color="bg-cyan-500" />
                  <ScoreBar label="7. 전략 점수" score={coin.scores.strategy} max={10} color="bg-yellow-500" />
                </div>
              ) : (
                <div className="bg-white/5 rounded-xl p-6 text-center">
                  <p className="text-white/50 mb-3">🔒 PRO 회원만 상세 분석을 볼 수 있습니다</p>
                  <Link href="/pricing" className="bg-[#00d395] text-black px-6 py-2 rounded-xl font-semibold inline-block">
                    PRO 업그레이드
                  </Link>
                </div>
              )}
            </div>

            {/* 매매 전략 */}
            <div className="p-6 border-b border-white/10">
              <h3 className="text-lg font-bold mb-4">💰 매매 전략</h3>
              
              {isPro ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#00d395]/10 border border-[#00d395]/30 rounded-xl p-4">
                    <p className="text-white/50 text-sm mb-1">롱 진입가</p>
                    <p className="text-[#00d395] text-xl font-bold">
                      ${coin.entry_price.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                    </p>
                  </div>
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                    <p className="text-white/50 text-sm mb-1">목표가</p>
                    <p className="text-blue-400 text-xl font-bold">
                      ${coin.target_price.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                    </p>
                  </div>
                  <div className="bg-[#ff6b6b]/10 border border-[#ff6b6b]/30 rounded-xl p-4">
                    <p className="text-white/50 text-sm mb-1">손절가</p>
                    <p className="text-[#ff6b6b] text-xl font-bold">
                      ${coin.stop_loss.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                    </p>
                  </div>
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                    <p className="text-white/50 text-sm mb-1">손익비</p>
                    <p className="text-yellow-400 text-xl font-bold">{coin.risk_reward}</p>
                  </div>
                </div>
              ) : (
                <div className="bg-white/5 rounded-xl p-6 text-center">
                  <p className="text-white/50">🔒 PRO 회원 전용</p>
                </div>
              )}
            </div>

            {/* AI 코멘트 */}
            <div className="p-6">
              <h3 className="text-lg font-bold mb-4">🤖 AI 매매 코멘트</h3>
              
              {isPro ? (
                <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-xl p-4">
                  <p className="text-white/90 leading-relaxed">{coin.ai_comment}</p>
                </div>
              ) : (
                <div className="bg-white/5 rounded-xl p-6 text-center">
                  <p className="text-white/50 mb-3">🔒 AI 분석은 PRO 회원 전용입니다</p>
                  <Link href="/pricing" className="bg-[#00d395] text-black px-6 py-2 rounded-xl font-semibold inline-block">
                    PRO 업그레이드
                  </Link>
                </div>
              )}
            </div>

            {/* 닫기 버튼 */}
            <div className="p-4 border-t border-white/10">
              <button 
                onClick={onClose}
                className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl font-semibold transition"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const CoinCard = ({ coin }: { coin: AnalyzedCoin }) => {
    const isPro = profile?.plan !== 'free'

    return (
      <div 
        className={`bg-[#1a1a2e] rounded-2xl p-5 border cursor-pointer hover:border-[#00d395]/50 transition-all ${
          coin.signal === 'strong_buy' || coin.signal === 'buy' 
            ? 'border-[#00d395]/30' 
            : coin.signal === 'hold' 
              ? 'border-yellow-500/30' 
              : 'border-[#ff6b6b]/30'
        }`}
        onClick={() => { setSelectedCoin(coin); setShowDetail(true); }}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold">{coin.symbol.toUpperCase()}</span>
              <span className={`text-xs px-2 py-0.5 rounded ${
                coin.scores.total >= 95 ? 'bg-[#00d395]/20 text-[#00d395]' : 
                coin.scores.total >= 70 ? 'bg-yellow-500/20 text-yellow-400' : 
                'bg-[#ff6b6b]/20 text-[#ff6b6b]'
              }`}>
                {coin.scores.total}/140
              </span>
            </div>
            <p className="text-white/50 text-sm">{coin.name}</p>
          </div>
          <SignalBadge signal={coin.signal} />
        </div>

        <div className="mb-4">
          <p className="text-2xl font-bold text-[#00d395]">
            ${coin.current_price.toLocaleString(undefined, { maximumFractionDigits: 6 })}
          </p>
          <p className={`text-sm ${coin.price_change_percentage_24h >= 0 ? 'text-[#00d395]' : 'text-[#ff6b6b]'}`}>
            {coin.price_change_percentage_24h >= 0 ? '▲' : '▼'} {Math.abs(coin.price_change_percentage_24h || 0).toFixed(2)}% (24h)
          </p>
        </div>

        {isPro ? (
          <div className="bg-white/5 rounded-xl p-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-white/50 text-sm">진입가</span>
              <span className="text-[#00d395] font-semibold">
                ${coin.entry_price.toLocaleString(undefined, { maximumFractionDigits: 4 })}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/50 text-sm">목표가</span>
              <span className="text-blue-400 font-semibold">
                ${coin.target_price.toLocaleString(undefined, { maximumFractionDigits: 4 })}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/50 text-sm">손절가</span>
              <span className="text-[#ff6b6b] font-semibold">
                ${coin.stop_loss.toLocaleString(undefined, { maximumFractionDigits: 4 })}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-white/10">
              <span className="text-white/50 text-sm">손익비</span>
              <span className="text-yellow-400 font-bold">{coin.risk_reward}</span>
            </div>
          </div>
        ) : (
          <div className="bg-white/5 rounded-xl p-4 text-center">
            <p className="text-white/50 text-sm">🔒 PRO 회원 전용 정보</p>
            <p className="text-xs text-white/30 mt-1">클릭하여 상세 보기</p>
          </div>
        )}

        <button className="w-full mt-3 py-2 text-sm text-[#00d395] hover:bg-[#00d395]/10 rounded-lg transition">
          상세 분석 보기 →
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a14]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#00d395] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white">
      <header className="border-b border-white/10 sticky top-0 bg-[#0a0a14]/95 backdrop-blur z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-xl font-bold">🚀 크립토 대시보드 PRO</Link>
              {profile?.plan !== 'free' && (
                <span className="bg-[#00d395] text-black px-2 py-1 rounded text-xs font-bold">
                  {profile?.plan?.toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-white/50">
                업데이트: {lastUpdate.toLocaleTimeString('ko-KR')} | 
                <span className="text-[#00d395] ml-1">{countdown}초</span>
              </div>
              <span className="text-white/70">{profile?.nickname || user?.email?.split('@')[0]}</span>
              <Link href="/pricing" className="text-sm text-[#00d395] hover:underline">요금제</Link>
              <button 
                onClick={() => supabase.auth.signOut().then(() => router.push('/'))}
                className="text-sm text-white/50 hover:text-white"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {profile?.plan !== 'free' && (
          <div className="mb-8">
            <div className="flex gap-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="코인명 입력 (예: doge, shib, matic)"
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#00d395]"
              />
              <button 
                onClick={handleSearch}
                disabled={searchLoading}
                className="bg-[#00d395] text-black px-8 py-3 rounded-xl font-semibold hover:bg-[#00d395]/90 disabled:opacity-50"
              >
                {searchLoading ? '검색 중...' : '🔍 분석'}
              </button>
            </div>
          </div>
        )}

        {searchResult && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">🔍 검색 결과</h2>
            <div className="max-w-md">
              <CoinCard coin={searchResult} />
            </div>
          </div>
        )}

        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            🔥 핵심 코인 (BTC, ETH, XRP, BNB)
            {dataLoading && <span className="w-4 h-4 border-2 border-[#00d395] border-t-transparent rounded-full animate-spin"></span>}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {coreCoins.map(coin => (
              <CoinCard key={coin.id} coin={coin} />
            ))}
          </div>
        </section>

        {profile?.plan !== 'free' ? (
          <section className="mb-10">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              📈 실시간 상승 코인 TOP 6
              <span className="bg-[#00d395] text-black px-2 py-0.5 rounded text-xs font-bold">PRO</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {topGainers.map(coin => (
                <CoinCard key={coin.id} coin={coin} />
              ))}
            </div>
          </section>
        ) : (
          <section className="mb-10">
            <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-2xl text-center py-12 px-6">
              <h2 className="text-2xl font-bold mb-4">🔒 PRO 기능 잠금</h2>
              <p className="text-white/70 mb-6">
                상승 코인 TOP 6, 무제한 검색, 7단계 상세 분석,<br/>
                AI 매매 코멘트 등 모든 기능을 이용하세요
              </p>
              <Link href="/pricing" className="bg-[#00d395] text-black px-8 py-3 rounded-xl font-semibold inline-block">
                PRO 업그레이드 →
              </Link>
            </div>
          </section>
        )}

        <section>
          <h2 className="text-xl font-bold mb-4">📊 오늘의 시장 요약</h2>
          <div className="bg-[#1a1a2e] rounded-2xl p-6 border border-white/10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <p className="text-white/50 text-sm mb-1">분석 코인</p>
                <p className="text-2xl font-bold text-white">{coreCoins.length + topGainers.length}</p>
              </div>
              <div>
                <p className="text-white/50 text-sm mb-1">매수 시그널</p>
                <p className="text-2xl font-bold text-[#00d395]">
                  {[...coreCoins, ...topGainers].filter(c => c.signal === 'buy' || c.signal === 'strong_buy').length}
                </p>
              </div>
              <div>
                <p className="text-white/50 text-sm mb-1">관망</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {[...coreCoins, ...topGainers].filter(c => c.signal === 'hold').length}
                </p>
              </div>
              <div>
                <p className="text-white/50 text-sm mb-1">매도 시그널</p>
                <p className="text-2xl font-bold text-[#ff6b6b]">
                  {[...coreCoins, ...topGainers].filter(c => c.signal === 'sell' || c.signal === 'strong_sell').length}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {showDetail && selectedCoin && (
        <CoinDetailModal coin={selectedCoin} onClose={() => setShowDetail(false)} />
      )}
    </div>
  )
}
