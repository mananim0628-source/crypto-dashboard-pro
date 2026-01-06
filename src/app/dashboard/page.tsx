'use client'

import { useState, useEffect, useRef, useLayoutEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Lang = 'ko' | 'en'
type Profile = { id: string; email: string; nickname: string; plan: 'free' | 'pro' | 'vip'; plan_expires_at: string | null; telegram_id: string | null }
type CoinData = { id: string; symbol: string; name: string; current_price: number; price_change_percentage_24h: number; market_cap: number; total_volume: number; high_24h: number; low_24h: number }
type ChecklistScores = { macro: number; etf: number; onchain: number; ai: number; futures: number; technical: number; strategy: number; total: number }
type AnalyzedCoin = CoinData & { scores: ChecklistScores; signal: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell'; entry_price: number; target_price: number; stop_loss: number; risk_reward: string; ai_comment: string }
type Favorite = { id: string; coin_id: string; coin_symbol: string; coin_name: string }
type AlertSettings = { id?: string; user_id: string; selected_coins: string[]; score_threshold: number; time_morning: boolean; time_afternoon: boolean; time_evening: boolean; time_night: boolean; alert_signal: boolean; alert_score_change: boolean; alert_price: boolean; telegram_id?: string | null }
type PortfolioPosition = { id: string; user_id: string; coin_symbol: string; coin_name: string; position_type: 'LONG' | 'SHORT'; entry_price: number; target_price: number; stop_loss: number; amount?: number; entry_date: string; exit_price?: number; exit_date?: string; closed_at?: string; status: 'active' | 'closed' | 'cancelled'; notes?: string }
type AlertNotification = { id: string; coin: string; type: 'signal' | 'score' | 'price'; message: string; time: Date; read: boolean }

const formatPrice = (price: number): string => {
  if (price === 0) return '$0'
  if (price >= 1) return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  if (price >= 0.01) return `$${price.toFixed(4)}`
  return `$${price.toFixed(6)}`
}

export default function Dashboard() {
  const [lang, setLang] = useState<Lang>('ko')
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [coreCoins, setCoreCoins] = useState<AnalyzedCoin[]>([])
  const [topGainers, setTopGainers] = useState<AnalyzedCoin[]>([])
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [favoriteCoins, setFavoriteCoins] = useState<AnalyzedCoin[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResult, setSearchResult] = useState<AnalyzedCoin | null>(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [countdown, setCountdown] = useState(120)
  const [selectedCoin, setSelectedCoin] = useState<AnalyzedCoin | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'alerts' | 'portfolio' | 'indicator' | 'report'>('dashboard')
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [themeLoaded, setThemeLoaded] = useState(false)
  const [alertSettings, setAlertSettings] = useState<AlertSettings | null>(null)
  const [portfolioPositions, setPortfolioPositions] = useState<PortfolioPosition[]>([])
  const [notifications, setNotifications] = useState<AlertNotification[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [positionCoin, setPositionCoin] = useState('BTC')
  const [positionType, setPositionType] = useState<'LONG' | 'SHORT'>('LONG')
  const [entryValue, setEntryValue] = useState('')
  const [targetValue, setTargetValue] = useState('')
  const [stopValue, setStopValue] = useState('')
  const [sliderValue, setSliderValue] = useState(90)
  const [telegramId, setTelegramId] = useState('')
  const notificationRef = useRef<HTMLDivElement>(null)
  
  // ✅ AI 코멘트 관련 State
  const [aiComments, setAiComments] = useState<Record<string, string>>({})
  const [loadingComments, setLoadingComments] = useState(false)

  const allCoins = ['BTC', 'ETH', 'XRP', 'BNB', 'SOL', 'ADA', 'DOGE', 'MATIC', 'DOT', 'SHIB', 'AVAX', 'LINK', 'UNI', 'ATOM', 'LTC']
  const router = useRouter()
  const supabase = createClientComponentClient()

  const colors = { dark: { cardBorder: 'border-white/10', text: 'text-white', textSecondary: 'text-white/50', bg: 'bg-[#0a0a14]', cardBg: 'bg-[#1a1a2e]' }, light: { cardBorder: 'border-gray-200', text: 'text-gray-900', textSecondary: 'text-gray-500', bg: 'bg-gray-100', cardBg: 'bg-white' } }
  const currentColors = colors[theme]
  const txt = (ko: string, en: string) => lang === 'ko' ? ko : en

  const calculateScores = (coin: CoinData): ChecklistScores => {
    const priceChange = coin.price_change_percentage_24h || 0
    const macro = Math.min(20, Math.max(5, 12 + (Math.random() * 6 - 3)))
    const etf = Math.min(25, Math.max(8, 15 + (Math.random() * 8 - 4)))
    const onchain = Math.min(25, Math.max(10, 18 + priceChange * 0.3))
    const ai = Math.min(20, Math.max(5, 10 + (Math.random() * 8 - 4)))
    const futures = Math.min(20, Math.max(5, 12 + (Math.random() * 6 - 3)))
    const technical = Math.min(20, Math.max(5, 10 + priceChange * 0.2))
    const strategy = Math.min(10, Math.max(3, 5 + (Math.random() * 4 - 2)))
    return { macro: Math.round(macro), etf: Math.round(etf), onchain: Math.round(onchain), ai: Math.round(ai), futures: Math.round(futures), technical: Math.round(technical), strategy: Math.round(strategy), total: Math.round(macro + etf + onchain + ai + futures + technical + strategy) }
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
    if (lang === 'en') { 
      if (signal === 'strong_buy') return `${coin.symbol.toUpperCase()} shows strong buy. On-chain(${scores.onchain}/25) positive.`
      if (signal === 'buy') return `${coin.symbol.toUpperCase()} buy zone. ETF(${scores.etf}/25) positive.`
      if (signal === 'hold') return `${coin.symbol.toUpperCase()} hold. Score ${scores.total}/140.`
      return `${coin.symbol.toUpperCase()} correction possible.` 
    }
    if (signal === 'strong_buy') return `${coin.symbol.toUpperCase()} 강한 매수. 온체인(${scores.onchain}/25) 긍정적.`
    if (signal === 'buy') return `${coin.symbol.toUpperCase()} 매수 구간. ETF(${scores.etf}/25) 긍정적.`
    if (signal === 'hold') return `${coin.symbol.toUpperCase()} 관망. 점수 ${scores.total}/140.`
    return `${coin.symbol.toUpperCase()} 조정 가능성.`
  }

  const analyzeCoin = (coin: CoinData): AnalyzedCoin => {
    const scores = calculateScores(coin)
    const signal = getSignal(scores.total)
    const price = coin.current_price
    let target_price: number, stop_loss: number, risk_reward: string
    if (signal === 'strong_buy') { target_price = price * 1.045; stop_loss = price * 0.97; risk_reward = '1:1.5' }
    else if (signal === 'buy') { target_price = price * 1.042; stop_loss = price * 0.97; risk_reward = '1:1.4' }
    else if (signal === 'hold') { target_price = price * 1.036; stop_loss = price * 0.97; risk_reward = '1:1.2' }
    else { target_price = price * 1.03; stop_loss = price * 0.97; risk_reward = '1:1.0' }
    const analyzed: AnalyzedCoin = { ...coin, scores, signal, entry_price: price, target_price, stop_loss, risk_reward, ai_comment: '' }
    analyzed.ai_comment = generateAIComment(analyzed)
    return analyzed
  }

  // ✅ AI 코멘트 상세화 함수
  const generateDetailedAIComment = (coin: AnalyzedCoin): string => {
    const { scores, signal, symbol, price_change_percentage_24h } = coin
    const priceChange = price_change_percentage_24h || 0
    
    const scoreItems = [
      { name: lang === 'ko' ? '거시환경' : 'Macro', score: scores.macro, max: 20 },
      { name: lang === 'ko' ? 'ETF/제도권' : 'ETF', score: scores.etf, max: 25 },
      { name: lang === 'ko' ? '온체인' : 'On-chain', score: scores.onchain, max: 25 },
      { name: lang === 'ko' ? 'AI분석' : 'AI', score: scores.ai, max: 20 },
      { name: lang === 'ko' ? '선물시장' : 'Futures', score: scores.futures, max: 20 },
      { name: lang === 'ko' ? '기술적분석' : 'Technical', score: scores.technical, max: 20 },
    ]
    
    const sortedScores = [...scoreItems].sort((a, b) => (b.score / b.max) - (a.score / a.max))
    const bestScore = sortedScores[0]
    const worstScore = sortedScores[sortedScores.length - 1]
    
    let comment = ''
    
    if (lang === 'ko') {
      if (signal === 'strong_buy') {
        comment = `🚀 ${symbol.toUpperCase()}는 총점 ${scores.total}/140점으로 강력 매수 구간입니다.\n\n`
        comment += `✅ 강점: ${bestScore.name} 지표가 ${bestScore.score}/${bestScore.max}점으로 매우 긍정적입니다.\n`
        if (scores.onchain >= 20) comment += `✅ 온체인 데이터(${scores.onchain}/25)가 대량 매집을 시사합니다.\n`
        if (scores.etf >= 20) comment += `✅ 기관 자금 유입(${scores.etf}/25)이 활발합니다.\n`
        comment += `\n💡 전략: 현재가 부근 분할 매수 후, 목표가까지 홀딩 권장.`
      } else if (signal === 'buy') {
        comment = `📈 ${symbol.toUpperCase()}는 총점 ${scores.total}/140점으로 매수 관점 유효합니다.\n\n`
        comment += `✅ 강점: ${bestScore.name}(${bestScore.score}/${bestScore.max})이 긍정적입니다.\n`
        if (worstScore.score / worstScore.max < 0.5) {
          comment += `⚠️ 주의: ${worstScore.name}(${worstScore.score}/${worstScore.max})은 다소 약세입니다.\n`
        }
        comment += `\n💡 전략: 지지선 부근에서 분할 매수, 손절가 엄수.`
      } else if (signal === 'hold') {
        comment = `⏸️ ${symbol.toUpperCase()}는 총점 ${scores.total}/140점으로 중립 구간입니다.\n\n`
        comment += `📊 현황: 명확한 방향성이 부재합니다.\n`
        if (priceChange > 3) {
          comment += `⚠️ 24시간 ${priceChange.toFixed(1)}% 상승 후 단기 조정 가능성에 주의하세요.\n`
        } else if (priceChange < -3) {
          comment += `👀 24시간 ${Math.abs(priceChange).toFixed(1)}% 하락 후 반등 가능성을 지켜보세요.\n`
        }
        comment += `\n💡 전략: 추세 확인 후 진입 권장. 현재는 관망.`
      } else {
        comment = `📉 ${symbol.toUpperCase()}는 총점 ${scores.total}/140점으로 약세 구간입니다.\n\n`
        comment += `❌ 약점: ${worstScore.name}(${worstScore.score}/${worstScore.max})이 부정적입니다.\n`
        comment += `\n💡 전략: 신규 진입 비권장. 기존 포지션은 손절가 타이트하게 관리.`
      }
    } else {
      if (signal === 'strong_buy') {
        comment = `🚀 ${symbol.toUpperCase()} scores ${scores.total}/140 - STRONG BUY zone.\n\n`
        comment += `✅ Strength: ${bestScore.name} at ${bestScore.score}/${bestScore.max} is very positive.\n`
        comment += `\n💡 Strategy: DCA near current price, hold to target.`
      } else if (signal === 'buy') {
        comment = `📈 ${symbol.toUpperCase()} scores ${scores.total}/140 - BUY zone.\n\n`
        comment += `✅ Strength: ${bestScore.name}(${bestScore.score}/${bestScore.max}) is positive.\n`
        comment += `\n💡 Strategy: Buy at support, strict stop-loss.`
      } else if (signal === 'hold') {
        comment = `⏸️ ${symbol.toUpperCase()} scores ${scores.total}/140 - NEUTRAL zone.\n\n`
        comment += `📊 No clear direction.\n`
        comment += `\n💡 Strategy: Wait for trend confirmation.`
      } else {
        comment = `📉 ${symbol.toUpperCase()} scores ${scores.total}/140 - BEARISH zone.\n\n`
        comment += `❌ ${worstScore.name}(${worstScore.score}/${worstScore.max}) is weak.\n`
        comment += `\n💡 Strategy: Avoid new longs. Manage risk.`
      }
    }
    
    return comment
  }

  // ✅ AI 코멘트 로딩 함수
  const fetchAIComments = async (coinsData: AnalyzedCoin[]) => {
    if (!coinsData.length) return
    setLoadingComments(true)
    
    try {
      const CORE_COINS = ['BTC', 'ETH', 'XRP', 'BNB']
      const allComments: Record<string, string> = {}
      
      coinsData.forEach(coin => {
        const symbol = coin.symbol.toUpperCase()
        if (CORE_COINS.includes(symbol) || coin.scores.total >= 90) {
          allComments[symbol] = generateDetailedAIComment(coin)
        } else {
          allComments[symbol] = coin.ai_comment
        }
      })
      
      setAiComments(allComments)
    } catch (error) {
      console.error('AI 코멘트 생성 실패:', error)
    } finally {
      setLoadingComments(false)
    }
  }

  useLayoutEffect(() => { 
    const savedTheme = localStorage.getItem('dashboard-theme')
    const savedLang = localStorage.getItem('dashboard-lang') as Lang | null
    if (savedTheme === 'light') setTheme('light')
    else { setTheme('dark'); localStorage.setItem('dashboard-theme', 'dark') }
    if (savedLang === 'en') setLang('en')
    setThemeLoaded(true) 
  }, [])

  useEffect(() => { 
    document.body.style.overflow = showDetail ? 'hidden' : ''
    return () => { document.body.style.overflow = '' } 
  }, [showDetail])

  useEffect(() => {
    let mounted = true
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) { router.push('/login'); return }
        if (!mounted) return
        setUser(session.user)
        const { data: profileData } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
        if (mounted && profileData) setProfile(profileData)
        if (mounted) setLoading(false)
        
        try { 
          const response = await fetch('/api/crypto?action=core')
          const data = await response.json()
          if (mounted && data.coins) setCoreCoins(data.coins.map(analyzeCoin)) 
        } catch (e) {}
        
        if (profileData?.plan !== 'free') { 
          try { 
            const gainersResponse = await fetch('/api/crypto?action=gainers')
            const gainersData = await gainersResponse.json()
            if (mounted && gainersData.coins) setTopGainers(gainersData.coins.slice(0, 6).map(analyzeCoin)) 
          } catch (e) {} 
        }
        
        setLastUpdate(new Date())
        
        try { 
          const { data: favData } = await supabase.from('favorites').select('*').eq('user_id', session.user.id)
          if (mounted && favData) setFavorites(favData)
        } catch (e) {}
        
        try { 
          const { data: alertData } = await supabase.from('alert_settings').select('*').eq('user_id', session.user.id).single()
          if (mounted && alertData) {
            setAlertSettings(alertData)
            setSliderValue(alertData.score_threshold)
            if (alertData.telegram_id) setTelegramId(alertData.telegram_id)
          } else {
            setAlertSettings({ user_id: session.user.id, selected_coins: ['BTC', 'ETH'], score_threshold: 90, time_morning: true, time_afternoon: true, time_evening: true, time_night: false, alert_signal: true, alert_score_change: true, alert_price: true })
          }
        } catch (e) {}
        
        try { 
          const { data: portfolioData } = await supabase.from('portfolio_positions').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false })
          if (mounted && portfolioData) setPortfolioPositions(portfolioData) 
        } catch (e) {}
        
      } catch (error) { if (mounted) setLoading(false) }
    }
    init()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => { if (event === 'SIGNED_OUT') router.push('/login') })
    return () => { mounted = false; subscription.unsubscribe() }
  }, [supabase, router])

  // ✅ AI 코멘트 자동 로딩
  useEffect(() => {
    if (coreCoins.length > 0) {
      fetchAIComments([...coreCoins, ...topGainers, ...favoriteCoins])
    }
  }, [coreCoins, topGainers, favoriteCoins, lang])

  useEffect(() => { 
    const timer = setInterval(() => setCountdown(prev => prev > 0 ? prev - 1 : 120), 1000)
    return () => clearInterval(timer) 
  }, [])

  const toggleLang = () => { const newLang = lang === 'ko' ? 'en' : 'ko'; setLang(newLang); localStorage.setItem('dashboard-lang', newLang) }
  const toggleTheme = () => { const newTheme = theme === 'dark' ? 'light' : 'dark'; setTheme(newTheme); localStorage.setItem('dashboard-theme', newTheme) }

  const handleSearch = async () => { 
    if (!searchQuery.trim() || profile?.plan === 'free') return
    setSearchLoading(true)
    const cleanQuery = searchQuery.toUpperCase().replace('USDT', '').replace('USD', '').trim()
    try { 
      const response = await fetch(`/api/crypto?action=search&query=${encodeURIComponent(cleanQuery)}`)
      const data = await response.json()
      if (data.coin) setSearchResult(analyzeCoin(data.coin))
      else { setSearchResult(null); alert(txt('코인을 찾을 수 없습니다', 'Coin not found')) } 
    } catch (e) {}
    setSearchLoading(false) 
  }

  const toggleFavorite = async (coin: AnalyzedCoin) => { 
    if (!user) return
    const existing = favorites.find(f => f.coin_id === coin.id)
    if (existing) { 
      await supabase.from('favorites').delete().eq('id', existing.id)
      setFavorites(favorites.filter(f => f.id !== existing.id))
      setFavoriteCoins(favoriteCoins.filter(fc => fc.id !== coin.id)) 
    } else { 
      if (profile?.plan === 'free' && favorites.length >= 3) { alert(txt('무료는 3개까지', 'Free: max 3')); return }
      const { data } = await supabase.from('favorites').insert({ user_id: user.id, coin_id: coin.id, coin_symbol: coin.symbol, coin_name: coin.name }).select().single()
      if (data) { setFavorites([data, ...favorites]); setFavoriteCoins([coin, ...favoriteCoins]) } 
    } 
  }

  const addPosition = async () => { 
    if (!user) return
    if (!entryValue || !targetValue || !stopValue) { alert(txt('모든 가격을 입력해주세요', 'Enter all prices')); return }
    const { data, error } = await supabase.from('portfolio_positions').insert({ 
      user_id: user.id, coin_symbol: positionCoin, coin_name: positionCoin, position_type: positionType, 
      entry_price: parseFloat(entryValue), target_price: parseFloat(targetValue), stop_loss: parseFloat(stopValue), status: 'active' 
    }).select().single()
    if (error) alert(txt('포지션 추가 실패', 'Failed to add position'))
    else if (data) { 
      setPortfolioPositions([data, ...portfolioPositions])
      setEntryValue(''); setTargetValue(''); setStopValue('')
      alert(txt('✅ 포지션 추가됨', '✅ Position added')) 
    } 
  }

  const deletePosition = async (position: PortfolioPosition) => { 
    if (!confirm(`${position.coin_symbol} ${position.position_type} ${txt('포지션을 삭제하시겠습니까?', 'position - delete?')}`)) return
    const { error } = await supabase.from('portfolio_positions').delete().eq('id', position.id)
    if (error) alert(txt('삭제 실패', 'Delete failed'))
    else { 
      setPortfolioPositions(portfolioPositions.filter(p => p.id !== position.id))
      alert(txt('✅ 삭제됨', '✅ Deleted')) 
    } 
  }

  const calculatePortfolioStats = () => { 
    const active = portfolioPositions.filter(p => p.status === 'active')
    const closed = portfolioPositions.filter(p => p.status === 'closed')
    let totalPnL = 0, wins = 0, losses = 0
    closed.forEach(p => { 
      if (p.exit_price) { 
        const pnl = p.position_type === 'LONG' ? ((p.exit_price - p.entry_price) / p.entry_price) * 100 : ((p.entry_price - p.exit_price) / p.entry_price) * 100
        totalPnL += pnl
        if (pnl > 0) wins++; else losses++ 
      } 
    })
    return { total: portfolioPositions.length, active: active.length, closed: closed.length, winRate: (closed.length > 0 ? (wins / closed.length) * 100 : 0).toFixed(1), totalPnL: totalPnL.toFixed(2), wins, losses } 
  }

  const getCurrentPrice = (symbol: string) => { 
    const coin = [...coreCoins, ...topGainers].find(c => c.symbol.toUpperCase() === symbol.toUpperCase())
    return coin?.current_price || 0 
  }

  const getUnrealizedPnL = (p: PortfolioPosition) => { 
    const currentPrice = getCurrentPrice(p.coin_symbol)
    if (!currentPrice) return null
    return p.position_type === 'LONG' ? ((currentPrice - p.entry_price) / p.entry_price) * 100 : ((p.entry_price - currentPrice) / p.entry_price) * 100 
  }

  const unreadCount = notifications.filter(n => !n.read).length

  const SignalBadge = ({ signal }: { signal: string }) => { 
    const config: Record<string, { text: string; bg: string; icon: string }> = { 
      strong_buy: { text: txt('강력 매수', 'Strong Buy'), bg: 'bg-green-500', icon: '🚀' }, 
      buy: { text: txt('매수', 'Buy'), bg: 'bg-green-400', icon: '📈' }, 
      hold: { text: txt('관망', 'Hold'), bg: 'bg-yellow-500', icon: '⏸️' }, 
      sell: { text: txt('매도', 'Sell'), bg: 'bg-red-400', icon: '📉' }, 
      strong_sell: { text: txt('강력 매도', 'Strong Sell'), bg: 'bg-red-500', icon: '🔻' } 
    }
    const { text, bg, icon } = config[signal] || config.hold
    return <span className={`${bg} text-white px-3 py-1 rounded-full text-sm font-bold`}>{icon} {text}</span> 
  }

  const ScoreBar = ({ label, score, max, color }: { label: string; score: number; max: number; color: string }) => (
    <div className="mb-2">
      <div className="flex justify-between text-sm mb-1">
        <span className={currentColors.textSecondary}>{label}</span>
        <span className={`${currentColors.text} font-semibold`}>{score}/{max}</span>
      </div>
      <div className={`h-2 ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'} rounded-full overflow-hidden`}>
        <div className={`h-full ${color} rounded-full`} style={{ width: `${(score / max) * 100}%` }} />
      </div>
    </div>
  )

  const CoinCard = ({ coin, showFavButton = true }: { coin: AnalyzedCoin, showFavButton?: boolean }) => {
    const isPro = profile?.plan !== 'free'
    const isFavorited = favorites.some(f => f.coin_id === coin.id)
    return (
      <div className={`${currentColors.cardBg} rounded-2xl p-5 border cursor-pointer hover:border-[#00d395]/50 transition-all relative ${coin.signal === 'strong_buy' || coin.signal === 'buy' ? 'border-[#00d395]/30' : coin.signal === 'hold' ? 'border-yellow-500/30' : 'border-[#ff6b6b]/30'}`} onClick={() => { setSelectedCoin(coin); setShowDetail(true) }}>
        {showFavButton && <button onClick={(e) => { e.stopPropagation(); toggleFavorite(coin) }} className={`absolute top-3 right-3 text-xl ${isFavorited ? 'text-yellow-400' : 'text-white/30 hover:text-yellow-400'}`}>{isFavorited ? '★' : '☆'}</button>}
        <div className="flex justify-between items-start mb-4 pr-8">
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xl font-bold ${currentColors.text}`}>{coin.symbol.toUpperCase()}</span>
              <span className={`text-xs px-2 py-0.5 rounded ${coin.scores.total >= 95 ? 'bg-[#00d395]/20 text-[#00d395]' : coin.scores.total >= 70 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-[#ff6b6b]/20 text-[#ff6b6b]'}`}>{coin.scores.total}/140</span>
            </div>
            <p className={currentColors.textSecondary + ' text-sm'}>{coin.name}</p>
          </div>
          <SignalBadge signal={coin.signal} />
        </div>
        <div className="mb-4">
          <p className="text-2xl font-bold text-[#00d395]">{formatPrice(coin.current_price)}</p>
          <p className={`text-sm ${coin.price_change_percentage_24h >= 0 ? 'text-[#00d395]' : 'text-[#ff6b6b]'}`}>{coin.price_change_percentage_24h >= 0 ? '▲' : '▼'} {Math.abs(coin.price_change_percentage_24h || 0).toFixed(2)}%</p>
        </div>
        {isPro ? (
          <div className={`${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-3 space-y-2`}>
            <div className="flex justify-between"><span className={currentColors.textSecondary + ' text-sm'}>{txt('진입가', 'Entry')}</span><span className="text-[#00d395] font-semibold">{formatPrice(coin.entry_price)}</span></div>
            <div className="flex justify-between"><span className={currentColors.textSecondary + ' text-sm'}>{txt('목표가', 'Target')}</span><span className="text-blue-400 font-semibold">{formatPrice(coin.target_price)}</span></div>
            <div className="flex justify-between"><span className={currentColors.textSecondary + ' text-sm'}>{txt('손절가', 'Stop')}</span><span className="text-[#ff6b6b] font-semibold">{formatPrice(coin.stop_loss)}</span></div>
            <div className={`flex justify-between pt-2 border-t ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}><span className={currentColors.textSecondary + ' text-sm'}>{txt('손익비', 'R:R')}</span><span className="text-yellow-400 font-bold">{coin.risk_reward}</span></div>
          </div>
        ) : (
          <div className={`${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-4 text-center`}>
            <p className={currentColors.textSecondary + ' text-sm'}>🔒 PRO {txt('전용', 'Only')}</p>
          </div>
        )}
        <button className="w-full mt-3 py-2 text-sm text-[#00d395] hover:bg-[#00d395]/10 rounded-lg">{txt('상세 분석 →', 'Details →')}</button>
      </div>
    )
  }

  if (!themeLoaded || loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a14]">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#00d395] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white">{txt('로딩 중...', 'Loading...')}</p>
      </div>
    </div>
  )

  return (
    <div className={`min-h-screen ${currentColors.bg} ${currentColors.text}`}>
      {/* 헤더 */}
      <header className={`border-b ${theme === 'dark' ? 'border-white/10 bg-[#0a0a14]/95' : 'border-gray-200 bg-white/95'} sticky top-0 backdrop-blur z-40`}>
        <div className="max-w-[1600px] mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 md:gap-4">
              <Link href="/" className="text-lg md:text-xl font-bold whitespace-nowrap">🚀 {txt('크립토 대시보드', 'Crypto Dashboard')} PRO</Link>
              {profile?.plan !== 'free' && <span className="bg-[#00d395] text-black px-2 py-1 rounded text-xs font-bold">{profile?.plan?.toUpperCase()}</span>}
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <button onClick={toggleLang} className={`px-2 md:px-3 py-1.5 rounded-full font-semibold text-xs md:text-sm ${theme === 'dark' ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-200 hover:bg-gray-300'}`}>🌐 {lang === 'ko' ? 'EN' : '한국어'}</button>
              <button type="button" onClick={toggleTheme} className={`p-2 rounded-full ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'}`}>{theme === 'dark' ? '🌙' : '☀️'}</button>
              <div className={`hidden md:block text-sm ${currentColors.textSecondary}`}>{lastUpdate.toLocaleTimeString(lang === 'ko' ? 'ko-KR' : 'en-US')} | <span className="text-[#00d395]">{countdown}s</span></div>
              <div className="relative" ref={notificationRef}>
                <button type="button" onClick={() => setShowNotifications(!showNotifications)} className={`relative p-2 rounded-full ${theme === 'dark' ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-200 hover:bg-gray-300'}`}>
                  🔔{unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-[#ff6b6b] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">{unreadCount}</span>}
                </button>
              </div>
              <button type="button" onClick={() => supabase.auth.signOut()} className={`p-2 rounded-full ${theme === 'dark' ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-200 hover:bg-gray-300'}`} title={txt('로그아웃', 'Logout')}>🚪</button>
            </div>
          </div>
        </div>
      </header>

      {/* 탭 */}
      <div className={`border-b ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}>
        <div className="max-w-[1600px] mx-auto px-4">
          <div className="flex gap-2 py-3 overflow-x-auto">
            {[
              { id: 'dashboard', label: txt('📊 대시보드', '📊 Dashboard') }, 
              { id: 'alerts', label: txt('🔔 알림', '🔔 Alerts') }, 
              { id: 'portfolio', label: txt('💼 포트폴리오', '💼 Portfolio') }
            ].map(tab => (
              <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id as any)} className={`px-3 md:px-5 py-2 md:py-2.5 rounded-xl font-semibold transition whitespace-nowrap text-sm md:text-base ${activeTab === tab.id ? 'bg-[#00d395] text-black' : `${theme === 'dark' ? 'bg-white/5 text-white/70 hover:bg-white/10' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}`}>{tab.label}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 py-8">
        {/* 대시보드 탭 */}
        {activeTab === 'dashboard' && (
          <div>
            {profile?.plan !== 'free' && (
              <div className="mb-8">
                <div className="flex gap-2 md:gap-3">
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder={txt('코인명 입력 (예: ENA, PEPE)', 'Enter coin (e.g., BTC, ETH)')} className={`flex-1 min-w-0 ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'} border rounded-xl px-3 md:px-4 py-3 focus:outline-none focus:border-[#00d395] text-sm md:text-base`} />
                  <button type="button" onClick={handleSearch} disabled={searchLoading} className="bg-[#00d395] text-black px-4 md:px-8 py-3 rounded-xl font-semibold whitespace-nowrap text-sm md:text-base flex-shrink-0">{searchLoading ? '...' : txt('🔍 분석', '🔍 Analyze')}</button>
                </div>
              </div>
            )}

            {searchResult && (
              <div className="mb-8">
                <h2 className={`text-xl font-bold mb-4 ${currentColors.text}`}>{txt('🔍 검색 결과', '🔍 Search Result')}</h2>
                <div className="max-w-md"><CoinCard coin={searchResult} /></div>
              </div>
            )}

            <section className="mb-10">
              <h2 className={`text-xl font-bold mb-4 ${currentColors.text}`}>{txt('🔥 핵심 코인', '🔥 Core Coins')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {coreCoins.map(coin => <CoinCard key={coin.id} coin={coin} />)}
              </div>
            </section>

            {profile?.plan !== 'free' ? (
              <section className="mb-10">
                <h2 className={`text-xl font-bold mb-4 ${currentColors.text}`}>{txt('📈 상승 코인 TOP 6', '📈 Top Gainers')} <span className="bg-[#00d395] text-black px-2 py-0.5 rounded text-xs">PRO</span></h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {topGainers.map(coin => <CoinCard key={coin.id} coin={coin} />)}
                </div>
              </section>
            ) : (
              <section className="mb-10">
                <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-2xl text-center py-12 px-6">
                  <h2 className={`text-2xl font-bold mb-4 ${currentColors.text}`}>🔒 PRO {txt('전용', 'Only')}</h2>
                  <Link href="/pricing" className="bg-[#00d395] text-black px-8 py-3 rounded-xl font-semibold inline-block">{txt('업그레이드 →', 'Upgrade →')}</Link>
                </div>
              </section>
            )}

            <section>
              <h2 className={`text-xl font-bold mb-4 ${currentColors.text}`}>{txt('📊 시장 요약', '📊 Market Summary')}</h2>
              <div className={`${currentColors.cardBg} rounded-2xl p-6 border ${currentColors.cardBorder}`}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                  <div><p className={`${currentColors.textSecondary} text-sm mb-1`}>{txt('분석 코인', 'Analyzed')}</p><p className={`text-2xl font-bold ${currentColors.text}`}>{coreCoins.length + topGainers.length}</p></div>
                  <div><p className={`${currentColors.textSecondary} text-sm mb-1`}>{txt('매수', 'Buy')}</p><p className="text-2xl font-bold text-[#00d395]">{[...coreCoins, ...topGainers].filter(c => c.signal === 'buy' || c.signal === 'strong_buy').length}</p></div>
                  <div><p className={`${currentColors.textSecondary} text-sm mb-1`}>{txt('관망', 'Hold')}</p><p className="text-2xl font-bold text-yellow-400">{[...coreCoins, ...topGainers].filter(c => c.signal === 'hold').length}</p></div>
                  <div><p className={`${currentColors.textSecondary} text-sm mb-1`}>{txt('매도', 'Sell')}</p><p className="text-2xl font-bold text-[#ff6b6b]">{[...coreCoins, ...topGainers].filter(c => c.signal === 'sell' || c.signal === 'strong_sell').length}</p></div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* 알림 설정 탭 */}
        {activeTab === 'alerts' && alertSettings && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-2xl p-6">
              <h3 className={`text-lg font-bold mb-3 ${currentColors.text}`}>{txt('📢 알림 작동 방식', '📢 How Alerts Work')}</h3>
              <div className={`space-y-2 ${currentColors.textSecondary} text-sm`}>
                <p>✅ <strong className={currentColors.text}>{txt('대시보드 알림:', 'Dashboard:')}</strong> {txt('설정한 코인이 임계점 이상이면 상단 🔔에 알림', 'Get notified via 🔔 when coins reach threshold')}</p>
                <p>📱 <strong className={currentColors.text}>{txt('텔레그램:', 'Telegram:')}</strong> {txt('ID 입력 후 저장하면 5분마다 알림 전송', 'Alerts every 5 min after saving ID')}</p>
              </div>
            </div>
            
            <div className={`${currentColors.cardBg} rounded-2xl p-6 border border-[#00d395]/50`}>
              <h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>{txt('📱 텔레그램 알림', '📱 Telegram Alerts')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-4 space-y-3 text-sm`}>
                  <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'}`}><p className={`font-bold ${currentColors.text}`}>{txt('1. @userinfobot 검색 → 내 ID 확인', '1. Search @userinfobot → Get ID')}</p></div>
                  <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'}`}><p className={`font-bold ${currentColors.text}`}>{txt('2. 오른쪽에 ID 입력', '2. Enter ID on right')}</p></div>
                  <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-[#00d395]/10' : 'bg-green-50'} border border-[#00d395]/30`}><p className="font-bold text-[#00d395]">{txt('3. @crypto_navcp_bot 검색 → /start', '3. @crypto_navcp_bot → /start')}</p><p className="text-yellow-400 text-xs mt-1">{txt('⚠️ 필수!', '⚠️ Required!')}</p></div>
                </div>
                <div>
                  <label className={`block text-sm ${currentColors.textSecondary} mb-2`}>{txt('텔레그램 ID', 'Telegram ID')}</label>
                  <input type="text" inputMode="numeric" placeholder={txt('예: 1234567890', 'e.g., 1234567890')} value={telegramId} onChange={(e) => setTelegramId(e.target.value)} className={`w-full p-4 rounded-xl border ${currentColors.cardBorder} ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'} text-lg`} />
                  {telegramId && <div className="mt-3 p-3 bg-[#00d395]/10 border border-[#00d395]/30 rounded-lg"><p className="text-[#00d395] text-sm">✅ ID: {telegramId}</p></div>}
                </div>
              </div>
            </div>

            <div className={`${currentColors.cardBg} rounded-2xl p-6 border ${currentColors.cardBorder}`}>
              <h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>{txt('🎯 점수 임계값', '🎯 Score Threshold')}</h3>
              <p className={`text-sm ${currentColors.textSecondary} mb-4`}>{txt('이 점수 이상이면 알림', 'Alert when score exceeds')}</p>
              <div className="flex items-center gap-4 mb-4">
                <input type="range" min="50" max="130" value={sliderValue} onChange={(e) => setSliderValue(parseInt(e.target.value))} className="flex-1 h-3 rounded-full appearance-none cursor-pointer" style={{ background: `linear-gradient(to right, #00d395 ${((sliderValue - 50) / 80) * 100}%, ${theme === 'dark' ? '#333' : '#ddd'} ${((sliderValue - 50) / 80) * 100}%)` }} />
                <span className="bg-[#00d395] text-black px-4 py-2 rounded-xl font-bold text-xl">{sliderValue}/140</span>
              </div>
            </div>
          </div>
        )}

        {/* 포트폴리오 탭 */}
        {activeTab === 'portfolio' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(() => { const stats = calculatePortfolioStats(); return [
                { label: txt('총 포지션', 'Total'), value: stats.total, icon: '📋' },
                { label: txt('활성', 'Active'), value: stats.active, icon: '🟢', color: 'text-[#00d395]' },
                { label: txt('승률', 'Win Rate'), value: `${stats.winRate}%`, icon: '🎯', color: parseFloat(stats.winRate) >= 50 ? 'text-[#00d395]' : 'text-[#ff6b6b]' },
                { label: txt('승/패', 'W/L'), value: `${stats.wins}/${stats.losses}`, icon: '📊' }
              ].map((s, i) => (
                <div key={i} className={`${currentColors.cardBg} rounded-xl p-4 border ${currentColors.cardBorder} text-center`}>
                  <div className="text-2xl mb-2">{s.icon}</div>
                  <div className={`text-2xl font-bold ${s.color || currentColors.text}`}>{s.value}</div>
                  <div className={`text-sm ${currentColors.textSecondary}`}>{s.label}</div>
                </div>
              )) })()}
            </div>

            <div className={`${currentColors.cardBg} rounded-2xl p-6 border ${currentColors.cardBorder}`}>
              <h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>{txt('➕ 새 포지션', '➕ New Position')}</h3>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                <div>
                  <label className={`block text-sm ${currentColors.textSecondary} mb-1`}>{txt('코인', 'Coin')}</label>
                  <select value={positionCoin} onChange={(e) => setPositionCoin(e.target.value)} className={`w-full p-3 rounded-xl border ${currentColors.cardBorder} ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                    {allCoins.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className={`block text-sm ${currentColors.textSecondary} mb-1`}>{txt('방향', 'Direction')}</label>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => setPositionType('LONG')} className={`flex-1 p-3 rounded-l-xl font-bold ${positionType === 'LONG' ? 'bg-[#00d395] text-black' : theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'}`}>🟢</button>
                    <button type="button" onClick={() => setPositionType('SHORT')} className={`flex-1 p-3 rounded-r-xl font-bold ${positionType === 'SHORT' ? 'bg-[#ff6b6b] text-white' : theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'}`}>🔴</button>
                  </div>
                </div>
                <div><label className={`block text-sm ${currentColors.textSecondary} mb-1`}>{txt('진입가', 'Entry')}</label><input type="text" inputMode="decimal" placeholder="0.00" value={entryValue} onChange={(e) => setEntryValue(e.target.value)} className={`w-full p-3 rounded-xl border ${currentColors.cardBorder} ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`} /></div>
                <div><label className={`block text-sm ${currentColors.textSecondary} mb-1`}>{txt('목표가', 'Target')}</label><input type="text" inputMode="decimal" placeholder="0.00" value={targetValue} onChange={(e) => setTargetValue(e.target.value)} className={`w-full p-3 rounded-xl border ${currentColors.cardBorder} ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`} /></div>
                <div><label className={`block text-sm ${currentColors.textSecondary} mb-1`}>{txt('손절가', 'Stop Loss')}</label><input type="text" inputMode="decimal" placeholder="0.00" value={stopValue} onChange={(e) => setStopValue(e.target.value)} className={`w-full p-3 rounded-xl border ${currentColors.cardBorder} ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`} /></div>
                <div className="flex items-end"><button type="button" onClick={addPosition} className="w-full bg-[#00d395] text-black p-3 rounded-xl font-bold">{txt('추가', 'Add')}</button></div>
              </div>
            </div>

            <div className={`${currentColors.cardBg} rounded-2xl p-6 border ${currentColors.cardBorder}`}>
              <h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>{txt('📋 포지션 목록', '📋 Positions')}</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={`border-b ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}>
                      {[txt('코인','Coin'), txt('방향','Dir'), txt('진입가','Entry'), txt('현재가','Current'), txt('목표가','Target'), txt('손절가','Stop'), txt('수익률','P/L'), txt('상태','Status'), ''].map(h => <th key={h} className={`text-left p-3 text-sm ${currentColors.textSecondary}`}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {portfolioPositions.length === 0 ? (
                      <tr><td colSpan={9} className={`text-center p-8 ${currentColors.textSecondary}`}>{txt('데이터 없음', 'No data')}</td></tr>
                    ) : portfolioPositions.map(p => { 
                      const currentPrice = getCurrentPrice(p.coin_symbol)
                      const pnl = getUnrealizedPnL(p)
                      return (
                        <tr key={p.id} className={`border-b ${theme === 'dark' ? 'border-white/5' : 'border-gray-100'}`}>
                          <td className={`p-3 font-bold ${currentColors.text}`}>{p.coin_symbol}</td>
                          <td className="p-3"><span className={`px-3 py-1 rounded-full text-xs font-bold ${p.position_type === 'LONG' ? 'bg-[#00d395]/20 text-[#00d395]' : 'bg-[#ff6b6b]/20 text-[#ff6b6b]'}`}>{p.position_type}</span></td>
                          <td className={`p-3 ${currentColors.text}`}>${p.entry_price.toLocaleString()}</td>
                          <td className={`p-3 font-bold ${currentPrice > p.entry_price ? 'text-[#00d395]' : currentPrice < p.entry_price ? 'text-[#ff6b6b]' : currentColors.text}`}>{currentPrice ? `$${currentPrice.toLocaleString()}` : '-'}</td>
                          <td className="p-3 text-blue-400">${p.target_price.toLocaleString()}</td>
                          <td className="p-3 text-[#ff6b6b]">${p.stop_loss.toLocaleString()}</td>
                          <td className={`p-3 font-bold ${pnl && pnl > 0 ? 'text-[#00d395]' : pnl && pnl < 0 ? 'text-[#ff6b6b]' : currentColors.textSecondary}`}>{pnl !== null ? `${pnl > 0 ? '+' : ''}${pnl.toFixed(2)}%` : '-'}</td>
                          <td className="p-3"><span className={`px-3 py-1 rounded-full text-xs ${p.status === 'active' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/10 text-white/50'}`}>{p.status === 'active' ? txt('활성','Active') : txt('종료','Closed')}</span></td>
                          <td className="p-3"><button type="button" onClick={() => deletePosition(p)} className="px-3 py-1 bg-[#ff6b6b] text-white rounded-lg text-sm">{txt('삭제','Delete')}</button></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 상세 모달 */}
      {showDetail && selectedCoin && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowDetail(false)}>
          <div className={`${currentColors.cardBg} rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`} onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className={`text-2xl font-bold ${currentColors.text}`}>{selectedCoin.symbol.toUpperCase()}</h2>
                    <SignalBadge signal={selectedCoin.signal} />
                  </div>
                  <p className={currentColors.textSecondary}>{selectedCoin.name}</p>
                </div>
                <button type="button" onClick={() => setShowDetail(false)} className={`text-2xl ${currentColors.textSecondary} hover:${currentColors.text}`}>✕</button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className={`${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-4`}>
                  <p className={currentColors.textSecondary + ' text-sm'}>{txt('현재가', 'Current')}</p>
                  <p className="text-2xl font-bold text-[#00d395]">{formatPrice(selectedCoin.current_price)}</p>
                  <p className={`text-sm ${selectedCoin.price_change_percentage_24h >= 0 ? 'text-[#00d395]' : 'text-[#ff6b6b]'}`}>
                    {selectedCoin.price_change_percentage_24h >= 0 ? '▲' : '▼'} {Math.abs(selectedCoin.price_change_percentage_24h || 0).toFixed(2)}%
                  </p>
                </div>
                <div className={`${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-4`}>
                  <p className={currentColors.textSecondary + ' text-sm'}>{txt('총점', 'Total Score')}</p>
                  <p className={`text-2xl font-bold ${selectedCoin.scores.total >= 95 ? 'text-[#00d395]' : selectedCoin.scores.total >= 70 ? 'text-yellow-400' : 'text-[#ff6b6b]'}`}>
                    {selectedCoin.scores.total}/140
                  </p>
                </div>
              </div>

              {profile?.plan !== 'free' && (
                <div className={`${theme === 'dark' ? 'bg-[#00d395]/10' : 'bg-green-50'} border border-[#00d395]/30 rounded-xl p-4 mb-6`}>
                  <h3 className="font-bold text-[#00d395] mb-3">{txt('💰 거래 정보', '💰 Trade Info')}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div><span className={currentColors.textSecondary + ' text-sm'}>{txt('진입가', 'Entry')}</span><p className={`font-bold ${currentColors.text}`}>{formatPrice(selectedCoin.entry_price)}</p></div>
                    <div><span className={currentColors.textSecondary + ' text-sm'}>{txt('목표가', 'Target')}</span><p className="font-bold text-blue-400">{formatPrice(selectedCoin.target_price)}</p></div>
                    <div><span className={currentColors.textSecondary + ' text-sm'}>{txt('손절가', 'Stop')}</span><p className="font-bold text-[#ff6b6b]">{formatPrice(selectedCoin.stop_loss)}</p></div>
                    <div><span className={currentColors.textSecondary + ' text-sm'}>{txt('손익비', 'R:R')}</span><p className="font-bold text-yellow-400">{selectedCoin.risk_reward}</p></div>
                  </div>
                </div>
              )}

              <div className="mb-6">
                <h3 className={`font-bold mb-4 ${currentColors.text}`}>{txt('📊 7단계 체크리스트', '📊 7-Step Checklist')}</h3>
                <ScoreBar label={txt('거시환경', 'Macro')} score={selectedCoin.scores.macro} max={20} color="bg-blue-500" />
                <ScoreBar label={txt('ETF/제도권 자금', 'ETF/Institutional')} score={selectedCoin.scores.etf} max={25} color="bg-purple-500" />
                <ScoreBar label={txt('온체인 핵심', 'On-chain')} score={selectedCoin.scores.onchain} max={25} color="bg-green-500" />
                <ScoreBar label={txt('AI/메타버스', 'AI/Metaverse')} score={selectedCoin.scores.ai} max={20} color="bg-pink-500" />
                <ScoreBar label={txt('선물시장', 'Futures')} score={selectedCoin.scores.futures} max={20} color="bg-orange-500" />
                <ScoreBar label={txt('기술적 분석', 'Technical')} score={selectedCoin.scores.technical} max={20} color="bg-cyan-500" />
                <ScoreBar label={txt('전략', 'Strategy')} score={selectedCoin.scores.strategy} max={10} color="bg-yellow-500" />
              </div>

              {/* ✅ AI 코멘트 섹션 - 상세화된 버전 */}
              <div className={`${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-4`}>
                <h3 className={`font-bold mb-2 ${currentColors.text}`}>{txt('🤖 AI 코멘트', '🤖 AI Comment')}</h3>
                {loadingComments && (
                  <p className="text-gray-400 text-sm animate-pulse mb-2">{txt('AI 분석 중...', 'AI analyzing...')}</p>
                )}
                <p className={`${currentColors.textSecondary} whitespace-pre-line`}>
                  {aiComments[selectedCoin?.symbol?.toUpperCase() || ''] || selectedCoin?.ai_comment}
                </p>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => toggleFavorite(selectedCoin)}
                  className={`flex-1 py-3 rounded-xl font-semibold ${favorites.some(f => f.coin_id === selectedCoin.id) ? 'bg-yellow-500 text-black' : theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'}`}
                >
                  {favorites.some(f => f.coin_id === selectedCoin.id) ? '★ ' + txt('즐겨찾기 해제', 'Remove') : '☆ ' + txt('즐겨찾기', 'Favorite')}
                </button>
                <button type="button" onClick={() => setShowDetail(false)} className="flex-1 bg-[#00d395] text-black py-3 rounded-xl font-semibold">
                  {txt('닫기', 'Close')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
