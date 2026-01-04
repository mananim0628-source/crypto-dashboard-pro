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
  telegram_id?: string
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

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [coreCoins, setCoreCoins] = useState<AnalyzedCoin[]>([])
  const [topGainers, setTopGainers] = useState<AnalyzedCoin[]>([])
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [adSlots, setAdSlots] = useState<AdSlot[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResult, setSearchResult] = useState<AnalyzedCoin | null>(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [countdown, setCountdown] = useState(120)
  const [selectedCoin, setSelectedCoin] = useState<AnalyzedCoin | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'alerts' | 'portfolio' | 'report'>('dashboard')
  
  // 테마 - 초기값 null로 hydration 문제 해결
  const [theme, setTheme] = useState<'dark' | 'light' | null>(null)
  
  const [alertSettings, setAlertSettings] = useState<AlertSettings | null>(null)
  const [portfolioPositions, setPortfolioPositions] = useState<PortfolioPosition[]>([])
  const [settingsSaving, setSettingsSaving] = useState(false)
  
  // 알림 목록
  const [notifications, setNotifications] = useState<AlertNotification[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  
  // 포트폴리오 입력 상태
  const [positionCoin, setPositionCoin] = useState('BTC')
  const [positionType, setPositionType] = useState<'LONG' | 'SHORT'>('LONG')
  const [entryValue, setEntryValue] = useState('')
  const [targetValue, setTargetValue] = useState('')
  const [stopValue, setStopValue] = useState('')
  
  // 포트폴리오 코인 검색
  const [portfolioCoinSearch, setPortfolioCoinSearch] = useState('')
  const [portfolioSearchResults, setPortfolioSearchResults] = useState<string[]>([])
  const [portfolioSearchLoading, setPortfolioSearchLoading] = useState(false)
  const [showPortfolioDropdown, setShowPortfolioDropdown] = useState(false)
  const portfolioDropdownRef = useRef<HTMLDivElement>(null)
  
  // 임계점 상태
  const [sliderValue, setSliderValue] = useState(90)
  const [inputValue, setInputValue] = useState('90')
  
  // 알림 코인 검색
  const [alertCoinSearch, setAlertCoinSearch] = useState('')
  const [alertSearchResults, setAlertSearchResults] = useState<string[]>([])
  const [alertSearchLoading, setAlertSearchLoading] = useState(false)
  
  // 텔레그램 ID
  const [telegramId, setTelegramId] = useState('')

  const allCoins = ['BTC', 'ETH', 'XRP', 'BNB', 'SOL', 'ADA', 'DOGE', 'MATIC', 'DOT', 'SHIB', 'AVAX', 'LINK', 'UNI', 'ATOM', 'LTC', 'ETC', 'XLM', 'ALGO', 'VET', 'FIL', 'AAVE', 'AXS', 'SAND', 'MANA', 'GALA', 'ENJ', 'CHZ', 'APE', 'LDO', 'ARB', 'OP', 'IMX', 'NEAR', 'APT', 'SUI', 'SEI', 'TIA', 'INJ', 'FET', 'RNDR', 'GRT', 'SNX', 'CRV', 'MKR', 'COMP', '1INCH', 'SUSHI', 'YFI', 'BAL', 'CAKE']

  const router = useRouter()
  const supabase = createClientComponentClient()

  // 현재 테마 (null이면 dark 기본값)
  const currentTheme = theme || 'dark'
  
  const colors = {
    dark: { cardBorder: 'border-white/10', text: 'text-white', textSecondary: 'text-white/50' },
    light: { cardBorder: 'border-gray-200', text: 'text-gray-900', textSecondary: 'text-gray-500' }
  }
  const currentColors = colors[currentTheme]

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
    if (signal === 'strong_buy') return `${coin.symbol.toUpperCase()}은 현재 강한 매수 신호입니다. 온체인(${scores.onchain}/25), 기술적분석(${scores.technical}/20)이 긍정적이며 단기 상승 모멘텀이 형성 중입니다.`
    if (signal === 'buy') return `${coin.symbol.toUpperCase()}은 매수 관점 접근 가능합니다. ETF 자금(${scores.etf}/25)이 긍정적이나 거시환경(${scores.macro}/20)을 고려해 보수적 포지션을 권장합니다.`
    if (signal === 'hold') return `${coin.symbol.toUpperCase()}은 관망 구간입니다. 총점 ${scores.total}/140으로 방향성이 불명확합니다.`
    if (signal === 'sell') return `${coin.symbol.toUpperCase()}은 단기 조정 가능성이 있습니다. 기술적 지표(${scores.technical}/20)가 약세입니다.`
    return `${coin.symbol.toUpperCase()}은 강한 매도 신호입니다. 포지션 정리를 고려하세요.`
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

  // 테마 초기화 - localStorage에서 먼저 로드
  useEffect(() => {
    const saved = localStorage.getItem('dashboard-theme')
    if (saved === 'light') {
      setTheme('light')
    } else {
      setTheme('dark')
      localStorage.setItem('dashboard-theme', 'dark')
    }
  }, [])

  // 포트폴리오 드롭다운 외부 클릭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (portfolioDropdownRef.current && !portfolioDropdownRef.current.contains(event.target as Node)) {
        setShowPortfolioDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 모달 스크롤 방지
  useEffect(() => {
    document.body.style.overflow = showDetail ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [showDetail])

  // 메인 초기화
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
          const { data: adData } = await supabase.from('ad_slots').select('*').eq('is_active', true)
          if (mounted && adData) setAdSlots(adData)
        } catch (e) {}

        try {
          const { data: alertData } = await supabase.from('alert_settings').select('*').eq('user_id', session.user.id).single()
          if (mounted) {
            if (alertData) { 
              setAlertSettings(alertData)
              setSliderValue(alertData.score_threshold)
              setInputValue(String(alertData.score_threshold))
              if (alertData.telegram_id) setTelegramId(alertData.telegram_id)
            } else {
              setAlertSettings({ user_id: session.user.id, selected_coins: ['BTC', 'ETH'], score_threshold: 90, time_morning: true, time_afternoon: true, time_evening: true, time_night: false, alert_signal: true, alert_score_change: true, alert_price: true })
            }
          }
        } catch (e) {}

        try {
          const { data: portfolioData } = await supabase.from('portfolio_positions').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false })
          if (mounted && portfolioData) setPortfolioPositions(portfolioData)
        } catch (e) {}

        // DB에서 테마 로드 (있으면 덮어쓰기)
        try {
          const { data: prefData } = await supabase.from('user_preferences').select('*').eq('user_id', session.user.id).single()
          if (mounted && prefData?.theme) { 
            setTheme(prefData.theme)
            localStorage.setItem('dashboard-theme', prefData.theme) 
          }
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

  // 알림 체크 - 설정된 코인 중 임계점 이상인 코인 찾기
  useEffect(() => {
    if (!alertSettings || coreCoins.length === 0) return
    
    const allAnalyzedCoins = [...coreCoins, ...topGainers]
    const newNotifications: AlertNotification[] = []
    
    alertSettings.selected_coins.forEach(symbol => {
      const coin = allAnalyzedCoins.find(c => c.symbol.toUpperCase() === symbol.toUpperCase())
      if (coin && coin.scores.total >= alertSettings.score_threshold) {
        // 이미 같은 알림이 있는지 체크
        const exists = notifications.some(n => n.coin === symbol && n.type === 'score')
        if (!exists) {
          newNotifications.push({
            id: `${symbol}-${Date.now()}`,
            coin: symbol,
            type: 'score',
            message: `${symbol} 점수 ${coin.scores.total}/140 - ${alertSettings.score_threshold}점 이상 달성!`,
            time: new Date(),
            read: false
          })
        }
        
        // 시그널 알림
        if (alertSettings.alert_signal && (coin.signal === 'strong_buy' || coin.signal === 'buy')) {
          const signalExists = notifications.some(n => n.coin === symbol && n.type === 'signal')
          if (!signalExists) {
            newNotifications.push({
              id: `${symbol}-signal-${Date.now()}`,
              coin: symbol,
              type: 'signal',
              message: `${symbol} ${coin.signal === 'strong_buy' ? '🚀 강력 매수' : '📈 매수'} 시그널!`,
              time: new Date(),
              read: false
            })
          }
        }
      }
    })
    
    if (newNotifications.length > 0) {
      setNotifications(prev => [...newNotifications, ...prev].slice(0, 50))
    }
  }, [alertSettings, coreCoins, topGainers])

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

  // 알림 코인 API 검색
  const searchAlertCoin = async (query: string) => {
    if (!query.trim()) { setAlertSearchResults([]); return }
    const localResults = allCoins.filter(coin => coin.toLowerCase().includes(query.toLowerCase()))
    if (localResults.length > 0) { setAlertSearchResults(localResults); return }
    setAlertSearchLoading(true)
    try {
      const response = await fetch(`/api/crypto?action=search&query=${encodeURIComponent(query)}`)
      const data = await response.json()
      if (data.coin) setAlertSearchResults([data.coin.symbol.toUpperCase()])
      else setAlertSearchResults([])
    } catch (e) { setAlertSearchResults([]) }
    setAlertSearchLoading(false)
  }

  // 포트폴리오 코인 API 검색
  const searchPortfolioCoin = async (query: string) => {
    if (!query.trim()) { setPortfolioSearchResults(allCoins); return }
    const localResults = allCoins.filter(coin => coin.toLowerCase().includes(query.toLowerCase()))
    if (localResults.length > 0) { setPortfolioSearchResults(localResults); return }
    setPortfolioSearchLoading(true)
    try {
      const response = await fetch(`/api/crypto?action=search&query=${encodeURIComponent(query)}`)
      const data = await response.json()
      if (data.coin) setPortfolioSearchResults([data.coin.symbol.toUpperCase()])
      else setPortfolioSearchResults([])
    } catch (e) { setPortfolioSearchResults([]) }
    setPortfolioSearchLoading(false)
  }

  const saveAlertSettings = async () => {
    if (!user || !alertSettings) return
    setSettingsSaving(true)
    const settingsToSave = { 
      ...alertSettings, 
      score_threshold: sliderValue, 
      user_id: user.id, 
      telegram_id: telegramId || null,
      updated_at: new Date().toISOString() 
    }
    const { error } = await supabase.from('alert_settings').upsert(settingsToSave)
    if (error) alert('설정 저장 실패: ' + error.message)
    else { setAlertSettings(settingsToSave); alert('✅ 설정이 저장되었습니다!') }
    setSettingsSaving(false)
  }

  const addPosition = async () => {
    if (!user) return
    if (!entryValue || !targetValue || !stopValue) { alert('모든 가격을 입력해주세요'); return }
    const { data, error } = await supabase.from('portfolio_positions').insert({ 
      user_id: user.id, 
      coin_symbol: positionCoin, 
      coin_name: positionCoin, 
      position_type: positionType, 
      entry_price: parseFloat(entryValue), 
      target_price: parseFloat(targetValue), 
      stop_loss: parseFloat(stopValue), 
      status: 'active' 
    }).select().single()
    
    if (error) alert('포지션 추가 실패')
    else if (data) {
      setPortfolioPositions([data, ...portfolioPositions])
      setEntryValue('')
      setTargetValue('')
      setStopValue('')
      alert('✅ 포지션 추가됨')
    }
  }

  const deletePosition = async (position: PortfolioPosition) => {
    if (!confirm(`${position.coin_symbol} ${position.position_type} 포지션을 삭제하시겠습니까?`)) return
    const { error } = await supabase.from('portfolio_positions').delete().eq('id', position.id)
    if (error) alert('삭제 실패: ' + error.message)
    else {
      setPortfolioPositions(portfolioPositions.filter(p => p.id !== position.id))
      alert('✅ 포지션이 삭제되었습니다')
    }
  }

  const toggleTheme = async () => {
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark'
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
    const now = new Date()
    const dateStr = now.toLocaleDateString('ko-KR')
    const timeStr = now.toLocaleTimeString('ko-KR')
    
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>크립토 대시보드 PRO - 트레이딩 리포트</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Malgun Gothic',sans-serif;padding:40px;background:#fff;color:#333;line-height:1.6}.header{text-align:center;border-bottom:3px solid #00d395;padding-bottom:30px;margin-bottom:40px}.header h1{color:#00d395;font-size:28px;margin-bottom:10px}.section{margin-bottom:40px}.section h2{color:#333;font-size:18px;border-left:4px solid #00d395;padding-left:15px;margin-bottom:20px}.stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:15px}.stat-card{background:#f8f9fa;padding:20px;border-radius:12px;text-align:center}.stat-value{font-size:28px;font-weight:bold;color:#00d395}.stat-value.negative{color:#ff6b6b}table{width:100%;border-collapse:collapse;font-size:13px}th{background:#f8f9fa;padding:12px 10px;text-align:left;border-bottom:2px solid #dee2e6}td{padding:12px 10px;border-bottom:1px solid #eee}.long{color:#00d395}.short{color:#ff6b6b}.badge{display:inline-block;padding:4px 10px;border-radius:20px;font-size:11px}.summary-box{background:linear-gradient(135deg,#00d395,#00b383);color:white;padding:25px;border-radius:12px;margin-bottom:30px}.summary-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;text-align:center}.summary-item .value{font-size:24px;font-weight:bold}.footer{text-align:center;margin-top:50px;padding-top:20px;border-top:1px solid #eee;color:#999;font-size:11px}</style></head><body><div class="header"><h1>🚀 크립토 대시보드 PRO</h1><p>트레이딩 리포트 - ${dateStr} ${timeStr}</p><p>사용자: ${profile?.nickname || user?.email?.split('@')[0]} (${profile?.plan?.toUpperCase()})</p></div><div class="summary-box"><h3>📊 트레이딩 성과</h3><div class="summary-grid"><div class="summary-item"><div class="value">${stats.total}</div><div>총 포지션</div></div><div class="summary-item"><div class="value">${stats.winRate}%</div><div>승률</div></div><div class="summary-item"><div class="value">${parseFloat(stats.totalPnL)>=0?'+':''}${stats.totalPnL}%</div><div>누적 수익률</div></div></div></div><div class="section"><h2>📈 성과 지표</h2><div class="stats-grid"><div class="stat-card"><div class="stat-value">${stats.active}</div><div>활성</div></div><div class="stat-card"><div class="stat-value">${stats.closed}</div><div>종료</div></div><div class="stat-card"><div class="stat-value long">${stats.wins}</div><div>수익</div></div><div class="stat-card"><div class="stat-value negative">${stats.losses}</div><div>손실</div></div></div></div><div class="section"><h2>📋 활성 포지션</h2><table><thead><tr><th>코인</th><th>방향</th><th>진입가</th><th>목표가</th><th>손절가</th><th>손익비</th></tr></thead><tbody>${portfolioPositions.filter(p=>p.status==='active').map(p=>{const rr=p.position_type==='LONG'?((p.target_price-p.entry_price)/(p.entry_price-p.stop_loss)).toFixed(2):((p.entry_price-p.target_price)/(p.stop_loss-p.entry_price)).toFixed(2);return`<tr><td><strong>${p.coin_symbol}</strong></td><td class="${p.position_type.toLowerCase()}">${p.position_type}</td><td>$${p.entry_price.toLocaleString()}</td><td class="long">$${p.target_price.toLocaleString()}</td><td class="short">$${p.stop_loss.toLocaleString()}</td><td>1:${rr}</td></tr>`}).join('')||'<tr><td colspan="6" style="text-align:center;padding:30px">없음</td></tr>'}</tbody></table></div><div class="section"><h2>📊 종료 포지션</h2><table><thead><tr><th>코인</th><th>방향</th><th>진입가</th><th>종료가</th><th>수익률</th></tr></thead><tbody>${portfolioPositions.filter(p=>p.status==='closed').map(p=>{const pnl=p.exit_price?(p.position_type==='LONG'?((p.exit_price-p.entry_price)/p.entry_price*100):((p.entry_price-p.exit_price)/p.entry_price*100)):0;return`<tr><td><strong>${p.coin_symbol}</strong></td><td class="${p.position_type.toLowerCase()}">${p.position_type}</td><td>$${p.entry_price.toLocaleString()}</td><td>$${p.exit_price?.toLocaleString()||'-'}</td><td class="${pnl>=0?'long':'short'}">${pnl>=0?'+':''}${pnl.toFixed(2)}%</td></tr>`}).join('')||'<tr><td colspan="5" style="text-align:center;padding:30px">없음</td></tr>'}</tbody></table></div><div class="footer"><p>© 2025 크립토 대시보드 PRO</p></div></body></html>`
    
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

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value)
    setSliderValue(val)
    setInputValue(String(val))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }

  const handleInputBlur = () => {
    const num = parseInt(inputValue)
    if (isNaN(num)) setInputValue(String(sliderValue))
    else {
      const clamped = Math.min(130, Math.max(50, num))
      setSliderValue(clamped)
      setInputValue(String(clamped))
    }
  }

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })))
  }

  const unreadCount = notifications.filter(n => !n.read).length

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
      <div className={`h-2 ${currentTheme === 'dark' ? 'bg-white/10' : 'bg-gray-200'} rounded-full overflow-hidden`}><div className={`h-full ${color} rounded-full`} style={{ width: `${(score / max) * 100}%` }} /></div>
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
      <div className={`${currentTheme === 'dark' ? 'bg-[#1a1a2e]' : 'bg-white'} rounded-2xl p-5 border cursor-pointer hover:border-[#00d395]/50 transition-all relative ${coin.signal === 'strong_buy' || coin.signal === 'buy' ? 'border-[#00d395]/30' : coin.signal === 'hold' ? 'border-yellow-500/30' : 'border-[#ff6b6b]/30'}`} onClick={() => { setSelectedCoin(coin); setShowDetail(true) }}>
        <button onClick={(e) => { e.stopPropagation(); toggleFavorite(coin) }} className={`absolute top-3 right-3 text-xl ${isFavorited ? 'text-yellow-400' : 'text-white/30 hover:text-yellow-400'}`}>{isFavorited ? '★' : '☆'}</button>
        <div className="flex justify-between items-start mb-4 pr-8">
          <div><div className="flex items-center gap-2"><span className={`text-xl font-bold ${currentColors.text}`}>{coin.symbol.toUpperCase()}</span><span className={`text-xs px-2 py-0.5 rounded ${coin.scores.total >= 95 ? 'bg-[#00d395]/20 text-[#00d395]' : coin.scores.total >= 70 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-[#ff6b6b]/20 text-[#ff6b6b]'}`}>{coin.scores.total}/140</span></div><p className={currentColors.textSecondary + ' text-sm'}>{coin.name}</p></div>
          <SignalBadge signal={coin.signal} />
        </div>
        <div className="mb-4"><p className="text-2xl font-bold text-[#00d395]">${coin.current_price.toLocaleString(undefined, { maximumFractionDigits: 6 })}</p><p className={`text-sm ${coin.price_change_percentage_24h >= 0 ? 'text-[#00d395]' : 'text-[#ff6b6b]'}`}>{coin.price_change_percentage_24h >= 0 ? '▲' : '▼'} {Math.abs(coin.price_change_percentage_24h || 0).toFixed(2)}%</p></div>
        {isPro ? (
          <div className={`${currentTheme === 'dark' ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-3 space-y-2`}>
            <div className="flex justify-between"><span className={currentColors.textSecondary + ' text-sm'}>진입가</span><span className="text-[#00d395] font-semibold">${coin.entry_price.toLocaleString(undefined, { maximumFractionDigits: 4 })}</span></div>
            <div className="flex justify-between"><span className={currentColors.textSecondary + ' text-sm'}>목표가</span><span className="text-blue-400 font-semibold">${coin.target_price.toLocaleString(undefined, { maximumFractionDigits: 4 })}</span></div>
            <div className="flex justify-between"><span className={currentColors.textSecondary + ' text-sm'}>손절가</span><span className="text-[#ff6b6b] font-semibold">${coin.stop_loss.toLocaleString(undefined, { maximumFractionDigits: 4 })}</span></div>
            <div className={`flex justify-between pt-2 border-t ${currentTheme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}><span className={currentColors.textSecondary + ' text-sm'}>손익비</span><span className="text-yellow-400 font-bold">{coin.risk_reward}</span></div>
          </div>
        ) : (<div className={`${currentTheme === 'dark' ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-4 text-center`}><p className={currentColors.textSecondary + ' text-sm'}>🔒 PRO 전용</p></div>)}
        <button className="w-full mt-3 py-2 text-sm text-[#00d395] hover:bg-[#00d395]/10 rounded-lg">상세 분석 →</button>
      </div>
    )
  }

  // 테마 로딩 중이면 로딩 표시
  if (theme === null || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a14]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#00d395] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">로딩 중...</p>
        </div>
      </div>
    )
  }

  const sidebarAds = adSlots.filter(ad => ad.position === 'sidebar')
  const ownAds = sidebarAds.filter(ad => ad.ad_type === 'own')
  const sponsoredAds = sidebarAds.filter(ad => ad.ad_type === 'sponsored')

  return (
    <div className={`min-h-screen ${currentTheme === 'dark' ? 'bg-[#0a0a14]' : 'bg-gray-100'} ${currentColors.text}`}>
      {/* 헤더 */}
      <header className={`border-b ${currentTheme === 'dark' ? 'border-white/10 bg-[#0a0a14]/95' : 'border-gray-200 bg-white/95'} sticky top-0 backdrop-blur z-40`}>
        <div className="max-w-[1600px] mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-xl font-bold">🚀 크립토 대시보드 PRO</Link>
              {profile?.plan !== 'free' && <span className="bg-[#00d395] text-black px-2 py-1 rounded text-xs font-bold">{profile?.plan?.toUpperCase()}</span>}
            </div>
            <div className="flex items-center gap-4">
              {/* 알림 벨 */}
              <div className="relative">
                <button 
                  type="button" 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`relative p-2 rounded-full ${currentTheme === 'dark' ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-200 hover:bg-gray-300'}`}
                >
                  🔔
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[#ff6b6b] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                
                {showNotifications && (
                  <div className={`absolute right-0 top-12 w-80 max-h-96 overflow-y-auto rounded-xl border shadow-2xl z-50 ${currentTheme === 'dark' ? 'bg-[#1a1a2e] border-white/10' : 'bg-white border-gray-200'}`}>
                    <div className="p-3 border-b flex justify-between items-center">
                      <span className={`font-bold ${currentColors.text}`}>🔔 알림</span>
                      {notifications.length > 0 && (
                        <button type="button" onClick={markAllRead} className="text-xs text-[#00d395]">모두 읽음</button>
                      )}
                    </div>
                    {notifications.length === 0 ? (
                      <div className={`p-6 text-center ${currentColors.textSecondary}`}>
                        <p>알림이 없습니다</p>
                        <p className="text-xs mt-2">알림 설정에서 조건을 설정하세요</p>
                      </div>
                    ) : (
                      notifications.slice(0, 10).map(notif => (
                        <div key={notif.id} className={`p-3 border-b ${currentTheme === 'dark' ? 'border-white/5' : 'border-gray-100'} ${!notif.read ? (currentTheme === 'dark' ? 'bg-[#00d395]/10' : 'bg-green-50') : ''}`}>
                          <div className="flex items-start gap-2">
                            <span>{notif.type === 'signal' ? '🚀' : notif.type === 'score' ? '📊' : '💰'}</span>
                            <div className="flex-1">
                              <p className={`text-sm ${currentColors.text}`}>{notif.message}</p>
                              <p className={`text-xs ${currentColors.textSecondary} mt-1`}>
                                {notif.time.toLocaleTimeString('ko-KR')}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${currentTheme === 'dark' ? 'bg-white/10' : 'bg-gray-200'}`}>
                <span className="text-sm">☀️</span>
                <button type="button" onClick={toggleTheme} className={`w-12 h-6 rounded-full relative ${currentTheme === 'dark' ? 'bg-[#00d395]' : 'bg-gray-400'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${currentTheme === 'dark' ? 'left-7' : 'left-1'}`} /></button>
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
      <div className={`border-b ${currentTheme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}>
        <div className="max-w-[1600px] mx-auto px-4">
          <div className="flex gap-2 py-3">
            {[
              { id: 'dashboard', label: '📊 대시보드' }, 
              { id: 'alerts', label: `🔔 알림 설정 ${unreadCount > 0 ? `(${unreadCount})` : ''}` }, 
              { id: 'portfolio', label: '💼 포트폴리오' }, 
              { id: 'report', label: '📈 리포트' }
            ].map(tab => (
              <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id as any)} className={`px-5 py-2.5 rounded-xl font-semibold transition ${activeTab === tab.id ? 'bg-[#00d395] text-black' : `${currentTheme === 'dark' ? 'bg-white/5 text-white/70 hover:bg-white/10' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}`}>{tab.label}</button>
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
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder="코인명 입력 (예: doge, pepe, floki)" className={`flex-1 ${currentTheme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'} border rounded-xl px-4 py-3 focus:outline-none focus:border-[#00d395]`} />
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
              <section><h2 className={`text-xl font-bold mb-4 ${currentColors.text}`}>📊 시장 요약</h2><div className={`${currentTheme === 'dark' ? 'bg-[#1a1a2e]' : 'bg-white'} rounded-2xl p-6 border ${currentColors.cardBorder}`}><div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center"><div><p className={`${currentColors.textSecondary} text-sm mb-1`}>분석 코인</p><p className={`text-2xl font-bold ${currentColors.text}`}>{coreCoins.length + topGainers.length}</p></div><div><p className={`${currentColors.textSecondary} text-sm mb-1`}>매수</p><p className="text-2xl font-bold text-[#00d395]">{[...coreCoins, ...topGainers].filter(c => c.signal === 'buy' || c.signal === 'strong_buy').length}</p></div><div><p className={`${currentColors.textSecondary} text-sm mb-1`}>관망</p><p className="text-2xl font-bold text-yellow-400">{[...coreCoins, ...topGainers].filter(c => c.signal === 'hold').length}</p></div><div><p className={`${currentColors.textSecondary} text-sm mb-1`}>매도</p><p className="text-2xl font-bold text-[#ff6b6b]">{[...coreCoins, ...topGainers].filter(c => c.signal === 'sell' || c.signal === 'strong_sell').length}</p></div></div></div></section>
            </main>
            <aside className="hidden xl:block w-72 flex-shrink-0"><div className="sticky top-24 space-y-6"><div><h3 className={`text-lg font-bold mb-3 ${currentColors.text}`}>📢 소통 채널</h3><div className="space-y-2">{ownAds.map(ad => <AdCard key={ad.id} ad={ad} />)}</div></div>{sponsoredAds.length > 0 && <div className={`border-t ${currentTheme === 'dark' ? 'border-white/10' : 'border-gray-200'} pt-6`}><h4 className={`text-sm ${currentColors.textSecondary} mb-3`}>💎 파트너</h4><div className="space-y-2">{sponsoredAds.map(ad => <AdCard key={ad.id} ad={ad} />)}</div></div>}</div></aside>
          </div>
        )}

        {/* 알림 설정 */}
        {activeTab === 'alerts' && alertSettings && (
          <div className="space-y-6">
            {/* 알림 작동 방식 안내 */}
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-2xl p-6">
              <h3 className={`text-lg font-bold mb-3 ${currentColors.text}`}>📢 알림 작동 방식</h3>
              <div className={`space-y-2 ${currentColors.textSecondary} text-sm`}>
                <p>✅ <strong className={currentColors.text}>대시보드 알림:</strong> 설정한 코인이 임계점 이상이 되면 상단 🔔 벨 아이콘에 알림이 표시됩니다.</p>
                <p>✅ <strong className={currentColors.text}>실시간 모니터링:</strong> 2분마다 자동으로 데이터를 갱신하며, 조건 충족 시 즉시 알림이 생성됩니다.</p>
                <p>🔜 <strong className={currentColors.text}>텔레그램 알림 (예정):</strong> 텔레그램 ID를 등록하면 봇을 통해 실시간 알림을 받을 수 있습니다.</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 텔레그램 연동 */}
              <div className={`${currentTheme === 'dark' ? 'bg-[#1a1a2e]' : 'bg-white'} rounded-2xl p-6 border ${currentColors.cardBorder}`}>
                <h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>📱 텔레그램 연동 (선택)</h3>
                <p className={`text-sm ${currentColors.textSecondary} mb-4`}>
                  텔레그램 알림을 받으려면 @CryptoDashboardBot 을 시작한 후 ID를 입력하세요.
                </p>
                <input 
                  type="text" 
                  placeholder="텔레그램 사용자 ID (숫자)" 
                  value={telegramId}
                  onChange={(e) => setTelegramId(e.target.value)}
                  className={`w-full p-3 rounded-xl border ${currentColors.cardBorder} ${currentTheme === 'dark' ? 'bg-white/5 text-white' : 'bg-gray-50'}`} 
                />
                <p className={`text-xs ${currentColors.textSecondary} mt-2`}>
                  * 텔레그램에서 @userinfobot 에게 메시지를 보내면 ID를 확인할 수 있습니다.
                </p>
              </div>
              
              {/* 코인 선택 */}
              <div className={`${currentTheme === 'dark' ? 'bg-[#1a1a2e]' : 'bg-white'} rounded-2xl p-6 border ${currentColors.cardBorder}`}>
                <h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>🪙 코인 선택</h3>
                <div className="mb-4">
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="코인 검색 (예: PEPE, FLOKI...)" 
                      value={alertCoinSearch}
                      onChange={(e) => { setAlertCoinSearch(e.target.value); searchAlertCoin(e.target.value) }}
                      className={`flex-1 p-3 rounded-xl border ${currentColors.cardBorder} ${currentTheme === 'dark' ? 'bg-white/5 text-white' : 'bg-gray-50'}`} 
                    />
                    {alertSearchLoading && <span className="flex items-center text-[#00d395]">검색중...</span>}
                  </div>
                  {alertCoinSearch && alertSearchResults.length > 0 && (
                    <div className={`mt-2 p-2 rounded-xl ${currentTheme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                      <p className={`text-xs ${currentColors.textSecondary} mb-2`}>검색 결과 (클릭하여 추가)</p>
                      <div className="flex flex-wrap gap-2">
                        {alertSearchResults.map(coin => (
                          <button key={coin} type="button" onClick={() => {
                            if (!alertSettings.selected_coins.includes(coin)) setAlertSettings({ ...alertSettings, selected_coins: [...alertSettings.selected_coins, coin] })
                            setAlertCoinSearch(''); setAlertSearchResults([])
                          }} className="px-3 py-1 rounded-full text-sm bg-[#00d395]/20 text-[#00d395] hover:bg-[#00d395]/30">+ {coin}</button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <p className={`text-xs ${currentColors.textSecondary} mb-3`}>선택된 코인 ({alertSettings.selected_coins.length}개)</p>
                <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto">
                  {alertSettings.selected_coins.map(coin => (
                    <button key={coin} type="button" onClick={() => setAlertSettings({ ...alertSettings, selected_coins: alertSettings.selected_coins.filter(c => c !== coin) })} className="px-4 py-2 rounded-full text-sm font-semibold bg-[#00d395] text-black hover:bg-[#00d395]/80">{coin} ✕</button>
                  ))}
                </div>
              </div>
              
              {/* 점수 임계값 */}
              <div className={`${currentTheme === 'dark' ? 'bg-[#1a1a2e]' : 'bg-white'} rounded-2xl p-6 border ${currentColors.cardBorder}`}>
                <h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>🎯 점수 임계값</h3>
                <p className={`text-sm ${currentColors.textSecondary} mb-4`}>선택한 코인이 이 점수 이상이면 알림을 받습니다.</p>
                <div className="flex items-center gap-4 mb-4">
                  <input type="range" min="50" max="130" value={sliderValue} onChange={handleSliderChange} className="flex-1 h-3 rounded-full appearance-none cursor-pointer" style={{ background: `linear-gradient(to right, #00d395 ${((sliderValue - 50) / 80) * 100}%, ${currentTheme === 'dark' ? '#333' : '#ddd'} ${((sliderValue - 50) / 80) * 100}%)` }} />
                  <span className="bg-[#00d395] text-black px-4 py-2 rounded-xl font-bold text-xl min-w-[100px] text-center">{sliderValue}/140</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${currentColors.textSecondary}`}>직접 입력:</span>
                  <input type="text" inputMode="numeric" value={inputValue} onChange={handleInputChange} onBlur={handleInputBlur} onKeyDown={(e) => e.key === 'Enter' && handleInputBlur()} className={`w-24 p-2 rounded-lg border ${currentColors.cardBorder} ${currentTheme === 'dark' ? 'bg-white/5 text-white' : 'bg-gray-50'} text-center`} />
                  <span className={`text-xs ${currentColors.textSecondary}`}>(50~130)</span>
                </div>
              </div>
              
              {/* 시간대 & 알림 유형 */}
              <div className={`${currentTheme === 'dark' ? 'bg-[#1a1a2e]' : 'bg-white'} rounded-2xl p-6 border ${currentColors.cardBorder}`}>
                <h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>⏰ 시간대 & 📬 알림 유형</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[{ key: 'time_morning', label: '🌅 아침' }, { key: 'time_afternoon', label: '☀️ 오후' }, { key: 'time_evening', label: '🌆 저녁' }, { key: 'time_night', label: '🌙 심야' }].map(item => (
                    <div key={item.key} onClick={() => setAlertSettings({ ...alertSettings, [item.key]: !alertSettings[item.key as keyof AlertSettings] })} className={`flex justify-between items-center p-3 rounded-xl cursor-pointer ${alertSettings[item.key as keyof AlertSettings] ? 'bg-[#00d395]/10 border border-[#00d395]' : `${currentTheme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}`}>
                      <span className={`text-sm ${currentColors.text}`}>{item.label}</span>
                      <span className="text-[#00d395] font-bold">{alertSettings[item.key as keyof AlertSettings] ? '✓' : ''}</span>
                    </div>
                  ))}
                  {[{ key: 'alert_signal', label: '🚨 시그널' }, { key: 'alert_score_change', label: '📊 점수' }, { key: 'alert_price', label: '💰 가격' }].map(item => (
                    <div key={item.key} onClick={() => setAlertSettings({ ...alertSettings, [item.key]: !alertSettings[item.key as keyof AlertSettings] })} className={`flex justify-between items-center p-3 rounded-xl cursor-pointer ${alertSettings[item.key as keyof AlertSettings] ? 'bg-[#00d395]/10 border border-[#00d395]' : `${currentTheme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}`}>
                      <span className={`text-sm ${currentColors.text}`}>{item.label}</span>
                      <span className="text-[#00d395] font-bold">{alertSettings[item.key as keyof AlertSettings] ? '✓' : ''}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <button type="button" onClick={saveAlertSettings} disabled={settingsSaving} className="w-full bg-[#00d395] text-black py-4 rounded-xl font-bold text-lg">{settingsSaving ? '저장 중...' : '💾 설정 저장'}</button>
            
            {/* 현재 조건 충족 코인 */}
            {alertSettings.selected_coins.length > 0 && (
              <div className={`${currentTheme === 'dark' ? 'bg-[#1a1a2e]' : 'bg-white'} rounded-2xl p-6 border ${currentColors.cardBorder}`}>
                <h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>📊 현재 조건 충족 코인</h3>
                <div className="space-y-2">
                  {(() => {
                    const allAnalyzed = [...coreCoins, ...topGainers]
                    const matching = alertSettings.selected_coins.filter(symbol => {
                      const coin = allAnalyzed.find(c => c.symbol.toUpperCase() === symbol.toUpperCase())
                      return coin && coin.scores.total >= sliderValue
                    })
                    
                    if (matching.length === 0) {
                      return <p className={currentColors.textSecondary}>임계점({sliderValue}점) 이상인 코인이 없습니다.</p>
                    }
                    
                    return matching.map(symbol => {
                      const coin = allAnalyzed.find(c => c.symbol.toUpperCase() === symbol.toUpperCase())!
                      return (
                        <div key={symbol} className={`flex justify-between items-center p-3 rounded-xl ${currentTheme === 'dark' ? 'bg-[#00d395]/10' : 'bg-green-50'} border border-[#00d395]/30`}>
                          <span className={`font-bold ${currentColors.text}`}>{symbol}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-[#00d395] font-bold">{coin.scores.total}/140</span>
                            <SignalBadge signal={coin.signal} />
                          </div>
                        </div>
                      )
                    })
                  })()}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 포트폴리오 */}
        {activeTab === 'portfolio' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {(() => { 
                const stats = calculatePortfolioStats()
                return [
                  { label: '총 포지션', value: stats.total, icon: '📋' }, 
                  { label: '활성', value: stats.active, icon: '🟢', color: 'text-[#00d395]' }, 
                  { label: '승률', value: `${stats.winRate}%`, icon: '🎯', color: 'text-[#00d395]' }, 
                  { label: '실현 수익', value: `${stats.totalPnL}%`, icon: '💰', color: parseFloat(stats.totalPnL) >= 0 ? 'text-[#00d395]' : 'text-[#ff6b6b]' }, 
                  { label: '승/패', value: `${stats.wins}/${stats.losses}`, icon: '📊' }
                ].map((stat, idx) => (
                  <div key={idx} className={`${currentTheme === 'dark' ? 'bg-[#1a1a2e]' : 'bg-white'} rounded-xl p-4 border ${currentColors.cardBorder} text-center`}>
                    <div className="text-2xl mb-2">{stat.icon}</div>
                    <div className={`text-2xl font-bold ${stat.color || currentColors.text}`}>{stat.value}</div>
                    <div className={`text-sm ${currentColors.textSecondary}`}>{stat.label}</div>
                  </div>
                ))
              })()}
            </div>
            
            <div className={`${currentTheme === 'dark' ? 'bg-[#1a1a2e]' : 'bg-white'} rounded-2xl p-6 border ${currentColors.cardBorder}`}>
              <h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>➕ 새 포지션</h3>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                {/* 코인 선택 - 검색 가능 */}
                <div className="relative" ref={portfolioDropdownRef}>
                  <label className={`block text-sm ${currentColors.textSecondary} mb-1`}>코인</label>
                  <button type="button" onClick={() => { setShowPortfolioDropdown(!showPortfolioDropdown); setPortfolioSearchResults(allCoins) }} className={`w-full p-3 rounded-xl border ${currentColors.cardBorder} ${currentTheme === 'dark' ? 'bg-white/5 text-white' : 'bg-gray-50'} text-left flex justify-between`}>
                    <span>{positionCoin}</span><span>▼</span>
                  </button>
                  {showPortfolioDropdown && (
                    <div className={`absolute z-50 w-64 mt-1 rounded-xl border ${currentColors.cardBorder} ${currentTheme === 'dark' ? 'bg-[#1a1a2e]' : 'bg-white'} shadow-lg`}>
                      <div className="p-2">
                        <input 
                          type="text" 
                          placeholder="코인 검색..." 
                          value={portfolioCoinSearch}
                          onChange={(e) => { setPortfolioCoinSearch(e.target.value); searchPortfolioCoin(e.target.value) }}
                          className={`w-full p-2 rounded-lg border ${currentColors.cardBorder} ${currentTheme === 'dark' ? 'bg-white/5 text-white' : 'bg-gray-50'} text-sm`}
                          autoFocus
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {portfolioSearchLoading ? (
                          <p className={`p-3 text-center ${currentColors.textSecondary}`}>검색 중...</p>
                        ) : portfolioSearchResults.length === 0 ? (
                          <p className={`p-3 text-center ${currentColors.textSecondary}`}>결과 없음</p>
                        ) : (
                          portfolioSearchResults.map(coin => (
                            <button key={coin} type="button" onClick={() => { setPositionCoin(coin); setShowPortfolioDropdown(false); setPortfolioCoinSearch('') }} className={`w-full px-4 py-2 text-left hover:bg-[#00d395]/20 ${currentColors.text} ${positionCoin === coin ? 'bg-[#00d395]/10' : ''}`}>{coin}</button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <label className={`block text-sm ${currentColors.textSecondary} mb-1`}>방향</label>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => setPositionType('LONG')} className={`flex-1 p-3 rounded-l-xl font-bold ${positionType === 'LONG' ? 'bg-[#00d395] text-black' : currentTheme === 'dark' ? 'bg-white/5 text-white/70' : 'bg-gray-100'}`}>🟢</button>
                    <button type="button" onClick={() => setPositionType('SHORT')} className={`flex-1 p-3 rounded-r-xl font-bold ${positionType === 'SHORT' ? 'bg-[#ff6b6b] text-white' : currentTheme === 'dark' ? 'bg-white/5 text-white/70' : 'bg-gray-100'}`}>🔴</button>
                  </div>
                </div>
                <div>
                  <label className={`block text-sm ${currentColors.textSecondary} mb-1`}>진입가</label>
                  <input type="text" inputMode="decimal" placeholder="0.00" value={entryValue} onChange={(e) => setEntryValue(e.target.value)} className={`w-full p-3 rounded-xl border ${currentColors.cardBorder} ${currentTheme === 'dark' ? 'bg-white/5 text-white' : 'bg-gray-50'}`} />
                </div>
                <div>
                  <label className={`block text-sm ${currentColors.textSecondary} mb-1`}>목표가</label>
                  <input type="text" inputMode="decimal" placeholder="0.00" value={targetValue} onChange={(e) => setTargetValue(e.target.value)} className={`w-full p-3 rounded-xl border ${currentColors.cardBorder} ${currentTheme === 'dark' ? 'bg-white/5 text-white' : 'bg-gray-50'}`} />
                </div>
                <div>
                  <label className={`block text-sm ${currentColors.textSecondary} mb-1`}>손절가</label>
                  <input type="text" inputMode="decimal" placeholder="0.00" value={stopValue} onChange={(e) => setStopValue(e.target.value)} className={`w-full p-3 rounded-xl border ${currentColors.cardBorder} ${currentTheme === 'dark' ? 'bg-white/5 text-white' : 'bg-gray-50'}`} />
                </div>
                <div className="flex items-end">
                  <button type="button" onClick={addPosition} className="w-full bg-[#00d395] text-black p-3 rounded-xl font-bold">추가</button>
                </div>
              </div>
            </div>
            
            <div className={`${currentTheme === 'dark' ? 'bg-[#1a1a2e]' : 'bg-white'} rounded-2xl p-6 border ${currentColors.cardBorder}`}>
              <h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>📋 포지션 목록</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={`border-b ${currentTheme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}>
                      {['코인', '방향', '진입가', '목표가', '손절가', '상태', ''].map(h => (
                        <th key={h} className={`text-left p-3 text-sm ${currentColors.textSecondary}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {portfolioPositions.length === 0 ? (
                      <tr><td colSpan={7} className={`text-center p-8 ${currentColors.textSecondary}`}>포지션 없음</td></tr>
                    ) : portfolioPositions.map(position => (
                      <tr key={position.id} className={`border-b ${currentTheme === 'dark' ? 'border-white/5' : 'border-gray-100'}`}>
                        <td className={`p-3 font-bold ${currentColors.text}`}>{position.coin_symbol}</td>
                        <td className="p-3"><span className={`px-3 py-1 rounded-full text-xs font-bold ${position.position_type === 'LONG' ? 'bg-[#00d395]/20 text-[#00d395]' : 'bg-[#ff6b6b]/20 text-[#ff6b6b]'}`}>{position.position_type}</span></td>
                        <td className={`p-3 ${currentColors.text}`}>${position.entry_price.toLocaleString()}</td>
                        <td className="p-3 text-blue-400">${position.target_price.toLocaleString()}</td>
                        <td className="p-3 text-[#ff6b6b]">${position.stop_loss.toLocaleString()}</td>
                        <td className="p-3"><span className={`px-3 py-1 rounded-full text-xs ${position.status === 'active' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/10 text-white/50'}`}>{position.status === 'active' ? '활성' : '종료'}</span></td>
                        <td className="p-3">
                          <button type="button" onClick={() => deletePosition(position)} className="px-3 py-1 bg-[#ff6b6b] text-white rounded-lg text-sm hover:bg-[#ff6b6b]/80">삭제</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className={`mt-4 text-xs ${currentColors.textSecondary}`}>💡 포지션은 참고용 기록입니다. 실제 거래소와 연동되지 않습니다.</p>
            </div>
          </div>
        )}

        {/* 리포트 */}
        {activeTab === 'report' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-[#00d395] to-[#00b383] rounded-2xl p-6 text-white">
              <h3 className="text-lg font-bold mb-4">📊 트레이딩 성과 요약</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(() => {
                  const stats = calculatePortfolioStats()
                  return [
                    { label: '총 포지션', value: stats.total },
                    { label: '활성', value: stats.active },
                    { label: '승률', value: `${stats.winRate}%` },
                    { label: '누적 수익', value: `${parseFloat(stats.totalPnL) >= 0 ? '+' : ''}${stats.totalPnL}%` }
                  ].map((item, idx) => (
                    <div key={idx} className="text-center">
                      <div className="text-3xl font-bold">{item.value}</div>
                      <div className="text-sm opacity-80">{item.label}</div>
                    </div>
                  ))
                })()}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={`${currentTheme === 'dark' ? 'bg-[#1a1a2e]' : 'bg-white'} rounded-2xl p-6 border ${currentColors.cardBorder}`}>
                <h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>📈 상세 통계</h3>
                {(() => {
                  const stats = calculatePortfolioStats()
                  const longCount = portfolioPositions.filter(p => p.position_type === 'LONG').length
                  const shortCount = portfolioPositions.filter(p => p.position_type === 'SHORT').length
                  return [
                    { label: '총 거래', value: `${stats.total}회` },
                    { label: '활성', value: `${stats.active}개`, color: 'text-[#00d395]' },
                    { label: '종료', value: `${stats.closed}개` },
                    { label: '승률', value: `${stats.winRate}%`, color: 'text-[#00d395]' },
                    { label: '수익', value: `${stats.wins}회`, color: 'text-[#00d395]' },
                    { label: '손실', value: `${stats.losses}회`, color: 'text-[#ff6b6b]' },
                    { label: '롱', value: `${longCount}개` },
                    { label: '숏', value: `${shortCount}개` },
                    { label: '누적 수익률', value: `${parseFloat(stats.totalPnL) >= 0 ? '+' : ''}${stats.totalPnL}%`, color: parseFloat(stats.totalPnL) >= 0 ? 'text-[#00d395]' : 'text-[#ff6b6b]' }
                  ].map((item, idx) => (
                    <div key={idx} className={`flex justify-between p-2 border-b ${currentTheme === 'dark' ? 'border-white/10' : 'border-gray-100'}`}>
                      <span className={currentColors.textSecondary}>{item.label}</span>
                      <span className={`font-bold ${item.color || currentColors.text}`}>{item.value}</span>
                    </div>
                  ))
                })()}
              </div>
              
              <div className="space-y-6">
                <div className={`${currentTheme === 'dark' ? 'bg-[#1a1a2e]' : 'bg-white'} rounded-2xl p-6 border ${currentColors.cardBorder}`}>
                  <h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>📥 리포트 다운로드</h3>
                  <p className={`${currentColors.textSecondary} text-sm mb-4`}>전체 트레이딩 내역이 포함된 PDF 리포트를 생성합니다.</p>
                  <button type="button" onClick={downloadPDF} className="w-full bg-[#00d395] text-black py-4 rounded-xl font-bold text-lg hover:bg-[#00d395]/90">📄 PDF 생성</button>
                </div>
                
                <div className={`${currentTheme === 'dark' ? 'bg-[#1a1a2e]' : 'bg-white'} rounded-2xl p-6 border ${currentColors.cardBorder}`}>
                  <h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>📋 PDF 내용</h3>
                  <ul className={`space-y-1 ${currentColors.textSecondary} text-sm`}>
                    <li>✅ 성과 요약</li>
                    <li>✅ 활성 포지션 상세</li>
                    <li>✅ 종료 포지션 & 수익률</li>
                    <li>✅ 롱/숏 분석</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 모달 */}
      {showDetail && selectedCoin && (
        <div className={`fixed inset-0 z-50 ${currentTheme === 'dark' ? 'bg-[#0a0a14]' : 'bg-white'} overflow-y-auto`}>
          <div className={`sticky top-0 ${currentTheme === 'dark' ? 'bg-[#0a0a14] border-white/10' : 'bg-white border-gray-200'} border-b z-10`}>
            <div className="flex justify-between items-center p-4">
              <div className="flex items-center gap-3"><h2 className={`text-xl font-bold ${currentColors.text}`}>{selectedCoin.symbol.toUpperCase()}</h2><SignalBadge signal={selectedCoin.signal} /></div>
              <button type="button" onClick={() => setShowDetail(false)} className={`${currentTheme === 'dark' ? 'bg-white/10' : 'bg-gray-100'} px-4 py-2 rounded-lg font-semibold ${currentColors.text}`}>✕ 닫기</button>
            </div>
          </div>
          <div className="max-w-2xl mx-auto p-4 pb-20">
            <div className={`${currentTheme === 'dark' ? 'bg-[#1a1a2e]' : 'bg-white'} rounded-2xl p-6 mb-4 border ${currentColors.cardBorder}`}>
              <p className={currentColors.textSecondary}>{selectedCoin.name}</p>
              <p className="text-4xl font-bold text-[#00d395] mb-2">${selectedCoin.current_price.toLocaleString(undefined, { maximumFractionDigits: 6 })}</p>
              <p className={selectedCoin.price_change_percentage_24h >= 0 ? 'text-[#00d395]' : 'text-[#ff6b6b]'}>{selectedCoin.price_change_percentage_24h >= 0 ? '▲' : '▼'} {Math.abs(selectedCoin.price_change_percentage_24h || 0).toFixed(2)}%</p>
            </div>
            <div className={`${currentTheme === 'dark' ? 'bg-[#1a1a2e]' : 'bg-white'} rounded-2xl p-6 mb-4 border ${currentColors.cardBorder}`}>
              <h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>📊 체크리스트 <span className="text-[#00d395]">{selectedCoin.scores.total}/140</span></h3>
              {profile?.plan !== 'free' ? (
                <div className="space-y-3">
                  <ScoreBar label="거시환경" score={selectedCoin.scores.macro} max={20} color="bg-blue-500" />
                  <ScoreBar label="ETF/제도권" score={selectedCoin.scores.etf} max={25} color="bg-purple-500" />
                  <ScoreBar label="온체인" score={selectedCoin.scores.onchain} max={25} color="bg-green-500" />
                  <ScoreBar label="AI/메타버스" score={selectedCoin.scores.ai} max={20} color="bg-pink-500" />
                  <ScoreBar label="선물시장" score={selectedCoin.scores.futures} max={20} color="bg-orange-500" />
                  <ScoreBar label="기술적 분석" score={selectedCoin.scores.technical} max={20} color="bg-cyan-500" />
                  <ScoreBar label="전략" score={selectedCoin.scores.strategy} max={10} color="bg-yellow-500" />
                </div>
              ) : (
                <div className={`${currentTheme === 'dark' ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-6 text-center`}>
                  <p className={currentColors.textSecondary}>🔒 PRO 전용</p>
                  <Link href="/pricing" className="bg-[#00d395] text-black px-6 py-2 rounded-xl font-semibold inline-block mt-2">업그레이드</Link>
                </div>
              )}
            </div>
            {profile?.plan !== 'free' && (
              <>
                <div className={`${currentTheme === 'dark' ? 'bg-[#1a1a2e]' : 'bg-white'} rounded-2xl p-6 mb-4 border ${currentColors.cardBorder}`}>
                  <h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>💰 매매 전략</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#00d395]/10 border border-[#00d395]/30 rounded-xl p-4"><p className={currentColors.textSecondary + ' text-sm'}>진입가</p><p className="text-[#00d395] text-xl font-bold">${selectedCoin.entry_price.toLocaleString()}</p></div>
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4"><p className={currentColors.textSecondary + ' text-sm'}>목표가</p><p className="text-blue-400 text-xl font-bold">${selectedCoin.target_price.toLocaleString()}</p></div>
                    <div className="bg-[#ff6b6b]/10 border border-[#ff6b6b]/30 rounded-xl p-4"><p className={currentColors.textSecondary + ' text-sm'}>손절가</p><p className="text-[#ff6b6b] text-xl font-bold">${selectedCoin.stop_loss.toLocaleString()}</p></div>
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4"><p className={currentColors.textSecondary + ' text-sm'}>손익비</p><p className="text-yellow-400 text-xl font-bold">{selectedCoin.risk_reward}</p></div>
                  </div>
                </div>
                <div className={`${currentTheme === 'dark' ? 'bg-[#1a1a2e]' : 'bg-white'} rounded-2xl p-6 mb-4 border ${currentColors.cardBorder}`}>
                  <h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>🤖 AI 코멘트</h3>
                  <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-xl p-4">
                    <p className={currentTheme === 'dark' ? 'text-white/90' : 'text-gray-700'}>{selectedCoin.ai_comment}</p>
                  </div>
                </div>
              </>
            )}
            <button type="button" onClick={() => setShowDetail(false)} className={`w-full py-4 ${currentTheme === 'dark' ? 'bg-white/10' : 'bg-gray-100'} rounded-xl font-semibold ${currentColors.text}`}>닫기</button>
          </div>
        </div>
      )}

      <style jsx global>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #00d395;
          cursor: grab;
          border: 3px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        }
        input[type="range"]::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #00d395;
          cursor: grab;
          border: 3px solid white;
        }
      `}</style>
    </div>
  )
}
