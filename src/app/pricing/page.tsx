'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

declare global {
  interface Window {
    TossPayments: any
  }
}

export default function Pricing() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    // 토스페이먼츠 SDK 로드
    const script = document.createElement('script')
    script.src = 'https://js.tosspayments.com/v1/payment'
    script.async = true
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        setProfile(profile)
      }
      setLoading(false)
    }
    getUser()
  }, [supabase])

  const handlePayment = async (planType: 'pro' | 'vip') => {
    if (!user) {
      router.push('/signup?plan=' + planType)
      return
    }

    setPaymentLoading(true)

    try {
      const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY
      const tossPayments = window.TossPayments(clientKey)

      const amount = planType === 'pro' ? 49000 : 149000
      const orderName = planType === 'pro' ? '크립토 PRO 월간 구독' : '크립토 VIP 월간 구독'
      const orderId = `order_${Date.now()}_${user.id.slice(0, 8)}`

      await tossPayments.requestPayment('카드', {
        amount,
        orderId,
        orderName,
        customerName: profile?.nickname || user.email?.split('@')[0],
        customerEmail: user.email,
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`,
      })
    } catch (error: any) {
      if (error.code === 'USER_CANCEL') {
        // 사용자가 취소함
      } else {
        alert('결제 중 오류가 발생했습니다: ' + error.message)
      }
    } finally {
      setPaymentLoading(false)
    }
  }

  const plans = [
    {
      name: '무료',
      price: '₩0',
      period: '영구 무료',
      features: [
        '핵심 코인 4개 (BTC, ETH, XRP, BNB)',
        '기본 시장 상태 확인',
        '기본 체크리스트 점수',
      ],
      notIncluded: [
        '상승 코인 TOP 6',
        '진입가/목표가/손절가',
        '7단계 상세 체크리스트',
        '무제한 코인 검색',
      ],
      buttonText: '현재 플랜',
      buttonStyle: 'btn-secondary',
      disabled: true,
    },
    {
      name: 'PRO',
      price: '₩49,000',
      period: '/월',
      badge: 'BEST',
      features: [
        '무료 기능 전체 포함',
        '상승 코인 TOP 6 실시간',
        '진입가/목표가/손절가 제공',
        '7단계 체크리스트 상세 분석',
        '무제한 코인 검색',
        '시그널 히스토리',
      ],
      notIncluded: [
        '텔레그램 실시간 알림',
        '1:1 줌 상담',
      ],
      buttonText: 'PRO 시작하기',
      buttonStyle: 'btn-primary',
      planType: 'pro' as const,
    },
    {
      name: 'VIP',
      price: '₩149,000',
      period: '/월',
      features: [
        'PRO 기능 전체 포함',
        '텔레그램 실시간 알림',
        '1:1 줌 상담 (월 1회)',
        'VIP 전용 채팅방',
        '우선 고객 지원',
        '신규 기능 우선 체험',
      ],
      notIncluded: [],
      buttonText: 'VIP 시작하기',
      buttonStyle: 'btn-secondary border-crypto-yellow text-crypto-yellow',
      planType: 'vip' as const,
    },
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner w-12 h-12"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Link href="/" className="inline-block mb-6">
            <span className="text-3xl font-bold gradient-text">🚀 크립토 PRO</span>
          </Link>
          <h1 className="text-4xl font-bold mb-4">요금제 선택</h1>
          <p className="text-white/70">
            나에게 맞는 플랜을 선택하고 수익률을 높이세요
          </p>
        </div>

        {/* Current Plan Badge */}
        {profile?.plan && profile.plan !== 'free' && (
          <div className="text-center mb-8">
            <span className="bg-crypto-green/20 text-crypto-green px-4 py-2 rounded-full">
              현재 플랜: {profile.plan.toUpperCase()}
              {profile.plan_expires_at && (
                <span className="ml-2 text-sm">
                  (만료: {new Date(profile.plan_expires_at).toLocaleDateString('ko-KR')})
                </span>
              )}
            </span>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`card relative ${plan.badge ? 'border-crypto-green' : ''}`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="pro-badge">{plan.badge}</span>
                </div>
              )}

              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-2">{plan.name}</h2>
                <div className="flex items-end justify-center gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-white/50 mb-1">{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-crypto-green">✓</span>
                    <span className="text-white/80">{feature}</span>
                  </li>
                ))}
                {plan.notIncluded.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-white/30">✗</span>
                    <span className="text-white/30">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => plan.planType && handlePayment(plan.planType)}
                disabled={plan.disabled || paymentLoading || profile?.plan === plan.planType}
                className={`w-full py-3 rounded-xl font-semibold transition ${plan.buttonStyle} disabled:opacity-50`}
              >
                {paymentLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="spinner w-5 h-5"></span>
                    처리 중...
                  </span>
                ) : profile?.plan === plan.planType ? (
                  '현재 플랜'
                ) : (
                  plan.buttonText
                )}
              </button>
            </div>
          ))}
        </div>

        {/* FAQ or Additional Info */}
        <div className="mt-12 text-center text-white/50 text-sm">
          <p>결제 관련 문의: support@example.com</p>
          <p className="mt-2">언제든지 구독을 취소할 수 있습니다</p>
        </div>

        {/* Back to Dashboard */}
        <div className="text-center mt-8">
          <Link href="/dashboard" className="text-crypto-green hover:underline">
            ← 대시보드로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  )
}
