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
type AdSlot = { id: string; title: string; description: string; link_url: string; link_text: string; image_url: string | null; ad_type: 'own' | 'sponsored'; position: string; icon: string; bg_color: string; border_color: string; display_order: number }
type AlertSettings = { id?: string; user_id: string; selected_coins: string[]; score_threshold: number; time_morning: boolean; time_afternoon: boolean; time_evening: boolean; time_night: boolean; alert_signal: boolean; alert_score_change: boolean; alert_price: boolean; telegram_id?: string | null }
type PortfolioPosition = { id: string; user_id: string; coin_symbol: string; coin_name: string; position_type: 'LONG' | 'SHORT'; entry_price: number; target_price: number; stop_loss: number; amount?: number; entry_date: string; exit_price?: number; exit_date?: string; closed_at?: string; status: 'active' | 'closed' | 'cancelled'; notes?: string }
type AlertNotification = { id: string; coin: string; type: 'signal' | 'score' | 'price'; message: string; time: Date; read: boolean }
type SignalStats = { total_signals: number; wins: number; losses: number; pending: number; win_rate: number; avg_profit: number; max_profit: number; max_loss: number; signals_30d: number; wins_30d: number; win_rate_30d: number }
type SignalHistory = { id: string; coin_symbol: string; signal_type: string; entry_price: number; target_price: number; stop_loss: number; score_total: number; result: 'win' | 'loss' | 'pending' | null; exit_price: number | null; profit_percent: number | null; signal_at: string; closed_at: string | null }

