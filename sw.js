const BUILD = '3.5.7';
const SCOPE_TOKEN = new URL(self.registration.scope).pathname
  .replace(/^\/+|\/+$/g, '')
  .replace(/[^a-z0-9_-]+/gi, '-') || 'root';
const CACHE_NAME = `tiger-${SCOPE_TOKEN}-v${BUILD}`;

const CORE_FILES = [
  './',
  './index.html',
  `./styles.css?v=${BUILD}`,
  `./app.js?v=${BUILD}`,
  `./manifest.webmanifest?v=${BUILD}`,
  './version.txt',
  './favicon.ico',
  './favicon-16x16.png',
  './favicon-32x32.png',
  './apple-touch-icon-v27.png',
  './tiger-icon-16-v27.png',
  './tiger-icon-32-v27.png',
  './tiger-icon-180-v27.png',
  './tiger-icon-192-v27.png',
  './tiger-icon-512-v27.png',
  './tiger-maskable-192-v27.png',
  './tiger-maskable-512-v27.png',
  './tiger-bg.png',
  './tiger-logo.png',
  './tiger-logo-mask.png'
];

function scopedUrl(path) {
  return new URL(path, self.registration.scope).href;
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(CORE_FILES.map(path => new Request(scopedUrl(path), { cache: 'reload' })));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    const previousTigerCaches = keys.filter(key => key.startsWith('tiger-') && key !== CACHE_NAME);
    await Promise.all(previousTigerCaches.map(key => caches.delete(key)));
    await self.clients.claim();

    // When replacing an older Tiger build, reload open app windows once so the
    // restored branding and current code appear without requiring manual cache work.
    if (previousTigerCaches.length) {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      await Promise.all(windows.map(client => client.navigate(client.url).catch(() => undefined)));
    }
  })());
});

async function cachedAsset(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response && response.ok) await cache.put(request, response.clone());
    return response;
  } catch (_) {
    return (await cache.match(request, { ignoreSearch: true })) || Response.error();
  }
}

async function instantNavigation(request, event) {
  const cache = await caches.open(CACHE_NAME);
  const cached = (await cache.match(request, { ignoreSearch: true })) ||
    (await cache.match(scopedUrl('./index.html'), { ignoreSearch: true }));

  const refresh = fetch(new Request(request, { cache: 'no-cache' }))
    .then(async response => {
      if (response && response.ok) {
        await cache.put(scopedUrl('./index.html'), response.clone());
      }
    })
    .catch(() => {});

  // Refresh GitHub's copy after the cached screen is returned. Never hold up launch.
  if (event && typeof event.waitUntil === 'function') event.waitUntil(refresh);
  if (cached) return cached;

  try {
    const response = await fetch(new Request(request, { cache: 'no-cache' }));
    if (response && response.ok) await cache.put(scopedUrl('./index.html'), response.clone());
    return response;
  } catch (_) {
    return Response.error();
  }
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(instantNavigation(event.request, event));
    return;
  }

  event.respondWith(cachedAsset(event.request));
});
