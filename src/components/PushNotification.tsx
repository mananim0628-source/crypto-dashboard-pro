// src/components/PushNotification.tsx
// 대시보드에 넣을 알림 구독 버튼 컴포넌트

'use client';

import { useState, useEffect } from 'react';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BO4DzoNkOQd3pdjz3e54-VJ_jgY9M6IgiAGEcy5TEeqljT1Kb1bq9y3QgsfjOS7_eGDBanrLdf-QEvJegmu_qTI';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushNotification() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      checkSubscription();
    }
  }, []);

  async function checkSubscription() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (err) {
      console.error('Check subscription error:', err);
    }
  }

  async function subscribe() {
    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      // Supabase에 구독 정보 저장
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription }),
      });

      if (response.ok) {
        setIsSubscribed(true);
      }
    } catch (err) {
      console.error('Subscribe error:', err);
    }
    setIsLoading(false);
  }

  async function unsubscribe() {
    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        setIsSubscribed(false);
      }
    } catch (err) {
      console.error('Unsubscribe error:', err);
    }
    setIsLoading(false);
  }

  if (!isSupported) return null;

  return (
    <button
      onClick={isSubscribed ? unsubscribe : subscribe}
      disabled={isLoading}
      style={{
        padding: '8px 16px',
        borderRadius: '8px',
        border: 'none',
        cursor: isLoading ? 'wait' : 'pointer',
        fontSize: '14px',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        background: isSubscribed
          ? 'rgba(255,255,255,0.1)'
          : 'linear-gradient(135deg, #00D395, #00B380)',
        color: '#fff',
        transition: 'all 0.2s',
      }}
    >
      {isLoading ? '⏳' : isSubscribed ? '🔔' : '🔕'}
      {isLoading
        ? '처리중...'
        : isSubscribed
        ? '알림 ON'
        : '알림 받기'}
    </button>
  );
}

