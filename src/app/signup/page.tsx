'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

function SignUpForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [telegramId, setTelegramId] = useState('')
  const [promoCode, setPromoCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [promoApplied, setPromoApplied] = useState<{discount: number, message: string} | null>(null)
  
  // UTM 파라미터
  const [utmData, setUtmData] = useState({
    utm_source: '',
    utm_medium: '',
    utm_campaign: '',
    utm_content: '',
    utm_term: '',
    ref: ''
  })

  const router = useRouter()
  const searchParams = useSearchParams()
  const plan = searchParams.get('plan')
  
  const supabase = createClientComponentClient()

  // UTM 파라미터 추출
  useEffect(() => {
    setUtmData({
      utm_source: searchParams.get('utm_source') || '',
      utm_medium: searchParams.get('utm_medium') || '',
      utm_campaign: searchParams.get('utm_campaign') || '',
      utm_content: searchParams.get('utm_content') || '',
      utm_term: searchParams.get('utm_term') || '',
      ref: searchParams.get('ref') || ''
    })

    // URL에 프로모션 코드가 있으면 자동 입력
    const urlPromo = searchParams.get('promo') || searchParams.get('code')
    if (urlPromo) {
      setPromoCode(urlPromo)
      validatePromoCode(urlPromo)
    }
  }, [searchParams])

  // 프로모션 코드 검증
  const validatePromoCode = async (code: string) => {
    if (!code.trim()) {
      setPromoApplied(null)
      return
    }

    const promoCodes: Record<string, {discount: number, message: string}> = {
      'WELCOME': { discount: 0, message: '🎁 7일 무료 체험 적용!' },
      'TELEGRAM10': { discount: 10, message: '📱 텔레그램 유입 10% 할인!' },
      'YOUTUBE20': { discount: 20, message: '🎬 유튜브 구독자 20% 할인!' },
      'BLOG15': { discount: 15, message: '📝 블로그 독자 15% 할인!' },
      'KAKAO10': { discount: 10, message: '💬 카카오톡 유입 10% 할인!' },
      'VIP50': { discount: 50, message: '👑 VIP 특별 50% 할인!' },
      'FRIEND20': { discount: 20, message: '👫 친구 추천 20% 할인!' },
    }

    const upperCode = code.toUpperCase()
    if (promoCodes[upperCode]) {
      setPromoApplied(promoCodes[upperCode])
    } else {
      setPromoApplied(null)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // 비밀번호 확인
    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('비밀번호는 최소 6자리 이상이어야 합니다')
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nickname: nickname || email.split('@')[0],
            telegram_id: telegramId || null,
            promo_code: promoCode.toUpperCase() || null,
            utm_source: utmData.utm_source || null,
            utm_medium: utmData.utm_medium || null,
            utm_campaign: utmData.utm_campaign || null,
            utm_content: utmData.utm_content || null,
            utm_term: utmData.utm_term || null,
            referral_code: utmData.ref || null,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      setSuccess(true)
    } catch (err: any) {
      setError(err.message || '회원가입 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const handleOAuthSignUp = async (provider: 'google' | 'kakao') => {
    try {
      // UTM 데이터를 로컬 스토리지에 저장 (OAuth 후 복구용)
      localStorage.setItem('signup_utm', JSON.stringify(utmData))
      localStorage.setItem('signup_promo', promoCode)

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (err: any) {
      setError(err.message || '소셜 로그인 중 오류가 발생했습니다')
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="card max-w-md w-full text-center">
          <div className="text-6xl mb-4">📧</div>
          <h1 className="text-2xl font-bold mb-4">이메일을 확인해주세요</h1>
          <p className="text-white/70 mb-6">
            <span className="text-crypto-green">{email}</span>으로
            <br />
            인증 링크를 발송했습니다
          </p>
          {promoApplied && (
            <div className="bg-crypto-green/10 border border-crypto-green/30 rounded-xl p-3 mb-4">
              <p className="text-crypto-green text-sm">{promoApplied.message}</p>
            </div>
          )}
          <p className="text-sm text-white/50 mb-6">
            이메일의 링크를 클릭하면 가입이 완료됩니다
          </p>
          <Link href="/login" className="btn-primary inline-block">
            로그인 페이지로
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="card max-w-md w-full">
        <Link href="/" className="block text-center mb-6">
          <span className="text-3xl font-bold gradient-text">🚀 크립토 PRO</span>
        </Link>

        {/* UTM 소스 표시 */}
        {utmData.utm_source && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 mb-4 text-center">
            <p className="text-blue-400 text-sm">
              {utmData.utm_source === 'telegram' && '📱 텔레그램에서 오셨군요!'}
              {utmData.utm_source === 'youtube' && '🎬 유튜브에서 오셨군요!'}
              {utmData.utm_source === 'instagram' && '📸 인스타그램에서 오셨군요!'}
              {utmData.utm_source === 'blog' && '📝 블로그에서 오셨군요!'}
              {utmData.utm_source === 'kakao' && '💬 카카오톡에서 오셨군요!'}
              {!['telegram', 'youtube', 'instagram', 'blog', 'kakao'].includes(utmData.utm_source) && `${utmData.utm_source}에서 오셨군요!`}
            </p>
          </div>
        )}

        {plan === 'pro' && (
          <div className="bg-crypto-green/10 border border-crypto-green/30 rounded-xl p-4 mb-6 text-center">
            <span className="pro-badge">PRO</span>
            <p className="text-sm text-white/70 mt-2">
              회원가입 후 PRO 플랜을 구독할 수 있습니다
            </p>
          </div>
        )}

        <h1 className="text-2xl font-bold text-center mb-2">계정 생성</h1>
        <p className="text-white/50 text-center mb-6">시작하려면 가입하세요</p>

        {error && (
          <div className="bg-crypto-red/10 border border-crypto-red/30 rounded-xl p-4 mb-6 text-crypto-red text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSignUp} className="space-y-4">
          <div>
            <label className="block text-sm text-white/70 mb-2">성명</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="닉네임"
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm text-white/70 mb-2">이메일 *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-white/70 mb-2">비밀번호 *</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="최소 6자리"
              className="input-field"
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm text-white/70 mb-2">비밀번호 확인 *</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="비밀번호 재입력"
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-white/70 mb-2">
              텔레그램 ID <span className="text-white/30">(선택)</span>
            </label>
            <input
              type="text"
              value={telegramId}
              onChange={(e) => setTelegramId(e.target.value)}
              placeholder="@username"
              className="input-field"
            />
            <p className="text-xs text-white/30 mt-1">기존 텔레그램 구독자는 입력하시면 혜택 적용</p>
          </div>

          <div>
            <label className="block text-sm text-white/70 mb-2">
              프로모션 코드 <span className="text-white/30">(선택)</span>
            </label>
            <input
              type="text"
              value={promoCode}
              onChange={(e) => {
                setPromoCode(e.target.value)
                validatePromoCode(e.target.value)
              }}
              placeholder="할인 코드 입력"
              className="input-field"
            />
            {promoApplied && (
              <p className="text-crypto-green text-sm mt-2">{promoApplied.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="spinner w-5 h-5"></span>
                계정 생성 중...
              </span>
            ) : (
              '계정 생성'
            )}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-crypto-dark-2 text-white/50">또는</span>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => handleOAuthSignUp('google')}
            className="btn-secondary w-full flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google로 계속하기
          </button>
        </div>

        <p className="text-center text-white/50 text-sm mt-6">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="text-crypto-green hover:underline">
            로그인하세요
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function SignUp() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner w-12 h-12"></div>
      </div>
    }>
      <SignUpForm />
    </Suspense>
  )
}
