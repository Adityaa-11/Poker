# Deployment plan (Web + App Store path)

This repo is a **Next.js 15** app with **Supabase Auth**. It supports:
- **Auth**: Supabase (email/password + OAuth)
- **Data**:
  - **Supabase** (production path, multi-device)
  - **Demo mode** (localStorage sample data for testing)

## 0) One-time prerequisites

### Supabase
1. Create a Supabase project.
2. Run the SQL in `lib/supabase/migrations.sql`.
   - If you ran it before, re-run it after pulling updates (it includes additive changes like `game_player_payments` + game flow columns).
3. Configure redirect URLs (Supabase → Authentication → URL Configuration):
   - **Local**:
     - Site URL: `http://localhost:3000`
     - Additional Redirect URLs: `http://localhost:3000/auth/callback`
   - **Production** (replace with your real domain):
     - Site URL: `https://YOUR_DOMAIN`
     - Additional Redirect URLs: `https://YOUR_DOMAIN/auth/callback`
4. Enable OAuth providers you want (Supabase → Authentication → Providers).
   - Provider callback URL is Supabase’s: `https://<project-ref>.supabase.co/auth/v1/callback`

### Environment variables
1. Copy `.env.example` → `.env.local`
2. Fill in real values
3. **Never commit** `SUPABASE_SERVICE_ROLE_KEY`

## 1) Web deployment (recommended first)

### Target: Vercel (easiest for Next.js)
1. Create a new Vercel project and import this repo.
2. Set env vars in Vercel Project Settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only)
   - `NEXT_PUBLIC_APP_URL` (set to your production domain)
3. Deploy.
4. Update Supabase **Site URL** + **Additional Redirect URLs** to your production domain.
5. Test:
   - Google OAuth login
   - Refresh page (session persists)
   - Create group/game in your chosen mode (demo/local vs future Supabase-data mode)

### Local “release” commands
```bash
npm run lint
npm run build
npm run start
```

## 2) App Store path (iOS) — recommended approach

### Approach: Capacitor wrapper (fastest path)
This keeps your Next.js UI and ships it as a native shell.

High-level steps:
1. Add Capacitor dependencies
2. Generate iOS project
3. Configure deep links / universal links for OAuth
4. Build + upload to TestFlight
5. App Store submission

Important OAuth note for native shells:
- Your redirect will **not** be `https://yourdomain/auth/callback` anymore.
- You’ll use a custom scheme (e.g. `pokerpals://auth/callback`) or universal links.
- Supabase redirect URLs must include that scheme.

## 3) Production readiness gap (what’s still needed for “real” usage)

Right now, app data is primarily localStorage-based. For an App Store-quality experience:
- **Migrate games/groups/ledger to Supabase tables**
- Add/verify **RLS policies** for all writes/reads
- Add **account deletion** flow + privacy policy URL
- Add crash reporting (Sentry or similar)

