"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Download, Smartphone, Monitor } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export function PWAPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Check if running in standalone mode
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
                           (window.navigator as any).standalone === true

    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent)

    // Check if already dismissed
    const isDismissed = localStorage.getItem('pwa-prompt-dismissed') === 'true'

    setIsStandalone(isStandaloneMode)
    setIsIOS(isIOSDevice)
    setDismissed(isDismissed)

    // Show prompt for iOS devices (after delay)
    if (isIOSDevice && !isStandaloneMode && !isDismissed) {
      const timer = setTimeout(() => {
        setShowPrompt(true)
      }, 10000) // Show after 10 seconds

      return () => clearTimeout(timer)
    }

    // Listen for beforeinstallprompt event (Android/Desktop)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      const promptEvent = e as BeforeInstallPromptEvent
      setDeferredPrompt(promptEvent)
      
      if (!isDismissed) {
        // Show prompt after a delay for better UX
        setTimeout(() => {
          setShowPrompt(true)
        }, 5000)
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Listen for app installation
    window.addEventListener('appinstalled', () => {
      setShowPrompt(false)
      setDeferredPrompt(null)
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    // Show the install prompt
    deferredPrompt.prompt()

    // Wait for the user to make a choice
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt')
    } else {
      console.log('User dismissed the install prompt')
    }

    // Clear the prompt
    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    setDismissed(true)
    localStorage.setItem('pwa-prompt-dismissed', 'true')
    
    // Set timeout to show prompt again after 7 days
    setTimeout(() => {
      localStorage.removeItem('pwa-prompt-dismissed')
    }, 7 * 24 * 60 * 60 * 1000)
  }

  // Don't show if already in standalone mode or dismissed
  if (isStandalone || dismissed || !showPrompt) {
    return null
  }

  return (
    <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 animate-in slide-in-from-bottom-2 duration-500">
      <Card className="border shadow-lg bg-white/95 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              {isIOS ? <Smartphone className="h-5 w-5 text-blue-600" /> : <Monitor className="h-5 w-5 text-blue-600" />}
              <CardTitle className="text-sm">Install PokerPals</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 -mt-1 -mr-1"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription className="text-xs">
            Get the full app experience with offline access and push notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {isIOS ? (
            <div className="space-y-3">
              <p className="text-xs text-gray-600">
                Tap the share button <span className="inline-block w-4 h-4 bg-blue-100 rounded text-blue-600 text-center leading-4">↗</span> in Safari, then select "Add to Home Screen"
              </p>
              <Button
                onClick={handleDismiss}
                size="sm"
                variant="outline"
                className="w-full text-xs h-8"
              >
                Got it
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleInstallClick}
              size="sm"
              className="w-full text-xs h-8"
              disabled={!deferredPrompt}
            >
              <Download className="h-3 w-3 mr-1" />
              Install App
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 