"use client"

import { useEffect } from 'react'

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      // Register service worker
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[SW] Service Worker registered successfully:', registration.scope)
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New version available
                  if (confirm('A new version of PokerPals is available. Reload to update?')) {
                    window.location.reload()
                  }
                }
              })
            }
          })
        })
        .catch((error) => {
          console.error('[SW] Service Worker registration failed:', error)
        })

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'VERSION_UPDATE') {
          console.log('[SW] Version update available')
        }
      })

      // Handle online/offline status
      const handleOnline = () => {
        console.log('[SW] Back online')
        // Optionally trigger a sync or refresh
      }

      const handleOffline = () => {
        console.log('[SW] Gone offline')
        // Show offline indicator
      }

      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)

      return () => {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
      }
    }
  }, [])

  return null // This component doesn't render anything
} 