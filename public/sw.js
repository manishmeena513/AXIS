const CACHE_NAME = 'axis-offline-v1'

const APP_SHELL_ROUTES = [
  '/',
  '/tools',
  '/tools/bearing',
  '/tools/level',
  '/tools/qibla',
  '/tools/sun',
  '/tools/moon',
  '/tools/coordinates',
  '/location',
  '/settings',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable.png',
]

self.addEventListener('install', event => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL_ROUTES))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', event => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  // Only cache same-origin requests (no external APIs exist per PRD Rule 1)
  if (url.origin !== self.location.origin) return

  // Cache-first for static immutable Next.js assets, fonts, and icons
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/fonts/')
  ) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached
        return fetch(request).then(response => {
          const copy = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy))
          return response
        })
      })
    )
    return
  }

  // Stale-while-revalidate for app shell routes and RSC payloads
  event.respondWith(
    caches.match(request).then(cached => {
      const networkFetch = fetch(request)
        .then(response => {
          if (response && response.status === 200) {
            const copy = response.clone()
            caches.open(CACHE_NAME).then(cache => cache.put(request, copy))
          }
          return response
        })
        .catch(() => cached || caches.match('/'))

      return cached || networkFetch
    })
  )
})
