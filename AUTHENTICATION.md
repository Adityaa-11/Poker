# PokerPals Authentication & Architecture Guide

This document provides a comprehensive overview of how authentication and data flow work in PokerPals.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Dual Backend System](#dual-backend-system)
3. [Authentication Flow](#authentication-flow)
4. [Session Management](#session-management)
5. [Data Flow & Contexts](#data-flow--contexts)
6. [API Routes](#api-routes)
7. [File Structure](#file-structure)
8. [Environment Variables](#environment-variables)
9. [Deployment](#deployment)
10. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        VERCEL (Next.js 15)                       │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Pages     │  │ Components  │  │      API Routes         │  │
│  │  (app/*)    │  │             │  │    (app/api/*)          │  │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘  │
│         │                │                     │                 │
│         └────────┬───────┘                     │                 │
│                  │                             │                 │
│         ┌────────▼────────┐           ┌───────▼───────┐         │
│         │    Contexts     │           │  Server Auth  │         │
│         │  (Auth + Poker) │           │ (Service Role)│         │
│         └────────┬────────┘           └───────┬───────┘         │
│                  │                            │                  │
│    ┌─────────────┴─────────────┐              │                  │
│    │                           │              │                  │
│    ▼                           ▼              ▼                  │
│ ┌──────────┐            ┌─────────────────────────┐              │
│ │  Demo    │            │    Supabase Client      │              │
│ │  Mode    │            │   (@supabase/ssr)       │              │
│ │(localStorage)         └───────────┬─────────────┘              │
│ └──────────┘                        │                            │
└─────────────────────────────────────┼────────────────────────────┘
                                      │
                                      ▼
                        ┌─────────────────────────┐
                        │    SUPABASE CLOUD       │
                        ├─────────────────────────┤
                        │  • Auth (PKCE flow)     │
                        │  • PostgreSQL Database  │
                        │  • Row Level Security   │
                        └─────────────────────────┘
```

### Key Technologies

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15 (App Router), React 19, Tailwind CSS, shadcn/ui |
| State Management | React Context (AuthContext, PokerContext) |
| Authentication | Supabase Auth (PKCE flow) via `@supabase/ssr` |
| Database | Supabase PostgreSQL with RLS |
| Deployment | Vercel (frontend + API routes) |
| PWA | Service Worker + Web App Manifest |

---

## Dual Backend System

PokerPals supports two data backends that can be switched seamlessly:

### Demo Mode (localStorage)

**Purpose**: Allow users to try the app instantly without creating an account.

**How it works**:
1. User logs in with demo credentials (e.g., `test@pokerpals.com` / `123`)
2. `auth-screen.tsx` checks credentials against `DEMO_USERS` in `lib/demo-data.ts`
3. If matched, `demoLogin()` is called which:
   - Sets `poker_current_user` in localStorage
   - Generates sample data (players, groups, games, settlements)
   - Dispatches `demoDataLoaded` event
4. All subsequent reads/writes go through `lib/data-manager.ts` (localStorage)

**Detection**: `isDemoMode()` checks if `poker_current_user` matches a demo user ID.

```typescript
// lib/demo-data.ts
export const isDemoMode = (): boolean => {
  const currentUserId = localStorage.getItem('poker_current_user')
  if (!currentUserId) return false
  const demoUserIds = Object.values(DEMO_USERS).map(user => user.id)
  return demoUserIds.includes(currentUserId)
}
```

### Production Mode (Supabase)

**Purpose**: Real multi-user functionality with persistent data.

**How it works**:
1. User authenticates via Supabase Auth (OAuth or email/password)
2. Session is stored in cookies (managed by `@supabase/ssr`)
3. Middleware refreshes session on each request
4. All reads/writes go through `lib/supabase/database.ts` or API routes

**Detection**: If `isDemoMode()` returns `false`, production mode is active.

---

## Authentication Flow

### Supabase Auth (Production)

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  User    │────▶│  Auth    │────▶│  OAuth   │────▶│ Callback │
│  Click   │     │  Screen  │     │ Provider │     │  Page    │
└──────────┘     └──────────┘     └──────────┘     └────┬─────┘
                                                        │
                      ┌─────────────────────────────────┘
                      │
                      ▼
              ┌───────────────┐     ┌───────────────┐
              │ exchangeCode  │────▶│  AuthContext  │
              │ ForSession    │     │  refreshUser  │
              └───────────────┘     └───────┬───────┘
                                            │
                      ┌─────────────────────┴─────────────────────┐
                      │                                           │
                      ▼                                           ▼
              ┌───────────────┐                          ┌───────────────┐
              │  User exists  │                          │ Create user   │
              │  in DB?       │──── No ─────────────────▶│ via /api/users│
              └───────┬───────┘                          └───────────────┘
                      │ Yes
                      ▼
              ┌───────────────┐
              │  Set user in  │
              │  AuthContext  │
              └───────────────┘
```

#### Sign-In Methods

1. **Google OAuth** (`signInWithGoogle`)
   ```typescript
   supabase.auth.signInWithOAuth({
     provider: 'google',
     options: {
       redirectTo: `${window.location.origin}/auth/callback`,
       queryParams: { access_type: 'offline', prompt: 'select_account' }
     }
   })
   ```

2. **GitHub OAuth** (`signInWithGitHub`)
   ```typescript
   supabase.auth.signInWithOAuth({
     provider: 'github',
     options: { redirectTo: `${window.location.origin}/auth/callback` }
   })
   ```

3. **Email/Password** (`signInWithEmail`, `signUpWithEmail`)
   ```typescript
   supabase.auth.signInWithPassword({ email, password })
   ```

#### Sign-Out (Important!)

Sign-out uses `scope: 'local'` to only sign out the current browser/device:

```typescript
// lib/auth/supabase-auth.ts
export async function signOut() {
  // scope: 'local' ensures only THIS session is terminated
  // scope: 'global' would sign out ALL sessions across all devices
  const { error } = await supabase.auth.signOut({ scope: 'local' })
  return { success: !error, error: error?.message }
}
```

**Why this matters**: Without `scope: 'local'`, signing out on one device would kick out all other logged-in sessions (including other users on shared devices or other browser tabs).

---

## Session Management

### Browser Client (`lib/supabase/client.ts`)

Uses `@supabase/ssr` for cookie-based session management:

```typescript
import { createBrowserClient } from '@supabase/ssr'

export const supabase = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      flowType: 'pkce',           // Recommended OAuth flow
      detectSessionInUrl: true,   // Handle OAuth callbacks
      persistSession: true,       // Store in cookies
      autoRefreshToken: true,     // Auto-refresh before expiry
    },
  }
)
```

### Middleware (`middleware.ts`)

Refreshes sessions on every request to prevent expiry:

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          // Sync cookies between request and response
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // This refreshes the session if expired
  await supabase.auth.getUser()

  return supabaseResponse
}
```

### Server Client (`lib/supabase/server.ts`)

Two types of server-side clients:

1. **Anon Client** (`supabaseServerAnon`) - For token verification
2. **Service Role Client** (`supabaseServer`) - Bypasses RLS for admin operations

```typescript
// Verify user token
const { data: { user }, error } = await supabaseServerAnon.auth.getUser(token)

// Perform admin operation (after verification)
await supabaseServer.from('users').upsert({ ... })
```

---

## Data Flow & Contexts

### AuthContext (`contexts/auth-context.tsx`)

**Responsibilities**:
- Track current authenticated user
- Handle auth state changes
- Provide `signOut` and `refreshUser` methods

**State**:
```typescript
interface AuthContextType {
  user: Player | null      // Current user (demo or Supabase)
  loading: boolean         // Auth state loading
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}
```

**Flow**:
```
App Loads
    │
    ▼
isDemoMode()? ──Yes──▶ Load demo user from localStorage
    │
    No
    │
    ▼
getSession() ──No session──▶ Show AuthScreen
    │
    Has session
    │
    ▼
getCurrentUser() ──Not in DB──▶ Create via /api/users
    │
    Found
    │
    ▼
setUser(currentUser)
```

### PokerContext (`contexts/poker-context.tsx`)

**Responsibilities**:
- Manage all poker data (players, groups, games, settlements)
- Provide CRUD operations
- Compute derived data (balances, summaries)

**State**:
```typescript
interface PokerContextType {
  currentUser: Player | null
  players: Player[]
  games: Game[]
  groups: Group[]
  settlements: Settlement[]
  
  // Actions
  createNewGroup: (name: string) => Promise<Group | null>
  createNewGame: (...) => Promise<Game | null>
  optInToGame: (gameId, playerId, buyIn) => boolean
  // ... more actions
  
  // Computed
  getPlayerBalance: (playerId: string) => PlayerBalance
  getGameSummary: (gameId: string) => GameSummary | null
}
```

**Data Source Selection**:
```typescript
const refreshData = useCallback(() => {
  if (isLocalMode()) {
    // Demo mode: read from localStorage
    setPlayers(Local.getPlayers())
    setGames(Local.getGames())
    // ...
  } else {
    // Production: read from Supabase
    refreshSupabase()
  }
}, [isLocalMode, refreshSupabase])
```

---

## API Routes

### Why API Routes Exist

1. **Security**: Service role key must stay server-side
2. **RLS Bypass**: Some operations need admin privileges
3. **Reliability**: Consistent behavior regardless of client-side RLS issues
4. **Token Verification**: Centralized auth checking

### Pattern

```typescript
// app/api/example/route.ts
export async function POST(request: NextRequest) {
  // 1. Check service role is available
  if (!supabaseServer) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  // 2. Extract and verify token
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = authHeader.split(' ')[1]
  const { data: { user }, error } = await supabaseServerAnon.auth.getUser(token)
  
  if (error || !user) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  // 3. Perform operation with service role
  const { data, error: dbError } = await supabaseServer
    .from('table')
    .insert({ ... })

  // 4. Return response
  return NextResponse.json({ data })
}
```

### Key Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/users` | GET | List users |
| `/api/users` | POST | Create/upsert user profile |
| `/api/users` | PUT | Update user profile |
| `/api/groups` | GET | List user's groups |
| `/api/groups` | POST | Create new group |
| `/api/join/[inviteCode]` | GET | Lookup group by invite code |
| `/api/join/[inviteCode]` | POST | Join group via invite code |
| `/api/games` | GET | List games |
| `/api/games` | POST | Create new game |
| `/api/games/[gameId]/players` | POST/PUT/DELETE | Manage game players |

---

## File Structure

```
lib/
├── auth/
│   └── supabase-auth.ts      # Auth functions (signIn, signOut, OAuth)
├── supabase/
│   ├── client.ts             # Browser client (createBrowserClient)
│   ├── server.ts             # Server clients (anon + service role)
│   ├── database.ts           # Database operations (CRUD)
│   ├── types.ts              # Database type definitions
│   └── migrations.sql        # Database schema
├── data-manager.ts           # localStorage operations (demo mode)
├── demo-data.ts              # Demo data generation
└── types.ts                  # App type definitions

contexts/
├── auth-context.tsx          # Authentication state
└── poker-context.tsx         # Poker data state

app/
├── api/                      # API routes
│   ├── users/
│   ├── groups/
│   ├── games/
│   └── join/
├── auth/
│   ├── callback/             # OAuth callback handler
│   └── reset-password/
├── groups/
├── games/
├── ledger/
├── settings/
└── layout.tsx                # Root layout with providers

middleware.ts                 # Session refresh middleware
```

---

## Environment Variables

### Required for Client

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### Required for Server (API Routes)

```env
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Keep secret! Never expose to client
```

### Setting in Vercel

1. Go to Project Settings > Environment Variables
2. Add each variable
3. Select environments (Production, Preview, Development)
4. Redeploy after changes

---

## Deployment

### Vercel Deployment

1. **Connect Repository**: Link your GitHub repo to Vercel
2. **Set Environment Variables**: Add all required env vars
3. **Configure Build**: Next.js is auto-detected
4. **Deploy**: Push to main branch or trigger manual deploy

### Supabase Configuration

1. **Auth > URL Configuration**:
   - Site URL: `https://your-app.vercel.app`
   - Redirect URLs: `https://your-app.vercel.app/auth/callback`

2. **Auth > Providers**:
   - Enable Google OAuth (set client ID/secret)
   - Enable GitHub OAuth (set client ID/secret)

3. **Auth > Settings**:
   - Ensure "Single session per user" is **DISABLED**

### Database Setup

Run migrations in Supabase SQL Editor:
```sql
-- See lib/supabase/migrations.sql for full schema
```

Apply RLS policies:
```sql
-- See supabase-rls-policies.sql
```

---

## Troubleshooting

### Issue: User gets kicked out when another user logs in

**Cause**: `signOut()` was using `scope: 'global'` (default in Supabase v2+)

**Solution**: Use `scope: 'local'`:
```typescript
await supabase.auth.signOut({ scope: 'local' })
```

### Issue: OAuth callback fails or hangs

**Possible causes**:
1. Redirect URL not in Supabase allowed list
2. Missing `exchangeCodeForSession` call
3. Session not being persisted

**Solution**: Ensure callback page handles code exchange:
```typescript
const code = new URLSearchParams(window.location.search).get('code')
if (code) {
  await supabase.auth.exchangeCodeForSession(code)
}
```

### Issue: Session expires unexpectedly

**Cause**: Session not being refreshed

**Solution**: Add middleware for session refresh (see `middleware.ts`)

### Issue: Demo mode interferes with production

**Cause**: `poker_current_user` still set in localStorage

**Solution**: Clear localStorage when signing out of demo:
```typescript
const clearDemoData = () => {
  localStorage.removeItem('poker_current_user')
  localStorage.removeItem('poker_players')
  localStorage.removeItem('poker_groups')
  localStorage.removeItem('poker_games')
  localStorage.removeItem('poker_settlements')
}
```

### Issue: API route returns 401 even with valid session

**Possible causes**:
1. Token not being sent in Authorization header
2. Token expired (should be auto-refreshed by middleware)

**Debug**:
```typescript
const { data: { session } } = await supabase.auth.getSession()
console.log('Token:', session?.access_token)
```

### Issue: RLS blocking operations

**Cause**: Row Level Security policies not configured correctly

**Solution**: Use API routes with service role for critical operations, or fix RLS policies in Supabase dashboard.

---

## Security Considerations

1. **Never expose `SUPABASE_SERVICE_ROLE_KEY`** to the client
2. **Always verify tokens** in API routes before using service role
3. **Use `scope: 'local'`** for sign-out to prevent cross-session issues
4. **Enable RLS** on all tables in production
5. **Validate all inputs** in API routes before database operations

---

## Quick Reference

### Sign In Flow
```
AuthScreen → signInWithGoogle() → Google OAuth → /auth/callback → 
handleOAuthCallback() → exchangeCodeForSession() → AuthContext.refreshUser() → 
getCurrentUser() or createUser() → setUser()
```

### Data Read Flow (Production)
```
Component → usePoker() → refreshData() → 
supabase.from('table').select() or fetch('/api/...') → 
setStateFromResponse()
```

### Data Write Flow (Production)
```
Component → pokerContext.createNewGroup() → 
fetch('/api/groups', { method: 'POST', headers: { Authorization: Bearer token } }) → 
API route verifies token → supabaseServer.from('groups').insert() → 
refreshData()
```
