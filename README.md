# 🚀 크립토 대시보드 PRO

AI 기반 실시간 암호화폐 분석 대시보드

## 기능

### 무료
- 핵심 코인 4개 (BTC, ETH, XRP, BNB)
- 기본 체크리스트 점수
- 시장 상태 요약

### PRO (₩49,000/월)
- 상승 코인 TOP 6 실시간
- 진입가/목표가/손절가 제공
- 7단계 체크리스트 상세 분석
- 무제한 코인 검색

### VIP (₩149,000/월)
- PRO 기능 전체 포함
- 텔레그램 실시간 알림
- 1:1 줌 상담 (월 1회)
- VIP 전용 채팅방

## 기술 스택

- **Frontend**: Next.js 14, React 18, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **API**: CoinGecko Pro API
- **Hosting**: Vercel

## 설치 방법

### 1. 저장소 클론

```bash
git clone https://github.com/YOUR_USERNAME/crypto-dashboard-pro.git
cd crypto-dashboard-pro
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 환경변수 설정

`.env.local` 파일 생성:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
COINGECKO_API_KEY=your_coingecko_api_key_here
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. Supabase 데이터베이스 설정

Supabase 대시보드에서 SQL Editor로 이동 후 `database/schema.sql` 내용 실행

### 5. 개발 서버 실행

```bash
npm run dev
```

http://localhost:3000 에서 확인

## Vercel 배포

### 1. GitHub에 푸시

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 2. Vercel에서 Import

1. [vercel.com](https://vercel.com) 접속
2. "Add New Project" 클릭
3. GitHub 저장소 연결
4. Environment Variables 설정:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `COINGECKO_API_KEY`
   - `NEXT_PUBLIC_SITE_URL` (Vercel 도메인)

### 3. Supabase Auth 설정

Supabase 대시보드 > Authentication > URL Configuration:
- Site URL: `https://your-app.vercel.app`
- Redirect URLs: `https://your-app.vercel.app/auth/callback`

## 폴더 구조

```
crypto-dashboard-pro/
├── database/
│   └── schema.sql          # 데이터베이스 스키마
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── crypto/
│   │   │       └── route.ts    # API 엔드포인트
│   │   ├── auth/
│   │   │   └── callback/
│   │   │       └── route.ts    # OAuth 콜백
│   │   ├── dashboard/
│   │   │   └── page.tsx        # 대시보드
│   │   ├── login/
│   │   │   └── page.tsx        # 로그인
│   │   ├── signup/
│   │   │   └── page.tsx        # 회원가입
│   │   ├── pricing/
│   │   │   └── page.tsx        # 요금제
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx            # 랜딩페이지
│   ├── lib/
│   │   └── supabase.ts         # Supabase 설정
│   └── middleware.ts           # 인증 미들웨어
├── .env.example
├── .gitignore
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── tsconfig.json
```

## 라이센스

Private - All rights reserved
