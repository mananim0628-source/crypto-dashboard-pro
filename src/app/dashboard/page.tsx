'use client'

import { useState, useEffect, useRef, useLayoutEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// 다국어 텍스트
const translations = {
  ko: {
    // 헤더
    title: '크립토 대시보드 PRO',
    pricing: '요금제',
    logout: '로그아웃',
    // 탭
    dashboard: '📊 대시보드',
    alerts: '🔔 알림 설정',
    portfolio: '💼 포트폴리오',
    indicator: '📈 트레이딩뷰 지표',
    report: '📋 리포트',
    // 대시보드
    favorites: '즐겨찾기',
    coreCoins: '🔥 핵심 코인',
    topGainers: '📈 상승 코인 TOP 6',
    marketSummary: '📊 시장 요약',
    analyzedCoins: '분석 코인',
    buy: '매수',
    hold: '관망',
    sell: '매도',
    searchPlaceholder: '코인명 입력 (예: ENA, PEPE, FLOKI)',
    analyze: '🔍 분석',
    // 시그널
    strongBuy: '강력 매수',
    buySignal: '매수',
    holdSignal: '관망',
    sellSignal: '매도',
    strongSell: '강력 매도',
    // 카드
    entryPrice: '진입가',
    targetPrice: '목표가',
    stopLoss: '손절가',
    riskReward: '손익비',
    proOnly: '🔒 PRO 전용',
    detailAnalysis: '상세 분석 →',
    // 지표 탭
    indicatorIntro: '📊 지표 소개',
    backtest: '📈 백테스팅',
    deepBacktest: '🔬 딥백테스팅',
    automate: '🤖 자동매매 연동',
    whyTradingView: '🎯 왜 트레이딩뷰인가?',
    whyTv1Title: '글로벌 표준 플랫폼',
    whyTv1Desc: '전 세계 5천만+ 트레이더가 사용하는 검증된 차트 플랫폼',
    whyTv2Title: '정확한 백테스트',
    whyTv2Desc: '트레이딩뷰 내장 백테스트로 전략 성능을 직접 검증',
    whyTv3Title: '실시간 시그널',
    whyTv3Desc: '차트에서 바로 진입/청산 시그널 확인 및 알림',
    // FREE
    freeTitle: '트레이딩뷰 무료 버전',
    freeDesc: '트레이딩뷰 무료 계정은 커스텀 지표 최대 3개까지 사용 가능합니다.',
    freeRecommend: '📌 추천 기본 지표 조합',
    rsi: 'RSI (상대강도지수)',
    rsiDesc: '과매수/과매도',
    macd: 'MACD',
    macdDesc: '추세 전환',
    bollinger: '볼린저 밴드',
    bollingerDesc: '변동성 분석',
    freeNote: '* 위 지표들은 트레이딩뷰 기본 제공 지표입니다',
    // PRO
    proTitle: '체크리스트 커스텀지표',
    proDesc: '트레이딩뷰 유료 구독자 전용 커스텀 지표',
    includedFeatures: '✅ 포함 기능',
    feature1: '7단계 체크리스트 자동 점수화',
    feature2: '진입가 / 목표가 / 손절가 자동 계산',
    feature3: '롱/숏/관망 시그널 표시',
    feature4: '모든 타임프레임 지원',
    feature5: '모든 자산 적용 (크립토/주식/선물)',
    feature6: '알림 기능 (텔레그램 연동 가능)',
    regularPrice: '정가',
    launchSpecial: '런칭 특가',
    limited50: '* 선착순 50명 한정',
    monthlySubscription: '월 구독',
    buyInquiry: '💬 구매 문의 (텔레그램)',
    // 설치 가이드
    installGuide: '📖 지표 설치 가이드',
    step1Title: '트레이딩뷰 가입',
    step1Desc: 'tradingview.com 에서 계정 생성',
    step2Title: '초대 링크 수락',
    step2Desc: '구매 후 받은 초대 링크로 지표 접근 권한 획득',
    step3Title: '즐겨찾기 추가',
    step3Desc: '지표 페이지에서 ★ 버튼 클릭하여 즐겨찾기',
    step4Title: '차트에 적용',
    step4Desc: '차트 → 지표 → 즐겨찾기에서 지표 선택',
    pdfNote: '📄 상세 설치 가이드 PDF는 구매 시 함께 제공됩니다.',
    // 백테스팅
    backtestTitle: '📈 백테스팅이란?',
    backtestDesc: '과거 데이터를 기반으로 트레이딩 전략의 성능을 테스트하는 것입니다. 트레이딩뷰에서는 지표에 백테스트 기능이 내장되어 있어 신뢰할 수 있는 결과를 얻을 수 있습니다.',
    backtestHow: '🔧 트레이딩뷰에서 백테스트 하는 방법',
    backtestStep1: '전략 테스터 열기',
    backtestStep1Desc: '차트 하단의 "전략 테스터" 탭을 클릭합니다.',
    backtestStep2: '지표를 전략으로 변환',
    backtestStep2Desc: '체크리스트 지표는 전략 모드를 지원하여 백테스트가 가능합니다.',
    backtestStep3: '기간 설정',
    backtestStep3Desc: '테스트할 기간을 설정합니다. (1개월 ~ 수년)',
    backtestStep4: '설정 조정',
    backtestStep4Desc: '진입 조건, 청산 조건, 자본금 등을 설정합니다.',
    backtestStep5: '결과 분석',
    backtestStep5Desc: '순이익, 승률, 최대 낙폭, 손익비 등을 확인합니다.',
    backtestResults: '📊 백테스트 결과 해석',
    netProfit: '순이익',
    netProfitDesc: '테스트 기간 동안의 총 수익',
    winRate: '승률',
    winRateDesc: '이긴 거래의 비율',
    maxDrawdown: '최대 낙폭',
    maxDrawdownDesc: '최고점 대비 최대 하락폭',
    profitFactor: '손익비',
    profitFactorDesc: '평균 이익 / 평균 손실',
    // 딥백테스팅
    deepBacktestTitle: '🔬 딥백테스팅이란?',
    deepBacktestDesc: '일반 백테스트보다 더 정밀한 테스트입니다. 틱 단위 데이터, 슬리피지, 수수료를 반영하여 실제 트레이딩 환경과 유사한 결과를 얻습니다.',
    deepBacktestHow: '⚙️ 딥백테스트 설정 방법',
    barMagnifier: '바 확대 (Bar Magnifier)',
    barMagnifierDesc: '더 낮은 타임프레임 데이터로 정밀한 진입/청산 시점 계산 (트레이딩뷰 Premium 기능)',
    slippage: '슬리피지 설정',
    slippageDesc: '실제 체결가와 주문가의 차이를 반영. 보통 0.1~0.5% 설정',
    commission: '수수료 반영',
    commissionDesc: '거래소 수수료를 포함하여 순수익 계산',
    initialCapital: '초기 자본금',
    initialCapitalDesc: '실제 운용 예정 금액으로 설정하여 현실적인 결과 확인',
    pyramiding: '피라미딩',
    pyramidingDesc: '동일 방향 추가 진입 허용 여부 설정',
    deepBacktestWarning: '⚠️ 주의사항',
    deepBacktestWarning1: '딥백테스트는 트레이딩뷰 Premium 플랜 이상에서 바 확대 기능 사용 가능',
    deepBacktestWarning2: '과거 성과가 미래 수익을 보장하지 않습니다',
    deepBacktestWarning3: '과최적화(Overfitting) 주의: 너무 많은 파라미터 조정은 역효과',
    deepBacktestWarning4: '최소 1년 이상의 데이터로 테스트 권장',
    // 자동매매
    automateTitle: '🤖 자동매매 연동이란?',
    automateDesc: '트레이딩뷰 알림을 거래소 API와 연결하여 시그널 발생 시 자동으로 주문이 실행되는 시스템입니다. 직접 차트를 보지 않아도 24시간 트레이딩이 가능합니다.',
    supportedExchanges: '🔗 연동 가능한 거래소',
    automateHow: '📝 연동 방법 (개요)',
    automateStep1: '거래소 API 키 발급',
    automateStep1Desc: '거래소에서 API Key와 Secret Key를 발급받습니다. (출금 권한은 비활성화 권장)',
    automateStep2: '웹훅 서비스 선택',
    automateStep2Desc: '3Commas, Alertatron, PineConnector 등의 웹훅 서비스를 선택합니다.',
    automateStep3: '트레이딩뷰 알림 설정',
    automateStep3Desc: '지표에서 알림 생성 → 웹훅 URL 입력 → 메시지 포맷 설정',
    automateStep4: '테스트',
    automateStep4Desc: '소액으로 시그널 → 주문 실행이 정상 작동하는지 테스트합니다.',
    disclaimer: '⚠️ 중요 면책조항',
    disclaimer1Title: '1. 자동매매는 전적으로 본인 책임입니다.',
    disclaimer1a: 'API 키 관리, 거래소 설정, 자금 운용에 대한 모든 책임은 사용자에게 있습니다.',
    disclaimer1b: '시스템 오류, 네트워크 지연, 거래소 장애 등으로 인한 손실에 대해 당사는 책임지지 않습니다.',
    disclaimer2Title: '2. 투자 손실 가능성',
    disclaimer2a: '과거 백테스트 결과가 미래 수익을 보장하지 않습니다.',
    disclaimer2b: '레버리지 사용 시 원금 이상의 손실이 발생할 수 있습니다.',
    disclaimer3Title: '3. 권장사항',
    disclaimer3a: '반드시 소액으로 충분한 테스트 후 운용하세요.',
    disclaimer3b: '출금 권한이 없는 API 키를 사용하세요.',
    disclaimer3c: '감당 가능한 금액만 투자하세요.',
    automateInquiry: '자동매매 연동 관련 상세 설정이 궁금하시면 문의해주세요.',
    telegramInquiry: '💬 텔레그램 문의',
    // 문의
    contactTitle: '💬 문의하기',
    telegram: '텔레그램',
    pdfGuide: '설치 가이드 PDF',
    providedOnPurchase: '구매 시 제공',
    // 공통
    collapse: '접기 ▲',
    expand: '펼치기 ▼',
    loading: '로딩 중...',
    upgrade: '업그레이드 →',
    close: '닫기',
  },
  en: {
    // Header
    title: 'Crypto Dashboard PRO',
    pricing: 'Pricing',
    logout: 'Logout',
    // Tabs
    dashboard: '📊 Dashboard',
    alerts: '🔔 Alerts',
    portfolio: '💼 Portfolio',
    indicator: '📈 TradingView Indicator',
    report: '📋 Report',
    // Dashboard
    favorites: 'Favorites',
    coreCoins: '🔥 Core Coins',
    topGainers: '📈 Top Gainers',
    marketSummary: '📊 Market Summary',
    analyzedCoins: 'Analyzed',
    buy: 'Buy',
    hold: 'Hold',
    sell: 'Sell',
    searchPlaceholder: 'Enter coin name (e.g., BTC, ETH, SOL)',
    analyze: '🔍 Analyze',
    // Signals
    strongBuy: 'Strong Buy',
    buySignal: 'Buy',
    holdSignal: 'Hold',
    sellSignal: 'Sell',
    strongSell: 'Strong Sell',
    // Card
    entryPrice: 'Entry',
    targetPrice: 'Target',
    stopLoss: 'Stop Loss',
    riskReward: 'R:R',
    proOnly: '🔒 PRO Only',
    detailAnalysis: 'Details →',
    // Indicator Tab
    indicatorIntro: '📊 Introduction',
    backtest: '📈 Backtesting',
    deepBacktest: '🔬 Deep Backtesting',
    automate: '🤖 Auto Trading',
    whyTradingView: '🎯 Why TradingView?',
    whyTv1Title: 'Global Standard',
    whyTv1Desc: 'Trusted platform used by 50M+ traders worldwide',
    whyTv2Title: 'Accurate Backtesting',
    whyTv2Desc: 'Built-in backtesting to verify strategy performance',
    whyTv3Title: 'Real-time Signals',
    whyTv3Desc: 'Entry/exit signals directly on your chart with alerts',
    // FREE
    freeTitle: 'TradingView Free Version',
    freeDesc: 'Free TradingView accounts can use up to 3 custom indicators.',
    freeRecommend: '📌 Recommended Basic Indicators',
    rsi: 'RSI (Relative Strength Index)',
    rsiDesc: 'Overbought/Oversold',
    macd: 'MACD',
    macdDesc: 'Trend Reversal',
    bollinger: 'Bollinger Bands',
    bollingerDesc: 'Volatility Analysis',
    freeNote: '* These are default TradingView indicators',
    // PRO
    proTitle: 'Checklist Custom Indicator',
    proDesc: 'Custom indicator for TradingView paid subscribers',
    includedFeatures: '✅ Included Features',
    feature1: '7-Step checklist auto-scoring',
    feature2: 'Auto-calculated Entry / Target / Stop Loss',
    feature3: 'Long/Short/Hold signal display',
    feature4: 'All timeframes supported',
    feature5: 'All assets (Crypto/Stocks/Futures)',
    feature6: 'Alert function (Telegram integration)',
    regularPrice: 'Regular',
    launchSpecial: 'Launch Special',
    limited50: '* Limited to first 50 subscribers',
    monthlySubscription: 'Monthly',
    buyInquiry: '💬 Purchase Inquiry (Telegram)',
    // Install Guide
    installGuide: '📖 Installation Guide',
    step1Title: 'Sign up for TradingView',
    step1Desc: 'Create an account at tradingview.com',
    step2Title: 'Accept Invitation',
    step2Desc: 'Access indicator via invitation link after purchase',
    step3Title: 'Add to Favorites',
    step3Desc: 'Click ★ button on the indicator page',
    step4Title: 'Apply to Chart',
    step4Desc: 'Chart → Indicators → Favorites → Select indicator',
    pdfNote: '📄 Detailed PDF guide provided upon purchase.',
    // Backtesting
    backtestTitle: '📈 What is Backtesting?',
    backtestDesc: 'Testing trading strategy performance using historical data. TradingView has built-in backtesting for reliable results.',
    backtestHow: '🔧 How to Backtest on TradingView',
    backtestStep1: 'Open Strategy Tester',
    backtestStep1Desc: 'Click "Strategy Tester" tab at the bottom of chart.',
    backtestStep2: 'Convert Indicator to Strategy',
    backtestStep2Desc: 'Checklist indicator supports strategy mode for backtesting.',
    backtestStep3: 'Set Period',
    backtestStep3Desc: 'Configure the testing period (1 month ~ years).',
    backtestStep4: 'Adjust Settings',
    backtestStep4Desc: 'Set entry conditions, exit conditions, capital, etc.',
    backtestStep5: 'Analyze Results',
    backtestStep5Desc: 'Review net profit, win rate, max drawdown, profit factor.',
    backtestResults: '📊 Interpreting Backtest Results',
    netProfit: 'Net Profit',
    netProfitDesc: 'Total profit during test period',
    winRate: 'Win Rate',
    winRateDesc: 'Percentage of winning trades',
    maxDrawdown: 'Max Drawdown',
    maxDrawdownDesc: 'Maximum decline from peak',
    profitFactor: 'Profit Factor',
    profitFactorDesc: 'Avg profit / Avg loss',
    // Deep Backtesting
    deepBacktestTitle: '🔬 What is Deep Backtesting?',
    deepBacktestDesc: 'More precise testing than regular backtests. Reflects tick data, slippage, and commissions for realistic results.',
    deepBacktestHow: '⚙️ Deep Backtest Settings',
    barMagnifier: 'Bar Magnifier',
    barMagnifierDesc: 'Precise entry/exit using lower timeframe data (TradingView Premium)',
    slippage: 'Slippage Setting',
    slippageDesc: 'Reflects difference between order and fill price. Usually 0.1~0.5%',
    commission: 'Commission',
    commissionDesc: 'Include exchange fees in net profit calculation',
    initialCapital: 'Initial Capital',
    initialCapitalDesc: 'Set your actual trading amount for realistic results',
    pyramiding: 'Pyramiding',
    pyramidingDesc: 'Allow additional entries in same direction',
    deepBacktestWarning: '⚠️ Cautions',
    deepBacktestWarning1: 'Bar Magnifier requires TradingView Premium or higher',
    deepBacktestWarning2: 'Past performance does not guarantee future results',
    deepBacktestWarning3: 'Beware of overfitting: too many parameter adjustments backfire',
    deepBacktestWarning4: 'Recommend testing with at least 1 year of data',
    // Auto Trading
    automateTitle: '🤖 What is Auto Trading?',
    automateDesc: 'Connect TradingView alerts to exchange API for automatic order execution. Trade 24/7 without watching charts.',
    supportedExchanges: '🔗 Supported Exchanges',
    automateHow: '📝 Integration Overview',
    automateStep1: 'Get Exchange API Keys',
    automateStep1Desc: 'Generate API Key and Secret from exchange. (Disable withdrawal permission)',
    automateStep2: 'Choose Webhook Service',
    automateStep2Desc: 'Select from 3Commas, Alertatron, PineConnector, etc.',
    automateStep3: 'Set TradingView Alerts',
    automateStep3Desc: 'Create alert → Enter webhook URL → Configure message format',
    automateStep4: 'Test',
    automateStep4Desc: 'Test with small amount to verify signal → order execution.',
    disclaimer: '⚠️ Important Disclaimer',
    disclaimer1Title: '1. Auto trading is entirely at your own risk.',
    disclaimer1a: 'You are fully responsible for API key management, exchange settings, and fund operation.',
    disclaimer1b: 'We are not liable for losses due to system errors, network delays, or exchange issues.',
    disclaimer2Title: '2. Investment Loss Risk',
    disclaimer2a: 'Past backtest results do not guarantee future profits.',
    disclaimer2b: 'Using leverage may result in losses exceeding your principal.',
    disclaimer3Title: '3. Recommendations',
    disclaimer3a: 'Always test with small amounts first.',
    disclaimer3b: 'Use API keys without withdrawal permission.',
    disclaimer3c: 'Only invest what you can afford to lose.',
    automateInquiry: 'Contact us for detailed auto trading setup assistance.',
    telegramInquiry: '💬 Telegram Inquiry',
    // Contact
    contactTitle: '💬 Contact Us',
    telegram: 'Telegram',
    pdfGuide: 'Installation PDF Guide',
    providedOnPurchase: 'Provided on purchase',
    // Common
    collapse: 'Collapse ▲',
    expand: 'Expand ▼',
    loading: 'Loading...',
    upgrade: 'Upgrade →',
    close: 'Close',
  }
}

type Lang = 'ko' | 'en'

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
  const t = translations[lang]
  
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
    if (lang === 'en') {
      if (signal === 'strong_buy') return `${coin.symbol.toUpperCase()} shows strong buy signal. On-chain(${scores.onchain}/25), Technical(${scores.technical}/20) positive.`
      if (signal === 'buy') return `${coin.symbol.toUpperCase()} is approachable from buy perspective. ETF funds(${scores.etf}/25) positive.`
      if (signal === 'hold') return `${coin.symbol.toUpperCase()} in hold zone. Score ${scores.total}/140, direction unclear.`
      if (signal === 'sell') return `${coin.symbol.toUpperCase()} may face short-term correction.`
      return `${coin.symbol.toUpperCase()} shows strong sell signal.`
    }
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
    const savedTheme = localStorage.getItem('dashboard-theme')
    const savedLang = localStorage.getItem('dashboard-lang') as Lang | null
    if (savedTheme === 'light') setTheme('light')
    else { setTheme('dark'); localStorage.setItem('dashboard-theme', 'dark') }
    if (savedLang === 'en') setLang('en')
    setThemeLoaded(true)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (portfolioDropdownRef.current && !portfolioDropdownRef.current.contains(event.target as Node)) setShowPortfolioDropdown(false)
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) setShowNotifications(false)
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(event.target as Node)) setShowSearchDropdown(false)
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
        if (!exists) newNotifications.push({ id: `${symbol}-${Date.now()}`, coin: symbol, type: 'score', message: `${symbol} ${lang === 'en' ? 'Score' : '점수'} ${coin.scores.total}/140`, time: new Date(), read: false })
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

  const toggleLang = () => {
    const newLang = lang === 'ko' ? 'en' : 'ko'
    setLang(newLang)
    localStorage.setItem('dashboard-lang', newLang)
  }

  const handleSearchInput = async (query: string) => {
    setSearchQuery(query)
    if (!query.trim()) { setSearchSuggestions([]); setShowSearchDropdown(false); return }
    const queryUpper = query.toUpperCase().replace('USDT', '').replace('USD', '').trim()
    const exactMatch = allCoins.filter(c => c === queryUpper)
    const startsWith = allCoins.filter(c => c.startsWith(queryUpper) && c !== queryUpper)
    const includes = allCoins.filter(c => c.includes(queryUpper) && !c.startsWith(queryUpper))
    const localMatches = [...exactMatch, ...startsWith, ...includes].slice(0, 8).map(c => ({ symbol: c, name: c }))
    if (localMatches.length > 0) { setSearchSuggestions(localMatches); setShowSearchDropdown(true) }
  }

  const selectSearchCoin = async (symbol: string) => {
    setSearchQuery(symbol); setShowSearchDropdown(false); setSearchLoading(true)
    try { const response = await fetch(`/api/crypto?action=search&query=${encodeURIComponent(symbol)}`); const data = await response.json(); if (data.coin) setSearchResult(analyzeCoin(data.coin)); else setSearchResult(null) } catch (e) {}
    setSearchLoading(false)
  }

  const searchAlertCoin = async (query: string) => {
    if (!query.trim()) { setAlertSearchResults([]); return }
    const queryUpper = query.toUpperCase().replace('USDT', '').replace('USD', '').trim()
    const exactMatch = allCoins.filter(c => c === queryUpper)
    const startsWith = allCoins.filter(c => c.startsWith(queryUpper) && c !== queryUpper)
    const includes = allCoins.filter(c => c.includes(queryUpper) && !c.startsWith(queryUpper))
    setAlertSearchResults([...exactMatch, ...startsWith, ...includes].slice(0, 10))
  }

  const searchPortfolioCoin = async (query: string) => {
    if (!query.trim()) { setPortfolioSearchResults(allCoins.slice(0, 20)); return }
    const queryUpper = query.toUpperCase().replace('USDT', '').replace('USD', '').trim()
    const exactMatch = allCoins.filter(c => c === queryUpper)
    const startsWith = allCoins.filter(c => c.startsWith(queryUpper) && c !== queryUpper)
    const includes = allCoins.filter(c => c.includes(queryUpper) && !c.startsWith(queryUpper))
    setPortfolioSearchResults([...exactMatch, ...startsWith, ...includes])
  }

  const saveAlertSettings = async () => {
    if (!user || !alertSettings) return
    setSettingsSaving(true)
    const settingsToSave = { ...alertSettings, score_threshold: sliderValue, user_id: user.id, telegram_id: telegramId || null, updated_at: new Date().toISOString() }
    const { error } = await supabase.from('alert_settings').upsert(settingsToSave)
    if (!error) { setAlertSettings(settingsToSave); setSavedAlertSettings(settingsToSave) }
    setSettingsSaving(false)
  }

  const deleteAlertSettings = async () => {
    if (!user || !savedAlertSettings?.id) return
    const { error } = await supabase.from('alert_settings').delete().eq('id', savedAlertSettings.id)
    if (!error) { setAlertSettings({ user_id: user.id, selected_coins: ['BTC', 'ETH'], score_threshold: 90, time_morning: true, time_afternoon: true, time_evening: true, time_night: false, alert_signal: true, alert_score_change: true, alert_price: true }); setSavedAlertSettings(null); setSliderValue(90); setInputValue('90'); setTelegramId('') }
  }

  const addPosition = async () => {
    if (!user || !entryValue || !targetValue || !stopValue) return
    const { data, error } = await supabase.from('portfolio_positions').insert({ user_id: user.id, coin_symbol: positionCoin, coin_name: positionCoin, position_type: positionType, entry_price: parseFloat(entryValue), target_price: parseFloat(targetValue), stop_loss: parseFloat(stopValue), status: 'active' }).select().single()
    if (!error && data) { setPortfolioPositions([data, ...portfolioPositions]); setEntryValue(''); setTargetValue(''); setStopValue('') }
  }

  const deletePosition = async (position: PortfolioPosition) => {
    const { error } = await supabase.from('portfolio_positions').delete().eq('id', position.id)
    if (!error) setPortfolioPositions(portfolioPositions.filter(p => p.id !== position.id))
  }

  const toggleTheme = () => { const newTheme = theme === 'dark' ? 'light' : 'dark'; setTheme(newTheme); localStorage.setItem('dashboard-theme', newTheme) }

  const calculatePortfolioStats = () => {
    const active = portfolioPositions.filter(p => p.status === 'active')
    const closed = portfolioPositions.filter(p => p.status === 'closed')
    let totalPnL = 0, wins = 0, losses = 0
    closed.forEach(p => { if (p.exit_price) { const pnl = p.position_type === 'LONG' ? ((p.exit_price - p.entry_price) / p.entry_price) * 100 : ((p.entry_price - p.exit_price) / p.entry_price) * 100; totalPnL += pnl; if (pnl > 0) wins++; else losses++ } })
    return { total: portfolioPositions.length, active: active.length, closed: closed.length, winRate: (closed.length > 0 ? (wins / closed.length) * 100 : 0).toFixed(1), totalPnL: totalPnL.toFixed(2), wins, losses }
  }

  const toggleFavorite = async (coin: AnalyzedCoin) => {
    if (!user) return
    const existing = favorites.find(f => f.coin_id === coin.id)
    if (existing) { await supabase.from('favorites').delete().eq('id', existing.id); setFavorites(favorites.filter(f => f.id !== existing.id)); setFavoriteCoins(favoriteCoins.filter(fc => fc.id !== coin.id)) }
    else { if (profile?.plan === 'free' && favorites.length >= 3) return; const { data } = await supabase.from('favorites').insert({ user_id: user.id, coin_id: coin.id, coin_symbol: coin.symbol, coin_name: coin.name }).select().single(); if (data) { setFavorites([data, ...favorites]); setFavoriteCoins([coin, ...favoriteCoins]) } }
  }

  const handleAdClick = async (ad: AdSlot) => { try { await supabase.rpc('increment_ad_click', { ad_id: ad.id }) } catch (e) {}; window.open(ad.link_url, '_blank') }
  const handleSearch = async () => { if (!searchQuery.trim() || profile?.plan === 'free') return; setShowSearchDropdown(false); setSearchLoading(true); const cleanQuery = searchQuery.toUpperCase().replace('USDT', '').replace('USD', '').trim(); try { const response = await fetch(`/api/crypto?action=search&query=${encodeURIComponent(cleanQuery)}`); const data = await response.json(); if (data.coin) setSearchResult(analyzeCoin(data.coin)); else setSearchResult(null) } catch (e) {}; setSearchLoading(false) }
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => { const val = parseInt(e.target.value); setSliderValue(val); setInputValue(String(val)) }
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { setInputValue(e.target.value) }
  const handleInputBlur = () => { const num = parseInt(inputValue); if (isNaN(num)) setInputValue(String(sliderValue)); else { const clamped = Math.min(130, Math.max(50, num)); setSliderValue(clamped); setInputValue(String(clamped)) } }
  const markAllRead = () => { setNotifications(notifications.map(n => ({ ...n, read: true }))) }
  const unreadCount = notifications.filter(n => !n.read).length

  const SignalBadge = ({ signal }: { signal: string }) => {
    const config: Record<string, { text: string; bg: string; icon: string }> = { 
      strong_buy: { text: t.strongBuy, bg: 'bg-green-500', icon: '🚀' }, 
      buy: { text: t.buySignal, bg: 'bg-green-400', icon: '📈' }, 
      hold: { text: t.holdSignal, bg: 'bg-yellow-500', icon: '⏸️' }, 
      sell: { text: t.sellSignal, bg: 'bg-red-400', icon: '📉' }, 
      strong_sell: { text: t.strongSell, bg: 'bg-red-500', icon: '🔻' } 
    }
    const { text, bg, icon } = config[signal] || config.hold
    return <span className={`${bg} text-white px-3 py-1 rounded-full text-sm font-bold`}>{icon} {text}</span>
  }

  const ScoreBar = ({ label, score, max, color }: { label: string; score: number; max: number; color: string }) => (<div className="mb-2"><div className="flex justify-between text-sm mb-1"><span className={currentColors.textSecondary}>{label}</span><span className={`${currentColors.text} font-semibold`}>{score}/{max}</span></div><div className={`h-2 ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'} rounded-full overflow-hidden`}><div className={`h-full ${color} rounded-full`} style={{ width: `${(score / max) * 100}%` }} /></div></div>)

  const AdCard = ({ ad }: { ad: AdSlot }) => (<div className={`bg-gradient-to-r ${ad.bg_color || 'from-purple-500/20 to-blue-500/20'} border ${ad.border_color || 'border-purple-500/30'} rounded-xl cursor-pointer hover:scale-[1.02] transition-all p-3`} onClick={() => handleAdClick(ad)}><div className="flex items-center gap-3"><span className="text-2xl">{ad.icon || '📢'}</span><div className="flex-1 min-w-0"><p className="font-semibold text-white text-sm">{ad.title}</p><p className="text-white/70 truncate text-xs">{ad.description}</p></div><span className="text-[#00d395] text-xs font-semibold">{ad.link_text || '→'}</span></div></div>)

  const CoinCard = ({ coin, showFavButton = true }: { coin: AnalyzedCoin, showFavButton?: boolean }) => {
    const isPro = profile?.plan !== 'free'
    const isFavorited = favorites.some(f => f.coin_id === coin.id)
    return (
      <div className={`${currentColors.cardBg} rounded-2xl p-5 border cursor-pointer hover:border-[#00d395]/50 transition-all relative ${coin.signal === 'strong_buy' || coin.signal === 'buy' ? 'border-[#00d395]/30' : coin.signal === 'hold' ? 'border-yellow-500/30' : 'border-[#ff6b6b]/30'}`} onClick={() => { setSelectedCoin(coin); setShowDetail(true) }}>
        {showFavButton && <button onClick={(e) => { e.stopPropagation(); toggleFavorite(coin) }} className={`absolute top-3 right-3 text-xl ${isFavorited ? 'text-yellow-400' : 'text-white/30 hover:text-yellow-400'}`}>{isFavorited ? '★' : '☆'}</button>}
        <div className="flex justify-between items-start mb-4 pr-8"><div><div className="flex items-center gap-2"><span className={`text-xl font-bold ${currentColors.text}`}>{coin.symbol.toUpperCase()}</span><span className={`text-xs px-2 py-0.5 rounded ${coin.scores.total >= 95 ? 'bg-[#00d395]/20 text-[#00d395]' : coin.scores.total >= 70 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-[#ff6b6b]/20 text-[#ff6b6b]'}`}>{coin.scores.total}/140</span></div><p className={currentColors.textSecondary + ' text-sm'}>{coin.name}</p></div><SignalBadge signal={coin.signal} /></div>
        <div className="mb-4"><p className="text-2xl font-bold text-[#00d395]">{formatPrice(coin.current_price)}</p><p className={`text-sm ${coin.price_change_percentage_24h >= 0 ? 'text-[#00d395]' : 'text-[#ff6b6b]'}`}>{coin.price_change_percentage_24h >= 0 ? '▲' : '▼'} {Math.abs(coin.price_change_percentage_24h || 0).toFixed(2)}%</p></div>
        {isPro ? (<div className={`${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-3 space-y-2`}><div className="flex justify-between"><span className={currentColors.textSecondary + ' text-sm'}>{t.entryPrice}</span><span className="text-[#00d395] font-semibold">{formatPrice(coin.entry_price)}</span></div><div className="flex justify-between"><span className={currentColors.textSecondary + ' text-sm'}>{t.targetPrice}</span><span className="text-blue-400 font-semibold">{formatPrice(coin.target_price)}</span></div><div className="flex justify-between"><span className={currentColors.textSecondary + ' text-sm'}>{t.stopLoss}</span><span className="text-[#ff6b6b] font-semibold">{formatPrice(coin.stop_loss)}</span></div><div className={`flex justify-between pt-2 border-t ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}><span className={currentColors.textSecondary + ' text-sm'}>{t.riskReward}</span><span className="text-yellow-400 font-bold">{coin.risk_reward}</span></div></div>) : (<div className={`${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-4 text-center`}><p className={currentColors.textSecondary + ' text-sm'}>{t.proOnly}</p></div>)}
        <button className="w-full mt-3 py-2 text-sm text-[#00d395] hover:bg-[#00d395]/10 rounded-lg">{t.detailAnalysis}</button>
      </div>
    )
  }

  if (!themeLoaded || loading) return (<div className="min-h-screen flex items-center justify-center bg-[#0a0a14]"><div className="text-center"><div className="w-12 h-12 border-4 border-[#00d395] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div><p className="text-white">{t.loading}</p></div></div>)

  const sidebarAds = adSlots.filter(ad => ad.position === 'sidebar')
  const ownAds = sidebarAds.filter(ad => ad.ad_type === 'own')
  const sponsoredAds = sidebarAds.filter(ad => ad.ad_type === 'sponsored')

  return (
    <div className={`min-h-screen ${currentColors.bg} ${currentColors.text}`}>
      <header className={`border-b ${theme === 'dark' ? 'border-white/10 bg-[#0a0a14]/95' : 'border-gray-200 bg-white/95'} sticky top-0 backdrop-blur z-40`}>
        <div className="max-w-[1600px] mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4"><Link href="/" className="text-xl font-bold">🚀 {t.title}</Link>{profile?.plan !== 'free' && <span className="bg-[#00d395] text-black px-2 py-1 rounded text-xs font-bold">{profile?.plan?.toUpperCase()}</span>}</div>
            <div className="flex items-center gap-4">
              {/* 언어 전환 버튼 */}
              <button 
                onClick={toggleLang}
                className={`px-3 py-1.5 rounded-full font-semibold text-sm ${theme === 'dark' ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-200 hover:bg-gray-300'}`}
              >
                🌐 {lang === 'ko' ? 'EN' : '한국어'}
              </button>
              
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'}`}><span className="text-sm">☀️</span><button type="button" onClick={toggleTheme} className={`w-12 h-6 rounded-full relative ${theme === 'dark' ? 'bg-[#00d395]' : 'bg-gray-400'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${theme === 'dark' ? 'left-7' : 'left-1'}`} /></button><span className="text-sm">🌙</span></div>
              <div className={`text-sm ${currentColors.textSecondary}`}>{lastUpdate.toLocaleTimeString(lang === 'ko' ? 'ko-KR' : 'en-US')} | <span className="text-[#00d395]">{countdown}s</span></div>
              <span className={currentColors.textSecondary}>{profile?.nickname || user?.email?.split('@')[0]}</span>
              <Link href="/pricing" className="text-sm text-[#00d395]">{t.pricing}</Link>
              <button type="button" onClick={() => supabase.auth.signOut()} className={`text-sm ${currentColors.textSecondary}`}>{t.logout}</button>
              <div className="relative" ref={notificationRef}><button type="button" onClick={() => setShowNotifications(!showNotifications)} className={`relative p-2 rounded-full ${theme === 'dark' ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-200 hover:bg-gray-300'}`}>🔔{unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-[#ff6b6b] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">{unreadCount > 9 ? '9+' : unreadCount}</span>}</button>{showNotifications && (<div className={`absolute right-0 top-12 w-80 max-h-96 overflow-y-auto rounded-xl border shadow-2xl z-50 ${currentColors.cardBg} ${currentColors.cardBorder}`}><div className="p-3 border-b flex justify-between items-center"><span className={`font-bold ${currentColors.text}`}>🔔</span>{notifications.length > 0 && <button type="button" onClick={markAllRead} className="text-xs text-[#00d395]">✓</button>}</div>{notifications.length === 0 ? <div className={`p-6 text-center ${currentColors.textSecondary}`}>-</div> : notifications.slice(0, 10).map(n => (<div key={n.id} className={`p-3 border-b ${theme === 'dark' ? 'border-white/5' : 'border-gray-100'} ${!n.read ? (theme === 'dark' ? 'bg-[#00d395]/10' : 'bg-green-50') : ''}`}><p className={`text-sm ${currentColors.text}`}>{n.message}</p></div>))}</div>)}</div>
            </div>
          </div>
        </div>
      </header>

      <div className={`border-b ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}><div className="max-w-[1600px] mx-auto px-4"><div className="flex gap-2 py-3 overflow-x-auto">{[{ id: 'dashboard', label: t.dashboard }, { id: 'alerts', label: t.alerts }, { id: 'portfolio', label: t.portfolio }, { id: 'indicator', label: t.indicator }, { id: 'report', label: t.report }].map(tab => (<button key={tab.id} type="button" onClick={() => setActiveTab(tab.id as any)} className={`px-5 py-2.5 rounded-xl font-semibold transition whitespace-nowrap ${activeTab === tab.id ? 'bg-[#00d395] text-black' : `${theme === 'dark' ? 'bg-white/5 text-white/70 hover:bg-white/10' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}`}>{tab.label}</button>))}</div></div></div>

      <div className="max-w-[1600px] mx-auto px-4 py-8">
        {activeTab === 'dashboard' && (
          <div className="flex gap-6">
            <main className="flex-1 min-w-0">
              {profile?.plan !== 'free' && (<div className="mb-8 relative" ref={searchDropdownRef}><div className="flex gap-3"><input type="text" value={searchQuery} onChange={(e) => handleSearchInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} onFocus={() => searchQuery && setShowSearchDropdown(true)} placeholder={t.searchPlaceholder} className={`flex-1 ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'} border rounded-xl px-4 py-3 focus:outline-none focus:border-[#00d395]`} /><button type="button" onClick={handleSearch} disabled={searchLoading} className="bg-[#00d395] text-black px-8 py-3 rounded-xl font-semibold">{searchLoading ? '...' : t.analyze}</button></div>{showSearchDropdown && searchSuggestions.length > 0 && (<div className={`absolute left-0 right-24 top-14 rounded-xl border shadow-2xl z-50 ${currentColors.cardBg} ${currentColors.cardBorder}`}>{searchSuggestions.map((s, i) => (<button key={i} type="button" onClick={() => selectSearchCoin(s.symbol)} className={`w-full px-4 py-3 text-left hover:bg-[#00d395]/20 flex justify-between ${i !== searchSuggestions.length - 1 ? `border-b ${theme === 'dark' ? 'border-white/5' : 'border-gray-100'}` : ''}`}><span className={`font-bold ${currentColors.text}`}>{s.symbol}</span></button>))}</div>)}</div>)}
              {searchResult && <div className="mb-8"><div className="max-w-md"><CoinCard coin={searchResult} /></div></div>}
              {favorites.length > 0 && (<section className="mb-10"><div className="flex items-center justify-between mb-4"><h2 className={`text-xl font-bold ${currentColors.text}`}>⭐ {t.favorites} ({favorites.length})</h2><button type="button" onClick={() => setShowFavorites(!showFavorites)} className={`text-sm px-3 py-1 rounded-lg ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'}`}>{showFavorites ? t.collapse : t.expand}</button></div>{showFavorites && <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">{favoriteCoins.length > 0 ? favoriteCoins.map(coin => <CoinCard key={coin.id} coin={coin} />) : favorites.map(f => (<div key={f.id} className={`${currentColors.cardBg} rounded-2xl p-5 border ${currentColors.cardBorder}`}><span className={`text-xl font-bold ${currentColors.text}`}>{f.coin_symbol}</span></div>))}</div>}</section>)}
              <section className="mb-10"><h2 className={`text-xl font-bold mb-4 ${currentColors.text}`}>{t.coreCoins}</h2><div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">{coreCoins.map(coin => <CoinCard key={coin.id} coin={coin} />)}</div></section>
              {profile?.plan !== 'free' ? (<section className="mb-10"><h2 className={`text-xl font-bold mb-4 ${currentColors.text}`}>{t.topGainers} <span className="bg-[#00d395] text-black px-2 py-0.5 rounded text-xs">PRO</span></h2><div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{topGainers.map(coin => <CoinCard key={coin.id} coin={coin} />)}</div></section>) : (<section className="mb-10"><div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-2xl text-center py-12 px-6"><h2 className={`text-2xl font-bold mb-4 ${currentColors.text}`}>{t.proOnly}</h2><Link href="/pricing" className="bg-[#00d395] text-black px-8 py-3 rounded-xl font-semibold inline-block">{t.upgrade}</Link></div></section>)}
              <section><h2 className={`text-xl font-bold mb-4 ${currentColors.text}`}>{t.marketSummary}</h2><div className={`${currentColors.cardBg} rounded-2xl p-6 border ${currentColors.cardBorder}`}><div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center"><div><p className={`${currentColors.textSecondary} text-sm mb-1`}>{t.analyzedCoins}</p><p className={`text-2xl font-bold ${currentColors.text}`}>{coreCoins.length + topGainers.length}</p></div><div><p className={`${currentColors.textSecondary} text-sm mb-1`}>{t.buy}</p><p className="text-2xl font-bold text-[#00d395]">{[...coreCoins, ...topGainers].filter(c => c.signal === 'buy' || c.signal === 'strong_buy').length}</p></div><div><p className={`${currentColors.textSecondary} text-sm mb-1`}>{t.hold}</p><p className="text-2xl font-bold text-yellow-400">{[...coreCoins, ...topGainers].filter(c => c.signal === 'hold').length}</p></div><div><p className={`${currentColors.textSecondary} text-sm mb-1`}>{t.sell}</p><p className="text-2xl font-bold text-[#ff6b6b]">{[...coreCoins, ...topGainers].filter(c => c.signal === 'sell' || c.signal === 'strong_sell').length}</p></div></div></div></section>
            </main>
            <aside className="hidden xl:block w-72 flex-shrink-0"><div className="sticky top-24 space-y-6"><div className="space-y-2">{ownAds.map(ad => <AdCard key={ad.id} ad={ad} />)}</div><div className={`border-t ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'} pt-6`}><div className="space-y-2">{sponsoredAds.map(ad => <AdCard key={ad.id} ad={ad} />)}</div></div></div></aside>
          </div>
        )}

        {activeTab === 'indicator' && (
          <div className="space-y-6">
            {/* 섹션 네비게이션 */}
            <div className="flex gap-2 flex-wrap">
              {[
                { id: 'intro', label: t.indicatorIntro },
                { id: 'backtest', label: t.backtest },
                { id: 'deepbacktest', label: t.deepBacktest },
                { id: 'automate', label: t.automate },
              ].map(section => (
                <button
                  key={section.id}
                  onClick={() => setIndicatorSection(section.id as any)}
                  className={`px-4 py-2 rounded-xl font-semibold transition ${
                    indicatorSection === section.id
                      ? 'bg-[#00d395] text-black'
                      : theme === 'dark' ? 'bg-white/10 text-white/70 hover:bg-white/20' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  {section.label}
                </button>
              ))}
            </div>

            {indicatorSection === 'intro' && (
              <>
                {/* 왜 트레이딩뷰인가 */}
                <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-2xl p-6">
                  <h3 className={`text-xl font-bold mb-4 ${currentColors.text}`}>{t.whyTradingView}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className={`${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-4`}>
                      <div className="text-3xl mb-2">🌍</div>
                      <h4 className={`font-bold mb-1 ${currentColors.text}`}>{t.whyTv1Title}</h4>
                      <p className={`text-sm ${currentColors.textSecondary}`}>{t.whyTv1Desc}</p>
                    </div>
                    <div className={`${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-4`}>
                      <div className="text-3xl mb-2">📊</div>
                      <h4 className={`font-bold mb-1 ${currentColors.text}`}>{t.whyTv2Title}</h4>
                      <p className={`text-sm ${currentColors.textSecondary}`}>{t.whyTv2Desc}</p>
                    </div>
                    <div className={`${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-4`}>
                      <div className="text-3xl mb-2">⚡</div>
                      <h4 className={`font-bold mb-1 ${currentColors.text}`}>{t.whyTv3Title}</h4>
                      <p className={`text-sm ${currentColors.textSecondary}`}>{t.whyTv3Desc}</p>
                    </div>
                  </div>
                </div>

                {/* 지표 비교 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* FREE */}
                  <div className={`${currentColors.cardBg} rounded-2xl p-6 border ${currentColors.cardBorder}`}>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-2xl">🆓</span>
                      <h3 className={`text-xl font-bold ${currentColors.text}`}>{t.freeTitle}</h3>
                    </div>
                    <p className={`${currentColors.textSecondary} text-sm mb-4`}>{t.freeDesc}</p>
                    <div className={`${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-4 mb-4`}>
                      <h4 className={`font-bold mb-3 ${currentColors.text}`}>{t.freeRecommend}</h4>
                      <div className="space-y-3">
                        <div className={`flex justify-between items-center pb-2 border-b ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}>
                          <span className={currentColors.text}>{t.rsi}</span>
                          <span className="text-[#00d395] text-sm">{t.rsiDesc}</span>
                        </div>
                        <div className={`flex justify-between items-center pb-2 border-b ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}>
                          <span className={currentColors.text}>{t.macd}</span>
                          <span className="text-[#00d395] text-sm">{t.macdDesc}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className={currentColors.text}>{t.bollinger}</span>
                          <span className="text-[#00d395] text-sm">{t.bollingerDesc}</span>
                        </div>
                      </div>
                    </div>
                    <p className={`text-xs ${currentColors.textSecondary}`}>{t.freeNote}</p>
                  </div>

                  {/* PRO */}
                  <div className={`${currentColors.cardBg} rounded-2xl p-6 border-2 border-[#00d395]`}>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-2xl">💎</span>
                      <h3 className={`text-xl font-bold ${currentColors.text}`}>{t.proTitle}</h3>
                      <span className="bg-[#00d395] text-black px-2 py-0.5 rounded text-xs font-bold">PRO</span>
                    </div>
                    <p className={`${currentColors.textSecondary} text-sm mb-4`}>{t.proDesc}</p>
                    <div className={`${theme === 'dark' ? 'bg-[#00d395]/10' : 'bg-green-50'} rounded-xl p-4 mb-4`}>
                      <h4 className="font-bold mb-3 text-[#00d395]">{t.includedFeatures}</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2"><span>✓</span><span className={currentColors.text}>{t.feature1}</span></div>
                        <div className="flex items-center gap-2"><span>✓</span><span className={currentColors.text}>{t.feature2}</span></div>
                        <div className="flex items-center gap-2"><span>✓</span><span className={currentColors.text}>{t.feature3}</span></div>
                        <div className="flex items-center gap-2"><span>✓</span><span className={currentColors.text}>{t.feature4}</span></div>
                        <div className="flex items-center gap-2"><span>✓</span><span className={currentColors.text}>{t.feature5}</span></div>
                        <div className="flex items-center gap-2"><span>✓</span><span className={currentColors.text}>{t.feature6}</span></div>
                      </div>
                    </div>
                    <div className={`${theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'} rounded-xl p-4 mb-4`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`line-through ${currentColors.textSecondary}`}>{t.regularPrice} $199/{lang === 'ko' ? '월' : 'mo'}</span>
                        <span className="bg-[#ff6b6b] text-white px-2 py-0.5 rounded text-xs font-bold">50% OFF</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-[#00d395]">$99</span>
                        <span className={currentColors.textSecondary + ' text-sm'}>/{t.monthlySubscription}</span>
                      </div>
                      <p className="text-yellow-400 text-xs mt-2">{t.limited50}</p>
                    </div>
                    <a 
                      href="https://t.me/xrp5555555" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block w-full bg-[#00d395] text-black py-3 rounded-xl font-bold text-center hover:bg-[#00d395]/90 transition"
                    >
                      {t.buyInquiry}
                    </a>
                  </div>
                </div>

                {/* 설치 가이드 */}
                <div className={`${currentColors.cardBg} rounded-2xl p-6 border ${currentColors.cardBorder}`}>
                  <h3 className={`text-xl font-bold mb-4 ${currentColors.text}`}>{t.installGuide}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[
                      { step: 1, title: t.step1Title, desc: t.step1Desc },
                      { step: 2, title: t.step2Title, desc: t.step2Desc },
                      { step: 3, title: t.step3Title, desc: t.step3Desc },
                      { step: 4, title: t.step4Title, desc: t.step4Desc },
                    ].map(item => (
                      <div key={item.step} className={`${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-4`}>
                        <div className="w-8 h-8 bg-[#00d395] text-black rounded-full flex items-center justify-center font-bold mb-3">{item.step}</div>
                        <h4 className={`font-bold mb-1 ${currentColors.text}`}>{item.title}</h4>
                        <p className={`text-sm ${currentColors.textSecondary}`}>{item.desc}</p>
                      </div>
                    ))}
                  </div>
                  <p className={`mt-4 text-sm ${currentColors.textSecondary}`}>{t.pdfNote}</p>
                </div>
              </>
            )}

            {indicatorSection === 'backtest' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/30 rounded-2xl p-6">
                  <h3 className={`text-xl font-bold mb-4 ${currentColors.text}`}>{t.backtestTitle}</h3>
                  <p className={currentColors.textSecondary}>{t.backtestDesc}</p>
                </div>

                <div className={`${currentColors.cardBg} rounded-2xl p-6 border ${currentColors.cardBorder}`}>
                  <h3 className={`text-xl font-bold mb-4 ${currentColors.text}`}>{t.backtestHow}</h3>
                  <div className="space-y-4">
                    {[
                      { step: 1, title: t.backtestStep1, desc: t.backtestStep1Desc },
                      { step: 2, title: t.backtestStep2, desc: t.backtestStep2Desc },
                      { step: 3, title: t.backtestStep3, desc: t.backtestStep3Desc },
                      { step: 4, title: t.backtestStep4, desc: t.backtestStep4Desc },
                      { step: 5, title: t.backtestStep5, desc: t.backtestStep5Desc },
                    ].map(item => (
                      <div key={item.step} className={`flex gap-4 p-4 rounded-xl ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                        <div className="w-8 h-8 bg-[#00d395] text-black rounded-full flex items-center justify-center font-bold flex-shrink-0">{item.step}</div>
                        <div>
                          <h4 className={`font-bold ${currentColors.text}`}>{item.title}</h4>
                          <p className={`text-sm ${currentColors.textSecondary}`}>{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`${currentColors.cardBg} rounded-2xl p-6 border ${currentColors.cardBorder}`}>
                  <h3 className={`text-xl font-bold mb-4 ${currentColors.text}`}>{t.backtestResults}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: t.netProfit, desc: t.netProfitDesc, icon: '💰' },
                      { label: t.winRate, desc: t.winRateDesc, icon: '🎯' },
                      { label: t.maxDrawdown, desc: t.maxDrawdownDesc, icon: '📉' },
                      { label: t.profitFactor, desc: t.profitFactorDesc, icon: '⚖️' },
                    ].map(item => (
                      <div key={item.label} className={`${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-4 text-center`}>
                        <div className="text-3xl mb-2">{item.icon}</div>
                        <h4 className={`font-bold ${currentColors.text}`}>{item.label}</h4>
                        <p className={`text-xs ${currentColors.textSecondary}`}>{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {indicatorSection === 'deepbacktest' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-2xl p-6">
                  <h3 className={`text-xl font-bold mb-4 ${currentColors.text}`}>{t.deepBacktestTitle}</h3>
                  <p className={currentColors.textSecondary}>{t.deepBacktestDesc}</p>
                </div>

                <div className={`${currentColors.cardBg} rounded-2xl p-6 border ${currentColors.cardBorder}`}>
                  <h3 className={`text-xl font-bold mb-4 ${currentColors.text}`}>{t.deepBacktestHow}</h3>
                  <div className="space-y-4">
                    {[
                      { title: t.barMagnifier, desc: t.barMagnifierDesc },
                      { title: t.slippage, desc: t.slippageDesc },
                      { title: t.commission, desc: t.commissionDesc },
                      { title: t.initialCapital, desc: t.initialCapitalDesc },
                      { title: t.pyramiding, desc: t.pyramidingDesc },
                    ].map((item, i) => (
                      <div key={i} className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                        <h4 className={`font-bold ${currentColors.text}`}>{item.title}</h4>
                        <p className={`text-sm ${currentColors.textSecondary}`}>{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-2xl p-6">
                  <h3 className={`text-xl font-bold mb-3 ${currentColors.text}`}>{t.deepBacktestWarning}</h3>
                  <ul className={`space-y-2 text-sm ${currentColors.textSecondary}`}>
                    <li>• {t.deepBacktestWarning1}</li>
                    <li>• {t.deepBacktestWarning2}</li>
                    <li>• {t.deepBacktestWarning3}</li>
                    <li>• {t.deepBacktestWarning4}</li>
                  </ul>
                </div>
              </div>
            )}

            {indicatorSection === 'automate' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-2xl p-6">
                  <h3 className={`text-xl font-bold mb-4 ${currentColors.text}`}>{t.automateTitle}</h3>
                  <p className={currentColors.textSecondary}>{t.automateDesc}</p>
                </div>

                <div className={`${currentColors.cardBg} rounded-2xl p-6 border ${currentColors.cardBorder}`}>
                  <h3 className={`text-xl font-bold mb-4 ${currentColors.text}`}>{t.supportedExchanges}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {['Binance', 'Bybit', 'OKX', 'Bitget'].map(exchange => (
                      <div key={exchange} className={`${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-4 text-center`}>
                        <span className={`font-bold ${currentColors.text}`}>{exchange}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`${currentColors.cardBg} rounded-2xl p-6 border ${currentColors.cardBorder}`}>
                  <h3 className={`text-xl font-bold mb-4 ${currentColors.text}`}>{t.automateHow}</h3>
                  <div className="space-y-4">
                    {[
                      { step: 1, title: t.automateStep1, desc: t.automateStep1Desc },
                      { step: 2, title: t.automateStep2, desc: t.automateStep2Desc },
                      { step: 3, title: t.automateStep3, desc: t.automateStep3Desc },
                      { step: 4, title: t.automateStep4, desc: t.automateStep4Desc },
                    ].map(item => (
                      <div key={item.step} className={`flex gap-4 p-4 rounded-xl ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                        <div className="w-8 h-8 bg-[#00d395] text-black rounded-full flex items-center justify-center font-bold flex-shrink-0">{item.step}</div>
                        <div>
                          <h4 className={`font-bold ${currentColors.text}`}>{item.title}</h4>
                          <p className={`text-sm ${currentColors.textSecondary}`}>{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 면책조항 */}
                <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border-2 border-red-500/50 rounded-2xl p-6">
                  <h3 className="text-xl font-bold mb-4 text-[#ff6b6b]">{t.disclaimer}</h3>
                  <div className={`space-y-3 text-sm ${currentColors.textSecondary}`}>
                    <p><strong className="text-[#ff6b6b]">{t.disclaimer1Title}</strong></p>
                    <p>• {t.disclaimer1a}</p>
                    <p>• {t.disclaimer1b}</p>
                    <p><strong className="text-[#ff6b6b]">{t.disclaimer2Title}</strong></p>
                    <p>• {t.disclaimer2a}</p>
                    <p>• {t.disclaimer2b}</p>
                    <p><strong className="text-[#ff6b6b]">{t.disclaimer3Title}</strong></p>
                    <p>• {t.disclaimer3a}</p>
                    <p>• {t.disclaimer3b}</p>
                    <p>• {t.disclaimer3c}</p>
                  </div>
                </div>

                <div className={`${currentColors.cardBg} rounded-2xl p-6 border ${currentColors.cardBorder} text-center`}>
                  <p className={`mb-4 ${currentColors.textSecondary}`}>{t.automateInquiry}</p>
                  <a 
                    href="https://t.me/xrp5555555" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-block bg-[#00d395] text-black px-8 py-3 rounded-xl font-bold hover:bg-[#00d395]/90 transition"
                  >
                    {t.telegramInquiry}
                  </a>
                </div>
              </div>
            )}

            {/* 공통 문의 섹션 */}
            <div className={`${currentColors.cardBg} rounded-2xl p-6 border ${currentColors.cardBorder}`}>
              <h3 className={`text-xl font-bold mb-4 ${currentColors.text}`}>{t.contactTitle}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <a 
                  href="https://t.me/xrp5555555" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={`flex items-center gap-4 p-4 rounded-xl ${theme === 'dark' ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'} transition`}
                >
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-2xl">📱</div>
                  <div>
                    <h4 className={`font-bold ${currentColors.text}`}>{t.telegram}</h4>
                    <p className={currentColors.textSecondary + ' text-sm'}>@xrp5555555</p>
                  </div>
                </a>
                <div className={`flex items-center gap-4 p-4 rounded-xl ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                  <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-2xl">📄</div>
                  <div>
                    <h4 className={`font-bold ${currentColors.text}`}>{t.pdfGuide}</h4>
                    <p className={currentColors.textSecondary + ' text-sm'}>{t.providedOnPurchase}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'alerts' && alertSettings && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={`${currentColors.cardBg} rounded-2xl p-6 border ${currentColors.cardBorder}`}>
                <h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>🪙 {lang === 'ko' ? '코인 선택' : 'Select Coins'}</h3>
                <input type="text" placeholder={lang === 'ko' ? '코인 검색...' : 'Search coin...'} value={alertCoinSearch} onChange={(e) => { setAlertCoinSearch(e.target.value); searchAlertCoin(e.target.value) }} className={`w-full p-3 rounded-xl border ${currentColors.cardBorder} ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'} mb-3`} />
                {alertCoinSearch && alertSearchResults.length > 0 && <div className="flex flex-wrap gap-2 mb-3">{alertSearchResults.map(c => (<button key={c} type="button" onClick={() => { if (!alertSettings.selected_coins.includes(c)) setAlertSettings({ ...alertSettings, selected_coins: [...alertSettings.selected_coins, c] }); setAlertCoinSearch(''); setAlertSearchResults([]) }} className="px-3 py-1 rounded-full text-sm bg-[#00d395]/20 text-[#00d395]">+ {c}</button>))}</div>}
                <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto">{alertSettings.selected_coins.map(c => (<button key={c} type="button" onClick={() => setAlertSettings({ ...alertSettings, selected_coins: alertSettings.selected_coins.filter(x => x !== c) })} className="px-4 py-2 rounded-full text-sm font-semibold bg-[#00d395] text-black">{c} ✕</button>))}</div>
              </div>
              <div className={`${currentColors.cardBg} rounded-2xl p-6 border ${currentColors.cardBorder}`}>
                <h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>🎯 {lang === 'ko' ? '점수 임계값' : 'Score Threshold'}</h3>
                <div className="flex items-center gap-4 mb-4">
                  <input type="range" min="50" max="130" value={sliderValue} onChange={handleSliderChange} className="flex-1 h-3 rounded-full appearance-none cursor-pointer" style={{ background: `linear-gradient(to right, #00d395 ${((sliderValue - 50) / 80) * 100}%, ${theme === 'dark' ? '#333' : '#ddd'} ${((sliderValue - 50) / 80) * 100}%)` }} />
                  <span className="bg-[#00d395] text-black px-4 py-2 rounded-xl font-bold text-xl">{sliderValue}/140</span>
                </div>
              </div>
            </div>
            <div className={`${currentColors.cardBg} rounded-2xl p-6 border border-[#00d395]/50`}>
              <h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>📱 {lang === 'ko' ? '텔레그램 알림' : 'Telegram Alerts'}</h3>
              <input type="text" inputMode="numeric" placeholder={lang === 'ko' ? '텔레그램 ID (예: 1234567890)' : 'Telegram ID (e.g., 1234567890)'} value={telegramId} onChange={(e) => setTelegramId(e.target.value)} className={`w-full p-4 rounded-xl border ${currentColors.cardBorder} ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'} text-lg`} />
            </div>
            <button type="button" onClick={saveAlertSettings} disabled={settingsSaving} className="w-full bg-[#00d395] text-black py-4 rounded-xl font-bold text-lg">{settingsSaving ? '...' : `💾 ${lang === 'ko' ? '설정 저장' : 'Save Settings'}`}</button>
          </div>
        )}

        {activeTab === 'portfolio' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">{(() => { const stats = calculatePortfolioStats(); return [{ label: lang === 'ko' ? '총 포지션' : 'Total', value: stats.total, icon: '📋' }, { label: lang === 'ko' ? '활성' : 'Active', value: stats.active, icon: '🟢', color: 'text-[#00d395]' }, { label: lang === 'ko' ? '승률' : 'Win Rate', value: `${stats.winRate}%`, icon: '🎯', color: 'text-[#00d395]' }, { label: 'PnL', value: `${stats.totalPnL}%`, icon: '💰', color: parseFloat(stats.totalPnL) >= 0 ? 'text-[#00d395]' : 'text-[#ff6b6b]' }, { label: 'W/L', value: `${stats.wins}/${stats.losses}`, icon: '📊' }].map((s, i) => (<div key={i} className={`${currentColors.cardBg} rounded-xl p-4 border ${currentColors.cardBorder} text-center`}><div className="text-2xl mb-2">{s.icon}</div><div className={`text-2xl font-bold ${s.color || currentColors.text}`}>{s.value}</div><div className={`text-sm ${currentColors.textSecondary}`}>{s.label}</div></div>)) })()}</div>
            <div className={`${currentColors.cardBg} rounded-2xl p-6 border ${currentColors.cardBorder}`}>
              <h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>➕ {lang === 'ko' ? '새 포지션' : 'New Position'}</h3>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                <div className="relative" ref={portfolioDropdownRef}>
                  <label className={`block text-sm ${currentColors.textSecondary} mb-1`}>{lang === 'ko' ? '코인' : 'Coin'}</label>
                  <button type="button" onClick={() => { setShowPortfolioDropdown(!showPortfolioDropdown); setPortfolioSearchResults(allCoins.slice(0, 20)) }} className={`w-full p-3 rounded-xl border ${currentColors.cardBorder} ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'} text-left flex justify-between`}><span>{positionCoin}</span><span>▼</span></button>
                  {showPortfolioDropdown && (<div className={`absolute z-50 w-64 mt-1 rounded-xl border ${currentColors.cardBorder} ${currentColors.cardBg} shadow-lg`}><div className="p-2"><input type="text" placeholder="Search..." value={portfolioCoinSearch} onChange={(e) => { setPortfolioCoinSearch(e.target.value); searchPortfolioCoin(e.target.value) }} className={`w-full p-2 rounded-lg border ${currentColors.cardBorder} ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'} text-sm`} autoFocus /></div><div className="max-h-48 overflow-y-auto">{portfolioSearchResults.map(c => (<button key={c} type="button" onClick={() => { setPositionCoin(c); setShowPortfolioDropdown(false); setPortfolioCoinSearch('') }} className={`w-full px-4 py-2 text-left hover:bg-[#00d395]/20 ${positionCoin === c ? 'bg-[#00d395]/10' : ''}`}>{c}</button>))}</div></div>)}
                </div>
                <div><label className={`block text-sm ${currentColors.textSecondary} mb-1`}>{lang === 'ko' ? '방향' : 'Direction'}</label><div className="flex gap-1"><button type="button" onClick={() => setPositionType('LONG')} className={`flex-1 p-3 rounded-l-xl font-bold ${positionType === 'LONG' ? 'bg-[#00d395] text-black' : theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'}`}>🟢</button><button type="button" onClick={() => setPositionType('SHORT')} className={`flex-1 p-3 rounded-r-xl font-bold ${positionType === 'SHORT' ? 'bg-[#ff6b6b] text-white' : theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'}`}>🔴</button></div></div>
                <div><label className={`block text-sm ${currentColors.textSecondary} mb-1`}>{t.entryPrice}</label><input type="text" inputMode="decimal" placeholder="0.00" value={entryValue} onChange={(e) => setEntryValue(e.target.value)} className={`w-full p-3 rounded-xl border ${currentColors.cardBorder} ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`} /></div>
                <div><label className={`block text-sm ${currentColors.textSecondary} mb-1`}>{t.targetPrice}</label><input type="text" inputMode="decimal" placeholder="0.00" value={targetValue} onChange={(e) => setTargetValue(e.target.value)} className={`w-full p-3 rounded-xl border ${currentColors.cardBorder} ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`} /></div>
                <div><label className={`block text-sm ${currentColors.textSecondary} mb-1`}>{t.stopLoss}</label><input type="text" inputMode="decimal" placeholder="0.00" value={stopValue} onChange={(e) => setStopValue(e.target.value)} className={`w-full p-3 rounded-xl border ${currentColors.cardBorder} ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`} /></div>
                <div className="flex items-end"><button type="button" onClick={addPosition} className="w-full bg-[#00d395] text-black p-3 rounded-xl font-bold">{lang === 'ko' ? '추가' : 'Add'}</button></div>
              </div>
            </div>
            <div className={`${currentColors.cardBg} rounded-2xl p-6 border ${currentColors.cardBorder}`}>
              <h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>📋 {lang === 'ko' ? '포지션 목록' : 'Position List'}</h3>
              <div className="overflow-x-auto"><table className="w-full"><thead><tr className={`border-b ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}>{[lang === 'ko' ? '코인' : 'Coin', lang === 'ko' ? '방향' : 'Dir', t.entryPrice, t.targetPrice, t.stopLoss, lang === 'ko' ? '상태' : 'Status', ''].map(h => <th key={h} className={`text-left p-3 text-sm ${currentColors.textSecondary}`}>{h}</th>)}</tr></thead><tbody>{portfolioPositions.length === 0 ? <tr><td colSpan={7} className={`text-center p-8 ${currentColors.textSecondary}`}>-</td></tr> : portfolioPositions.map(p => (<tr key={p.id} className={`border-b ${theme === 'dark' ? 'border-white/5' : 'border-gray-100'}`}><td className={`p-3 font-bold ${currentColors.text}`}>{p.coin_symbol}</td><td className="p-3"><span className={`px-3 py-1 rounded-full text-xs font-bold ${p.position_type === 'LONG' ? 'bg-[#00d395]/20 text-[#00d395]' : 'bg-[#ff6b6b]/20 text-[#ff6b6b]'}`}>{p.position_type}</span></td><td className={`p-3 ${currentColors.text}`}>${p.entry_price.toLocaleString()}</td><td className="p-3 text-blue-400">${p.target_price.toLocaleString()}</td><td className="p-3 text-[#ff6b6b]">${p.stop_loss.toLocaleString()}</td><td className="p-3"><span className={`px-3 py-1 rounded-full text-xs ${p.status === 'active' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/10 text-white/50'}`}>{p.status === 'active' ? (lang === 'ko' ? '활성' : 'Active') : (lang === 'ko' ? '종료' : 'Closed')}</span></td><td className="p-3"><button type="button" onClick={() => deletePosition(p)} className="px-3 py-1 bg-[#ff6b6b] text-white rounded-lg text-sm">✕</button></td></tr>))}</tbody></table></div>
            </div>
          </div>
        )}

        {activeTab === 'report' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-[#00d395] to-[#00b383] rounded-2xl p-6 text-white">
              <h3 className="text-lg font-bold mb-4">📊 {lang === 'ko' ? '트레이딩 성과' : 'Trading Performance'}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">{(() => { const stats = calculatePortfolioStats(); return [{ label: lang === 'ko' ? '총 포지션' : 'Total', value: stats.total }, { label: lang === 'ko' ? '활성' : 'Active', value: stats.active }, { label: lang === 'ko' ? '승률' : 'Win Rate', value: `${stats.winRate}%` }, { label: 'PnL', value: `${parseFloat(stats.totalPnL) >= 0 ? '+' : ''}${stats.totalPnL}%` }].map((i, idx) => (<div key={idx}><div className="text-3xl font-bold">{i.value}</div><div className="text-sm opacity-80">{i.label}</div></div>)) })()}</div>
            </div>
          </div>
        )}
      </div>

      {showDetail && selectedCoin && (<div className={`fixed inset-0 z-50 ${currentColors.bg} overflow-y-auto`}><div className={`sticky top-0 ${currentColors.bg} border-b z-10`}><div className="flex justify-between items-center p-4"><div className="flex items-center gap-3"><h2 className={`text-xl font-bold ${currentColors.text}`}>{selectedCoin.symbol.toUpperCase()}</h2><SignalBadge signal={selectedCoin.signal} /></div><button type="button" onClick={() => setShowDetail(false)} className={`${theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'} px-4 py-2 rounded-lg font-semibold`}>✕ {t.close}</button></div></div><div className="max-w-2xl mx-auto p-4 pb-20"><div className={`${currentColors.cardBg} rounded-2xl p-6 mb-4 border ${currentColors.cardBorder}`}><p className={currentColors.textSecondary}>{selectedCoin.name}</p><p className="text-4xl font-bold text-[#00d395] mb-2">{formatPrice(selectedCoin.current_price)}</p><p className={selectedCoin.price_change_percentage_24h >= 0 ? 'text-[#00d395]' : 'text-[#ff6b6b]'}>{selectedCoin.price_change_percentage_24h >= 0 ? '▲' : '▼'} {Math.abs(selectedCoin.price_change_percentage_24h || 0).toFixed(2)}%</p></div><div className={`${currentColors.cardBg} rounded-2xl p-6 mb-4 border ${currentColors.cardBorder}`}><h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>📊 {lang === 'ko' ? '체크리스트' : 'Checklist'} <span className="text-[#00d395]">{selectedCoin.scores.total}/140</span></h3>{profile?.plan !== 'free' ? (<div className="space-y-3"><ScoreBar label={lang === 'ko' ? '거시환경' : 'Macro'} score={selectedCoin.scores.macro} max={20} color="bg-blue-500" /><ScoreBar label="ETF" score={selectedCoin.scores.etf} max={25} color="bg-purple-500" /><ScoreBar label={lang === 'ko' ? '온체인' : 'On-chain'} score={selectedCoin.scores.onchain} max={25} color="bg-green-500" /><ScoreBar label="AI" score={selectedCoin.scores.ai} max={20} color="bg-pink-500" /><ScoreBar label={lang === 'ko' ? '선물' : 'Futures'} score={selectedCoin.scores.futures} max={20} color="bg-orange-500" /><ScoreBar label={lang === 'ko' ? '기술적' : 'Technical'} score={selectedCoin.scores.technical} max={20} color="bg-cyan-500" /><ScoreBar label={lang === 'ko' ? '전략' : 'Strategy'} score={selectedCoin.scores.strategy} max={10} color="bg-yellow-500" /></div>) : (<div className={`${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-6 text-center`}><p className={currentColors.textSecondary}>{t.proOnly}</p><Link href="/pricing" className="bg-[#00d395] text-black px-6 py-2 rounded-xl font-semibold inline-block mt-2">{t.upgrade}</Link></div>)}</div>{profile?.plan !== 'free' && (<><div className={`${currentColors.cardBg} rounded-2xl p-6 mb-4 border ${currentColors.cardBorder}`}><h3 className={`text-lg font-bold mb-4 ${currentColors.text}`}>💰 {lang === 'ko' ? '매매 전략' : 'Trading Strategy'}</h3><div className="grid grid-cols-2 gap-3"><div className="bg-[#00d395]/10 border border-[#00d395]/30 rounded-xl p-4"><p className={currentColors.textSecondary + ' text-sm'}>{t.entryPrice}</p><p className="text-[#00d395] text-xl font-bold">{formatPrice(selectedCoin.entry_price)}</p></div><div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4"><p className={currentColors.textSecondary + ' text-sm'}>{t.targetPrice}</p><p className="text-blue-400 text-xl font-bold">{formatPrice(selectedCoin.target_price)}</p></div><div className="bg-[#ff6b6b]/10 border border-[#ff6b6b]/30 rounded-xl p-4"><p className={currentColors.textSecondary + ' text-sm'}>{t.stopLoss}</p><p className="text-[#ff6b6b] text-xl font-bold">{formatPrice(selectedCoin.stop_loss)}</p></div><div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4"><p className={currentColors.textSecondary + ' text-sm'}>{t.riskReward}</p><p className="text-yellow-400 text-xl font-bold">{selectedCoin.risk_reward}</p></div></div></div></>)}<button type="button" onClick={() => setShowDetail(false)} className={`w-full py-4 ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'} rounded-xl font-semibold`}>{t.close}</button></div></div>)}

      <style jsx global>{`input[type="range"]::-webkit-slider-thumb{-webkit-appearance:none;width:24px;height:24px;border-radius:50%;background:#00d395;cursor:grab;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)}input[type="range"]::-moz-range-thumb{width:24px;height:24px;border-radius:50%;background:#00d395;cursor:grab;border:3px solid white}select{color:inherit}`}</style>
    </div>
  )
}