const formatPrice = (price: number): string => {
  if (price === 0) return '$0'
  if (price >= 1) return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  if (price >= 0.01) return `$${price.toFixed(4)}`
  if (price >= 0.0001) return `$${price.toFixed(6)}`
  if (price >= 0.00000001) return `$${price.toFixed(8)}`
  return `$${price.toExponential(4)}`
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
  const [adSlots, setAdSlots] = useState<AdSlot[]>([])
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
  const [savedAlertSettings, setSavedAlertSettings] = useState<AlertSettings | null>(null)
  const [portfolioPositions, setPortfolioPositions] = useState<PortfolioPosition[]>([])
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [notifications, setNotifications] = useState<AlertNotification[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [positionCoin, setPositionCoin] = useState('BTC')
  const [positionType, setPositionType] = useState<'LONG' | 'SHORT'>('LONG')
  const [entryValue, setEntryValue] = useState('')
  const [targetValue, setTargetValue] = useState('')
  const [stopValue, setStopValue] = useState('')
  const [portfolioCoinSearch, setPortfolioCoinSearch] = useState('')
  const [portfolioSearchResults, setPortfolioSearchResults] = useState<string[]>([])
  const [showPortfolioDropdown, setShowPortfolioDropdown] = useState(false)
  const portfolioDropdownRef = useRef<HTMLDivElement>(null)
  const [sliderValue, setSliderValue] = useState(90)
  const [inputValue, setInputValue] = useState('90')
  const [alertCoinSearch, setAlertCoinSearch] = useState('')
  const [alertSearchResults, setAlertSearchResults] = useState<string[]>([])
  const [searchSuggestions, setSearchSuggestions] = useState<{symbol: string, name: string}[]>([])
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const searchDropdownRef = useRef<HTMLDivElement>(null)
  const [telegramId, setTelegramId] = useState('')
  const [showFavorites, setShowFavorites] = useState(true)
  const notificationRef = useRef<HTMLDivElement>(null)
  const [indicatorSection, setIndicatorSection] = useState<'intro' | 'backtest' | 'deepbacktest' | 'automate'>('intro')
  const [signalStats, setSignalStats] = useState<SignalStats | null>(null)
  const [recentSignals, setRecentSignals] = useState<SignalHistory[]>([])
  // ✅ AI 코멘트 State 추가
  const [aiComments, setAiComments] = useState<Record<string, string>>({})

  const allCoins = ['BTC', 'ETH', 'XRP', 'BNB', 'SOL', 'ADA', 'DOGE', 'MATIC', 'DOT', 'SHIB', 'AVAX', 'LINK', 'UNI', 'ATOM', 'LTC', 'ETC', 'XLM', 'ALGO', 'VET', 'FIL', 'AAVE', 'AXS', 'SAND', 'MANA', 'GALA', 'ENJ', 'CHZ', 'APE', 'LDO', 'ARB', 'OP', 'IMX', 'NEAR', 'APT', 'SUI', 'SEI', 'TIA', 'INJ', 'FET', 'RNDR', 'GRT', 'SNX', 'CRV', 'MKR', 'COMP', '1INCH', 'SUSHI', 'YFI', 'BAL', 'CAKE', 'PEPE', 'BONK', 'FLOKI', 'WIF', 'ENA', 'PENDLE', 'JUP', 'WLD', 'STRK', 'PYTH', 'JTO', 'MEME', 'BLUR', 'ORDI', 'SATS', 'RATS', 'LEO', 'TON', 'TRX', 'HBAR', 'KAS', 'OKB', 'CRO', 'RUNE', 'STX', 'FTM', 'EGLD', 'FLOW', 'THETA', 'XTZ', 'NEO', 'KLAY', 'ZEC', 'IOTA', 'EOS']
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

  const getSignal = (score: number): 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell' => { if (score >= 115) return 'strong_buy'; if (score >= 95) return 'buy'; if (score >= 70) return 'hold'; if (score >= 50) return 'sell'; return 'strong_sell' }

  const generateAIComment = (coin: AnalyzedCoin): string => {
    const { scores, signal } = coin
    if (lang === 'en') { if (signal === 'strong_buy') return `${coin.symbol.toUpperCase()} shows strong buy. On-chain(${scores.onchain}/25) positive.`; if (signal === 'buy') return `${coin.symbol.toUpperCase()} buy zone. ETF(${scores.etf}/25) positive.`; if (signal === 'hold') return `${coin.symbol.toUpperCase()} hold. Score ${scores.total}/140.`; return `${coin.symbol.toUpperCase()} correction possible.` }
    if (signal === 'strong_buy') return `${coin.symbol.toUpperCase()} 강한 매수. 온체인(${scores.onchain}/25) 긍정적.`; if (signal === 'buy') return `${coin.symbol.toUpperCase()} 매수 구간. ETF(${scores.etf}/25) 긍정적.`; if (signal === 'hold') return `${coin.symbol.toUpperCase()} 관망. 점수 ${scores.total}/140.`; return `${coin.symbol.toUpperCase()} 조정 가능성.`
  }

  // ✅ 상세 AI 코멘트 함수 추가
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
        if (scores.onchain >= 20) comment += `✅ On-chain data(${scores.onchain}/25) suggests accumulation.\n`
        if (scores.etf >= 20) comment += `✅ Institutional inflow(${scores.etf}/25) is active.\n`
        comment += `\n💡 Strategy: DCA near current price, hold to target.`
      } else if (signal === 'buy') {
        comment = `📈 ${symbol.toUpperCase()} scores ${scores.total}/140 - BUY zone.\n\n`
        comment += `✅ Strength: ${bestScore.name}(${bestScore.score}/${bestScore.max}) is positive.\n`
        if (worstScore.score / worstScore.max < 0.5) {
          comment += `⚠️ Caution: ${worstScore.name}(${worstScore.score}/${worstScore.max}) is weak.\n`
        }
        comment += `\n💡 Strategy: Buy at support, strict stop-loss.`
      } else if (signal === 'hold') {
        comment = `⏸️ ${symbol.toUpperCase()} scores ${scores.total}/140 - NEUTRAL zone.\n\n`
        comment += `📊 Status: No clear direction.\n`
        if (priceChange > 3) {
          comment += `⚠️ Watch for pullback after ${priceChange.toFixed(1)}% 24h gain.\n`
        } else if (priceChange < -3) {
          comment += `👀 Potential bounce after ${Math.abs(priceChange).toFixed(1)}% 24h drop.\n`
        }
        comment += `\n💡 Strategy: Wait for trend confirmation.`
      } else {
        comment = `📉 ${symbol.toUpperCase()} scores ${scores.total}/140 - BEARISH zone.\n\n`
        comment += `❌ Weakness: ${worstScore.name}(${worstScore.score}/${worstScore.max}) is negative.\n`
        comment += `\n💡 Strategy: Avoid new longs. Tight stop-loss for existing positions.`
      }
    }
    
    return comment
  }

  const analyzeCoin = (coin: CoinData): AnalyzedCoin => {
    const scores = calculateScores(coin)
    const signal = getSignal(scores.total)
    const entry = coin.current_price
    const target = entry * (signal === 'strong_buy' ? 1.08 : signal === 'buy' ? 1.05 : 1.03)
    const stop = entry * (signal === 'strong_buy' ? 0.97 : signal === 'buy' ? 0.97 : 0.95)
    const analyzed: AnalyzedCoin = { ...coin, scores, signal, entry_price: entry, target_price: target, stop_loss: stop, risk_reward: '1:1.00', ai_comment: '' }
    analyzed.ai_comment = generateAIComment(analyzed)
    return analyzed
  }

  useLayoutEffect(() => {
    const savedTheme = localStorage.getItem('dashboard-theme') as 'dark' | 'light' | null
    if (savedTheme) setTheme(savedTheme)
    setThemeLoaded(true)
  }, [])

  useEffect(() => { if (themeLoaded) localStorage.setItem('dashboard-theme', theme) }, [theme, themeLoaded])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (portfolioDropdownRef.current && !portfolioDropdownRef.current.contains(event.target as Node)) setShowPortfolioDropdown(false)
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(event.target as Node)) setShowSearchDropdown(false)
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) setShowNotifications(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      setUser(session.user)
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      if (profileData) { setProfile(profileData); if (profileData.telegram_id) setTelegramId(profileData.telegram_id) }
      setLoading(false)
    }
    checkUser()
  }, [router, supabase])

  useEffect(() => {
    const fetchFavorites = async () => { if (!user) return; const { data } = await supabase.from('favorites').select('*').eq('user_id', user.id); if (data) setFavorites(data) }
    fetchFavorites()
  }, [user, supabase])

  useEffect(() => {
    const fetchAdSlots = async () => { const { data } = await supabase.from('ad_slots').select('*').eq('is_active', true).order('display_order'); if (data) setAdSlots(data) }
    fetchAdSlots()
  }, [supabase])

  useEffect(() => {
    const fetchAlertSettings = async () => {
      if (!user) return
      const { data } = await supabase.from('alert_settings').select('*').eq('user_id', user.id).single()
      if (data) { setAlertSettings(data); setSavedAlertSettings(data); setSliderValue(data.score_threshold); setInputValue(data.score_threshold.toString()) }
      else { const defaultSettings: AlertSettings = { user_id: user.id, selected_coins: ['BTC', 'ETH'], score_threshold: 90, time_morning: true, time_afternoon: true, time_evening: false, time_night: false, alert_signal: true, alert_score_change: false, alert_price: false }; setAlertSettings(defaultSettings); setSavedAlertSettings(defaultSettings) }
    }
    fetchAlertSettings()
  }, [user, supabase])

  useEffect(() => {
    const fetchPortfolio = async () => { if (!user) return; const { data } = await supabase.from('portfolio_positions').select('*').eq('user_id', user.id).order('entry_date', { ascending: false }); if (data) setPortfolioPositions(data) }
    fetchPortfolio()
  }, [user, supabase])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [coreRes, topRes] = await Promise.all([
          fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,ripple,binancecoin&order=market_cap_desc'),
          fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=percent_change_24h_desc&per_page=6&page=1')
        ])
        const coreData = await coreRes.json()
        const topData = await topRes.json()
        if (Array.isArray(coreData)) setCoreCoins(coreData.map(analyzeCoin))
        if (Array.isArray(topData)) setTopGainers(topData.map(analyzeCoin))
        setLastUpdate(new Date())
        setCountdown(120)
      } catch (error) { console.error('Fetch error:', error) }
    }
    fetchData()
    const interval = setInterval(fetchData, 120000)
    return () => clearInterval(interval)
  }, [lang])

  useEffect(() => {
    const timer = setInterval(() => setCountdown(prev => prev > 0 ? prev - 1 : 120), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const fetchFavoriteCoins = async () => {
      if (favorites.length === 0) { setFavoriteCoins([]); return }
      const ids = favorites.map(f => f.coin_id).join(',')
      try {
        const res = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}`)
        const data = await res.json()
        if (Array.isArray(data)) setFavoriteCoins(data.map(analyzeCoin))
      } catch (error) { console.error('Favorites fetch error:', error) }
    }
    fetchFavoriteCoins()
  }, [favorites, lang])

  useEffect(() => {
    if (portfolioCoinSearch.length > 0) {
      const results = allCoins.filter(c => c.toLowerCase().includes(portfolioCoinSearch.toLowerCase())).slice(0, 5)
      setPortfolioSearchResults(results)
      setShowPortfolioDropdown(results.length > 0)
    } else { setPortfolioSearchResults([]); setShowPortfolioDropdown(false) }
  }, [portfolioCoinSearch])

  useEffect(() => {
    if (alertCoinSearch.length > 0) {
      const results = allCoins.filter(c => c.toLowerCase().includes(alertCoinSearch.toLowerCase()) && !alertSettings?.selected_coins.includes(c)).slice(0, 5)
      setAlertSearchResults(results)
    } else setAlertSearchResults([])
  }, [alertCoinSearch, alertSettings?.selected_coins])

  useEffect(() => {
    if (searchQuery.length > 0) {
      const results = allCoins.filter(c => c.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5).map(c => ({ symbol: c, name: c }))
      setSearchSuggestions(results)
      setShowSearchDropdown(results.length > 0)
    } else { setSearchSuggestions([]); setShowSearchDropdown(false) }
  }, [searchQuery])

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setSearchLoading(true)
    setShowSearchDropdown(false)
    try {
      const res = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${searchQuery.toLowerCase()}`)
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) setSearchResult(analyzeCoin(data[0]))
      else {
        const searchRes = await fetch(`https://api.coingecko.com/api/v3/search?query=${searchQuery}`)
        const searchData = await searchRes.json()
        if (searchData.coins && searchData.coins.length > 0) {
          const coinId = searchData.coins[0].id
          const coinRes = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coinId}`)
          const coinData = await coinRes.json()
          if (Array.isArray(coinData) && coinData.length > 0) setSearchResult(analyzeCoin(coinData[0]))
          else setSearchResult(null)
        } else setSearchResult(null)
      }
    } catch (error) { console.error('Search error:', error); setSearchResult(null) }
    setSearchLoading(false)
  }

  const handleSuggestionClick = async (symbol: string) => {
    setSearchQuery(symbol)
    setShowSearchDropdown(false)
    setSearchLoading(true)
    try {
      const searchRes = await fetch(`https://api.coingecko.com/api/v3/search?query=${symbol}`)
      const searchData = await searchRes.json()
      if (searchData.coins && searchData.coins.length > 0) {
        const coinId = searchData.coins[0].id
        const coinRes = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coinId}`)
        const coinData = await coinRes.json()
        if (Array.isArray(coinData) && coinData.length > 0) setSearchResult(analyzeCoin(coinData[0]))
      }
    } catch (error) { console.error('Search error:', error) }
    setSearchLoading(false)
  }

  const toggleFavorite = async (coin: AnalyzedCoin) => {
    if (!user) return
    const existing = favorites.find(f => f.coin_id === coin.id)
    if (existing) {
      await supabase.from('favorites').delete().eq('id', existing.id)
      setFavorites(favorites.filter(f => f.id !== existing.id))
    } else {
      const { data } = await supabase.from('favorites').insert({ user_id: user.id, coin_id: coin.id, coin_symbol: coin.symbol, coin_name: coin.name }).select().single()
      if (data) setFavorites([...favorites, data])
    }
  }

  const saveAlertSettings = async () => {
    if (!user || !alertSettings) return
    setSettingsSaving(true)
    const settingsToSave = { ...alertSettings, telegram_id: telegramId || null }
    if (alertSettings.id) await supabase.from('alert_settings').update(settingsToSave).eq('id', alertSettings.id)
    else {
      const { data } = await supabase.from('alert_settings').insert(settingsToSave).select().single()
      if (data) setAlertSettings(data)
    }
    if (telegramId && profile) await supabase.from('profiles').update({ telegram_id: telegramId }).eq('id', profile.id)
    setSavedAlertSettings(settingsToSave)
    setSettingsSaving(false)
    alert(lang === 'ko' ? '설정이 저장되었습니다!' : 'Settings saved!')
  }

  const addPosition = async () => {
    if (!user || !entryValue || !targetValue || !stopValue) return
    const { data, error } = await supabase.from('portfolio_positions').insert({ user_id: user.id, coin_symbol: positionCoin, coin_name: positionCoin, position_type: positionType, entry_price: parseFloat(entryValue), target_price: parseFloat(targetValue), stop_loss: parseFloat(stopValue), entry_date: new Date().toISOString(), status: 'active' }).select().single()
    if (data) { setPortfolioPositions([data, ...portfolioPositions]); setEntryValue(''); setTargetValue(''); setStopValue('') }
    if (error) console.error('Add position error:', error)
  }

  const closePosition = async (id: string, exitPrice: number) => {
    const { error } = await supabase.from('portfolio_positions').update({ status: 'closed', exit_price: exitPrice, exit_date: new Date().toISOString(), closed_at: new Date().toISOString() }).eq('id', id)
    if (!error) setPortfolioPositions(portfolioPositions.map(p => p.id === id ? { ...p, status: 'closed', exit_price: exitPrice, closed_at: new Date().toISOString() } : p))
  }

  const deletePosition = async (id: string) => {
    const { error } = await supabase.from('portfolio_positions').delete().eq('id', id)
    if (!error) setPortfolioPositions(portfolioPositions.filter(p => p.id !== id))
  }

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/login') }

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'strong_buy': return 'text-emerald-400'
      case 'buy': return 'text-green-400'
      case 'hold': return 'text-yellow-400'
      case 'sell': return 'text-orange-400'
      case 'strong_sell': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getSignalBgColor = (signal: string) => {
    switch (signal) {
      case 'strong_buy': return 'bg-emerald-500/20 border-emerald-500/50'
      case 'buy': return 'bg-green-500/20 border-green-500/50'
      case 'hold': return 'bg-yellow-500/20 border-yellow-500/50'
      case 'sell': return 'bg-orange-500/20 border-orange-500/50'
      case 'strong_sell': return 'bg-red-500/20 border-red-500/50'
      default: return 'bg-gray-500/20 border-gray-500/50'
    }
  }

  const getSignalText = (signal: string) => {
    const texts: Record<string, { ko: string; en: string }> = {
      strong_buy: { ko: '강력 매수', en: 'Strong Buy' },
      buy: { ko: '매수', en: 'Buy' },
      hold: { ko: '관망', en: 'Hold' },
      sell: { ko: '매도', en: 'Sell' },
      strong_sell: { ko: '강력 매도', en: 'Strong Sell' }
    }
    return lang === 'ko' ? texts[signal]?.ko || signal : texts[signal]?.en || signal
  }

  const getMarketCondition = () => {
    const avgScore = coreCoins.length > 0 ? coreCoins.reduce((sum, c) => sum + c.scores.total, 0) / coreCoins.length : 70
    if (avgScore >= 100) return { text: txt('강세장', 'Bull Market'), color: 'text-emerald-400', leverage: '1-3x', ratio: '50%', rr: '1:1.5', status: txt('상승추세', 'Uptrend') }
    if (avgScore >= 80) return { text: txt('중립 시장', 'Neutral Market'), color: 'text-yellow-400', leverage: '1-3x', ratio: '50%', rr: '1:1.5', status: txt('횡보장', 'Sideways') }
    return { text: txt('약세장', 'Bear Market'), color: 'text-red-400', leverage: '1x', ratio: '30%', rr: '1:2', status: txt('하락추세', 'Downtrend') }
  }

  const marketCondition = getMarketCondition()

  const CoinCard = ({ coin, showFav = true }: { coin: AnalyzedCoin; showFav?: boolean }) => {
    const isFav = favorites.some(f => f.coin_id === coin.id)
    return (
      <div className={`${theme === 'dark' ? 'bg-[#1a1a2e] border-yellow-500/30' : 'bg-white border-yellow-400/50'} border rounded-xl p-4 cursor-pointer hover:border-yellow-400 transition-all`} onClick={() => { setSelectedCoin(coin); setShowDetail(true) }}>
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔥</span>
            <div>
              <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{coin.symbol.toUpperCase()}</span>
              {showFav && <button onClick={(e) => { e.stopPropagation(); toggleFavorite(coin) }} className="ml-2">{isFav ? '⭐' : '☆'}</button>}
            </div>
          </div>
          <span className={`px-2 py-1 rounded text-xs font-bold ${getSignalBgColor(coin.signal)} ${getSignalColor(coin.signal)}`}>{coin.scores.total}/140</span>
        </div>
        <div className={`text-xl font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{formatPrice(coin.current_price)}</div>
        <div className={`text-sm mb-3 ${coin.price_change_percentage_24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{coin.price_change_percentage_24h >= 0 ? '+' : ''}{coin.price_change_percentage_24h?.toFixed(2)}%</div>
        <div className={`text-xs ${theme === 'dark' ? 'text-white/50' : 'text-gray-500'}`}>⚖️ {txt('관망', 'Hold')}</div>
        <div className={`mt-2 p-2 rounded ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'}`}>
          <div className="flex justify-between text-xs">
            <span className={theme === 'dark' ? 'text-white/50' : 'text-gray-500'}>{txt('롱 진입가:', 'Long Entry:')}</span>
            <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>{formatPrice(coin.entry_price)}</span>
            <span className={theme === 'dark' ? 'text-white/50' : 'text-gray-500'}>{txt('목표가:', 'Target:')}</span>
            <span className="text-emerald-400">{formatPrice(coin.target_price)}</span>
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span className={theme === 'dark' ? 'text-white/50' : 'text-gray-500'}>{txt('손절가:', 'Stop:')}</span>
            <span className="text-red-400">{formatPrice(coin.stop_loss)}</span>
            <span className={theme === 'dark' ? 'text-white/50' : 'text-gray-500'}>{txt('손익비:', 'R:R:')}</span>
            <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>{coin.risk_reward}</span>
          </div>
        </div>
      </div>
    )
  }

  const ScoreBar = ({ label, score, max, color }: { label: string; score: number; max: number; color: string }) => (
    <div className="flex items-center gap-2 mb-2">
      <span className={`w-20 text-xs ${theme === 'dark' ? 'text-white/70' : 'text-gray-600'}`}>{label}</span>
      <div className={`flex-1 h-2 rounded-full ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'}`}>
        <div className={`h-full rounded-full ${color}`} style={{ width: `${(score / max) * 100}%` }}></div>
      </div>
      <span className={`w-12 text-xs text-right ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{score}/{max}</span>
    </div>
  )

  if (loading || !themeLoaded) return <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center"><div className="text-white text-xl">Loading...</div></div>

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#0a0a14]' : 'bg-gray-100'}`}>
      {/* Header */}
      <header className={`${theme === 'dark' ? 'bg-[#1a1a2e] border-white/10' : 'bg-white border-gray-200'} border-b sticky top-0 z-50`}>
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>⚡ {txt('크립토 6단계 체크리스트 실시간 대시보드 PRO', 'Crypto 6-Step Checklist Dashboard PRO')}</h1>
              <span className={`text-xs px-2 py-1 rounded ${theme === 'dark' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}>API</span>
              <span className={`text-xs px-2 py-1 rounded ${theme === 'dark' ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600'}`}>🔮 PRO</span>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs ${theme === 'dark' ? 'text-white/50' : 'text-gray-500'}`}>{txt('마지막 업데이트:', 'Last update:')} {lastUpdate.toLocaleTimeString()} | {txt('다음 업데이트:', 'Next:')} {countdown}s</span>
              <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className={`p-2 rounded ${theme === 'dark' ? 'bg-white/10 text-white' : 'bg-gray-200 text-gray-700'}`}>{theme === 'dark' ? '☀️' : '🌙'}</button>
              <button onClick={() => setLang(lang === 'ko' ? 'en' : 'ko')} className={`p-2 rounded text-sm ${theme === 'dark' ? 'bg-white/10 text-white' : 'bg-gray-200 text-gray-700'}`}>{lang === 'ko' ? 'EN' : '한국어'}</button>
              <div className="relative" ref={notificationRef}>
                <button onClick={() => setShowNotifications(!showNotifications)} className={`p-2 rounded relative ${theme === 'dark' ? 'bg-white/10 text-white' : 'bg-gray-200 text-gray-700'}`}>
                  🔔
                  {notifications.filter(n => !n.read).length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">{notifications.filter(n => !n.read).length}</span>}
                </button>
                {showNotifications && (
                  <div className={`absolute right-0 mt-2 w-80 rounded-lg shadow-xl ${theme === 'dark' ? 'bg-[#1a1a2e] border border-white/10' : 'bg-white border border-gray-200'}`}>
                    <div className={`p-3 border-b ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}>
                      <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{txt('알림', 'Notifications')}</span>
                    </div>
                    <div className="max-h-60 overflow-y-auto p-2">
                      {notifications.length === 0 ? (
                        <p className={`text-center py-4 ${theme === 'dark' ? 'text-white/50' : 'text-gray-500'}`}>{txt('알림이 없습니다', 'No notifications')}</p>
                      ) : (
                        notifications.map(n => (
                          <div key={n.id} className={`p-2 rounded mb-1 ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'} ${!n.read ? 'border-l-2 border-emerald-400' : ''}`}>
                            <p className={`text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{n.message}</p>
                            <span className={`text-xs ${theme === 'dark' ? 'text-white/50' : 'text-gray-500'}`}>{n.time.toLocaleString()}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              <span className={`text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{profile?.nickname || user?.email}</span>
              <button onClick={handleLogout} className={`px-3 py-1 rounded text-sm ${theme === 'dark' ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}>{txt('로그아웃', 'Logout')}</button>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className={`${theme === 'dark' ? 'bg-[#1a1a2e] border-white/10' : 'bg-white border-gray-200'} border-b`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            {[
              { id: 'dashboard', label: txt('📊 대시보드', '📊 Dashboard') },
              { id: 'alerts', label: txt('🔔 알림 설정', '🔔 Alerts') },
              { id: 'portfolio', label: txt('💼 포트폴리오', '💼 Portfolio') },
              { id: 'indicator', label: txt('📈 TradingView 지표', '📈 TradingView') },
              { id: 'report', label: txt('📄 리포트', '📄 Report') }
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${activeTab === tab.id ? (theme === 'dark' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-emerald-600 border-b-2 border-emerald-600') : (theme === 'dark' ? 'text-white/50 hover:text-white' : 'text-gray-500 hover:text-gray-900')}`}>{tab.label}</button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'dashboard' && (
          <>
            {/* Search */}
            <div className="mb-6">
              <div className="relative" ref={searchDropdownRef}>
                <div className="flex gap-2">
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSearch()} placeholder={txt('코인명 입력 (예: doge, shib, matic, uni, link)', 'Enter coin (e.g., doge, shib, matic)')} className={`flex-1 px-4 py-3 rounded-lg ${theme === 'dark' ? 'bg-[#1a1a2e] border-white/10 text-white placeholder-white/30' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'} border focus:outline-none focus:border-emerald-500`} />
                  <button onClick={handleSearch} disabled={searchLoading} className="px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50">{searchLoading ? '...' : `🔍 ${txt('분석', 'Analyze')}`}</button>
                </div>
                {showSearchDropdown && searchSuggestions.length > 0 && (
                  <div className={`absolute top-full left-0 right-0 mt-1 rounded-lg shadow-xl z-50 ${theme === 'dark' ? 'bg-[#1a1a2e] border border-white/10' : 'bg-white border border-gray-200'}`}>
                    {searchSuggestions.map(s => (
                      <button key={s.symbol} onClick={() => handleSuggestionClick(s.symbol)} className={`w-full px-4 py-2 text-left ${theme === 'dark' ? 'text-white hover:bg-white/10' : 'text-gray-900 hover:bg-gray-100'}`}>{s.symbol}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Search Result */}
            {searchResult && (
              <div className="mb-6">
                <h3 className={`text-lg font-bold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>🔍 {txt('검색 결과', 'Search Result')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <CoinCard coin={searchResult} />
                </div>
                <button onClick={() => setSearchResult(null)} className={`mt-2 text-sm ${theme === 'dark' ? 'text-white/50 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>✕ {txt('검색 결과 닫기', 'Close result')}</button>
              </div>
            )}

            {/* Favorites */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>⭐ {txt('즐겨찾기', 'Favorites')}</h3>
                <button onClick={() => setShowFavorites(!showFavorites)} className={`text-sm ${theme === 'dark' ? 'text-white/50' : 'text-gray-500'}`}>{showFavorites ? '▼' : '▶'}</button>
              </div>
              {showFavorites && (
                favoriteCoins.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {favoriteCoins.map(coin => <CoinCard key={coin.id} coin={coin} />)}
                  </div>
                ) : (
                  <p className={`${theme === 'dark' ? 'text-white/50' : 'text-gray-500'}`}>{txt('즐겨찾기한 코인이 없습니다', 'No favorites yet')}</p>
                )
              )}
            </div>

            {/* Core Coins */}
            <div className="mb-6">
              <h3 className={`text-lg font-bold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>🔥 {txt('핵심 코인 (BTC, ETH, XRP, BNB)', 'Core Coins (BTC, ETH, XRP, BNB)')}</h3>
              <p className={`text-sm mb-3 ${theme === 'dark' ? 'text-white/50' : 'text-gray-500'}`}>{txt('고정 표시되는 주요 코인들', 'Always displayed major coins')}</p>
              {coreCoins.length > 0 && (
                <div className={`mb-4 p-3 rounded-lg ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                  <span className={`text-xs ${theme === 'dark' ? 'text-white/50' : 'text-gray-500'}`}>{txt('디버그 정보:', 'Debug:')} API {txt('상태: 성공', 'Status: OK')} | {txt('마지막 요청:', 'Last:')} {lastUpdate.toLocaleTimeString()} | {txt('응답 데이터: 핵심', 'Data: Core')} {coreCoins.length}{txt('개, 상승', ', Gainers')} {topGainers.length}{txt('개', '')}</span>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {coreCoins.map(coin => <CoinCard key={coin.id} coin={coin} />)}
              </div>
            </div>

            {/* Top Gainers */}
            <div className="mb-6">
              <h3 className={`text-lg font-bold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>📈 {txt('실시간 상승 코인 TOP 6', 'Top 6 Gainers')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {topGainers.map(coin => <CoinCard key={coin.id} coin={coin} />)}
              </div>
            </div>

            {/* Market Condition */}
            <div className={`${theme === 'dark' ? 'bg-[#1a1a2e] border-white/10' : 'bg-white border-gray-200'} border rounded-xl p-6 mb-6`}>
              <h3 className={`text-lg font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>⚖️ {txt('중립 시장', 'Market Condition')}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                  <p className={`text-xs mb-1 ${theme === 'dark' ? 'text-white/50' : 'text-gray-500'}`}>{txt('추천 레버리지', 'Leverage')}</p>
                  <p className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{marketCondition.leverage}</p>
                </div>
                <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                  <p className={`text-xs mb-1 ${theme === 'dark' ? 'text-white/50' : 'text-gray-500'}`}>{txt('포지션 비중', 'Position')}</p>
                  <p className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{marketCondition.ratio}</p>
                </div>
                <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                  <p className={`text-xs mb-1 ${theme === 'dark' ? 'text-white/50' : 'text-gray-500'}`}>{txt('평균 손익비', 'R:R')}</p>
                  <p className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{marketCondition.rr}</p>
                </div>
                <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                  <p className={`text-xs mb-1 ${theme === 'dark' ? 'text-white/50' : 'text-gray-500'}`}>{txt('시장 상태', 'Status')}</p>
                  <p className={`text-xl font-bold ${marketCondition.color}`}>{marketCondition.status}</p>
                </div>
              </div>
            </div>

            {/* Ad Slots */}
            {adSlots.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {adSlots.map(ad => (
                  <a key={ad.id} href={ad.link_url} target="_blank" rel="noopener noreferrer" className={`block p-4 rounded-xl border ${ad.bg_color} ${ad.border_color} hover:opacity-80 transition-opacity`}>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{ad.icon}</span>
                      <div>
                        <h4 className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{ad.title}</h4>
                        <p className={`text-sm ${theme === 'dark' ? 'text-white/70' : 'text-gray-600'}`}>{ad.description}</p>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </>
        )}

        {/* Alerts Tab */}
        {activeTab === 'alerts' && alertSettings && (
          <div className={`${theme === 'dark' ? 'bg-[#1a1a2e] border-white/10' : 'bg-white border-gray-200'} border rounded-xl p-6`}>
            <h2 className={`text-xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>🔔 {txt('알림 설정', 'Alert Settings')}</h2>
            
            {/* Telegram */}
            <div className="mb-6">
              <h3 className={`font-bold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>📱 {txt('텔레그램 연동', 'Telegram')}</h3>
              <input type="text" value={telegramId} onChange={(e) => setTelegramId(e.target.value)} placeholder={txt('텔레그램 ID 입력', 'Telegram ID')} className={`w-full px-4 py-2 rounded-lg ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} border`} />
            </div>

            {/* Coin Selection */}
            <div className="mb-6">
              <h3 className={`font-bold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>🪙 {txt('알림 받을 코인', 'Coins')}</h3>
              <div className="flex flex-wrap gap-2 mb-3">
                {alertSettings.selected_coins.map(coin => (
                  <span key={coin} className={`px-3 py-1 rounded-full text-sm flex items-center gap-2 ${theme === 'dark' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}>
                    {coin}
                    <button onClick={() => setAlertSettings({ ...alertSettings, selected_coins: alertSettings.selected_coins.filter(c => c !== coin) })}>✕</button>
                  </span>
                ))}
              </div>
              <div className="relative">
                <input type="text" value={alertCoinSearch} onChange={(e) => setAlertCoinSearch(e.target.value)} placeholder={txt('코인 추가...', 'Add coin...')} className={`w-full px-4 py-2 rounded-lg ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} border`} />
                {alertSearchResults.length > 0 && (
                  <div className={`absolute top-full left-0 right-0 mt-1 rounded-lg ${theme === 'dark' ? 'bg-[#252540] border-white/10' : 'bg-white border-gray-200'} border shadow-xl z-10`}>
                    {alertSearchResults.map(coin => (
                      <button key={coin} onClick={() => { setAlertSettings({ ...alertSettings, selected_coins: [...alertSettings.selected_coins, coin] }); setAlertCoinSearch('') }} className={`w-full px-4 py-2 text-left ${theme === 'dark' ? 'text-white hover:bg-white/10' : 'text-gray-900 hover:bg-gray-100'}`}>{coin}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Score Threshold */}
            <div className="mb-6">
              <h3 className={`font-bold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>📊 {txt('점수 임계값', 'Score Threshold')}: {sliderValue}/140</h3>
              <input type="range" min="50" max="140" value={sliderValue} onChange={(e) => { const val = parseInt(e.target.value); setSliderValue(val); setInputValue(val.toString()); setAlertSettings({ ...alertSettings, score_threshold: val }) }} className="w-full" />
            </div>

            {/* Time Settings */}
            <div className="mb-6">
              <h3 className={`font-bold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>⏰ {txt('알림 시간대', 'Time')}</h3>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'time_morning', label: txt('아침 (6-12시)', 'Morning') },
                  { key: 'time_afternoon', label: txt('오후 (12-18시)', 'Afternoon') },
                  { key: 'time_evening', label: txt('저녁 (18-24시)', 'Evening') },
                  { key: 'time_night', label: txt('심야 (0-6시)', 'Night') }
                ].map(t => (
                  <button key={t.key} onClick={() => setAlertSettings({ ...alertSettings, [t.key]: !alertSettings[t.key as keyof AlertSettings] })} className={`px-4 py-2 rounded-lg ${alertSettings[t.key as keyof AlertSettings] ? 'bg-emerald-500 text-white' : (theme === 'dark' ? 'bg-white/10 text-white/50' : 'bg-gray-200 text-gray-500')}`}>{t.label}</button>
                ))}
              </div>
            </div>

            {/* Alert Types */}
            <div className="mb-6">
              <h3 className={`font-bold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>📢 {txt('알림 유형', 'Types')}</h3>
              <div className="space-y-2">
                {[
                  { key: 'alert_signal', label: txt('시그널 변경 알림', 'Signal Change') },
                  { key: 'alert_score_change', label: txt('점수 급변 알림', 'Score Change') },
                  { key: 'alert_price', label: txt('가격 알림', 'Price Alert') }
                ].map(t => (
                  <label key={t.key} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={alertSettings[t.key as keyof AlertSettings] as boolean} onChange={() => setAlertSettings({ ...alertSettings, [t.key]: !alertSettings[t.key as keyof AlertSettings] })} className="w-4 h-4" />
                    <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>{t.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <button onClick={saveAlertSettings} disabled={settingsSaving} className="w-full py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50">{settingsSaving ? txt('저장 중...', 'Saving...') : txt('💾 설정 저장', '💾 Save Settings')}</button>
          </div>
        )}

        {/* Portfolio Tab */}
        {activeTab === 'portfolio' && (
          <div className={`${theme === 'dark' ? 'bg-[#1a1a2e] border-white/10' : 'bg-white border-gray-200'} border rounded-xl p-6`}>
            <h2 className={`text-xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>💼 {txt('포트폴리오 관리', 'Portfolio')}</h2>
            
            {/* Add Position Form */}
            <div className={`p-4 rounded-lg mb-6 ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
              <h3 className={`font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>➕ {txt('새 포지션 추가', 'Add Position')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                <div className="relative" ref={portfolioDropdownRef}>
                  <input type="text" value={portfolioCoinSearch || positionCoin} onChange={(e) => { setPortfolioCoinSearch(e.target.value); setPositionCoin(e.target.value.toUpperCase()) }} placeholder="BTC" className={`w-full px-3 py-2 rounded-lg ${theme === 'dark' ? 'bg-white/10 border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'} border`} />
                  {showPortfolioDropdown && portfolioSearchResults.length > 0 && (
                    <div className={`absolute top-full left-0 right-0 mt-1 rounded-lg ${theme === 'dark' ? 'bg-[#252540] border-white/10' : 'bg-white border-gray-200'} border shadow-xl z-10`}>
                      {portfolioSearchResults.map(coin => (
                        <button key={coin} onClick={() => { setPositionCoin(coin); setPortfolioCoinSearch(''); setShowPortfolioDropdown(false) }} className={`w-full px-3 py-2 text-left ${theme === 'dark' ? 'text-white hover:bg-white/10' : 'text-gray-900 hover:bg-gray-100'}`}>{coin}</button>
                      ))}
                    </div>
                  )}
                </div>
                <select value={positionType} onChange={(e) => setPositionType(e.target.value as 'LONG' | 'SHORT')} className={`px-3 py-2 rounded-lg ${theme === 'dark' ? 'bg-white/10 border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'} border`}>
                  <option value="LONG">LONG</option>
                  <option value="SHORT">SHORT</option>
                </select>
                <input type="number" value={entryValue} onChange={(e) => setEntryValue(e.target.value)} placeholder={txt('진입가', 'Entry')} className={`px-3 py-2 rounded-lg ${theme === 'dark' ? 'bg-white/10 border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'} border`} />
                <input type="number" value={targetValue} onChange={(e) => setTargetValue(e.target.value)} placeholder={txt('목표가', 'Target')} className={`px-3 py-2 rounded-lg ${theme === 'dark' ? 'bg-white/10 border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'} border`} />
                <input type="number" value={stopValue} onChange={(e) => setStopValue(e.target.value)} placeholder={txt('손절가', 'Stop')} className={`px-3 py-2 rounded-lg ${theme === 'dark' ? 'bg-white/10 border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'} border`} />
                <button onClick={addPosition} className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600">{txt('추가', 'Add')}</button>
              </div>
            </div>

            {/* Active Positions */}
            <div className="mb-6">
              <h3 className={`font-bold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>📊 {txt('활성 포지션', 'Active Positions')}</h3>
              {portfolioPositions.filter(p => p.status === 'active').length === 0 ? (
                <p className={theme === 'dark' ? 'text-white/50' : 'text-gray-500'}>{txt('활성 포지션이 없습니다', 'No active positions')}</p>
              ) : (
                <div className="space-y-2">
                  {portfolioPositions.filter(p => p.status === 'active').map(pos => (
                    <div key={pos.id} className={`p-4 rounded-lg flex items-center justify-between ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                      <div className="flex items-center gap-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${pos.position_type === 'LONG' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>{pos.position_type}</span>
                        <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{pos.coin_symbol}</span>
                        <span className={theme === 'dark' ? 'text-white/50' : 'text-gray-500'}>{txt('진입:', 'Entry:')} ${pos.entry_price}</span>
                        <span className="text-emerald-400">{txt('목표:', 'Target:')} ${pos.target_price}</span>
                        <span className="text-red-400">{txt('손절:', 'Stop:')} ${pos.stop_loss}</span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { const price = prompt(txt('청산 가격 입력:', 'Exit price:')); if (price) closePosition(pos.id, parseFloat(price)) }} className={`px-3 py-1 rounded text-sm ${theme === 'dark' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-600'}`}>{txt('청산', 'Close')}</button>
                        <button onClick={() => deletePosition(pos.id)} className={`px-3 py-1 rounded text-sm ${theme === 'dark' ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600'}`}>{txt('삭제', 'Delete')}</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Closed Positions */}
            <div>
              <h3 className={`font-bold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>📜 {txt('청산 내역', 'Closed Positions')}</h3>
              {portfolioPositions.filter(p => p.status === 'closed').length === 0 ? (
                <p className={theme === 'dark' ? 'text-white/50' : 'text-gray-500'}>{txt('청산 내역이 없습니다', 'No closed positions')}</p>
              ) : (
                <div className="space-y-2">
                  {portfolioPositions.filter(p => p.status === 'closed').map(pos => {
                    const pnl = pos.exit_price ? ((pos.position_type === 'LONG' ? (pos.exit_price - pos.entry_price) : (pos.entry_price - pos.exit_price)) / pos.entry_price * 100) : 0
                    return (
                      <div key={pos.id} className={`p-4 rounded-lg flex items-center justify-between ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                        <div className="flex items-center gap-4">
                          <span className={`px-2 py-1 rounded text-xs ${theme === 'dark' ? 'bg-white/10 text-white/50' : 'bg-gray-200 text-gray-500'}`}>{pos.position_type}</span>
                          <span className={theme === 'dark' ? 'text-white/70' : 'text-gray-700'}>{pos.coin_symbol}</span>
                          <span className={theme === 'dark' ? 'text-white/50' : 'text-gray-500'}>${pos.entry_price} → ${pos.exit_price}</span>
                        </div>
                        <span className={pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}>{pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}%</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Indicator Tab */}
        {activeTab === 'indicator' && (
          <div className={`${theme === 'dark' ? 'bg-[#1a1a2e] border-white/10' : 'bg-white border-gray-200'} border rounded-xl p-6`}>
            <h2 className={`text-xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>📈 {txt('TradingView 지표', 'TradingView Indicator')}</h2>
            
            <div className="flex gap-2 mb-6">
              {[
                { id: 'intro', label: txt('소개', 'Intro') },
                { id: 'backtest', label: txt('백테스트', 'Backtest') },
                { id: 'deepbacktest', label: txt('심층 분석', 'Deep Analysis') },
                { id: 'automate', label: txt('자동화', 'Automation') }
              ].map(section => (
                <button key={section.id} onClick={() => setIndicatorSection(section.id as any)} className={`px-4 py-2 rounded-lg ${indicatorSection === section.id ? 'bg-emerald-500 text-white' : (theme === 'dark' ? 'bg-white/10 text-white/50' : 'bg-gray-200 text-gray-500')}`}>{section.label}</button>
              ))}
            </div>

            {indicatorSection === 'intro' && (
              <div className="space-y-4">
                <p className={theme === 'dark' ? 'text-white/70' : 'text-gray-600'}>{txt('6단계 체크리스트 기반 TradingView 지표입니다. 실시간 시그널과 백테스트 결과를 확인할 수 있습니다.', 'TradingView indicator based on 6-step checklist. Check real-time signals and backtest results.')}</p>
                <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                  <h4 className={`font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>🎯 {txt('주요 기능', 'Features')}</h4>
                  <ul className={`space-y-1 ${theme === 'dark' ? 'text-white/70' : 'text-gray-600'}`}>
                    <li>• {txt('실시간 매수/매도 시그널', 'Real-time buy/sell signals')}</li>
                    <li>• {txt('6단계 체크리스트 점수 표시', '6-step checklist score display')}</li>
                    <li>• {txt('자동 손절/익절 라인', 'Auto stop-loss/take-profit lines')}</li>
                    <li>• {txt('백테스트 통계', 'Backtest statistics')}</li>
                  </ul>
                </div>
              </div>
            )}

            {indicatorSection === 'backtest' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                    <p className={`text-xs mb-1 ${theme === 'dark' ? 'text-white/50' : 'text-gray-500'}`}>{txt('총 시그널', 'Total Signals')}</p>
                    <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{signalStats?.total_signals || 0}</p>
                  </div>
                  <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                    <p className={`text-xs mb-1 ${theme === 'dark' ? 'text-white/50' : 'text-gray-500'}`}>{txt('승률', 'Win Rate')}</p>
                    <p className={`text-2xl font-bold text-emerald-400`}>{signalStats?.win_rate?.toFixed(1) || 0}%</p>
                  </div>
                  <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                    <p className={`text-xs mb-1 ${theme === 'dark' ? 'text-white/50' : 'text-gray-500'}`}>{txt('평균 수익', 'Avg Profit')}</p>
                    <p className={`text-2xl font-bold text-emerald-400`}>+{signalStats?.avg_profit?.toFixed(2) || 0}%</p>
                  </div>
                  <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                    <p className={`text-xs mb-1 ${theme === 'dark' ? 'text-white/50' : 'text-gray-500'}`}>{txt('최대 수익', 'Max Profit')}</p>
                    <p className={`text-2xl font-bold text-emerald-400`}>+{signalStats?.max_profit?.toFixed(2) || 0}%</p>
                  </div>
                </div>
              </div>
            )}

            {indicatorSection === 'deepbacktest' && (
              <div className="space-y-4">
                <p className={theme === 'dark' ? 'text-white/70' : 'text-gray-600'}>{txt('심층 백테스트 분석 결과입니다.', 'Deep backtest analysis results.')}</p>
                <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                  <p className={theme === 'dark' ? 'text-white/50' : 'text-gray-500'}>{txt('데이터 로딩 중...', 'Loading data...')}</p>
                </div>
              </div>
            )}

            {indicatorSection === 'automate' && (
              <div className="space-y-4">
                <p className={theme === 'dark' ? 'text-white/70' : 'text-gray-600'}>{txt('시그널 자동화 설정입니다. 텔레그램 봇과 연동하여 실시간 알림을 받을 수 있습니다.', 'Signal automation settings. Connect with Telegram bot for real-time alerts.')}</p>
                <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-emerald-50 border border-emerald-200'}`}>
                  <p className={`text-sm ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>💡 {txt('알림 설정 탭에서 텔레그램 ID를 등록하면 자동으로 시그널 알림을 받을 수 있습니다.', 'Register your Telegram ID in Alerts tab to receive automatic signal notifications.')}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Report Tab */}
        {activeTab === 'report' && (
          <div className={`${theme === 'dark' ? 'bg-[#1a1a2e] border-white/10' : 'bg-white border-gray-200'} border rounded-xl p-6`}>
            <h2 className={`text-xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>📄 {txt('분석 리포트', 'Analysis Report')}</h2>
            <p className={`mb-4 ${theme === 'dark' ? 'text-white/70' : 'text-gray-600'}`}>{txt('포트폴리오 및 시장 분석 리포트를 생성합니다.', 'Generate portfolio and market analysis reports.')}</p>
            <button className="px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600">📥 {txt('PDF 리포트 다운로드', 'Download PDF Report')}</button>
          </div>
        )}
      </main>

      {/* Detail Modal */}
      {showDetail && selectedCoin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDetail(false)}>
          <div className={`${theme === 'dark' ? 'bg-[#1a1a2e]' : 'bg-white'} rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`} onClick={e => e.stopPropagation()}>
            <div className={`p-6 border-b ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{selectedCoin.symbol.toUpperCase()}</h2>
                  <p className={theme === 'dark' ? 'text-white/50' : 'text-gray-500'}>{selectedCoin.name}</p>
                </div>
                <button onClick={() => setShowDetail(false)} className={`p-2 rounded-lg ${theme === 'dark' ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-100 text-gray-900'}`}>✕</button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Price Info */}
              <div className="flex items-center gap-4">
                <span className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{formatPrice(selectedCoin.current_price)}</span>
                <span className={`px-3 py-1 rounded-lg ${selectedCoin.price_change_percentage_24h >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>{selectedCoin.price_change_percentage_24h >= 0 ? '+' : ''}{selectedCoin.price_change_percentage_24h?.toFixed(2)}%</span>
              </div>

              {/* Signal */}
              <div className={`p-4 rounded-lg ${getSignalBgColor(selectedCoin.signal)}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-lg font-bold ${getSignalColor(selectedCoin.signal)}`}>{getSignalText(selectedCoin.signal)}</span>
                  <span className={`text-2xl font-bold ${getSignalColor(selectedCoin.signal)}`}>{selectedCoin.scores.total}/140</span>
                </div>
              </div>

              {/* 7 Step Checklist */}
              <div>
                <h3 className={`font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>📋 {txt('7단계 체크리스트 분석', '7-Step Checklist')}</h3>
                <ScoreBar label={txt('거시환경', 'Macro')} score={selectedCoin.scores.macro} max={20} color="bg-blue-500" />
                <ScoreBar label={txt('ETF/제도권', 'ETF')} score={selectedCoin.scores.etf} max={25} color="bg-purple-500" />
                <ScoreBar label={txt('온체인', 'On-chain')} score={selectedCoin.scores.onchain} max={25} color="bg-cyan-500" />
                <ScoreBar label={txt('AI/메타', 'AI/Meta')} score={selectedCoin.scores.ai} max={20} color="bg-pink-500" />
                <ScoreBar label={txt('선물시장', 'Futures')} score={selectedCoin.scores.futures} max={20} color="bg-orange-500" />
                <ScoreBar label={txt('기술적분석', 'Technical')} score={selectedCoin.scores.technical} max={20} color="bg-yellow-500" />
                <ScoreBar label={txt('전략', 'Strategy')} score={selectedCoin.scores.strategy} max={10} color="bg-emerald-500" />
              </div>

              {/* Trading Info */}
              <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                <h3 className={`font-bold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>📊 {txt('트레이딩 정보', 'Trading Info')}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className={`text-xs ${theme === 'dark' ? 'text-white/50' : 'text-gray-500'}`}>{txt('롱 진입가', 'Long Entry')}</p>
                    <p className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{formatPrice(selectedCoin.entry_price)}</p>
                  </div>
                  <div>
                    <p className={`text-xs ${theme === 'dark' ? 'text-white/50' : 'text-gray-500'}`}>{txt('목표가', 'Target')}</p>
                    <p className="font-bold text-emerald-400">{formatPrice(selectedCoin.target_price)}</p>
                  </div>
                  <div>
                    <p className={`text-xs ${theme === 'dark' ? 'text-white/50' : 'text-gray-500'}`}>{txt('손절가', 'Stop Loss')}</p>
                    <p className="font-bold text-red-400">{formatPrice(selectedCoin.stop_loss)}</p>
                  </div>
                  <div>
                    <p className={`text-xs ${theme === 'dark' ? 'text-white/50' : 'text-gray-500'}`}>{txt('손익비', 'Risk:Reward')}</p>
                    <p className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{selectedCoin.risk_reward}</p>
                  </div>
                </div>
              </div>

              {/* AI Comment - 상세 버전으로 수정됨 */}
              <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-emerald-50 border border-emerald-200'}`}>
                <h3 className={`font-bold mb-2 ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>🤖 AI {txt('코멘트', 'Comment')}</h3>
                <p className={`${theme === 'dark' ? 'text-white/90' : 'text-gray-700'} whitespace-pre-line`}>{generateDetailedAIComment(selectedCoin)}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button onClick={() => toggleFavorite(selectedCoin)} className={`flex-1 py-3 rounded-lg ${favorites.some(f => f.coin_id === selectedCoin.id) ? 'bg-yellow-500/20 text-yellow-400' : (theme === 'dark' ? 'bg-white/10 text-white' : 'bg-gray-200 text-gray-700')}`}>{favorites.some(f => f.coin_id === selectedCoin.id) ? '⭐ ' + txt('즐겨찾기 해제', 'Remove Favorite') : '☆ ' + txt('즐겨찾기 추가', 'Add to Favorites')}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
