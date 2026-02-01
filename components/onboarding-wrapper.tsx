"use client"

import { type ReactNode, useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { AuthScreen } from "@/components/auth-screen"
import { Spade, Heart, Diamond, Club } from "lucide-react"

interface OnboardingWrapperProps {
  children: ReactNode
}

// Poker-themed loading animation component
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex flex-col items-center justify-center p-4">
      <div className="flex gap-2 mb-6">
        <Spade className="h-8 w-8 text-slate-700 dark:text-slate-300 animate-bounce" style={{ animationDelay: '0ms' }} />
        <Heart className="h-8 w-8 text-red-500 animate-bounce" style={{ animationDelay: '150ms' }} />
        <Diamond className="h-8 w-8 text-red-500 animate-bounce" style={{ animationDelay: '300ms' }} />
        <Club className="h-8 w-8 text-slate-700 dark:text-slate-300 animate-bounce" style={{ animationDelay: '450ms' }} />
      </div>
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">PokerPals</h1>
      <p className="text-slate-600 dark:text-slate-400 text-sm">Loading your session...</p>
    </div>
  )
}

export function OnboardingWrapper({ children }: OnboardingWrapperProps) {
  const { user, loading } = useAuth()
  // Add a small grace period to avoid flashing AuthScreen while session initializes
  const [showAuth, setShowAuth] = useState(false)
  
  useEffect(() => {
    // Only show auth screen after a short delay if still no user
    // This prevents the flash when session is being restored
    if (!loading && !user) {
      const timer = setTimeout(() => {
        setShowAuth(true)
      }, 100) // 100ms grace period
      return () => clearTimeout(timer)
    } else {
      setShowAuth(false)
    }
  }, [loading, user])
  
  // Debug logging (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 OnboardingWrapper: user =', user ? `${user.name} (${user.id})` : 'null', 'loading =', loading)
  }
  
  // Show loading screen while checking auth
  if (loading) {
    return <LoadingScreen />
  }

  // Show loading screen during grace period (prevents AuthScreen flash)
  if (!user && !showAuth) {
    return <LoadingScreen />
  }

  // No user after grace period - show auth screen
  if (!user) {
    return <AuthScreen />
  }

  // User authenticated - show app
  return <>{children}</>
} 