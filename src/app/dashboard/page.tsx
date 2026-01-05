'use client'

import { useState, useEffect, useRef, useLayoutEffect } from 'react'
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

type Favorite = {
  id: string
  coin_id: string
  coin_symbol: string
  coin_name: string
}

type AdSlot = {
  id: string
  title: string
  description: string
  link_url: string
  link_text: string
  image_url: string | null
  ad_type: 'own' | 'sponsored'
  position: 'sidebar' | 'footer' | 'banner' | 'modal'
  icon: string
  bg_color: string
  border_color: string
  display_order: number
}

type AlertSettings = {
  id?: string
  user_id: string
  selected_coins: string[]
  score_threshold: number
  time_morning: boolean
  time_afternoon: boolean
  time_evening: boolean
  time_night: boolean
  alert_signal: boolean
  alert_score_change: boolean
  alert_price: boolean
  telegram_id?: string | null
}

type PortfolioPosition = {
  id: string
  user_id: string
  coin_symbol: string
  coin_name: string
  position_type: 'LONG' | 'SHORT'
  entry_price: number
  target_price: number
  stop_loss: number
  amount?: number
  entry_date: string
  exit_price?: number
  exit_date?: string
  status: 'active' | 'closed' | 'cancelled'
  notes?: string
}

type AlertNotification = {
  id: string
  coin: string
  type: 'signal' | 'score' | 'price'
  message: string
  time: Date
  read: boolean
}

type BacktestResult = {
  symbol: string
  timeframe: string
  days: number
  summary: {
    initialCapital: number
    finalCapital: number
    totalReturn: string
    totalTrades: number
    wins: number
    losses: number
    winRate: string
    maxDrawdown: string
    profitFactor: string
    avgWin: string
    avgLoss: string
  }
  trades: {
    entryTime: number
    exitTime: number
    entryPrice: number
    exitPrice: number
    score: number
    pnl: number
    pnlPercent: number
    result: 'win' | 'loss'
  }[]
  equityCurve: { timestamp: number; equity: number }[]
  monthlyReturns: { month: string; return: number }[]
}

const formatPrice = (price: number): string => {
  if (price === 0) return '$0'
  if (price >= 1) return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  if (price >= 0.01) return `$${price.toFixed(4)}`
  if (price >= 0.0001) return `$${price.toFixed(6)}`
  if (price >= 0.00000001) return `$${price.toFixed(8)}`
  return `$${price.toExponential(4)}`
}

