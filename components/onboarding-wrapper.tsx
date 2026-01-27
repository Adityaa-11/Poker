"use client"

import { type ReactNode } from "react"
import { useAuth } from "@/contexts/auth-context"
import { AuthScreen } from "@/components/auth-screen"

interface OnboardingWrapperProps {
  children: ReactNode
}

export function OnboardingWrapper({ children }: OnboardingWrapperProps) {
  const { user, loading } = useAuth()
  
  // Debug logging
  console.log('🔍 OnboardingWrapper: user =', user ? `${user.name} (${user.id})` : 'null', 'loading =', loading)
  
  if (loading) {
    console.log('⏳ OnboardingWrapper: Showing loading spinner')
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    console.log('🚫 OnboardingWrapper: No user, showing auth screen')
    return <AuthScreen />
  }

  console.log('✅ OnboardingWrapper: User authenticated, showing app')
  return <>{children}</>
} 