'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function Home() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen">
      {/* 네비게이션 */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-crypto-dark/80 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold gradient-text">
            🚀 크립토 PRO
          </Link>
          <div className="flex gap-4">
            <Link href="/login" className="btn-secondary text-sm">
              로그인
            </Link>
            <Link href="/signup" className="btn-primary text-sm">
              무료 시작하기
            </Link>
          </div>
        </div>
      </nav>

      {/* 히어로 섹션 */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-block px-4 py-2 bg-crypto-green/10 border border-crypto-green/30 rounded-full text-crypto-green text-sm mb-6">
            ✨ AI 기반 실시간 분석
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="gradient-text">7단계 체크리스트</span>로
            <br />
            암호화폐 매매 타이밍을 잡으세요
          </h1>
          
          <p className="text-xl text-white/70 max-w-2xl mx-auto mb-10">
            거시경제, ETF 자금흐름, 온체인 데이터, 기술적 분석까지
            <br />
            140점 만점 체크리스트로 최적의 진입 시점을 알려드립니다
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup" className="btn-primary text-lg px-8 py-4">
              🚀 무료로 시작하기
            </Link>
            <Link href="/dashboard" className="btn-secondary text-lg px-8 py-4">
              📊 데모 보기
            </Link>
          </div>
        </div>
      </section>

      {/* 기능 섹션 */}
      <section className="py-20 px-4 bg-crypto-dark-2/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            <span className="gradient-text">무료 vs PRO</span> 비교
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* 무료 플랜 */}
            <div className="card">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">무료</h3>
                <p className="text-4xl font-bold text-white/70">₩0</p>
                <p className="text-white/50">영원히 무료</p>
              </div>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3">
                  <span className="text-crypto-green">✓</span>
                  <span>핵심 코인 4개 (BTC, ETH, XRP, BNB)</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-crypto-green">✓</span>
                  <span>기본 체크리스트 점수</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-crypto-green">✓</span>
                  <span>시장 상태 요약</span>
                </li>
                <li className="flex items-center gap-3 text-white/40">
                  <span className="text-crypto-red">✗</span>
                  <span>상승 코인 TOP 6</span>
                </li>
                <li className="flex items-center gap-3 text-white/40">
                  <span className="text-crypto-red">✗</span>
                  <span>진입가/목표가/손절가</span>
                </li>
                <li className="flex items-center gap-3 text-white/40">
                  <span className="text-crypto-red">✗</span>
                  <span>체크리스트 상세 분석</span>
                </li>
                <li className="flex items-center gap-3 text-white/40">
                  <span className="text-crypto-red">✗</span>
                  <span>텔레그램 알림</span>
                </li>
              </ul>
              
              <Link href="/signup" className="block text-center btn-secondary w-full">
                무료로 시작
              </Link>
            </div>
            
            {/* PRO 플랜 */}
            <div className="card border-2 border-crypto-green relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="pro-badge px-4 py-1">🔥 BEST</span>
              </div>
              
              <div className="text-center mb-6 pt-4">
                <h3 className="text-2xl font-bold mb-2">PRO</h3>
                <p className="text-4xl font-bold text-crypto-green">₩49,000</p>
                <p className="text-white/50">월간 구독</p>
              </div>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3">
                  <span className="text-crypto-green">✓</span>
                  <span>무료 기능 전체 포함</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-crypto-green">✓</span>
                  <span className="font-bold text-crypto-green">상승 코인 TOP 6 실시간</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-crypto-green">✓</span>
                  <span className="font-bold text-crypto-green">진입가/목표가/손절가 제공</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-crypto-green">✓</span>
                  <span className="font-bold text-crypto-green">7단계 체크리스트 상세 분석</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-crypto-green">✓</span>
                  <span>무제한 코인 검색</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-crypto-green">✓</span>
                  <span>시그널 히스토리</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-crypto-green">✓</span>
                  <span>텔레그램 실시간 알림</span>
                </li>
              </ul>
              
              <Link href="/signup?plan=pro" className="block text-center btn-primary w-full">
                PRO 시작하기
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 7단계 체크리스트 설명 */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">
            <span className="gradient-text">7단계 체크리스트</span>란?
          </h2>
          <p className="text-center text-white/70 mb-12 max-w-2xl mx-auto">
            여러 지표를 종합해 140점 만점으로 시장 상황을 분석합니다
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: '🌍', name: '거시환경', max: 20, desc: '금리, 달러 지수, 시장 심리' },
              { icon: '📊', name: 'ETF·제도권', max: 25, desc: 'ETF 유입량, 기관 매수세' },
              { icon: '🔗', name: '온체인', max: 25, desc: '거래소 잔고, 고래 움직임' },
              { icon: '🤖', name: 'AI·메타버스', max: 20, desc: 'AI 코인 섹터, 트렌드' },
              { icon: '📈', name: '선물시장', max: 20, desc: '펀딩비, OI, 롱숏비율' },
              { icon: '📉', name: '기술적분석', max: 20, desc: 'RSI, MACD, 이평선' },
              { icon: '🎯', name: '전략', max: 10, desc: '종합 판단, 리스크 평가' },
            ].map((item) => (
              <div key={item.name} className="card text-center">
                <div className="text-4xl mb-3">{item.icon}</div>
                <h3 className="font-bold mb-1">{item.name}</h3>
                <p className="text-crypto-blue font-bold mb-2">{item.max}점</p>
                <p className="text-sm text-white/50">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA 섹션 */}
      <section className="py-20 px-4 bg-gradient-to-r from-crypto-green/10 to-crypto-blue/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            지금 바로 시작하세요
          </h2>
          <p className="text-white/70 mb-8">
            무료로 시작하고, 마음에 들면 PRO로 업그레이드하세요
          </p>
          <Link href="/signup" className="btn-primary text-lg px-10 py-4 inline-block">
            🚀 무료로 시작하기
          </Link>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="py-10 px-4 border-t border-white/10">
        <div className="max-w-7xl mx-auto text-center text-white/50 text-sm">
          <p>© 2024 크립토 대시보드 PRO. All rights reserved.</p>
          <p className="mt-2">
            투자 결정은 본인의 판단과 책임 하에 이루어져야 합니다.
          </p>
        </div>
      </footer>
    </div>
  )
}
