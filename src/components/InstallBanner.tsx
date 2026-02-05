// src/components/InstallBanner.tsx
// 모바일에서 "앱으로 설치하세요" 배너를 보여주는 컴포넌트

'use client';

import { useState, useEffect } from 'react';

export default function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // 이미 설치된 앱이면 안 보여줌
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    // 이미 닫았으면 24시간 동안 안 보여줌
    const dismissed = localStorage.getItem('pwa-banner-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      if (Date.now() - dismissedTime < 24 * 60 * 60 * 1000) return;
    }

    // iOS 감지 (Safari)
    const isApple = /iPhone|iPad|iPod/.test(navigator.userAgent);
    setIsIOS(isApple);

    if (isApple) {
      // iOS는 beforeinstallprompt 이벤트가 없음 → 수동 안내
      const isInStandalone = ('standalone' in window.navigator) && (window.navigator as any).standalone;
      if (!isInStandalone) {
        setShowBanner(true);
      }
    }

    // Android / Chrome
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  async function handleInstall() {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  }

  function handleDismiss() {
    setShowBanner(false);
    setShowIOSGuide(false);
    localStorage.setItem('pwa-banner-dismissed', Date.now().toString());
  }

  if (!showBanner) return null;

  return (
    <>
      {/* iOS 설치 가이드 모달 */}
      {showIOSGuide && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', zIndex: 10001,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px',
        }}>
          <div style={{
            background: '#1a1a2e', borderRadius: '16px', padding: '24px',
            maxWidth: '340px', width: '100%', textAlign: 'center',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📲</div>
            <h3 style={{ color: '#fff', fontSize: '18px', margin: '0 0 16px' }}>
              iPhone 앱 설치 방법
            </h3>
            <div style={{
              background: 'rgba(255,255,255,0.05)', borderRadius: '12px',
              padding: '16px', textAlign: 'left', marginBottom: '16px',
            }}>
              <p style={{ color: '#ccc', fontSize: '15px', margin: '0 0 12px', lineHeight: '1.6' }}>
                <span style={{ color: '#00D395', fontWeight: 700 }}>①</span> 하단 Safari 메뉴에서
                <br />&nbsp;&nbsp;&nbsp;
                <span style={{ fontSize: '20px' }}>⬆️</span> <strong style={{ color: '#fff' }}>공유 버튼</strong> 터치
              </p>
              <p style={{ color: '#ccc', fontSize: '15px', margin: '0 0 12px', lineHeight: '1.6' }}>
                <span style={{ color: '#00D395', fontWeight: 700 }}>②</span> 아래로 스크롤해서
                <br />&nbsp;&nbsp;&nbsp;
                <strong style={{ color: '#fff' }}>"홈 화면에 추가"</strong> 터치
              </p>
              <p style={{ color: '#ccc', fontSize: '15px', margin: '0', lineHeight: '1.6' }}>
                <span style={{ color: '#00D395', fontWeight: 700 }}>③</span> 우측 상단 <strong style={{ color: '#fff' }}>"추가"</strong> 터치
              </p>
            </div>
            <button
              onClick={handleDismiss}
              style={{
                width: '100%', padding: '12px', borderRadius: '10px',
                border: 'none', background: '#00D395', color: '#000',
                fontSize: '15px', fontWeight: 700, cursor: 'pointer',
              }}
            >
              확인했어요
            </button>
          </div>
        </div>
      )}

      {/* 하단 설치 배너 */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 10000,
        background: 'linear-gradient(135deg, #0d1117, #1a1a2e)',
        borderTop: '1px solid rgba(0,211,149,0.3)',
        padding: '12px 16px',
        display: 'flex', alignItems: 'center', gap: '12px',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.5)',
      }}>
        {/* 앱 아이콘 */}
        <div style={{
          width: '44px', height: '44px', borderRadius: '10px',
          background: 'linear-gradient(135deg, #00D395, #00B380)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, fontSize: '22px',
        }}>
          🧭
        </div>

        {/* 텍스트 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: '#fff', fontSize: '14px', fontWeight: 700 }}>
            투자나침반 앱 설치
          </div>
          <div style={{ color: '#999', fontSize: '12px', marginTop: '2px' }}>
            홈 화면에서 바로 접속 + 알림 받기
          </div>
        </div>

        {/* 설치 버튼 */}
        <button
          onClick={handleInstall}
          style={{
            padding: '8px 16px', borderRadius: '8px', border: 'none',
            background: '#00D395', color: '#000', fontSize: '13px',
            fontWeight: 700, cursor: 'pointer', flexShrink: 0,
            whiteSpace: 'nowrap',
          }}
        >
          설치
        </button>

        {/* 닫기 */}
        <button
          onClick={handleDismiss}
          style={{
            background: 'none', border: 'none', color: '#666',
            fontSize: '18px', cursor: 'pointer', padding: '4px',
            flexShrink: 0,
          }}
        >
          ✕
        </button>
      </div>
    </>
  );
}

