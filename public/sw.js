// 투자나침반 Service Worker
// 파일 위치: public/sw.js

const CACHE_NAME = 'navcp-v1';
const OFFLINE_URL = '/offline.html';

// 캐시할 핵심 파일들
const PRECACHE_URLS = [
  '/',
  '/dashboard',
  '/offline.html',
];

// ===== 설치 =====
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
  self.skipWaiting();
});

// ===== 활성화 =====
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// ===== 네트워크 요청 처리 =====
self.addEventListener('fetch', (event) => {
  // API 요청은 네트워크 우선
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(JSON.stringify({ error: 'offline' }), {
          headers: { 'Content-Type': 'application/json' },
        });
      })
    );
    return;
  }

  // 나머지는 네트워크 먼저, 실패시 캐시
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 성공하면 캐시에 저장
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cached) => {
          return cached || caches.match(OFFLINE_URL);
        });
      })
  );
});

// ===== 푸시 알림 수신 =====
self.addEventListener('push', (event) => {
  let data = { title: '투자나침반', body: '새로운 분석 리포트가 도착했습니다.' };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/dashboard',
    },
    actions: [
      { action: 'open', title: '분석 보기' },
      { action: 'close', title: '닫기' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// ===== 알림 클릭 처리 =====
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') return;

  const url = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      // 이미 열려있는 탭이 있으면 포커스
      for (const client of windowClients) {
        if (client.url.includes('/dashboard') && 'focus' in client) {
          return client.focus();
        }
      }
      // 없으면 새 탭
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
