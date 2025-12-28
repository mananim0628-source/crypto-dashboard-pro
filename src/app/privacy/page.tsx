'use client'

import Link from 'next/link'

export default function Privacy() {
  return (
    <div className="min-h-screen bg-[#0a0a14] text-white">
      {/* 헤더 */}
      <header className="border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/" className="text-xl font-bold">🧭 투자나침반</Link>
        </div>
      </header>

      {/* 본문 */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-2">개인정보처리방침</h1>
        <p className="text-white/50 mb-8">최종 수정일: 2025년 1월 1일</p>

        <div className="space-y-8 text-white/80 leading-relaxed">
          
          {/* 개요 */}
          <section>
            <p>투자나침반(이하 "회사")는 이용자의 개인정보를 중요시하며, 「개인정보 보호법」, 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 등 관련 법령을 준수하고 있습니다. 회사는 개인정보처리방침을 통하여 이용자의 개인정보가 어떠한 용도와 방식으로 이용되고 있으며, 개인정보보호를 위해 어떠한 조치가 취해지고 있는지 알려드립니다.</p>
          </section>

          {/* 제1조 */}
          <section>
            <h2 className="text-xl font-bold mb-4">제1조 (수집하는 개인정보 항목)</h2>
            <p className="mb-3">회사는 서비스 제공을 위해 다음과 같은 개인정보를 수집합니다:</p>
            
            <div className="bg-white/5 rounded-xl p-4 space-y-4">
              <div>
                <h3 className="font-semibold text-[#00d395] mb-2">1. 회원가입 시 수집항목</h3>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li><strong>필수항목:</strong> 이메일 주소, 비밀번호, 닉네임</li>
                  <li><strong>선택항목:</strong> 텔레그램 ID</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-[#00d395] mb-2">2. 결제 시 수집항목</h3>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>결제 정보 (신용카드 정보는 결제 대행사에서 처리)</li>
                  <li>결제 내역, 구독 정보</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-[#00d395] mb-2">3. 서비스 이용 시 자동 수집항목</h3>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>IP 주소, 접속 기기 정보, 브라우저 종류</li>
                  <li>서비스 이용 기록, 접속 로그, 쿠키</li>
                  <li>유입 경로 (UTM 파라미터)</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 제2조 */}
          <section>
            <h2 className="text-xl font-bold mb-4">제2조 (개인정보의 수집 및 이용목적)</h2>
            <p className="mb-3">수집한 개인정보는 다음의 목적을 위해 이용됩니다:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>회원 관리:</strong> 회원 식별, 본인 확인, 가입 의사 확인, 불량 회원 부정 이용 방지</li>
              <li><strong>서비스 제공:</strong> 서비스 이용에 따른 본인 확인, 맞춤 서비스 제공, 콘텐츠 제공</li>
              <li><strong>결제 처리:</strong> 유료 서비스 결제 및 환불 처리</li>
              <li><strong>마케팅 및 광고:</strong> 신규 서비스 안내, 이벤트 정보 제공 (수신 동의 시)</li>
              <li><strong>서비스 개선:</strong> 서비스 이용 통계, 서비스 품질 개선</li>
              <li><strong>고객 상담:</strong> 문의사항 처리, 불만 접수 및 처리</li>
            </ul>
          </section>

          {/* 제3조 */}
          <section>
            <h2 className="text-xl font-bold mb-4">제3조 (개인정보의 보유 및 이용기간)</h2>
            <p className="mb-3">회사는 개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 단, 다음의 정보에 대해서는 아래의 이유로 명시한 기간 동안 보존합니다:</p>
            
            <div className="bg-white/5 rounded-xl p-4 space-y-3">
              <div>
                <h3 className="font-semibold text-[#00d395]">1. 회사 내부 방침에 의한 보존</h3>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li>부정 이용 방지를 위한 기록: 탈퇴 후 1년</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-[#00d395]">2. 관련 법령에 의한 보존</h3>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li>계약 또는 청약철회 등에 관한 기록: 5년 (전자상거래법)</li>
                  <li>대금결제 및 재화 등의 공급에 관한 기록: 5년 (전자상거래법)</li>
                  <li>소비자의 불만 또는 분쟁처리에 관한 기록: 3년 (전자상거래법)</li>
                  <li>웹사이트 방문기록: 3개월 (통신비밀보호법)</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 제4조 */}
          <section>
            <h2 className="text-xl font-bold mb-4">제4조 (개인정보의 제3자 제공)</h2>
            <p className="mb-3">회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만, 아래의 경우에는 예외로 합니다:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>이용자가 사전에 동의한 경우</li>
              <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
            </ul>
          </section>

          {/* 제5조 */}
          <section>
            <h2 className="text-xl font-bold mb-4">제5조 (개인정보 처리 위탁)</h2>
            <p className="mb-3">회사는 서비스 제공을 위해 다음과 같이 개인정보 처리 업무를 위탁하고 있습니다:</p>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="py-3 px-4 text-left">수탁업체</th>
                    <th className="py-3 px-4 text-left">위탁 업무</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-white/10">
                    <td className="py-3 px-4">토스페이먼츠</td>
                    <td className="py-3 px-4">결제 처리</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="py-3 px-4">Supabase</td>
                    <td className="py-3 px-4">데이터베이스 운영</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="py-3 px-4">Vercel</td>
                    <td className="py-3 px-4">웹 호스팅</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 제6조 */}
          <section>
            <h2 className="text-xl font-bold mb-4">제6조 (이용자의 권리와 행사 방법)</h2>
            <p className="mb-3">이용자는 개인정보 주체로서 다음과 같은 권리를 행사할 수 있습니다:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>열람 요구:</strong> 본인의 개인정보 처리 현황 열람</li>
              <li><strong>정정 요구:</strong> 잘못된 개인정보의 정정</li>
              <li><strong>삭제 요구:</strong> 개인정보의 삭제 (단, 법령에서 수집 대상으로 명시한 경우 제외)</li>
              <li><strong>처리정지 요구:</strong> 개인정보 처리의 정지</li>
            </ul>
            <p className="mt-3">위 권리 행사는 서비스 내 설정 또는 고객센터를 통해 요청할 수 있습니다.</p>
          </section>

          {/* 제7조 */}
          <section>
            <h2 className="text-xl font-bold mb-4">제7조 (개인정보의 파기)</h2>
            <p className="mb-3">회사는 개인정보 보유기간이 경과하거나 처리 목적이 달성된 경우, 지체 없이 해당 개인정보를 파기합니다:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>전자적 파일:</strong> 복구 및 재생이 불가능한 방법으로 영구 삭제</li>
              <li><strong>종이 문서:</strong> 분쇄기로 분쇄하거나 소각</li>
            </ul>
          </section>

          {/* 제8조 */}
          <section>
            <h2 className="text-xl font-bold mb-4">제8조 (쿠키의 사용)</h2>
            <p className="mb-3">회사는 이용자의 편의를 위해 쿠키를 사용합니다:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>쿠키란?</strong> 웹사이트가 이용자의 브라우저에 전송하는 작은 텍스트 파일</li>
              <li><strong>사용 목적:</strong> 로그인 상태 유지, 서비스 이용 편의성 제공</li>
              <li><strong>쿠키 거부:</strong> 브라우저 설정에서 쿠키를 거부할 수 있으나, 일부 서비스 이용이 제한될 수 있습니다</li>
            </ul>
          </section>

          {/* 제9조 */}
          <section>
            <h2 className="text-xl font-bold mb-4">제9조 (개인정보의 안전성 확보 조치)</h2>
            <p className="mb-3">회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>비밀번호 암호화 저장</li>
              <li>SSL/TLS를 통한 데이터 전송 암호화</li>
              <li>개인정보 접근 권한 제한</li>
              <li>정기적인 보안 점검</li>
            </ul>
          </section>

          {/* 제10조 */}
          <section>
            <h2 className="text-xl font-bold mb-4">제10조 (개인정보 보호책임자)</h2>
            <div className="bg-white/5 rounded-xl p-4">
              <p className="mb-2">회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 이용자의 불만처리 및 피해구제를 처리하기 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다:</p>
              <ul className="mt-4 space-y-1">
                <li><strong>개인정보 보호책임자</strong></li>
                <li>이메일: privacy@cryptopro.com</li>
              </ul>
            </div>
          </section>

          {/* 제11조 */}
          <section>
            <h2 className="text-xl font-bold mb-4">제11조 (권익침해 구제방법)</h2>
            <p className="mb-3">이용자는 개인정보침해로 인한 피해를 구제받기 위해 아래 기관에 분쟁해결이나 상담 등을 신청할 수 있습니다:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>개인정보분쟁조정위원회: 1833-6972 (www.kopico.go.kr)</li>
              <li>개인정보침해신고센터: 118 (privacy.kisa.or.kr)</li>
              <li>대검찰청 사이버수사과: 1301 (www.spo.go.kr)</li>
              <li>경찰청 사이버안전국: 182 (cyberbureau.police.go.kr)</li>
            </ul>
          </section>

          {/* 제12조 */}
          <section>
            <h2 className="text-xl font-bold mb-4">제12조 (개인정보처리방침 변경)</h2>
            <p>본 개인정보처리방침은 법령, 정책 또는 보안기술의 변경에 따라 내용이 추가, 삭제 및 수정될 수 있습니다. 변경사항은 시행 7일 전에 공지사항을 통해 고지합니다.</p>
          </section>

          {/* 부칙 */}
          <section>
            <h2 className="text-xl font-bold mb-4">부칙</h2>
            <p>본 개인정보처리방침은 2025년 1월 1일부터 시행됩니다.</p>
          </section>

        </div>

        {/* 하단 링크 */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-wrap gap-4 text-sm">
          <Link href="/terms" className="text-[#00d395] hover:underline">이용약관</Link>
          <Link href="/refund" className="text-[#00d395] hover:underline">환불정책</Link>
          <Link href="/" className="text-white/50 hover:text-white">← 홈으로</Link>
        </div>
      </main>
    </div>
  )
}
