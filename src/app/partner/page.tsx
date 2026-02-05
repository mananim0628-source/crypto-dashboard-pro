'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function PartnerPage() {
  const [lang, setLang] = useState<'ko' | 'en'>('ko')
  const txt = (ko: string, en: string) => lang === 'ko' ? ko : en

  const features = [
    { icon: '🧭', title: txt('AI 체크리스트 분석', 'AI Checklist Analysis'), desc: txt('7단계 140점 만점 체크리스트로 코인별 시장 상황을 종합 분석합니다. 거시경제, ETF, 온체인, AI, 선물, 기술적 분석, 전략 7가지 영역을 실시간 점수화합니다.', '7-step 140-point checklist analyzing market conditions across macro, ETF, on-chain, AI, futures, technical, and strategy dimensions.') },
    { icon: '📊', title: txt('실시간 대시보드', 'Real-time Dashboard'), desc: txt('BTC, ETH, XRP, BNB 핵심 코인과 실시간 상승 코인 TOP 6을 자동 분석합니다. 2분마다 데이터가 갱신되며, 코인 검색으로 원하는 코인도 분석 가능합니다.', 'Auto-analyzes core coins (BTC, ETH, XRP, BNB) and top 6 gainers. Data refreshes every 2 minutes with search functionality for any coin.') },
    { icon: '🔔', title: txt('텔레그램 알림', 'Telegram Alerts'), desc: txt('설정한 점수 임계치에 도달하면 텔레그램으로 즉시 알림을 받습니다. 긍정/부정 시그널 변화, 가격 급등락도 자동 알림됩니다.', 'Receive instant Telegram alerts when score thresholds are met. Get notified on signal changes and sudden price movements.') },
    { icon: '📈', title: txt('트레이딩뷰 연동', 'TradingView Integration'), desc: txt('독자 개발한 트레이딩뷰 지표와 연동됩니다. RSI, MACD, 볼린저밴드 등 기술적 분석 지표가 체크리스트 점수에 자동 반영됩니다.', 'Integrated with proprietary TradingView indicators. Technical analysis indicators automatically feed into checklist scores.') },
  ]

  const plans = [
    { name: 'FREE', price: txt('무료', 'Free'), features: [txt('핵심 코인 4종 점수 확인', 'Core 4 coin scores'), txt('기본 시장 현황', 'Basic market overview'), txt('일부 체크리스트 항목', 'Limited checklist items')] },
    { name: 'PRO', price: '₩49,000/월', features: [txt('무제한 코인 분석', 'Unlimited coin analysis'), txt('7단계 체크리스트 상세', 'Full 7-step checklist'), txt('분석 기준가/저항/지지', 'Reference/Resistance/Support'), txt('AI 코멘트', 'AI Comments'), txt('텔레그램 알림', 'Telegram alerts'), txt('포트폴리오 관리', 'Portfolio management')] },
  ]

  const collabBenefits = [
    { icon: '💰', title: txt('수익 쉐어', 'Revenue Share'), desc: txt('추천 가입자의 구독료에서 지속적인 수익 쉐어를 제공합니다. 추천 코드 기반으로 투명하게 정산됩니다.', 'Ongoing revenue share from referred subscribers. Transparent settlement via referral codes.') },
    { icon: '🎁', title: txt('무료 PRO 계정', 'Free PRO Account'), desc: txt('협업 크리에이터에게 PRO 계정을 무료 제공합니다. 직접 사용해보고 리뷰할 수 있습니다.', 'Free PRO account for partner creators. Try it yourself before recommending.') },
    { icon: '🎨', title: txt('맞춤 콘텐츠 소재', 'Custom Content Assets'), desc: txt('대시보드 스크린샷, 분석 리포트 등 콘텐츠 제작에 필요한 소재를 제공합니다.', 'Dashboard screenshots, analysis reports, and content materials provided.') },
    { icon: '📢', title: txt('공동 프로모션', 'Co-Promotion'), desc: txt('투자나침반 공식 채널에서 파트너 크리에이터를 소개합니다.', 'Featured promotion on Investment Compass official channels.') },
  ]

  return (
    <div className="min-h-screen bg-[#0a0e17] text-white">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold">🧭 {txt('투자나침반', 'Investment Compass')}</Link>
          <div className="flex items-center gap-4">
            <button onClick={() => setLang(lang === 'ko' ? 'en' : 'ko')} className="text-sm text-white/60 hover:text-white">{lang === 'ko' ? 'EN' : 'KO'}</button>
            <Link href="/signup" className="bg-[#00d395] text-black px-6 py-2 rounded-xl font-bold text-sm hover:bg-[#00e6a0] transition">{txt('무료 시작', 'Start Free')}</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <div className="inline-block bg-[#00d395]/10 border border-[#00d395]/30 rounded-full px-6 py-2 mb-8">
          <span className="text-[#00d395] font-semibold text-sm">{txt('크리에이터 & 인플루언서 협업', 'Creator & Influencer Partnership')}</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
          {txt('AI가 분석하는', 'AI-Powered')}<br/>
          <span className="text-[#00d395]">{txt('크립토 체크리스트', 'Crypto Checklist')}</span><br/>
          {txt('대시보드', 'Dashboard')}
        </h1>
        <p className="text-xl text-white/60 mb-10 max-w-2xl mx-auto">
          {txt('7단계 140점 체크리스트로 코인 시장을 객관적으로 분석합니다. 교육적 분석 도구로 구독자에게 차별화된 가치를 제공하세요.', 'Objective crypto market analysis through 7-step 140-point checklist. Offer your subscribers differentiated value with this educational analysis tool.')}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/signup" className="bg-[#00d395] text-black px-8 py-4 rounded-2xl font-bold text-lg hover:bg-[#00e6a0] transition">{txt('무료 체험하기', 'Try for Free')}</Link>
          <a href="https://t.me/AI_Signal_Labb" target="_blank" rel="noopener noreferrer" className="bg-white/10 border border-white/20 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-white/20 transition">{txt('협업 문의하기', 'Partnership Inquiry')}</a>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: '140', label: txt('점 만점 체크리스트', 'Point Checklist') },
            { value: '7', label: txt('단계 분석 시스템', 'Step Analysis') },
            { value: '24/7', label: txt('실시간 모니터링', 'Real-time Monitoring') },
            { value: '2min', label: txt('데이터 갱신 주기', 'Data Refresh Cycle') },
          ].map((stat, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
              <p className="text-3xl font-black text-[#00d395]">{stat.value}</p>
              <p className="text-white/60 text-sm mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-black text-center mb-12">{txt('핵심 기능', 'Key Features')}</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {features.map((f, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:border-[#00d395]/30 transition">
              <span className="text-4xl mb-4 block">{f.icon}</span>
              <h3 className="text-xl font-bold mb-3">{f.title}</h3>
              <p className="text-white/60 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-black text-center mb-4">{txt('분석 프로세스', 'Analysis Process')}</h2>
        <p className="text-white/60 text-center mb-12">{txt('객관적 데이터 기반의 체크리스트 분석 시스템', 'Objective data-driven checklist analysis system')}</p>
        <div className="grid md:grid-cols-7 gap-4">
          {[
            { step: '1', name: txt('거시환경', 'Macro'), max: '20', color: 'from-blue-500/20 to-blue-600/20', border: 'border-blue-500/30' },
            { step: '2', name: 'ETF', max: '25', color: 'from-purple-500/20 to-purple-600/20', border: 'border-purple-500/30' },
            { step: '3', name: txt('온체인', 'On-chain'), max: '25', color: 'from-green-500/20 to-green-600/20', border: 'border-green-500/30' },
            { step: '4', name: 'AI', max: '20', color: 'from-pink-500/20 to-pink-600/20', border: 'border-pink-500/30' },
            { step: '5', name: txt('선물', 'Futures'), max: '20', color: 'from-orange-500/20 to-orange-600/20', border: 'border-orange-500/30' },
            { step: '6', name: txt('기술적', 'Technical'), max: '20', color: 'from-cyan-500/20 to-cyan-600/20', border: 'border-cyan-500/30' },
            { step: '7', name: txt('전략', 'Strategy'), max: '10', color: 'from-yellow-500/20 to-yellow-600/20', border: 'border-yellow-500/30' },
          ].map((s, i) => (
            <div key={i} className={`bg-gradient-to-b ${s.color} border ${s.border} rounded-2xl p-4 text-center`}>
              <div className="text-2xl font-black text-white/80 mb-1">{s.step}</div>
              <div className="text-sm font-bold mb-2">{s.name}</div>
              <div className="text-xs text-white/50">{s.max}{txt('점', 'pts')}</div>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <div className="inline-block bg-[#00d395]/10 border border-[#00d395]/30 rounded-2xl px-8 py-4">
            <span className="text-white/60">{txt('총점', 'Total')}</span>
            <span className="text-4xl font-black text-[#00d395] ml-4">140</span>
            <span className="text-white/60 ml-2">{txt('점', 'pts')}</span>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-black text-center mb-12">{txt('요금제', 'Pricing')}</h2>
        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {plans.map((plan, i) => (
            <div key={i} className={`rounded-2xl p-8 border ${i === 1 ? 'bg-[#00d395]/10 border-[#00d395]/30' : 'bg-white/5 border-white/10'}`}>
              <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
              <p className="text-3xl font-black text-[#00d395] mb-6">{plan.price}</p>
              <ul className="space-y-3">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-2 text-white/80">
                    <span className="text-[#00d395]">✓</span> {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Collaboration Benefits */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="bg-gradient-to-r from-[#00d395]/10 to-blue-500/10 border border-[#00d395]/20 rounded-3xl p-12">
          <h2 className="text-3xl font-black text-center mb-4">{txt('크리에이터 협업 혜택', 'Creator Partnership Benefits')}</h2>
          <p className="text-white/60 text-center mb-12">{txt('함께 성장하는 파트너십을 제안합니다', 'A partnership proposal for mutual growth')}</p>
          <div className="grid md:grid-cols-2 gap-6">
            {collabBenefits.map((b, i) => (
              <div key={i} className="bg-white/5 rounded-2xl p-6">
                <span className="text-3xl mb-3 block">{b.icon}</span>
                <h3 className="text-lg font-bold mb-2">{b.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <a href="https://t.me/AI_Signal_Labb" target="_blank" rel="noopener noreferrer" className="bg-[#00d395] text-black px-10 py-4 rounded-2xl font-bold text-lg inline-block hover:bg-[#00e6a0] transition">
              {txt('협업 문의하기 →', 'Inquire Partnership →')}
            </a>
            <p className="text-white/40 text-sm mt-4">{txt('텔레그램으로 편하게 연락주세요', 'Contact us on Telegram')}</p>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          <h3 className="text-lg font-bold mb-4 text-yellow-400">⚠️ {txt('면책조항', 'Disclaimer')}</h3>
          <div className="text-white/50 text-sm space-y-2">
            <p>• {txt('본 서비스는 교육 및 정보 제공 목적의 분석 도구이며, 투자 권유가 아닙니다.', 'This service is an educational analysis tool, not investment advice.')}</p>
            <p>• {txt('체크리스트 점수는 다양한 데이터를 종합한 참고 지표이며, 투자 결정의 유일한 근거로 사용해서는 안 됩니다.', 'Checklist scores are reference indicators combining various data and should not be the sole basis for investment decisions.')}</p>
            <p>• {txt('모든 투자의 책임은 투자자 본인에게 있습니다.', 'All investment decisions and outcomes are the responsibility of the investor.')}</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center text-white/40 text-sm">
          <p>© 2026 {txt('투자나침반', 'Investment Compass')} | {txt('교육적 시장 분석 도구', 'Educational Market Analysis Tool')}</p>
          <div className="flex justify-center gap-6 mt-4">
            <Link href="/terms" className="hover:text-white/60">{txt('이용약관', 'Terms')}</Link>
            <Link href="/privacy" className="hover:text-white/60">{txt('개인정보처리방침', 'Privacy')}</Link>
            <Link href="/refund" className="hover:text-white/60">{txt('환불정책', 'Refund')}</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

