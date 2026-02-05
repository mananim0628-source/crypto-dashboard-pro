'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'

export default function Home() {
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const faqs = [
    {
      q: "투자나침반은 무엇인가요?",
      a: "투자나침반은 암호화폐 시장을 7단계 체크리스트로 분석하는 교육용 보조도구입니다. 거시환경, ETF 자금흐름, 온체인 데이터 등을 종합하여 시장 상황을 점수화합니다. 투자 조언이 아닌, 학습과 참고를 위한 도구입니다."
    },
    {
      q: "투자 추천 서비스인가요?",
      a: "아니요. 투자나침반은 투자 조언, 추천, 권유 서비스가 아닙니다. 시장 데이터를 분석하여 교육 목적의 정보를 제공하는 보조도구이며, 모든 투자 결정은 이용자 본인의 판단과 책임 하에 이루어져야 합니다."
    },
    {
      q: "7단계 체크리스트는 어떻게 구성되나요?",
      a: "1.거시환경(20점) 2.ETF/제도권(25점) 3.온체인(25점) 4.AI/메타버스(20점) 5.선물시장(20점) 6.기술적분석(20점) 7.전략(10점)으로 총 140점 만점입니다. 각 항목은 실시간 데이터를 기반으로 자동 계산됩니다."
    },
    {
      q: "무료로 이용할 수 있나요?",
      a: "네, 무료 회원도 핵심 코인 4개의 기본 점수와 시그널을 확인할 수 있습니다. PRO 회원은 7단계 상세 분석, 분석 기준가/상단 저항/하단 지지, AI 코멘트, 무제한 검색 등 모든 기능을 이용할 수 있습니다."
    },
    {
      q: "환불이 가능한가요?",
      a: "투자나침반은 결제 즉시 모든 콘텐츠가 제공되는 디지털 교육 상품입니다. 전자상거래법에 따라 결제 완료 후에는 환불이 불가능합니다. 결제 전 충분히 검토해 주시기 바랍니다."
    },
    {
      q: "트레이딩뷰 지표도 제공하나요?",
      a: "네, 트레이딩뷰 커스텀 지표는 별도 상품으로 출시 예정입니다. 웹 대시보드와 함께 사용하면 더욱 효과적인 시장 분석이 가능합니다."
    }
  ]

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white">
      {/* 면책 배너 */}
      <div className="bg-yellow-500/10 border-b border-yellow-500/30 py-2 px-4 text-center">
        <p className="text-xs sm:text-sm text-yellow-200/90">
          ⚠️ 본 서비스는 <strong>투자 조언이 아닌 교육 목적의 보조도구</strong>입니다. 모든 투자 결정은 본인 책임입니다.
        </p>
      </div>

      {/* 헤더 */}
      <header className="border-b border-white/10 sticky top-0 bg-[#0a0a14]/95 backdrop-blur z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-xl font-bold whitespace-nowrap">
              🧭 투자나침반
            </Link>
            
            {/* 데스크톱 메뉴 */}
            <div className="hidden sm:flex items-center gap-3">
              <Link href="/login" className="px-4 py-2 border border-white/20 rounded-lg hover:bg-white/10 transition text-sm">
                로그인
              </Link>
              <Link href="/signup" className="px-4 py-2 bg-[#00d395] text-black rounded-lg hover:bg-[#00d395]/90 transition font-semibold text-sm">
                무료 시작하기
              </Link>
            </div>

            {/* 모바일 메뉴 버튼 */}
            <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="sm:hidden p-2 hover:bg-white/10 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* 모바일 드롭다운 */}
          {showMobileMenu && (
            <div className="sm:hidden mt-4 pt-4 border-t border-white/10 flex gap-2">
              <Link href="/login" className="flex-1 text-center py-2.5 border border-white/20 rounded-lg text-sm">로그인</Link>
              <Link href="/signup" className="flex-1 text-center py-2.5 bg-[#00d395] text-black rounded-lg font-semibold text-sm">무료 시작</Link>
            </div>
          )}
        </div>
      </header>

      {/* 히어로 섹션 */}
      <section className="py-16 sm:py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block px-4 py-2 bg-[#00d395]/10 border border-[#00d395]/30 rounded-full text-[#00d395] text-sm mb-6">
            🎓 교육용 시장 분석 보조도구
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 leading-tight">
            <span className="text-[#00d395]">7단계 체크리스트</span>로<br/>
            시장의 방향을 읽는 법을<br className="sm:hidden"/>
            배워보세요
          </h1>
          
          <p className="text-base sm:text-lg text-white/70 mb-4 leading-relaxed px-2">
            거시경제, ETF 자금흐름, 온체인 데이터, 기술적 분석까지<br className="hidden sm:block"/>
            140점 만점 체크리스트로 시장 상황을 객관적으로 분석합니다
          </p>

          <p className="text-sm text-white/50 mb-8">
            ※ 본 서비스는 투자 조언이 아닌 학습 참고용 도구입니다
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
            <Link href="/signup" className="w-full sm:w-auto px-8 py-4 bg-[#00d395] text-black rounded-xl font-semibold hover:bg-[#00d395]/90 transition text-base">
              🚀 무료로 시작하기
            </Link>
            <Link href="#features" className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/20 rounded-xl hover:bg-white/10 transition text-base">
              📊 기능 살펴보기
            </Link>
          </div>
        </div>
      </section>

      {/* 스크린샷 섹션 */}
      <section className="py-16 px-4 border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">실제 대시보드 미리보기</h2>
          <p className="text-white/60 text-center mb-12">실시간으로 업데이트되는 시장 분석 화면</p>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 대시보드 전체 */}
            <div className="bg-[#1a1a2e] rounded-2xl p-4 border border-white/10">
              <p className="text-sm text-white/50 mb-3">📊 대시보드 - 핵심 코인 & 상승 코인 분석</p>
              <div className="bg-[#0a0a14] rounded-xl overflow-hidden aspect-video flex items-center justify-center">
                <img 
                  src="/screenshots/dashboard.png" 
                  alt="대시보드 화면" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                    e.currentTarget.nextElementSibling?.classList.remove('hidden')
                  }}
                />
                <div className="hidden text-center p-8">
                  <p className="text-4xl mb-2">📊</p>
                  <p className="text-white/50 text-sm">대시보드 미리보기</p>
                </div>
              </div>
            </div>

            {/* 7단계 체크리스트 */}
            <div className="bg-[#1a1a2e] rounded-2xl p-4 border border-white/10">
              <p className="text-sm text-white/50 mb-3">📋 7단계 체크리스트 & 매매 전략</p>
              <div className="bg-[#0a0a14] rounded-xl overflow-hidden aspect-video flex items-center justify-center">
                <img 
                  src="/screenshots/checklist.png" 
                  alt="7단계 체크리스트" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                    e.currentTarget.nextElementSibling?.classList.remove('hidden')
                  }}
                />
                <div className="hidden text-center p-8">
                  <p className="text-4xl mb-2">📋</p>
                  <p className="text-white/50 text-sm">체크리스트 미리보기</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 특징 섹션 */}
      <section id="features" className="py-16 px-4 border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">
            <span className="text-[#00d395]">투자나침반</span>의 핵심 기능
          </h2>
          <p className="text-white/60 text-center mb-12">해외 유명 서비스들의 장점을 하나로 모았습니다</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-[#1a1a2e] rounded-2xl p-6 border border-white/10 hover:border-[#00d395]/30 transition">
              <div className="text-3xl mb-4">📊</div>
              <h3 className="text-lg font-bold mb-2">7단계 체크리스트</h3>
              <p className="text-white/60 text-sm">거시환경, ETF, 온체인, AI, 선물, 기술적 분석, 전략까지 140점 만점으로 종합 분석</p>
            </div>
            
            <div className="bg-[#1a1a2e] rounded-2xl p-6 border border-white/10 hover:border-[#00d395]/30 transition">
              <div className="text-3xl mb-4">🎯</div>
              <h3 className="text-lg font-bold mb-2">참고용 가격대</h3>
              <p className="text-white/60 text-sm">분석 기준가, 상단 저항, 하단 지지를 자동 계산하여 시장 분석 학습에 활용할 수 있습니다</p>
            </div>
            
            <div className="bg-[#1a1a2e] rounded-2xl p-6 border border-white/10 hover:border-[#00d395]/30 transition">
              <div className="text-3xl mb-4">🤖</div>
              <h3 className="text-lg font-bold mb-2">AI 분석 코멘트</h3>
              <p className="text-white/60 text-sm">AI가 분석한 시장 상황을 쉽게 이해할 수 있도록 설명해드립니다</p>
            </div>
            
            <div className="bg-[#1a1a2e] rounded-2xl p-6 border border-white/10 hover:border-[#00d395]/30 transition">
              <div className="text-3xl mb-4">⚡</div>
              <h3 className="text-lg font-bold mb-2">실시간 업데이트</h3>
              <p className="text-white/60 text-sm">2분마다 자동 업데이트되는 실시간 데이터로 시장 변화를 관찰할 수 있습니다</p>
            </div>
            
            <div className="bg-[#1a1a2e] rounded-2xl p-6 border border-white/10 hover:border-[#00d395]/30 transition">
              <div className="text-3xl mb-4">🔍</div>
              <h3 className="text-lg font-bold mb-2">무제한 코인 검색</h3>
              <p className="text-white/60 text-sm">PRO 회원은 원하는 코인을 무제한으로 검색하고 분석할 수 있습니다</p>
            </div>
            
            <div className="bg-[#1a1a2e] rounded-2xl p-6 border border-white/10 hover:border-[#00d395]/30 transition">
              <div className="text-3xl mb-4">📱</div>
              <h3 className="text-lg font-bold mb-2">텔레그램 알림</h3>
              <p className="text-white/60 text-sm">VIP 회원 전용 텔레그램 알림으로 주요 시장 변화를 확인하세요</p>
            </div>
          </div>
        </div>
      </section>

      {/* 7단계 체크리스트 상세 */}
      <section className="py-16 px-4 border-t border-white/10 bg-gradient-to-b from-transparent to-[#1a1a2e]/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">7단계 체크리스트 분석 프레임워크</h2>
          <p className="text-white/60 text-center mb-12">다양한 관점에서 시장을 종합적으로 분석합니다</p>
          
          <div className="space-y-4">
            {[
              { num: 1, name: '거시환경', score: 20, desc: '금리, 달러 인덱스, 글로벌 유동성 등', color: 'bg-blue-500' },
              { num: 2, name: 'ETF/제도권', score: 25, desc: 'ETF 자금 흐름, 기관 투자 동향', color: 'bg-purple-500' },
              { num: 3, name: '온체인', score: 25, desc: '지갑 활동, 거래소 입출금, 홀더 분포', color: 'bg-green-500' },
              { num: 4, name: 'AI/메타버스', score: 20, desc: 'AI 관련 트렌드, 메타버스 생태계', color: 'bg-pink-500' },
              { num: 5, name: '선물시장', score: 20, desc: '미결제약정, 펀딩비, 롱숏 비율', color: 'bg-orange-500' },
              { num: 6, name: '기술적 분석', score: 20, desc: 'RSI, MACD, 이동평균선, 지지/저항', color: 'bg-cyan-500' },
              { num: 7, name: '전략', score: 10, desc: '종합 판단, 리스크 레벨', color: 'bg-yellow-500' },
            ].map((item) => (
              <div key={item.num} className="bg-[#1a1a2e] rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 ${item.color} rounded-lg flex items-center justify-center font-bold text-white`}>
                    {item.num}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="font-semibold">{item.name}</h3>
                      <span className="text-white/50 text-sm">{item.score}점</span>
                    </div>
                    <p className="text-white/50 text-sm">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
            <div className="bg-[#00d395]/10 border border-[#00d395]/30 rounded-xl p-4 text-center">
              <p className="text-[#00d395] font-bold text-lg">총점: 140점 만점</p>
              <p className="text-white/60 text-sm mt-1">점수가 높을수록 긍정적 시장 상황으로 해석</p>
            </div>
          </div>
        </div>
      </section>

      {/* 향후 출시 예정 */}
      <section className="py-16 px-4 border-t border-white/10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">🚀 Coming Soon</h2>
          <p className="text-white/60 text-center mb-12">투자나침반이 준비하고 있는 서비스</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">📈</span>
                <h3 className="font-bold">트레이딩뷰 커스텀 지표</h3>
              </div>
              <p className="text-white/60 text-sm">투자나침반의 7단계 분석을 트레이딩뷰에서 직접 사용할 수 있는 커스텀 지표</p>
              <span className="inline-block mt-3 px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs">출시 예정</span>
            </div>
            
            <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">📚</span>
                <h3 className="font-bold">전자책: 활용 가이드</h3>
              </div>
              <p className="text-white/60 text-sm">투자나침반을 효과적으로 활용하는 방법을 담은 전자책</p>
              <span className="inline-block mt-3 px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-xs">출시 예정</span>
            </div>
            
            <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">🇰🇷</span>
                <h3 className="font-bold">국내주식 버전</h3>
              </div>
              <p className="text-white/60 text-sm">코스피, 코스닥 종목을 분석하는 국내주식 전용 나침반</p>
              <span className="inline-block mt-3 px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs">개발 중</span>
            </div>
            
            <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/30 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">🇺🇸</span>
                <h3 className="font-bold">미국주식 버전</h3>
              </div>
              <p className="text-white/60 text-sm">나스닥, S&P500 종목을 분석하는 미국주식 전용 나침반</p>
              <span className="inline-block mt-3 px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-xs">개발 중</span>
            </div>
          </div>
        </div>
      </section>

      {/* 요금제 */}
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
                <li>✓ 핵심 코인 4개 기본 점수</li>
                <li>✓ 시그널 확인 (긍정/중립/부정)</li>
                <li>✓ 즐겨찾기 3개</li>
                <li className="text-white/30">✗ 7단계 상세 분석</li>
                <li className="text-white/30">✗ 분석 기준가/상단 저항/하단 지지</li>
              </ul>
              <Link href="/signup" className="block mt-6 py-2 border border-white/20 rounded-lg hover:bg-white/10 transition text-sm">
                무료로 시작
              </Link>
            </div>
            
            {/* PRO */}
            <div className="bg-gradient-to-b from-[#00d395]/20 to-transparent rounded-2xl p-6 border border-[#00d395]/50 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#00d395] text-black text-xs font-bold px-3 py-1 rounded-full">추천</div>
              <h3 className="text-lg font-bold mb-2">PRO</h3>
              <p className="text-3xl font-bold mb-4">₩49,000<span className="text-sm font-normal">/월</span></p>
              <ul className="text-sm text-white/80 space-y-2 text-left">
                <li>✓ 모든 무료 기능</li>
                <li>✓ <strong>7단계 상세 분석</strong></li>
                <li>✓ <strong>분석 기준가/상단 저항/하단 지지</strong></li>
                <li>✓ <strong>AI 분석 코멘트</strong></li>
                <li>✓ 무제한 코인 검색</li>
                <li>✓ 상승 코인 TOP 6</li>
              </ul>
              <Link href="/signup" className="block mt-6 py-2 bg-[#00d395] text-black rounded-lg font-semibold hover:bg-[#00d395]/90 transition text-sm">
                PRO 시작하기
              </Link>
            </div>
            
            {/* VIP */}
            <div className="bg-[#1a1a2e] rounded-2xl p-6 border border-white/10">
              <h3 className="text-lg font-bold mb-2">VIP</h3>
              <p className="text-3xl font-bold mb-4">₩149,000<span className="text-sm font-normal">/월</span></p>
              <ul className="text-sm text-white/60 space-y-2 text-left">
                <li>✓ PRO 모든 기능</li>
                <li>✓ <strong className="text-white">텔레그램 알림</strong></li>
                <li>✓ <strong className="text-white">VIP 전용 채팅방</strong></li>
                <li>✓ <strong className="text-white">1:1 상담</strong></li>
                <li>✓ 우선 고객 지원</li>
              </ul>
              <Link href="/signup" className="block mt-6 py-2 border border-white/20 rounded-lg hover:bg-white/10 transition text-sm">
                VIP 시작하기
              </Link>
            </div>
          </div>
          
          <p className="text-white/40 text-sm mt-6">
            ※ 디지털 콘텐츠 특성상 결제 후 환불이 불가능합니다. <Link href="/refund" className="text-[#00d395] hover:underline">환불정책 확인</Link>
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 border-t border-white/10">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">자주 묻는 질문</h2>
          
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-[#1a1a2e] rounded-xl border border-white/10 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full p-4 text-left flex justify-between items-center hover:bg-white/5 transition"
                >
                  <span className="font-semibold pr-4">{faq.q}</span>
                  <span className={`text-[#00d395] transition-transform ${openFaq === index ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </button>
                {openFaq === index && (
                  <div className="px-4 pb-4 text-white/70 text-sm leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 border-t border-white/10 bg-gradient-to-b from-transparent to-[#00d395]/5">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            지금 바로 시작하세요
          </h2>
          <p className="text-white/60 mb-8">
            무료로 가입하고 시장 분석 도구를 체험해보세요
          </p>
          <Link href="/signup" className="inline-block px-8 py-4 bg-[#00d395] text-black rounded-xl font-semibold hover:bg-[#00d395]/90 transition text-lg">
            🧭 무료로 시작하기
          </Link>
          <p className="text-white/40 text-sm mt-4">
            가입 후 즉시 무료 기능 이용 가능
          </p>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="border-t border-white/10 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">🧭</span>
              <span className="font-bold">투자나침반</span>
              <span className="text-white/30 text-sm">|</span>
              <span className="text-white/50 text-sm">교육용 시장 분석 도구</span>
            </div>
            <div className="flex gap-4 text-sm text-white/50">
              <Link href="/terms" className="hover:text-white">이용약관</Link>
              <Link href="/privacy" className="hover:text-white">개인정보처리방침</Link>
              <Link href="/refund" className="hover:text-white">환불정책</Link>
            </div>
          </div>
          
          {/* 사업자 정보 (토스페이먼츠 필수) */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="text-white/40 text-xs leading-relaxed space-y-1 text-center sm:text-left">
              <p><span className="text-white/50">상호:</span> 맛 없으면 안 Farm | <span className="text-white/50">대표:</span> 장학용</p>
              <p><span className="text-white/50">사업자등록번호:</span> 493-91-02061</p>
              <p><span className="text-white/50">주소:</span> 서울특별시 강남구 삼성로85길 39, 3층 E320호(대치동, 가리온)</p>
              <p><span className="text-white/50">연락처:</span> 010-3463-1519 | <span className="text-white/50">이메일:</span> cheongsong0303@naver.com</p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <p className="text-white/30 text-xs leading-relaxed">
              투자나침반은 투자 조언, 추천, 권유 서비스가 아닙니다. 모든 정보는 교육 및 참고 목적으로만 제공되며,<br className="hidden sm:block"/>
              투자 결정에 따른 손익은 전적으로 이용자 본인에게 귀속됩니다. 암호화폐 투자는 원금 손실의 위험이 있습니다.
            </p>
            <p className="text-white/30 text-xs mt-4">
              © 2026 투자나침반. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