export default function Dashboard() {
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'alerts' | 'portfolio' | 'backtest' | 'report'>('dashboard')
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
  const [portfolioSearchLoading, setPortfolioSearchLoading] = useState(false)
  const [showPortfolioDropdown, setShowPortfolioDropdown] = useState(false)
  const portfolioDropdownRef = useRef<HTMLDivElement>(null)
  const [sliderValue, setSliderValue] = useState(90)
  const [inputValue, setInputValue] = useState('90')
  const [alertCoinSearch, setAlertCoinSearch] = useState('')
  const [alertSearchResults, setAlertSearchResults] = useState<string[]>([])
  const [alertSearchLoading, setAlertSearchLoading] = useState(false)
  const [searchSuggestions, setSearchSuggestions] = useState<{symbol: string, name: string}[]>([])
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const searchDropdownRef = useRef<HTMLDivElement>(null)
  const [telegramId, setTelegramId] = useState('')
  const [showFavorites, setShowFavorites] = useState(true)
  const notificationRef = useRef<HTMLDivElement>(null)

  // 백테스트 상태
  const [backtestCoin, setBacktestCoin] = useState('BTC')
  const [backtestTimeframe, setBacktestTimeframe] = useState('1d')
  const [backtestDays, setBacktestDays] = useState(90)
  const [backtestCapital, setBacktestCapital] = useState('10000000')
  const [backtestThreshold, setBacktestThreshold] = useState(90)
  const [backtestInvestRatio, setBacktestInvestRatio] = useState(10)
  const [backtestTargetMult, setBacktestTargetMult] = useState('1.04')
  const [backtestStopMult, setBacktestStopMult] = useState('0.97')
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null)
  const [backtestLoading, setBacktestLoading] = useState(false)
  const [backtestCoinSearch, setBacktestCoinSearch] = useState('')
  const [backtestSearchResults, setBacktestSearchResults] = useState<string[]>([])
  const [showBacktestDropdown, setShowBacktestDropdown] = useState(false)
  const backtestDropdownRef = useRef<HTMLDivElement>(null)

  const allCoins = ['BTC', 'ETH', 'XRP', 'BNB', 'SOL', 'ADA', 'DOGE', 'MATIC', 'DOT', 'SHIB', 'AVAX', 'LINK', 'UNI', 'ATOM', 'LTC', 'ETC', 'XLM', 'ALGO', 'VET', 'FIL', 'AAVE', 'AXS', 'SAND', 'MANA', 'GALA', 'ENJ', 'CHZ', 'APE', 'LDO', 'ARB', 'OP', 'IMX', 'NEAR', 'APT', 'SUI', 'SEI', 'TIA', 'INJ', 'FET', 'RNDR', 'GRT', 'SNX', 'CRV', 'MKR', 'COMP', '1INCH', 'SUSHI', 'YFI', 'BAL', 'CAKE', 'PEPE', 'BONK', 'FLOKI', 'WIF', 'ENA', 'PENDLE', 'JUP', 'WLD', 'STRK', 'PYTH', 'JTO', 'MEME', 'BLUR', 'ORDI', 'SATS', 'RATS', 'LEO', 'TON', 'TRX', 'HBAR', 'KAS', 'OKB', 'CRO', 'RUNE', 'STX', 'FTM', 'EGLD', 'FLOW', 'THETA', 'XTZ', 'NEO', 'KLAY', 'ZEC', 'IOTA', 'EOS']

  const router = useRouter()
  const supabase = createClientComponentClient()

  const colors = {
    dark: { cardBorder: 'border-white/10', text: 'text-white', textSecondary: 'text-white/50', bg: 'bg-[#0a0a14]', cardBg: 'bg-[#1a1a2e]' },
    light: { cardBorder: 'border-gray-200', text: 'text-gray-900', textSecondary: 'text-gray-500', bg: 'bg-gray-100', cardBg: 'bg-white' }
  }
  const currentColors = colors[theme]

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
    return { macro: Math.round(macro), etf: Math.round(etf), onchain: Math.round(onchain), ai: Math.round(ai), futures: Math.round(futures), technical: Math.round(technical), strategy: Math.round(strategy), total }
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
    if (signal === 'strong_buy') return `${coin.symbol.toUpperCase()}은 현재 강한 매수 신호입니다. 온체인(${scores.onchain}/25), 기술적분석(${scores.technical}/20)이 긍정적입니다.`
    if (signal === 'buy') return `${coin.symbol.toUpperCase()}은 매수 관점 접근 가능합니다. ETF 자금(${scores.etf}/25)이 긍정적입니다.`
    if (signal === 'hold') return `${coin.symbol.toUpperCase()}은 관망 구간입니다. 총점 ${scores.total}/140으로 방향성이 불명확합니다.`
    if (signal === 'sell') return `${coin.symbol.toUpperCase()}은 단기 조정 가능성이 있습니다.`
    return `${coin.symbol.toUpperCase()}은 강한 매도 신호입니다.`
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

  const loadFavoriteCoinsData = async (favs: Favorite[]) => {
    if (favs.length === 0) { setFavoriteCoins([]); return }
    const loadedCoins: AnalyzedCoin[] = []
    for (const fav of favs) {
      try {
        const response = await fetch(`/api/crypto?action=search&query=${encodeURIComponent(fav.coin_symbol)}`)
        const data = await response.json()
        if (data.coin) loadedCoins.push(analyzeCoin(data.coin))
      } catch (e) {}
    }
    setFavoriteCoins(loadedCoins)
  }

  useLayoutEffect(() => {
    const saved = localStorage.getItem('dashboard-theme')
    if (saved === 'light') setTheme('light')
    else { setTheme('dark'); localStorage.setItem('dashboard-theme', 'dark') }
    setThemeLoaded(true)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (portfolioDropdownRef.current && !portfolioDropdownRef.current.contains(event.target as Node)) setShowPortfolioDropdown(false)
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) setShowNotifications(false)
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(event.target as Node)) setShowSearchDropdown(false)
      if (backtestDropdownRef.current && !backtestDropdownRef.current.contains(event.target as Node)) setShowBacktestDropdown(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => { document.body.style.overflow = showDetail ? 'hidden' : ''; return () => { document.body.style.overflow = '' } }, [showDetail])

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
        try { const response = await fetch('/api/crypto?action=core'); const data = await response.json(); if (mounted && data.coins) setCoreCoins(data.coins.map(analyzeCoin)) } catch (e) {}
        if (profileData?.plan !== 'free') { try { const gainersResponse = await fetch('/api/crypto?action=gainers'); const gainersData = await gainersResponse.json(); if (mounted && gainersData.coins) setTopGainers(gainersData.coins.slice(0, 6).map(analyzeCoin)) } catch (e) {} }
        setLastUpdate(new Date())
        try { const { data: favData } = await supabase.from('favorites').select('*').eq('user_id', session.user.id); if (mounted && favData) { setFavorites(favData); await loadFavoriteCoinsData(favData) } } catch (e) {}
        try { const { data: adData } = await supabase.from('ad_slots').select('*').eq('is_active', true).order('display_order', { ascending: true }); if (mounted && adData) setAdSlots(adData) } catch (e) {}
        try { 
          const { data: alertData } = await supabase.from('alert_settings').select('*').eq('user_id', session.user.id).single()
          if (mounted) {
            if (alertData) { setAlertSettings(alertData); setSavedAlertSettings(alertData); setSliderValue(alertData.score_threshold); setInputValue(String(alertData.score_threshold)); if (alertData.telegram_id) setTelegramId(alertData.telegram_id) }
            else { setAlertSettings({ user_id: session.user.id, selected_coins: ['BTC', 'ETH'], score_threshold: 90, time_morning: true, time_afternoon: true, time_evening: true, time_night: false, alert_signal: true, alert_score_change: true, alert_price: true }) }
          }
        } catch (e) {}
        try { const { data: portfolioData } = await supabase.from('portfolio_positions').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }); if (mounted && portfolioData) setPortfolioPositions(portfolioData) } catch (e) {}
      } catch (error) { if (mounted) setLoading(false) }
    }
    init()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => { if (event === 'SIGNED_OUT') router.push('/login') })
    return () => { mounted = false; subscription.unsubscribe() }
  }, [supabase, router])

  useEffect(() => {
    if (!alertSettings || coreCoins.length === 0) return
    const allAnalyzedCoins = [...coreCoins, ...topGainers]
    const newNotifications: AlertNotification[] = []
    alertSettings.selected_coins.forEach(symbol => {
      const coin = allAnalyzedCoins.find(c => c.symbol.toUpperCase() === symbol.toUpperCase())
      if (coin && coin.scores.total >= alertSettings.score_threshold) {
        const exists = notifications.some(n => n.coin === symbol && n.type === 'score')
        if (!exists) newNotifications.push({ id: `${symbol}-${Date.now()}`, coin: symbol, type: 'score', message: `${symbol} 점수 ${coin.scores.total}/140 - ${alertSettings.score_threshold}점 이상!`, time: new Date(), read: false })
        if (alertSettings.alert_signal && (coin.signal === 'strong_buy' || coin.signal === 'buy')) {
          const signalExists = notifications.some(n => n.coin === symbol && n.type === 'signal')
          if (!signalExists) newNotifications.push({ id: `${symbol}-signal-${Date.now()}`, coin: symbol, type: 'signal', message: `${symbol} ${coin.signal === 'strong_buy' ? '🚀 강력 매수' : '📈 매수'} 시그널!`, time: new Date(), read: false })
        }
      }
    })
    if (newNotifications.length > 0) setNotifications(prev => [...newNotifications, ...prev].slice(0, 50))
  }, [alertSettings, coreCoins, topGainers])

  useEffect(() => {
    if (!user) return
    const interval = setInterval(async () => {
      try { 
        const response = await fetch('/api/crypto?action=core'); const data = await response.json(); if (data.coins) setCoreCoins(data.coins.map(analyzeCoin))
        if (profile?.plan !== 'free') { const gainersResponse = await fetch('/api/crypto?action=gainers'); const gainersData = await gainersResponse.json(); if (gainersData.coins) setTopGainers(gainersData.coins.slice(0, 6).map(analyzeCoin)) }
        if (favorites.length > 0) await loadFavoriteCoinsData(favorites)
        setLastUpdate(new Date()); setCountdown(120) 
      } catch (e) {}
    }, 120000)
    return () => clearInterval(interval)
  }, [user, profile?.plan, favorites])

  useEffect(() => { const timer = setInterval(() => setCountdown(prev => prev > 0 ? prev - 1 : 120), 1000); return () => clearInterval(timer) }, [])

  const handleSearchInput = async (query: string) => {
    setSearchQuery(query)
    if (!query.trim()) { setSearchSuggestions([]); setShowSearchDropdown(false); return }
    const queryUpper = query.toUpperCase().replace('USDT', '').replace('USD', '').trim()
    const exactMatch = allCoins.filter(c => c === queryUpper)
    const startsWith = allCoins.filter(c => c.startsWith(queryUpper) && c !== queryUpper)
    const includes = allCoins.filter(c => c.includes(queryUpper) && !c.startsWith(queryUpper))
    const localMatches = [...exactMatch, ...startsWith, ...includes].slice(0, 8).map(c => ({ symbol: c, name: c }))
    if (localMatches.length > 0) { setSearchSuggestions(localMatches); setShowSearchDropdown(true) }
    try { const response = await fetch(`/api/crypto?action=search&query=${encodeURIComponent(queryUpper)}`); const data = await response.json(); if (data.coin) { const apiResult = { symbol: data.coin.symbol.toUpperCase(), name: data.coin.name }; if (!localMatches.some(m => m.symbol === apiResult.symbol)) { setSearchSuggestions([apiResult, ...localMatches].slice(0, 8)) }; setShowSearchDropdown(true) } } catch (e) {}
  }

  const selectSearchCoin = async (symbol: string) => {
    setSearchQuery(symbol); setShowSearchDropdown(false); setSearchLoading(true)
    try { const response = await fetch(`/api/crypto?action=search&query=${encodeURIComponent(symbol)}`); const data = await response.json(); if (data.coin) setSearchResult(analyzeCoin(data.coin)); else { setSearchResult(null); alert('코인을 찾을 수 없습니다') } } catch (e) {}
    setSearchLoading(false)
  }

  const searchAlertCoin = async (query: string) => {
    if (!query.trim()) { setAlertSearchResults([]); return }
    const queryUpper = query.toUpperCase().replace('USDT', '').replace('USD', '').trim()
    const exactMatch = allCoins.filter(c => c === queryUpper)
    const startsWith = allCoins.filter(c => c.startsWith(queryUpper) && c !== queryUpper)
    const includes = allCoins.filter(c => c.includes(queryUpper) && !c.startsWith(queryUpper))
    const localResults = [...exactMatch, ...startsWith, ...includes]
    if (localResults.length > 0) { setAlertSearchResults(localResults.slice(0, 10)); return }
    setAlertSearchLoading(true)
    try { const response = await fetch(`/api/crypto?action=search&query=${encodeURIComponent(queryUpper)}`); const data = await response.json(); if (data.coin) setAlertSearchResults([data.coin.symbol.toUpperCase()]); else setAlertSearchResults([]) } catch (e) { setAlertSearchResults([]) }
    setAlertSearchLoading(false)
  }

  const searchPortfolioCoin = async (query: string) => {
    if (!query.trim()) { setPortfolioSearchResults(allCoins.slice(0, 20)); return }
    const queryUpper = query.toUpperCase().replace('USDT', '').replace('USD', '').trim()
    const exactMatch = allCoins.filter(c => c === queryUpper)
    const startsWith = allCoins.filter(c => c.startsWith(queryUpper) && c !== queryUpper)
    const includes = allCoins.filter(c => c.includes(queryUpper) && !c.startsWith(queryUpper))
    const localResults = [...exactMatch, ...startsWith, ...includes]
    if (localResults.length > 0) { setPortfolioSearchResults(localResults); return }
    setPortfolioSearchLoading(true)
    try { const response = await fetch(`/api/crypto?action=search&query=${encodeURIComponent(queryUpper)}`); const data = await response.json(); if (data.coin) setPortfolioSearchResults([data.coin.symbol.toUpperCase()]); else setPortfolioSearchResults([]) } catch (e) { setPortfolioSearchResults([]) }
    setPortfolioSearchLoading(false)
  }

  const searchBacktestCoin = (query: string) => {
    if (!query.trim()) { setBacktestSearchResults(allCoins.slice(0, 20)); return }
    const queryUpper = query.toUpperCase().replace('USDT', '').replace('USD', '').trim()
    const exactMatch = allCoins.filter(c => c === queryUpper)
    const startsWith = allCoins.filter(c => c.startsWith(queryUpper) && c !== queryUpper)
    const includes = allCoins.filter(c => c.includes(queryUpper) && !c.startsWith(queryUpper))
    setBacktestSearchResults([...exactMatch, ...startsWith, ...includes].slice(0, 20))
  }

  const runBacktest = async () => {
    if (profile?.plan === 'free') { alert('백테스트는 PRO 전용 기능입니다'); return }
    setBacktestLoading(true)
    try {
      const response = await fetch('/api/backtest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: backtestCoin,
          days: backtestDays,
          timeframe: backtestTimeframe,
          initialCapital: parseInt(backtestCapital),
          entryThreshold: backtestThreshold,
          investmentRatio: backtestInvestRatio,
          targetMultiplier: parseFloat(backtestTargetMult),
          stopLossMultiplier: parseFloat(backtestStopMult),
        })
      })
      const data = await response.json()
      if (data.error) { alert('백테스트 실패: ' + data.error); return }
      setBacktestResult(data)
    } catch (e) { alert('백테스트 중 오류가 발생했습니다') }
    setBacktestLoading(false)
  }

  const saveAlertSettings = async () => {
    if (!user || !alertSettings) return
    setSettingsSaving(true)
    const settingsToSave = { ...alertSettings, score_threshold: sliderValue, user_id: user.id, telegram_id: telegramId || null, updated_at: new Date().toISOString() }
    const { error } = await supabase.from('alert_settings').upsert(settingsToSave)
    if (error) alert('설정 저장 실패: ' + error.message)
    else { setAlertSettings(settingsToSave); setSavedAlertSettings(settingsToSave); alert('✅ 설정이 저장되었습니다!') }
    setSettingsSaving(false)
  }

  const deleteAlertSettings = async () => {
    if (!user || !savedAlertSettings?.id) return
    if (!confirm('알림 설정을 삭제하시겠습니까?')) return
    const { error } = await supabase.from('alert_settings').delete().eq('id', savedAlertSettings.id)
    if (error) alert('삭제 실패: ' + error.message)
    else { setAlertSettings({ user_id: user.id, selected_coins: ['BTC', 'ETH'], score_threshold: 90, time_morning: true, time_afternoon: true, time_evening: true, time_night: false, alert_signal: true, alert_score_change: true, alert_price: true }); setSavedAlertSettings(null); setSliderValue(90); setInputValue('90'); setTelegramId(''); alert('✅ 삭제됨') }
  }

  const addPosition = async () => {
    if (!user) return
    if (!entryValue || !targetValue || !stopValue) { alert('모든 가격을 입력해주세요'); return }
    const { data, error } = await supabase.from('portfolio_positions').insert({ user_id: user.id, coin_symbol: positionCoin, coin_name: positionCoin, position_type: positionType, entry_price: parseFloat(entryValue), target_price: parseFloat(targetValue), stop_loss: parseFloat(stopValue), status: 'active' }).select().single()
    if (error) alert('포지션 추가 실패')
    else if (data) { setPortfolioPositions([data, ...portfolioPositions]); setEntryValue(''); setTargetValue(''); setStopValue(''); alert('✅ 포지션 추가됨') }
  }

  const deletePosition = async (position: PortfolioPosition) => {
    if (!confirm(`${position.coin_symbol} ${position.position_type} 포지션을 삭제하시겠습니까?`)) return
    const { error } = await supabase.from('portfolio_positions').delete().eq('id', position.id)
    if (error) alert('삭제 실패')
    else { setPortfolioPositions(portfolioPositions.filter(p => p.id !== position.id)); alert('✅ 삭제됨') }
  }

  const toggleTheme = () => { const newTheme = theme === 'dark' ? 'light' : 'dark'; setTheme(newTheme); localStorage.setItem('dashboard-theme', newTheme) }

  const calculatePortfolioStats = () => {
    const active = portfolioPositions.filter(p => p.status === 'active')
    const closed = portfolioPositions.filter(p => p.status === 'closed')
    let totalPnL = 0, wins = 0, losses = 0
    closed.forEach(p => { if (p.exit_price) { const pnl = p.position_type === 'LONG' ? ((p.exit_price - p.entry_price) / p.entry_price) * 100 : ((p.entry_price - p.exit_price) / p.entry_price) * 100; totalPnL += pnl; if (pnl > 0) wins++; else losses++ } })
    return { total: portfolioPositions.length, active: active.length, closed: closed.length, winRate: (closed.length > 0 ? (wins / closed.length) * 100 : 0).toFixed(1), totalPnL: totalPnL.toFixed(2), wins, losses }
  }

  const downloadPDF = () => {
    const stats = calculatePortfolioStats(); const now = new Date(); const dateStr = now.toLocaleDateString('ko-KR'); const timeStr = now.toLocaleTimeString('ko-KR')
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>크립토 대시보드 PRO - 트레이딩 리포트</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Malgun Gothic',sans-serif;padding:40px;background:#fff;color:#333;line-height:1.6}.header{text-align:center;border-bottom:3px solid #00d395;padding-bottom:30px;margin-bottom:40px}.header h1{color:#00d395;font-size:28px}.section{margin-bottom:40px}.section h2{color:#333;font-size:18px;border-left:4px solid #00d395;padding-left:15px;margin-bottom:20px}table{width:100%;border-collapse:collapse}th{background:#f8f9fa;padding:12px;text-align:left;border-bottom:2px solid #dee2e6}td{padding:12px;border-bottom:1px solid #eee}.long{color:#00d395}.short{color:#ff6b6b}.summary-box{background:linear-gradient(135deg,#00d395,#00b383);color:white;padding:25px;border-radius:12px;margin-bottom:30px}.summary-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:20px;text-align:center}.footer{text-align:center;margin-top:50px;color:#999}</style></head><body><div class="header"><h1>🚀 크립토 대시보드 PRO</h1><p>트레이딩 리포트 - ${dateStr} ${timeStr}</p></div><div class="summary-box"><div class="summary-grid"><div><div style="font-size:24px;font-weight:bold">${stats.total}</div><div>총 포지션</div></div><div><div style="font-size:24px;font-weight:bold">${stats.active}</div><div>활성</div></div><div><div style="font-size:24px;font-weight:bold">${stats.winRate}%</div><div>승률</div></div><div><div style="font-size:24px;font-weight:bold">${parseFloat(stats.totalPnL)>=0?'+':''}${stats.totalPnL}%</div><div>수익률</div></div></div></div><div class="section"><h2>📋 활성 포지션</h2><table><thead><tr><th>코인</th><th>방향</th><th>진입가</th><th>목표가</th><th>손절가</th></tr></thead><tbody>${portfolioPositions.filter(p=>p.status==='active').map(p=>`<tr><td>${p.coin_symbol}</td><td class="${p.position_type.toLowerCase()}">${p.position_type}</td><td>$${p.entry_price.toLocaleString()}</td><td>$${p.target_price.toLocaleString()}</td><td>$${p.stop_loss.toLocaleString()}</td></tr>`).join('')||'<tr><td colspan="5" style="text-align:center;padding:30px">없음</td></tr>'}</tbody></table></div></body></html>`
    const win = window.open('', '_blank'); if (win) { win.document.write(html); win.document.close(); setTimeout(() => win.print(), 500) }
  }

  const toggleFavorite = async (coin: AnalyzedCoin) => {
    if (!user) return
    const existing = favorites.find(f => f.coin_id === coin.id)
    if (existing) { await supabase.from('favorites').delete().eq('id', existing.id); setFavorites(favorites.filter(f => f.id !== existing.id)); setFavoriteCoins(favoriteCoins.filter(fc => fc.id !== coin.id)) }
    else { if (profile?.plan === 'free' && favorites.length >= 3) { alert('무료는 3개까지'); return }; const { data } = await supabase.from('favorites').insert({ user_id: user.id, coin_id: coin.id, coin_symbol: coin.symbol, coin_name: coin.name }).select().single(); if (data) { setFavorites([data, ...favorites]); setFavoriteCoins([coin, ...favoriteCoins]) } }
  }

  const handleAdClick = async (ad: AdSlot) => { try { await supabase.rpc('increment_ad_click', { ad_id: ad.id }) } catch (e) {}; window.open(ad.link_url, '_blank') }
  const handleSearch = async () => { if (!searchQuery.trim() || profile?.plan === 'free') return; setShowSearchDropdown(false); setSearchLoading(true); const cleanQuery = searchQuery.toUpperCase().replace('USDT', '').replace('USD', '').trim(); try { const response = await fetch(`/api/crypto?action=search&query=${encodeURIComponent(cleanQuery)}`); const data = await response.json(); if (data.coin) setSearchResult(analyzeCoin(data.coin)); else { setSearchResult(null); alert('코인을 찾을 수 없습니다') } } catch (e) {}; setSearchLoading(false) }
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => { const val = parseInt(e.target.value); setSliderValue(val); setInputValue(String(val)) }
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { setInputValue(e.target.value) }
  const handleInputBlur = () => { const num = parseInt(inputValue); if (isNaN(num)) setInputValue(String(sliderValue)); else { const clamped = Math.min(130, Math.max(50, num)); setSliderValue(clamped); setInputValue(String(clamped)) } }
  const markAllRead = () => { setNotifications(notifications.map(n => ({ ...n, read: true }))) }
  const unreadCount = notifications.filter(n => !n.read).length

  const SignalBadge = ({ signal }: { signal: string }) => {
    const config: Record<string, { text: string; bg: string; icon: string }> = { strong_buy: { text: '강력 매수', bg: 'bg-green-500', icon: '🚀' }, buy: { text: '매수', bg: 'bg-green-400', icon: '📈' }, hold: { text: '관망', bg: 'bg-yellow-500', icon: '⏸️' }, sell: { text: '매도', bg: 'bg-red-400', icon: '📉' }, strong_sell: { text: '강력 매도', bg: 'bg-red-500', icon: '🔻' } }
    const { text, bg, icon } = config[signal] || config.hold
    return <span className={`${bg} text-white px-3 py-1 rounded-full text-sm font-bold`}>{icon} {text}</span>
  }

  const ScoreBar = ({ label, score, max, color }: { label: string; score: number; max: number; color: string }) => (<div className="mb-2"><div className="flex justify-between text-sm mb-1"><span className={currentColors.textSecondary}>{label}</span><span className={`${currentColors.text} font-semibold`}>{score}/{max}</span></div><div className={`h-2 ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'} rounded-full overflow-hidden`}><div className={`h-full ${color} rounded-full`} style={{ width: `${(score / max) * 100}%` }} /></div></div>)

  const AdCard = ({ ad }: { ad: AdSlot }) => (<div className={`bg-gradient-to-r ${ad.bg_color || 'from-purple-500/20 to-blue-500/20'} border ${ad.border_color || 'border-purple-500/30'} rounded-xl cursor-pointer hover:scale-[1.02] transition-all p-3`} onClick={() => handleAdClick(ad)}><div className="flex items-center gap-3"><span className="text-2xl">{ad.icon || '📢'}</span><div className="flex-1 min-w-0"><p className="font-semibold text-white text-sm">{ad.title}</p><p className="text-white/70 truncate text-xs">{ad.description}</p></div><span className="text-[#00d395] text-xs font-semibold">{ad.link_text || '바로가기'} →</span></div></div>)

  const CoinCard = ({ coin, showFavButton = true }: { coin: AnalyzedCoin, showFavButton?: boolean }) => {
    const isPro = profile?.plan !== 'free'
    const isFavorited = favorites.some(f => f.coin_id === coin.id)
    return (
      <div className={`${currentColors.cardBg} rounded-2xl p-5 border cursor-pointer hover:border-[#00d395]/50 transition-all relative ${coin.signal === 'strong_buy' || coin.signal === 'buy' ? 'border-[#00d395]/30' : coin.signal === 'hold' ? 'border-yellow-500/30' : 'border-[#ff6b6b]/30'}`} onClick={() => { setSelectedCoin(coin); setShowDetail(true) }}>
        {showFavButton && <button onClick={(e) => { e.stopPropagation(); toggleFavorite(coin) }} className={`absolute top-3 right-3 text-xl ${isFavorited ? 'text-yellow-400' : 'text-white/30 hover:text-yellow-400'}`}>{isFavorited ? '★' : '☆'}</button>}
        <div className="flex justify-between items-start mb-4 pr-8"><div><div className="flex items-center gap-2"><span className={`text-xl font-bold ${currentColors.text}`}>{coin.symbol.toUpperCase()}</span><span className={`text-xs px-2 py-0.5 rounded ${coin.scores.total >= 95 ? 'bg-[#00d395]/20 text-[#00d395]' : coin.scores.total >= 70 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-[#ff6b6b]/20 text-[#ff6b6b]'}`}>{coin.scores.total}/140</span></div><p className={currentColors.textSecondary + ' text-sm'}>{coin.name}</p></div><SignalBadge signal={coin.signal} /></div>
        <div className="mb-4"><p className="text-2xl font-bold text-[#00d395]">{formatPrice(coin.current_price)}</p><p className={`text-sm ${coin.price_change_percentage_24h >= 0 ? 'text-[#00d395]' : 'text-[#ff6b6b]'}`}>{coin.price_change_percentage_24h >= 0 ? '▲' : '▼'} {Math.abs(coin.price_change_percentage_24h || 0).toFixed(2)}%</p></div>
        {isPro ? (<div className={`${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-3 space-y-2`}><div className="flex justify-between"><span className={currentColors.textSecondary + ' text-sm'}>진입가</span><span className="text-[#00d395] font-semibold">{formatPrice(coin.entry_price)}</span></div><div className="flex justify-between"><span className={currentColors.textSecondary + ' text-sm'}>목표가</span><span className="text-blue-400 font-semibold">{formatPrice(coin.target_price)}</span></div><div className="flex justify-between"><span className={currentColors.textSecondary + ' text-sm'}>손절가</span><span className="text-[#ff6b6b] font-semibold">{formatPrice(coin.stop_loss)}</span></div><div className={`flex justify-between pt-2 border-t ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}><span className={currentColors.textSecondary + ' text-sm'}>손익비</span><span className="text-yellow-400 font-bold">{coin.risk_reward}</span></div></div>) : (<div className={`${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-4 text-center`}><p className={currentColors.textSecondary + ' text-sm'}>🔒 PRO 전용</p></div>)}
        <button className="w-full mt-3 py-2 text-sm text-[#00d395] hover:bg-[#00d395]/10 rounded-lg">상세 분석 →</button>
      </div>
    )
  }

  // 수익률 차트 (간단한 SVG)
  const EquityChart = ({ data }: { data: { timestamp: number; equity: number }[] }) => {
    if (data.length < 2) return null
    const minEquity = Math.min(...data.map(d => d.equity))
    const maxEquity = Math.max(...data.map(d => d.equity))
    const range = maxEquity - minEquity || 1
    const width = 600
    const height = 200
    const padding = 40
    
    const points = data.map((d, i) => {
      const x = padding + (i / (data.length - 1)) * (width - padding * 2)
      const y = height - padding - ((d.equity - minEquity) / range) * (height - padding * 2)
      return `${x},${y}`
    }).join(' ')
    
    const initialEquity = data[0]?.equity || 0
    const finalEquity = data[data.length - 1]?.equity || 0
    const isProfit = finalEquity >= initialEquity
    
    return (
      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[400px]">
          {/* 그리드 */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
            <g key={i}>
              <line x1={padding} y1={padding + ratio * (height - padding * 2)} x2={width - padding} y2={padding + ratio * (height - padding * 2)} stroke={theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} />
              <text x={padding - 5} y={padding + ratio * (height - padding * 2) + 4} textAnchor="end" className={`text-xs ${theme === 'dark' ? 'fill-white/50' : 'fill-gray-500'}`}>
                {((maxEquity - ratio * range) / 1000000).toFixed(1)}M
              </text>
            </g>
          ))}
          {/* 기준선 (시작 자본) */}
          <line x1={padding} y1={height - padding - ((initialEquity - minEquity) / range) * (height - padding * 2)} x2={width - padding} y2={height - padding - ((initialEquity - minEquity) / range) * (height - padding * 2)} stroke="rgba(255,255,255,0.3)" strokeDasharray="5,5" />
          {/* 수익률 곡선 */}
          <polyline fill="none" stroke={isProfit ? '#00d395' : '#ff6b6b'} strokeWidth="2" points={points} />
          {/* 영역 채우기 */}
          <polygon fill={isProfit ? 'rgba(0,211,149,0.1)' : 'rgba(255,107,107,0.1)'} points={`${padding},${height - padding} ${points} ${width - padding},${height - padding}`} />
        </svg>
      </div>
    )
  }

  if (!themeLoaded || loading) return (<div className="min-h-screen flex items-center justify-center bg-[#0a0a14]"><div className="text-center"><div className="w-12 h-12 border-4 border-[#00d395] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div><p className="text-white">로딩 중...</p></div></div>)

  const sidebarAds = adSlots.filter(ad => ad.position === 'sidebar')
  const ownAds = sidebarAds.filter(ad => ad.ad_type === 'own')
  const sponsoredAds = sidebarAds.filter(ad => ad.ad_type === 'sponsored')

  return (
    <div className={`min-h-screen ${currentColors.bg} ${currentColors.text}`}>
      <header className={`border-b ${theme === 'dark' ? 'border-white/10 bg-[#0a0a14]/95' : 'border-gray-200 bg-white/95'} sticky top-0 backdrop-blur z-40`}>
        <div className="max-w-[1600px] mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4"><Link href="/" className="text-xl font-bold">🚀 크립토 대시보드 PRO</Link>{profile?.plan !== 'free' && <span className="bg-[#00d395] text-black px-2 py-1 rounded text-xs font-bold">{profile?.plan?.toUpperCase()}</span>}</div>
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'}`}><span className="text-sm">☀️</span><button type="button" onClick={toggleTheme} className={`w-12 h-6 rounded-full relative ${theme === 'dark' ? 'bg-[#00d395]' : 'bg-gray-400'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${theme === 'dark' ? 'left-7' : 'left-1'}`} /></button><span className="text-sm">🌙</span></div>
              <div className={`text-sm ${currentColors.textSecondary}`}>{lastUpdate.toLocaleTimeString('ko-KR')} | <span className="text-[#00d395]">{countdown}초</span></div>
              <span className={currentColors.textSecondary}>{profile?.nickname || user?.email?.split('@')[0]}</span>
              <Link href="/pricing" className="text-sm text-[#00d395]">요금제</Link>
              <button type="button" onClick={() => supabase.auth.signOut()} className={`text-sm ${currentColors.textSecondary}`}>로그아웃</button>
              <div className="relative" ref={notificationRef}><button type="button" onClick={() => setShowNotifications(!showNotifications)} className={`relative p-2 rounded-full ${theme === 'dark' ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-200 hover:bg-gray-300'}`}>🔔{unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-[#ff6b6b] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">{unreadCount > 9 ? '9+' : unreadCount}</span>}</button>{showNotifications && (<div className={`absolute right-0 top-12 w-80 max-h-96 overflow-y-auto rounded-xl border shadow-2xl z-50 ${currentColors.cardBg} ${currentColors.cardBorder}`}><div className="p-3 border-b flex justify-between items-center"><span className={`font-bold ${currentColors.text}`}>🔔 알림</span>{notifications.length > 0 && <button type="button" onClick={markAllRead} className="text-xs text-[#00d395]">모두 읽음</button>}</div>{notifications.length === 0 ? <div className={`p-6 text-center ${currentColors.textSecondary}`}>알림 없음</div> : notifications.slice(0, 10).map(n => (<div key={n.id} className={`p-3 border-b ${theme === 'dark' ? 'border-white/5' : 'border-gray-100'} ${!n.read ? (theme === 'dark' ? 'bg-[#00d395]/10' : 'bg-green-50') : ''}`}><p className={`text-sm ${currentColors.text}`}>{n.message}</p><p className={`text-xs ${currentColors.textSecondary} mt-1`}>{n.time.toLocaleTimeString('ko-KR')}</p></div>))}</div>)}</div>
            </div>
          </div>
        </div>
      </header>

      <div className={`border-b ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}><div className="max-w-[1600px] mx-auto px-4"><div className="flex gap-2 py-3 overflow-x-auto">{[{ id: 'dashboard', label: '📊 대시보드' }, { id: 'alerts', label: '🔔 알림 설정' }, { id: 'portfolio', label: '💼 포트폴리오' }, { id: 'backtest', label: '📈 백테스트' }, { id: 'report', label: '📋 리포트' }].map(tab => (<button key={tab.id} type="button" onClick={() => setActiveTab(tab.id as any)} className={`px-5 py-2.5 rounded-xl font-semibold transition whitespace-nowrap ${activeTab === tab.id ? 'bg-[#00d395] text-black' : `${theme === 'dark' ? 'bg-white/5 text-white/70 hover:bg-white/10' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}`}>{tab.label}{tab.id === 'backtest' && <span className="ml-1 text-xs bg-purple-500 text-white px-1.5 py-0.5 rounded">PRO</span>}</button>))}</div></div></div>

      <div className="max-w-[1600px] mx-auto px-4 py-8">
        {activeTab === 'dashboard' && (
          <div className="flex gap-6">
            <main className="flex-1 min-w-0">
              {profile?.plan !== 'free' && (<div className="mb-8 relative" ref={searchDropdownRef}><div className="flex gap-3"><input type="text" value={searchQuery} onChange={(e) => handleSearchInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} onFocus={() => searchQuery && setShowSearchDropdown(true)} placeholder="코인명 입력 (예: ENA, PEPE, FLOKI) - USDT 제외" className={`flex-1 ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'} border rounded-xl px-4 py-3 focus:outline-none focus:border-[#00d395]`} /><button type="button" onClick={handleSearch} disabled={searchLoading} className="bg-[#00d395] text-black px-8 py-3 rounded-xl font-semibold">{searchLoading ? '...' : '🔍 분석'}</button></div>{showSearchDropdown && searchSuggestions.length > 0 && (<div className={`absolute left-0 right-24 top-14 rounded-xl border shadow-2xl z-50 ${currentColors.cardBg} ${currentColors.cardBorder}`}>{searchSuggestions.map((s, i) => (<button key={i} type="button" onClick={() => selectSearchCoin(s.symbol)} className={`w-full px-4 py-3 text-left hover:bg-[#00d395]/20 flex justify-between ${i !== searchSuggestions.length - 1 ? `border-b ${theme === 'dark' ? 'border-white/5' : 'border-gray-100'}` : ''}`}><span className={`font-bold ${currentColors.text}`}>{s.symbol}</span><span className={currentColors.textSecondary}>{s.name}</span></button>))}</div>)}</div>)}
              {searchResult && <div className="mb-8"><h2 className={`text-xl font-bold mb-4 ${currentColors.text}`}>🔍 검색 결과</h2><div className="max-w-md"><CoinCard coin={searchResult} /></div></div>}
              {favorites.length > 0 && (<section className="mb-10"><div className="flex items-center justify-between mb-4"><h2 className={`text-xl font-bold ${currentColors.text}`}>⭐ 즐겨찾기 ({favorites.length})</h2><button type="button" onClick={() => setShowFavorites(!showFavorites)} className={`text-sm px-3 py-1 rounded-lg ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'}`}>{showFavorites ? '접기 ▲' : '펼치기 ▼'}</button></div>{showFavorites && <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">{favoriteCoins.length > 0 ? favoriteCoins.map(coin => <CoinCard key={coin.id} coin={coin} />) : favorites.map(f => (<div key={f.id} className={`${currentColors.cardBg} rounded-2xl p-5 border ${currentColors.cardBorder}`}><span className={`text-xl font-bold ${currentColors.text}`}>{f.coin_symbol}</span><p className={`${currentColors.textSecondary} text-sm mt-2`}>로딩 중...</p></div>))}</div>}</section>)}
              <section className="mb-10"><h2 className={`text-xl font-bold mb-4 ${currentColors.text}`}>🔥 핵심 코인</h2><div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">{coreCoins.map(coin => <CoinCard key={coin.id} coin={coin} />)}</div></section>
              {profile?.plan !== 'free' ? (<section className="mb-10"><h2 className={`text-xl font-bold mb-4 ${currentColors.text}`}>📈 상승 코인 TOP 6 <span className="bg-[#00d395] text-black px-2 py-0.5 rounded text-xs">PRO</span></h2><div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{topGainers.map(coin => <CoinCard key={coin.id} coin={coin} />)}</div></section>) : (<section className="mb-10"><div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-2xl text-center py-12 px-6"><h2 className={`text-2xl font-bold mb-4 ${currentColors.text}`}>🔒 PRO 기능</h2><Link href="/pricing" className="bg-[#00d395] text-black px-8 py-3 rounded-xl font-semibold inline-block">업그레이드 →</Link></div></section>)}
              <section><h2 className={`text-xl font-bold mb-4 ${currentColors.text}`}>📊 시장 요약</h2><div className={`${currentColors.cardBg} rounded-2xl p-6 border ${currentColors.cardBorder}`}><div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center"><div><p className={`${currentColors.textSecondary} text-sm mb-1`}>분석 코인</p><p className={`text-2xl font-bold ${currentColors.text}`}>{coreCoins.length + topGainers.length}</p></div><div><p className={`${currentColors.textSecondary} text-sm mb-1`}>매수</p><p className="text-2xl font-bold text-[#00d395]">{[...coreCoins, ...topGainers].filter(c => c.signal === 'buy' || c.signal === 'strong_buy').length}</p></div><div><p className={`${currentColors.textSecondary} text-sm mb-1`}>관망</p><p className="text-2xl font-bold text-yellow-400">{[...coreCoins, ...topGainers].filter(c => c.signal === 'hold').length}</p></div><div><p className={`${currentColors.textSecondary} text-sm mb-1`}>매도</p><p className="text-2xl font-bold text-[#ff6b6b]">{[...coreCoins, ...topGainers].filter(c => c.signal === 'sell' || c.signal === 'strong_sell').length}</p></div></div></div></section>
            </main>
            <aside className="hidden xl:block w-72 flex-shrink-0"><div className="sticky top-24 space-y-6"><div><h3 className={`text-lg font-bold mb-3 ${currentColors.text}`}>📢 소통 채널</h3><div className="space-y-2">{ownAds.length > 0 ? ownAds.map(ad => <AdCard key={ad.id} ad={ad} />) : <p className={currentColors.textSecondary + ' text-sm'}>등록된 채널 없음</p>}</div></div><div className={`border-t ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'} pt-6`}><h4 className={`text-sm ${currentColors.textSecondary} mb-3`}>💎 파트너</h4><div className="space-y-2">{sponsoredAds.length > 0 ? sponsoredAds.map(ad => <AdCard key={ad.id} ad={ad} />) : (<div className={`${currentColors.cardBg} border ${currentColors.cardBorder} rounded-xl p-4 text-center`}><p className={currentColors.textSecondary + ' text-sm'}>광고 문의</p></div>)}</div></div></div></aside>
          </div>
        )}

        {activeTab === 'backtest' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-2xl p-6">
              <h3 className={`text-lg font-bold mb-2 ${currentColors.text}`}>📈 백테스트란?</h3>
              <p className={currentColors.textSecondary}>과거 데이터로 체크리스트 시스템의 성능을 검증합니다. "만약 3개월 전부터 이 시스템을 썼다면?" 시뮬레이션 결과를 확인하세요.</p>
            </div>

            {profile?.plan === 'free' ? (
              <div className={`${currentColors.cardBg} rounded-2xl p-8 border ${currentColors.cardBorder} text-center`}>
                <div className="text-6xl mb-4">🔒</div>
                <h3 className={`text-2xl font-bold mb-4 ${currentColors.text}`}>PRO 전용 기능</h3>
                <p className={`${currentColors.textSecondary} mb-6`}>백테스트는 PRO 플랜 전용 기능입니다.<br/>과거 데이터로 시스템 성능을 검증하고 신뢰도를 확인하세요.</p>
                <div className={`${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-6 mb-6`}>
                  <h4 className={`font-bold mb-3 ${currentColors.text}`}>백테스트 미리보기</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div><div className="text-2xl font-bold text-[#00d395]">+32.5%</div><div className={currentColors.textSecondary + ' text-sm'}>3개월 수익률</div></div>
                    <div><div className="text-2xl font-bold text-[#00d395]">67.2%</div><div className={currentColors.textSecondary + ' text-sm'}>승률</div></div>
                    <div><div className="text-2xl font-bold text-yellow-400">1.52</div><div className={currentColors.textSecondary + ' text-sm'}>손익비</div></div>
                    <div><div className="text-2xl font-bold text-[#ff6b6b]">-8.3%</div><div className={currentColors.textSecondary + ' text-sm'}>최대 낙폭</div></div>
                  </div>
                  <p className={`${currentColors.textSecondary} text-xs mt-4`}>* BTC 90일 백테스트 예시 데이터</p>
                </div>
                <Link href="/pricing" className="bg-[#00d395] text-black px-8 py-3 rounded-xl font-semibold inline-block">PRO 업그레이드 →</Link>
              </div>
            ) : (
              <>
                <div className={`${currentColors.cardBg} rounded-2xl p-6 border ${currentColors.cardBorder}`}>
                  <h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>⚙️ 백테스트 설정</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="relative" ref={backtestDropdownRef}>
                      <label className={`block text-sm ${currentColors.textSecondary} mb-1`}>코인</label>
                      <button type="button" onClick={() => { setShowBacktestDropdown(!showBacktestDropdown); setBacktestSearchResults(allCoins.slice(0, 20)) }} className={`w-full p-3 rounded-xl border ${currentColors.cardBorder} ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'} text-left flex justify-between`}>
                        <span>{backtestCoin}</span><span>▼</span>
                      </button>
                      {showBacktestDropdown && (
                        <div className={`absolute z-50 w-full mt-1 rounded-xl border ${currentColors.cardBorder} ${currentColors.cardBg} shadow-lg`}>
                          <div className="p-2"><input type="text" placeholder="검색..." value={backtestCoinSearch} onChange={(e) => { setBacktestCoinSearch(e.target.value); searchBacktestCoin(e.target.value) }} className={`w-full p-2 rounded-lg border ${currentColors.cardBorder} ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'} text-sm`} autoFocus /></div>
                          <div className="max-h-48 overflow-y-auto">{backtestSearchResults.map(c => (<button key={c} type="button" onClick={() => { setBacktestCoin(c); setShowBacktestDropdown(false); setBacktestCoinSearch('') }} className={`w-full px-4 py-2 text-left hover:bg-[#00d395]/20 ${backtestCoin === c ? 'bg-[#00d395]/10' : ''}`}>{c}</button>))}</div>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className={`block text-sm ${currentColors.textSecondary} mb-1`}>타임프레임</label>
                      <select value={backtestTimeframe} onChange={(e) => setBacktestTimeframe(e.target.value)} className={`w-full p-3 rounded-xl border ${currentColors.cardBorder} ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                        <option value="15m">15분봉</option>
                        <option value="1h">1시간봉</option>
                        <option value="4h">4시간봉</option>
                        <option value="1d">일봉</option>
                      </select>
                    </div>
                    <div>
                      <label className={`block text-sm ${currentColors.textSecondary} mb-1`}>기간</label>
                      <select value={backtestDays} onChange={(e) => setBacktestDays(parseInt(e.target.value))} className={`w-full p-3 rounded-xl border ${currentColors.cardBorder} ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                        <option value={30}>1개월</option>
                        <option value={90}>3개월</option>
                        <option value={180}>6개월</option>
                        <option value={365}>1년</option>
                      </select>
                    </div>
                    <div>
                      <label className={`block text-sm ${currentColors.textSecondary} mb-1`}>시작 자본</label>
                      <input type="text" value={backtestCapital} onChange={(e) => setBacktestCapital(e.target.value)} className={`w-full p-3 rounded-xl border ${currentColors.cardBorder} ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`} />
                    </div>
                    <div>
                      <label className={`block text-sm ${currentColors.textSecondary} mb-1`}>진입 기준 점수</label>
                      <input type="number" min={50} max={130} value={backtestThreshold} onChange={(e) => setBacktestThreshold(parseInt(e.target.value))} className={`w-full p-3 rounded-xl border ${currentColors.cardBorder} ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`} />
                    </div>
                    <div>
                      <label className={`block text-sm ${currentColors.textSecondary} mb-1`}>투자 비율 (%)</label>
                      <input type="number" min={1} max={100} value={backtestInvestRatio} onChange={(e) => setBacktestInvestRatio(parseInt(e.target.value))} className={`w-full p-3 rounded-xl border ${currentColors.cardBorder} ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`} />
                    </div>
                    <div>
                      <label className={`block text-sm ${currentColors.textSecondary} mb-1`}>목표가 배율</label>
                      <input type="text" value={backtestTargetMult} onChange={(e) => setBacktestTargetMult(e.target.value)} placeholder="1.04" className={`w-full p-3 rounded-xl border ${currentColors.cardBorder} ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`} />
                    </div>
                    <div>
                      <label className={`block text-sm ${currentColors.textSecondary} mb-1`}>손절가 배율</label>
                      <input type="text" value={backtestStopMult} onChange={(e) => setBacktestStopMult(e.target.value)} placeholder="0.97" className={`w-full p-3 rounded-xl border ${currentColors.cardBorder} ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`} />
                    </div>
                  </div>
                  <button type="button" onClick={runBacktest} disabled={backtestLoading} className="mt-6 w-full bg-[#00d395] text-black py-4 rounded-xl font-bold text-lg disabled:opacity-50">
                    {backtestLoading ? '⏳ 백테스트 실행 중...' : '🚀 백테스트 실행'}
                  </button>
                </div>

                {backtestResult && (
                  <>
                    <div className="bg-gradient-to-r from-[#00d395] to-[#00b383] rounded-2xl p-6 text-white">
                      <h3 className="text-lg font-bold mb-4">📊 {backtestResult.symbol} 백테스트 결과 ({backtestResult.days}일)</h3>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                        <div><div className="text-3xl font-bold">{parseFloat(backtestResult.summary.totalReturn) >= 0 ? '+' : ''}{backtestResult.summary.totalReturn}%</div><div className="text-sm opacity-80">총 수익률</div></div>
                        <div><div className="text-3xl font-bold">{backtestResult.summary.winRate}%</div><div className="text-sm opacity-80">승률</div></div>
                        <div><div className="text-3xl font-bold">{backtestResult.summary.profitFactor}</div><div className="text-sm opacity-80">손익비</div></div>
                        <div><div className="text-3xl font-bold">{backtestResult.summary.totalTrades}</div><div className="text-sm opacity-80">총 거래</div></div>
                        <div><div className="text-3xl font-bold text-red-200">-{backtestResult.summary.maxDrawdown}%</div><div className="text-sm opacity-80">최대 낙폭</div></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className={`${currentColors.cardBg} rounded-2xl p-6 border ${currentColors.cardBorder}`}>
                        <h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>📈 자산 변화</h3>
                        <EquityChart data={backtestResult.equityCurve} />
                        <div className="flex justify-between mt-4 text-sm">
                          <div><span className={currentColors.textSecondary}>시작: </span><span className={currentColors.text}>₩{backtestResult.summary.initialCapital.toLocaleString()}</span></div>
                          <div><span className={currentColors.textSecondary}>종료: </span><span className={parseFloat(backtestResult.summary.totalReturn) >= 0 ? 'text-[#00d395]' : 'text-[#ff6b6b]'}>₩{backtestResult.summary.finalCapital.toLocaleString()}</span></div>
                        </div>
                      </div>
                      <div className={`${currentColors.cardBg} rounded-2xl p-6 border ${currentColors.cardBorder}`}>
                        <h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>📊 상세 통계</h3>
                        <div className="space-y-3">
                          {[
                            { label: '총 거래', value: `${backtestResult.summary.totalTrades}회` },
                            { label: '승리', value: `${backtestResult.summary.wins}회`, color: 'text-[#00d395]' },
                            { label: '패배', value: `${backtestResult.summary.losses}회`, color: 'text-[#ff6b6b]' },
                            { label: '승률', value: `${backtestResult.summary.winRate}%`, color: 'text-[#00d395]' },
                            { label: '평균 수익', value: `+${backtestResult.summary.avgWin}%`, color: 'text-[#00d395]' },
                            { label: '평균 손실', value: `-${backtestResult.summary.avgLoss}%`, color: 'text-[#ff6b6b]' },
                            { label: '손익비', value: backtestResult.summary.profitFactor, color: 'text-yellow-400' },
                            { label: '최대 낙폭', value: `-${backtestResult.summary.maxDrawdown}%`, color: 'text-[#ff6b6b]' },
                          ].map((item, i) => (
                            <div key={i} className={`flex justify-between py-2 border-b ${theme === 'dark' ? 'border-white/10' : 'border-gray-100'}`}>
                              <span className={currentColors.textSecondary}>{item.label}</span>
                              <span className={`font-bold ${item.color || currentColors.text}`}>{item.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className={`${currentColors.cardBg} rounded-2xl p-6 border ${currentColors.cardBorder}`}>
                      <h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>📋 최근 거래 내역</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead><tr className={`border-b ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}><th className={`text-left p-3 ${currentColors.textSecondary}`}>진입일</th><th className={`text-left p-3 ${currentColors.textSecondary}`}>청산일</th><th className={`text-left p-3 ${currentColors.textSecondary}`}>점수</th><th className={`text-left p-3 ${currentColors.textSecondary}`}>진입가</th><th className={`text-left p-3 ${currentColors.textSecondary}`}>청산가</th><th className={`text-left p-3 ${currentColors.textSecondary}`}>수익률</th><th className={`text-left p-3 ${currentColors.textSecondary}`}>결과</th></tr></thead>
                          <tbody>
                            {backtestResult.trades.slice(-20).reverse().map((trade, i) => (
                              <tr key={i} className={`border-b ${theme === 'dark' ? 'border-white/5' : 'border-gray-100'}`}>
                                <td className={`p-3 ${currentColors.text}`}>{new Date(trade.entryTime).toLocaleDateString('ko-KR')}</td>
                                <td className={`p-3 ${currentColors.text}`}>{new Date(trade.exitTime).toLocaleDateString('ko-KR')}</td>
                                <td className={`p-3 ${currentColors.text}`}>{trade.score}/140</td>
                                <td className={`p-3 ${currentColors.text}`}>${trade.entryPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                                <td className={`p-3 ${currentColors.text}`}>${trade.exitPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                                <td className={`p-3 font-bold ${trade.result === 'win' ? 'text-[#00d395]' : 'text-[#ff6b6b]'}`}>{trade.pnlPercent >= 0 ? '+' : ''}{trade.pnlPercent.toFixed(2)}%</td>
                                <td className="p-3"><span className={`px-2 py-1 rounded text-xs font-bold ${trade.result === 'win' ? 'bg-[#00d395]/20 text-[#00d395]' : 'bg-[#ff6b6b]/20 text-[#ff6b6b]'}`}>{trade.result === 'win' ? '✅ 수익' : '❌ 손실'}</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'alerts' && alertSettings && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-2xl p-6"><h3 className={`text-lg font-bold mb-3 ${currentColors.text}`}>📢 알림 작동 방식</h3><div className={`space-y-2 ${currentColors.textSecondary} text-sm`}><p>✅ <strong className={currentColors.text}>대시보드 알림:</strong> 설정한 코인이 임계점 이상이면 상단 🔔에 알림</p><p>📱 <strong className={currentColors.text}>텔레그램:</strong> ID 입력 후 저장하면 5분마다 알림 전송</p></div></div>
            {savedAlertSettings && (<div className={`${currentColors.cardBg} rounded-2xl p-6 border ${currentColors.cardBorder}`}><div className="flex justify-between items-center mb-4"><h3 className={`text-lg font-bold ${currentColors.text}`}>💾 저장된 설정</h3><button type="button" onClick={deleteAlertSettings} className="px-4 py-2 bg-[#ff6b6b] text-white rounded-lg text-sm">🗑️ 삭제</button></div><div className="grid grid-cols-2 md:grid-cols-5 gap-4"><div className={`${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-4`}><p className={`text-sm ${currentColors.textSecondary}`}>코인</p><p className={`font-bold ${currentColors.text}`}>{savedAlertSettings.selected_coins.join(', ')}</p></div><div className={`${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-4`}><p className={`text-sm ${currentColors.textSecondary}`}>임계점</p><p className="font-bold text-[#00d395]">{savedAlertSettings.score_threshold}/140</p></div><div className={`${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-4`}><p className={`text-sm ${currentColors.textSecondary}`}>시간대</p><p className={`font-bold ${currentColors.text}`}>{[savedAlertSettings.time_morning && '아침', savedAlertSettings.time_afternoon && '오후', savedAlertSettings.time_evening && '저녁', savedAlertSettings.time_night && '심야'].filter(Boolean).join(', ') || '없음'}</p></div><div className={`${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-4`}><p className={`text-sm ${currentColors.textSecondary}`}>유형</p><p className={`font-bold ${currentColors.text}`}>{[savedAlertSettings.alert_signal && '시그널', savedAlertSettings.alert_score_change && '점수'].filter(Boolean).join(', ') || '없음'}</p></div><div className={`${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-4`}><p className={`text-sm ${currentColors.textSecondary}`}>텔레그램</p><p className={`font-bold ${savedAlertSettings.telegram_id ? 'text-[#00d395]' : currentColors.textSecondary}`}>{savedAlertSettings.telegram_id ? '✅ 연결됨' : '❌ 미연결'}</p></div></div></div>)}
            <div className={`${currentColors.cardBg} rounded-2xl p-6 border border-[#00d395]/50`}><h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>📱 텔레그램 알림</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div><div className={`${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-4 space-y-3 text-sm`}><div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'}`}><p className={`font-bold ${currentColors.text}`}>1. @userinfobot 검색 → 내 ID 확인</p></div><div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'}`}><p className={`font-bold ${currentColors.text}`}>2. 오른쪽에 ID 입력</p></div><div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-[#00d395]/10' : 'bg-green-50'} border border-[#00d395]/30`}><p className="font-bold text-[#00d395]">3. @crypto_navcp_bot 검색 → /start 클릭</p><p className="text-yellow-400 text-xs mt-1">⚠️ 필수!</p></div><div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'}`}><p className={`font-bold ${currentColors.text}`}>4. 설정 저장</p></div></div></div><div><label className={`block text-sm ${currentColors.textSecondary} mb-2`}>텔레그램 ID</label><input type="text" inputMode="numeric" placeholder="예: 1234567890" value={telegramId} onChange={(e) => setTelegramId(e.target.value)} className={`w-full p-4 rounded-xl border ${currentColors.cardBorder} ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'} text-lg`} />{telegramId && <div className="mt-3 p-3 bg-[#00d395]/10 border border-[#00d395]/30 rounded-lg"><p className="text-[#00d395] text-sm">✅ ID: {telegramId}</p></div>}</div></div></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className={`${currentColors.cardBg} rounded-2xl p-6 border ${currentColors.cardBorder}`}><h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>🪙 코인 선택</h3><input type="text" placeholder="코인 검색..." value={alertCoinSearch} onChange={(e) => { setAlertCoinSearch(e.target.value); searchAlertCoin(e.target.value) }} className={`w-full p-3 rounded-xl border ${currentColors.cardBorder} ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'} mb-3`} />{alertCoinSearch && alertSearchResults.length > 0 && <div className="flex flex-wrap gap-2 mb-3">{alertSearchResults.map(c => (<button key={c} type="button" onClick={() => { if (!alertSettings.selected_coins.includes(c)) setAlertSettings({ ...alertSettings, selected_coins: [...alertSettings.selected_coins, c] }); setAlertCoinSearch(''); setAlertSearchResults([]) }} className="px-3 py-1 rounded-full text-sm bg-[#00d395]/20 text-[#00d395]">+ {c}</button>))}</div>}<p className={`text-xs ${currentColors.textSecondary} mb-2`}>선택됨 ({alertSettings.selected_coins.length})</p><div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto">{alertSettings.selected_coins.map(c => (<button key={c} type="button" onClick={() => setAlertSettings({ ...alertSettings, selected_coins: alertSettings.selected_coins.filter(x => x !== c) })} className="px-4 py-2 rounded-full text-sm font-semibold bg-[#00d395] text-black">{c} ✕</button>))}</div></div><div className={`${currentColors.cardBg} rounded-2xl p-6 border ${currentColors.cardBorder}`}><h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>🎯 점수 임계값</h3><p className={`text-sm ${currentColors.textSecondary} mb-4`}>이 점수 이상이면 알림</p><div className="flex items-center gap-4 mb-4"><input type="range" min="50" max="130" value={sliderValue} onChange={handleSliderChange} className="flex-1 h-3 rounded-full appearance-none cursor-pointer" style={{ background: `linear-gradient(to right, #00d395 ${((sliderValue - 50) / 80) * 100}%, ${theme === 'dark' ? '#333' : '#ddd'} ${((sliderValue - 50) / 80) * 100}%)` }} /><span className="bg-[#00d395] text-black px-4 py-2 rounded-xl font-bold text-xl">{sliderValue}/140</span></div><div className="flex items-center gap-2"><span className={`text-sm ${currentColors.textSecondary}`}>직접 입력:</span><input type="text" inputMode="numeric" value={inputValue} onChange={handleInputChange} onBlur={handleInputBlur} className={`w-24 p-2 rounded-lg border ${currentColors.cardBorder} ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'} text-center`} /></div></div></div>
            <button type="button" onClick={saveAlertSettings} disabled={settingsSaving} className="w-full bg-[#00d395] text-black py-4 rounded-xl font-bold text-lg">{settingsSaving ? '저장 중...' : '💾 설정 저장'}</button>
          </div>
        )}

        {activeTab === 'portfolio' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">{(() => { const stats = calculatePortfolioStats(); return [{ label: '총 포지션', value: stats.total, icon: '📋' }, { label: '활성', value: stats.active, icon: '🟢', color: 'text-[#00d395]' }, { label: '승률', value: `${stats.winRate}%`, icon: '🎯', color: 'text-[#00d395]' }, { label: '실현 수익', value: `${stats.totalPnL}%`, icon: '💰', color: parseFloat(stats.totalPnL) >= 0 ? 'text-[#00d395]' : 'text-[#ff6b6b]' }, { label: '승/패', value: `${stats.wins}/${stats.losses}`, icon: '📊' }].map((s, i) => (<div key={i} className={`${currentColors.cardBg} rounded-xl p-4 border ${currentColors.cardBorder} text-center`}><div className="text-2xl mb-2">{s.icon}</div><div className={`text-2xl font-bold ${s.color || currentColors.text}`}>{s.value}</div><div className={`text-sm ${currentColors.textSecondary}`}>{s.label}</div></div>)) })()}</div>
            <div className={`${currentColors.cardBg} rounded-2xl p-6 border ${currentColors.cardBorder}`}><h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>➕ 새 포지션</h3><div className="grid grid-cols-2 md:grid-cols-6 gap-3"><div className="relative" ref={portfolioDropdownRef}><label className={`block text-sm ${currentColors.textSecondary} mb-1`}>코인</label><button type="button" onClick={() => { setShowPortfolioDropdown(!showPortfolioDropdown); setPortfolioSearchResults(allCoins.slice(0, 20)) }} className={`w-full p-3 rounded-xl border ${currentColors.cardBorder} ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'} text-left flex justify-between`}><span>{positionCoin}</span><span>▼</span></button>{showPortfolioDropdown && (<div className={`absolute z-50 w-64 mt-1 rounded-xl border ${currentColors.cardBorder} ${currentColors.cardBg} shadow-lg`}><div className="p-2"><input type="text" placeholder="검색..." value={portfolioCoinSearch} onChange={(e) => { setPortfolioCoinSearch(e.target.value); searchPortfolioCoin(e.target.value) }} className={`w-full p-2 rounded-lg border ${currentColors.cardBorder} ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'} text-sm`} autoFocus /></div><div className="max-h-48 overflow-y-auto">{portfolioSearchResults.map(c => (<button key={c} type="button" onClick={() => { setPositionCoin(c); setShowPortfolioDropdown(false); setPortfolioCoinSearch('') }} className={`w-full px-4 py-2 text-left hover:bg-[#00d395]/20 ${positionCoin === c ? 'bg-[#00d395]/10' : ''}`}>{c}</button>))}</div></div>)}</div><div><label className={`block text-sm ${currentColors.textSecondary} mb-1`}>방향</label><div className="flex gap-1"><button type="button" onClick={() => setPositionType('LONG')} className={`flex-1 p-3 rounded-l-xl font-bold ${positionType === 'LONG' ? 'bg-[#00d395] text-black' : theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'}`}>🟢</button><button type="button" onClick={() => setPositionType('SHORT')} className={`flex-1 p-3 rounded-r-xl font-bold ${positionType === 'SHORT' ? 'bg-[#ff6b6b] text-white' : theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'}`}>🔴</button></div></div><div><label className={`block text-sm ${currentColors.textSecondary} mb-1`}>진입가</label><input type="text" inputMode="decimal" placeholder="0.00" value={entryValue} onChange={(e) => setEntryValue(e.target.value)} className={`w-full p-3 rounded-xl border ${currentColors.cardBorder} ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`} /></div><div><label className={`block text-sm ${currentColors.textSecondary} mb-1`}>목표가</label><input type="text" inputMode="decimal" placeholder="0.00" value={targetValue} onChange={(e) => setTargetValue(e.target.value)} className={`w-full p-3 rounded-xl border ${currentColors.cardBorder} ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`} /></div><div><label className={`block text-sm ${currentColors.textSecondary} mb-1`}>손절가</label><input type="text" inputMode="decimal" placeholder="0.00" value={stopValue} onChange={(e) => setStopValue(e.target.value)} className={`w-full p-3 rounded-xl border ${currentColors.cardBorder} ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`} /></div><div className="flex items-end"><button type="button" onClick={addPosition} className="w-full bg-[#00d395] text-black p-3 rounded-xl font-bold">추가</button></div></div></div>
            <div className={`${currentColors.cardBg} rounded-2xl p-6 border ${currentColors.cardBorder}`}><h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>📋 포지션 목록</h3><div className="overflow-x-auto"><table className="w-full"><thead><tr className={`border-b ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}>{['코인', '방향', '진입가', '목표가', '손절가', '상태', ''].map(h => <th key={h} className={`text-left p-3 text-sm ${currentColors.textSecondary}`}>{h}</th>)}</tr></thead><tbody>{portfolioPositions.length === 0 ? <tr><td colSpan={7} className={`text-center p-8 ${currentColors.textSecondary}`}>포지션 없음</td></tr> : portfolioPositions.map(p => (<tr key={p.id} className={`border-b ${theme === 'dark' ? 'border-white/5' : 'border-gray-100'}`}><td className={`p-3 font-bold ${currentColors.text}`}>{p.coin_symbol}</td><td className="p-3"><span className={`px-3 py-1 rounded-full text-xs font-bold ${p.position_type === 'LONG' ? 'bg-[#00d395]/20 text-[#00d395]' : 'bg-[#ff6b6b]/20 text-[#ff6b6b]'}`}>{p.position_type}</span></td><td className={`p-3 ${currentColors.text}`}>${p.entry_price.toLocaleString()}</td><td className="p-3 text-blue-400">${p.target_price.toLocaleString()}</td><td className="p-3 text-[#ff6b6b]">${p.stop_loss.toLocaleString()}</td><td className="p-3"><span className={`px-3 py-1 rounded-full text-xs ${p.status === 'active' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/10 text-white/50'}`}>{p.status === 'active' ? '활성' : '종료'}</span></td><td className="p-3"><button type="button" onClick={() => deletePosition(p)} className="px-3 py-1 bg-[#ff6b6b] text-white rounded-lg text-sm">삭제</button></td></tr>))}</tbody></table></div></div>
          </div>
        )}

        {activeTab === 'report' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-[#00d395] to-[#00b383] rounded-2xl p-6 text-white"><h3 className="text-lg font-bold mb-4">📊 트레이딩 성과</h3><div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">{(() => { const stats = calculatePortfolioStats(); return [{ label: '총 포지션', value: stats.total }, { label: '활성', value: stats.active }, { label: '승률', value: `${stats.winRate}%` }, { label: '수익', value: `${parseFloat(stats.totalPnL) >= 0 ? '+' : ''}${stats.totalPnL}%` }].map((i, idx) => (<div key={idx}><div className="text-3xl font-bold">{i.value}</div><div className="text-sm opacity-80">{i.label}</div></div>)) })()}</div></div>
            <div className={`${currentColors.cardBg} rounded-2xl p-6 border ${currentColors.cardBorder}`}><h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>📥 PDF 다운로드</h3><p className={`${currentColors.textSecondary} text-sm mb-4`}>전체 포지션 기록 PDF</p><button type="button" onClick={downloadPDF} className="w-full bg-[#00d395] text-black py-4 rounded-xl font-bold text-lg">📄 PDF 생성</button></div>
          </div>
        )}
      </div>

      {showDetail && selectedCoin && (<div className={`fixed inset-0 z-50 ${currentColors.bg} overflow-y-auto`}><div className={`sticky top-0 ${currentColors.bg} border-b z-10`}><div className="flex justify-between items-center p-4"><div className="flex items-center gap-3"><h2 className={`text-xl font-bold ${currentColors.text}`}>{selectedCoin.symbol.toUpperCase()}</h2><SignalBadge signal={selectedCoin.signal} /></div><button type="button" onClick={() => setShowDetail(false)} className={`${theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'} px-4 py-2 rounded-lg font-semibold`}>✕ 닫기</button></div></div><div className="max-w-2xl mx-auto p-4 pb-20"><div className={`${currentColors.cardBg} rounded-2xl p-6 mb-4 border ${currentColors.cardBorder}`}><p className={currentColors.textSecondary}>{selectedCoin.name}</p><p className="text-4xl font-bold text-[#00d395] mb-2">{formatPrice(selectedCoin.current_price)}</p><p className={selectedCoin.price_change_percentage_24h >= 0 ? 'text-[#00d395]' : 'text-[#ff6b6b]'}>{selectedCoin.price_change_percentage_24h >= 0 ? '▲' : '▼'} {Math.abs(selectedCoin.price_change_percentage_24h || 0).toFixed(2)}%</p></div><div className={`${currentColors.cardBg} rounded-2xl p-6 mb-4 border ${currentColors.cardBorder}`}><h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>📊 체크리스트 <span className="text-[#00d395]">{selectedCoin.scores.total}/140</span></h3>{profile?.plan !== 'free' ? (<div className="space-y-3"><ScoreBar label="거시환경" score={selectedCoin.scores.macro} max={20} color="bg-blue-500" /><ScoreBar label="ETF/제도권" score={selectedCoin.scores.etf} max={25} color="bg-purple-500" /><ScoreBar label="온체인" score={selectedCoin.scores.onchain} max={25} color="bg-green-500" /><ScoreBar label="AI/메타버스" score={selectedCoin.scores.ai} max={20} color="bg-pink-500" /><ScoreBar label="선물시장" score={selectedCoin.scores.futures} max={20} color="bg-orange-500" /><ScoreBar label="기술적 분석" score={selectedCoin.scores.technical} max={20} color="bg-cyan-500" /><ScoreBar label="전략" score={selectedCoin.scores.strategy} max={10} color="bg-yellow-500" /></div>) : (<div className={`${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-6 text-center`}><p className={currentColors.textSecondary}>🔒 PRO 전용</p><Link href="/pricing" className="bg-[#00d395] text-black px-6 py-2 rounded-xl font-semibold inline-block mt-2">업그레이드</Link></div>)}</div>{profile?.plan !== 'free' && (<><div className={`${currentColors.cardBg} rounded-2xl p-6 mb-4 border ${currentColors.cardBorder}`}><h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>💰 매매 전략</h3><div className="grid grid-cols-2 gap-3"><div className="bg-[#00d395]/10 border border-[#00d395]/30 rounded-xl p-4"><p className={currentColors.textSecondary + ' text-sm'}>진입가</p><p className="text-[#00d395] text-xl font-bold">{formatPrice(selectedCoin.entry_price)}</p></div><div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4"><p className={currentColors.textSecondary + ' text-sm'}>목표가</p><p className="text-blue-400 text-xl font-bold">{formatPrice(selectedCoin.target_price)}</p></div><div className="bg-[#ff6b6b]/10 border border-[#ff6b6b]/30 rounded-xl p-4"><p className={currentColors.textSecondary + ' text-sm'}>손절가</p><p className="text-[#ff6b6b] text-xl font-bold">{formatPrice(selectedCoin.stop_loss)}</p></div><div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4"><p className={currentColors.textSecondary + ' text-sm'}>손익비</p><p className="text-yellow-400 text-xl font-bold">{selectedCoin.risk_reward}</p></div></div></div><div className={`${currentColors.cardBg} rounded-2xl p-6 mb-4 border ${currentColors.cardBorder}`}><h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>🤖 AI 코멘트</h3><div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-xl p-4"><p className={theme === 'dark' ? 'text-white/90' : 'text-gray-700'}>{selectedCoin.ai_comment}</p></div></div></>)}<button type="button" onClick={() => setShowDetail(false)} className={`w-full py-4 ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'} rounded-xl font-semibold`}>닫기</button></div></div>)}

      <style jsx global>{`input[type="range"]::-webkit-slider-thumb{-webkit-appearance:none;width:24px;height:24px;border-radius:50%;background:#00d395;cursor:grab;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)}input[type="range"]::-moz-range-thumb{width:24px;height:24px;border-radius:50%;background:#00d395;cursor:grab;border:3px solid white}select{color:inherit}`}</style>
    </div>
  )
}
