# PokerPals

Track poker games with friends. Create groups, invite players, record buy-ins and cash-outs, and auto-generate settlements so everyone knows who owes whom.

## Features

- **Groups** -- Create poker groups and invite friends via shareable invite links
- **Game Tracking** -- Track buy-ins, rebuys, and cash-outs per player per session
- **Settlements** -- Auto-calculate who owes whom after each game
- **Analytics** -- Lifetime stats, leaderboards, and profit/loss history
- **Ledger** -- Track payment status for outstanding settlements
- **PWA** -- Installable on mobile via "Add to Home Screen"

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: Supabase (PostgreSQL + Row Level Security)
- **Auth**: Supabase Auth (email, OAuth)
- **UI**: Tailwind CSS + shadcn/ui
- **Fonts**: Geist Sans / Geist Mono

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project

### Setup

1. Clone the repo and install dependencies:

```bash
git clone <repo-url>
cd poker-tracker
npm install
```

2. Copy the example env file and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

You'll need these values from your Supabase project dashboard (Settings > API):

| Variable | Where to find it |
|----------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon / public key |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key (keep secret) |

3. Run the database migrations in your Supabase SQL editor using the schema in `lib/supabase/migrations.sql`.

4. Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Deploying

### Vercel (recommended)

1. Push the repo to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add the environment variables from `.env.local` to Vercel's project settings
4. Update `NEXT_PUBLIC_APP_URL` to your production domain
5. In your Supabase dashboard, add the production URL to **Authentication > URL Configuration > Redirect URLs**

### Environment Variables

Never commit `.env.local`. The `.env.example` file documents all required variables.

## Project Structure

```
app/              # Next.js App Router pages and API routes
components/       # React components (shadcn/ui + custom)
contexts/         # React contexts (auth, poker data)
lib/              # Utilities, types, Supabase clients, data helpers
public/           # Static assets, icons, manifest, service worker
```
