'use client'

import { useState, useEffect } from 'react'

export default function InstallBanner() {
  const [showBanner, setShowBanner] = useState(false)
  const [showIOSGuide, setShowIOSGuide] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('desktop')
  const [isInAppBrowser, setIsInAppBrowser] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    // PWA 이미 설치 여부 확인
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }
    // @ts-ignore
    if (window.navigator?.standalone === true) {
      setIsInstalled(true)
      return
    }

    const ua = navigator.userAgent || ''

    // 플랫폼 감지
    const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    const isAndroid = /Android/.test(ua)

    // 인앱 브라우저 감지 (카카오톡, 라인, 인스타그램, 페이스북 등)
    const inApp = /KAKAOTALK|NAVER|Whale|Line|Instagram|FBAN|FBAV|Twitter|wv|WebView/i.test(ua)

    if (isIOS) {
      setPlatform('ios')
      setIsInAppBrowser(inApp || !(/Safari/.test(ua) && !/CriOS|FxiOS|OPiOS|EdgiOS|Whale/.test(ua)))
      // iOS: Safari에서만 홈화면 추가 가능하므로 항상 배너 표시
      // 단, 이미 dismiss 했으면 24시간 후 다시 표시
      const dismissed = localStorage.getItem('install_dismissed')
      if (dismissed) {
        const dismissedAt = parseInt(dismissed)
        if (Date.now() - dismissedAt < 24 * 60 * 60 * 1000) return
      }
      setShowBanner(true)
    } else if (isAndroid) {
      setPlatform('android')
      setIsInAppBrowser(inApp)
      if (inApp) {
        setShowBanner(true)
      }
      // Android: beforeinstallprompt 이벤트 대기
      const handler = (e: Event) => {
        e.preventDefault()
        setDeferredPrompt(e)
        const dismissed = localStorage.getItem('install_dismissed')
        if (dismissed) {
          const dismissedAt = parseInt(dismissed)
          if (Date.now() - dismissedAt < 24 * 60 * 60 * 1000) return
        }
        setShowBanner(true)
      }
      window.addEventListener('beforeinstallprompt', handler)
      return () => window.removeEventListener('beforeinstallprompt', handler)
    }
    // 데스크톱은 배너 안 보임
  }, [])

  const handleAndroidInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShowBanner(false)
    }
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShowBanner(false)
    setShowIOSGuide(false)
    localStorage.setItem('install_dismissed', Date.now().toString())
  }

  const copyURL = () => {
    navigator.clipboard?.writeText('https://navcp.vercel.app')
    alert('URL이 복사되었습니다!\nSafari를 열고 주소창에 붙여넣기 해주세요.')
  }

  if (isInstalled || !showBanner) return null

  // ─────────────────────────────────────────
  // 인앱 브라우저 경고 (iOS & Android 공통)
  // ─────────────────────────────────────────
  if (isInAppBrowser) {
    return (
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
        background: 'linear-gradient(135deg, #1a1a2e 0%, #0d1117 100%)',
        borderTop: '2px solid #ff6b6b',
        padding: '16px', paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <span style={{ fontSize: '28px', flexShrink: 0 }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <p style={{ color: '#ff6b6b', fontWeight: 700, fontSize: '15px', margin: 0 }}>
              {platform === 'ios' ? 'Safari에서 열어주세요!' : 'Chrome에서 열어주세요!'}
            </p>
            <p style={{ color: '#ffffff99', fontSize: '13px', margin: '6px 0 0 0', lineHeight: '1.5' }}>
              지금 앱 내 브라우저에서 보고 있어요.<br/>
              앱 설치 & 알림 기능을 사용하려면<br/>
              <strong style={{ color: '#00d395' }}>
                {platform === 'ios' ? 'Safari' : 'Chrome'}
              </strong>에서 직접 열어야 해요.
            </p>
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button onClick={copyURL} style={{
                flex: 1, padding: '10px', borderRadius: '8px',
                background: '#00d395', color: '#000', fontWeight: 700,
                fontSize: '14px', border: 'none', cursor: 'pointer'
              }}>
                📋 URL 복사하기
              </button>
              <button onClick={handleDismiss} style={{
                padding: '10px 16px', borderRadius: '8px',
                background: 'rgba(255,255,255,0.1)', color: '#fff9',
                fontSize: '13px', border: 'none', cursor: 'pointer'
              }}>
                닫기
              </button>
            </div>
            <p style={{ color: '#ffffff55', fontSize: '11px', margin: '8px 0 0 0', lineHeight: '1.4' }}>
              URL 복사 → {platform === 'ios' ? 'Safari' : 'Chrome'} 열기 → 주소창에 붙여넣기
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────
  // iOS Safari: 단계별 가이드
  // ─────────────────────────────────────────
  if (platform === 'ios') {
    // 풀 가이드 모달
    if (showIOSGuide) {
      const steps = [
        {
          icon: '1️⃣',
          title: '하단 공유 버튼 탭',
          desc: '화면 하단 중앙의 공유 버튼(□↑)을 눌러주세요',
          visual: (
            <div style={{
              width: '60px', height: '60px', borderRadius: '16px',
              background: 'rgba(0,211,149,0.15)', border: '2px solid #00d395',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '12px auto', fontSize: '28px'
            }}>
              <span style={{ transform: 'rotate(0deg)' }}>⬆️</span>
            </div>
          )
        },
        {
          icon: '2️⃣',
          title: '"홈 화면에 추가" 선택',
          desc: '메뉴를 아래로 스크롤하면 "홈 화면에 추가" 항목이 있어요',
          visual: (
            <div style={{
              background: 'rgba(255,255,255,0.08)', borderRadius: '12px',
              padding: '12px 16px', margin: '12px auto', maxWidth: '240px',
              display: 'flex', alignItems: 'center', gap: '12px',
              border: '1px solid rgba(0,211,149,0.3)'
            }}>
              <span style={{ fontSize: '22px' }}>➕</span>
              <span style={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>
                홈 화면에 추가
              </span>
            </div>
          )
        },
        {
          icon: '3️⃣',
          title: '"추가" 버튼 탭',
          desc: '우측 상단 "추가"를 눌러주세요. 홈화면에 앱이 설치돼요!',
          visual: (
            <div style={{
              display: 'flex', justifyContent: 'flex-end',
              margin: '12px auto', maxWidth: '240px'
            }}>
              <div style={{
                background: '#00d395', color: '#000', fontWeight: 700,
                padding: '8px 24px', borderRadius: '8px', fontSize: '14px'
              }}>
                추가
              </div>
            </div>
          )
        },
        {
          icon: '4️⃣',
          title: '홈화면에서 앱 열기',
          desc: '홈화면의 투자나침반 아이콘을 탭하면 앱처럼 실행! 푸시 알림도 받을 수 있어요.',
          visual: (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              margin: '12px auto', gap: '6px'
            }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '14px',
                background: 'linear-gradient(135deg, #00d395, #00b383)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '28px', boxShadow: '0 4px 12px rgba(0,211,149,0.3)'
              }}>
                🧭
              </div>
              <span style={{ color: '#fff', fontSize: '11px' }}>투자나침반</span>
            </div>
          )
        }
      ]

      return (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px',
        }}>
          <div style={{
            background: 'linear-gradient(160deg, #1e2a3a 0%, #0d1117 100%)',
            borderRadius: '20px', width: '100%', maxWidth: '360px',
            maxHeight: '85vh', overflowY: 'auto',
            border: '1px solid rgba(0,211,149,0.2)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          }}>
            {/* 헤더 */}
            <div style={{
              padding: '24px 20px 16px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '40px', marginBottom: '8px' }}>🧭</div>
              <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: 700, margin: 0 }}>
                투자나침반 앱 설치 방법
              </h2>
              <p style={{ color: '#ffffff66', fontSize: '13px', marginTop: '6px' }}>
                iPhone에서 4단계만 따라하면 끝!
              </p>
            </div>

            {/* 단계별 가이드 */}
            <div style={{ padding: '16px 20px' }}>
              {steps.map((step, i) => (
                <div key={i} style={{
                  padding: '16px',
                  marginBottom: i < steps.length - 1 ? '12px' : '0',
                  background: currentStep === i ? 'rgba(0,211,149,0.08)' : 'rgba(255,255,255,0.03)',
                  borderRadius: '12px',
                  border: currentStep === i ? '1px solid rgba(0,211,149,0.3)' : '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }} onClick={() => setCurrentStep(i)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '20px' }}>{step.icon}</span>
                    <span style={{ color: '#fff', fontSize: '15px', fontWeight: 600 }}>
                      {step.title}
                    </span>
                  </div>
                  {currentStep === i && (
                    <>
                      <p style={{
                        color: '#ffffffaa', fontSize: '13px',
                        margin: '8px 0 0 30px', lineHeight: '1.5'
                      }}>
                        {step.desc}
                      </p>
                      {step.visual}
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* 하단 버튼 */}
            <div style={{
              padding: '16px 20px 24px',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', gap: '8px'
            }}>
              {currentStep < steps.length - 1 ? (
                <button onClick={() => setCurrentStep(prev => prev + 1)} style={{
                  flex: 1, padding: '12px', borderRadius: '10px',
                  background: '#00d395', color: '#000', fontWeight: 700,
                  fontSize: '15px', border: 'none', cursor: 'pointer'
                }}>
                  다음 단계 →
                </button>
              ) : (
                <button onClick={handleDismiss} style={{
                  flex: 1, padding: '12px', borderRadius: '10px',
                  background: '#00d395', color: '#000', fontWeight: 700,
                  fontSize: '15px', border: 'none', cursor: 'pointer'
                }}>
                  ✅ 이해했어요!
                </button>
              )}
              <button onClick={handleDismiss} style={{
                padding: '12px 16px', borderRadius: '10px',
                background: 'rgba(255,255,255,0.08)', color: '#fff9',
                fontSize: '13px', border: 'none', cursor: 'pointer'
              }}>
                닫기
              </button>
            </div>
          </div>
        </div>
      )
    }

    // iOS 미니 배너 (하단)
    return (
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
        background: 'linear-gradient(135deg, #1a1a2e 0%, #0d1117 100%)',
        borderTop: '2px solid #00d395',
        padding: '14px 16px', paddingBottom: 'max(14px, env(safe-area-inset-bottom))',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #00d395, #00b383)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '24px', flexShrink: 0
          }}>
            🧭
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: '#fff', fontWeight: 700, fontSize: '14px', margin: 0 }}>
              투자나침반 앱 설치
            </p>
            <p style={{ color: '#ffffff77', fontSize: '12px', margin: '2px 0 0 0' }}>
              홈화면에 추가하면 푸시 알림까지!
            </p>
          </div>
          <button onClick={() => { setShowIOSGuide(true); setCurrentStep(0) }} style={{
            padding: '8px 16px', borderRadius: '8px',
            background: '#00d395', color: '#000', fontWeight: 700,
            fontSize: '13px', border: 'none', cursor: 'pointer',
            whiteSpace: 'nowrap', flexShrink: 0
          }}>
            설치 방법
          </button>
          <button onClick={handleDismiss} style={{
            padding: '8px', background: 'none', border: 'none',
            color: '#fff5', fontSize: '18px', cursor: 'pointer', flexShrink: 0
          }}>
            ✕
          </button>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────
  // Android: 기존 자동 설치 배너
  // ─────────────────────────────────────────
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
      background: 'linear-gradient(135deg, #1a1a2e 0%, #0d1117 100%)',
      borderTop: '2px solid #00d395',
      padding: '14px 16px', paddingBottom: 'max(14px, env(safe-area-inset-bottom))',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '44px', height: '44px', borderRadius: '12px',
          background: 'linear-gradient(135deg, #00d395, #00b383)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '24px', flexShrink: 0
        }}>
          🧭
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: '#fff', fontWeight: 700, fontSize: '14px', margin: 0 }}>
            투자나침반 앱 설치
          </p>
          <p style={{ color: '#ffffff77', fontSize: '12px', margin: '2px 0 0 0' }}>
            홈화면에서 바로 접속 + 푸시 알림
          </p>
        </div>
        <button onClick={handleAndroidInstall} style={{
          padding: '8px 16px', borderRadius: '8px',
          background: '#00d395', color: '#000', fontWeight: 700,
          fontSize: '13px', border: 'none', cursor: 'pointer',
          whiteSpace: 'nowrap', flexShrink: 0
        }}>
          설치하기
        </button>
        <button onClick={handleDismiss} style={{
          padding: '8px', background: 'none', border: 'none',
          color: '#fff5', fontSize: '18px', cursor: 'pointer', flexShrink: 0
        }}>
          ✕
        </button>
      </div>
    </div>
  )
}
