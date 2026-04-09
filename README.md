# ByteBoundless

Lead intelligence for freelance web developers. Find local businesses that need better websites, score them by rebuild opportunity, and generate AI-powered outreach — all in one tool.

## What It Does

1. **Search** — Enter a business type and location. ByteBoundless scrapes Google Maps for every matching business.
2. **Enrich** — Visits each website to detect tech stack (Wix, WordPress, Squarespace, etc.), find emails, check social profiles, run Lighthouse audits, and assess mobile-friendliness.
3. **Score** — Ranks every business 0-100 by how likely they need a website rebuild, based on 12+ signals.
4. **Pitch** — Click any lead to get an AI-generated pitch angle, 3 improvement suggestions, and a draft outreach email personalized with your profile.

## Architecture

Turborepo monorepo with three main pieces:

```
byteboundless/
├── apps/
│   ├── web/          # Next.js 16 frontend (Vercel)
│   └── worker/       # Playwright scraper service (Railway)
├── packages/
│   ├── types/        # Shared TypeScript types
│   ├── supabase/     # Supabase client + DB types
│   └── config/       # Shared constants
└── supabase/         # SQL migrations + email templates
```

**How they connect:** The web app writes a job row to Supabase. The worker polls for pending jobs, runs the scraper, writes results back. The web app subscribes via Supabase Realtime for live progress updates. No direct HTTP between web and worker — Supabase is the message bus.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, Tailwind CSS v4, Framer Motion, GSAP |
| Backend | Next.js API routes, Supabase (Postgres + Auth + Realtime + RLS) |
| Worker | Node.js, Playwright (headless Chromium), Google PageSpeed Insights API |
| AI | Anthropic Claude Haiku 4.5 (pitch generation) |
| Payments | Stripe (checkout sessions + webhooks) |
| Hosting | Vercel (web), Railway (worker) |

## Features

### Search & Discovery
- Google Maps scraping with configurable radius (City, Nearby, Region, Statewide)
- Pre-built "Quick Plays" — one-click searches for common niches (Dentists, Plumbers, etc.)
- Reverse mode — paste a list of URLs to enrich and score without Google Maps
- Autocomplete on business category and location fields

### Enrichment
- Tech stack detection: Wix, Squarespace, WordPress, GoDaddy, Weebly, Duda, Webflow, Shopify, Next.js, React
- Email extraction with business vs. developer categorization
- Social profile detection across 6 platforms
- Mobile viewport check (with platform-aware detection)
- Copyright year staleness detection
- Google Lighthouse scores (performance, SEO, accessibility)
- Multi-page contact crawling

### Lead Scoring
- 0-100 score based on 12+ weighted signals
- Color-coded badges: green (80+), yellow (50-79), gray (<50)
- Score breakdown showing which signals contributed and by how much
- Factors: tech stack age, mobile-friendliness, Lighthouse scores, social presence, review count, claimed status, page speed, content staleness

### AI Pitch Generation
- Powered by Claude Haiku 4.5
- Generates: pitch angle, 3 specific improvement suggestions, draft outreach email
- Personalized with your profile (name, company, services, experience, location)
- Cached per business — reopening a lead doesn't cost another API call
- Regenerate button for fresh versions

### Outreach Management
- Save leads to custom lists
- Full outcome pipeline: Contacted → Replied → Quoted → Signed (with deal amount) → Lost
- Visual status indicators on results table (checkmark for contacted, bookmark for saved)
- CSV export with phone numbers and email addresses

### Comprehensive Filters
- Minimum score slider
- Has phone / Has email / Has website toggles
- Saved / Contacted status filters
- Tech stack multi-select
- "Showing X of Y" count

### Account & Billing
- Magic link authentication (Supabase)
- 3-step onboarding wizard (name, contact info, services)
- Profile fields used in AI pitch personalization
- Plan-based limits with server-side enforcement
- Overage credit system ($4 per 200 extra results via Stripe)
- Admin portal with user management and job monitoring

## Plans & Limits

