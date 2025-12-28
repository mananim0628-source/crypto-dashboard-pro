-- =============================================
-- 크립토 대시보드 PRO - Supabase 데이터베이스 스키마
-- =============================================

-- 1. 사용자 프로필 테이블
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    nickname TEXT,
    avatar_url TEXT,
    plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'vip')),
    plan_expires_at TIMESTAMP WITH TIME ZONE,
    telegram_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 즐겨찾기 코인 테이블
CREATE TABLE public.favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    coin_id TEXT NOT NULL,
    coin_symbol TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, coin_id)
);

-- 3. 시그널 히스토리 테이블
CREATE TABLE public.signal_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    coin_id TEXT NOT NULL,
    coin_symbol TEXT NOT NULL,
    signal_type TEXT NOT NULL CHECK (signal_type IN ('long', 'short', 'hold')),
    entry_price DECIMAL(20, 8),
    target_price DECIMAL(20, 8),
    stop_loss DECIMAL(20, 8),
    score INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 결제 내역 테이블
CREATE TABLE public.payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan TEXT NOT NULL,
    amount INTEGER NOT NULL,
    payment_key TEXT,
    order_id TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 알림 설정 테이블
CREATE TABLE public.notification_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    email_enabled BOOLEAN DEFAULT true,
    telegram_enabled BOOLEAN DEFAULT false,
    signal_threshold INTEGER DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- Row Level Security (RLS) 정책
-- =============================================

-- profiles 테이블 RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- favorites 테이블 RLS
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own favorites" ON public.favorites
    FOR ALL USING (auth.uid() = user_id);

-- signal_history 테이블 RLS (모두 읽기 가능)
ALTER TABLE public.signal_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view signal history" ON public.signal_history
    FOR SELECT TO authenticated USING (true);

-- payments 테이블 RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments" ON public.payments
    FOR SELECT USING (auth.uid() = user_id);

-- notification_settings 테이블 RLS
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own notification settings" ON public.notification_settings
    FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- 트리거: 새 사용자 가입 시 프로필 자동 생성
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, nickname)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'nickname', split_part(NEW.email, '@', 1))
    );
    
    INSERT INTO public.notification_settings (user_id)
    VALUES (NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- 인덱스 생성 (성능 최적화)
-- =============================================

CREATE INDEX idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX idx_signal_history_created_at ON public.signal_history(created_at DESC);
CREATE INDEX idx_signal_history_coin_id ON public.signal_history(coin_id);
CREATE INDEX idx_payments_user_id ON public.payments(user_id);
