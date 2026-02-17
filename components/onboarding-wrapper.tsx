"use client"

import { type ReactNode, useEffect, useRef, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { AuthScreen } from "@/components/auth-screen"
import { Spade, Heart, Diamond, Club } from "lucide-react"

interface OnboardingWrapperProps {
  children: ReactNode
}

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
  const [showAuth, setShowAuth] = useState(false)

  // Once the user has been authenticated at least once, we use this
  // to keep showing app content during background refreshes and prevent
  // loading screen flashes. Only reset on confirmed sign-out.
  const wasAuthenticatedRef = useRef(false)

  useEffect(() => {
    if (user) {
      wasAuthenticatedRef.current = true
      setShowAuth(false)
      return
    }

    // User is null and not loading -- start a grace period before showing auth.
    // This handles both cold-start (first visit) and sign-out (subsequent).
    if (!loading && !user) {
      const delay = wasAuthenticatedRef.current ? 500 : 100
      const timer = setTimeout(() => {
        wasAuthenticatedRef.current = false
        setShowAuth(true)
      }, delay)
      return () => clearTimeout(timer)
    }
  }, [loading, user])

  // User is present -- always show app
  if (user) {
    return <>{children}</>
  }

  // Initial auth check or background refresh in progress
  if (loading) {
    // If previously authenticated, keep showing app content (no flash)
    if (wasAuthenticatedRef.current) {
      return <>{children}</>
    }
    return <LoadingScreen />
  }

  // Loading is done, user is null -- in grace period or ready to show auth
  if (wasAuthenticatedRef.current) {
    // Grace period after sign-out -- keep showing app briefly
    return <>{children}</>
  }

  if (showAuth) {
    return <AuthScreen />
  }

  // Grace period on cold start
  return <LoadingScreen />
} 