| | Free | Pro ($29/mo) | Agency ($79/mo) |
|---|---|---|---|
| Searches/month | 3 | 50 | 200 |
| Results/search | 50 | 500 | 1,000 |
| AI pitches/month | 10 | 200 | Unlimited |
| CSV export | No | Yes | Yes |
| Saved lists | No | Yes | Yes |
| Reverse mode | No | Yes | Yes |
| Outcome tracking | No | Yes | Yes |
| Overage credits | No | $4/200 results | $4/200 results |

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- A [Supabase](https://supabase.com) project
- A [Railway](https://railway.app) account (for the worker)
- A [Vercel](https://vercel.com) account (for the web app)
- An [Anthropic](https://console.anthropic.com) API key
- A [Stripe](https://stripe.com) account (for billing, optional)

### 1. Clone and install

```bash
git clone https://github.com/Kbandison/byteboundless.git
cd byteboundless
npm install
```

### 2. Set up Supabase

1. Create a new Supabase project
2. Go to **SQL Editor** and run `supabase/schema.sql`
3. Run each migration in order: `002_add_admin_role.sql` through `007_overage_credits.sql`
4. Go to **Authentication → URL Configuration**:
   - Site URL: your Vercel deployment URL
   - Redirect URLs: `https://your-domain.vercel.app/auth/callback` and `http://localhost:3000/auth/callback`
5. (Optional) Go to **Authentication → Email Templates** and paste the HTML from `supabase/email-templates/`

### 3. Environment variables

Create `apps/web/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ANTHROPIC_API_KEY=sk-ant-...
STRIPE_SECRET_KEY=sk_...              # Optional — for billing
STRIPE_WEBHOOK_SECRET=whsec_...       # Optional — for billing
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Add the same variables to your Vercel project settings for production.

### 4. Run locally

```bash
# Start the web app
npm run dev:web

# In another terminal, start the worker (requires Playwright browsers)
cd apps/worker
npx playwright install chromium
npm run dev
```

The web app runs at `http://localhost:3000`.

### 5. Deploy

**Web (Vercel):**
- Import the GitHub repo into Vercel
- It auto-detects Next.js
- Add environment variables in project settings

**Worker (Railway):**
- Create a new project from the GitHub repo
- Set root directory to `apps/worker`
- Railway auto-detects the Dockerfile
- Add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` as environment variables

### 6. Stripe setup (optional)

1. Create a Stripe account
2. Add `STRIPE_SECRET_KEY` to Vercel env vars
3. Set up a webhook endpoint: `https://your-domain.vercel.app/api/billing/webhook`
4. Add `STRIPE_WEBHOOK_SECRET` to Vercel env vars
5. The overage purchase flow ($4/200 results) will work automatically

## Project Structure

```
apps/web/
├── app/
│   ├── (app)/              # Authenticated app pages
│   │   ├── dashboard/      # Stats, quick plays, recent searches
│   │   ├── search/new/     # Search form with autocomplete
│   │   ├── search/[id]/    # Live progress page
│   │   ├── search/[id]/results/         # Sortable/filterable results table
│   │   ├── search/[id]/results/[bizId]/ # Lead detail + AI pitch
│   │   ├── lists/          # Saved lists management
│   │   ├── settings/       # Profile, billing, account
│   │   ├── guide/          # How-to-use documentation
│   │   ├── admin/          # Admin portal (admin users only)
│   │   └── setup/          # Onboarding wizard (first login)
│   ├── (auth)/             # Login + signup (magic link)
│   ├── api/                # API routes (search, pitch, lists, billing, admin)
│   └── auth/callback/      # Magic link callback handler
├── components/
│   ├── sections/           # Landing page sections
│   ├── layout/             # Navbar, footer, app nav
│   └── ui/                 # Autocomplete, help tips, upgrade gates
├── hooks/                  # usePlan, useGSAP, useSmoothScroll, useViewport
└── lib/                    # Supabase clients, constants, utilities

apps/worker/
├── src/
│   ├── index.ts            # Polling loop + Supabase job management
│   └── scraper.ts          # Full scraping pipeline (ported from JS)
└── Dockerfile              # Playwright + Chromium for Railway
```

## Admin Access

To make a user an admin, run in Supabase SQL Editor:

```sql
UPDATE public.profiles
SET role = 'admin', plan = 'agency', searches_limit = 999999
WHERE email = 'your@email.com';
```

Admin portal (`/admin`) includes:
- System overview (total users, jobs, businesses scraped)
- User management (change plans, toggle admin)
- Job monitor (status, errors, progress across all users)

## How the Scraper Works

1. **Collecting** — Opens Google Maps, searches the query, scrolls to load listings (8-25 scroll passes depending on radius)
2. **Extracting** — Visits each Maps listing URL to pull name, phone, address, rating, reviews, website, category, and claimed status
3. **Enriching** — Fetches each business website via HTTP, detects tech stack via regex patterns, extracts emails (categorized as business vs developer), finds social profiles, checks mobile viewport, runs Google Lighthouse
4. **Scoring** — Weighs 12+ signals: tech stack (+30 for Wix/GoDaddy, -25 for Next.js), mobile viewport (+15), staleness (+20 for 5+ years), Lighthouse performance (+10 for <50), unclaimed listing (+15), etc.

The worker runs in a Docker container with Playwright's Chromium. It polls Supabase every 5 seconds for pending jobs, claims them atomically, and reports progress via Supabase updates that the frontend receives in real-time.

## License

Private. All rights reserved.
