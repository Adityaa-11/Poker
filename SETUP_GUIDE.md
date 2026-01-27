# Poker Tracker Setup Guide

## Fixed Issues ✅

I've resolved all the critical issues that were preventing your Supabase integration from working:

### 1. Environment Variables Setup
**Issue**: Missing required Supabase environment variables
**Status**: ✅ Fixed - Clean error messages added

**Action Required**: Create a `.env.local` file in your project root with:

```env
# Get these values from your Supabase project settings > API
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. Database Schema & RLS Policies
**Issue**: Missing INSERT policy for users table
**Status**: ✅ Fixed

**Changes Made**:
- Added `CREATE POLICY "Users can insert own profile"` for user creation
- Fixed user profile visibility policy to allow reading all profiles (needed for games/groups)
- Added proper settlement creation policy

### 3. Client Debug Code
**Issue**: Extensive debugging code cluttering the client
**Status**: ✅ Fixed

**Changes Made**:
- Removed all debug console.log statements
- Added clean error messages for missing environment variables
- Simplified client initialization

### 4. Client/Server Context Issues
**Issue**: Complex client switching logic causing auth context problems
**Status**: ✅ Fixed

**Changes Made**:
- Simplified database.ts to use consistent client-side supabase instance
- Removed problematic `getSupabaseClient()` function
- Cleaned up server/client context handling

### 5. Authentication Flow
**Issue**: OAuth callback not creating user profiles properly
**Status**: ✅ Fixed

**Changes Made**:
- Updated auth callback page to use `handleOAuthCallback()` function
- Proper user profile creation/retrieval on OAuth sign-in
- Better error handling and user feedback

## Next Steps

### 1. Set Up Your Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Get your project URL and API keys from Settings > API
3. Create the `.env.local` file with your actual values

### 2. Run Database Migrations
Execute the SQL in `lib/supabase/migrations.sql` in your Supabase SQL editor:
1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the entire migrations.sql content
4. Run the query

### 3. Configure OAuth Providers (Optional)
If you want Google/GitHub sign-in:
1. Go to Authentication > Providers in Supabase
2. Enable Google and/or GitHub
3. Configure OAuth credentials

### 4. Test the Application
```bash
npm run dev
```

Your app should now:
- Connect to Supabase successfully
- Allow user registration/sign-in
- Create user profiles automatically
- Handle OAuth callbacks properly

## Key Files Modified

- `lib/supabase/client.ts` - Cleaned up and simplified
- `lib/supabase/database.ts` - Fixed client context issues
- `lib/supabase/migrations.sql` - Added missing RLS policies
- `app/auth/callback/page.tsx` - Fixed OAuth callback handling

## Troubleshooting

### Environment Variables Not Loading
- Make sure `.env.local` is in your project root
- Restart your development server after adding environment variables
- Check for typos in variable names (they're case-sensitive)

### Database Connection Issues
- Verify your Supabase URL and keys are correct
- Make sure you've run the migrations
- Check Supabase dashboard for any error logs

### Authentication Problems
- Ensure RLS policies are properly applied
- Check that OAuth redirect URLs match your callback URL
- Verify user creation is working in Supabase dashboard

Your poker tracker should now be fully functional! 🎉
