// Basic service worker for PWA offline support
const CACHE_NAME = 'notes-v1'

self.addEventListener('install', (event) => {
  // Only cache '/' — don't cache routes that might not exist
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.add('/'))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  // Only cache GET requests, skip Supabase API calls and non-http(s)
  if (
    event.request.method !== 'GET' ||
    event.request.url.includes('supabase.co') ||
    !event.request.url.startsWith('http')
  ) {
    return
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Only cache valid responses
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
        }
        return response
      })
      .catch(() =>
        caches.match(event.request).then((r) => r || caches.match('/'))
      )
  )
})
