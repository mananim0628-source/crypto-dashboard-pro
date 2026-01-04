'use client'

import { useState, useEffect, useRef } from 'react'
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'alerts' | 'portfolio' | 'report'>('dashboard')
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [alertSettings, setAlertSettings] = useState<AlertSettings | null>(null)
  const [portfolioPositions, setPortfolioPositions] = useState<PortfolioPosition[]>([])
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [positionCoin, setPositionCoin] = useState('BTC')
  const [positionType, setPositionType] = useState<'LONG' | 'SHORT'>('LONG')
  const entryRef = useRef<HTMLInputElement>(null)
  const targetRef = useRef<HTMLInputElement>(null)
  const stopRef = useRef<HTMLInputElement>(null)
  const [coinSearchQuery, setCoinSearchQuery] = useState('')
  const [showCoinDropdown, setShowCoinDropdown] = useState(false)
  const coinDropdownRef = useRef<HTMLDivElement>(null)
  const [sliderValue, setSliderValue] = useState(90)

  const allCoins = ['BTC', 'ETH', 'XRP', 'BNB', 'SOL', 'ADA', 'DOGE', 'MATIC', 'DOT', 'SHIB', 'AVAX', 'LINK', 'UNI', 'ATOM', 'LTC', 'ETC', 'XLM', 'ALGO', 'VET', 'FIL', 'AAVE', 'AXS', 'SAND', 'MANA', 'GALA', 'ENJ', 'CHZ', 'APE', 'LDO', 'ARB', 'OP', 'IMX', 'NEAR', 'APT', 'SUI', 'SEI', 'TIA', 'INJ', 'FET', 'RNDR', 'GRT', 'SNX', 'CRV', 'MKR', 'COMP', '1INCH', 'SUSHI', 'YFI', 'BAL', 'CAKE']
  const filteredCoins = coinSearchQuery ? allCoins.filter(coin => coin.toLowerCase().includes(coinSearchQuery.toLowerCase())) : allCoins

  const router = useRouter()
  const supabase = createClientComponentClient()

  const colors = {
    dark: { cardBorder: 'border-white/10', text: 'text-white', textSecondary: 'text-white/50' },
    light: { cardBorder: 'border-gray-200', text: 'text-gray-900', textSecondary: 'text-gray-500' }
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
    if (signal === 'strong_buy') return `${coin.symbol.toUpperCase()}은 현재 강한 매수 신호입니다.`
    if (signal === 'buy') return `${coin.symbol.toUpperCase()}은 매수 관점 접근 가능합니다.`
    if (signal === 'hold') return `${coin.symbol.toUpperCase()}은 관망 구간입니다.`
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

  // 테마 로드
  useEffect(() => {
    const saved = localStorage.getItem('dashboard-theme')
    if (saved === 'light' || saved === 'dark') setTheme(saved)
  }, [])

  // 드롭다운 외부 클릭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (coinDropdownRef.current && !coinDropdownRef.current.contains(event.target as Node)) setShowCoinDropdown(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 모달 스크롤 방지
  useEffect(() => {
    document.body.style.overflow = showDetail ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [showDetail])

  // 메인 초기화 - 단순화
  useEffect(() => {
    let mounted = true

    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session?.user) {
          router.push('/login')
          return
        }

        if (!mounted) return
        setUser(session.user)

        // 프로필
        const { data: profileData } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
        if (mounted && profileData) setProfile(profileData)

        // 중요: 여기서 로딩 완료
        if (mounted) setLoading(false)

        // 코인 데이터
        try {
          const response = await fetch('/api/crypto?action=core')
          const data = await response.json()
          if (mounted && data.coins) setCoreCoins(data.coins.map(analyzeCoin))
        } catch (e) { console.error('Coin fetch error:', e) }

        // 상승 코인
        if (profileData?.plan !== 'free') {
          try {
            const gainersResponse = await fetch('/api/crypto?action=gainers')
            const gainersData = await gainersResponse.json()
            if (mounted && gainersData.coins) setTopGainers(gainersData.coins.slice(0, 6).map(analyzeCoin))
          } catch (e) {}
        }

        setLastUpdate(new Date())

        // 즐겨찾기
        try {
          const { data: favData } = await supabase.from('favorites').select('*').eq('user_id', session.user.id)
          if (mounted && favData) setFavorites(favData)
        } catch (e) {}

        // 광고
        try {
          const { data: adData } = await supabase.from('ad_slots').select('*').eq('is_active', true)
          if (mounted && adData) setAdSlots(adData)
        } catch (e) {}

        // 알림 설정
        try {
          const { data: alertData } = await supabase.from('alert_settings').select('*').eq('user_id', session.user.id).single()
          if (mounted) {
            if (alertData) { setAlertSettings(alertData); setSliderValue(alertData.score_threshold) }
            else setAlertSettings({ user_id: session.user.id, selected_coins: ['BTC', 'ETH'], score_threshold: 90, time_morning: true, time_afternoon: true, time_evening: true, time_night: false, alert_signal: true, alert_score_change: true, alert_price: true })
          }
        } catch (e) {}

        // 포트폴리오
        try {
          const { data: portfolioData } = await supabase.from('portfolio_positions').select('*').eq('user_id', session.user.id)
          if (mounted && portfolioData) setPortfolioPositions(portfolioData)
        } catch (e) {}

        // 테마
        try {
          const { data: prefData } = await supabase.from('user_preferences').select('*').eq('user_id', session.user.id).single()
          if (mounted && prefData?.theme) { setTheme(prefData.theme); localStorage.setItem('dashboard-theme', prefData.theme) }
        } catch (e) {}

      } catch (error) {
        console.error('Init error:', error)
        if (mounted) setLoading(false)
      }
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') router.push('/login')
    })

    return () => { mounted = false; subscription.unsubscribe() }
  }, [supabase, router])

  // 자동 새로고침
  useEffect(() => {
    if (!user) return
    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/crypto?action=core')
        const data = await response.json()
        if (data.coins) setCoreCoins(data.coins.map(analyzeCoin))
        if (profile?.plan !== 'free') {
          const gainersResponse = await fetch('/api/crypto?action=gainers')
          const gainersData = await gainersResponse.json()
          if (gainersData.coins) setTopGainers(gainersData.coins.slice(0, 6).map(analyzeCoin))
        }
        setLastUpdate(new Date())
        setCountdown(120)
      } catch (e) {}
    }, 120000)
    return () => clearInterval(interval)
  }, [user, profile?.plan])

  // 카운트다운
  useEffect(() => {
    const timer = setInterval(() => setCountdown(prev => prev > 0 ? prev - 1 : 120), 1000)
    return () => clearInterval(timer)
  }, [])

  const saveAlertSettings = async () => {
    if (!user || !alertSettings) return
    setSettingsSaving(true)
    const settingsToSave = { ...alertSettings, score_threshold: sliderValue, user_id: user.id, updated_at: new Date().toISOString() }
    const { error } = await supabase.from('alert_settings').upsert(settingsToSave)
    if (error) alert('설정 저장 실패: ' + error.message)
    else { setAlertSettings(settingsToSave); alert('✅ 설정이 저장되었습니다!') }
    setSettingsSaving(false)
  }

  const addPosition = async () => {
    if (!user) return
    const entry = entryRef.current?.value || ''
    const target = targetRef.current?.value || ''
    const stop = stopRef.current?.value || ''
    if (!entry || !target || !stop) { alert('모든 가격을 입력해주세요'); return }
    const { data, error } = await supabase.from('portfolio_positions').insert({ user_id: user.id, coin_symbol: positionCoin, coin_name: positionCoin, position_type: positionType, entry_price: parseFloat(entry), target_price: parseFloat(target), stop_loss: parseFloat(stop), status: 'active' }).select().single()
    if (error) alert('포지션 추가 실패')
    else if (data) {
      setPortfolioPositions([data, ...portfolioPositions])
      if (entryRef.current) entryRef.current.value = ''
      if (targetRef.current) targetRef.current.value = ''
      if (stopRef.current) stopRef.current.value = ''
      alert('✅ 포지션 추가됨')
    }
  }

  const closePosition = async (position: PortfolioPosition) => {
    const exitPrice = prompt('종료 가격:')
    if (!exitPrice) return
    const { error } = await supabase.from('portfolio_positions').update({ status: 'closed', exit_price: parseFloat(exitPrice), exit_date: new Date().toISOString() }).eq('id', position.id)
    if (!error) setPortfolioPositions(portfolioPositions.map(p => p.id === position.id ? { ...p, status: 'closed' as const, exit_price: parseFloat(exitPrice) } : p))
  }

  const toggleTheme = async () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    localStorage.setItem('dashboard-theme', newTheme)
    if (user) await supabase.from('user_preferences').upsert({ user_id: user.id, theme: newTheme, updated_at: new Date().toISOString() })
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

  const downloadPDF = () => {
    const stats = calculatePortfolioStats()
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>리포트</title><style>body{font-family:sans-serif;padding:40px}.header{text-align:center;border-bottom:2px solid #00d395;padding-bottom:20px;margin-bottom:20px}h1{color:#00d395}table{width:100%;border-collapse:collapse}th,td{padding:10px;border-bottom:1px solid #ddd;text-align:left}</style></head><body><div class="header"><h1>크립토 대시보드 PRO 리포트</h1><p>${new Date().toLocaleDateString('ko-KR')}</p></div><h2>통계</h2><p>총 거래: ${stats.total} | 승률: ${stats.winRate}% | 승/패: ${stats.wins}/${stats.losses} | 총 수익: ${stats.totalPnL}%</p><h2>포지션</h2><table><thead><tr><th>코인</th><th>방향</th><th>진입가</th><th>목표가</th><th>손절가</th><th>상태</th></tr></thead><tbody>${portfolioPositions.map(p => `<tr><td>${p.coin_symbol}</td><td>${p.position_type}</td><td>$${p.entry_price}</td><td>$${p.target_price}</td><td>$${p.stop_loss}</td><td>${p.status}</td></tr>`).join('')}</tbody></table></body></html>`
    const win = window.open('', '_blank')
    if (win) { win.document.write(html); win.document.close(); setTimeout(() => win.print(), 500) }
  }

  const toggleFavorite = async (coin: AnalyzedCoin) => {
    if (!user) return
    const existing = favorites.find(f => f.coin_id === coin.id)
    if (existing) {
      await supabase.from('favorites').delete().eq('id', existing.id)
      setFavorites(favorites.filter(f => f.id !== existing.id))
    } else {
      if (profile?.plan === 'free' && favorites.length >= 3) { alert('무료는 3개까지'); return }
      const { data } = await supabase.from('favorites').insert({ user_id: user.id, coin_id: coin.id, coin_symbol: coin.symbol, coin_name: coin.name }).select().single()
      if (data) setFavorites([data, ...favorites])
    }
  }

  const handleAdClick = async (ad: AdSlot) => {
    await supabase.rpc('increment_ad_click', { ad_id: ad.id })
    window.open(ad.link_url, '_blank')
  }

  const handleSearch = async () => {
    if (!searchQuery.trim() || profile?.plan === 'free') return
    setSearchLoading(true)
    try {
      const response = await fetch(`/api/crypto?action=search&query=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()
      if (data.coin) setSearchResult(analyzeCoin(data.coin))
      else { setSearchResult(null); alert('코인을 찾을 수 없습니다') }
    } catch (e) {}
    setSearchLoading(false)
  }

  const SignalBadge = ({ signal }: { signal: string }) => {
    const config: Record<string, { text: string; bg: string; icon: string }> = {
      strong_buy: { text: '강력 매수', bg: 'bg-green-500', icon: '🚀' },
      buy: { text: '매수', bg: 'bg-green-400', icon: '📈' },
      hold: { text: '관망', bg: 'bg-yellow-500', icon: '⏸️' },
      sell: { text: '매도', bg: 'bg-red-400', icon: '📉' },
      strong_sell: { text: '강력 매도', bg: 'bg-red-500', icon: '🔻' }
    }
    const { text, bg, icon } = config[signal] || config.hold
    return <span className={`${bg} text-white px-3 py-1 rounded-full text-sm font-bold`}>{icon} {text}</span>
  }

  const ScoreBar = ({ label, score, max, color }: { label: string; score: number; max: number; color: string }) => (
    <div className="mb-2">
      <div className="flex justify-between text-sm mb-1"><span className={currentColors.textSecondary}>{label}</span><span className={`${currentColors.text} font-semibold`}>{score}/{max}</span></div>
      <div className={`h-2 ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'} rounded-full overflow-hidden`}><div className={`h-full ${color} rounded-full`} style={{ width: `${(score / max) * 100}%` }} /></div>
    </div>
  )

  const AdCard = ({ ad }: { ad: AdSlot }) => (
    <div className={`bg-gradient-to-r ${ad.bg_color} border ${ad.border_color} rounded-xl cursor-pointer hover:scale-[1.02] transition-all p-3`} onClick={() => handleAdClick(ad)}>
      <div className="flex items-center gap-3">
        <span className="text-2xl">{ad.icon}</span>
        <div className="flex-1 min-w-0"><p className="font-semibold text-white text-sm">{ad.title}</p><p className="text-white/70 truncate text-xs">{ad.description}</p></div>
        <span className="text-[#00d395] text-xs font-semibold">{ad.link_text} →</span>
      </div>
    </div>
  )

  const CoinCard = ({ coin }: { coin: AnalyzedCoin }) => {
    const isPro = profile?.plan !== 'free'
    const isFavorited = favorites.some(f => f.coin_id === coin.id)
    return (
      <div className={`${theme === 'dark' ? 'bg-[#1a1a2e]' : 'bg-white'} rounded-2xl p-5 border cursor-pointer hover:border-[#00d395]/50 transition-all relative ${coin.signal === 'strong_buy' || coin.signal === 'buy' ? 'border-[#00d395]/30' : coin.signal === 'hold' ? 'border-yellow-500/30' : 'border-[#ff6b6b]/30'}`} onClick={() => { setSelectedCoin(coin); setShowDetail(true) }}>
        <button onClick={(e) => { e.stopPropagation(); toggleFavorite(coin) }} className={`absolute top-3 right-3 text-xl ${isFavorited ? 'text-yellow-400' : 'text-white/30 hover:text-yellow-400'}`}>{isFavorited ? '★' : '☆'}</button>
        <div className="flex justify-between items-start mb-4 pr-8">
          <div><div className="flex items-center gap-2"><span className={`text-xl font-bold ${currentColors.text}`}>{coin.symbol.toUpperCase()}</span><span className={`text-xs px-2 py-0.5 rounded ${coin.scores.total >= 95 ? 'bg-[#00d395]/20 text-[#00d395]' : coin.scores.total >= 70 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-[#ff6b6b]/20 text-[#ff6b6b]'}`}>{coin.scores.total}/140</span></div><p className={currentColors.textSecondary + ' text-sm'}>{coin.name}</p></div>
          <SignalBadge signal={coin.signal} />
        </div>
        <div className="mb-4"><p className="text-2xl font-bold text-[#00d395]">${coin.current_price.toLocaleString(undefined, { maximumFractionDigits: 6 })}</p><p className={`text-sm ${coin.price_change_percentage_24h >= 0 ? 'text-[#00d395]' : 'text-[#ff6b6b]'}`}>{coin.price_change_percentage_24h >= 0 ? '▲' : '▼'} {Math.abs(coin.price_change_percentage_24h || 0).toFixed(2)}%</p></div>
        {isPro ? (
          <div className={`${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-3 space-y-2`}>
            <div className="flex justify-between"><span className={currentColors.textSecondary + ' text-sm'}>진입가</span><span className="text-[#00d395] font-semibold">${coin.entry_price.toLocaleString(undefined, { maximumFractionDigits: 4 })}</span></div>
            <div className="flex justify-between"><span className={currentColors.textSecondary + ' text-sm'}>목표가</span><span className="text-blue-400 font-semibold">${coin.target_price.toLocaleString(undefined, { maximumFractionDigits: 4 })}</span></div>
            <div className="flex justify-between"><span className={currentColors.textSecondary + ' text-sm'}>손절가</span><span className="text-[#ff6b6b] font-semibold">${coin.stop_loss.toLocaleString(undefined, { maximumFractionDigits: 4 })}</span></div>
            <div className={`flex justify-between pt-2 border-t ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}><span className={currentColors.textSecondary + ' text-sm'}>손익비</span><span className="text-yellow-400 font-bold">{coin.risk_reward}</span></div>
          </div>
        ) : (<div className={`${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-4 text-center`}><p className={currentColors.textSecondary + ' text-sm'}>🔒 PRO 전용</p></div>)}
        <button className="w-full mt-3 py-2 text-sm text-[#00d395] hover:bg-[#00d395]/10 rounded-lg">상세 분석 →</button>
      </div>
    )
  }

  // 로딩 화면
  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-[#0a0a14]' : 'bg-gray-100'}`}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#00d395] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className={currentColors.text}>로딩 중...</p>
        </div>
      </div>
    )
  }

  const sidebarAds = adSlots.filter(ad => ad.position === 'sidebar')
  const ownAds = sidebarAds.filter(ad => ad.ad_type === 'own')
  const sponsoredAds = sidebarAds.filter(ad => ad.ad_type === 'sponsored')

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#0a0a14]' : 'bg-gray-100'} ${currentColors.text}`}>
      {/* 헤더 */}
      <header className={`border-b ${theme === 'dark' ? 'border-white/10 bg-[#0a0a14]/95' : 'border-gray-200 bg-white/95'} sticky top-0 backdrop-blur z-40`}>
        <div className="max-w-[1600px] mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-xl font-bold">🚀 크립토 대시보드 PRO</Link>
              {profile?.plan !== 'free' && <span className="bg-[#00d395] text-black px-2 py-1 rounded text-xs font-bold">{profile?.plan?.toUpperCase()}</span>}
            </div>
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'}`}>
                <span className="text-sm">☀️</span>
                <button type="button" onClick={toggleTheme} className={`w-12 h-6 rounded-full relative ${theme === 'dark' ? 'bg-[#00d395]' : 'bg-gray-400'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${theme === 'dark' ? 'left-7' : 'left-1'}`} /></button>
                <span className="text-sm">🌙</span>
              </div>
              <div className={`text-sm ${currentColors.textSecondary}`}>{lastUpdate.toLocaleTimeString('ko-KR')} | <span className="text-[#00d395]">{countdown}초</span></div>
              <span className={currentColors.textSecondary}>{profile?.nickname || user?.email?.split('@')[0]}</span>
              <Link href="/pricing" className="text-sm text-[#00d395]">요금제</Link>
              <button type="button" onClick={() => supabase.auth.signOut()} className={`text-sm ${currentColors.textSecondary}`}>로그아웃</button>
            </div>
          </div>
        </div>
      </header>

      {/* 탭 */}
      <div className={`border-b ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}>
        <div className="max-w-[1600px] mx-auto px-4">
          <div className="flex gap-2 py-3">
            {[{ id: 'dashboard', label: '📊 대시보드' }, { id: 'alerts', label: '🔔 알림 설정' }, { id: 'portfolio', label: '💼 포트폴리오' }, { id: 'report', label: '📈 리포트' }].map(tab => (
              <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id as any)} className={`px-5 py-2.5 rounded-xl font-semibold transition ${activeTab === tab.id ? 'bg-[#00d395] text-black' : `${theme === 'dark' ? 'bg-white/5 text-white/70 hover:bg-white/10' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}`}>{tab.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* 메인 */}
      <div className="max-w-[1600px] mx-auto px-4 py-8">
        {activeTab === 'dashboard' && (
          <div className="flex gap-6">
            <main className="flex-1 min-w-0">
              {profile?.plan !== 'free' && (
                <div className="mb-8 flex gap-3">
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder="코인명 입력 (예: doge)" className={`flex-1 ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'} border rounded-xl px-4 py-3 focus:outline-none focus:border-[#00d395]`} />
                  <button type="button" onClick={handleSearch} disabled={searchLoading} className="bg-[#00d395] text-black px-8 py-3 rounded-xl font-semibold">{searchLoading ? '검색 중...' : '🔍 분석'}</button>
                </div>
              )}
              {searchResult && <div className="mb-8"><h2 className={`text-xl font-bold mb-4 ${currentColors.text}`}>🔍 검색 결과</h2><div className="max-w-md"><CoinCard coin={searchResult} /></div></div>}
              <section className="mb-10"><h2 className={`text-xl font-bold mb-4 ${currentColors.text}`}>🔥 핵심 코인</h2><div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">{coreCoins.map(coin => <CoinCard key={coin.id} coin={coin} />)}</div></section>
              {profile?.plan !== 'free' ? (
                <section className="mb-10"><h2 className={`text-xl font-bold mb-4 ${currentColors.text}`}>📈 상승 코인 TOP 6 <span className="bg-[#00d395] text-black px-2 py-0.5 rounded text-xs">PRO</span></h2><div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{topGainers.map(coin => <CoinCard key={coin.id} coin={coin} />)}</div></section>
              ) : (
                <section className="mb-10"><div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-2xl text-center py-12 px-6"><h2 className={`text-2xl font-bold mb-4 ${currentColors.text}`}>🔒 PRO 기능</h2><Link href="/pricing" className="bg-[#00d395] text-black px-8 py-3 rounded-xl font-semibold inline-block">업그레이드 →</Link></div></section>
              )}
              <section><h2 className={`text-xl font-bold mb-4 ${currentColors.text}`}>📊 시장 요약</h2><div className={`${theme === 'dark' ? 'bg-[#1a1a2e]' : 'bg-white'} rounded-2xl p-6 border ${currentColors.cardBorder}`}><div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center"><div><p className={`${currentColors.textSecondary} text-sm mb-1`}>분석 코인</p><p className={`text-2xl font-bold ${currentColors.text}`}>{coreCoins.length + topGainers.length}</p></div><div><p className={`${currentColors.textSecondary} text-sm mb-1`}>매수</p><p className="text-2xl font-bold text-[#00d395]">{[...coreCoins, ...topGainers].filter(c => c.signal === 'buy' || c.signal === 'strong_buy').length}</p></div><div><p className={`${currentColors.textSecondary} text-sm mb-1`}>관망</p><p className="text-2xl font-bold text-yellow-400">{[...coreCoins, ...topGainers].filter(c => c.signal === 'hold').length}</p></div><div><p className={`${currentColors.textSecondary} text-sm mb-1`}>매도</p><p className="text-2xl font-bold text-[#ff6b6b]">{[...coreCoins, ...topGainers].filter(c => c.signal === 'sell' || c.signal === 'strong_sell').length}</p></div></div></div></section>
            </main>
            <aside className="hidden xl:block w-72 flex-shrink-0"><div className="sticky top-24 space-y-6"><div><h3 className={`text-lg font-bold mb-3 ${currentColors.text}`}>📢 소통 채널</h3><div className="space-y-2">{ownAds.map(ad => <AdCard key={ad.id} ad={ad} />)}</div></div>{sponsoredAds.length > 0 && <div className={`border-t ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'} pt-6`}><h4 className={`text-sm ${currentColors.textSecondary} mb-3`}>💎 파트너</h4><div className="space-y-2">{sponsoredAds.map(ad => <AdCard key={ad.id} ad={ad} />)}</div></div>}</div></aside>
          </div>
        )}

        {activeTab === 'alerts' && alertSettings && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`${theme === 'dark' ? 'bg-[#1a1a2e]' : 'bg-white'} rounded-2xl p-6 border ${currentColors.cardBorder}`}><h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>🪙 코인 선택</h3><input type="text" placeholder="코인 검색..." onChange={(e) => setCoinSearchQuery(e.target.value)} className={`w-full p-3 mb-4 rounded-xl border ${currentColors.cardBorder} ${theme === 'dark' ? 'bg-white/5 text-white' : 'bg-gray-50'}`} /><div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto">{filteredCoins.map(coin => (<button key={coin} type="button" onClick={() => { const updated = alertSettings.selected_coins.includes(coin) ? alertSettings.selected_coins.filter(c => c !== coin) : [...alertSettings.selected_coins, coin]; setAlertSettings({ ...alertSettings, selected_coins: updated }) }} className={`px-4 py-2 rounded-full text-sm font-semibold transition ${alertSettings.selected_coins.includes(coin) ? 'bg-[#00d395] text-black' : `${theme === 'dark' ? 'bg-white/10 text-white/70' : 'bg-gray-100'}`}`}>{coin}</button>))}</div></div>
            <div className={`${theme === 'dark' ? 'bg-[#1a1a2e]' : 'bg-white'} rounded-2xl p-6 border ${currentColors.cardBorder}`}><h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>🎯 점수 임계값</h3><div className="flex items-center gap-4 mb-4"><input type="range" min="50" max="130" value={sliderValue} onChange={(e) => setSliderValue(parseInt(e.target.value))} className="flex-1 h-3 rounded-full appearance-none cursor-pointer" style={{ background: `linear-gradient(to right, #00d395 ${((sliderValue - 50) / 80) * 100}%, ${theme === 'dark' ? '#333' : '#ddd'} ${((sliderValue - 50) / 80) * 100}%)` }} /><span className="bg-[#00d395] text-black px-4 py-2 rounded-xl font-bold text-xl">{sliderValue}/140</span></div><input type="number" min="50" max="130" value={sliderValue} onChange={(e) => setSliderValue(Math.min(130, Math.max(50, parseInt(e.target.value) || 50)))} className={`w-24 p-2 rounded-lg border ${currentColors.cardBorder} ${theme === 'dark' ? 'bg-white/5 text-white' : 'bg-gray-50'} text-center`} /></div>
            <div className={`${theme === 'dark' ? 'bg-[#1a1a2e]' : 'bg-white'} rounded-2xl p-6 border ${currentColors.cardBorder}`}><h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>⏰ 시간대</h3><div className="space-y-3">{[{ key: 'time_morning', label: '🌅 아침' }, { key: 'time_afternoon', label: '☀️ 오후' }, { key: 'time_evening', label: '🌆 저녁' }, { key: 'time_night', label: '🌙 심야' }].map(item => (<div key={item.key} onClick={() => setAlertSettings({ ...alertSettings, [item.key]: !alertSettings[item.key as keyof AlertSettings] })} className={`flex justify-between items-center p-4 rounded-xl cursor-pointer ${alertSettings[item.key as keyof AlertSettings] ? 'bg-[#00d395]/10 border-2 border-[#00d395]' : `${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}`}><span className={currentColors.text}>{item.label}</span><span>{alertSettings[item.key as keyof AlertSettings] ? '✓' : ''}</span></div>))}</div></div>
            <div className={`${theme === 'dark' ? 'bg-[#1a1a2e]' : 'bg-white'} rounded-2xl p-6 border ${currentColors.cardBorder}`}><h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>📬 알림 유형</h3><div className="space-y-3">{[{ key: 'alert_signal', label: '🚨 AI 시그널' }, { key: 'alert_score_change', label: '📊 점수 변동' }, { key: 'alert_price', label: '💰 가격 알림' }].map(item => (<div key={item.key} onClick={() => setAlertSettings({ ...alertSettings, [item.key]: !alertSettings[item.key as keyof AlertSettings] })} className={`flex justify-between items-center p-4 rounded-xl cursor-pointer ${alertSettings[item.key as keyof AlertSettings] ? 'bg-[#00d395]/10 border-2 border-[#00d395]' : `${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}`}><span className={currentColors.text}>{item.label}</span><span>{alertSettings[item.key as keyof AlertSettings] ? '✓' : ''}</span></div>))}</div></div>
            <div className="col-span-full"><button type="button" onClick={saveAlertSettings} disabled={settingsSaving} className="w-full bg-[#00d395] text-black py-4 rounded-xl font-bold text-lg">{settingsSaving ? '저장 중...' : '💾 설정 저장'}</button></div>
          </div>
        )}

        {activeTab === 'portfolio' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">{(() => { const stats = calculatePortfolioStats(); return [{ label: '총 포지션', value: stats.total, icon: '📋' }, { label: '활성', value: stats.active, icon: '🟢', color: 'text-[#00d395]' }, { label: '승률', value: `${stats.winRate}%`, icon: '🎯', color: 'text-[#00d395]' }, { label: '실현 수익', value: `${stats.totalPnL}%`, icon: '💰', color: parseFloat(stats.totalPnL) >= 0 ? 'text-[#00d395]' : 'text-[#ff6b6b]' }, { label: '승/패', value: `${stats.wins}/${stats.losses}`, icon: '📊' }].map((stat, idx) => (<div key={idx} className={`${theme === 'dark' ? 'bg-[#1a1a2e]' : 'bg-white'} rounded-xl p-4 border ${currentColors.cardBorder} text-center`}><div className="text-2xl mb-2">{stat.icon}</div><div className={`text-2xl font-bold ${stat.color || currentColors.text}`}>{stat.value}</div><div className={`text-sm ${currentColors.textSecondary}`}>{stat.label}</div></div>)) })()}</div>
            <div className={`${theme === 'dark' ? 'bg-[#1a1a2e]' : 'bg-white'} rounded-2xl p-6 border ${currentColors.cardBorder}`}><h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>➕ 새 포지션</h3><div className="grid grid-cols-2 md:grid-cols-6 gap-3"><div className="relative" ref={coinDropdownRef}><label className={`block text-sm ${currentColors.textSecondary} mb-1`}>코인</label><button type="button" onClick={() => setShowCoinDropdown(!showCoinDropdown)} className={`w-full p-3 rounded-xl border ${currentColors.cardBorder} ${theme === 'dark' ? 'bg-white/5 text-white' : 'bg-gray-50'} text-left flex justify-between`}><span>{positionCoin}</span><span>▼</span></button>{showCoinDropdown && <div className={`absolute z-50 w-full mt-1 rounded-xl border ${currentColors.cardBorder} ${theme === 'dark' ? 'bg-[#1a1a2e]' : 'bg-white'} shadow-lg max-h-60 overflow-y-auto`}>{allCoins.map(coin => (<button key={coin} type="button" onClick={() => { setPositionCoin(coin); setShowCoinDropdown(false) }} className={`w-full px-4 py-3 text-left hover:bg-[#00d395]/20 ${currentColors.text}`}>{coin}</button>))}</div>}</div><div><label className={`block text-sm ${currentColors.textSecondary} mb-1`}>방향</label><div className="flex gap-1"><button type="button" onClick={() => setPositionType('LONG')} className={`flex-1 p-3 rounded-l-xl ${positionType === 'LONG' ? 'bg-[#00d395] text-black' : theme === 'dark' ? 'bg-white/5 text-white/70' : 'bg-gray-100'}`}>🟢</button><button type="button" onClick={() => setPositionType('SHORT')} className={`flex-1 p-3 rounded-r-xl ${positionType === 'SHORT' ? 'bg-[#ff6b6b] text-white' : theme === 'dark' ? 'bg-white/5 text-white/70' : 'bg-gray-100'}`}>🔴</button></div></div><div><label className={`block text-sm ${currentColors.textSecondary} mb-1`}>진입가</label><input ref={entryRef} type="text" inputMode="decimal" placeholder="0.00" className={`w-full p-3 rounded-xl border ${currentColors.cardBorder} ${theme === 'dark' ? 'bg-white/5 text-white' : 'bg-gray-50'}`} /></div><div><label className={`block text-sm ${currentColors.textSecondary} mb-1`}>목표가</label><input ref={targetRef} type="text" inputMode="decimal" placeholder="0.00" className={`w-full p-3 rounded-xl border ${currentColors.cardBorder} ${theme === 'dark' ? 'bg-white/5 text-white' : 'bg-gray-50'}`} /></div><div><label className={`block text-sm ${currentColors.textSecondary} mb-1`}>손절가</label><input ref={stopRef} type="text" inputMode="decimal" placeholder="0.00" className={`w-full p-3 rounded-xl border ${currentColors.cardBorder} ${theme === 'dark' ? 'bg-white/5 text-white' : 'bg-gray-50'}`} /></div><div className="flex items-end"><button type="button" onClick={addPosition} className="w-full bg-[#00d395] text-black p-3 rounded-xl font-bold">추가</button></div></div></div>
            <div className={`${theme === 'dark' ? 'bg-[#1a1a2e]' : 'bg-white'} rounded-2xl p-6 border ${currentColors.cardBorder}`}><h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>📋 포지션 목록</h3><div className="overflow-x-auto"><table className="w-full"><thead><tr className={`border-b ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}>{['코인', '방향', '진입가', '목표가', '손절가', '상태', '액션'].map(h => (<th key={h} className={`text-left p-3 text-sm ${currentColors.textSecondary}`}>{h}</th>))}</tr></thead><tbody>{portfolioPositions.length === 0 ? (<tr><td colSpan={7} className={`text-center p-8 ${currentColors.textSecondary}`}>포지션 없음</td></tr>) : portfolioPositions.map(position => (<tr key={position.id} className={`border-b ${theme === 'dark' ? 'border-white/5' : 'border-gray-100'}`}><td className={`p-3 font-bold ${currentColors.text}`}>{position.coin_symbol}</td><td className="p-3"><span className={`px-3 py-1 rounded-full text-xs font-bold ${position.position_type === 'LONG' ? 'bg-[#00d395]/20 text-[#00d395]' : 'bg-[#ff6b6b]/20 text-[#ff6b6b]'}`}>{position.position_type}</span></td><td className={`p-3 ${currentColors.text}`}>${position.entry_price}</td><td className="p-3 text-blue-400">${position.target_price}</td><td className="p-3 text-[#ff6b6b]">${position.stop_loss}</td><td className="p-3"><span className={`px-3 py-1 rounded-full text-xs ${position.status === 'active' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/10 text-white/50'}`}>{position.status}</span></td><td className="p-3">{position.status === 'active' && <button type="button" onClick={() => closePosition(position)} className="px-3 py-1 border border-[#ff6b6b] text-[#ff6b6b] rounded-lg text-sm">종료</button>}</td></tr>))}</tbody></table></div></div>
          </div>
        )}

        {activeTab === 'report' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`${theme === 'dark' ? 'bg-[#1a1a2e]' : 'bg-white'} rounded-2xl p-6 border ${currentColors.cardBorder}`}><h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>📊 주간 리포트</h3>{(() => { const stats = calculatePortfolioStats(); return (<div className="grid grid-cols-2 gap-4 mb-4"><div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}><p className={`text-sm ${currentColors.textSecondary}`}>총 거래</p><p className={`text-3xl font-bold ${currentColors.text}`}>{stats.total}</p></div><div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}><p className={`text-sm ${currentColors.textSecondary}`}>승률</p><p className="text-3xl font-bold text-[#00d395]">{stats.winRate}%</p></div><div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}><p className={`text-sm ${currentColors.textSecondary}`}>승/패</p><p className="text-3xl font-bold"><span className="text-[#00d395]">{stats.wins}</span>/<span className="text-[#ff6b6b]">{stats.losses}</span></p></div><div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}><p className={`text-sm ${currentColors.textSecondary}`}>총 수익률</p><p className={`text-3xl font-bold ${parseFloat(stats.totalPnL) >= 0 ? 'text-[#00d395]' : 'text-[#ff6b6b]'}`}>{stats.totalPnL}%</p></div></div>) })()}<button type="button" onClick={downloadPDF} className="w-full bg-[#00d395] text-black py-3 rounded-xl font-bold">📥 PDF 다운로드</button></div>
            <div className={`${theme === 'dark' ? 'bg-[#1a1a2e]' : 'bg-white'} rounded-2xl p-6 border ${currentColors.cardBorder}`}><h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>📋 통계</h3>{[{ label: '평균 보유 기간', value: '1.5일' }, { label: '평균 손익비', value: '1:1.5' }, { label: '평균 수익률', value: '+2.1%', color: 'text-[#00d395]' }, { label: '평균 손실률', value: '-1.3%', color: 'text-[#ff6b6b]' }].map((item, idx) => (<div key={idx} className={`flex justify-between p-3 border-b ${theme === 'dark' ? 'border-white/10' : 'border-gray-100'}`}><span className={currentColors.textSecondary}>{item.label}</span><span className={`font-bold ${item.color || currentColors.text}`}>{item.value}</span></div>))}</div>
          </div>
        )}
      </div>

      {/* 모달 */}
      {showDetail && selectedCoin && (
        <div className={`fixed inset-0 z-50 ${theme === 'dark' ? 'bg-[#0a0a14]' : 'bg-white'} overflow-y-auto`}>
          <div className={`sticky top-0 ${theme === 'dark' ? 'bg-[#0a0a14] border-white/10' : 'bg-white border-gray-200'} border-b z-10`}><div className="flex justify-between items-center p-4"><div className="flex items-center gap-3"><h2 className={`text-xl font-bold ${currentColors.text}`}>{selectedCoin.symbol.toUpperCase()}</h2><SignalBadge signal={selectedCoin.signal} /></div><button type="button" onClick={() => setShowDetail(false)} className={`${theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'} px-4 py-2 rounded-lg font-semibold ${currentColors.text}`}>✕ 닫기</button></div></div>
          <div className="max-w-2xl mx-auto p-4 pb-20">
            <div className={`${theme === 'dark' ? 'bg-[#1a1a2e]' : 'bg-white'} rounded-2xl p-6 mb-4 border ${currentColors.cardBorder}`}><p className={currentColors.textSecondary}>{selectedCoin.name}</p><p className="text-4xl font-bold text-[#00d395] mb-2">${selectedCoin.current_price.toLocaleString(undefined, { maximumFractionDigits: 6 })}</p><p className={selectedCoin.price_change_percentage_24h >= 0 ? 'text-[#00d395]' : 'text-[#ff6b6b]'}>{selectedCoin.price_change_percentage_24h >= 0 ? '▲' : '▼'} {Math.abs(selectedCoin.price_change_percentage_24h || 0).toFixed(2)}%</p></div>
            <div className={`${theme === 'dark' ? 'bg-[#1a1a2e]' : 'bg-white'} rounded-2xl p-6 mb-4 border ${currentColors.cardBorder}`}><h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>📊 체크리스트 <span className="text-[#00d395]">{selectedCoin.scores.total}/140</span></h3>{profile?.plan !== 'free' ? (<div className="space-y-3"><ScoreBar label="거시환경" score={selectedCoin.scores.macro} max={20} color="bg-blue-500" /><ScoreBar label="ETF/제도권" score={selectedCoin.scores.etf} max={25} color="bg-purple-500" /><ScoreBar label="온체인" score={selectedCoin.scores.onchain} max={25} color="bg-green-500" /><ScoreBar label="AI/메타버스" score={selectedCoin.scores.ai} max={20} color="bg-pink-500" /><ScoreBar label="선물시장" score={selectedCoin.scores.futures} max={20} color="bg-orange-500" /><ScoreBar label="기술적 분석" score={selectedCoin.scores.technical} max={20} color="bg-cyan-500" /><ScoreBar label="전략" score={selectedCoin.scores.strategy} max={10} color="bg-yellow-500" /></div>) : (<div className={`${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-6 text-center`}><p className={currentColors.textSecondary}>🔒 PRO 전용</p><Link href="/pricing" className="bg-[#00d395] text-black px-6 py-2 rounded-xl font-semibold inline-block mt-2">업그레이드</Link></div>)}</div>
            {profile?.plan !== 'free' && (<><div className={`${theme === 'dark' ? 'bg-[#1a1a2e]' : 'bg-white'} rounded-2xl p-6 mb-4 border ${currentColors.cardBorder}`}><h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>💰 매매 전략</h3><div className="grid grid-cols-2 gap-3"><div className="bg-[#00d395]/10 border border-[#00d395]/30 rounded-xl p-4"><p className={currentColors.textSecondary + ' text-sm'}>진입가</p><p className="text-[#00d395] text-xl font-bold">${selectedCoin.entry_price.toLocaleString()}</p></div><div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4"><p className={currentColors.textSecondary + ' text-sm'}>목표가</p><p className="text-blue-400 text-xl font-bold">${selectedCoin.target_price.toLocaleString()}</p></div><div className="bg-[#ff6b6b]/10 border border-[#ff6b6b]/30 rounded-xl p-4"><p className={currentColors.textSecondary + ' text-sm'}>손절가</p><p className="text-[#ff6b6b] text-xl font-bold">${selectedCoin.stop_loss.toLocaleString()}</p></div><div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4"><p className={currentColors.textSecondary + ' text-sm'}>손익비</p><p className="text-yellow-400 text-xl font-bold">{selectedCoin.risk_reward}</p></div></div></div><div className={`${theme === 'dark' ? 'bg-[#1a1a2e]' : 'bg-white'} rounded-2xl p-6 mb-4 border ${currentColors.cardBorder}`}><h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>🤖 AI 코멘트</h3><div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-xl p-4"><p className={theme === 'dark' ? 'text-white/90' : 'text-gray-700'}>{selectedCoin.ai_comment}</p></div></div></>)}
            <button type="button" onClick={() => setShowDetail(false)} className={`w-full py-4 ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'} rounded-xl font-semibold ${currentColors.text}`}>닫기</button>
          </div>
        </div>
      )}

      <style jsx global>{`input[type="range"]::-webkit-slider-thumb{-webkit-appearance:none;width:24px;height:24px;border-radius:50%;background:#00d395;cursor:grab;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)}input[type="range"]::-moz-range-thumb{width:24px;height:24px;border-radius:50%;background:#00d395;cursor:grab;border:3px solid white}`}</style>
    </div>
  )
}
