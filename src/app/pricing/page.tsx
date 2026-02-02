'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Pricing() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClientComponentClient()

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

  // Latpeed 결제 페이지로 이동
  const handlePayment = (planType: 'pro' | 'vip') => {
    if (!user) {
      router.push('/signup?plan=' + planType)
      return
    }
    
    // Latpeed 멤버십 결제 URL
    const latpeedUrl = 'https://www.latpeed.com/memberships/6826d3aa2ce9b92d5c889a3f'
    window.open(latpeedUrl, '_blank')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="w-12 h-12 border-4 border-[#00d395] border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12 px-4 bg-[#0a0a0a]">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Link href="/dashboard" className="inline-block mb-6">
            <span className="text-3xl font-bold text-[#00d395]">🚀 크립토 PRO</span>
          </Link>
          <h1 className="text-4xl font-bold text-white mb-4">요금제 선택</h1>
          <p className="text-white/60">AI 기반 실시간 분석으로 수익률을 높이세요</p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          
          {/* PRO */}
          <div className="bg-[#1a1a2e] border border-[#00d395] rounded-2xl p-8 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-[#00d395] text-black px-4 py-1 rounded-full text-sm font-bold">BEST</span>
            </div>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">PRO</h2>
              <div className="flex items-end justify-center gap-1">
                <span className="text-4xl font-bold text-white">₩49,000</span>
                <span className="text-white/50 mb-1">/월</span>
              </div>
            </div>
            <ul className="space-y-3 mb-8 text-white/80">
              <li className="flex items-center gap-2"><span className="text-[#00d395]">✓</span> 무제한 코인 검색</li>
              <li className="flex items-center gap-2"><span className="text-[#00d395]">✓</span> 7단계 체크리스트 상세 분석</li>
              <li className="flex items-center gap-2"><span className="text-[#00d395]">✓</span> 진입가/목표가/손절가</li>
              <li className="flex items-center gap-2"><span className="text-[#00d395]">✓</span> 상승 코인 TOP 6</li>
              <li className="flex items-center gap-2"><span className="text-[#00d395]">✓</span> 시그널 히스토리</li>
            </ul>
            <button
              onClick={() => handlePayment('pro')}
              className="w-full bg-[#00d395] text-black py-3 rounded-xl font-bold hover:bg-[#00d395]/90 transition"
            >
              PRO 시작하기
            </button>
          </div>

          {/* VIP */}
          <div className="bg-[#1a1a2e] border border-yellow-500/50 rounded-2xl p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-yellow-400 mb-2">VIP</h2>
              <div className="flex items-end justify-center gap-1">
                <span className="text-4xl font-bold text-white">₩149,000</span>
                <span className="text-white/50 mb-1">/월</span>
              </div>
            </div>
            <ul className="space-y-3 mb-8 text-white/80">
              <li className="flex items-center gap-2"><span className="text-yellow-400">✓</span> PRO 기능 전체 포함</li>
              <li className="flex items-center gap-2"><span className="text-yellow-400">✓</span> 텔레그램 실시간 알림</li>
              <li className="flex items-center gap-2"><span className="text-yellow-400">✓</span> 1:1 줌 상담 (월 1회)</li>
              <li className="flex items-center gap-2"><span className="text-yellow-400">✓</span> VIP 전용 채팅방</li>
              <li className="flex items-center gap-2"><span className="text-yellow-400">✓</span> 우선 고객 지원</li>
            </ul>
            <button
              onClick={() => handlePayment('vip')}
              className="w-full border-2 border-yellow-500 text-yellow-400 py-3 rounded-xl font-bold hover:bg-yellow-500/10 transition"
            >
              VIP 시작하기
            </button>
          </div>
        </div>

        {/* 결제 안내 */}
        <div className="mt-8 text-center text-white/50 text-sm">
          <p>결제는 Latpeed를 통해 안전하게 처리됩니다</p>
          <p className="mt-2">문의: <a href="https://t.me/AI_Signal_Labb" className="text-[#00d395]">@AI_Signal_Labb</a></p>
        </div>

        <div className="text-center mt-8">
          <Link href="/dashboard" className="text-[#00d395] hover:underline">← 대시보드로 돌아가기</Link>
        </div>
      </div>
    </div>
  )
}
