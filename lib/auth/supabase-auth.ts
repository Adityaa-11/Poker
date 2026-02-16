import { supabase } from '@/lib/supabase/client'
import { createUser, getCurrentUser } from '@/lib/supabase/database'
import { Player } from '@/lib/types'

async function ensureProfileViaApi(params: { name: string; email: string }) {
  const { data: sessionData } = await supabase.auth.getSession()
  const token = sessionData.session?.access_token
  if (!token) return null

  const res = await fetch('/api/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(params),
  })

  if (!res.ok) return null
  const json = (await res.json()) as { player?: Player }
  return json.player ?? null
}

export interface AuthUser {
  id: string
  email: string
  name: string
  avatar_url?: string
}

export interface SignUpData {
  email: string
  password: string
  name: string
}

export interface SignInData {
  email: string
  password: string
}

// Google OAuth sign in
export async function signInWithGoogle(): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          // Removed 'prompt: consent' - it forces re-consent every time
          // which can cause issues with session handling and token refresh
          prompt: 'select_account',
        },
      },
    })

    if (error) {
      console.error('OAuth error:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('OAuth exception:', error)
    return { success: false, error: 'Failed to sign in with Google' }
  }
}

// GitHub OAuth sign in
export async function signInWithGitHub(): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to sign in with GitHub' }
  }
}

// Email/password sign up
export async function signUpWithEmail(data: SignUpData): Promise<{ success: boolean; error?: string; user?: Player }> {
  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name,
        },
      },
    })

    if (authError) {
      return { success: false, error: authError.message }
    }

    if (!authData.user) {
      return { success: false, error: 'Failed to create user account' }
    }

    // Create user profile in our database
    const player = await createUser({
      id: authData.user.id,
      email: data.email,
      name: data.name,
    })

    if (!player) {
      return { success: false, error: 'Failed to create user profile' }
    }

    return { success: true, user: player }
  } catch (error) {
    return { success: false, error: 'Failed to sign up' }
  }
}

// Email/password sign in
export async function signInWithEmail(data: SignInData): Promise<{ success: boolean; error?: string; user?: Player }> {
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (authError) {
      return { success: false, error: authError.message }
    }

    if (!authData.user) {
      return { success: false, error: 'Failed to sign in' }
    }

    // Get user profile from our database
    const player = await getCurrentUser()

    if (!player) {
      return { success: false, error: 'User profile not found' }
    }

    return { success: true, user: player }
  } catch (error) {
    return { success: false, error: 'Failed to sign in' }
  }
}

// Sign out
// IMPORTANT: Using scope: 'local' to only sign out this browser/device
// scope: 'global' would sign out ALL sessions across all devices
export async function signOut(): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.signOut({ scope: 'local' })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to sign out' }
  }
}

// Password reset
export async function resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to send reset email' }
  }
}

// Update password
export async function updatePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to update password' }
  }
}

// Get current auth session
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

// Listen to auth state changes
export function onAuthStateChange(callback: (event: string, session: { user: { id: string; email?: string; user_metadata?: Record<string, string> }; access_token: string } | null) => void) {
  return supabase.auth.onAuthStateChange(callback)
}

// Handle OAuth callback (for Google sign-in)
export async function handleOAuthCallback(): Promise<{ success: boolean; user?: Player; error?: string }> {
  try {
    // If we're using PKCE/code flow, the provider redirects back with `?code=...`.
    // Explicitly exchanging the code makes the callback robust in Next.js.
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        if (exchangeError) {
          return { success: false, error: exchangeError.message }
        }
      }
    }

    const { data, error } = await supabase.auth.getSession()

    if (error) {
      return { success: false, error: error.message }
    }

    if (!data.session?.user) {
      return { success: false, error: 'No user session found' }
    }

    const authUser = data.session.user

    // Check if user already exists in our database
    let player = await getCurrentUser()

    if (!player) {
      const name =
        authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User'
      const email = authUser.email || ''

      // Prefer server-side profile creation (bypasses RLS issues).
      player = await ensureProfileViaApi({ name, email })
    }

    if (!player) {
      // Create new user profile
      player = await createUser({
        id: authUser.id,
        email: authUser.email || '',
        name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
      })
    }

    if (!player) {
      return { success: false, error: 'Failed to create or retrieve user profile' }
    }

    return { success: true, user: player }
  } catch (error) {
    return { success: false, error: 'Failed to handle OAuth callback' }
  }
} 