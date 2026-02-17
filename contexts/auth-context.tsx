'use client'

import { createContext, useContext, useEffect, useState, useRef, useCallback, ReactNode } from 'react'
import { onAuthStateChange, getSession } from '@/lib/auth/supabase-auth'
import { getCurrentUser } from '@/lib/supabase/database'
import { Player } from '@/lib/types'
import { isDemoMode } from '@/lib/demo-data'

interface AuthContextType {
  user: Player | null
  loading: boolean
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<Player | null>(null)
  const [loading, setLoading] = useState(true)

  // Track whether initial auth check has completed so we never re-show loading
  const hasInitializedRef = useRef(false)
  // Keep a ref to the current user so background refreshes can fall back to it
  const userRef = useRef<Player | null>(null)

  // Keep the ref in sync with state
  const setUserSafe = useCallback((newUser: Player | null) => {
    userRef.current = newUser
    setUser(newUser)
  }, [])

  const withTimeout = async <T,>(promise: Promise<T>, ms: number, label: string): Promise<T> => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined
    const timeoutPromise = new Promise<T>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    })

    try {
      return await Promise.race([promise, timeoutPromise])
    } finally {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }

  /**
   * Core user fetch logic. Used by both initial auth check and background refreshes.
   * `isBackground` controls whether transient errors should clear the user (initial)
   * or silently keep the existing user (background).
   */
  const refreshUserInternal = useCallback(async (
    sessionOverride?: { user: { id: string; email?: string; user_metadata?: Record<string, string> }; access_token?: string },
    isBackground = false
  ) => {
    try {
      if (isDemoMode()) {
        const currentUserId = localStorage.getItem('poker_current_user')
        const { DEMO_USERS } = await import('@/lib/demo-data')
        const currentDemoUser = Object.values(DEMO_USERS).find(u => u.id === currentUserId)

        if (currentDemoUser) {
          setUserSafe(currentDemoUser)
        } else {
          const { clearDemoData } = await import('@/lib/demo-data')
          clearDemoData()
          setUserSafe(null)
        }
        return
      }

      // Use provided session or fetch one (longer timeout for background)
      const timeoutMs = isBackground ? 15000 : 8000
      const session = sessionOverride ?? await withTimeout(getSession(), timeoutMs, 'getSession')

      if (!session?.user) {
        // No session means truly signed out -- only clear if this is the initial check
        // or if we don't have a user yet. For background refreshes, keep existing user.
        if (!isBackground) {
          setUserSafe(null)
        }
        return
      }

      const currentUser = await withTimeout(getCurrentUser(), timeoutMs, 'getCurrentUser')

      if (!currentUser) {
        const token =
          typeof (session as { access_token?: string })?.access_token === 'string'
            ? (session as { access_token: string }).access_token
            : undefined
        const res = token
          ? await fetch('/api/users', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                name:
                  session.user.user_metadata?.name ||
                  session.user.email?.split('@')[0] ||
                  'User',
                email: session.user.email || '',
              }),
            })
          : null

        if (res?.ok) {
          const json = (await res.json()) as { player?: Player }
          const ensured = json.player ?? null
          setUserSafe(ensured)
          return
        }

        const { createUser } = await import('@/lib/supabase/database')
        const newUser = await createUser({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User'
        })
        setUserSafe(newUser)
      } else {
        setUserSafe(currentUser)
      }
    } catch (error) {
      if (isBackground) {
        // Background refresh failed -- keep existing user, don't log them out
        console.warn('Auth: Background refresh failed, keeping existing session:', error)
      } else {
        // Initial check failed -- clear user
        console.error('Auth: Error refreshing user:', error)
        setUserSafe(null)
      }
    }
  }, [setUserSafe])

  // Public refreshUser (always foreground)
  const refreshUser = useCallback(async () => {
    await refreshUserInternal(undefined, false)
  }, [refreshUserInternal])

  const handleSignOut = useCallback(async () => {
    if (isDemoMode()) {
      const { clearDemoData } = await import('@/lib/demo-data')
      clearDemoData()
      setUserSafe(null)
      window.location.reload()
      return
    }

    const { signOut } = await import('@/lib/auth/supabase-auth')
    await signOut()
    setUserSafe(null)
  }, [setUserSafe])

  useEffect(() => {
    let isMounted = true

    const checkSession = async () => {
      try {
        if (isDemoMode()) {
          await refreshUserInternal()
          return
        }

        const session = await getSession()

        if (session?.user && isMounted) {
          await refreshUserInternal()
        }
      } catch (error) {
        console.error('Auth: Error checking session:', error)
      } finally {
        if (isMounted) {
          hasInitializedRef.current = true
          setLoading(false)
        }
      }
    }

    checkSession()

    // Fallback timeout in case initial check gets stuck
    const fallbackTimeout = setTimeout(() => {
      if (isMounted && !hasInitializedRef.current) {
        hasInitializedRef.current = true
        setLoading(false)
      }
    }, 10000)

    const { data: { subscription } } = onAuthStateChange(async (event, session) => {
      if (!isMounted) return

      if (event === 'SIGNED_IN' && session?.user) {
        await refreshUserInternal(session, false)
        // Mark initialized and stop loading after first sign-in
        if (!hasInitializedRef.current) {
          hasInitializedRef.current = true
          setLoading(false)
        }
      } else if (event === 'SIGNED_OUT') {
        // Explicit sign-out -- always clear the user
        setUserSafe(null)
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        // Background token refresh -- never clear user on failure
        await refreshUserInternal(session, true)
      }

      // Only clear initial loading, never re-show it
      if (!hasInitializedRef.current) {
        hasInitializedRef.current = true
        setLoading(false)
      }
    })

    return () => {
      isMounted = false
      clearTimeout(fallbackTimeout)
      subscription.unsubscribe()
    }
  }, [refreshUserInternal, setUserSafe])

  const value: AuthContextType = {
    user,
    loading,
    signOut: handleSignOut,
    refreshUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 