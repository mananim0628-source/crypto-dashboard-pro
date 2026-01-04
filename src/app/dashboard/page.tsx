'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
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

// 테마 초기값을 localStorage에서 가져오는 함수
const getInitialTheme = (): 'dark' | 'light' => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('dashboard-theme')
    if (saved === 'light' || saved === 'dark') return saved
  }
  return 'dark'
}

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [dataLoading, setDataLoading] = useState(false)
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
  const countdownRef = useRef<HTMLSpanElement>(null)
  const [selectedCoin, setSelectedCoin] = useState<AnalyzedCoin | null>(null)
  const [showDetail, setShowDetail] = useState(false)

  const [activeTab, setActiveTab] = useState<'dashboard' | 'alerts' | 'portfolio' | 'report'>('dashboard')
  
  // 테마 상태 - localStorage에서 초기값 로드
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [themeLoaded, setThemeLoaded] = useState(false)
  
  const [alertSettings, setAlertSettings] = useState<AlertSettings | null>(null)
  const [portfolioPositions, setPortfolioPositions] = useState<PortfolioPosition[]>([])
  const [settingsSaving, setSettingsSaving] = useState(false)
  
  // 포지션 입력 - ref 사용으로 리렌더링 방지
  const [positionCoin, setPositionCoin] = useState('BTC')
  const [positionType, setPositionType] = useState<'LONG' | 'SHORT'>('LONG')
  const entryRef = useRef<HTMLInputElement>(null)
  const targetRef = useRef<HTMLInputElement>(null)
  const stopRef = useRef<HTMLInputElement>(null)
  
  // 코인 검색 관련 상태
  const [coinSearchQuery, setCoinSearchQuery] = useState('')
  const [showCoinDropdown, setShowCoinDropdown] = useState(false)
  const coinDropdownRef = useRef<HTMLDivElement>(null)
  const coinSearchInputRef = useRef<HTMLInputElement>(null)
  
  // 슬라이더 로컬 상태 (스무스한 드래그를 위해)
  const [sliderValue, setSliderValue] = useState(90)
  const sliderRef = useRef<HTMLInputElement>(null)

  const allCoins = [
    'BTC', 'ETH', 'XRP', 'BNB', 'SOL', 'ADA', 'DOGE', 'MATIC', 'DOT', 'SHIB',
    'AVAX', 'LINK', 'UNI', 'ATOM', 'LTC', 'ETC', 'XLM', 'ALGO', 'VET', 'FIL',
    'AAVE', 'AXS', 'SAND', 'MANA', 'GALA', 'ENJ', 'CHZ', 'APE', 'LDO', 'ARB',
    'OP', 'IMX', 'NEAR', 'APT', 'SUI', 'SEI', 'TIA', 'INJ', 'FET', 'RNDR',
    'GRT', 'SNX', 'CRV', 'MKR', 'COMP', '1INCH', 'SUSHI', 'YFI', 'BAL', 'CAKE'
  ]
  
  const availableCoins = ['BTC', 'ETH', 'XRP', 'BNB', 'SOL', 'ADA', 'DOGE', 'MATIC', 'DOT', 'SHIB']
  
  const filteredCoins = coinSearchQuery 
    ? allCoins.filter(coin => coin.toLowerCase().includes(coinSearchQuery.toLowerCase()))
    : allCoins

  const router = useRouter()
  const supabase = createClientComponentClient()

  const colors = {
    dark: {
      bg: '#0a0a14',
      cardBg: '#1a1a2e',
      cardBorder: 'border-white/10',
      text: 'text-white',
      textSecondary: 'text-white/50',
      inputBg: 'bg-white/5',
    },
    light: {
      bg: '#f5f5f7',
      cardBg: '#ffffff',
      cardBorder: 'border-gray-200',
      text: 'text-gray-900',
      textSecondary: 'text-gray-500',
      inputBg: 'bg-gray-100',
    }
  }

  const currentColors = colors[theme]

  // 테마 초기 로드 (localStorage 우선)
  useEffect(() => {
    const saved = localStorage.getItem('dashboard-theme')
    if (saved === 'light' || saved === 'dark') {
      setTheme(saved)
    }
    setThemeLoaded(true)
  }, [])

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (coinDropdownRef.current && !coinDropdownRef.current.contains(event.target as Node)) {
        setShowCoinDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (showDetail) {
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.width = '100%'
      document.body.style.top = `-${window.scrollY}px`
    } else {
      const scrollY = document.body.style.top
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.width = ''
      document.body.style.top = ''
      window.scrollTo(0, parseInt(scrollY || '0') * -1)
    }
    return () => {
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.width = ''
      document.body.style.top = ''
    }
  }, [showDetail])

  const fetchAlertSettings = async (userId: string) => {
    const { data } = await supabase
      .from('alert_settings')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (data) {
      setAlertSettings(data)
      setSliderValue(data.score_threshold)
    } else {
      const defaultSettings: AlertSettings = {
        user_id: userId,
        selected_coins: ['BTC', 'ETH'],
        score_threshold: 90,
        time_morning: true,
        time_afternoon: true,
        time_evening: true,
        time_night: false,
        alert_signal: true,
        alert_score_change: true,
        alert_price: true
      }
      setAlertSettings(defaultSettings)
      setSliderValue(90)
    }
  }

  const saveAlertSettings = async () => {
    if (!user || !alertSettings) return
    setSettingsSaving(true)
    
    const settingsToSave = {
      ...alertSettings,
      score_threshold: sliderValue,
      user_id: user.id,
      updated_at: new Date().toISOString()
    }
    
    const { error } = await supabase
      .from('alert_settings')
      .upsert(settingsToSave)
    
    if (error) {
      alert('설정 저장 실패: ' + error.message)
    } else {
      setAlertSettings(settingsToSave)
      alert('✅ 설정이 저장되었습니다!')
    }
    setSettingsSaving(false)
  }

  const fetchPortfolio = async (userId: string) => {
    const { data } = await supabase
      .from('portfolio_positions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (data) setPortfolioPositions(data)
  }

  const addPosition = async () => {
    if (!user) return
    
    const entry = entryRef.current?.value || ''
    const target = targetRef.current?.value || ''
    const stop = stopRef.current?.value || ''
    
    if (!entry || !target || !stop) {
      alert('진입가, 목표가, 손절가를 모두 입력해주세요')
      return
    }

    const { data, error } = await supabase
      .from('portfolio_positions')
      .insert({
        user_id: user.id,
        coin_symbol: positionCoin,
        coin_name: positionCoin,
        position_type: positionType,
        entry_price: parseFloat(entry),
        target_price: parseFloat(target),
        stop_loss: parseFloat(stop),
        status: 'active'
      })
      .select()
      .single()

    if (error) {
      alert('포지션 추가 실패: ' + error.message)
    } else if (data) {
      setPortfolioPositions([data, ...portfolioPositions])
      if (entryRef.current) entryRef.current.value = ''
      if (targetRef.current) targetRef.current.value = ''
      if (stopRef.current) stopRef.current.value = ''
      alert('✅ 포지션이 추가되었습니다!')
    }
  }

  const closePosition = async (position: PortfolioPosition) => {
    const exitPrice = prompt('종료 가격을 입력하세요:')
    if (!exitPrice) return

    const { error } = await supabase
      .from('portfolio_positions')
      .update({
        status: 'closed',
        exit_price: parseFloat(exitPrice),
        exit_date: new Date().toISOString()
      })
      .eq('id', position.id)

    if (error) {
      alert('포지션 종료 실패: ' + error.message)
    } else {
      setPortfolioPositions(portfolioPositions.map(p => 
        p.id === position.id 
          ? { ...p, status: 'closed' as const, exit_price: parseFloat(exitPrice), exit_date: new Date().toISOString() }
          : p
      ))
      alert('✅ 포지션이 종료되었습니다!')
    }
  }

  // 테마 전환 - localStorage에도 저장
  const toggleTheme = async () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    localStorage.setItem('dashboard-theme', newTheme)
    
    if (user) {
      await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          theme: newTheme,
          updated_at: new Date().toISOString()
        })
    }
  }

  const fetchUserPreferences = async (userId: string) => {
    const { data } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (data?.theme) {
      setTheme(data.theme)
      localStorage.setItem('dashboard-theme', data.theme)
    }
  }

  const calculatePortfolioStats = () => {
    const active = portfolioPositions.filter(p => p.status === 'active')
    const closed = portfolioPositions.filter(p => p.status === 'closed')
    
    let totalPnL = 0
    let wins = 0
    let losses = 0

    closed.forEach(p => {
      if (p.exit_price) {
        const pnl = p.position_type === 'LONG'
          ? ((p.exit_price - p.entry_price) / p.entry_price) * 100
          : ((p.entry_price - p.exit_price) / p.entry_price) * 100
        totalPnL += pnl
        if (pnl > 0) wins++
        else losses++
      }
    })

    const winRate = closed.length > 0 ? (wins / closed.length) * 100 : 0

    return {
      total: portfolioPositions.length,
      active: active.length,
      closed: closed.length,
      winRate: winRate.toFixed(1),
      totalPnL: totalPnL.toFixed(2),
      wins,
      losses
    }
  }

  // PDF 다운로드
  const downloadPDF = () => {
    const stats = calculatePortfolioStats()
    const now = new Date().toLocaleDateString('ko-KR')
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>크립토 대시보드 PRO - 트레이딩 리포트</title>
        <style>
          body { font-family: 'Malgun Gothic', sans-serif; padding: 40px; background: #fff; }
          .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #00d395; padding-bottom: 20px; }
          .header h1 { color: #00d395; margin: 0; }
          .header p { color: #666; margin-top: 10px; }
          .section { margin-bottom: 30px; }
          .section h2 { color: #333; border-left: 4px solid #00d395; padding-left: 10px; }
          .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
          .stat-card { background: #f5f5f5; padding: 20px; border-radius: 10px; text-align: center; }
          .stat-value { font-size: 32px; font-weight: bold; color: #00d395; }
          .stat-label { color: #666; margin-top: 5px; }
          .negative { color: #ff6b6b; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background: #f5f5f5; }
          .long { color: #00d395; }
          .short { color: #ff6b6b; }
          .footer { text-align: center; margin-top: 40px; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🚀 크립토 대시보드 PRO</h1>
          <p>트레이딩 리포트 - ${now}</p>
          <p>사용자: ${profile?.nickname || user?.email?.split('@')[0] || 'Unknown'}</p>
        </div>
        
        <div class="section">
          <h2>📊 주간 요약</h2>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-value">${stats.total}</div>
              <div class="stat-label">총 거래</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${stats.winRate}%</div>
              <div class="stat-label">승률</div>
            </div>
            <div class="stat-card">
              <div class="stat-value"><span class="long">${stats.wins}</span> / <span class="negative">${stats.losses}</span></div>
              <div class="stat-label">승 / 패</div>
            </div>
            <div class="stat-card">
              <div class="stat-value ${parseFloat(stats.totalPnL) >= 0 ? '' : 'negative'}">${parseFloat(stats.totalPnL) >= 0 ? '+' : ''}${stats.totalPnL}%</div>
              <div class="stat-label">총 수익률</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>📋 포지션 내역</h2>
          <table>
            <thead>
              <tr>
                <th>코인</th>
                <th>방향</th>
                <th>진입가</th>
                <th>목표가</th>
                <th>손절가</th>
                <th>종료가</th>
                <th>상태</th>
                <th>수익률</th>
              </tr>
            </thead>
            <tbody>
              ${portfolioPositions.map(p => {
                let pnl = 0
                if (p.exit_price) {
                  pnl = p.position_type === 'LONG'
                    ? ((p.exit_price - p.entry_price) / p.entry_price) * 100
                    : ((p.entry_price - p.exit_price) / p.entry_price) * 100
                }
                return `
                  <tr>
                    <td><strong>${p.coin_symbol}</strong></td>
                    <td class="${p.position_type === 'LONG' ? 'long' : 'short'}">${p.position_type}</td>
                    <td>$${p.entry_price.toLocaleString()}</td>
                    <td>$${p.target_price.toLocaleString()}</td>
                    <td>$${p.stop_loss.toLocaleString()}</td>
                    <td>${p.exit_price ? '$' + p.exit_price.toLocaleString() : '-'}</td>
                    <td>${p.status === 'active' ? '🟢 활성' : '⚪ 종료'}</td>
                    <td class="${pnl >= 0 ? 'long' : 'short'}">${p.status === 'closed' ? (pnl >= 0 ? '+' : '') + pnl.toFixed(2) + '%' : '-'}</td>
                  </tr>
                `
              }).join('')}
              ${portfolioPositions.length === 0 ? '<tr><td colspan="8" style="text-align:center;color:#999;">포지션 내역이 없습니다</td></tr>' : ''}
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>📈 트레이딩 통계</h2>
          <table>
            <tr><td>평균 보유 기간</td><td><strong>1.5일</strong></td></tr>
            <tr><td>평균 손익비</td><td><strong>1:1.5</strong></td></tr>
            <tr><td>최대 연속 승</td><td><strong>${stats.wins}회</strong></td></tr>
            <tr><td>평균 수익률 (승)</td><td class="long"><strong>+2.1%</strong></td></tr>
            <tr><td>평균 손실률 (패)</td><td class="negative"><strong>-1.3%</strong></td></tr>
          </table>
        </div>

        <div class="footer">
          <p>본 리포트는 크립토 대시보드 PRO에서 자동 생성되었습니다.</p>
          <p>© 2025 크립토 대시보드 PRO. All rights reserved.</p>
        </div>
      </body>
      </html>
    `
    
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(htmlContent)
      printWindow.document.close()
      setTimeout(() => {
        printWindow.print()
      }, 500)
    } else {
      alert('팝업이 차단되었습니다. 팝업 허용 후 다시 시도해주세요.')
    }
  }

  const fetchFavorites = async (userId: string) => {
    const { data } = await supabase.from('favorites').select('*').eq('user_id', userId).order('created_at', { ascending: false })
    if (data) setFavorites(data)
  }

  const fetchAdSlots = async () => {
    const { data } = await supabase.from('ad_slots').select('*').eq('is_active', true).order('display_order', { ascending: true })
    if (data) setAdSlots(data)
  }

  const toggleFavorite = async (coin: AnalyzedCoin) => {
    if (!user) return
    const existing = favorites.find(f => f.coin_id === coin.id)
    if (existing) {
      await supabase.from('favorites').delete().eq('id', existing.id)
      setFavorites(favorites.filter(f => f.id !== existing.id))
      setFavoriteCoins(favoriteCoins.filter(fc => fc.id !== coin.id))
    } else {
      if (profile?.plan === 'free' && favorites.length >= 3) {
        alert('무료 회원은 최대 3개까지 즐겨찾기 가능합니다.\nPRO로 업그레이드하면 무제한!')
        return
      }
      const { data } = await supabase.from('favorites').insert({ user_id: user.id, coin_id: coin.id, coin_symbol: coin.symbol, coin_name: coin.name }).select().single()
      if (data) { setFavorites([data, ...favorites]); setFavoriteCoins([coin, ...favoriteCoins]) }
    }
  }

  const handleAdClick = async (ad: AdSlot) => {
    await supabase.rpc('increment_ad_click', { ad_id: ad.id })
    window.open(ad.link_url, '_blank')
  }

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
    const entry_price = price
    let target_price: number, stop_loss: number, risk_reward: string
    
    if (signal === 'strong_buy') {
      target_price = price * 1.045; stop_loss = price * 0.97; risk_reward = '1:1.5'
    } else if (signal === 'buy') {
      target_price = price * 1.042; stop_loss = price * 0.97; risk_reward = '1:1.4'
    } else if (signal === 'hold') {
      target_price = price * 1.036; stop_loss = price * 0.97; risk_reward = '1:1.2'
    } else {
      target_price = price * 1.03; stop_loss = price * 0.97; risk_reward = '1:1.0'
    }
    const analyzed: AnalyzedCoin = { ...coin, scores, signal, entry_price, target_price, stop_loss, risk_reward, ai_comment: '' }
    analyzed.ai_comment = generateAIComment(analyzed)
    return analyzed
  }

  const fetchData = useCallback(async () => {
    setDataLoading(true)
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
    } catch (error) { console.error('Failed to fetch data:', error) }
    finally { setDataLoading(false) }
  }, [profile?.plan])

  const handleSearch = async () => {
    if (!searchQuery.trim() || profile?.plan === 'free') return
    setSearchLoading(true)
    try {
      const response = await fetch(`/api/crypto?action=search&query=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()
      if (data.coin) setSearchResult(analyzeCoin(data.coin))
      else { setSearchResult(null); alert('코인을 찾을 수 없습니다') }
    } catch (error) { console.error('Search failed:', error) }
    finally { setSearchLoading(false) }
  }

  // 인증 상태 리스너 사용 (로그인 문제 해결)
  useEffect(() => {
    // 초기 세션 체크
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        setUser(session.user)
        const { data: profileData } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
        setProfile(profileData)
        setLoading(false)
        
        // 데이터 로드
        fetchData()
        fetchFavorites(session.user.id)
        fetchAdSlots()
        fetchAlertSettings(session.user.id)
        fetchPortfolio(session.user.id)
        fetchUserPreferences(session.user.id)
      } else {
        router.push('/login')
      }
    }
    
    initAuth()

    // Auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user)
        const { data: profileData } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
        setProfile(profileData)
        setLoading(false)
        
        fetchData()
        fetchFavorites(session.user.id)
        fetchAdSlots()
        fetchAlertSettings(session.user.id)
        fetchPortfolio(session.user.id)
        fetchUserPreferences(session.user.id)
      } else if (event === 'SIGNED_OUT') {
        router.push('/login')
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, router])

  // 데이터 자동 새로고침
  useEffect(() => { 
    if (profile) { 
      const interval = setInterval(fetchData, 120000)
      return () => clearInterval(interval) 
    } 
  }, [profile, fetchData])

  useEffect(() => { 
    let count = countdown
    const timer = setInterval(() => { 
      count = count > 0 ? count - 1 : 120
      if (showDetail && countdownRef.current) {
        countdownRef.current.textContent = `${count}초`
      } else {
        setCountdown(count)
      }
    }, 1000)
    return () => clearInterval(timer) 
  }, [showDetail])

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

  const AdCard = ({ ad, size = 'normal' }: { ad: AdSlot; size?: 'normal' | 'large' }) => (
    <div 
      className={`bg-gradient-to-r ${ad.bg_color} border ${ad.border_color} rounded-xl cursor-pointer hover:scale-[1.02] transition-all ${size === 'large' ? 'p-5' : 'p-3'}`}
      onClick={() => handleAdClick(ad)}
    >
      <div className="flex items-center gap-3">
        <span className={size === 'large' ? 'text-3xl' : 'text-2xl'}>{ad.icon}</span>
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-white ${size === 'large' ? 'text-base' : 'text-sm'}`}>{ad.title}</p>
          <p className={`text-white/70 truncate ${size === 'large' ? 'text-sm' : 'text-xs'}`}>{ad.description}</p>
        </div>
        <span className="text-[#00d395] text-xs font-semibold whitespace-nowrap">{ad.link_text} →</span>
      </div>
      {ad.ad_type === 'sponsored' && <span className="text-xs text-white/40 mt-1 block">광고</span>}
    </div>
  )

  const CoinCard = ({ coin, showFavorite = true }: { coin: AnalyzedCoin; showFavorite?: boolean }) => {
    const isPro = profile?.plan !== 'free'
    const isFavorited = favorites.some(f => f.coin_id === coin.id)
    return (
      <div 
        className={`${theme === 'dark' ? 'bg-[#1a1a2e]' : 'bg-white'} rounded-2xl p-5 border cursor-pointer hover:border-[#00d395]/50 transition-all relative ${coin.signal === 'strong_buy' || coin.signal === 'buy' ? 'border-[#00d395]/30' : coin.signal === 'hold' ? 'border-yellow-500/30' : 'border-[#ff6b6b]/30'}`}
        onClick={() => { setSelectedCoin(coin); setShowDetail(true); }}
      >
        {showFavorite && (
          <button onClick={(e) => { e.stopPropagation(); toggleFavorite(coin); }} className={`absolute top-3 right-3 text-xl transition ${isFavorited ? 'text-yellow-400' : `${theme === 'dark' ? 'text-white/30' : 'text-gray-300'} hover:text-yellow-400`}`}>{isFavorited ? '★' : '☆'}</button>
        )}
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
          <p className="text-2xl font-bold text-[#00d395]">${coin.current_price.toLocaleString(undefined, { maximumFractionDigits: 6 })}</p>
          <p className={`text-sm ${coin.price_change_percentage_24h >= 0 ? 'text-[#00d395]' : 'text-[#ff6b6b]'}`}>{coin.price_change_percentage_24h >= 0 ? '▲' : '▼'} {Math.abs(coin.price_change_percentage_24h || 0).toFixed(2)}% (24h)</p>
        </div>
        {isPro ? (
          <div className={`${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-3 space-y-2`}>
            <div className="flex justify-between items-center"><span className={currentColors.textSecondary + ' text-sm'}>진입가</span><span className="text-[#00d395] font-semibold">${coin.entry_price.toLocaleString(undefined, { maximumFractionDigits: 4 })}</span></div>
            <div className="flex justify-between items-center"><span className={currentColors.textSecondary + ' text-sm'}>목표가</span><span className="text-blue-400 font-semibold">${coin.target_price.toLocaleString(undefined, { maximumFractionDigits: 4 })}</span></div>
            <div className="flex justify-between items-center"><span className={currentColors.textSecondary + ' text-sm'}>손절가</span><span className="text-[#ff6b6b] font-semibold">${coin.stop_loss.toLocaleString(undefined, { maximumFractionDigits: 4 })}</span></div>
            <div className={`flex justify-between items-center pt-2 border-t ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}><span className={currentColors.textSecondary + ' text-sm'}>손익비</span><span className="text-yellow-400 font-bold">{coin.risk_reward}</span></div>
          </div>
        ) : (
          <div className={`${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-4 text-center`}><p className={currentColors.textSecondary + ' text-sm'}>🔒 PRO 회원 전용 정보</p></div>
        )}
        <button className="w-full mt-3 py-2 text-sm text-[#00d395] hover:bg-[#00d395]/10 rounded-lg transition">상세 분석 보기 →</button>
      </div>
    )
  }

  // 알림 설정 탭
  const AlertSettingsTab = () => {
    if (!alertSettings) return <div className="text-center py-10">로딩 중...</div>

    const toggleCoin = (coin: string) => {
      const current = alertSettings.selected_coins
      const updated = current.includes(coin)
        ? current.filter(c => c !== coin)
        : [...current, coin]
      setAlertSettings({ ...alertSettings, selected_coins: updated })
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 코인 선택 */}
        <div className={`${theme === 'dark' ? 'bg-[#1a1a2e]' : 'bg-white'} rounded-2xl p-6 border ${currentColors.cardBorder}`}>
          <h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>🪙 코인 선택</h3>
          <p className={`${currentColors.textSecondary} text-sm mb-4`}>알림 받을 코인을 선택하세요 (다중 선택)</p>
          
          {/* 코인 검색 - 바로 입력 가능하게 수정 */}
          <div className="mb-4">
            <input
              ref={coinSearchInputRef}
              type="text"
              placeholder="코인 검색 (예: BTC, ETH...)"
              defaultValue=""
              onChange={(e) => setCoinSearchQuery(e.target.value)}
              className={`w-full p-3 rounded-xl border ${currentColors.cardBorder} ${theme === 'dark' ? 'bg-white/5 text-white placeholder:text-white/30' : 'bg-gray-50 text-gray-900 placeholder:text-gray-400'} focus:outline-none focus:border-[#00d395]`}
            />
          </div>
          
          <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto">
            {filteredCoins.map(coin => (
              <button
                key={coin}
                type="button"
                onClick={() => toggleCoin(coin)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                  alertSettings.selected_coins.includes(coin)
                    ? 'bg-[#00d395] text-black'
                    : `${theme === 'dark' ? 'bg-white/10 text-white/70' : 'bg-gray-100 text-gray-600'} hover:bg-[#00d395]/20`
                }`}
              >
                {coin}
              </button>
            ))}
          </div>
          <div className={`mt-4 p-3 rounded-lg ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
            <span className={currentColors.textSecondary + ' text-sm'}>선택됨: </span>
            <span className="text-[#00d395] font-semibold">{alertSettings.selected_coins.join(', ') || '없음'}</span>
          </div>
        </div>

        {/* 점수 임계값 - 완전히 새로운 방식 */}
        <div className={`${theme === 'dark' ? 'bg-[#1a1a2e]' : 'bg-white'} rounded-2xl p-6 border ${currentColors.cardBorder}`}>
          <h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>🎯 점수 임계값</h3>
          <p className={`${currentColors.textSecondary} text-sm mb-4`}>설정 점수 이상일 때만 알림</p>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 relative py-2">
              {/* 배경 트랙 */}
              <div className={`absolute inset-x-0 top-1/2 -translate-y-1/2 h-3 rounded-full ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'}`} />
              {/* 채워진 트랙 */}
              <div 
                className="absolute top-1/2 -translate-y-1/2 left-0 h-3 rounded-full bg-[#00d395]"
                style={{ width: `${((sliderValue - 50) / 80) * 100}%` }}
              />
              {/* 실제 인풋 */}
              <input
                ref={sliderRef}
                type="range"
                min="50"
                max="130"
                value={sliderValue}
                onChange={(e) => setSliderValue(parseInt(e.target.value))}
                className="relative w-full h-6 appearance-none bg-transparent cursor-pointer z-10"
                style={{ WebkitAppearance: 'none' }}
              />
            </div>
            <div className="bg-[#00d395] text-black px-4 py-2 rounded-xl font-bold text-xl min-w-[100px] text-center">
              {sliderValue}/140
            </div>
          </div>
          
          <div className={`flex justify-between text-xs ${currentColors.textSecondary} mb-4`}>
            <span>50점 (느슨)</span>
            <span>90점 (권장)</span>
            <span>130점 (엄격)</span>
          </div>
          
          {/* 직접 입력 */}
          <div className="flex items-center gap-2">
            <span className={`${currentColors.textSecondary} text-sm`}>직접 입력:</span>
            <input
              type="number"
              min="50"
              max="130"
              value={sliderValue}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 50
                setSliderValue(Math.min(130, Math.max(50, val)))
              }}
              className={`w-24 p-2 rounded-lg border ${currentColors.cardBorder} ${theme === 'dark' ? 'bg-white/5 text-white' : 'bg-gray-50 text-gray-900'} text-center`}
            />
          </div>
        </div>

        {/* 시간대 설정 */}
        <div className={`${theme === 'dark' ? 'bg-[#1a1a2e]' : 'bg-white'} rounded-2xl p-6 border ${currentColors.cardBorder}`}>
          <h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>⏰ 시간대별 알림</h3>
          <div className="space-y-3">
            {[
              { key: 'time_morning', label: '🌅 아침', time: '06:00 - 12:00' },
              { key: 'time_afternoon', label: '☀️ 오후', time: '12:00 - 18:00' },
              { key: 'time_evening', label: '🌆 저녁', time: '18:00 - 24:00' },
              { key: 'time_night', label: '🌙 심야', time: '00:00 - 06:00' }
            ].map(item => (
              <div
                key={item.key}
                onClick={() => setAlertSettings({ ...alertSettings, [item.key]: !alertSettings[item.key as keyof AlertSettings] })}
                className={`flex justify-between items-center p-4 rounded-xl cursor-pointer transition ${
                  alertSettings[item.key as keyof AlertSettings]
                    ? 'bg-[#00d395]/10 border-2 border-[#00d395]'
                    : `${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'} border border-transparent`
                }`}
              >
                <div>
                  <p className={`font-semibold ${currentColors.text}`}>{item.label}</p>
                  <p className={`text-sm ${currentColors.textSecondary}`}>{item.time}</p>
                </div>
                <div className={`w-6 h-6 rounded-md flex items-center justify-center ${
                  alertSettings[item.key as keyof AlertSettings] ? 'bg-[#00d395] text-black' : theme === 'dark' ? 'bg-white/20' : 'bg-gray-200'
                }`}>
                  {alertSettings[item.key as keyof AlertSettings] && '✓'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 알림 유형 */}
        <div className={`${theme === 'dark' ? 'bg-[#1a1a2e]' : 'bg-white'} rounded-2xl p-6 border ${currentColors.cardBorder}`}>
          <h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>📬 알림 유형</h3>
          <div className="space-y-3">
            {[
              { key: 'alert_signal', label: '🚨 AI 시그널', desc: 'LONG/SHORT 진입 신호' },
              { key: 'alert_score_change', label: '📊 점수 변동', desc: '체크리스트 점수 급변' },
              { key: 'alert_price', label: '💰 가격 알림', desc: '목표가/손절가 도달' }
            ].map(item => (
              <div
                key={item.key}
                onClick={() => setAlertSettings({ ...alertSettings, [item.key]: !alertSettings[item.key as keyof AlertSettings] })}
                className={`flex justify-between items-center p-4 rounded-xl cursor-pointer transition ${
                  alertSettings[item.key as keyof AlertSettings]
                    ? 'bg-[#00d395]/10 border-2 border-[#00d395]'
                    : `${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'} border border-transparent`
                }`}
              >
                <div>
                  <p className={`font-semibold ${currentColors.text}`}>{item.label}</p>
                  <p className={`text-sm ${currentColors.textSecondary}`}>{item.desc}</p>
                </div>
                <div className={`w-6 h-6 rounded-md flex items-center justify-center ${
                  alertSettings[item.key as keyof AlertSettings] ? 'bg-[#00d395] text-black' : theme === 'dark' ? 'bg-white/20' : 'bg-gray-200'
                }`}>
                  {alertSettings[item.key as keyof AlertSettings] && '✓'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 저장 버튼 */}
        <div className="col-span-full">
          <button
            type="button"
            onClick={saveAlertSettings}
            disabled={settingsSaving}
            className="w-full bg-[#00d395] text-black py-4 rounded-xl font-bold text-lg hover:bg-[#00d395]/90 disabled:opacity-50 transition"
          >
            {settingsSaving ? '저장 중...' : '💾 설정 저장'}
          </button>
        </div>
      </div>
    )
  }

  // 포트폴리오 탭
  const PortfolioTab = () => {
    const stats = calculatePortfolioStats()

    return (
      <div className="space-y-6">
        {/* 통계 */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: '총 포지션', value: stats.total, icon: '📋' },
            { label: '활성', value: stats.active, icon: '🟢', color: 'text-[#00d395]' },
            { label: '승률', value: `${stats.winRate}%`, icon: '🎯', color: 'text-[#00d395]' },
            { label: '실현 수익', value: `${parseFloat(stats.totalPnL) >= 0 ? '+' : ''}${stats.totalPnL}%`, icon: '💰', color: parseFloat(stats.totalPnL) >= 0 ? 'text-[#00d395]' : 'text-[#ff6b6b]' },
            { label: '승/패', value: `${stats.wins}/${stats.losses}`, icon: '📊' }
          ].map((stat, idx) => (
            <div key={idx} className={`${theme === 'dark' ? 'bg-[#1a1a2e]' : 'bg-white'} rounded-xl p-4 border ${currentColors.cardBorder} text-center`}>
              <div className="text-2xl mb-2">{stat.icon}</div>
              <div className={`text-2xl font-bold ${stat.color || currentColors.text}`}>{stat.value}</div>
              <div className={`text-sm ${currentColors.textSecondary}`}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* 새 포지션 추가 */}
        <div className={`${theme === 'dark' ? 'bg-[#1a1a2e]' : 'bg-white'} rounded-2xl p-6 border ${currentColors.cardBorder}`}>
          <h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>➕ 새 포지션 추가</h3>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {/* 코인 선택 - 커스텀 드롭다운 */}
            <div className="relative" ref={coinDropdownRef}>
              <label className={`block text-sm ${currentColors.textSecondary} mb-1`}>코인</label>
              <button
                type="button"
                onClick={() => setShowCoinDropdown(!showCoinDropdown)}
                className={`w-full p-3 rounded-xl border ${currentColors.cardBorder} ${theme === 'dark' ? 'bg-white/5 text-white' : 'bg-gray-50 text-gray-900'} text-left flex justify-between items-center`}
              >
                <span>{positionCoin}</span>
                <span className={`transition-transform ${showCoinDropdown ? 'rotate-180' : ''}`}>▼</span>
              </button>
              
              {showCoinDropdown && (
                <div className={`absolute z-50 w-full mt-1 rounded-xl border ${currentColors.cardBorder} ${theme === 'dark' ? 'bg-[#1a1a2e]' : 'bg-white'} shadow-lg`}>
                  <div className="max-h-60 overflow-y-auto">
                    {allCoins.map(coin => (
                      <button
                        key={coin}
                        type="button"
                        onClick={() => {
                          setPositionCoin(coin)
                          setShowCoinDropdown(false)
                        }}
                        className={`w-full px-4 py-3 text-left hover:bg-[#00d395]/20 transition ${
                          positionCoin === coin ? 'bg-[#00d395]/10 text-[#00d395]' : currentColors.text
                        }`}
                      >
                        {coin}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* 방향 선택 */}
            <div>
              <label className={`block text-sm ${currentColors.textSecondary} mb-1`}>방향</label>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setPositionType('LONG')}
                  className={`flex-1 p-3 rounded-l-xl font-semibold transition ${
                    positionType === 'LONG' 
                      ? 'bg-[#00d395] text-black' 
                      : `${theme === 'dark' ? 'bg-white/5 text-white/70' : 'bg-gray-100 text-gray-600'}`
                  }`}
                >
                  🟢
                </button>
                <button
                  type="button"
                  onClick={() => setPositionType('SHORT')}
                  className={`flex-1 p-3 rounded-r-xl font-semibold transition ${
                    positionType === 'SHORT' 
                      ? 'bg-[#ff6b6b] text-white' 
                      : `${theme === 'dark' ? 'bg-white/5 text-white/70' : 'bg-gray-100 text-gray-600'}`
                  }`}
                >
                  🔴
                </button>
              </div>
            </div>
            
            {/* 진입가 - uncontrolled */}
            <div>
              <label className={`block text-sm ${currentColors.textSecondary} mb-1`}>진입가</label>
              <input
                ref={entryRef}
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                className={`w-full p-3 rounded-xl border ${currentColors.cardBorder} ${theme === 'dark' ? 'bg-white/5 text-white' : 'bg-gray-50 text-gray-900'}`}
              />
            </div>
            
            {/* 목표가 - uncontrolled */}
            <div>
              <label className={`block text-sm ${currentColors.textSecondary} mb-1`}>목표가</label>
              <input
                ref={targetRef}
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                className={`w-full p-3 rounded-xl border ${currentColors.cardBorder} ${theme === 'dark' ? 'bg-white/5 text-white' : 'bg-gray-50 text-gray-900'}`}
              />
            </div>
            
            {/* 손절가 - uncontrolled */}
            <div>
              <label className={`block text-sm ${currentColors.textSecondary} mb-1`}>손절가</label>
              <input
                ref={stopRef}
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                className={`w-full p-3 rounded-xl border ${currentColors.cardBorder} ${theme === 'dark' ? 'bg-white/5 text-white' : 'bg-gray-50 text-gray-900'}`}
              />
            </div>
            
            {/* 추가 버튼 */}
            <div className="flex items-end">
              <button
                type="button"
                onClick={addPosition}
                className="w-full bg-[#00d395] text-black p-3 rounded-xl font-bold hover:bg-[#00d395]/90 transition"
              >
                추가
              </button>
            </div>
          </div>
        </div>

        {/* 포지션 목록 */}
        <div className={`${theme === 'dark' ? 'bg-[#1a1a2e]' : 'bg-white'} rounded-2xl p-6 border ${currentColors.cardBorder}`}>
          <h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>📋 포지션 목록</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}>
                  {['코인', '방향', '진입가', '목표가', '손절가', '상태', '액션'].map(h => (
                    <th key={h} className={`text-left p-3 text-sm ${currentColors.textSecondary}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {portfolioPositions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className={`text-center p-8 ${currentColors.textSecondary}`}>
                      아직 포지션이 없습니다. 위에서 추가해보세요!
                    </td>
                  </tr>
                ) : (
                  portfolioPositions.map(position => (
                    <tr key={position.id} className={`border-b ${theme === 'dark' ? 'border-white/5' : 'border-gray-100'}`}>
                      <td className={`p-3 font-bold ${currentColors.text}`}>{position.coin_symbol}</td>
                      <td className="p-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          position.position_type === 'LONG' ? 'bg-[#00d395]/20 text-[#00d395]' : 'bg-[#ff6b6b]/20 text-[#ff6b6b]'
                        }`}>
                          {position.position_type === 'LONG' ? '🟢' : '🔴'} {position.position_type}
                        </span>
                      </td>
                      <td className={`p-3 ${currentColors.text}`}>${position.entry_price.toLocaleString()}</td>
                      <td className="p-3 text-blue-400">${position.target_price.toLocaleString()}</td>
                      <td className="p-3 text-[#ff6b6b]">${position.stop_loss.toLocaleString()}</td>
                      <td className="p-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          position.status === 'active' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/10 text-white/50'
                        }`}>
                          {position.status === 'active' ? '활성' : '종료'}
                        </span>
                      </td>
                      <td className="p-3">
                        {position.status === 'active' && (
                          <button
                            type="button"
                            onClick={() => closePosition(position)}
                            className="px-3 py-1 border border-[#ff6b6b] text-[#ff6b6b] rounded-lg text-sm hover:bg-[#ff6b6b]/10 transition"
                          >
                            종료
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  // 리포트 탭
  const ReportTab = () => {
    const stats = calculatePortfolioStats()

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={`${theme === 'dark' ? 'bg-[#1a1a2e]' : 'bg-white'} rounded-2xl p-6 border ${currentColors.cardBorder}`}>
          <h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>📊 주간 리포트</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
              <p className={`text-sm ${currentColors.textSecondary} mb-1`}>총 거래</p>
              <p className={`text-3xl font-bold ${currentColors.text}`}>{stats.total}</p>
            </div>
            <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
              <p className={`text-sm ${currentColors.textSecondary} mb-1`}>승률</p>
              <p className="text-3xl font-bold text-[#00d395]">{stats.winRate}%</p>
            </div>
            <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
              <p className={`text-sm ${currentColors.textSecondary} mb-1`}>승/패</p>
              <p className={`text-3xl font-bold ${currentColors.text}`}>
                <span className="text-[#00d395]">{stats.wins}</span> / <span className="text-[#ff6b6b]">{stats.losses}</span>
              </p>
            </div>
            <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
              <p className={`text-sm ${currentColors.textSecondary} mb-1`}>총 수익률</p>
              <p className={`text-3xl font-bold ${parseFloat(stats.totalPnL) >= 0 ? 'text-[#00d395]' : 'text-[#ff6b6b]'}`}>
                {parseFloat(stats.totalPnL) >= 0 ? '+' : ''}{stats.totalPnL}%
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={downloadPDF}
            className="w-full bg-[#00d395] text-black py-3 rounded-xl font-bold hover:bg-[#00d395]/90 transition"
          >
            📥 리포트 다운로드 (PDF)
          </button>
          <p className={`text-xs ${currentColors.textSecondary} mt-2 text-center`}>
            * 인쇄 다이얼로그에서 "PDF로 저장"을 선택하세요
          </p>
        </div>

        <div className={`${theme === 'dark' ? 'bg-[#1a1a2e]' : 'bg-white'} rounded-2xl p-6 border ${currentColors.cardBorder}`}>
          <h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>📋 트레이딩 통계</h3>
          <div className="space-y-3">
            {[
              { label: '평균 보유 기간', value: '1.5일' },
              { label: '평균 손익비', value: '1:1.5' },
              { label: '최대 연속 승', value: `${stats.wins}회` },
              { label: '평균 수익률 (승)', value: '+2.1%', color: 'text-[#00d395]' },
              { label: '평균 손실률 (패)', value: '-1.3%', color: 'text-[#ff6b6b]' }
            ].map((item, idx) => (
              <div key={idx} className={`flex justify-between p-3 border-b ${theme === 'dark' ? 'border-white/10' : 'border-gray-100'}`}>
                <span className={currentColors.textSecondary}>{item.label}</span>
                <span className={`font-bold ${item.color || currentColors.text}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className={`col-span-full ${theme === 'dark' ? 'bg-[#1a1a2e]' : 'bg-white'} rounded-2xl p-6 border ${currentColors.cardBorder}`}>
          <h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>📄 PDF 리포트 내용</h3>
          <div className={`${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-4`}>
            <p className={`${currentColors.text} mb-2`}>다운로드되는 PDF에는 다음 내용이 포함됩니다:</p>
            <ul className={`${currentColors.textSecondary} space-y-1 text-sm`}>
              <li>• 📊 주간 요약 (총 거래, 승률, 승/패, 총 수익률)</li>
              <li>• 📋 전체 포지션 내역 (코인, 방향, 진입/목표/손절가, 수익률)</li>
              <li>• 📈 트레이딩 통계 (평균 보유 기간, 손익비, 연속 승 등)</li>
              <li>• 사용자 정보 및 생성 일시</li>
            </ul>
          </div>
        </div>
      </div>
    )
  }

  // 테마 로드 전 깜빡임 방지
  if (!themeLoaded) {
    return (
      <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#00d395] border-t-transparent rounded-full animate-spin"></div>
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
  const bannerAds = adSlots.filter(ad => ad.position === 'banner')
  const ownAds = sidebarAds.filter(ad => ad.ad_type === 'own')
  const sponsoredAds = sidebarAds.filter(ad => ad.ad_type === 'sponsored')

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#0a0a14]' : 'bg-gray-100'} ${currentColors.text} transition-colors duration-300`}>
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
                <button
                  type="button"
                  onClick={toggleTheme}
                  className={`w-12 h-6 rounded-full relative transition-colors ${theme === 'dark' ? 'bg-[#00d395]' : 'bg-gray-400'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${theme === 'dark' ? 'left-7' : 'left-1'}`} />
                </button>
                <span className="text-sm">🌙</span>
              </div>
              <div className={`text-sm ${currentColors.textSecondary}`}>
                업데이트: {lastUpdate.toLocaleTimeString('ko-KR')} | <span ref={countdownRef} className="text-[#00d395] ml-1">{countdown}초</span>
              </div>
              <span className={currentColors.textSecondary}>{profile?.nickname || user?.email?.split('@')[0]}</span>
              <Link href="/pricing" className="text-sm text-[#00d395] hover:underline">요금제</Link>
              <button type="button" onClick={() => supabase.auth.signOut().then(() => router.push('/'))} className={`text-sm ${currentColors.textSecondary} hover:${currentColors.text}`}>로그아웃</button>
            </div>
          </div>
        </div>
      </header>

      <div className={`border-b ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}>
        <div className="max-w-[1600px] mx-auto px-4">
          <div className="flex gap-2 py-3 overflow-x-auto">
            {[
              { id: 'dashboard', label: '📊 대시보드' },
              { id: 'alerts', label: '🔔 알림 설정' },
              { id: 'portfolio', label: '💼 포트폴리오' },
              { id: 'report', label: '📈 리포트' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-5 py-2.5 rounded-xl font-semibold whitespace-nowrap transition ${
                  activeTab === tab.id
                    ? 'bg-[#00d395] text-black'
                    : `${theme === 'dark' ? 'bg-white/5 text-white/70 hover:bg-white/10' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {bannerAds.length > 0 && activeTab === 'dashboard' && (
        <div className="max-w-[1600px] mx-auto px-4 pt-4">
          {bannerAds.map(ad => <div key={ad.id} className="mb-2"><AdCard ad={ad} size="large" /></div>)}
        </div>
      )}

      <div className="max-w-[1600px] mx-auto px-4 py-8">
        {activeTab === 'dashboard' && (
          <div className="flex gap-6">
            <main className="flex-1 min-w-0">
              {profile?.plan !== 'free' && (
                <div className="mb-8">
                  <div className="flex gap-3">
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder="코인명 입력 (예: doge, shib, matic)" className={`flex-1 ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'} border rounded-xl px-4 py-3 focus:outline-none focus:border-[#00d395]`} />
                    <button type="button" onClick={handleSearch} disabled={searchLoading} className="bg-[#00d395] text-black px-8 py-3 rounded-xl font-semibold hover:bg-[#00d395]/90 disabled:opacity-50">{searchLoading ? '검색 중...' : '🔍 분석'}</button>
                  </div>
                </div>
              )}

              {searchResult && (
                <div className="mb-8">
                  <h2 className={`text-xl font-bold mb-4 ${currentColors.text}`}>🔍 검색 결과</h2>
                  <div className="max-w-md"><CoinCard coin={searchResult} /></div>
                </div>
              )}

              {favorites.length > 0 && (
                <section className="mb-10">
                  <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${currentColors.text}`}>⭐ 즐겨찾기<span className={`text-sm ${currentColors.textSecondary} font-normal`}>({favorites.length}{profile?.plan === 'free' ? '/3' : ''})</span></h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {favoriteCoins.map(coin => <CoinCard key={coin.id} coin={coin} />)}
                  </div>
                </section>
              )}

              <section className="mb-10">
                <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${currentColors.text}`}>🔥 핵심 코인 (BTC, ETH, XRP, BNB){dataLoading && <span className="w-4 h-4 border-2 border-[#00d395] border-t-transparent rounded-full animate-spin"></span>}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">{coreCoins.map(coin => <CoinCard key={coin.id} coin={coin} />)}</div>
              </section>

              {profile?.plan !== 'free' ? (
                <section className="mb-10">
                  <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${currentColors.text}`}>📈 실시간 상승 코인 TOP 6<span className="bg-[#00d395] text-black px-2 py-0.5 rounded text-xs font-bold">PRO</span></h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{topGainers.map(coin => <CoinCard key={coin.id} coin={coin} />)}</div>
                </section>
              ) : (
                <section className="mb-10">
                  <div className={`bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-2xl text-center py-12 px-6`}>
                    <h2 className={`text-2xl font-bold mb-4 ${currentColors.text}`}>🔒 PRO 기능 잠금</h2>
                    <p className={`${currentColors.textSecondary} mb-6`}>상승 코인 TOP 6, 무제한 검색, 7단계 상세 분석,<br/>AI 매매 코멘트 등 모든 기능을 이용하세요</p>
                    <Link href="/pricing" className="bg-[#00d395] text-black px-8 py-3 rounded-xl font-semibold inline-block">PRO 업그레이드 →</Link>
                  </div>
                </section>
              )}

              <section>
                <h2 className={`text-xl font-bold mb-4 ${currentColors.text}`}>📊 오늘의 시장 요약</h2>
                <div className={`${theme === 'dark' ? 'bg-[#1a1a2e]' : 'bg-white'} rounded-2xl p-6 border ${currentColors.cardBorder}`}>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                    <div><p className={`${currentColors.textSecondary} text-sm mb-1`}>분석 코인</p><p className={`text-2xl font-bold ${currentColors.text}`}>{coreCoins.length + topGainers.length}</p></div>
                    <div><p className={`${currentColors.textSecondary} text-sm mb-1`}>매수 시그널</p><p className="text-2xl font-bold text-[#00d395]">{[...coreCoins, ...topGainers].filter(c => c.signal === 'buy' || c.signal === 'strong_buy').length}</p></div>
                    <div><p className={`${currentColors.textSecondary} text-sm mb-1`}>관망</p><p className="text-2xl font-bold text-yellow-400">{[...coreCoins, ...topGainers].filter(c => c.signal === 'hold').length}</p></div>
                    <div><p className={`${currentColors.textSecondary} text-sm mb-1`}>매도 시그널</p><p className="text-2xl font-bold text-[#ff6b6b]">{[...coreCoins, ...topGainers].filter(c => c.signal === 'sell' || c.signal === 'strong_sell').length}</p></div>
                  </div>
                </div>
              </section>
            </main>

            <aside className="hidden xl:block w-72 flex-shrink-0">
              <div className="sticky top-24 space-y-6">
                <div>
                  <h3 className={`text-lg font-bold mb-3 flex items-center gap-2 ${currentColors.text}`}>📢 소통 채널</h3>
                  <div className="space-y-2">{ownAds.map(ad => <AdCard key={ad.id} ad={ad} />)}</div>
                </div>
                <div className={`border-t ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'} pt-6`}>
                  <h4 className={`text-sm ${currentColors.textSecondary} mb-3 flex items-center gap-2`}>💎 파트너</h4>
                  {sponsoredAds.length > 0 ? (
                    <div className="space-y-2">{sponsoredAds.map(ad => <AdCard key={ad.id} ad={ad} />)}</div>
                  ) : (
                    <div className={`${theme === 'dark' ? 'bg-white/5 border-white/20' : 'bg-gray-50 border-gray-200'} border border-dashed rounded-xl p-4 text-center`}>
                      <p className={`${currentColors.textSecondary} text-sm`}>광고 슬롯 A</p>
                    </div>
                  )}
                </div>
              </div>
            </aside>
          </div>
        )}

        {activeTab === 'alerts' && <AlertSettingsTab />}
        {activeTab === 'portfolio' && <PortfolioTab />}
        {activeTab === 'report' && <ReportTab />}
      </div>

      {activeTab === 'dashboard' && (
        <div className={`xl:hidden border-t ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'} p-4`}>
          <h3 className={`text-lg font-bold mb-3 ${currentColors.text}`}>📢 소통 채널</h3>
          <div className="grid grid-cols-2 gap-2">
            {ownAds.slice(0, 4).map(ad => (
              <button key={ad.id} type="button" onClick={() => handleAdClick(ad)} className={`bg-gradient-to-r ${ad.bg_color} border ${ad.border_color} rounded-lg p-3 text-left`}>
                <span className="text-lg">{ad.icon}</span>
                <p className="text-sm font-semibold mt-1 text-white">{ad.title}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {showDetail && selectedCoin && (
        <div className={`fixed inset-0 z-50 ${theme === 'dark' ? 'bg-[#0a0a14]' : 'bg-white'}`} style={{ touchAction: 'pan-y' }}>
          <div className={`sticky top-0 ${theme === 'dark' ? 'bg-[#0a0a14] border-white/10' : 'bg-white border-gray-200'} border-b z-10`}>
            <div className="flex justify-between items-center p-4">
              <div className="flex items-center gap-3">
                <h2 className={`text-xl font-bold ${currentColors.text}`}>{selectedCoin.symbol.toUpperCase()}</h2>
                <SignalBadge signal={selectedCoin.signal} />
              </div>
              <button type="button" onClick={() => setShowDetail(false)} className={`${theme === 'dark' ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-100 hover:bg-gray-200'} px-4 py-2 rounded-lg font-semibold ${currentColors.text}`}>✕ 닫기</button>
            </div>
          </div>
          <div className="overflow-y-auto" style={{ height: 'calc(100vh - 70px)', WebkitOverflowScrolling: 'touch' }}>
            <div className="max-w-2xl mx-auto p-4 pb-20">
              <div className={`${theme === 'dark' ? 'bg-[#1a1a2e]' : 'bg-white'} rounded-2xl p-6 mb-4 border ${currentColors.cardBorder}`}>
                <p className={`${currentColors.textSecondary} mb-2`}>{selectedCoin.name}</p>
                <p className="text-4xl font-bold text-[#00d395] mb-2">${selectedCoin.current_price.toLocaleString(undefined, { maximumFractionDigits: 6 })}</p>
                <p className={`text-lg ${selectedCoin.price_change_percentage_24h >= 0 ? 'text-[#00d395]' : 'text-[#ff6b6b]'}`}>{selectedCoin.price_change_percentage_24h >= 0 ? '▲' : '▼'} {Math.abs(selectedCoin.price_change_percentage_24h || 0).toFixed(2)}% (24h)</p>
              </div>
              <div className={`${theme === 'dark' ? 'bg-[#1a1a2e]' : 'bg-white'} rounded-2xl p-6 mb-4 border ${currentColors.cardBorder}`}>
                <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${currentColors.text}`}>📊 7단계 체크리스트<span className="text-[#00d395] text-2xl font-bold">{selectedCoin.scores.total}/140</span></h3>
                {profile?.plan !== 'free' ? (
                  <div className="space-y-3">
                    <ScoreBar label="1. 거시환경 (금리/달러/증시)" score={selectedCoin.scores.macro} max={20} color="bg-blue-500" />
                    <ScoreBar label="2. ETF/제도권 자금" score={selectedCoin.scores.etf} max={25} color="bg-purple-500" />
                    <ScoreBar label="3. 온체인 핵심 지표" score={selectedCoin.scores.onchain} max={25} color="bg-green-500" />
                    <ScoreBar label="4. AI/메타버스 트렌드" score={selectedCoin.scores.ai} max={20} color="bg-pink-500" />
                    <ScoreBar label="5. 선물시장 분석" score={selectedCoin.scores.futures} max={20} color="bg-orange-500" />
                    <ScoreBar label="6. 기술적 분석" score={selectedCoin.scores.technical} max={20} color="bg-cyan-500" />
                    <ScoreBar label="7. 전략 점수" score={selectedCoin.scores.strategy} max={10} color="bg-yellow-500" />
                  </div>
                ) : (
                  <div className={`${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-6 text-center`}><p className={`${currentColors.textSecondary} mb-3`}>🔒 PRO 회원만 상세 분석을 볼 수 있습니다</p><Link href="/pricing" className="bg-[#00d395] text-black px-6 py-2 rounded-xl font-semibold inline-block">PRO 업그레이드</Link></div>
                )}
              </div>
              <div className={`${theme === 'dark' ? 'bg-[#1a1a2e]' : 'bg-white'} rounded-2xl p-6 mb-4 border ${currentColors.cardBorder}`}>
                <h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>💰 매매 전략</h3>
                {profile?.plan !== 'free' ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#00d395]/10 border border-[#00d395]/30 rounded-xl p-4"><p className={`${currentColors.textSecondary} text-sm mb-1`}>롱 진입가</p><p className="text-[#00d395] text-xl font-bold">${selectedCoin.entry_price.toLocaleString(undefined, { maximumFractionDigits: 4 })}</p></div>
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4"><p className={`${currentColors.textSecondary} text-sm mb-1`}>목표가</p><p className="text-blue-400 text-xl font-bold">${selectedCoin.target_price.toLocaleString(undefined, { maximumFractionDigits: 4 })}</p></div>
                    <div className="bg-[#ff6b6b]/10 border border-[#ff6b6b]/30 rounded-xl p-4"><p className={`${currentColors.textSecondary} text-sm mb-1`}>손절가</p><p className="text-[#ff6b6b] text-xl font-bold">${selectedCoin.stop_loss.toLocaleString(undefined, { maximumFractionDigits: 4 })}</p></div>
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4"><p className={`${currentColors.textSecondary} text-sm mb-1`}>손익비</p><p className="text-yellow-400 text-xl font-bold">{selectedCoin.risk_reward}</p></div>
                  </div>
                ) : (
                  <div className={`${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-6 text-center`}><p className={currentColors.textSecondary}>🔒 PRO 회원 전용</p></div>
                )}
              </div>
              <div className={`${theme === 'dark' ? 'bg-[#1a1a2e]' : 'bg-white'} rounded-2xl p-6 mb-4 border ${currentColors.cardBorder}`}>
                <h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>🤖 AI 매매 코멘트</h3>
                {profile?.plan !== 'free' ? (
                  <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-xl p-4"><p className={`${theme === 'dark' ? 'text-white/90' : 'text-gray-700'} leading-relaxed text-base`}>{selectedCoin.ai_comment}</p></div>
                ) : (
                  <div className={`${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-6 text-center`}><p className={`${currentColors.textSecondary} mb-3`}>🔒 AI 분석은 PRO 회원 전용입니다</p><Link href="/pricing" className="bg-[#00d395] text-black px-6 py-2 rounded-xl font-semibold inline-block">PRO 업그레이드</Link></div>
                )}
              </div>
              <button type="button" onClick={() => setShowDetail(false)} className={`w-full py-4 ${theme === 'dark' ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-100 hover:bg-gray-200'} rounded-xl font-semibold text-lg ${currentColors.text}`}>닫기</button>
            </div>
          </div>
        </div>
      )}
      
      <style jsx global>{`
        input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #00d395;
          cursor: grab;
          border: 4px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          margin-top: -12px;
        }
        input[type="range"]::-webkit-slider-thumb:active {
          cursor: grabbing;
          transform: scale(1.1);
        }
        input[type="range"]::-moz-range-thumb {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #00d395;
          cursor: grab;
          border: 4px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        input[type="range"]::-webkit-slider-runnable-track {
          height: 4px;
          background: transparent;
        }
        input[type="range"]::-moz-range-track {
          height: 4px;
          background: transparent;
        }
      `}</style>
    </div>
  )
}
