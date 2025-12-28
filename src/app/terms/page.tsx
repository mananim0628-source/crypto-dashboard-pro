'use client'

import Link from 'next/link'

export default function Terms() {
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
        <h1 className="text-3xl font-bold mb-2">이용약관</h1>
        <p className="text-white/50 mb-8">최종 수정일: 2025년 1월 1일</p>

        <div className="space-y-8 text-white/80 leading-relaxed">
          
          {/* 중요 면책조항 - 눈에 띄게 */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6">
            <h2 className="text-xl font-bold text-yellow-400 mb-4">⚠️ 중요 면책조항</h2>
            <div className="space-y-3 text-yellow-200/90">
              <p><strong>1. 본 서비스는 투자 조언이 아닙니다.</strong> 크립토 PRO에서 제공하는 모든 정보, 분석, 점수, 시그널은 교육 및 참고 목적의 보조 도구일 뿐이며, 특정 자산의 매수, 매도, 보유를 권유하거나 추천하는 것이 아닙니다.</p>
              <p><strong>2. 모든 투자 결정은 사용자 본인의 책임입니다.</strong> 본 서비스의 정보를 참고하여 내린 투자 결정으로 인한 손실에 대해 크립토 PRO는 어떠한 법적 책임도 지지 않습니다.</p>
              <p><strong>3. 과거 성과는 미래 수익을 보장하지 않습니다.</strong> 암호화폐 시장은 높은 변동성을 가지며, 원금 손실의 위험이 있습니다.</p>
              <p><strong>4. 본 서비스는 금융투자업 등록 업체가 아닙니다.</strong> 크립토 PRO는 투자자문업, 투자일임업, 집합투자업 등 금융투자업에 해당하지 않는 정보 제공 서비스입니다.</p>
            </div>
          </div>

          {/* 제1조 */}
          <section>
            <h2 className="text-xl font-bold mb-4">제1조 (목적)</h2>
            <p>본 약관은 크립토 PRO(이하 "회사")가 제공하는 암호화폐 시장 분석 정보 서비스(이하 "서비스")의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.</p>
          </section>

          {/* 제2조 */}
          <section>
            <h2 className="text-xl font-bold mb-4">제2조 (용어의 정의)</h2>
            <p className="mb-3">본 약관에서 사용하는 용어의 정의는 다음과 같습니다:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>"서비스"</strong>란 회사가 제공하는 암호화폐 시장 분석 정보, 체크리스트 점수, 차트 분석 도구 등을 의미합니다.</li>
              <li><strong>"이용자"</strong>란 본 약관에 따라 회사가 제공하는 서비스를 이용하는 회원 및 비회원을 의미합니다.</li>
              <li><strong>"회원"</strong>이란 회사에 개인정보를 제공하여 회원등록을 한 자로서, 회사의 서비스를 이용하는 자를 의미합니다.</li>
              <li><strong>"보조지표"</strong>란 시장 분석을 위한 참고 자료로 제공되는 각종 점수, 시그널, 분석 정보를 의미합니다.</li>
            </ul>
          </section>

          {/* 제3조 */}
          <section>
            <h2 className="text-xl font-bold mb-4">제3조 (서비스의 성격)</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>본 서비스는 <strong>교육 및 정보 제공 목적</strong>의 보조 도구입니다.</li>
              <li>본 서비스에서 제공하는 분석, 점수, 시그널 등은 <strong>투자 조언, 추천, 권유가 아닙니다.</strong></li>
              <li>회사는 금융투자업자가 아니며, 투자자문업, 투자일임업 등의 인가를 받지 않았습니다.</li>
              <li>본 서비스의 정보는 참고 자료로만 활용되어야 하며, 최종 투자 결정은 이용자 본인이 내려야 합니다.</li>
            </ul>
          </section>

          {/* 제4조 */}
          <section>
            <h2 className="text-xl font-bold mb-4">제4조 (이용계약의 성립)</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>이용계약은 이용자가 본 약관의 내용에 동의하고 회원가입을 신청한 후, 회사가 이를 승낙함으로써 성립됩니다.</li>
              <li>회사는 다음 각 호에 해당하는 신청에 대해서는 승낙을 거부하거나 취소할 수 있습니다:
                <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                  <li>타인의 명의를 도용한 경우</li>
                  <li>허위 정보를 기재한 경우</li>
                  <li>만 19세 미만인 경우</li>
                  <li>기타 회사가 정한 이용신청 요건을 충족하지 못한 경우</li>
                </ul>
              </li>
            </ul>
          </section>

          {/* 제5조 */}
          <section>
            <h2 className="text-xl font-bold mb-4">제5조 (서비스 이용요금)</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>서비스는 무료 서비스와 유료 서비스로 구분됩니다.</li>
              <li>유료 서비스의 이용요금 및 결제방법은 해당 서비스 페이지에 명시된 바에 따릅니다.</li>
              <li>유료 서비스 결제 시 이용자는 본 약관 및 환불정책에 동의한 것으로 간주됩니다.</li>
              <li>이용요금은 회사의 정책에 따라 변경될 수 있으며, 변경 시 사전 공지합니다.</li>
            </ul>
          </section>

          {/* 제6조 */}
          <section>
            <h2 className="text-xl font-bold mb-4">제6조 (회사의 의무)</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>회사는 안정적인 서비스 제공을 위해 최선을 다합니다.</li>
              <li>회사는 이용자의 개인정보를 보호하며, 개인정보처리방침에 따라 관리합니다.</li>
              <li>회사는 서비스 이용과 관련된 이용자의 불만이나 피해구제 요청을 적절하게 처리합니다.</li>
            </ul>
          </section>

          {/* 제7조 */}
          <section>
            <h2 className="text-xl font-bold mb-4">제7조 (이용자의 의무)</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>이용자는 본 약관 및 관계 법령을 준수해야 합니다.</li>
              <li>이용자는 다음 행위를 해서는 안 됩니다:
                <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                  <li>타인의 정보 도용</li>
                  <li>회사가 제공하는 정보의 무단 복제, 배포, 상업적 이용</li>
                  <li>회사의 서비스 운영을 방해하는 행위</li>
                  <li>기타 불법적이거나 부당한 행위</li>
                </ul>
              </li>
              <li>이용자는 본 서비스의 정보를 참고하여 투자 결정을 내릴 경우, 그에 따른 모든 책임을 본인이 부담합니다.</li>
            </ul>
          </section>

          {/* 제8조 */}
          <section>
            <h2 className="text-xl font-bold mb-4">제8조 (면책조항)</h2>
            <div className="bg-white/5 rounded-xl p-4 space-y-3">
              <p>1. 회사는 천재지변, 전쟁, 기간통신사업자의 서비스 중단 등 불가항력으로 인해 서비스를 제공할 수 없는 경우 책임이 면제됩니다.</p>
              <p>2. 회사는 이용자의 귀책사유로 인한 서비스 이용 장애에 대해 책임을 지지 않습니다.</p>
              <p>3. <strong>회사는 본 서비스에서 제공하는 정보, 분석, 시그널 등을 참고하여 이용자가 내린 투자 결정 및 그로 인한 손실에 대해 어떠한 책임도 지지 않습니다.</strong></p>
              <p>4. 회사는 이용자 간 또는 이용자와 제3자 간의 분쟁에 대해 개입하거나 책임을 지지 않습니다.</p>
              <p>5. 회사가 제공하는 정보의 정확성, 완전성, 적시성을 보장하지 않으며, 정보의 오류로 인한 손해에 대해 책임을 지지 않습니다.</p>
            </div>
          </section>

          {/* 제9조 */}
          <section>
            <h2 className="text-xl font-bold mb-4">제9조 (서비스의 변경 및 중단)</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>회사는 서비스의 내용, 품질, 기술적 사양 등을 변경할 수 있습니다.</li>
              <li>회사는 운영상, 기술상의 필요에 따라 서비스의 전부 또는 일부를 일시적으로 중단할 수 있습니다.</li>
              <li>서비스 중단 시 회사는 사전에 공지하며, 불가피한 경우 사후 공지할 수 있습니다.</li>
            </ul>
          </section>

          {/* 제10조 */}
          <section>
            <h2 className="text-xl font-bold mb-4">제10조 (저작권)</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>본 서비스에서 제공하는 모든 콘텐츠(분석 정보, 차트, 점수 체계, 디자인 등)에 대한 저작권은 회사에 귀속됩니다.</li>
              <li>이용자는 회사의 사전 동의 없이 서비스 내용을 복제, 배포, 출판, 방송하거나 상업적으로 이용할 수 없습니다.</li>
            </ul>
          </section>

          {/* 제11조 */}
          <section>
            <h2 className="text-xl font-bold mb-4">제11조 (분쟁해결)</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>본 약관에 명시되지 않은 사항은 관계 법령 및 상관례에 따릅니다.</li>
              <li>서비스 이용과 관련하여 분쟁이 발생한 경우, 회사와 이용자는 상호 협의하여 해결하도록 노력합니다.</li>
              <li>협의가 이루어지지 않을 경우, 관할 법원은 회사 소재지 관할 법원으로 합니다.</li>
            </ul>
          </section>

          {/* 부칙 */}
          <section>
            <h2 className="text-xl font-bold mb-4">부칙</h2>
            <p>본 약관은 2025년 1월 1일부터 시행됩니다.</p>
          </section>

        </div>

        {/* 하단 링크 */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-wrap gap-4 text-sm">
          <Link href="/privacy" className="text-[#00d395] hover:underline">개인정보처리방침</Link>
          <Link href="/refund" className="text-[#00d395] hover:underline">환불정책</Link>
          <Link href="/" className="text-white/50 hover:text-white">← 홈으로</Link>
        </div>
      </main>
    </div>
  )
}
