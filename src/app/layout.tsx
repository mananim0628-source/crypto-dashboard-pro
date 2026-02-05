import './globals.css'
import type { Metadata } from 'next'
import InstallBanner from '@/components/InstallBanner'

export const metadata: Metadata = {
  title: '크립토 대시보드 PRO - AI 기반 암호화폐 분석',
  description: '7단계 체크리스트와 AI 기반 실시간 암호화폐 분석 대시보드',
  keywords: ['암호화폐', '비트코인', '트레이딩', 'AI 분석', '체크리스트'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#00D395" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body>
        {children}
        <InstallBanner />
      </body>
    </html>
  )
}
