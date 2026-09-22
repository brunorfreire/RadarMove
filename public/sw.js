// RadarMove PWA Minimal Service Worker
const CACHE_NAME = 'radarmove-pwa-v1';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png'
];

// Instalação: Pré-cache dos ativos estruturais básicos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('RadarMove SW: Alguns recursos não puderam ser cacheados na instalação:', err);
      });
    })
  );
  self.skipWaiting();
});

// Ativação: Limpeza de caches obsoletos e tomada de controle dos clientes
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Network First com fallback para Cache para garantir dados sempre atualizados
self.addEventListener('fetch', (event) => {
  // Ignora requisições de extensões, requisições que não sejam GET ou chamadas da API do Supabase
  if (
    event.request.method !== 'GET' ||
    event.request.url.startsWith('chrome-extension') ||
    event.request.url.includes('/supabase.co/') ||
    event.request.url.includes('/api/')
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Se a resposta for válida, opcionalmente armazena no cache para uso offline
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Se a rede falhar, tenta responder pelo cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Se for uma requisição de navegação (HTML), serve o index.html da raiz
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html') || caches.match('/');
          }
        });
      })
  );
});
