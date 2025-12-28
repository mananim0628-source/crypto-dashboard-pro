'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function PaymentFail() {
  const searchParams = useSearchParams()
  const errorCode = searchParams.get('code')
  const errorMessage = searchParams.get('message')

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card max-w-md w-full text-center">
        <div className="text-6xl mb-4">😢</div>
        <h1 className="text-2xl font-bold mb-4 text-crypto-red">결제 실패</h1>
        <p className="text-white/70 mb-2">
          {errorMessage || '결제 처리 중 문제가 발생했습니다'}
        </p>
        {errorCode && (
          <p className="text-sm text-white/50 mb-6">오류 코드: {errorCode}</p>
        )}
        
        <div className="space-y-3">
          <Link href="/pricing" className="btn-primary inline-block w-full">
            다시 시도하기
          </Link>
          <Link href="/dashboard" className="btn-secondary inline-block w-full">
            대시보드로 이동
          </Link>
        </div>
      </div>
    </div>
  )
}
