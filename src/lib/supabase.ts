import { createClientComponentClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// 클라이언트 컴포넌트용
export const createClient = () => {
  return createClientComponentClient()
}

// 서버 컴포넌트용
export const createServerClient = () => {
  const cookieStore = cookies()
  return createServerComponentClient({ cookies: () => cookieStore })
}

// 타입 정의
export type Profile = {
  id: string
  email: string
  nickname: string
  avatar_url: string | null
  plan: 'free' | 'pro' | 'vip'
  plan_expires_at: string | null
  telegram_id: string | null
  created_at: string
  updated_at: string
}

export type Favorite = {
  id: string
  user_id: string
  coin_id: string
  coin_symbol: string
  created_at: string
}

export type SignalHistory = {
  id: string
  coin_id: string
  coin_symbol: string
  signal_type: 'long' | 'short' | 'hold'
  entry_price: number
  target_price: number
  stop_loss: number
  score: number
  created_at: string
}
