'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Pricing() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    getUser()
  }, [supabase])

  const handleSubscribe = async (plan: string) => {
    if (!user) {
      router.push('/signup?plan=' + plan)
      return
    }

    setProcessing(true)
    
    // 여기에 토스페이먼츠 결제 연동 추가
    // 일단은 데모로 바로 PRO 업그레이드
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          plan: plan,
          plan_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      alert(`${plan.toUpperCase()} 플랜으로 업그레이드되었습니다!`)
      router.push('/dashboard')
      router.refresh()
    } catch (error: any) {
      alert('결제 처리 중 오류가 발생했습니다: ' + error.message)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <Link href="/" className="block text-center mb-8">
          <span className="text-3xl font-bold gradient-text">🚀 크립토 PRO</span>
        </Link>

        <h1 className="text-3xl font-bold text-center mb-4">요금제 선택</h1>
        <p className="text-center text-white/70 mb-12">
          목표에 맞는 플랜을 선택하세요
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          {/* 무료 */}
          <div className="card">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold mb-2">무료</h3>
              <p className="text-4xl font-bold">₩0</p>
              <p className="text-white/50 text-sm">영원히 무료</p>
            </div>
            
            <ul className="space-y-3 mb-8 text-sm">
              <li className="flex items-center gap-2">
                <span className="text-crypto-green">✓</span>
                핵심 코인 4개
              </li>
              <li className="flex items-center gap-2">
                <span className="text-crypto-green">✓</span>
                기본 체크리스트
              </li>
              <li className="flex items-center gap-2">
                <span className="text-crypto-green">✓</span>
                시장 상태 요약
              </li>
              <li className="flex items-center gap-2 text-white/40">
                <span className="text-crypto-red">✗</span>
                상승 코인 TOP 6
              </li>
              <li className="flex items-center gap-2 text-white/40">
                <span className="text-crypto-red">✗</span>
                진입가/목표가/손절가
              </li>
            </ul>
            
            <Link href="/dashboard" className="block text-center btn-secondary w-full">
              무료로 시작
            </Link>
          </div>

          {/* PRO */}
          <div className="card border-2 border-crypto-green relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="pro-badge px-4 py-1">🔥 BEST</span>
            </div>
            
            <div className="text-center mb-6 pt-4">
              <h3 className="text-xl font-bold mb-2">PRO</h3>
              <p className="text-4xl font-bold text-crypto-green">₩49,000</p>
              <p className="text-white/50 text-sm">월간 구독</p>
            </div>
            
            <ul className="space-y-3 mb-8 text-sm">
              <li className="flex items-center gap-2">
                <span className="text-crypto-green">✓</span>
                무료 기능 전체 포함
              </li>
              <li className="flex items-center gap-2 font-bold text-crypto-green">
                <span>✓</span>
                상승 코인 TOP 6
              </li>
              <li className="flex items-center gap-2 font-bold text-crypto-green">
                <span>✓</span>
                진입가/목표가/손절가
              </li>
              <li className="flex items-center gap-2 font-bold text-crypto-green">
                <span>✓</span>
                체크리스트 상세 분석
              </li>
              <li className="flex items-center gap-2">
                <span className="text-crypto-green">✓</span>
                무제한 코인 검색
              </li>
            </ul>
            
            <button
              onClick={() => handleSubscribe('pro')}
              disabled={processing}
              className="btn-primary w-full disabled:opacity-50"
            >
              {processing ? '처리 중...' : 'PRO 시작하기'}
            </button>
          </div>

          {/* VIP */}
          <div className="card">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold mb-2">VIP</h3>
              <p className="text-4xl font-bold text-crypto-yellow">₩149,000</p>
              <p className="text-white/50 text-sm">월간 구독</p>
            </div>
            
            <ul className="space-y-3 mb-8 text-sm">
              <li className="flex items-center gap-2">
                <span className="text-crypto-green">✓</span>
                PRO 기능 전체 포함
              </li>
              <li className="flex items-center gap-2 font-bold text-crypto-yellow">
                <span>✓</span>
                텔레그램 실시간 알림
              </li>
              <li className="flex items-center gap-2 font-bold text-crypto-yellow">
                <span>✓</span>
                1:1 줌 상담 (월 1회)
              </li>
              <li className="flex items-center gap-2 font-bold text-crypto-yellow">
                <span>✓</span>
                VIP 전용 채팅방
              </li>
              <li className="flex items-center gap-2">
                <span className="text-crypto-green">✓</span>
                우선 기능 업데이트
              </li>
            </ul>
            
            <button
              onClick={() => handleSubscribe('vip')}
              disabled={processing}
              className="btn-secondary w-full border-crypto-yellow text-crypto-yellow disabled:opacity-50"
            >
              {processing ? '처리 중...' : 'VIP 시작하기'}
            </button>
          </div>
        </div>

        <p className="text-center text-white/40 text-sm mt-8">
          * 결제는 토스페이먼츠로 안전하게 처리됩니다
          <br />
          * 언제든 구독을 취소할 수 있습니다
        </p>
      </div>
    </div>
  )
}
