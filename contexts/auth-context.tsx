'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
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

  const refreshUser = async (sessionOverride?: { user: { id: string; email?: string; user_metadata?: Record<string, string> }; access_token?: string }) => {
    try {
      // Check for demo mode first
      if (isDemoMode()) {
        const currentUserId = localStorage.getItem('poker_current_user')
        const { DEMO_USERS } = await import('@/lib/demo-data')
        const currentDemoUser = Object.values(DEMO_USERS).find(user => user.id === currentUserId)
        
        if (currentDemoUser) {
          setUser(currentDemoUser)
        } else {
          const { clearDemoData } = await import('@/lib/demo-data')
          clearDemoData()
          setUser(null)
        }
        return
      }
      
      // First check if we have an auth session
      const session = sessionOverride ?? await withTimeout(getSession(), 5000, 'getSession')
      
      if (!session?.user) {
        setUser(null)
        return
      }
      
      const currentUser = await withTimeout(getCurrentUser(), 5000, 'getCurrentUser')
      
      if (!currentUser) {
        // Prefer server-side profile creation (bypasses RLS problems).
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
          setUser(ensured)
          return
        }

        // Fallback: try to create user profile directly from session data
        const { createUser } = await import('@/lib/supabase/database')
        const newUser = await createUser({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User'
        })
        setUser(newUser)
      } else {
        setUser(currentUser)
      }
    } catch (error) {
      console.error('Auth: Error refreshing user:', error)
      setUser(null)
    }
  }

  const handleSignOut = async () => {
    // Check if we're in demo mode
    if (isDemoMode()) {
      const { clearDemoData } = await import('@/lib/demo-data')
      clearDemoData()
      setUser(null)
      window.location.reload()
      return
    }
    
    const { signOut } = await import('@/lib/auth/supabase-auth')
    await signOut()
    setUser(null)
  }

  useEffect(() => {
    let isMounted = true

    // Check initial session
    const checkSession = async () => {
      try {
        // Check for demo mode first
        if (isDemoMode()) {
          await refreshUser()
          return
        }
        
        const session = await getSession()
        
        if (session?.user && isMounted) {
          await refreshUser()
        }
      } catch (error) {
        console.error('Auth: Error checking session:', error)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    checkSession()

    // Fallback timeout in case something gets stuck
    const fallbackTimeout = setTimeout(() => {
      if (isMounted && loading) {
        setLoading(false)
      }
    }, 10000) // 10 second timeout

    // Listen for auth state changes
    const { data: { subscription } } = onAuthStateChange(async (event, session) => {
      if (!isMounted) return

      if (event === 'SIGNED_IN' && session?.user) {
        // Use the provided session to avoid potential getSession() lock/hang.
        await refreshUser(session)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        await refreshUser(session)
      }

      setLoading(false)
    })

    return () => {
      isMounted = false
      clearTimeout(fallbackTimeout)
      subscription.unsubscribe()
    }
  }, [])

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