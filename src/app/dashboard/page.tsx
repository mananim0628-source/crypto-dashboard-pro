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
  
  // 포트폴리오 입력 상태 (탭 이동해도 유지)
  const [positionCoin, setPositionCoin] = useState('BTC')
  const [positionType, setPositionType] = useState<'LONG' | 'SHORT'>('LONG')
  const [entryValue, setEntryValue] = useState('')
  const [targetValue, setTargetValue] = useState('')
  const [stopValue, setStopValue] = useState('')
  
  const [coinSearchQuery, setCoinSearchQuery] = useState('')
  const [showCoinDropdown, setShowCoinDropdown] = useState(false)
  const coinDropdownRef = useRef<HTMLDivElement>(null)
  
  // 임계점 상태
  const [sliderValue, setSliderValue] = useState(90)
  const [inputValue, setInputValue] = useState('90')
  
  // 알림 코인 검색
  const [alertCoinSearch, setAlertCoinSearch] = useState('')
  const [alertSearchResults, setAlertSearchResults] = useState<string[]>([])
  const [alertSearchLoading, setAlertSearchLoading] = useState(false)

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
    if (signal === 'strong_buy') return `${coin.symbol.toUpperCase()}은 현재 강한 매수 신호입니다. 온체인(${scores.onchain}/25), 기술적분석(${scores.technical}/20)이 긍정적이며 단기 상승 모멘텀이 형성 중입니다. 분할 매수를 권장합니다.`
    if (signal === 'buy') return `${coin.symbol.toUpperCase()}은 매수 관점 접근 가능합니다. ETF 자금(${scores.etf}/25)이 긍정적이나 거시환경(${scores.macro}/20)을 고려해 보수적 포지션을 권장합니다.`
    if (signal === 'hold') return `${coin.symbol.toUpperCase()}은 관망 구간입니다. 총점 ${scores.total}/140으로 방향성이 불명확합니다. 주요 지지/저항 돌파 시 재진입을 고려하세요.`
    if (signal === 'sell') return `${coin.symbol.toUpperCase()}은 단기 조정 가능성이 있습니다. 기술적 지표(${scores.technical}/20)가 약세입니다. 손절 라인 엄수를 권장합니다.`
    return `${coin.symbol.toUpperCase()}은 강한 매도 신호입니다. 포지션 정리를 고려하세요. 현재 점수 ${scores.total}/140.`
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
            } else {
              setAlertSettings({ user_id: session.user.id, selected_coins: ['BTC', 'ETH'], score_threshold: 90, time_morning: true, time_afternoon: true, time_evening: true, time_night: false, alert_signal: true, alert_score_change: true, alert_price: true })
            }
          }
        } catch (e) {}

        try {
          const { data: portfolioData } = await supabase.from('portfolio_positions').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false })
          if (mounted && portfolioData) setPortfolioPositions(portfolioData)
        } catch (e) {}

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

  // 알림 코인 API 검색
  const searchAlertCoin = async (query: string) => {
    if (!query.trim()) {
      setAlertSearchResults([])
      return
    }
    
    // 먼저 기존 리스트에서 검색
    const localResults = allCoins.filter(coin => 
      coin.toLowerCase().includes(query.toLowerCase())
    )
    
    if (localResults.length > 0) {
      setAlertSearchResults(localResults)
      return
    }
    
    // API 검색
    setAlertSearchLoading(true)
    try {
      const response = await fetch(`/api/crypto?action=search&query=${encodeURIComponent(query)}`)
      const data = await response.json()
      if (data.coin) {
        setAlertSearchResults([data.coin.symbol.toUpperCase()])
      } else {
        setAlertSearchResults([])
      }
    } catch (e) {
      setAlertSearchResults([])
    }
    setAlertSearchLoading(false)
  }

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

  // 포지션 삭제 (종료 대신)
  const deletePosition = async (position: PortfolioPosition) => {
    if (!confirm(`${position.coin_symbol} ${position.position_type} 포지션을 삭제하시겠습니까?`)) return
    
    const { error } = await supabase.from('portfolio_positions').delete().eq('id', position.id)
    if (error) {
      alert('삭제 실패: ' + error.message)
    } else {
      setPortfolioPositions(portfolioPositions.filter(p => p.id !== position.id))
      alert('✅ 포지션이 삭제되었습니다')
    }
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

  // 상세 PDF 다운로드
  const downloadPDF = () => {
    const stats = calculatePortfolioStats()
    const now = new Date()
    const dateStr = now.toLocaleDateString('ko-KR')
    const timeStr = now.toLocaleTimeString('ko-KR')
    
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>크립토 대시보드 PRO - 트레이딩 리포트</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif; padding: 40px; background: #fff; color: #333; line-height: 1.6; }
    .header { text-align: center; border-bottom: 3px solid #00d395; padding-bottom: 30px; margin-bottom: 40px; }
    .header h1 { color: #00d395; font-size: 28px; margin-bottom: 10px; }
    .header .subtitle { color: #666; font-size: 14px; }
    .header .date { color: #999; font-size: 12px; margin-top: 5px; }
    .section { margin-bottom: 40px; page-break-inside: avoid; }
    .section h2 { color: #333; font-size: 18px; border-left: 4px solid #00d395; padding-left: 15px; margin-bottom: 20px; }
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
    .stat-card { background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 20px; border-radius: 12px; text-align: center; border: 1px solid #dee2e6; }
    .stat-value { font-size: 28px; font-weight: bold; color: #00d395; }
    .stat-value.negative { color: #ff6b6b; }
    .stat-label { color: #666; font-size: 12px; margin-top: 5px; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px; }
    th { background: #f8f9fa; color: #333; font-weight: 600; padding: 12px 10px; text-align: left; border-bottom: 2px solid #dee2e6; }
    td { padding: 12px 10px; border-bottom: 1px solid #eee; }
    tr:hover { background: #f8f9fa; }
    .long { color: #00d395; font-weight: bold; }
    .short { color: #ff6b6b; font-weight: bold; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: bold; }
    .badge-long { background: rgba(0,211,149,0.1); color: #00d395; }
    .badge-short { background: rgba(255,107,107,0.1); color: #ff6b6b; }
    .badge-active { background: rgba(255,193,7,0.1); color: #ffc107; }
    .badge-closed { background: rgba(108,117,125,0.1); color: #6c757d; }
    .summary-box { background: linear-gradient(135deg, #00d395 0%, #00b383 100%); color: white; padding: 25px; border-radius: 12px; margin-bottom: 30px; }
    .summary-box h3 { font-size: 16px; margin-bottom: 15px; }
    .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
    .summary-item { text-align: center; }
    .summary-item .value { font-size: 24px; font-weight: bold; }
    .summary-item .label { font-size: 11px; opacity: 0.9; }
    .analysis-section { background: #f8f9fa; padding: 20px; border-radius: 12px; margin-top: 20px; }
    .analysis-section h4 { color: #333; margin-bottom: 15px; font-size: 14px; }
    .analysis-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
    .analysis-item:last-child { border-bottom: none; }
    .footer { text-align: center; margin-top: 50px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 11px; }
    .watermark { position: fixed; bottom: 20px; right: 20px; opacity: 0.1; font-size: 60px; }
    @media print {
      body { padding: 20px; }
      .section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="watermark">🚀</div>
  
  <div class="header">
    <h1>🚀 크립토 대시보드 PRO</h1>
    <p class="subtitle">AI 기반 암호화폐 트레이딩 리포트</p>
    <p class="date">생성일시: ${dateStr} ${timeStr}</p>
    <p class="date">사용자: ${profile?.nickname || user?.email?.split('@')[0] || 'Unknown'} (${profile?.plan?.toUpperCase() || 'FREE'})</p>
  </div>

  <div class="summary-box">
    <h3>📊 트레이딩 성과 요약</h3>
    <div class="summary-grid">
      <div class="summary-item">
        <div class="value">${stats.total}</div>
        <div class="label">총 포지션</div>
      </div>
      <div class="summary-item">
        <div class="value">${stats.winRate}%</div>
        <div class="label">승률</div>
      </div>
      <div class="summary-item">
        <div class="value">${parseFloat(stats.totalPnL) >= 0 ? '+' : ''}${stats.totalPnL}%</div>
        <div class="label">누적 수익률</div>
      </div>
    </div>
  </div>

  <div class="section">
    <h2>📈 성과 지표</h2>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">${stats.active}</div>
        <div class="stat-label">활성 포지션</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats.closed}</div>
        <div class="stat-label">종료 포지션</div>
      </div>
      <div class="stat-card">
        <div class="stat-value long">${stats.wins}</div>
        <div class="stat-label">수익 거래</div>
      </div>
      <div class="stat-card">
        <div class="stat-value negative">${stats.losses}</div>
        <div class="stat-label">손실 거래</div>
      </div>
    </div>
  </div>

  <div class="section">
    <h2>📋 활성 포지션 상세</h2>
    <table>
      <thead>
        <tr>
          <th>코인</th>
          <th>방향</th>
          <th>진입가</th>
          <th>목표가</th>
          <th>손절가</th>
          <th>예상 손익비</th>
          <th>진입일</th>
        </tr>
      </thead>
      <tbody>
        ${portfolioPositions.filter(p => p.status === 'active').map(p => {
          const riskReward = p.position_type === 'LONG' 
            ? ((p.target_price - p.entry_price) / (p.entry_price - p.stop_loss)).toFixed(2)
            : ((p.entry_price - p.target_price) / (p.stop_loss - p.entry_price)).toFixed(2)
          return `
          <tr>
            <td><strong>${p.coin_symbol}</strong></td>
            <td><span class="badge badge-${p.position_type.toLowerCase()}">${p.position_type}</span></td>
            <td>$${p.entry_price.toLocaleString()}</td>
            <td class="long">$${p.target_price.toLocaleString()}</td>
            <td class="short">$${p.stop_loss.toLocaleString()}</td>
            <td>1:${riskReward}</td>
            <td>${new Date(p.entry_date).toLocaleDateString('ko-KR')}</td>
          </tr>
        `}).join('')}
        ${portfolioPositions.filter(p => p.status === 'active').length === 0 ? '<tr><td colspan="7" style="text-align:center;color:#999;padding:30px;">활성 포지션이 없습니다</td></tr>' : ''}
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>📊 종료된 포지션</h2>
    <table>
      <thead>
        <tr>
          <th>코인</th>
          <th>방향</th>
          <th>진입가</th>
          <th>종료가</th>
          <th>수익률</th>
          <th>결과</th>
        </tr>
      </thead>
      <tbody>
        ${portfolioPositions.filter(p => p.status === 'closed').map(p => {
          const pnl = p.exit_price ? (p.position_type === 'LONG' 
            ? ((p.exit_price - p.entry_price) / p.entry_price * 100)
            : ((p.entry_price - p.exit_price) / p.entry_price * 100)) : 0
          return `
          <tr>
            <td><strong>${p.coin_symbol}</strong></td>
            <td><span class="badge badge-${p.position_type.toLowerCase()}">${p.position_type}</span></td>
            <td>$${p.entry_price.toLocaleString()}</td>
            <td>$${p.exit_price?.toLocaleString() || '-'}</td>
            <td class="${pnl >= 0 ? 'long' : 'short'}">${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}%</td>
            <td><span class="badge ${pnl >= 0 ? 'badge-long' : 'badge-short'}">${pnl >= 0 ? '수익' : '손실'}</span></td>
          </tr>
        `}).join('')}
        ${portfolioPositions.filter(p => p.status === 'closed').length === 0 ? '<tr><td colspan="6" style="text-align:center;color:#999;padding:30px;">종료된 포지션이 없습니다</td></tr>' : ''}
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>📉 트레이딩 분석</h2>
    <div class="analysis-section">
      <h4>상세 통계</h4>
      <div class="analysis-item"><span>총 거래 횟수</span><strong>${stats.total}회</strong></div>
      <div class="analysis-item"><span>승률</span><strong>${stats.winRate}%</strong></div>
      <div class="analysis-item"><span>승리 횟수</span><strong class="long">${stats.wins}회</strong></div>
      <div class="analysis-item"><span>패배 횟수</span><strong class="short">${stats.losses}회</strong></div>
      <div class="analysis-item"><span>누적 수익률</span><strong class="${parseFloat(stats.totalPnL) >= 0 ? 'long' : 'short'}">${parseFloat(stats.totalPnL) >= 0 ? '+' : ''}${stats.totalPnL}%</strong></div>
      <div class="analysis-item"><span>평균 손익비 (목표)</span><strong>1:1.5</strong></div>
      <div class="analysis-item"><span>롱 포지션</span><strong>${portfolioPositions.filter(p => p.position_type === 'LONG').length}개</strong></div>
      <div class="analysis-item"><span>숏 포지션</span><strong>${portfolioPositions.filter(p => p.position_type === 'SHORT').length}개</strong></div>
    </div>
  </div>

  <div class="footer">
    <p>본 리포트는 크립토 대시보드 PRO에서 자동 생성되었습니다.</p>
    <p>투자에 대한 최종 결정과 책임은 투자자 본인에게 있습니다.</p>
    <p style="margin-top:10px;">© 2025 크립토 대시보드 PRO. All rights reserved.</p>
  </div>
</body>
</html>`
    
    const win = window.open('', '_blank')
    if (win) { 
      win.document.write(html)
      win.document.close()
      setTimeout(() => win.print(), 500) 
    }
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

  // 임계점 슬라이더 핸들러
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value)
    setSliderValue(val)
    setInputValue(String(val))
  }

  // 임계점 입력 핸들러 - 버그 수정
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setInputValue(val)
  }

  const handleInputBlur = () => {
    const num = parseInt(inputValue)
    if (isNaN(num)) {
      setInputValue(String(sliderValue))
    } else {
      const clamped = Math.min(130, Math.max(50, num))
      setSliderValue(clamped)
      setInputValue(String(clamped))
    }
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
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder="코인명 입력 (예: doge, pepe, floki)" className={`flex-1 ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'} border rounded-xl px-4 py-3 focus:outline-none focus:border-[#00d395]`} />
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

        {/* 알림 설정 */}
        {activeTab === 'alerts' && alertSettings && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`${theme === 'dark' ? 'bg-[#1a1a2e]' : 'bg-white'} rounded-2xl p-6 border ${currentColors.cardBorder}`}>
              <h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>🪙 코인 선택</h3>
              <div className="mb-4">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="코인 검색 (예: PEPE, FLOKI...)" 
                    value={alertCoinSearch}
                    onChange={(e) => {
                      setAlertCoinSearch(e.target.value)
                      searchAlertCoin(e.target.value)
                    }}
                    className={`flex-1 p-3 rounded-xl border ${currentColors.cardBorder} ${theme === 'dark' ? 'bg-white/5 text-white' : 'bg-gray-50'}`} 
                  />
                  {alertSearchLoading && <span className="flex items-center text-[#00d395]">검색중...</span>}
                </div>
                {alertCoinSearch && alertSearchResults.length > 0 && (
                  <div className={`mt-2 p-2 rounded-xl ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                    <p className={`text-xs ${currentColors.textSecondary} mb-2`}>검색 결과 (클릭하여 추가)</p>
                    <div className="flex flex-wrap gap-2">
                      {alertSearchResults.map(coin => (
                        <button
                          key={coin}
                          type="button"
                          onClick={() => {
                            if (!alertSettings.selected_coins.includes(coin)) {
                              setAlertSettings({ ...alertSettings, selected_coins: [...alertSettings.selected_coins, coin] })
                            }
                            setAlertCoinSearch('')
                            setAlertSearchResults([])
                          }}
                          className="px-3 py-1 rounded-full text-sm bg-[#00d395]/20 text-[#00d395] hover:bg-[#00d395]/30"
                        >
                          + {coin}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {alertCoinSearch && alertSearchResults.length === 0 && !alertSearchLoading && (
                  <p className={`mt-2 text-sm ${currentColors.textSecondary}`}>검색 결과 없음</p>
                )}
              </div>
              <p className={`text-xs ${currentColors.textSecondary} mb-3`}>선택된 코인 (클릭하여 제거)</p>
              <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto">
                {alertSettings.selected_coins.map(coin => (
                  <button 
                    key={coin} 
                    type="button" 
                    onClick={() => setAlertSettings({ ...alertSettings, selected_coins: alertSettings.selected_coins.filter(c => c !== coin) })} 
                    className="px-4 py-2 rounded-full text-sm font-semibold bg-[#00d395] text-black hover:bg-[#00d395]/80"
                  >
                    {coin} ✕
                  </button>
                ))}
              </div>
              <p className={`mt-3 text-xs ${currentColors.textSecondary}`}>빠른 추가:</p>
              <div className="flex flex-wrap gap-1 mt-2 max-h-[120px] overflow-y-auto">
                {allCoins.filter(c => !alertSettings.selected_coins.includes(c)).slice(0, 20).map(coin => (
                  <button
                    key={coin}
                    type="button"
                    onClick={() => setAlertSettings({ ...alertSettings, selected_coins: [...alertSettings.selected_coins, coin] })}
                    className={`px-3 py-1 rounded-full text-xs ${theme === 'dark' ? 'bg-white/10 text-white/70 hover:bg-white/20' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    {coin}
                  </button>
                ))}
              </div>
            </div>
            
            <div className={`${theme === 'dark' ? 'bg-[#1a1a2e]' : 'bg-white'} rounded-2xl p-6 border ${currentColors.cardBorder}`}>
              <h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>🎯 점수 임계값</h3>
              <div className="flex items-center gap-4 mb-4">
                <input 
                  type="range" 
                  min="50" 
                  max="130" 
                  value={sliderValue} 
                  onChange={handleSliderChange}
                  className="flex-1 h-3 rounded-full appearance-none cursor-pointer" 
                  style={{ background: `linear-gradient(to right, #00d395 ${((sliderValue - 50) / 80) * 100}%, ${theme === 'dark' ? '#333' : '#ddd'} ${((sliderValue - 50) / 80) * 100}%)` }} 
                />
                <span className="bg-[#00d395] text-black px-4 py-2 rounded-xl font-bold text-xl min-w-[100px] text-center">{sliderValue}/140</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm ${currentColors.textSecondary}`}>직접 입력:</span>
                <input 
                  type="text"
                  inputMode="numeric"
                  value={inputValue}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  onKeyDown={(e) => e.key === 'Enter' && handleInputBlur()}
                  className={`w-24 p-2 rounded-lg border ${currentColors.cardBorder} ${theme === 'dark' ? 'bg-white/5 text-white' : 'bg-gray-50'} text-center`} 
                />
                <span className={`text-xs ${currentColors.textSecondary}`}>(50~130)</span>
              </div>
            </div>
            
            <div className={`${theme === 'dark' ? 'bg-[#1a1a2e]' : 'bg-white'} rounded-2xl p-6 border ${currentColors.cardBorder}`}>
              <h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>⏰ 시간대</h3>
              <div className="space-y-3">
                {[{ key: 'time_morning', label: '🌅 아침 (06-12시)' }, { key: 'time_afternoon', label: '☀️ 오후 (12-18시)' }, { key: 'time_evening', label: '🌆 저녁 (18-24시)' }, { key: 'time_night', label: '🌙 심야 (00-06시)' }].map(item => (
                  <div key={item.key} onClick={() => setAlertSettings({ ...alertSettings, [item.key]: !alertSettings[item.key as keyof AlertSettings] })} className={`flex justify-between items-center p-4 rounded-xl cursor-pointer ${alertSettings[item.key as keyof AlertSettings] ? 'bg-[#00d395]/10 border-2 border-[#00d395]' : `${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}`}>
                    <span className={currentColors.text}>{item.label}</span>
                    <span className="text-[#00d395] font-bold">{alertSettings[item.key as keyof AlertSettings] ? '✓' : ''}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className={`${theme === 'dark' ? 'bg-[#1a1a2e]' : 'bg-white'} rounded-2xl p-6 border ${currentColors.cardBorder}`}>
              <h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>📬 알림 유형</h3>
              <div className="space-y-3">
                {[{ key: 'alert_signal', label: '🚨 AI 시그널', desc: 'LONG/SHORT 진입 신호' }, { key: 'alert_score_change', label: '📊 점수 변동', desc: '체크리스트 점수 급변' }, { key: 'alert_price', label: '💰 가격 알림', desc: '목표가/손절가 도달' }].map(item => (
                  <div key={item.key} onClick={() => setAlertSettings({ ...alertSettings, [item.key]: !alertSettings[item.key as keyof AlertSettings] })} className={`flex justify-between items-center p-4 rounded-xl cursor-pointer ${alertSettings[item.key as keyof AlertSettings] ? 'bg-[#00d395]/10 border-2 border-[#00d395]' : `${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}`}>
                    <div><p className={currentColors.text}>{item.label}</p><p className={`text-xs ${currentColors.textSecondary}`}>{item.desc}</p></div>
                    <span className="text-[#00d395] font-bold">{alertSettings[item.key as keyof AlertSettings] ? '✓' : ''}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="col-span-full">
              <button type="button" onClick={saveAlertSettings} disabled={settingsSaving} className="w-full bg-[#00d395] text-black py-4 rounded-xl font-bold text-lg">{settingsSaving ? '저장 중...' : '💾 설정 저장'}</button>
            </div>
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
                  <div key={idx} className={`${theme === 'dark' ? 'bg-[#1a1a2e]' : 'bg-white'} rounded-xl p-4 border ${currentColors.cardBorder} text-center`}>
                    <div className="text-2xl mb-2">{stat.icon}</div>
                    <div className={`text-2xl font-bold ${stat.color || currentColors.text}`}>{stat.value}</div>
                    <div className={`text-sm ${currentColors.textSecondary}`}>{stat.label}</div>
                  </div>
                ))
              })()}
            </div>
            
            <div className={`${theme === 'dark' ? 'bg-[#1a1a2e]' : 'bg-white'} rounded-2xl p-6 border ${currentColors.cardBorder}`}>
              <h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>➕ 새 포지션</h3>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                <div className="relative" ref={coinDropdownRef}>
                  <label className={`block text-sm ${currentColors.textSecondary} mb-1`}>코인</label>
                  <button type="button" onClick={() => setShowCoinDropdown(!showCoinDropdown)} className={`w-full p-3 rounded-xl border ${currentColors.cardBorder} ${theme === 'dark' ? 'bg-white/5 text-white' : 'bg-gray-50'} text-left flex justify-between`}>
                    <span>{positionCoin}</span><span>▼</span>
                  </button>
                  {showCoinDropdown && (
                    <div className={`absolute z-50 w-full mt-1 rounded-xl border ${currentColors.cardBorder} ${theme === 'dark' ? 'bg-[#1a1a2e]' : 'bg-white'} shadow-lg max-h-60 overflow-y-auto`}>
                      {allCoins.map(coin => (
                        <button key={coin} type="button" onClick={() => { setPositionCoin(coin); setShowCoinDropdown(false) }} className={`w-full px-4 py-3 text-left hover:bg-[#00d395]/20 ${currentColors.text}`}>{coin}</button>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className={`block text-sm ${currentColors.textSecondary} mb-1`}>방향</label>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => setPositionType('LONG')} className={`flex-1 p-3 rounded-l-xl font-bold ${positionType === 'LONG' ? 'bg-[#00d395] text-black' : theme === 'dark' ? 'bg-white/5 text-white/70' : 'bg-gray-100'}`}>🟢</button>
                    <button type="button" onClick={() => setPositionType('SHORT')} className={`flex-1 p-3 rounded-r-xl font-bold ${positionType === 'SHORT' ? 'bg-[#ff6b6b] text-white' : theme === 'dark' ? 'bg-white/5 text-white/70' : 'bg-gray-100'}`}>🔴</button>
                  </div>
                </div>
                <div>
                  <label className={`block text-sm ${currentColors.textSecondary} mb-1`}>진입가</label>
                  <input 
                    type="text" 
                    inputMode="decimal" 
                    placeholder="0.00" 
                    value={entryValue}
                    onChange={(e) => setEntryValue(e.target.value)}
                    className={`w-full p-3 rounded-xl border ${currentColors.cardBorder} ${theme === 'dark' ? 'bg-white/5 text-white' : 'bg-gray-50'}`} 
                  />
                </div>
                <div>
                  <label className={`block text-sm ${currentColors.textSecondary} mb-1`}>목표가</label>
                  <input 
                    type="text" 
                    inputMode="decimal" 
                    placeholder="0.00" 
                    value={targetValue}
                    onChange={(e) => setTargetValue(e.target.value)}
                    className={`w-full p-3 rounded-xl border ${currentColors.cardBorder} ${theme === 'dark' ? 'bg-white/5 text-white' : 'bg-gray-50'}`} 
                  />
                </div>
                <div>
                  <label className={`block text-sm ${currentColors.textSecondary} mb-1`}>손절가</label>
                  <input 
                    type="text" 
                    inputMode="decimal" 
                    placeholder="0.00" 
                    value={stopValue}
                    onChange={(e) => setStopValue(e.target.value)}
                    className={`w-full p-3 rounded-xl border ${currentColors.cardBorder} ${theme === 'dark' ? 'bg-white/5 text-white' : 'bg-gray-50'}`} 
                  />
                </div>
                <div className="flex items-end">
                  <button type="button" onClick={addPosition} className="w-full bg-[#00d395] text-black p-3 rounded-xl font-bold">추가</button>
                </div>
              </div>
            </div>
            
            <div className={`${theme === 'dark' ? 'bg-[#1a1a2e]' : 'bg-white'} rounded-2xl p-6 border ${currentColors.cardBorder}`}>
              <h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>📋 포지션 목록</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={`border-b ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}>
                      {['코인', '방향', '진입가', '목표가', '손절가', '상태', ''].map(h => (
                        <th key={h} className={`text-left p-3 text-sm ${currentColors.textSecondary}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {portfolioPositions.length === 0 ? (
                      <tr><td colSpan={7} className={`text-center p-8 ${currentColors.textSecondary}`}>포지션 없음</td></tr>
                    ) : portfolioPositions.map(position => (
                      <tr key={position.id} className={`border-b ${theme === 'dark' ? 'border-white/5' : 'border-gray-100'}`}>
                        <td className={`p-3 font-bold ${currentColors.text}`}>{position.coin_symbol}</td>
                        <td className="p-3"><span className={`px-3 py-1 rounded-full text-xs font-bold ${position.position_type === 'LONG' ? 'bg-[#00d395]/20 text-[#00d395]' : 'bg-[#ff6b6b]/20 text-[#ff6b6b]'}`}>{position.position_type}</span></td>
                        <td className={`p-3 ${currentColors.text}`}>${position.entry_price.toLocaleString()}</td>
                        <td className="p-3 text-blue-400">${position.target_price.toLocaleString()}</td>
                        <td className="p-3 text-[#ff6b6b]">${position.stop_loss.toLocaleString()}</td>
                        <td className="p-3"><span className={`px-3 py-1 rounded-full text-xs ${position.status === 'active' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/10 text-white/50'}`}>{position.status === 'active' ? '활성' : '종료'}</span></td>
                        <td className="p-3">
                          <button 
                            type="button" 
                            onClick={() => deletePosition(position)} 
                            className="px-3 py-1 bg-[#ff6b6b] text-white rounded-lg text-sm hover:bg-[#ff6b6b]/80"
                          >
                            삭제
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className={`mt-4 text-xs ${currentColors.textSecondary}`}>
                💡 포지션은 참고용 기록입니다. 실제 거래소와 연동되지 않으며, 목표가/손절가 도달 시 자동으로 처리되지 않습니다.
              </p>
            </div>
          </div>
        )}

        {/* 리포트 */}
        {activeTab === 'report' && (
          <div className="space-y-6">
            {/* 요약 카드 */}
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
              {/* 상세 통계 */}
              <div className={`${theme === 'dark' ? 'bg-[#1a1a2e]' : 'bg-white'} rounded-2xl p-6 border ${currentColors.cardBorder}`}>
                <h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>📈 상세 통계</h3>
                {(() => {
                  const stats = calculatePortfolioStats()
                  const longCount = portfolioPositions.filter(p => p.position_type === 'LONG').length
                  const shortCount = portfolioPositions.filter(p => p.position_type === 'SHORT').length
                  return [
                    { label: '총 거래 횟수', value: `${stats.total}회` },
                    { label: '활성 포지션', value: `${stats.active}개`, color: 'text-[#00d395]' },
                    { label: '종료 포지션', value: `${stats.closed}개` },
                    { label: '승률', value: `${stats.winRate}%`, color: 'text-[#00d395]' },
                    { label: '수익 거래', value: `${stats.wins}회`, color: 'text-[#00d395]' },
                    { label: '손실 거래', value: `${stats.losses}회`, color: 'text-[#ff6b6b]' },
                    { label: '롱 포지션', value: `${longCount}개` },
                    { label: '숏 포지션', value: `${shortCount}개` },
                    { label: '누적 수익률', value: `${parseFloat(stats.totalPnL) >= 0 ? '+' : ''}${stats.totalPnL}%`, color: parseFloat(stats.totalPnL) >= 0 ? 'text-[#00d395]' : 'text-[#ff6b6b]' }
                  ].map((item, idx) => (
                    <div key={idx} className={`flex justify-between p-3 border-b ${theme === 'dark' ? 'border-white/10' : 'border-gray-100'}`}>
                      <span className={currentColors.textSecondary}>{item.label}</span>
                      <span className={`font-bold ${item.color || currentColors.text}`}>{item.value}</span>
                    </div>
                  ))
                })()}
              </div>
              
              {/* 다운로드 & 안내 */}
              <div className="space-y-6">
                <div className={`${theme === 'dark' ? 'bg-[#1a1a2e]' : 'bg-white'} rounded-2xl p-6 border ${currentColors.cardBorder}`}>
                  <h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>📥 리포트 다운로드</h3>
                  <p className={`${currentColors.textSecondary} text-sm mb-4`}>
                    전체 트레이딩 내역과 상세 분석이 포함된 PDF 리포트를 다운로드하세요.
                  </p>
                  <button type="button" onClick={downloadPDF} className="w-full bg-[#00d395] text-black py-4 rounded-xl font-bold text-lg hover:bg-[#00d395]/90">
                    📄 PDF 리포트 생성
                  </button>
                  <p className={`text-xs ${currentColors.textSecondary} mt-2 text-center`}>
                    * 인쇄 다이얼로그에서 "PDF로 저장" 선택
                  </p>
                </div>
                
                <div className={`${theme === 'dark' ? 'bg-[#1a1a2e]' : 'bg-white'} rounded-2xl p-6 border ${currentColors.cardBorder}`}>
                  <h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>📋 PDF 포함 내용</h3>
                  <ul className={`space-y-2 ${currentColors.textSecondary} text-sm`}>
                    <li>✅ 트레이딩 성과 요약</li>
                    <li>✅ 성과 지표 (활성/종료/수익/손실)</li>
                    <li>✅ 활성 포지션 상세 정보</li>
                    <li>✅ 종료된 포지션 & 수익률</li>
                    <li>✅ 롱/숏 포지션 분석</li>
                    <li>✅ 전문가급 디자인 레이아웃</li>
                  </ul>
                </div>
              </div>
            </div>
            
            {/* 활성 포지션 미리보기 */}
            <div className={`${theme === 'dark' ? 'bg-[#1a1a2e]' : 'bg-white'} rounded-2xl p-6 border ${currentColors.cardBorder}`}>
              <h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>🟢 활성 포지션</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={`border-b ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}>
                      {['코인', '방향', '진입가', '목표가', '손절가', '예상 손익비'].map(h => (
                        <th key={h} className={`text-left p-3 text-sm ${currentColors.textSecondary}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {portfolioPositions.filter(p => p.status === 'active').length === 0 ? (
                      <tr><td colSpan={6} className={`text-center p-8 ${currentColors.textSecondary}`}>활성 포지션이 없습니다</td></tr>
                    ) : portfolioPositions.filter(p => p.status === 'active').map(position => {
                      const rr = position.position_type === 'LONG' 
                        ? ((position.target_price - position.entry_price) / (position.entry_price - position.stop_loss)).toFixed(2)
                        : ((position.entry_price - position.target_price) / (position.stop_loss - position.entry_price)).toFixed(2)
                      return (
                        <tr key={position.id} className={`border-b ${theme === 'dark' ? 'border-white/5' : 'border-gray-100'}`}>
                          <td className={`p-3 font-bold ${currentColors.text}`}>{position.coin_symbol}</td>
                          <td className="p-3"><span className={`px-3 py-1 rounded-full text-xs font-bold ${position.position_type === 'LONG' ? 'bg-[#00d395]/20 text-[#00d395]' : 'bg-[#ff6b6b]/20 text-[#ff6b6b]'}`}>{position.position_type}</span></td>
                          <td className={`p-3 ${currentColors.text}`}>${position.entry_price.toLocaleString()}</td>
                          <td className="p-3 text-[#00d395]">${position.target_price.toLocaleString()}</td>
                          <td className="p-3 text-[#ff6b6b]">${position.stop_loss.toLocaleString()}</td>
                          <td className="p-3 text-yellow-400 font-bold">1:{rr}</td>
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

      {/* 모달 */}
      {showDetail && selectedCoin && (
        <div className={`fixed inset-0 z-50 ${theme === 'dark' ? 'bg-[#0a0a14]' : 'bg-white'} overflow-y-auto`}>
          <div className={`sticky top-0 ${theme === 'dark' ? 'bg-[#0a0a14] border-white/10' : 'bg-white border-gray-200'} border-b z-10`}>
            <div className="flex justify-between items-center p-4">
              <div className="flex items-center gap-3">
                <h2 className={`text-xl font-bold ${currentColors.text}`}>{selectedCoin.symbol.toUpperCase()}</h2>
                <SignalBadge signal={selectedCoin.signal} />
              </div>
              <button type="button" onClick={() => setShowDetail(false)} className={`${theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'} px-4 py-2 rounded-lg font-semibold ${currentColors.text}`}>✕ 닫기</button>
            </div>
          </div>
          <div className="max-w-2xl mx-auto p-4 pb-20">
            <div className={`${theme === 'dark' ? 'bg-[#1a1a2e]' : 'bg-white'} rounded-2xl p-6 mb-4 border ${currentColors.cardBorder}`}>
              <p className={currentColors.textSecondary}>{selectedCoin.name}</p>
              <p className="text-4xl font-bold text-[#00d395] mb-2">${selectedCoin.current_price.toLocaleString(undefined, { maximumFractionDigits: 6 })}</p>
              <p className={selectedCoin.price_change_percentage_24h >= 0 ? 'text-[#00d395]' : 'text-[#ff6b6b]'}>{selectedCoin.price_change_percentage_24h >= 0 ? '▲' : '▼'} {Math.abs(selectedCoin.price_change_percentage_24h || 0).toFixed(2)}%</p>
            </div>
            <div className={`${theme === 'dark' ? 'bg-[#1a1a2e]' : 'bg-white'} rounded-2xl p-6 mb-4 border ${currentColors.cardBorder}`}>
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
                <div className={`${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-6 text-center`}>
                  <p className={currentColors.textSecondary}>🔒 PRO 전용</p>
                  <Link href="/pricing" className="bg-[#00d395] text-black px-6 py-2 rounded-xl font-semibold inline-block mt-2">업그레이드</Link>
                </div>
              )}
            </div>
            {profile?.plan !== 'free' && (
              <>
                <div className={`${theme === 'dark' ? 'bg-[#1a1a2e]' : 'bg-white'} rounded-2xl p-6 mb-4 border ${currentColors.cardBorder}`}>
                  <h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>💰 매매 전략</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#00d395]/10 border border-[#00d395]/30 rounded-xl p-4"><p className={currentColors.textSecondary + ' text-sm'}>진입가</p><p className="text-[#00d395] text-xl font-bold">${selectedCoin.entry_price.toLocaleString()}</p></div>
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4"><p className={currentColors.textSecondary + ' text-sm'}>목표가</p><p className="text-blue-400 text-xl font-bold">${selectedCoin.target_price.toLocaleString()}</p></div>
                    <div className="bg-[#ff6b6b]/10 border border-[#ff6b6b]/30 rounded-xl p-4"><p className={currentColors.textSecondary + ' text-sm'}>손절가</p><p className="text-[#ff6b6b] text-xl font-bold">${selectedCoin.stop_loss.toLocaleString()}</p></div>
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4"><p className={currentColors.textSecondary + ' text-sm'}>손익비</p><p className="text-yellow-400 text-xl font-bold">{selectedCoin.risk_reward}</p></div>
                  </div>
                </div>
                <div className={`${theme === 'dark' ? 'bg-[#1a1a2e]' : 'bg-white'} rounded-2xl p-6 mb-4 border ${currentColors.cardBorder}`}>
                  <h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>🤖 AI 코멘트</h3>
                  <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-xl p-4">
                    <p className={theme === 'dark' ? 'text-white/90' : 'text-gray-700'}>{selectedCoin.ai_comment}</p>
                  </div>
                </div>
              </>
            )}
            <button type="button" onClick={() => setShowDetail(false)} className={`w-full py-4 ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'} rounded-xl font-semibold ${currentColors.text}`}>닫기</button>
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
