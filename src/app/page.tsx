'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function Home() {
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white">
      {/* 헤더 - 모바일 최적화 */}
      <header className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            {/* 로고 */}
            <Link href="/" className="text-xl font-bold whitespace-nowrap">
              🚀 크립토 PRO
            </Link>
            
            {/* 데스크톱 메뉴 */}
            <div className="hidden sm:flex items-center gap-3">
              <Link 
                href="/login" 
                className="px-4 py-2 border border-white/20 rounded-lg hover:bg-white/10 transition text-sm"
              >
                로그인
              </Link>
              <Link 
                href="/signup" 
                className="px-4 py-2 bg-[#00d395] text-black rounded-lg hover:bg-[#00d395]/90 transition font-semibold text-sm"
              >
                무료 시작하기
              </Link>
            </div>

            {/* 모바일 메뉴 버튼 */}
            <button 
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="sm:hidden p-2 hover:bg-white/10 rounded-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* 모바일 드롭다운 메뉴 */}
          {showMobileMenu && (
            <div className="sm:hidden mt-4 pt-4 border-t border-white/10 flex gap-2">
              <Link 
                href="/login" 
                className="flex-1 text-center py-2.5 border border-white/20 rounded-lg hover:bg-white/10 transition text-sm"
              >
                로그인
              </Link>
              <Link 
                href="/signup" 
                className="flex-1 text-center py-2.5 bg-[#00d395] text-black rounded-lg hover:bg-[#00d395]/90 transition font-semibold text-sm"
              >
                무료 시작
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* 히어로 섹션 */}
      <section className="py-16 sm:py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block px-4 py-2 bg-[#00d395]/10 border border-[#00d395]/30 rounded-full text-[#00d395] text-sm mb-6">
            ✨ AI 기반 실시간 분석
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 leading-tight">
            <span className="text-[#00d395]">7단계 체크리스트</span>로<br/>
            암호화폐 매매 타이밍을<br className="sm:hidden"/>
            잡으세요
          </h1>
          
          <p className="text-base sm:text-lg text-white/70 mb-8 leading-relaxed px-2">
            거시경제, ETF 자금흐름, 온체인 데이터, 기술적 분석까지<br className="hidden sm:block"/>
            140점 만점 체크리스트로 최적의 진입 시점을 알려드립니다
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
            <Link 
              href="/signup" 
              className="w-full sm:w-auto px-8 py-4 bg-[#00d395] text-black rounded-xl font-semibold hover:bg-[#00d395]/90 transition text-base"
            >
              🚀 무료로 시작하기
            </Link>
            <Link 
              href="/demo" 
              className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/20 rounded-xl hover:bg-white/10 transition text-base"
            >
              📊 데모 보기
            </Link>
          </div>
        </div>
      </section>

      {/* 특징 섹션 */}
      <section className="py-16 px-4 border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            왜 <span className="text-[#00d395]">크립토 PRO</span>인가요?
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* 특징 1 */}
            <div className="bg-[#1a1a2e] rounded-2xl p-6 border border-white/10 hover:border-[#00d395]/30 transition">
              <div className="text-3xl mb-4">📊</div>
              <h3 className="text-lg font-bold mb-2">7단계 체크리스트</h3>
              <p className="text-white/60 text-sm">거시환경, ETF, 온체인, AI, 선물, 기술적 분석, 전략까지 140점 만점으로 종합 분석</p>
            </div>
            
            {/* 특징 2 */}
            <div className="bg-[#1a1a2e] rounded-2xl p-6 border border-white/10 hover:border-[#00d395]/30 transition">
              <div className="text-3xl mb-4">🎯</div>
              <h3 className="text-lg font-bold mb-2">진입가/목표가/손절가</h3>
              <p className="text-white/60 text-sm">명확한 매매 포인트와 손익비를 제공하여 리스크 관리를 도와드립니다</p>
            </div>
            
            {/* 특징 3 */}
            <div className="bg-[#1a1a2e] rounded-2xl p-6 border border-white/10 hover:border-[#00d395]/30 transition">
              <div className="text-3xl mb-4">🤖</div>
              <h3 className="text-lg font-bold mb-2">AI 매매 코멘트</h3>
              <p className="text-white/60 text-sm">AI가 분석한 시장 상황과 매매 전략을 쉽게 이해할 수 있도록 설명해드립니다</p>
            </div>
            
            {/* 특징 4 */}
            <div className="bg-[#1a1a2e] rounded-2xl p-6 border border-white/10 hover:border-[#00d395]/30 transition">
              <div className="text-3xl mb-4">⚡</div>
              <h3 className="text-lg font-bold mb-2">실시간 업데이트</h3>
              <p className="text-white/60 text-sm">2분마다 자동 업데이트되는 실시간 데이터로 빠른 시장 대응이 가능합니다</p>
            </div>
            
            {/* 특징 5 */}
            <div className="bg-[#1a1a2e] rounded-2xl p-6 border border-white/10 hover:border-[#00d395]/30 transition">
              <div className="text-3xl mb-4">📱</div>
              <h3 className="text-lg font-bold mb-2">텔레그램 알림</h3>
              <p className="text-white/60 text-sm">VIP 회원 전용 텔레그램 알림으로 중요한 시그널을 놓치지 마세요</p>
            </div>
            
            {/* 특징 6 */}
            <div className="bg-[#1a1a2e] rounded-2xl p-6 border border-white/10 hover:border-[#00d395]/30 transition">
              <div className="text-3xl mb-4">🔥</div>
              <h3 className="text-lg font-bold mb-2">상승 코인 TOP 6</h3>
              <p className="text-white/60 text-sm">PRO 회원 전용 실시간 상승 코인 분석으로 기회를 포착하세요</p>
            </div>
          </div>
        </div>
      </section>

      {/* 요금제 미리보기 */}
      <section className="py-16 px-4 border-t border-white/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">합리적인 요금제</h2>
          <p className="text-white/60 mb-8">무료로 시작하고, 필요할 때 업그레이드하세요</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Free */}
            <div className="bg-[#1a1a2e] rounded-2xl p-6 border border-white/10">
              <h3 className="text-lg font-bold mb-2">무료</h3>
              <p className="text-3xl font-bold mb-4">₩0</p>
              <ul className="text-sm text-white/60 space-y-2 text-left">
                <li>✓ 핵심 코인 4개 분석</li>
                <li>✓ 기본 점수 확인</li>
                <li>✓ 즐겨찾기 3개</li>
              </ul>
            </div>
            
            {/* PRO */}
            <div className="bg-gradient-to-b from-[#00d395]/20 to-transparent rounded-2xl p-6 border border-[#00d395]/50 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#00d395] text-black text-xs font-bold px-3 py-1 rounded-full">인기</div>
              <h3 className="text-lg font-bold mb-2">PRO</h3>
              <p className="text-3xl font-bold mb-4">₩49,000<span className="text-sm font-normal">/월</span></p>
              <ul className="text-sm text-white/80 space-y-2 text-left">
                <li>✓ 7단계 상세 분석</li>
                <li>✓ 진입가/목표가/손절가</li>
                <li>✓ AI 매매 코멘트</li>
                <li>✓ 무제한 검색</li>
              </ul>
            </div>
            
            {/* VIP */}
            <div className="bg-[#1a1a2e] rounded-2xl p-6 border border-white/10">
              <h3 className="text-lg font-bold mb-2">VIP</h3>
              <p className="text-3xl font-bold mb-4">₩149,000<span className="text-sm font-normal">/월</span></p>
              <ul className="text-sm text-white/60 space-y-2 text-left">
                <li>✓ PRO 모든 기능</li>
                <li>✓ 텔레그램 알림</li>
                <li>✓ 1:1 상담</li>
                <li>✓ VIP 전용 채팅방</li>
              </ul>
            </div>
          </div>
          
          <Link 
            href="/pricing" 
            className="inline-block mt-8 text-[#00d395] hover:underline"
          >
            요금제 자세히 보기 →
          </Link>
        </div>
      </section>

      {/* CTA 섹션 */}
      <section className="py-16 px-4 border-t border-white/10">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            지금 바로 시작하세요
          </h2>
          <p className="text-white/60 mb-8">
            무료로 가입하고 핵심 코인 분석을 확인해보세요
          </p>
          <Link 
            href="/signup" 
            className="inline-block px-8 py-4 bg-[#00d395] text-black rounded-xl font-semibold hover:bg-[#00d395]/90 transition text-lg"
          >
            🚀 무료로 시작하기
          </Link>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="border-t border-white/10 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-white/50 text-sm">
              © 2025 크립토 PRO. All rights reserved.
            </div>
            <div className="flex gap-4 text-sm text-white/50">
              <Link href="/terms" className="hover:text-white">이용약관</Link>
              <Link href="/privacy" className="hover:text-white">개인정보처리방침</Link>
              <Link href="/contact" className="hover:text-white">문의하기</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
