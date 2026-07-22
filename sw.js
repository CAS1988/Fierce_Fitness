const BUILD = '3.5.4';
const SCOPE_TOKEN = new URL(self.registration.scope).pathname
  .replace(/^\/+|\/+$/g, '')
  .replace(/[^a-z0-9_-]+/gi, '-') || 'root';
const CACHE_NAME = `tiger-${SCOPE_TOKEN}-v${BUILD}`;

const CORE_FILES = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './version.txt',
  './favicon.ico',
  './favicon-16x16.png',
  './favicon-32x32.png',
  './apple-touch-icon.png',
  './tiger-icon-16-v26.png',
  './tiger-icon-32-v26.png',
  './tiger-icon-180-v26.png',
  './tiger-icon-192-v26.png',
  './tiger-icon-512-v26.png',
  './tiger-maskable-192-v26.png',
  './tiger-maskable-512-v26.png',
  './assets/tiger-bg.png',
  './assets/tiger-logo.png',
  './assets/tiger-logo-mask.png'
];

function scopedUrl(path) {
  return new URL(path, self.registration.scope).href;
}

function freshRequest(request) {
  return new Request(request, { cache: 'reload' });
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    const requests = CORE_FILES.map(path => freshRequest(scopedUrl(path)));
    await cache.addAll(requests);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter(key => key.startsWith('tiger-') && key !== CACHE_NAME)
        .map(key => caches.delete(key))
    );
    await self.clients.claim();
  })());
});

async function networkFirst(request, fallbackPath) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(freshRequest(request));
    if (!response || !response.ok) throw new Error('Network request failed');
    await cache.put(request, response.clone());
    return response;
  } catch (_) {
    return (await cache.match(request, { ignoreSearch: true })) ||
      (fallbackPath ? await cache.match(scopedUrl(fallbackPath), { ignoreSearch: true }) : undefined) ||
      Response.error();
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request, { ignoreSearch: true });
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response && response.ok) await cache.put(request, response.clone());
    return response;
  } catch (_) {
    return Response.error();
  }
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(networkFirst(event.request, './index.html'));
    return;
  }

  const isVersioned = requestUrl.searchParams.has('v');
  const isAppCode = ['script', 'style', 'manifest'].includes(event.request.destination) ||
    /\.(?:js|css|webmanifest|json|txt)$/i.test(requestUrl.pathname);

  event.respondWith((isVersioned || isAppCode)
    ? networkFirst(event.request)
    : cacheFirst(event.request));
});
