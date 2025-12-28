'use client'

import Link from 'next/link'

export default function Refund() {
  return (
    <div className="min-h-screen bg-[#0a0a14] text-white">
      {/* 헤더 */}
      <header className="border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/" className="text-xl font-bold">🚀 크립토 PRO</Link>
        </div>
      </header>

      {/* 본문 */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-2">환불정책</h1>
        <p className="text-white/50 mb-8">최종 수정일: 2025년 1월 1일</p>

        <div className="space-y-8 text-white/80 leading-relaxed">
          
          {/* 핵심 안내 */}
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
            <h2 className="text-xl font-bold text-red-400 mb-4">⚠️ 환불 불가 안내</h2>
            <div className="space-y-3">
              <p>크립토 PRO는 <strong>결제 즉시 모든 콘텐츠가 제공되는 디지털 교육 서비스</strong>입니다.</p>
              <p>「전자상거래 등에서의 소비자보호에 관한 법률」 제17조 제2항에 따라, 결제 완료 즉시 콘텐츠가 제공되는 디지털 상품은 <strong>청약철회(환불)가 제한</strong>됩니다.</p>
              <p className="text-red-300 font-semibold">결제 완료 시점부터 환불이 불가능하오니, 결제 전 충분히 검토해 주시기 바랍니다.</p>
            </div>
          </div>

          {/* 요약 박스 */}
          <div className="bg-white/5 border border-white/20 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">📋 환불정책 요약</h2>
            <div className="space-y-2">
              <p>❌ <strong>결제 완료 후:</strong> 환불 불가 (콘텐츠 즉시 제공)</p>
              <p>✅ <strong>서비스 장애 시:</strong> 이용 기간 연장으로 보상</p>
              <p>✅ <strong>구독 해지:</strong> 다음 결제 전 해지 시 추가 결제 없음</p>
            </div>
          </div>

          {/* 제1조 */}
          <section>
            <h2 className="text-xl font-bold mb-4">제1조 (서비스의 성격)</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>크립토 PRO는 암호화폐 시장 분석 정보를 제공하는 <strong>온라인 디지털 콘텐츠(교육 서비스)</strong>입니다.</li>
              <li>본 서비스는 <strong>결제 완료 즉시</strong> 모든 유료 콘텐츠(7단계 분석, 진입가/목표가/손절가, AI 코멘트, 무제한 검색 등)에 접근할 수 있습니다.</li>
              <li>디지털 콘텐츠의 특성상, 결제와 동시에 서비스 이용이 시작되며 "미이용" 상태가 존재하지 않습니다.</li>
            </ul>
          </section>

          {/* 제2조 */}
          <section>
            <h2 className="text-xl font-bold mb-4">제2조 (환불 불가 사유)</h2>
            <div className="bg-white/5 rounded-xl p-4">
              <p className="mb-4">다음의 사유로 결제 후 환불이 불가능합니다:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>결제 완료 즉시 모든 유료 콘텐츠 열람 권한이 부여됨</li>
                <li>디지털 콘텐츠는 제공 후 회수가 불가능함</li>
                <li>실시간으로 업데이트되는 시장 분석 정보의 특성상, 이미 제공된 정보의 가치를 되돌릴 수 없음</li>
              </ul>
            </div>
          </section>

          {/* 제3조 */}
          <section>
            <h2 className="text-xl font-bold mb-4">제3조 (예외적 환불 사유)</h2>
            <p className="mb-3">다음의 경우에 한해 예외적으로 환불이 가능합니다:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>결제 오류:</strong> 시스템 오류로 중복 결제된 경우 (중복 결제분 환불)</li>
              <li><strong>서비스 미제공:</strong> 결제 후 회사의 귀책사유로 서비스가 전혀 제공되지 않은 경우</li>
              <li><strong>광고와 상이:</strong> 서비스 내용이 표시·광고 내용과 현저히 다른 경우</li>
            </ul>
            <p className="mt-4 text-sm text-white/60">
              ※ 위 사유에 해당하는 경우, 증빙자료와 함께 고객센터로 문의해 주시기 바랍니다.
            </p>
          </section>

          {/* 제4조 */}
          <section>
            <h2 className="text-xl font-bold mb-4">제4조 (구독 해지)</h2>
            <div className="bg-[#00d395]/10 border border-[#00d395]/30 rounded-xl p-4">
              <ul className="space-y-3">
                <li>✅ 정기 결제(구독)는 언제든지 해지할 수 있습니다.</li>
                <li>✅ 다음 결제일 이전에 해지하면 추가 결제가 진행되지 않습니다.</li>
                <li>✅ 해지 후에도 현재 결제 기간이 만료될 때까지 서비스를 이용할 수 있습니다.</li>
                <li>⚠️ 이미 결제된 기간에 대해서는 환불 또는 일할 계산이 되지 않습니다.</li>
              </ul>
            </div>
          </section>

          {/* 제5조 */}
          <section>
            <h2 className="text-xl font-bold mb-4">제5조 (서비스 장애 보상)</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>회사의 귀책사유로 <strong>24시간 이상</strong> 서비스 이용이 불가능한 경우, 장애 기간만큼 이용 기간을 연장해 드립니다.</li>
              <li>서비스 장애 보상은 <strong>환불이 아닌 이용 기간 연장</strong>으로 처리됩니다.</li>
              <li>천재지변, 외부 공격 등 불가항력적 사유로 인한 장애는 보상 대상에서 제외될 수 있습니다.</li>
            </ul>
          </section>

          {/* 제6조 */}
          <section>
            <h2 className="text-xl font-bold mb-4">제6조 (문의 방법)</h2>
            <div className="bg-white/5 rounded-xl p-4">
              <p className="mb-3">환불 관련 문의:</p>
              <ul className="space-y-2">
                <li><strong>이메일:</strong> <a href="mailto:support@cryptopro.com" className="text-[#00d395] hover:underline">support@cryptopro.com</a></li>
                <li><strong>응답 시간:</strong> 영업일 기준 24시간 이내</li>
              </ul>
              <p className="mt-4 text-sm text-white/60">
                문의 시 가입 이메일, 결제일시, 문의 내용을 함께 보내주시면 빠른 처리가 가능합니다.
              </p>
            </div>
          </section>

          {/* 제7조 */}
          <section>
            <h2 className="text-xl font-bold mb-4">제7조 (법적 근거)</h2>
            <div className="bg-white/5 rounded-xl p-4 text-sm">
              <p className="mb-3">본 환불정책은 다음 법령에 근거합니다:</p>
              <div className="text-white/60 leading-relaxed space-y-3">
                <p>
                  <strong>「전자상거래 등에서의 소비자보호에 관한 법률」 제17조 제2항 제5호</strong><br/>
                  "복제가 가능한 재화등의 포장을 훼손한 경우" 청약철회 제한
                </p>
                <p>
                  <strong>「전자상거래 등에서의 소비자보호에 관한 법률 시행령」 제21조</strong><br/>
                  "디지털콘텐츠의 제공이 개시된 경우" 청약철회 제한 (단, 사전 고지 및 동의 필요)
                </p>
              </div>
            </div>
          </section>

          {/* 제8조 */}
          <section>
            <h2 className="text-xl font-bold mb-4">제8조 (분쟁 해결)</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>서비스 이용과 관련하여 분쟁이 발생한 경우, 회사와 이용자는 상호 협의하여 해결합니다.</li>
              <li>협의가 이루어지지 않는 경우, 한국소비자원(www.kca.go.kr, ☎1372)에 피해구제를 신청할 수 있습니다.</li>
            </ul>
          </section>

          {/* 부칙 */}
          <section>
            <h2 className="text-xl font-bold mb-4">부칙</h2>
            <p>본 환불정책은 2025년 1월 1일부터 시행됩니다.</p>
          </section>

          {/* 결제 전 동의 */}
          <section>
            <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl p-6">
              <h2 className="text-lg font-bold text-yellow-400 mb-3">💡 결제 전 필수 확인사항</h2>
              <p className="text-sm text-white/70 mb-4">
                결제 버튼 클릭 시 다음 사항에 동의한 것으로 간주됩니다:
              </p>
              <ul className="text-sm space-y-2 text-white/80">
                <li>☑️ 본 서비스는 결제 즉시 콘텐츠가 제공되는 디지털 교육 상품입니다.</li>
                <li>☑️ 결제 완료 후에는 환불이 불가능함을 이해하고 동의합니다.</li>
                <li>☑️ 이용약관, 개인정보처리방침, 환불정책을 읽고 동의합니다.</li>
              </ul>
            </div>
          </section>

        </div>

        {/* 하단 링크 */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-wrap gap-4 text-sm">
          <Link href="/terms" className="text-[#00d395] hover:underline">이용약관</Link>
          <Link href="/privacy" className="text-[#00d395] hover:underline">개인정보처리방침</Link>
          <Link href="/" className="text-white/50 hover:text-white">← 홈으로</Link>
        </div>
      </main>
    </div>
  )
}
