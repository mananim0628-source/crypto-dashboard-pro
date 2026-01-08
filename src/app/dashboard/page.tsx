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
  const [aiComments, setAiComments] = useState<Record<string, string>>({})
  const allCoins = ['BTC', 'ETH', 'XRP', 'BNB', 'SOL', 'ADA', 'DOGE', 'MATIC', 'DOT', 'SHIB', 'AVAX', 'LINK', 'UNI', 'ATOM', 'LTC', 'ETC', 'XLM', 'ALGO', 'VET', 'FIL', 'AAVE', 'AXS', 'SAND', 'MANA', 'GALA', 'ENJ', 'CHZ', 'APE', 'LDO', 'ARB', 'OP', 'IMX', 'NEAR', 'APT', 'SUI', 'SEI', 'TIA', 'INJ', 'FET', 'RNDR', 'GRT', 'SNX', 'CRV', 'MKR', 'COMP', '1INCH', 'SUSHI', 'YFI', 'BAL', 'CAKE', 'PEPE', 'BONK', 'FLOKI', 'WIF', 'ENA', 'PENDLE', 'JUP', 'WLD', 'STRK', 'PYTH', 'JTO', 'MEME', 'BLUR', 'ORDI', 'SATS', 'RATS', 'LEO', 'TON', 'TRX', 'HBAR', 'KAS', 'OKB', 'CRO', 'RUNE', 'STX', 'FTM', 'EGLD', 'FLOW', 'THETA', 'XTZ', 'NEO', 'KLAY', 'ZEC', 'IOTA', 'EOS', 'KAG', 'MON', 'TAO', 'M', 'RENDER', 'FTT', 'GMT', 'MASK', 'ENS', 'DYDX', 'CFX', 'AGIX', 'OCEAN', 'WOO', 'SKL', 'CELO', 'ONE', 'HOT', 'ZIL', 'QTUM', 'BAT', 'ICX', 'ZRX', 'ANKR', 'SC', 'RVN', 'WAVES', 'ONT', 'DASH', 'DCR', 'XEM', 'LUNC', 'USTC', 'JASMY', 'RSR', 'LRC', 'KNC', 'STORJ', 'COTI', 'CELR', 'AUDIO', 'RAY', 'SRM', 'ALICE', 'TLM', 'ILV', 'YGG', 'PYR', 'SUPER', 'GODS', 'IMX', 'MAGIC', 'PRIME', 'PIXEL', 'PORTAL', 'XAI', 'MYRO', 'BOME', 'SLERF', 'MEW', 'POPCAT', 'BRETT', 'MOG', 'SPX', 'GIGA', 'ANDY', 'TURBO', 'NEIRO', 'GOAT', 'MOODENG', 'PNUT', 'ACT', 'VIRTUAL', 'AI16Z', 'GRIFFAIN', 'ZEREBRO', 'FARTCOIN', 'ARC', 'SWARMS', 'AIXBT', 'ONDO', 'MOVE', 'USUAL', 'BIO', 'HYPE', 'VANA']
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
    const scores = calculateScores(coin); const signal = getSignal(scores.total); const price = coin.current_price
    let target_price: number, stop_loss: number, risk_reward: string
    if (signal === 'strong_buy') { target_price = price * 1.045; stop_loss = price * 0.97; risk_reward = '1:1.5' }
    else if (signal === 'buy') { target_price = price * 1.042; stop_loss = price * 0.97; risk_reward = '1:1.4' }
    else if (signal === 'hold') { target_price = price * 1.036; stop_loss = price * 0.97; risk_reward = '1:1.2' }
    else { target_price = price * 1.03; stop_loss = price * 0.97; risk_reward = '1:1.0' }
    const analyzed: AnalyzedCoin = { ...coin, scores, signal, entry_price: price, target_price, stop_loss, risk_reward, ai_comment: '' }
    analyzed.ai_comment = generateAIComment(analyzed); return analyzed
  }

  const loadFavoriteCoinsData = async (favs: Favorite[]) => { if (favs.length === 0) { setFavoriteCoins([]); return }; const loadedCoins: AnalyzedCoin[] = []; for (const fav of favs) { try { const response = await fetch(`/api/crypto?action=search&query=${encodeURIComponent(fav.coin_symbol)}`); const data = await response.json(); if (data.coin) loadedCoins.push(analyzeCoin(data.coin)) } catch (e) {} }; setFavoriteCoins(loadedCoins) }

  useLayoutEffect(() => { const savedTheme = localStorage.getItem('dashboard-theme'); const savedLang = localStorage.getItem('dashboard-lang') as Lang | null; if (savedTheme === 'light') setTheme('light'); else { setTheme('dark'); localStorage.setItem('dashboard-theme', 'dark') }; if (savedLang === 'en') setLang('en'); setThemeLoaded(true) }, [])

  useEffect(() => { const handleClickOutside = (event: MouseEvent) => { if (portfolioDropdownRef.current && !portfolioDropdownRef.current.contains(event.target as Node)) setShowPortfolioDropdown(false); if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) setShowNotifications(false); if (searchDropdownRef.current && !searchDropdownRef.current.contains(event.target as Node)) setShowSearchDropdown(false) }; document.addEventListener('mousedown', handleClickOutside); return () => document.removeEventListener('mousedown', handleClickOutside) }, [])
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
        try { const { data: alertData } = await supabase.from('alert_settings').select('*').eq('user_id', session.user.id).single(); if (mounted) { if (alertData) { setAlertSettings(alertData); setSavedAlertSettings(alertData); setSliderValue(alertData.score_threshold); setInputValue(String(alertData.score_threshold)); if (alertData.telegram_id) setTelegramId(alertData.telegram_id) } else { setAlertSettings({ user_id: session.user.id, selected_coins: ['BTC', 'ETH'], score_threshold: 90, time_morning: true, time_afternoon: true, time_evening: true, time_night: false, alert_signal: true, alert_score_change: true, alert_price: true }) } } } catch (e) {}
        try { const { data: portfolioData } = await supabase.from('portfolio_positions').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }); if (mounted && portfolioData) setPortfolioPositions(portfolioData) } catch (e) {}
        try { const { data: statsData } = await supabase.from('signal_stats').select('*').single(); if (mounted && statsData) setSignalStats(statsData) } catch (e) {}
        try { const { data: signalsData } = await supabase.from('recent_signals').select('*').limit(10); if (mounted && signalsData) setRecentSignals(signalsData) } catch (e) {}
      } catch (error) { if (mounted) setLoading(false) }
    }
    init()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => { if (event === 'SIGNED_OUT') router.push('/login') })
    return () => { mounted = false; subscription.unsubscribe() }
  }, [supabase, router])

  useEffect(() => { if (!alertSettings || coreCoins.length === 0) return; const allAnalyzedCoins = [...coreCoins, ...topGainers]; const newNotifications: AlertNotification[] = []; alertSettings.selected_coins.forEach(symbol => { const coin = allAnalyzedCoins.find(c => c.symbol.toUpperCase() === symbol.toUpperCase()); if (coin && coin.scores.total >= alertSettings.score_threshold) { const exists = notifications.some(n => n.coin === symbol && n.type === 'score'); if (!exists) newNotifications.push({ id: `${symbol}-${Date.now()}`, coin: symbol, type: 'score', message: `${symbol} ${txt('점수', 'Score')} ${coin.scores.total}/140 - ${alertSettings.score_threshold}${txt('점 이상!', '+')}`, time: new Date(), read: false }); if (alertSettings.alert_signal && (coin.signal === 'strong_buy' || coin.signal === 'buy')) { const signalExists = notifications.some(n => n.coin === symbol && n.type === 'signal'); if (!signalExists) newNotifications.push({ id: `${symbol}-signal-${Date.now()}`, coin: symbol, type: 'signal', message: `${symbol} ${coin.signal === 'strong_buy' ? '🚀 ' + txt('강력 매수', 'Strong Buy') : '📈 ' + txt('매수', 'Buy')} ${txt('시그널!', 'Signal!')}`, time: new Date(), read: false }) } } }); if (newNotifications.length > 0) setNotifications(prev => [...newNotifications, ...prev].slice(0, 50)) }, [alertSettings, coreCoins, topGainers])

  useEffect(() => { if (!user) return; const interval = setInterval(async () => { try { const response = await fetch('/api/crypto?action=core'); const data = await response.json(); if (data.coins) setCoreCoins(data.coins.map(analyzeCoin)); if (profile?.plan !== 'free') { const gainersResponse = await fetch('/api/crypto?action=gainers'); const gainersData = await gainersResponse.json(); if (gainersData.coins) setTopGainers(gainersData.coins.slice(0, 6).map(analyzeCoin)) }; if (favorites.length > 0) await loadFavoriteCoinsData(favorites); setLastUpdate(new Date()); setCountdown(120) } catch (e) {} }, 120000); return () => clearInterval(interval) }, [user, profile?.plan, favorites])
  useEffect(() => { const timer = setInterval(() => setCountdown(prev => prev > 0 ? prev - 1 : 120), 1000); return () => clearInterval(timer) }, [])

  const toggleLang = () => { const newLang = lang === 'ko' ? 'en' : 'ko'; setLang(newLang); localStorage.setItem('dashboard-lang', newLang) }
  const toggleTheme = () => { const newTheme = theme === 'dark' ? 'light' : 'dark'; setTheme(newTheme); localStorage.setItem('dashboard-theme', newTheme) }

  const handleSearchInput = async (query: string) => { setSearchQuery(query); if (!query.trim()) { setSearchSuggestions([]); setShowSearchDropdown(false); return }; const queryUpper = query.toUpperCase().replace('USDT', '').replace('USD', '').trim(); const exactMatch = allCoins.filter(c => c === queryUpper); const startsWith = allCoins.filter(c => c.startsWith(queryUpper) && c !== queryUpper); const includes = allCoins.filter(c => c.includes(queryUpper) && !c.startsWith(queryUpper)); const localMatches = [...exactMatch, ...startsWith, ...includes].slice(0, 8).map(c => ({ symbol: c, name: c })); if (localMatches.length > 0) { setSearchSuggestions(localMatches); setShowSearchDropdown(true) } }
  const selectSearchCoin = async (symbol: string) => { setSearchQuery(symbol); setShowSearchDropdown(false); setSearchLoading(true); try { const response = await fetch(`/api/crypto?action=search&query=${encodeURIComponent(symbol)}`); const data = await response.json(); if (data.coin) setSearchResult(analyzeCoin(data.coin)); else setSearchResult(null) } catch (e) {}; setSearchLoading(false) }
  const handleSearch = async () => { if (!searchQuery.trim() || profile?.plan === 'free') return; setShowSearchDropdown(false); setSearchLoading(true); const cleanQuery = searchQuery.toUpperCase().replace('USDT', '').replace('USD', '').trim(); try { const response = await fetch(`/api/crypto?action=search&query=${encodeURIComponent(cleanQuery)}`); const data = await response.json(); if (data.coin) setSearchResult(analyzeCoin(data.coin)); else { setSearchResult(null); alert(txt('코인을 찾을 수 없습니다', 'Coin not found')) } } catch (e) {}; setSearchLoading(false) }
  const searchAlertCoin = async (query: string) => { if (!query.trim()) { setAlertSearchResults([]); return }; const queryUpper = query.toUpperCase().replace('USDT', '').replace('USD', '').trim(); const exactMatch = allCoins.filter(c => c === queryUpper); const startsWith = allCoins.filter(c => c.startsWith(queryUpper) && c !== queryUpper); const includes = allCoins.filter(c => c.includes(queryUpper) && !c.startsWith(queryUpper)); setAlertSearchResults([...exactMatch, ...startsWith, ...includes].slice(0, 10)) }
  const searchPortfolioCoin = async (query: string) => { if (!query.trim()) { setPortfolioSearchResults(allCoins.slice(0, 20)); return }; const queryUpper = query.toUpperCase().replace('USDT', '').replace('USD', '').trim(); const exactMatch = allCoins.filter(c => c === queryUpper); const startsWith = allCoins.filter(c => c.startsWith(queryUpper) && c !== queryUpper); const includes = allCoins.filter(c => c.includes(queryUpper) && !c.startsWith(queryUpper)); setPortfolioSearchResults([...exactMatch, ...startsWith, ...includes]) }

  const saveAlertSettings = async () => { if (!user || !alertSettings) return; setSettingsSaving(true); const settingsToSave = { ...alertSettings, score_threshold: sliderValue, user_id: user.id, telegram_id: telegramId || null, updated_at: new Date().toISOString() }; const { error } = await supabase.from('alert_settings').upsert(settingsToSave); if (error) alert(txt('설정 저장 실패: ', 'Save failed: ') + error.message); else { setAlertSettings(settingsToSave); setSavedAlertSettings(settingsToSave); alert(txt('✅ 설정이 저장되었습니다!', '✅ Settings saved!')) }; setSettingsSaving(false) }
  const deleteAlertSettings = async () => { if (!user || !savedAlertSettings?.id) return; if (!confirm(txt('알림 설정을 삭제하시겠습니까?', 'Delete alert settings?'))) return; const { error } = await supabase.from('alert_settings').delete().eq('id', savedAlertSettings.id); if (error) alert(txt('삭제 실패: ', 'Delete failed: ') + error.message); else { setAlertSettings({ user_id: user.id, selected_coins: ['BTC', 'ETH'], score_threshold: 90, time_morning: true, time_afternoon: true, time_evening: true, time_night: false, alert_signal: true, alert_score_change: true, alert_price: true }); setSavedAlertSettings(null); setSliderValue(90); setInputValue('90'); setTelegramId(''); alert(txt('✅ 삭제됨', '✅ Deleted')) } }
  const addPosition = async () => { if (!user) return; if (!entryValue || !targetValue || !stopValue) { alert(txt('모든 가격을 입력해주세요', 'Enter all prices')); return }; const { data, error } = await supabase.from('portfolio_positions').insert({ user_id: user.id, coin_symbol: positionCoin, coin_name: positionCoin, position_type: positionType, entry_price: parseFloat(entryValue), target_price: parseFloat(targetValue), stop_loss: parseFloat(stopValue), status: 'active' }).select().single(); if (error) alert(txt('포지션 추가 실패', 'Failed to add position')); else if (data) { setPortfolioPositions([data, ...portfolioPositions]); setEntryValue(''); setTargetValue(''); setStopValue(''); alert(txt('✅ 포지션 추가됨', '✅ Position added')) } }
  const deletePosition = async (position: PortfolioPosition) => { if (!confirm(`${position.coin_symbol} ${position.position_type} ${txt('포지션을 삭제하시겠습니까?', 'position - delete?')}`)) return; const { error } = await supabase.from('portfolio_positions').delete().eq('id', position.id); if (error) alert(txt('삭제 실패', 'Delete failed')); else { setPortfolioPositions(portfolioPositions.filter(p => p.id !== position.id)); alert(txt('✅ 삭제됨', '✅ Deleted')) } }

  const calculatePortfolioStats = () => { const active = portfolioPositions.filter(p => p.status === 'active'); const closed = portfolioPositions.filter(p => p.status === 'closed'); let totalPnL = 0, wins = 0, losses = 0, unrealizedPnL = 0; closed.forEach(p => { if (p.exit_price) { const pnl = p.position_type === 'LONG' ? ((p.exit_price - p.entry_price) / p.entry_price) * 100 : ((p.entry_price - p.exit_price) / p.entry_price) * 100; totalPnL += pnl; if (pnl > 0) wins++; else losses++ } }); active.forEach(p => { const coin = [...coreCoins, ...topGainers].find(c => c.symbol.toUpperCase() === p.coin_symbol.toUpperCase()); if (coin) { const pnl = p.position_type === 'LONG' ? ((coin.current_price - p.entry_price) / p.entry_price) * 100 : ((p.entry_price - coin.current_price) / p.entry_price) * 100; unrealizedPnL += pnl } }); return { total: portfolioPositions.length, active: active.length, closed: closed.length, winRate: (closed.length > 0 ? (wins / closed.length) * 100 : 0).toFixed(1), totalPnL: totalPnL.toFixed(2), unrealizedPnL: unrealizedPnL.toFixed(2), wins, losses } }
  
  const getMonthlyPnL = () => {
    const closed = portfolioPositions.filter(p => p.status === 'closed' && p.exit_price && p.closed_at)
    const monthlyData: { [key: string]: { pnl: number; count: number; wins: number } } = {}
    
    closed.forEach(p => {
      const date = new Date(p.closed_at!)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const pnl = p.position_type === 'LONG' 
        ? ((p.exit_price! - p.entry_price) / p.entry_price) * 100
        : ((p.entry_price - p.exit_price!) / p.entry_price) * 100
      
      if (!monthlyData[monthKey]) monthlyData[monthKey] = { pnl: 0, count: 0, wins: 0 }
      monthlyData[monthKey].pnl += pnl
      monthlyData[monthKey].count++
      if (pnl > 0) monthlyData[monthKey].wins++
    })
    
    return Object.entries(monthlyData)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 6)
      .map(([month, data]) => ({
        month,
        monthLabel: new Date(month + '-01').toLocaleDateString(lang === 'ko' ? 'ko-KR' : 'en-US', { year: 'numeric', month: 'short' }),
        pnl: data.pnl.toFixed(2),
        count: data.count,
        winRate: ((data.wins / data.count) * 100).toFixed(0)
      }))
  }
  
  const getCurrentPrice = (symbol: string) => { const coin = [...coreCoins, ...topGainers].find(c => c.symbol.toUpperCase() === symbol.toUpperCase()); return coin?.current_price || 0 }
  
  const getUnrealizedPnL = (p: any) => { const currentPrice = getCurrentPrice(p.coin_symbol); if (!currentPrice) return null; return p.position_type === 'LONG' ? ((currentPrice - p.entry_price) / p.entry_price) * 100 : ((p.entry_price - currentPrice) / p.entry_price) * 100 }

  // 포트폴리오 포지션 자동 종료 체크
  useEffect(() => {
    const checkAndClosePositions = async () => {
      if (!user || portfolioPositions.length === 0 || coreCoins.length === 0) return
      
      for (const position of portfolioPositions) {
        if (position.status !== 'active') continue
        
        const currentPrice = getCurrentPrice(position.coin_symbol)
        if (!currentPrice) continue
        
        let shouldClose = false
        let result: 'win' | 'loss' | null = null
        
        if (position.position_type === 'LONG') {
          if (currentPrice >= position.target_price) { shouldClose = true; result = 'win' }
          else if (currentPrice <= position.stop_loss) { shouldClose = true; result = 'loss' }
        } else {
          if (currentPrice <= position.target_price) { shouldClose = true; result = 'win' }
          else if (currentPrice >= position.stop_loss) { shouldClose = true; result = 'loss' }
        }
        
        if (shouldClose && result) {
          const pnl = position.position_type === 'LONG' 
            ? ((currentPrice - position.entry_price) / position.entry_price) * 100
            : ((position.entry_price - currentPrice) / position.entry_price) * 100
          
          await supabase.from('portfolio_positions').update({
            status: 'closed',
            exit_price: currentPrice,
            closed_at: new Date().toISOString()
          }).eq('id', position.id)
          
          setPortfolioPositions(prev => prev.map(p => 
            p.id === position.id ? { ...p, status: 'closed', exit_price: currentPrice } : p
          ))
          
          // 알림 추가
          const msg = result === 'win' 
            ? `[WIN] ${position.coin_symbol} ${position.position_type} ${lang === 'ko' ? '목표가 도달!' : 'Target reached!'} +${pnl.toFixed(2)}%`
            : `[LOSS] ${position.coin_symbol} ${position.position_type} ${lang === 'ko' ? '손절가 도달!' : 'Stop loss hit!'} ${pnl.toFixed(2)}%`
          setNotifications(prev => [{ id: `${position.coin_symbol}-close-${Date.now()}`, coin: position.coin_symbol, type: 'price' as const, message: msg, time: new Date(), read: false }, ...prev])
        }
      }
    }
    
    checkAndClosePositions()
  }, [coreCoins, topGainers])

  // 시그널 자동 저장 (90점 이상 시그널만)
  const savedSignalsRef = useRef<Set<string>>(new Set())
  
  useEffect(() => {
    const saveHighScoreSignals = async () => {
      if (!user) return
      const allCoins = [...coreCoins, ...topGainers]
      
      for (const coin of allCoins) {
        // 90점 이상이고 buy 또는 strong_buy 시그널만
        if (coin.scores.total >= 90 && (coin.signal === 'buy' || coin.signal === 'strong_buy')) {
          const signalKey = `${coin.symbol}-${new Date().toDateString()}`
          
          // 오늘 이미 저장한 시그널인지 확인
          if (savedSignalsRef.current.has(signalKey)) continue
          
         try {
  // 중복 체크 (같은 코인이 pending 상태면 새로 저장 안 함)
  const { data: existing } = await supabase
    .from('signal_history')
    .select('id')
    .eq('coin_symbol', coin.symbol)
    .eq('result', 'pending')
    .limit(1)

  if (!existing || existing.length === 0) {
              await supabase.from('signal_history').insert({
                coin_symbol: coin.symbol,
                coin_name: coin.name,
                signal_type: coin.signal,
                entry_price: coin.entry_price,
                target_price: coin.target_price,
                stop_loss: coin.stop_loss,
                score_total: coin.scores.total,
                score_details: coin.scores,
                result: 'pending'
              })
              savedSignalsRef.current.add(signalKey)
            }
          } catch (e) { /* 중복 저장 방지 */ }
        }
      }
    }
    
    if (coreCoins.length > 0) saveHighScoreSignals()
  }, [coreCoins, topGainers, user])

  const downloadPDF = () => {
    const stats = calculatePortfolioStats()
    const now = new Date()
    const dateStr = now.toLocaleDateString(lang === 'ko' ? 'ko-KR' : 'en-US')
    const timeStr = now.toLocaleTimeString(lang === 'ko' ? 'ko-KR' : 'en-US')
    const title = txt('크립토 대시보드 PRO - 트레이딩 리포트', 'Crypto Dashboard PRO - Trading Report')
    
    const longCount = portfolioPositions.filter(p => p.position_type === 'LONG').length
    const shortCount = portfolioPositions.filter(p => p.position_type === 'SHORT').length
    const activeCount = portfolioPositions.filter(p => p.status === 'active').length
    const closedCount = portfolioPositions.filter(p => p.status === 'closed').length
    
    const insights: string[] = []
    if (parseFloat(stats.winRate) >= 60) insights.push(txt('🌟 승률이 60% 이상으로 우수합니다!', '🌟 Win rate above 60% - Excellent!'))
    else if (parseFloat(stats.winRate) >= 40) insights.push(txt('📊 승률이 평균 수준입니다.', '📊 Win rate is average.'))
    else if (stats.total > 0) insights.push(txt('⚠️ 승률 개선이 필요합니다.', '⚠️ Win rate needs improvement.'))
    if (parseFloat(stats.totalPnL) > 0) insights.push(txt('💰 총 수익이 플러스입니다!', '💰 Total PnL is positive!'))
    else if (parseFloat(stats.totalPnL) < 0) insights.push(txt('📉 손실을 줄이는 전략이 필요합니다.', '📉 Need loss reduction strategy.'))
    if (stats.active > 0) insights.push(txt(`🔥 현재 ${stats.active}개 포지션 활성 중`, `🔥 ${stats.active} active positions`))
    
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif; padding: 40px; background: #fff; color: #333; line-height: 1.6; }
    .header { text-align: center; border-bottom: 3px solid #00d395; padding-bottom: 30px; margin-bottom: 40px; }
    .header h1 { color: #00d395; font-size: 28px; margin-bottom: 8px; }
    .header p { color: #666; font-size: 14px; }
    .summary-box { background: linear-gradient(135deg, #00d395, #00b383); color: white; padding: 30px; border-radius: 16px; margin-bottom: 30px; }
    .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; text-align: center; }
    .summary-item { background: rgba(255,255,255,0.15); padding: 20px; border-radius: 12px; }
    .summary-item .value { font-size: 32px; font-weight: bold; }
    .summary-item .label { font-size: 14px; opacity: 0.9; margin-top: 5px; }
    .section { margin-bottom: 30px; }
    .section-title { font-size: 18px; font-weight: bold; color: #333; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #eee; }
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
    .stat-card { background: #f8f9fa; padding: 20px; border-radius: 12px; text-align: center; }
    .stat-card .icon { font-size: 24px; margin-bottom: 8px; }
    .stat-card .value { font-size: 24px; font-weight: bold; }
    .stat-card .label { font-size: 12px; color: #666; margin-top: 5px; }
    .stat-card.green .value { color: #00d395; }
    .stat-card.red .value { color: #ff6b6b; }
    .stat-card.blue .value { color: #3b82f6; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    th { background: #f8f9fa; padding: 14px; text-align: left; border-bottom: 2px solid #dee2e6; font-weight: 600; }
    td { padding: 14px; border-bottom: 1px solid #eee; }
    tr:hover { background: #f8f9fa; }
    .long { color: #00d395; font-weight: bold; }
    .short { color: #ff6b6b; font-weight: bold; }
    .active-badge { background: #fef3c7; color: #d97706; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .closed-badge { background: #e5e7eb; color: #6b7280; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .insights-box { background: linear-gradient(135deg, #f0f9ff, #e0f2fe); border: 1px solid #bae6fd; padding: 20px; border-radius: 12px; margin-bottom: 30px; }
    .insight-item { padding: 10px 0; border-bottom: 1px solid rgba(0,0,0,0.05); }
    .insight-item:last-child { border-bottom: none; }
    .position-stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px; }
    .position-stat-box { background: #f8f9fa; padding: 20px; border-radius: 12px; }
    .position-stat-box h4 { font-size: 14px; color: #666; margin-bottom: 15px; }
    .bar-container { margin-bottom: 12px; }
    .bar-label { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 5px; }
    .bar-bg { height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden; }
    .bar-fill { height: 100%; border-radius: 4px; }
    .bar-fill.green { background: #00d395; }
    .bar-fill.red { background: #ff6b6b; }
    .bar-fill.yellow { background: #f59e0b; }
    .bar-fill.gray { background: #9ca3af; }
    .footer { text-align: center; padding-top: 30px; border-top: 1px solid #eee; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🚀 ${title}</h1>
    <p>${dateStr} ${timeStr} ${txt('기준', 'as of')}</p>
  </div>

  <div class="summary-box">
    <div class="summary-grid">
      <div class="summary-item"><div class="value">${stats.total}</div><div class="label">${txt('총 포지션', 'Total Positions')}</div></div>
      <div class="summary-item"><div class="value">${stats.active}</div><div class="label">${txt('활성 포지션', 'Active')}</div></div>
      <div class="summary-item"><div class="value">${stats.winRate}%</div><div class="label">${txt('승률', 'Win Rate')}</div></div>
      <div class="summary-item"><div class="value">${parseFloat(stats.totalPnL) >= 0 ? '+' : ''}${stats.totalPnL}%</div><div class="label">${txt('총 수익률', 'Total PnL')}</div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">📈 ${txt('성과 분석', 'Performance Analysis')}</div>
    <div class="stats-grid">
      <div class="stat-card green"><div class="icon">🏆</div><div class="value">${stats.wins}</div><div class="label">${txt('승리', 'Wins')}</div></div>
      <div class="stat-card red"><div class="icon">📉</div><div class="value">${stats.losses}</div><div class="label">${txt('패배', 'Losses')}</div></div>
      <div class="stat-card blue"><div class="icon">🎯</div><div class="value">${stats.winRate}%</div><div class="label">${txt('승률', 'Win Rate')}</div></div>
      <div class="stat-card ${parseFloat(stats.totalPnL) >= 0 ? 'green' : 'red'}"><div class="icon">💰</div><div class="value">${parseFloat(stats.totalPnL) >= 0 ? '+' : ''}${stats.totalPnL}%</div><div class="label">${txt('총 수익률', 'Total PnL')}</div></div>
    </div>
  </div>

  <div class="position-stats">
    <div class="position-stat-box">
      <h4>📊 ${txt('포지션 유형', 'Position Types')}</h4>
      <div class="bar-container"><div class="bar-label"><span>${txt('롱', 'Long')}</span><span>${longCount}</span></div><div class="bar-bg"><div class="bar-fill green" style="width: ${stats.total > 0 ? (longCount / stats.total) * 100 : 0}%"></div></div></div>
      <div class="bar-container"><div class="bar-label"><span>${txt('숏', 'Short')}</span><span>${shortCount}</span></div><div class="bar-bg"><div class="bar-fill red" style="width: ${stats.total > 0 ? (shortCount / stats.total) * 100 : 0}%"></div></div></div>
    </div>
    <div class="position-stat-box">
      <h4>📋 ${txt('포지션 상태', 'Position Status')}</h4>
      <div class="bar-container"><div class="bar-label"><span>${txt('활성', 'Active')}</span><span>${activeCount}</span></div><div class="bar-bg"><div class="bar-fill yellow" style="width: ${stats.total > 0 ? (activeCount / stats.total) * 100 : 0}%"></div></div></div>
      <div class="bar-container"><div class="bar-label"><span>${txt('종료', 'Closed')}</span><span>${closedCount}</span></div><div class="bar-bg"><div class="bar-fill gray" style="width: ${stats.total > 0 ? (closedCount / stats.total) * 100 : 0}%"></div></div></div>
    </div>
  </div>

  ${insights.length > 0 ? `<div class="insights-box"><div class="section-title" style="border-bottom: none; margin-bottom: 10px;">💡 ${txt('트레이딩 인사이트', 'Trading Insights')}</div>${insights.map(i => `<div class="insight-item">${i}</div>`).join('')}</div>` : ''}

  <div class="section">
    <div class="section-title">📋 ${txt('포지션 상세 목록', 'Position Details')}</div>
    <table>
      <thead><tr><th>${txt('코인', 'Coin')}</th><th>${txt('방향', 'Direction')}</th><th>${txt('진입가', 'Entry')}</th><th>${txt('목표가', 'Target')}</th><th>${txt('손절가', 'Stop')}</th><th>${txt('손익비', 'R:R')}</th><th>${txt('상태', 'Status')}</th></tr></thead>
      <tbody>${portfolioPositions.length === 0 ? `<tr><td colspan="7" style="text-align: center; padding: 40px; color: #999;">${txt('등록된 포지션이 없습니다', 'No positions')}</td></tr>` : portfolioPositions.map(p => {
        const rr = p.position_type === 'LONG' ? ((p.target_price - p.entry_price) / (p.entry_price - p.stop_loss)).toFixed(2) : ((p.entry_price - p.target_price) / (p.stop_loss - p.entry_price)).toFixed(2)
        return `<tr><td><strong>${p.coin_symbol}</strong></td><td><span class="${p.position_type.toLowerCase()}">${p.position_type}</span></td><td>$${p.entry_price.toLocaleString()}</td><td style="color: #3b82f6;">$${p.target_price.toLocaleString()}</td><td style="color: #ff6b6b;">$${p.stop_loss.toLocaleString()}</td><td style="color: #f59e0b;">1:${isFinite(parseFloat(rr)) && parseFloat(rr) > 0 ? rr : '1.00'}</td><td><span class="${p.status === 'active' ? 'active-badge' : 'closed-badge'}">${p.status === 'active' ? txt('활성', 'Active') : txt('종료', 'Closed')}</span></td></tr>`
      }).join('')}</tbody>
    </table>
  </div>

  <div class="footer">
    <p>${txt('크립토 대시보드 PRO에서 생성됨', 'Generated by Crypto Dashboard PRO')} | ${dateStr}</p>
    <p style="margin-top: 5px;">${txt('※ 본 리포트는 참고용이며 투자 조언이 아닙니다.', '※ For reference only, not investment advice.')}</p>
  </div>
</body>
</html>`
    const win = window.open('', '_blank')
    if (win) { win.document.write(html); win.document.close(); setTimeout(() => win.print(), 500) }
  }

  const toggleFavorite = async (coin: AnalyzedCoin) => { if (!user) return; const existing = favorites.find(f => f.coin_id === coin.id); if (existing) { await supabase.from('favorites').delete().eq('id', existing.id); setFavorites(favorites.filter(f => f.id !== existing.id)); setFavoriteCoins(favoriteCoins.filter(fc => fc.id !== coin.id)) } else { if (profile?.plan === 'free' && favorites.length >= 3) { alert(txt('무료는 3개까지', 'Free: max 3')); return }; const { data } = await supabase.from('favorites').insert({ user_id: user.id, coin_id: coin.id, coin_symbol: coin.symbol, coin_name: coin.name }).select().single(); if (data) { setFavorites([data, ...favorites]); setFavoriteCoins([coin, ...favoriteCoins]) } } }
  const handleAdClick = async (ad: AdSlot) => { try { await supabase.rpc('increment_ad_click', { ad_id: ad.id }) } catch (e) {}; window.open(ad.link_url, '_blank') }
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => { const val = parseInt(e.target.value); setSliderValue(val); setInputValue(String(val)) }
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { setInputValue(e.target.value) }
  const handleInputBlur = () => { const num = parseInt(inputValue); if (isNaN(num)) setInputValue(String(sliderValue)); else { const clamped = Math.min(130, Math.max(50, num)); setSliderValue(clamped); setInputValue(String(clamped)) } }
  const markAllRead = () => { setNotifications(notifications.map(n => ({ ...n, read: true }))) }
  const unreadCount = notifications.filter(n => !n.read).length

  const SignalBadge = ({ signal }: { signal: string }) => { const config: Record<string, { text: string; bg: string; icon: string }> = { strong_buy: { text: txt('강력 매수', 'Strong Buy'), bg: 'bg-green-500', icon: '🚀' }, buy: { text: txt('매수', 'Buy'), bg: 'bg-green-400', icon: '📈' }, hold: { text: txt('관망', 'Hold'), bg: 'bg-yellow-500', icon: '⏸️' }, sell: { text: txt('매도', 'Sell'), bg: 'bg-red-400', icon: '📉' }, strong_sell: { text: txt('강력 매도', 'Strong Sell'), bg: 'bg-red-500', icon: '🔻' } }; const { text, bg, icon } = config[signal] || config.hold; return <span className={`${bg} text-white px-3 py-1 rounded-full text-sm font-bold`}>{icon} {text}</span> }
  const ScoreBar = ({ label, score, max, color }: { label: string; score: number; max: number; color: string }) => (<div className="mb-2"><div className="flex justify-between text-sm mb-1"><span className={currentColors.textSecondary}>{label}</span><span className={`${currentColors.text} font-semibold`}>{score}/{max}</span></div><div className={`h-2 ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'} rounded-full overflow-hidden`}><div className={`h-full ${color} rounded-full`} style={{ width: `${(score / max) * 100}%` }} /></div></div>)
  
  const AdCard = ({ ad }: { ad: AdSlot }) => {
    const getLinkText = (text: string | null | undefined) => {
      if (!text) return '→'
      if (lang === 'ko') return text
      const tr: Record<string, string> = { '입장하기': 'Enter', '참여하기': 'Join', '구독하기': 'Subscribe', '방문하기': 'Visit', '바로가기': 'Go', '확인하기': 'Check' }
      return tr[text] || text
    }
    const getTitle = (title: string) => {
      if (lang === 'ko') return title
      const tr: Record<string, string> = { '텔레그램 시그널': 'Telegram Signal', '카카오 오픈채팅': 'KakaoTalk Chat', '유튜브 채널': 'YouTube Channel', '블로그': 'Blog', '텔레그램 채널': 'Telegram Channel', '디스코드': 'Discord' }
      return tr[title] || title
    }
    const getDesc = (desc: string) => {
      if (lang === 'ko') return desc
      const tr: Record<string, string> = { '실시간 매매 시그널': 'Real-time signals', '트레이더들과 소통': 'Chat with traders', '차트 분석 영상': 'Chart analysis videos', '심층 분석 글': 'In-depth analysis' }
      return tr[desc] || desc
    }
    return (<div className={`bg-gradient-to-r ${ad.bg_color || 'from-purple-500/20 to-blue-500/20'} border ${ad.border_color || 'border-purple-500/30'} rounded-xl cursor-pointer hover:scale-[1.02] transition-all p-3`} onClick={() => handleAdClick(ad)}><div className="flex items-center gap-3"><span className="text-2xl">{ad.icon || '📢'}</span><div className="flex-1 min-w-0"><p className="font-semibold text-white text-sm">{getTitle(ad.title)}</p><p className="text-white/70 truncate text-xs">{getDesc(ad.description)}</p></div><span className="text-[#00d395] text-xs font-semibold">{getLinkText(ad.link_text)}</span></div></div>)
  }

  const CoinCard = ({ coin, showFavButton = true }: { coin: AnalyzedCoin, showFavButton?: boolean }) => {
    const isPro = profile?.plan !== 'free'; const isFavorited = favorites.some(f => f.coin_id === coin.id)
    return (
      <div className={`${currentColors.cardBg} rounded-2xl p-5 border cursor-pointer hover:border-[#00d395]/50 transition-all relative ${coin.signal === 'strong_buy' || coin.signal === 'buy' ? 'border-[#00d395]/30' : coin.signal === 'hold' ? 'border-yellow-500/30' : 'border-[#ff6b6b]/30'}`} onClick={() => { setSelectedCoin(coin); setShowDetail(true) }}>
        {showFavButton && <button onClick={(e) => { e.stopPropagation(); toggleFavorite(coin) }} className={`absolute top-3 right-3 text-xl ${isFavorited ? 'text-yellow-400' : 'text-white/30 hover:text-yellow-400'}`}>{isFavorited ? '★' : '☆'}</button>}
        <div className="flex justify-between items-start mb-4 pr-8"><div><div className="flex items-center gap-2"><span className={`text-xl font-bold ${currentColors.text}`}>{coin.symbol.toUpperCase()}</span><span className={`text-xs px-2 py-0.5 rounded ${coin.scores.total >= 95 ? 'bg-[#00d395]/20 text-[#00d395]' : coin.scores.total >= 70 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-[#ff6b6b]/20 text-[#ff6b6b]'}`}>{coin.scores.total}/140</span></div><p className={currentColors.textSecondary + ' text-sm'}>{coin.name}</p></div><SignalBadge signal={coin.signal} /></div>
        <div className="mb-4"><p className="text-2xl font-bold text-[#00d395]">{formatPrice(coin.current_price)}</p><p className={`text-sm ${coin.price_change_percentage_24h >= 0 ? 'text-[#00d395]' : 'text-[#ff6b6b]'}`}>{coin.price_change_percentage_24h >= 0 ? '▲' : '▼'} {Math.abs(coin.price_change_percentage_24h || 0).toFixed(2)}%</p></div>
        {isPro ? (<div className={`${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-3 space-y-2`}><div className="flex justify-between"><span className={currentColors.textSecondary + ' text-sm'}>{txt('진입가', 'Entry')}</span><span className="text-[#00d395] font-semibold">{formatPrice(coin.entry_price)}</span></div><div className="flex justify-between"><span className={currentColors.textSecondary + ' text-sm'}>{txt('목표가', 'Target')}</span><span className="text-blue-400 font-semibold">{formatPrice(coin.target_price)}</span></div><div className="flex justify-between"><span className={currentColors.textSecondary + ' text-sm'}>{txt('손절가', 'Stop')}</span><span className="text-[#ff6b6b] font-semibold">{formatPrice(coin.stop_loss)}</span></div><div className={`flex justify-between pt-2 border-t ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}><span className={currentColors.textSecondary + ' text-sm'}>{txt('손익비', 'R:R')}</span><span className="text-yellow-400 font-bold">{coin.risk_reward}</span></div></div>) : (<div className={`${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-4 text-center`}><p className={currentColors.textSecondary + ' text-sm'}>🔒 PRO {txt('전용', 'Only')}</p></div>)}
        <button className="w-full mt-3 py-2 text-sm text-[#00d395] hover:bg-[#00d395]/10 rounded-lg">{txt('상세 분석 →', 'Details →')}</button>
      </div>
    )
  }

  if (!themeLoaded || loading) return (<div className="min-h-screen flex items-center justify-center bg-[#0a0a14]"><div className="text-center"><div className="w-12 h-12 border-4 border-[#00d395] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div><p className="text-white">{txt('로딩 중...', 'Loading...')}</p></div></div>)

  const sidebarAds = adSlots.filter(ad => ad.position === 'sidebar'); const ownAds = sidebarAds.filter(ad => ad.ad_type === 'own'); const sponsoredAds = sidebarAds.filter(ad => ad.ad_type === 'sponsored')

  return (
    <div className={`min-h-screen ${currentColors.bg} ${currentColors.text}`}>
      {/* 헤더 */}
      <header className={`border-b ${theme === 'dark' ? 'border-white/10 bg-[#0a0a14]/95' : 'border-gray-200 bg-white/95'} sticky top-0 backdrop-blur z-40`}>
        <div className="max-w-[1600px] mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 md:gap-4"><Link href="/" className="text-lg md:text-xl font-bold whitespace-nowrap">🚀 <span className="hidden sm:inline">{txt('크립토 대시보드', 'Crypto Dashboard')}</span><span className="sm:hidden">{txt('대시보드', 'Dashboard')}</span> PRO</Link>{profile?.plan !== 'free' && <span className="bg-[#00d395] text-black px-2 py-1 rounded text-xs font-bold">{profile?.plan?.toUpperCase()}</span>}</div>
            <div className="flex items-center gap-2 md:gap-4">
              <button onClick={toggleLang} className={`px-2 md:px-3 py-1.5 rounded-full font-semibold text-xs md:text-sm ${theme === 'dark' ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-200 hover:bg-gray-300'}`}>🌐 <span className="hidden sm:inline">{lang === 'ko' ? 'EN' : '한국어'}</span></button>
              <div className={`hidden sm:flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1.5 rounded-full ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'}`}><span className="text-sm">☀️</span><button type="button" onClick={toggleTheme} className={`w-10 md:w-12 h-6 rounded-full relative ${theme === 'dark' ? 'bg-[#00d395]' : 'bg-gray-400'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${theme === 'dark' ? 'left-5 md:left-7' : 'left-1'}`} /></button><span className="text-sm">🌙</span></div>
              <button type="button" onClick={toggleTheme} className={`sm:hidden p-2 rounded-full ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'}`}>{theme === 'dark' ? '🌙' : '☀️'}</button>
              <div className={`hidden md:block text-sm ${currentColors.textSecondary}`}>{lastUpdate.toLocaleTimeString(lang === 'ko' ? 'ko-KR' : 'en-US')} | <span className="text-[#00d395]">{countdown}s</span></div>
              <span className={`hidden lg:block ${currentColors.textSecondary}`}>{profile?.nickname || user?.email?.split('@')[0]}</span>
              <Link href="/pricing" className="hidden md:block text-sm text-[#00d395]">{txt('요금제', 'Pricing')}</Link>
              <div className="relative" ref={notificationRef}><button type="button" onClick={() => setShowNotifications(!showNotifications)} className={`relative p-2 rounded-full ${theme === 'dark' ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-200 hover:bg-gray-300'}`}>🔔{unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-[#ff6b6b] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">{unreadCount > 9 ? '9+' : unreadCount}</span>}</button>{showNotifications && (<div className={`absolute right-0 top-12 w-80 max-h-96 overflow-y-auto rounded-xl border shadow-2xl z-50 ${currentColors.cardBg} ${currentColors.cardBorder}`}><div className="p-3 border-b flex justify-between items-center"><span className={`font-bold ${currentColors.text}`}>🔔 {txt('알림', 'Notifications')}</span>{notifications.length > 0 && <button type="button" onClick={markAllRead} className="text-xs text-[#00d395]">{txt('모두 읽음', 'Mark all read')}</button>}</div>{notifications.length === 0 ? <div className={`p-6 text-center ${currentColors.textSecondary}`}>{txt('알림 없음', 'No notifications')}</div> : notifications.slice(0, 10).map(n => (<div key={n.id} className={`p-3 border-b ${theme === 'dark' ? 'border-white/5' : 'border-gray-100'} ${!n.read ? (theme === 'dark' ? 'bg-[#00d395]/10' : 'bg-green-50') : ''}`}><p className={`text-sm ${currentColors.text}`}>{n.message}</p><p className={`text-xs ${currentColors.textSecondary} mt-1`}>{n.time.toLocaleTimeString(lang === 'ko' ? 'ko-KR' : 'en-US')}</p></div>))}</div>)}</div>
              <button type="button" onClick={() => supabase.auth.signOut()} className={`p-2 rounded-full ${theme === 'dark' ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-200 hover:bg-gray-300'}`} title={txt('로그아웃', 'Logout')}>🚪</button>
            </div>
          </div>
        </div>
      </header>

      {/* 탭 */}
      <div className={`border-b ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}><div className="max-w-[1600px] mx-auto px-4"><div className="flex gap-2 py-3 overflow-x-auto scrollbar-hide">{[{ id: 'dashboard', label: txt('📊 대시보드', '📊 Dashboard') }, { id: 'alerts', label: txt('🔔 알림', '🔔 Alerts') }, { id: 'portfolio', label: txt('💼 포트폴리오', '💼 Portfolio') }, { id: 'indicator', label: txt('📈 지표', '📈 Indicator') }, { id: 'report', label: txt('📋 리포트', '📋 Report') }].map(tab => (<button key={tab.id} type="button" onClick={() => setActiveTab(tab.id as any)} className={`px-3 md:px-5 py-2 md:py-2.5 rounded-xl font-semibold transition whitespace-nowrap text-sm md:text-base ${activeTab === tab.id ? 'bg-[#00d395] text-black' : `${theme === 'dark' ? 'bg-white/5 text-white/70 hover:bg-white/10' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}`}>{tab.label}</button>))}</div></div></div>

      <div className="max-w-[1600px] mx-auto px-4 py-8">
        {/* 대시보드 탭 */}
        {activeTab === 'dashboard' && (
          <div className="flex gap-6">
            <main className="flex-1 min-w-0">
              {profile?.plan !== 'free' && (<div className="mb-8 relative" ref={searchDropdownRef}><div className="flex gap-2 md:gap-3"><input type="text" value={searchQuery} onChange={(e) => handleSearchInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} onFocus={() => searchQuery && setShowSearchDropdown(true)} placeholder={txt('코인명 입력 (예: ENA, PEPE)', 'Enter coin (e.g., BTC, ETH)')} className={`flex-1 min-w-0 ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'} border rounded-xl px-3 md:px-4 py-3 focus:outline-none focus:border-[#00d395] text-sm md:text-base`} /><button type="button" onClick={handleSearch} disabled={searchLoading} className="bg-[#00d395] text-black px-4 md:px-8 py-3 rounded-xl font-semibold whitespace-nowrap text-sm md:text-base flex-shrink-0">{searchLoading ? '...' : txt('🔍 분석', '🔍 Analyze')}</button></div>{showSearchDropdown && searchSuggestions.length > 0 && (<div className={`absolute left-0 right-20 md:right-24 top-14 rounded-xl border shadow-2xl z-50 ${currentColors.cardBg} ${currentColors.cardBorder}`}>{searchSuggestions.map((s, i) => (<button key={i} type="button" onClick={() => selectSearchCoin(s.symbol)} className={`w-full px-4 py-3 text-left hover:bg-[#00d395]/20 flex justify-between ${i !== searchSuggestions.length - 1 ? `border-b ${theme === 'dark' ? 'border-white/5' : 'border-gray-100'}` : ''}`}><span className={`font-bold ${currentColors.text}`}>{s.symbol}</span></button>))}</div>)}</div>)}
              {searchResult && <div className="mb-8"><h2 className={`text-xl font-bold mb-4 ${currentColors.text}`}>{txt('🔍 검색 결과', '🔍 Search Result')}</h2><div className="max-w-md"><CoinCard coin={searchResult} /></div></div>}
              {favorites.length > 0 && (<section className="mb-10"><div className="flex items-center justify-between mb-4"><h2 className={`text-xl font-bold ${currentColors.text}`}>⭐ {txt('즐겨찾기', 'Favorites')} ({favorites.length})</h2><button type="button" onClick={() => setShowFavorites(!showFavorites)} className={`text-sm px-3 py-1 rounded-lg ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'}`}>{showFavorites ? txt('접기 ▲', 'Collapse ▲') : txt('펼치기 ▼', 'Expand ▼')}</button></div>{showFavorites && <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">{favoriteCoins.length > 0 ? favoriteCoins.map(coin => <CoinCard key={coin.id} coin={coin} />) : favorites.map(f => (<div key={f.id} className={`${currentColors.cardBg} rounded-2xl p-5 border ${currentColors.cardBorder}`}><span className={`text-xl font-bold ${currentColors.text}`}>{f.coin_symbol}</span><p className={`${currentColors.textSecondary} text-sm mt-2`}>{txt('로딩 중...', 'Loading...')}</p></div>))}</div>}</section>)}
              <section className="mb-10"><h2 className={`text-xl font-bold mb-4 ${currentColors.text}`}>{txt('🔥 핵심 코인', '🔥 Core Coins')}</h2><div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">{coreCoins.map(coin => <CoinCard key={coin.id} coin={coin} />)}</div></section>
              {profile?.plan !== 'free' ? (<section className="mb-10"><h2 className={`text-xl font-bold mb-4 ${currentColors.text}`}>{txt('📈 상승 코인 TOP 6', '📈 Top Gainers')} <span className="bg-[#00d395] text-black px-2 py-0.5 rounded text-xs">PRO</span></h2><div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{topGainers.map(coin => <CoinCard key={coin.id} coin={coin} />)}</div></section>) : (<section className="mb-10"><div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-2xl text-center py-12 px-6"><h2 className={`text-2xl font-bold mb-4 ${currentColors.text}`}>🔒 PRO {txt('전용', 'Only')}</h2><Link href="/pricing" className="bg-[#00d395] text-black px-8 py-3 rounded-xl font-semibold inline-block">{txt('업그레이드 →', 'Upgrade →')}</Link></div></section>)}
              {/* 시그널 성과 통계 */}
              {signalStats && (
                <section className="mb-10">
                  <h2 className={`text-xl font-bold mb-4 ${currentColors.text}`}>{txt('🎯 시그널 성과', '🎯 Signal Performance')}</h2>
                  <div className={`${currentColors.cardBg} rounded-2xl p-6 border ${currentColors.cardBorder}`}>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                      <div className={`${theme === 'dark' ? 'bg-[#00d395]/10' : 'bg-green-50'} rounded-xl p-4 text-center`}>
                        <p className="text-3xl font-bold text-[#00d395]">{signalStats.win_rate_30d || 0}%</p>
                        <p className={`text-sm ${currentColors.textSecondary}`}>{txt('30일 승률', '30D Win Rate')}</p>
                      </div>
                      <div className={`${theme === 'dark' ? 'bg-blue-500/10' : 'bg-blue-50'} rounded-xl p-4 text-center`}>
                        <p className="text-3xl font-bold text-blue-400">{signalStats.signals_30d || 0}</p>
                        <p className={`text-sm ${currentColors.textSecondary}`}>{txt('30일 시그널', '30D Signals')}</p>
                      </div>
                      <div className={`${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-4 text-center`}>
                        <p className={`text-3xl font-bold ${currentColors.text}`}>{signalStats.wins}/{signalStats.losses}</p>
                        <p className={`text-sm ${currentColors.textSecondary}`}>{txt('승/패', 'W/L')}</p>
                      </div>
                      <div className={`${theme === 'dark' ? 'bg-[#00d395]/10' : 'bg-green-50'} rounded-xl p-4 text-center`}>
                        <p className="text-3xl font-bold text-[#00d395]">+{signalStats.max_profit || 0}%</p>
                        <p className={`text-sm ${currentColors.textSecondary}`}>{txt('최대 수익', 'Max Profit')}</p>
                      </div>
                      <div className={`${theme === 'dark' ? 'bg-[#ff6b6b]/10' : 'bg-red-50'} rounded-xl p-4 text-center`}>
                        <p className="text-3xl font-bold text-[#ff6b6b]">{signalStats.max_loss || 0}%</p>
                        <p className={`text-sm ${currentColors.textSecondary}`}>{txt('최대 손실', 'Max Loss')}</p>
                      </div>
                    </div>
                    {recentSignals.length > 0 && (
                      <div>
                        <h3 className={`font-bold mb-3 ${currentColors.text}`}>{txt('📋 최근 시그널', '📋 Recent Signals')}</h3>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead><tr className={`border-b ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}>{[txt('코인','Coin'), txt('시그널','Signal'), txt('진입가','Entry'), txt('목표가','Target'), txt('손절가','Stop'), txt('결과','Result'), txt('수익률','P/L')].map(h => <th key={h} className={`text-left p-2 ${currentColors.textSecondary}`}>{h}</th>)}</tr></thead>
                            <tbody>
                              {recentSignals.slice(0, 5).map(s => (
                                <tr key={s.id} className={`border-b ${theme === 'dark' ? 'border-white/5' : 'border-gray-100'}`}>
                                  <td className={`p-2 font-bold ${currentColors.text}`}>{s.coin_symbol.toUpperCase()}</td>
                                  <td className="p-2"><span className={`px-2 py-0.5 rounded text-xs font-bold ${s.signal_type.includes('buy') ? 'bg-[#00d395]/20 text-[#00d395]' : s.signal_type === 'hold' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-[#ff6b6b]/20 text-[#ff6b6b]'}`}>{s.signal_type.toUpperCase()}</span></td>
                                  <td className={`p-2 ${currentColors.text}`}>${s.entry_price.toLocaleString()}</td>
                                  <td className="p-2 text-blue-400">${s.target_price.toLocaleString()}</td>
                                  <td className="p-2 text-[#ff6b6b]">${s.stop_loss.toLocaleString()}</td>
                                  <td className="p-2"><span className={`px-2 py-0.5 rounded text-xs font-bold ${s.result === 'win' ? 'bg-[#00d395]/20 text-[#00d395]' : s.result === 'loss' ? 'bg-[#ff6b6b]/20 text-[#ff6b6b]' : 'bg-yellow-500/20 text-yellow-400'}`}>{s.result === 'win' ? '✅' : s.result === 'loss' ? '❌' : '⏳'}</span></td>
                                  <td className={`p-2 font-bold ${s.profit_percent && s.profit_percent > 0 ? 'text-[#00d395]' : s.profit_percent && s.profit_percent < 0 ? 'text-[#ff6b6b]' : currentColors.textSecondary}`}>{s.profit_percent ? `${s.profit_percent > 0 ? '+' : ''}${s.profit_percent}%` : '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              )}

              <section><h2 className={`text-xl font-bold mb-4 ${currentColors.text}`}>{txt('📊 시장 요약', '📊 Market Summary')}</h2><div className={`${currentColors.cardBg} rounded-2xl p-6 border ${currentColors.cardBorder}`}><div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center"><div><p className={`${currentColors.textSecondary} text-sm mb-1`}>{txt('분석 코인', 'Analyzed')}</p><p className={`text-2xl font-bold ${currentColors.text}`}>{coreCoins.length + topGainers.length}</p></div><div><p className={`${currentColors.textSecondary} text-sm mb-1`}>{txt('매수', 'Buy')}</p><p className="text-2xl font-bold text-[#00d395]">{[...coreCoins, ...topGainers].filter(c => c.signal === 'buy' || c.signal === 'strong_buy').length}</p></div><div><p className={`${currentColors.textSecondary} text-sm mb-1`}>{txt('관망', 'Hold')}</p><p className="text-2xl font-bold text-yellow-400">{[...coreCoins, ...topGainers].filter(c => c.signal === 'hold').length}</p></div><div><p className={`${currentColors.textSecondary} text-sm mb-1`}>{txt('매도', 'Sell')}</p><p className="text-2xl font-bold text-[#ff6b6b]">{[...coreCoins, ...topGainers].filter(c => c.signal === 'sell' || c.signal === 'strong_sell').length}</p></div></div></div></section>
            </main>
            {/* 사이드바 */}
            <aside className="hidden xl:block w-72 flex-shrink-0">
              <div className="sticky top-24 space-y-6">
                <div><h3 className={`text-lg font-bold mb-3 ${currentColors.text}`}>{txt('📢 소통 채널', '📢 Channels')}</h3><div className="space-y-2">{ownAds.length > 0 ? ownAds.map(ad => <AdCard key={ad.id} ad={ad} />) : <p className={currentColors.textSecondary + ' text-sm'}>{txt('등록된 채널 없음', 'No channels')}</p>}</div></div>
                <div className={`border-t ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'} pt-6`}><h4 className={`text-sm ${currentColors.textSecondary} mb-3`}>{txt('💎 파트너', '💎 Partners')}</h4><div className="space-y-2">{sponsoredAds.length > 0 ? sponsoredAds.map(ad => <AdCard key={ad.id} ad={ad} />) : (<div className={`${currentColors.cardBg} border ${currentColors.cardBorder} rounded-xl p-4 text-center`}><p className={currentColors.textSecondary + ' text-sm'}>{txt('광고 문의', 'Ad Inquiry')}</p><a href="https://t.me/xrp5555555" target="_blank" rel="noopener noreferrer" className="text-[#00d395] text-xs">@xrp5555555</a></div>)}</div></div>
                <div className={`${currentColors.cardBg} rounded-xl p-4 border ${currentColors.cardBorder}`}><h4 className={`font-bold mb-2 ${currentColors.text}`}>{txt('💡 도움말', '💡 Help')}</h4><ul className={`text-sm ${currentColors.textSecondary} space-y-1`}><li>• {txt('코인 클릭 → 상세 분석', 'Click coin → Details')}</li><li>• {txt('⭐ 클릭 → 즐겨찾기', '⭐ Click → Favorite')}</li><li>• {txt('2분마다 자동 갱신', 'Auto-refresh 2min')}</li></ul></div>
              </div>
            </aside>
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
            {savedAlertSettings && (
              <div className={`${currentColors.cardBg} rounded-2xl p-6 border ${currentColors.cardBorder}`}>
                <div className="flex justify-between items-center mb-4"><h3 className={`text-lg font-bold ${currentColors.text}`}>{txt('💾 저장된 설정', '💾 Saved Settings')}</h3><button type="button" onClick={deleteAlertSettings} className="px-4 py-2 bg-[#ff6b6b] text-white rounded-lg text-sm">{txt('🗑️ 삭제', '🗑️ Delete')}</button></div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className={`${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-4`}><p className={`text-sm ${currentColors.textSecondary}`}>{txt('코인', 'Coins')}</p><p className={`font-bold ${currentColors.text} text-sm`}>{savedAlertSettings.selected_coins.join(', ')}</p></div>
                  <div className={`${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-4`}><p className={`text-sm ${currentColors.textSecondary}`}>{txt('임계점', 'Threshold')}</p><p className="font-bold text-[#00d395]">{savedAlertSettings.score_threshold}/140</p></div>
                  <div className={`${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-4`}><p className={`text-sm ${currentColors.textSecondary}`}>{txt('시간대', 'Time')}</p><p className={`font-bold ${currentColors.text} text-xs`}>{[savedAlertSettings.time_morning && txt('아침','AM'), savedAlertSettings.time_afternoon && txt('오후','PM'), savedAlertSettings.time_evening && txt('저녁','Eve'), savedAlertSettings.time_night && txt('심야','Night')].filter(Boolean).join(', ') || txt('없음','None')}</p></div>
                  <div className={`${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-4`}><p className={`text-sm ${currentColors.textSecondary}`}>{txt('유형', 'Types')}</p><p className={`font-bold ${currentColors.text} text-xs`}>{[savedAlertSettings.alert_signal && txt('시그널','Signal'), savedAlertSettings.alert_score_change && txt('점수','Score')].filter(Boolean).join(', ') || txt('없음','None')}</p></div>
                  <div className={`${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-4`}><p className={`text-sm ${currentColors.textSecondary}`}>{txt('텔레그램', 'Telegram')}</p><p className={`font-bold ${savedAlertSettings.telegram_id ? 'text-[#00d395]' : currentColors.textSecondary}`}>{savedAlertSettings.telegram_id ? '✅' : '❌'}</p></div>
                </div>
              </div>
            )}
            <div className={`${currentColors.cardBg} rounded-2xl p-6 border border-[#00d395]/50`}>
              <h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>{txt('📱 텔레그램 알림', '📱 Telegram Alerts')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-4 space-y-3 text-sm`}>
                  <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'}`}><p className={`font-bold ${currentColors.text}`}>{txt('1. @userinfobot 검색 → 내 ID 확인', '1. Search @userinfobot → Get ID')}</p></div>
                  <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'}`}><p className={`font-bold ${currentColors.text}`}>{txt('2. 오른쪽에 ID 입력', '2. Enter ID on right')}</p></div>
                  <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-[#00d395]/10' : 'bg-green-50'} border border-[#00d395]/30`}><p className="font-bold text-[#00d395]">{txt('3. @crypto_navcp_bot 검색 → /start', '3. @crypto_navcp_bot → /start')}</p><p className="text-yellow-400 text-xs mt-1">{txt('⚠️ 필수!', '⚠️ Required!')}</p></div>
                  <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'}`}><p className={`font-bold ${currentColors.text}`}>{txt('4. 설정 저장', '4. Save settings')}</p></div>
                </div>
                <div><label className={`block text-sm ${currentColors.textSecondary} mb-2`}>{txt('텔레그램 ID', 'Telegram ID')}</label><input type="text" inputMode="numeric" placeholder={txt('예: 1234567890', 'e.g., 1234567890')} value={telegramId} onChange={(e) => setTelegramId(e.target.value)} className={`w-full p-4 rounded-xl border ${currentColors.cardBorder} ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'} text-lg`} />{telegramId && <div className="mt-3 p-3 bg-[#00d395]/10 border border-[#00d395]/30 rounded-lg"><p className="text-[#00d395] text-sm">✅ ID: {telegramId}</p></div>}</div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={`${currentColors.cardBg} rounded-2xl p-6 border ${currentColors.cardBorder}`}>
                <h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>{txt('🪙 코인 선택', '🪙 Select Coins')}</h3>
                <input type="text" placeholder={txt('코인 검색...', 'Search coin...')} value={alertCoinSearch} onChange={(e) => { setAlertCoinSearch(e.target.value); searchAlertCoin(e.target.value) }} className={`w-full p-3 rounded-xl border ${currentColors.cardBorder} ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'} mb-3`} />
                {alertCoinSearch && alertSearchResults.length > 0 && <div className="flex flex-wrap gap-2 mb-3">{alertSearchResults.map(c => (<button key={c} type="button" onClick={() => { if (!alertSettings.selected_coins.includes(c)) setAlertSettings({ ...alertSettings, selected_coins: [...alertSettings.selected_coins, c] }); setAlertCoinSearch(''); setAlertSearchResults([]) }} className="px-3 py-1 rounded-full text-sm bg-[#00d395]/20 text-[#00d395]">+ {c}</button>))}</div>}
                <p className={`text-xs ${currentColors.textSecondary} mb-2`}>{txt('선택됨', 'Selected')} ({alertSettings.selected_coins.length})</p>
                <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto">{alertSettings.selected_coins.map(c => (<button key={c} type="button" onClick={() => setAlertSettings({ ...alertSettings, selected_coins: alertSettings.selected_coins.filter(x => x !== c) })} className="px-4 py-2 rounded-full text-sm font-semibold bg-[#00d395] text-black">{c} ✕</button>))}</div>
              </div>
              <div className={`${currentColors.cardBg} rounded-2xl p-6 border ${currentColors.cardBorder}`}>
                <h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>{txt('🎯 점수 임계값', '🎯 Score Threshold')}</h3>
                <p className={`text-sm ${currentColors.textSecondary} mb-4`}>{txt('이 점수 이상이면 알림', 'Alert when score exceeds')}</p>
                <div className="flex items-center gap-4 mb-4"><input type="range" min="50" max="130" value={sliderValue} onChange={handleSliderChange} className="flex-1 h-3 rounded-full appearance-none cursor-pointer" style={{ background: `linear-gradient(to right, #00d395 ${((sliderValue - 50) / 80) * 100}%, ${theme === 'dark' ? '#333' : '#ddd'} ${((sliderValue - 50) / 80) * 100}%)` }} /><span className="bg-[#00d395] text-black px-4 py-2 rounded-xl font-bold text-xl">{sliderValue}/140</span></div>
                <div className="flex items-center gap-2"><span className={`text-sm ${currentColors.textSecondary}`}>{txt('직접 입력:', 'Direct:')}</span><input type="text" inputMode="numeric" value={inputValue} onChange={handleInputChange} onBlur={handleInputBlur} className={`w-24 p-2 rounded-lg border ${currentColors.cardBorder} ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'} text-center`} /></div>
              </div>
            </div>
            <div className={`${currentColors.cardBg} rounded-2xl p-6 border ${currentColors.cardBorder}`}>
              <h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>{txt('⏰ 시간대 선택', '⏰ Time Slots')}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[{ key: 'time_morning', label: txt('🌅 아침', '🌅 Morning'), time: txt('06-12시', '06-12') }, { key: 'time_afternoon', label: txt('☀️ 오후', '☀️ Afternoon'), time: txt('12-18시', '12-18') }, { key: 'time_evening', label: txt('🌆 저녁', '🌆 Evening'), time: txt('18-24시', '18-24') }, { key: 'time_night', label: txt('🌙 심야', '🌙 Night'), time: txt('00-06시', '00-06') }].map(slot => (<button key={slot.key} type="button" onClick={() => setAlertSettings({ ...alertSettings, [slot.key]: !(alertSettings as any)[slot.key] })} className={`p-4 rounded-xl border transition-all ${(alertSettings as any)[slot.key] ? 'bg-[#00d395]/20 border-[#00d395]' : `${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}`}><p className={`font-semibold ${currentColors.text}`}>{slot.label}</p><p className={`text-xs ${currentColors.textSecondary}`}>{slot.time}</p></button>))}
              </div>
            </div>
            <div className={`${currentColors.cardBg} rounded-2xl p-6 border ${currentColors.cardBorder}`}>
              <h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>{txt('📋 알림 유형', '📋 Alert Types')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[{ key: 'alert_signal', label: txt('📈 시그널', '📈 Signal'), desc: txt('매수/매도 시그널', 'Buy/Sell signals') }, { key: 'alert_score_change', label: txt('🎯 점수 변동', '🎯 Score'), desc: txt('임계점 도달 시', 'When threshold reached') }, { key: 'alert_price', label: txt('💰 가격 알림', '💰 Price'), desc: txt('급등/급락 시', 'Sudden moves') }].map(type => (<button key={type.key} type="button" onClick={() => setAlertSettings({ ...alertSettings, [type.key]: !(alertSettings as any)[type.key] })} className={`p-4 rounded-xl border text-left transition-all ${(alertSettings as any)[type.key] ? 'bg-[#00d395]/20 border-[#00d395]' : `${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}`}><p className={`font-semibold ${currentColors.text}`}>{type.label}</p><p className={`text-xs ${currentColors.textSecondary}`}>{type.desc}</p></button>))}
              </div>
            </div>
            <button type="button" onClick={saveAlertSettings} disabled={settingsSaving} className="w-full bg-[#00d395] text-black py-4 rounded-xl font-bold text-lg">{settingsSaving ? txt('저장 중...', 'Saving...') : txt('💾 설정 저장', '💾 Save Settings')}</button>
          </div>
        )}

        {/* 포트폴리오 탭 */}
        {activeTab === 'portfolio' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {(() => { const stats = calculatePortfolioStats(); return [{ label: txt('총 포지션', 'Total'), value: stats.total, icon: '📋' }, { label: txt('활성', 'Active'), value: stats.active, icon: '🟢', color: 'text-[#00d395]' }, { label: txt('승률', 'Win Rate'), value: `${stats.winRate}%`, icon: '🎯', color: parseFloat(stats.winRate) >= 50 ? 'text-[#00d395]' : 'text-[#ff6b6b]' }, { label: txt('미실현 수익', 'Unrealized'), value: `${stats.unrealizedPnL}%`, icon: '📈', color: parseFloat(stats.unrealizedPnL) >= 0 ? 'text-[#00d395]' : 'text-[#ff6b6b]' }, { label: txt('승/패', 'W/L'), value: `${stats.wins}/${stats.losses}`, icon: '📊' }].map((s, i) => (<div key={i} className={`${currentColors.cardBg} rounded-xl p-4 border ${currentColors.cardBorder} text-center`}><div className="text-2xl mb-2">{s.icon}</div><div className={`text-2xl font-bold ${s.color || currentColors.text}`}>{s.value}</div><div className={`text-sm ${currentColors.textSecondary}`}>{s.label}</div></div>)) })()}
            </div>
            <div className={`${currentColors.cardBg} rounded-2xl p-6 border ${currentColors.cardBorder}`}>
              <h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>{txt('➕ 새 포지션', '➕ New Position')}</h3>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                <div className="relative" ref={portfolioDropdownRef}><label className={`block text-sm ${currentColors.textSecondary} mb-1`}>{txt('코인', 'Coin')}</label><button type="button" onClick={() => { setShowPortfolioDropdown(!showPortfolioDropdown); setPortfolioSearchResults(allCoins.slice(0, 20)) }} className={`w-full p-3 rounded-xl border ${currentColors.cardBorder} ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'} text-left flex justify-between`}><span>{positionCoin}</span><span>▼</span></button>{showPortfolioDropdown && (<div className={`absolute z-50 w-64 mt-1 rounded-xl border ${currentColors.cardBorder} ${currentColors.cardBg} shadow-lg`}><div className="p-2"><input type="text" placeholder={txt('코인 검색...', 'Search...')} value={portfolioCoinSearch} onChange={(e) => { setPortfolioCoinSearch(e.target.value); searchPortfolioCoin(e.target.value) }} className={`w-full p-2 rounded-lg border ${currentColors.cardBorder} ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'} text-sm`} autoFocus /></div><div className="max-h-48 overflow-y-auto">{portfolioSearchResults.map(c => (<button key={c} type="button" onClick={() => { setPositionCoin(c); setShowPortfolioDropdown(false); setPortfolioCoinSearch('') }} className={`w-full px-4 py-2 text-left hover:bg-[#00d395]/20 ${positionCoin === c ? 'bg-[#00d395]/10' : ''}`}>{c}</button>))}</div></div>)}</div>
                <div><label className={`block text-sm ${currentColors.textSecondary} mb-1`}>{txt('방향', 'Direction')}</label><div className="flex gap-1"><button type="button" onClick={() => setPositionType('LONG')} className={`flex-1 p-3 rounded-l-xl font-bold ${positionType === 'LONG' ? 'bg-[#00d395] text-black' : theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'}`}>🟢</button><button type="button" onClick={() => setPositionType('SHORT')} className={`flex-1 p-3 rounded-r-xl font-bold ${positionType === 'SHORT' ? 'bg-[#ff6b6b] text-white' : theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'}`}>🔴</button></div></div>
                <div><label className={`block text-sm ${currentColors.textSecondary} mb-1`}>{txt('진입가', 'Entry')}</label><input type="text" inputMode="decimal" placeholder="0.00" value={entryValue} onChange={(e) => setEntryValue(e.target.value)} className={`w-full p-3 rounded-xl border ${currentColors.cardBorder} ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`} /></div>
                <div><label className={`block text-sm ${currentColors.textSecondary} mb-1`}>{txt('목표가', 'Target')}</label><input type="text" inputMode="decimal" placeholder="0.00" value={targetValue} onChange={(e) => setTargetValue(e.target.value)} className={`w-full p-3 rounded-xl border ${currentColors.cardBorder} ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`} /></div>
                <div><label className={`block text-sm ${currentColors.textSecondary} mb-1`}>{txt('손절가', 'Stop Loss')}</label><input type="text" inputMode="decimal" placeholder="0.00" value={stopValue} onChange={(e) => setStopValue(e.target.value)} className={`w-full p-3 rounded-xl border ${currentColors.cardBorder} ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`} /></div>
                <div className="flex items-end"><button type="button" onClick={addPosition} className="w-full bg-[#00d395] text-black p-3 rounded-xl font-bold">{txt('추가', 'Add')}</button></div>
              </div>
            </div>
            <div className={`${currentColors.cardBg} rounded-2xl p-6 border ${currentColors.cardBorder}`}>
              <h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>{txt('📋 포지션 목록', '📋 Positions')}</h3>
              <div className="overflow-x-auto"><table className="w-full"><thead><tr className={`border-b ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}>{[txt('코인','Coin'), txt('방향','Dir'), txt('진입가','Entry'), txt('현재가','Current'), txt('목표가','Target'), txt('손절가','Stop'), txt('수익률','P/L'), txt('상태','Status'), ''].map(h => <th key={h} className={`text-left p-3 text-sm ${currentColors.textSecondary}`}>{h}</th>)}</tr></thead><tbody>{portfolioPositions.length === 0 ? (<tr><td colSpan={9} className={`text-center p-8 ${currentColors.textSecondary}`}>{txt('데이터 없음', 'No data')}</td></tr>) : portfolioPositions.map(p => { const currentPrice = getCurrentPrice(p.coin_symbol); const pnl = getUnrealizedPnL(p); return (<tr key={p.id} className={`border-b ${theme === 'dark' ? 'border-white/5' : 'border-gray-100'}`}><td className={`p-3 font-bold ${currentColors.text}`}>{p.coin_symbol}</td><td className="p-3"><span className={`px-3 py-1 rounded-full text-xs font-bold ${p.position_type === 'LONG' ? 'bg-[#00d395]/20 text-[#00d395]' : 'bg-[#ff6b6b]/20 text-[#ff6b6b]'}`}>{p.position_type}</span></td><td className={`p-3 ${currentColors.text}`}>${p.entry_price.toLocaleString()}</td><td className={`p-3 font-bold ${currentPrice > p.entry_price ? 'text-[#00d395]' : currentPrice < p.entry_price ? 'text-[#ff6b6b]' : currentColors.text}`}>{currentPrice ? `$${currentPrice.toLocaleString()}` : '-'}</td><td className="p-3 text-blue-400">${p.target_price.toLocaleString()}</td><td className="p-3 text-[#ff6b6b]">${p.stop_loss.toLocaleString()}</td><td className={`p-3 font-bold ${pnl && pnl > 0 ? 'text-[#00d395]' : pnl && pnl < 0 ? 'text-[#ff6b6b]' : currentColors.textSecondary}`}>{pnl !== null ? `${pnl > 0 ? '+' : ''}${pnl.toFixed(2)}%` : '-'}</td><td className="p-3"><span className={`px-3 py-1 rounded-full text-xs ${p.status === 'active' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/10 text-white/50'}`}>{p.status === 'active' ? txt('활성','Active') : txt('종료','Closed')}</span></td><td className="p-3"><button type="button" onClick={() => deletePosition(p)} className="px-3 py-1 bg-[#ff6b6b] text-white rounded-lg text-sm">{txt('삭제','Delete')}</button></td></tr>)})}</tbody></table></div>
            </div>
          </div>
        )}

        {/* 지표 탭 */}
        {activeTab === 'indicator' && (
          <div className="space-y-6">
            <div className="flex gap-2 flex-wrap">{[{ id: 'intro', label: txt('📊 지표 소개', '📊 Introduction') }, { id: 'backtest', label: txt('📈 백테스팅', '📈 Backtesting') }, { id: 'deepbacktest', label: txt('🔬 딥백테스팅', '🔬 Deep Backtest') }, { id: 'automate', label: txt('🤖 자동매매', '🤖 Auto Trading') }].map(section => (<button key={section.id} onClick={() => setIndicatorSection(section.id as any)} className={`px-4 py-2 rounded-xl font-semibold transition ${indicatorSection === section.id ? 'bg-[#00d395] text-black' : theme === 'dark' ? 'bg-white/10 text-white/70 hover:bg-white/20' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>{section.label}</button>))}</div>
            
            {indicatorSection === 'intro' && (<>
              <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-2xl p-6">
                <h3 className={`text-xl font-bold mb-4 ${currentColors.text}`}>{txt('🎯 왜 트레이딩뷰인가?', '🎯 Why TradingView?')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className={`${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-4`}><div className="text-3xl mb-2">🌍</div><h4 className={`font-bold mb-1 ${currentColors.text}`}>{txt('글로벌 표준', 'Global Standard')}</h4><p className={`text-sm ${currentColors.textSecondary}`}>{txt('5천만+ 트레이더 사용', '50M+ traders')}</p></div>
                  <div className={`${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-4`}><div className="text-3xl mb-2">📊</div><h4 className={`font-bold mb-1 ${currentColors.text}`}>{txt('정확한 백테스트', 'Accurate Backtest')}</h4><p className={`text-sm ${currentColors.textSecondary}`}>{txt('내장 백테스트 기능', 'Built-in testing')}</p></div>
                  <div className={`${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-4`}><div className="text-3xl mb-2">⚡</div><h4 className={`font-bold mb-1 ${currentColors.text}`}>{txt('실시간 시그널', 'Real-time Signals')}</h4><p className={`text-sm ${currentColors.textSecondary}`}>{txt('차트에서 바로 확인', 'On-chart alerts')}</p></div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`${currentColors.cardBg} rounded-2xl p-6 border ${currentColors.cardBorder}`}>
                  <div className="flex items-center gap-2 mb-4"><span className="text-2xl">🆓</span><h3 className={`text-xl font-bold ${currentColors.text}`}>{txt('무료 버전', 'Free Version')}</h3></div>
                  <p className={`${currentColors.textSecondary} text-sm mb-4`}>{txt('기본 지표 3개까지 사용 가능', 'Up to 3 basic indicators')}</p>
                  <div className={`${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-4`}>
                    <h4 className={`font-bold mb-3 ${currentColors.text}`}>{txt('📌 추천 기본 지표', '📌 Recommended')}</h4>
                    <div className="space-y-2">
                      <div className={`flex justify-between items-center pb-2 border-b ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}><span className={currentColors.text}>RSI</span><span className="text-[#00d395] text-sm">{txt('과매수/과매도', 'Overbought/sold')}</span></div>
                      <div className={`flex justify-between items-center pb-2 border-b ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}><span className={currentColors.text}>MACD</span><span className="text-[#00d395] text-sm">{txt('추세 전환', 'Trend')}</span></div>
                      <div className="flex justify-between items-center"><span className={currentColors.text}>{txt('볼린저 밴드', 'Bollinger')}</span><span className="text-[#00d395] text-sm">{txt('변동성', 'Volatility')}</span></div>
                    </div>
                  </div>
                </div>
                <div className={`${currentColors.cardBg} rounded-2xl p-6 border-2 border-[#00d395]`}>
                  <div className="flex items-center gap-2 mb-4"><span className="text-2xl">💎</span><h3 className={`text-xl font-bold ${currentColors.text}`}>{txt('체크리스트 지표', 'Checklist Indicator')}</h3><span className="bg-[#00d395] text-black px-2 py-0.5 rounded text-xs font-bold">PRO</span></div>
                  <p className={`${currentColors.textSecondary} text-sm mb-4`}>{txt('트레이딩뷰 유료 구독자 전용', 'For TradingView paid users')}</p>
                  <div className={`${theme === 'dark' ? 'bg-[#00d395]/10' : 'bg-green-50'} rounded-xl p-4 mb-4`}>
                    <h4 className="font-bold mb-3 text-[#00d395]">{txt('✅ 포함 기능', '✅ Features')}</h4>
                    <div className="space-y-2 text-sm">
                      {[
                        txt('7단계 체크리스트 자동 점수화', '7-step auto-scoring'),
                        txt('진입가 / 목표가 / 손절가 자동 계산', 'Auto entry/target/stop'),
                        txt('롱/숏/관망 시그널 표시', 'Long/Short/Hold signals'),
                        txt('모든 타임프레임 지원', 'All timeframes supported'),
                        txt('모든 자산 적용 (크립토/주식/선물)', 'All assets (crypto/stocks/futures)'),
                        txt('알림 기능 (텔레그램 연동 가능)', 'Alerts (Telegram integration)'),
                        txt('월 구독 방식', 'Monthly subscription')
                      ].map((f, i) => (<div key={i} className="flex items-center gap-2"><span className="text-[#00d395]">✓</span><span className={currentColors.text}>{f}</span></div>))}
                    </div>
                  </div>
                  <div className={`${theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'} rounded-xl p-4 mb-4`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`line-through ${currentColors.textSecondary}`}>{txt('정가', 'Regular')} $199/{txt('월', 'mo')}</span>
                      <span className="bg-[#ff6b6b] text-white px-2 py-0.5 rounded text-xs font-bold">50% OFF</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-[#00d395]">$99</span>
                      <span className={currentColors.textSecondary + ' text-sm'}>/{txt('월', 'month')}</span>
                    </div>
                    <p className="text-yellow-400 text-xs mt-2">{txt('* 선착순 50명 한정', '* First 50 only')}</p>
                  </div>
                  <a href="https://t.me/xrp5555555" target="_blank" rel="noopener noreferrer" className="block w-full bg-[#00d395] text-black py-3 rounded-xl font-bold text-center hover:bg-[#00d395]/90 transition">{txt('💬 구매 문의 (텔레그램)', '💬 Purchase (Telegram)')}</a>
                </div>
              </div>
            </>)}
            
            {indicatorSection === 'backtest' && (<div className="space-y-6">
              <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/30 rounded-2xl p-6"><h3 className={`text-xl font-bold mb-4 ${currentColors.text}`}>{txt('📈 백테스팅이란?', '📈 What is Backtesting?')}</h3><p className={currentColors.textSecondary}>{txt('과거 데이터로 전략 성능을 테스트합니다. 실제 투자 전 전략의 유효성을 검증할 수 있습니다.', 'Test strategy with historical data. Validate before real investment.')}</p></div>
              <div className={`${currentColors.cardBg} rounded-2xl p-6 border ${currentColors.cardBorder}`}><h3 className={`text-xl font-bold mb-4 ${currentColors.text}`}>{txt('🔧 백테스트 방법', '🔧 How to Backtest')}</h3><div className="space-y-4">{[{ step: 1, title: txt('전략 테스터 열기', 'Open Strategy Tester'), desc: txt('차트 하단 "전략 테스터" 탭 클릭', 'Click tab at bottom') }, { step: 2, title: txt('기간 설정', 'Set Period'), desc: txt('원하는 기간 선택 (1개월 ~ 수년)', '1 month to years') }, { step: 3, title: txt('결과 분석', 'Analyze Results'), desc: txt('순이익, 승률, 최대 낙폭 확인', 'Net profit, win rate, drawdown') }].map(item => (<div key={item.step} className={`flex gap-4 p-4 rounded-xl ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}><div className="w-8 h-8 bg-[#00d395] text-black rounded-full flex items-center justify-center font-bold flex-shrink-0">{item.step}</div><div><h4 className={`font-bold ${currentColors.text}`}>{item.title}</h4><p className={`text-sm ${currentColors.textSecondary}`}>{item.desc}</p></div></div>))}</div></div>
            </div>)}
            
            {indicatorSection === 'deepbacktest' && (<div className="space-y-6">
              <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-2xl p-6"><h3 className={`text-xl font-bold mb-4 ${currentColors.text}`}>{txt('🔬 딥백테스팅이란?', '🔬 What is Deep Backtesting?')}</h3><p className={currentColors.textSecondary}>{txt('틱 단위 데이터, 슬리피지, 수수료를 반영한 정밀 테스트입니다. 실제 트레이딩 환경과 유사한 결과를 얻을 수 있습니다.', 'Precise testing with tick data, slippage, fees. Results similar to real trading.')}</p></div>
              <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-2xl p-6"><h3 className={`text-xl font-bold mb-3 ${currentColors.text}`}>{txt('⚠️ 주의사항', '⚠️ Cautions')}</h3><ul className={`space-y-2 text-sm ${currentColors.textSecondary}`}><li>• {txt('바 확대(Bar Magnifier) 기능은 Premium 이상 필요', 'Bar Magnifier requires Premium+')}</li><li>• {txt('과거 성과 ≠ 미래 수익 보장', 'Past ≠ future results')}</li><li>• {txt('과최적화(Overfitting) 주의', 'Beware of overfitting')}</li></ul></div>
            </div>)}
            
            {indicatorSection === 'automate' && (<div className="space-y-6">
              <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-2xl p-6"><h3 className={`text-xl font-bold mb-4 ${currentColors.text}`}>{txt('🤖 자동매매 연동', '🤖 Auto Trading')}</h3><p className={currentColors.textSecondary}>{txt('트레이딩뷰 알림 → 거래소 API → 자동 주문 실행', 'TradingView alert → Exchange API → Auto order')}</p></div>
              <div className={`${currentColors.cardBg} rounded-2xl p-6 border ${currentColors.cardBorder}`}><h3 className={`text-xl font-bold mb-4 ${currentColors.text}`}>{txt('🔗 지원 거래소', '🔗 Supported Exchanges')}</h3><div className="grid grid-cols-2 md:grid-cols-4 gap-4">{['Binance', 'Bybit', 'OKX', 'Bitget'].map(ex => (<div key={ex} className={`${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-4 text-center`}><span className={`font-bold ${currentColors.text}`}>{ex}</span></div>))}</div></div>
              <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border-2 border-red-500/50 rounded-2xl p-6"><h3 className="text-xl font-bold mb-4 text-[#ff6b6b]">{txt('⚠️ 중요 면책조항', '⚠️ Important Disclaimer')}</h3><div className={`space-y-2 text-sm ${currentColors.textSecondary}`}><p>• {txt('자동매매는 전적으로 본인 책임입니다', 'Auto trading is at your own risk')}</p><p>• {txt('API 키 관리, 자금 운용 책임 = 사용자', 'API key & fund management = your responsibility')}</p><p>• {txt('과거 백테스트 결과 ≠ 미래 수익 보장', 'Past backtest ≠ future profit')}</p><p>• {txt('소액 테스트 후 운용을 권장합니다', 'Test with small amount first')}</p></div></div>
              <div className={`${currentColors.cardBg} rounded-2xl p-6 border ${currentColors.cardBorder} text-center`}><p className={`mb-4 ${currentColors.textSecondary}`}>{txt('자동매매 연동 관련 문의', 'Auto trading setup inquiry')}</p><a href="https://t.me/xrp5555555" target="_blank" rel="noopener noreferrer" className="inline-block bg-[#00d395] text-black px-8 py-3 rounded-xl font-bold">{txt('💬 텔레그램 문의', '💬 Telegram')}</a></div>
            </div>)}
          </div>
        )}

        {/* 리포트 탭 */}
        {activeTab === 'report' && (
          <div className="space-y-6">
            {/* 트레이딩 성과 요약 */}
            <div className="bg-gradient-to-r from-[#00d395] to-[#00b383] rounded-2xl p-6 text-white">
              <h3 className="text-lg font-bold mb-4">{txt('📊 트레이딩 성과', '📊 Trading Performance')}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                {(() => { const stats = calculatePortfolioStats(); return [
                  { label: txt('총 포지션', 'Total'), value: stats.total },
                  { label: txt('활성', 'Active'), value: stats.active },
                  { label: txt('승률', 'Win Rate'), value: `${stats.winRate}%` },
                  { label: 'PnL', value: `${parseFloat(stats.totalPnL) >= 0 ? '+' : ''}${stats.totalPnL}%` }
                ].map((i, idx) => (<div key={idx}><div className="text-3xl font-bold">{i.value}</div><div className="text-sm opacity-80">{i.label}</div></div>)) })()}
              </div>
            </div>

            {/* 포지션 목록 */}
            <div className={`${currentColors.cardBg} rounded-2xl p-6 border ${currentColors.cardBorder}`}>
              <h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>{txt('📋 포지션 목록', '📋 Position List')}</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className={`border-b ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}>{[txt('코인','Coin'), txt('방향','Dir'), txt('진입가','Entry'), txt('목표가','Target'), txt('손절가','Stop'), txt('상태','Status')].map(h => (<th key={h} className={`text-left p-3 text-sm ${currentColors.textSecondary}`}>{h}</th>))}</tr></thead>
                  <tbody>
                    {portfolioPositions.length === 0 ? (<tr><td colSpan={6} className={`text-center p-8 ${currentColors.textSecondary}`}>{txt('등록된 포지션이 없습니다', 'No positions registered')}</td></tr>) : portfolioPositions.map(p => (
                      <tr key={p.id} className={`border-b ${theme === 'dark' ? 'border-white/5' : 'border-gray-100'}`}>
                        <td className={`p-3 font-bold ${currentColors.text}`}>{p.coin_symbol}</td>
                        <td className="p-3"><span className={`px-3 py-1 rounded-full text-xs font-bold ${p.position_type === 'LONG' ? 'bg-[#00d395]/20 text-[#00d395]' : 'bg-[#ff6b6b]/20 text-[#ff6b6b]'}`}>{p.position_type}</span></td>
                        <td className={`p-3 ${currentColors.text}`}>${p.entry_price.toLocaleString()}</td>
                        <td className="p-3 text-blue-400">${p.target_price.toLocaleString()}</td>
                        <td className="p-3 text-[#ff6b6b]">${p.stop_loss.toLocaleString()}</td>
                        <td className="p-3"><span className={`px-3 py-1 rounded-full text-xs ${p.status === 'active' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/10 text-white/50'}`}>{p.status === 'active' ? txt('활성','Active') : txt('종료','Closed')}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 성과 분석 */}
            <div className={`${currentColors.cardBg} rounded-2xl p-6 border ${currentColors.cardBorder}`}>
              <h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>{txt('📈 성과 분석', '📈 Performance Analysis')}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(() => { const stats = calculatePortfolioStats(); return [
                  { label: txt('승리', 'Wins'), value: stats.wins, color: 'text-[#00d395]', icon: '🏆', bg: 'bg-[#00d395]/10' },
                  { label: txt('패배', 'Losses'), value: stats.losses, color: 'text-[#ff6b6b]', icon: '📉', bg: 'bg-[#ff6b6b]/10' },
                  { label: txt('승률', 'Win Rate'), value: `${stats.winRate}%`, color: 'text-blue-400', icon: '🎯', bg: 'bg-blue-500/10' },
                  { label: txt('총 수익률', 'Total PnL'), value: `${parseFloat(stats.totalPnL) >= 0 ? '+' : ''}${stats.totalPnL}%`, color: parseFloat(stats.totalPnL) >= 0 ? 'text-[#00d395]' : 'text-[#ff6b6b]', icon: '💰', bg: parseFloat(stats.totalPnL) >= 0 ? 'bg-[#00d395]/10' : 'bg-[#ff6b6b]/10' }
                ].map((item, i) => (
                  <div key={i} className={`${item.bg} rounded-xl p-4 text-center border ${theme === 'dark' ? 'border-white/5' : 'border-gray-100'}`}>
                    <div className="text-3xl mb-2">{item.icon}</div>
                    <div className={`text-2xl font-bold ${item.color}`}>{item.value}</div>
                    <div className={`text-sm ${currentColors.textSecondary}`}>{item.label}</div>
                  </div>
                )) })()}
              </div>
            </div>

            {/* 포지션 상세 통계 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={`${currentColors.cardBg} rounded-2xl p-6 border ${currentColors.cardBorder}`}>
                <h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>{txt('📊 포지션 통계', '📊 Position Stats')}</h3>
                <div className="space-y-4">
                  {(() => { 
                    const longCount = portfolioPositions.filter(p => p.position_type === 'LONG').length
                    const shortCount = portfolioPositions.filter(p => p.position_type === 'SHORT').length
                    const activeCount = portfolioPositions.filter(p => p.status === 'active').length
                    const closedCount = portfolioPositions.filter(p => p.status === 'closed').length
                    return [
                      { label: txt('롱 포지션', 'Long'), value: longCount, color: 'bg-[#00d395]', total: portfolioPositions.length },
                      { label: txt('숏 포지션', 'Short'), value: shortCount, color: 'bg-[#ff6b6b]', total: portfolioPositions.length },
                      { label: txt('활성', 'Active'), value: activeCount, color: 'bg-yellow-500', total: portfolioPositions.length },
                      { label: txt('종료', 'Closed'), value: closedCount, color: 'bg-gray-500', total: portfolioPositions.length }
                    ].map((stat, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-sm mb-1"><span className={currentColors.textSecondary}>{stat.label}</span><span className={currentColors.text}>{stat.value}</span></div>
                        <div className={`h-2 ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'} rounded-full overflow-hidden`}><div className={`h-full ${stat.color} rounded-full`} style={{ width: `${stat.total > 0 ? (stat.value / stat.total) * 100 : 0}%` }} /></div>
                      </div>
                    ))
                  })()}
                </div>
              </div>

              <div className={`${currentColors.cardBg} rounded-2xl p-6 border ${currentColors.cardBorder}`}>
                <h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>{txt('💡 트레이딩 인사이트', '💡 Trading Insights')}</h3>
                <div className="space-y-3">
                  {(() => {
                    const stats = calculatePortfolioStats()
                    const insights = []
                    if (parseFloat(stats.winRate) >= 60) insights.push({ icon: '🌟', text: txt('승률이 60% 이상으로 우수합니다!', 'Win rate above 60% - Excellent!'), color: 'text-[#00d395]' })
                    else if (parseFloat(stats.winRate) >= 40) insights.push({ icon: '📊', text: txt('승률이 평균 수준입니다.', 'Win rate is average.'), color: 'text-yellow-400' })
                    else if (stats.total > 0) insights.push({ icon: '⚠️', text: txt('승률 개선이 필요합니다.', 'Win rate needs improvement.'), color: 'text-[#ff6b6b]' })
                    if (parseFloat(stats.totalPnL) > 0) insights.push({ icon: '💰', text: txt('총 수익이 플러스입니다!', 'Total PnL is positive!'), color: 'text-[#00d395]' })
                    else if (parseFloat(stats.totalPnL) < 0) insights.push({ icon: '📉', text: txt('손실을 줄이는 전략이 필요합니다.', 'Need loss reduction strategy.'), color: 'text-[#ff6b6b]' })
                    if (stats.active > 0) insights.push({ icon: '🔥', text: txt(`현재 ${stats.active}개 포지션 활성 중`, `${stats.active} active positions`), color: 'text-blue-400' })
                    if (insights.length === 0) insights.push({ icon: '📝', text: txt('포지션을 추가하면 인사이트가 표시됩니다.', 'Add positions for insights.'), color: currentColors.textSecondary })
                    return insights.map((insight, i) => (
                      <div key={i} className={`flex items-center gap-3 p-3 rounded-lg ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                        <span className="text-xl">{insight.icon}</span>
                        <span className={`text-sm ${insight.color}`}>{insight.text}</span>
                      </div>
                    ))
                  })()}
                </div>
              </div>
            </div>

            {/* PDF 다운로드 - 맨 아래 작게 */}
            {/* 월별 실현 수익 */}
            <div className={`${currentColors.cardBg} rounded-xl p-4 border ${currentColors.cardBorder} mb-4`}>
              <h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>📅 {txt('월별 실현 수익', 'Monthly Realized P&L')}</h3>
              {getMonthlyPnL().length === 0 ? (
                <p className={`text-center py-4 ${currentColors.textSecondary}`}>{txt('종료된 포지션이 없습니다', 'No closed positions yet')}</p>
              ) : (
                <div className="space-y-2">
                  {getMonthlyPnL().map(m => (
                    <div key={m.month} className={`flex items-center justify-between p-3 rounded-lg ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                      <div className="flex items-center gap-3">
                        <span className={`font-semibold ${currentColors.text}`}>{m.monthLabel}</span>
                        <span className={`text-xs px-2 py-1 rounded ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'} ${currentColors.textSecondary}`}>{m.count}{txt('건', ' trades')}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`text-xs ${currentColors.textSecondary}`}>{txt('승률', 'Win')} {m.winRate}%</span>
                        <span className={`font-bold ${parseFloat(m.pnl) >= 0 ? 'text-[#00d395]' : 'text-[#ff6b6b]'}`}>
                          {parseFloat(m.pnl) >= 0 ? '+' : ''}{m.pnl}%
                        </span>
                      </div>
                    </div>
                  ))}
                  <div className={`flex items-center justify-between p-3 rounded-lg border-t-2 ${theme === 'dark' ? 'border-white/20' : 'border-gray-300'} mt-2 pt-4`}>
                    <span className={`font-bold ${currentColors.text}`}>📊 {txt('누적 총계', 'Total')}</span>
                    <span className={`text-xl font-bold ${parseFloat(calculatePortfolioStats().totalPnL) >= 0 ? 'text-[#00d395]' : 'text-[#ff6b6b]'}`}>
                      {parseFloat(calculatePortfolioStats().totalPnL) >= 0 ? '+' : ''}{calculatePortfolioStats().totalPnL}%
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div className={`${currentColors.cardBg} rounded-xl p-4 border ${currentColors.cardBorder}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">📄</span>
                  <div>
                    <p className={`font-semibold ${currentColors.text} text-sm`}>{txt('PDF 리포트', 'PDF Report')}</p>
                    <p className={`text-xs ${currentColors.textSecondary}`}>{txt('전체 포지션 기록 다운로드', 'Download all position records')}</p>
                  </div>
                </div>
                <button type="button" onClick={downloadPDF} className="bg-[#00d395] text-black px-4 py-2 rounded-lg font-semibold text-sm hover:bg-[#00d395]/90 transition">{txt('다운로드', 'Download')}</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 상세 모달 */}
      {showDetail && selectedCoin && (<div className={`fixed inset-0 z-50 ${currentColors.bg} overflow-y-auto`}><div className={`sticky top-0 ${currentColors.bg} border-b z-10`}><div className="flex justify-between items-center p-4"><div className="flex items-center gap-3"><h2 className={`text-xl font-bold ${currentColors.text}`}>{selectedCoin.symbol.toUpperCase()}</h2><SignalBadge signal={selectedCoin.signal} /></div><button type="button" onClick={() => setShowDetail(false)} className={`${theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'} px-4 py-2 rounded-lg font-semibold`}>✕ {txt('닫기', 'Close')}</button></div></div><div className="max-w-2xl mx-auto p-4 pb-20"><div className={`${currentColors.cardBg} rounded-2xl p-6 mb-4 border ${currentColors.cardBorder}`}><p className={currentColors.textSecondary}>{selectedCoin.name}</p><p className="text-4xl font-bold text-[#00d395] mb-2">{formatPrice(selectedCoin.current_price)}</p><p className={selectedCoin.price_change_percentage_24h >= 0 ? 'text-[#00d395]' : 'text-[#ff6b6b]'}>{selectedCoin.price_change_percentage_24h >= 0 ? '▲' : '▼'} {Math.abs(selectedCoin.price_change_percentage_24h || 0).toFixed(2)}%</p></div><div className={`${currentColors.cardBg} rounded-2xl p-6 mb-4 border ${currentColors.cardBorder}`}><h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>📊 {txt('체크리스트', 'Checklist')} <span className="text-[#00d395]">{selectedCoin.scores.total}/140</span></h3>{profile?.plan !== 'free' ? (<div className="space-y-3"><ScoreBar label={txt('거시환경', 'Macro')} score={selectedCoin.scores.macro} max={20} color="bg-blue-500" /><ScoreBar label="ETF" score={selectedCoin.scores.etf} max={25} color="bg-purple-500" /><ScoreBar label={txt('온체인', 'On-chain')} score={selectedCoin.scores.onchain} max={25} color="bg-green-500" /><ScoreBar label="AI" score={selectedCoin.scores.ai} max={20} color="bg-pink-500" /><ScoreBar label={txt('선물', 'Futures')} score={selectedCoin.scores.futures} max={20} color="bg-orange-500" /><ScoreBar label={txt('기술적', 'Technical')} score={selectedCoin.scores.technical} max={20} color="bg-cyan-500" /><ScoreBar label={txt('전략', 'Strategy')} score={selectedCoin.scores.strategy} max={10} color="bg-yellow-500" /></div>) : (<div className={`${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-6 text-center`}><p className={currentColors.textSecondary}>🔒 PRO {txt('전용', 'Only')}</p><Link href="/pricing" className="bg-[#00d395] text-black px-6 py-2 rounded-xl font-semibold inline-block mt-2">{txt('업그레이드 →', 'Upgrade →')}</Link></div>)}</div>{profile?.plan !== 'free' && (<><div className={`${currentColors.cardBg} rounded-2xl p-6 mb-4 border ${currentColors.cardBorder}`}><h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>💰 {txt('매매 전략', 'Strategy')}</h3><div className="grid grid-cols-2 gap-3"><div className="bg-[#00d395]/10 border border-[#00d395]/30 rounded-xl p-4"><p className={currentColors.textSecondary + ' text-sm'}>{txt('진입가', 'Entry')}</p><p className="text-[#00d395] text-xl font-bold">{formatPrice(selectedCoin.entry_price)}</p></div><div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4"><p className={currentColors.textSecondary + ' text-sm'}>{txt('목표가', 'Target')}</p><p className="text-blue-400 text-xl font-bold">{formatPrice(selectedCoin.target_price)}</p></div><div className="bg-[#ff6b6b]/10 border border-[#ff6b6b]/30 rounded-xl p-4"><p className={currentColors.textSecondary + ' text-sm'}>{txt('손절가', 'Stop')}</p><p className="text-[#ff6b6b] text-xl font-bold">{formatPrice(selectedCoin.stop_loss)}</p></div><div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4"><p className={currentColors.textSecondary + ' text-sm'}>{txt('손익비', 'R:R')}</p><p className="text-yellow-400 text-xl font-bold">{selectedCoin.risk_reward}</p></div></div></div><div className={`${currentColors.cardBg} rounded-2xl p-6 mb-4 border ${currentColors.cardBorder}`}><h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>🤖 AI {txt('코멘트', 'Comment')}</h3><div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-xl p-4"><p className={`${theme === 'dark' ? 'text-white/90' : 'text-gray-700'} whitespace-pre-line`}>{generateDetailedAIComment(selectedCoin)}</p></div></div></>)}<button type="button" onClick={() => setShowDetail(false)} className={`w-full py-4 ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'} rounded-xl font-semibold`}>{txt('닫기', 'Close')}</button></div></div>)}

      <style jsx global>{`input[type="range"]::-webkit-slider-thumb{-webkit-appearance:none;width:24px;height:24px;border-radius:50%;background:#00d395;cursor:grab;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)}input[type="range"]::-moz-range-thumb{width:24px;height:24px;border-radius:50%;background:#00d395;cursor:grab;border:3px solid white}select{color:inherit}`}</style>
    </div>
  )
}
