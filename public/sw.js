// Service Worker for PokerPals PWA
const CACHE_NAME = 'pokerpals-v1.0.1'
const OFFLINE_URL = '/offline'

// Files to cache for offline functionality
const STATIC_CACHE_URLS = [
  '/',
  '/groups',
  '/analytics',
  '/ledger',
  '/settings',
  '/offline',
  '/manifest.json',
  // App icons
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/apple-touch-icon.png',
]

// Dynamic content that should be cached
const RUNTIME_CACHE_URLS = [
  '/api/users',
  '/api/groups', 
  '/api/games',
]

// Install event - cache static resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker')
  
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME)
        
        // Cache the offline page first
        await cache.add(new Request(OFFLINE_URL, { cache: 'reload' }))
        
        // Cache static resources
        await cache.addAll(STATIC_CACHE_URLS)
        
        console.log('[SW] Static resources cached')
      } catch (error) {
        console.error('[SW] Failed to cache static resources:', error)
      }
    })()
  )
  
  // Force activation of new service worker
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker')
  
  event.waitUntil(
    (async () => {
      // Clean up old caches
      const cacheNames = await caches.keys()
      await Promise.all(
        cacheNames
          .filter(cacheName => cacheName !== CACHE_NAME)
          .map(cacheName => {
            console.log('[SW] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          })
      )
      
      // Take control of all pages
      await self.clients.claim()
      console.log('[SW] Service worker activated')
    })()
  )
})

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // Skip non-HTTP requests
  if (!url.protocol.startsWith('http')) return
  
  // Skip Chrome extension requests
  if (url.protocol === 'chrome-extension:') return
  
  // Skip requests from other origins (CDNs, APIs, etc.)
  if (url.origin !== location.origin) return
  
  // Handle different types of requests
  if (request.mode === 'navigate') {
    // Handle page navigation requests
    event.respondWith(handleNavigateRequest(event))
  } else if (url.pathname.startsWith('/api/')) {
    // Handle API requests with network-first strategy
    event.respondWith(handleApiRequest(event))
  } else if (request.destination === 'image') {
    // Handle image requests with cache-first strategy
    event.respondWith(handleImageRequest(event))
  } else {
    // Handle other static resources
    event.respondWith(handleStaticRequest(event))
  }
})

// Handle page navigation (HTML) requests
async function handleNavigateRequest(event) {
  const { request } = event
  
  try {
    // Try network first for fresh content
    const networkResponse = await fetch(request)
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('[SW] Network failed for navigation, trying cache:', error)
    
    // Try cache if network fails
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return offline page if nothing else works
    return caches.match(OFFLINE_URL)
  }
}

// Handle API requests with network-first strategy
async function handleApiRequest(event) {
  const { request } = event
  
  try {
    // Always try network first for API requests
    const networkResponse = await fetch(request)
    
    // Cache successful GET requests
    if (networkResponse.ok && request.method === 'GET') {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('[SW] Network failed for API request, trying cache:', error)
    
    // Only return cached data for GET requests
    if (request.method === 'GET') {
      const cachedResponse = await caches.match(request)
      if (cachedResponse) {
        return cachedResponse
      }
    }
    
    // Return error response for non-GET requests or no cache
    return new Response(
      JSON.stringify({ error: 'Network error and no cached data available' }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

// Handle image requests with cache-first strategy
async function handleImageRequest(event) {
  const { request } = event
  
  // Try cache first for images
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    return cachedResponse
  }
  
  try {
    // Fetch from network if not in cache
    const networkResponse = await fetch(request)
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('[SW] Failed to fetch image:', error)
    
    // Return placeholder image or error response
    return new Response('', {
      status: 404,
      statusText: 'Image not found'
    })
  }
}

// Handle static resource requests
async function handleStaticRequest(event) {
  const { request } = event
  
  // Try cache first for static resources
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    return cachedResponse
  }
  
  try {
    // Fetch from network if not cached
    const networkResponse = await fetch(request)
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('[SW] Failed to fetch static resource:', error)
    throw error
  }
}

// Handle background sync (for future implementation)
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag)
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

async function doBackgroundSync() {
  try {
    // Implement background sync logic here
    // For example, sync pending data when network is available
    console.log('[SW] Performing background sync')
  } catch (error) {
    console.error('[SW] Background sync failed:', error)
  }
}

// Handle push notifications (for future implementation)
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received:', event.data?.text())
  
  const options = {
    body: event.data?.text() || 'New notification from PokerPals',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '2'
    },
    actions: [
      {
        action: 'explore',
        title: 'View',
        icon: '/icons/icon-192x192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/icon-192x192.png'
      }
    ]
  }
  
  event.waitUntil(
    self.registration.showNotification('PokerPals', options)
  )
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action)
  event.notification.close()
  
  if (event.action === 'explore') {
    // Open the app
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data)
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME })
  }
}) 