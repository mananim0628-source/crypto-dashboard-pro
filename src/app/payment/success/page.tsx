'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function PaymentSuccess() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const confirmPayment = async () => {
      const paymentKey = searchParams.get('paymentKey')
      const orderId = searchParams.get('orderId')
      const amount = searchParams.get('amount')

      if (!paymentKey || !orderId || !amount) {
        setError('결제 정보가 올바르지 않습니다')
        setLoading(false)
        return
      }

      try {
        const response = await fetch('/api/payment/confirm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentKey,
            orderId,
            amount: Number(amount),
          }),
        })

        const data = await response.json()

        if (response.ok) {
          setSuccess(true)
        } else {
          setError(data.error || '결제 승인에 실패했습니다')
        }
      } catch (err) {
        setError('결제 처리 중 오류가 발생했습니다')
      } finally {
        setLoading(false)
      }
    }

    confirmPayment()
  }, [searchParams])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner w-12 h-12 mx-auto mb-4"></div>
          <p className="text-xl">결제 확인 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="card max-w-md w-full text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold mb-4 text-crypto-red">결제 실패</h1>
          <p className="text-white/70 mb-6">{error}</p>
          <Link href="/pricing" className="btn-primary inline-block">
            다시 시도하기
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card max-w-md w-full text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold mb-4 text-crypto-green">결제 완료!</h1>
        <p className="text-white/70 mb-2">PRO 플랜이 활성화되었습니다</p>
        <p className="text-sm text-white/50 mb-6">30일간 모든 PRO 기능을 이용하실 수 있습니다</p>
        
        <div className="bg-crypto-green/10 border border-crypto-green/30 rounded-xl p-4 mb-6">
          <p className="text-crypto-green font-semibold">✓ 무제한 코인 분석</p>
          <p className="text-crypto-green font-semibold">✓ 실시간 시그널</p>
          <p className="text-crypto-green font-semibold">✓ 7단계 체크리스트</p>
        </div>

        <Link href="/dashboard" className="btn-primary inline-block w-full">
          대시보드로 이동
        </Link>
      </div>
    </div>
  )
}
