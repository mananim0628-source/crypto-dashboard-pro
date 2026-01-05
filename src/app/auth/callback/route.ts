import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/dashboard'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookieStore 
    })
    
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Auth error:', error)
      return NextResponse.redirect(new URL('/login?error=auth_failed', request.url))
    }
    
    // 세션이 확실히 저장되도록 약간의 지연
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  // 절대 경로로 리다이렉트
  const redirectUrl = new URL(next, requestUrl.origin)
  return NextResponse.redirect(redirectUrl)
}
