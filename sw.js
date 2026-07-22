const BUILD = '3.5.5';
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
  './assets/tiger-bg.webp',
  './assets/tiger-logo-mask.png'
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
    await Promise.all(keys
      .filter(key => key.startsWith('tiger-') && key !== CACHE_NAME)
      .map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

async function cacheFirstExact(request) {
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

async function navigationFast(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = (await cache.match(request, { ignoreSearch: true })) ||
    (await cache.match(scopedUrl('./index.html'), { ignoreSearch: true }));

  const network = fetch(new Request(request, { cache: 'no-cache' })).then(async response => {
    if (!response || !response.ok) throw new Error('Navigation request failed');
    await cache.put(scopedUrl('./index.html'), response.clone());
    return response;
  });

  if (!cached) return network.catch(() => Response.error());

  // Prefer a fresh page when the network responds promptly, but never hold an
  // installed launch for more than 700 ms. The network request continues and
  // refreshes the cached page for the next opening.
  return Promise.race([
    network.catch(() => cached),
    new Promise(resolve => setTimeout(() => resolve(cached), 700))
  ]);
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(navigationFast(event.request));
    return;
  }

  // Every release changes the ?v= value. Exact matching therefore gives instant
  // repeat launches without ever confusing one build's JS/CSS with another.
  event.respondWith(cacheFirstExact(event.request));
});
