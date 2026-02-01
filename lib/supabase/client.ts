import { createBrowserClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { Database } from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing required Supabase environment variables. Please check your .env.local file:\n' +
    '- NEXT_PUBLIC_SUPABASE_URL\n' +
    '- NEXT_PUBLIC_SUPABASE_ANON_KEY'
  )
}

// Browser client using @supabase/ssr for proper cookie-based session management
// This provides better session isolation and works correctly with Next.js
// The createBrowserClient automatically handles cookies for session persistence
export const supabase = createBrowserClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      // PKCE (auth code flow) is the recommended OAuth flow
      flowType: 'pkce',
      // detectSessionInUrl is needed for OAuth callback handling
      detectSessionInUrl: true,
      // Session will be persisted in cookies automatically by @supabase/ssr
      persistSession: true,
      autoRefreshToken: true,
    },
  }
)

// Server-side client with service role key (only create if available)
// This should only be used in API routes, never in client components
export const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY 
  ? createClient<Database>(
      supabaseUrl,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )
  : null 