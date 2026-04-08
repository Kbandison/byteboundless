═══════════════════════════════════════════════════════════════
PROJECT: ByteBoundless
Lead Intelligence Tool for Freelance Web Developers
═══════════════════════════════════════════════════════════════

## What this is

ByteBoundless is a SaaS web app that lets freelance web developers
find and qualify local business prospects. Users enter a business
category and location; the app scrapes Google Maps, enriches each
result with website intelligence (tech stack, emails, socials,
staleness signals), scores leads by website rebuild opportunity,
and surfaces the hottest prospects first.

The differentiator is the AI scoring + pitch generation layer.
Anyone can scrape Maps. Ranking businesses by "needs a website
rebuild" and giving the user a tailored pitch angle for each one
is the actual product value.

## Existing assets

I have a working Playwright scraper (currently `scrape-google-maps.js`,
plain JS) that already handles:
- Google Maps URL collection + parallel detail extraction (3 contexts)
- Website enrichment: emails (with business/developer categorization),
  socials across 6 platforms, tech stack detection (Wix, Squarespace,
  WordPress, GoDaddy, Weebly, Duda, Webflow, Shopify, Next.js, React)
- Multi-page contact crawling
- Lead scoring (0–100 with reasons)
- Distinguishes "site blocked our scanner" from "site genuinely broken"
- Sorted JSON + CSV output
- Checkpointing and resume

This script becomes the worker. We do NOT rebuild it. We port it
to TypeScript and move it into apps/worker, but the logic stays
exactly as-is. I'll provide the file.

═══════════════════════════════════════════════════════════════
## REPO STRUCTURE — Turborepo monorepo

byteboundless/
├── apps/
│   ├── web/            # Next.js 15 App Router (Vercel)
│   └── worker/         # Scraper service (Railway)
├── packages/
│   ├── types/          # Shared TS types (Business, Enrichment, etc.)
│   ├── supabase/       # Supabase client + generated DB types
│   └── config/         # Shared eslint, tsconfig, tailwind base
├── turbo.json
└── package.json (workspaces)

The worker polls Supabase for pending scrape jobs. The web app
writes job rows and subscribes to Supabase Realtime for live
progress. No direct HTTP between web and worker — Supabase is
the message bus. Clean, no shared infra to maintain.

═══════════════════════════════════════════════════════════════
## LuxWeb workflow — follow it

Read these files in order before doing anything else:
1. `.luxweb/LUXWEB.md`         — design constitution
2. `.luxweb/WORKFLOW.md`       — the 7-phase process
3. `.luxweb/ARCHETYPES.md`     — for the Phase 2 gate
4. `.luxweb/STACK.md`          — when scaffolding in Phase 5
5. `.luxweb/COMPONENTS.md`     — when building sections in Phase 5
6. `.luxweb/MOTION.md`         — when adding animation in Phase 5

Do NOT skip the archetype gate. Do NOT start coding before
the content inventory is approved. I will push back hard on
both of those.

═══════════════════════════════════════════════════════════════
## Phase 1 — Brief (already filled in, confirm with me)

PROJECT NAME:    ByteBoundless
PROJECT TYPE:    Multi-surface SaaS app (marketing site + auth'd dashboard)
PRIMARY GOAL:    Visitor signs up → runs first scrape → sees a sorted
                 hot lead list within 5 minutes of landing
SURFACES:        Marketing — Landing, Pricing, How It Works, Login/Signup
                 App       — Dashboard, New Search, Search Running,
                             Results, Lead Detail, Saved Lists, Settings
                 Legal     — Privacy, Terms

═══════════════════════════════════════════════════════════════
## Phase 2 — Archetype gate (PROPOSED — confirm before locking)

I'm proposing: Tech Utilitarian → Light Clinical

   Fonts:   Geist (display) + Geist Mono (accents) + Inter Tight (body)
   Palette: bg #FAFAFA / text #1A1A1A / accent #0066FF / borders #E5E5E5
   Dials:   VARIANCE 4 / MOTION 4 / DENSITY 6 / DARK 0
   Voice:   Precise, competent, no-nonsense. Talks to developers
            like equals.

Why this archetype: B2B SaaS for technical users. Linear / Vercel /
Stripe / Resend are the reference set. The marketing surface and
the data-dense dashboard need to coexist — Light Clinical scales
to both without changing systems. It's also a deliberate echo of
the LuxWeb CRM choice, so my work has visual continuity across
properties.

Why NOT the alternatives:
- Dark Terminal: too narrow, alienates the marketing surface
- Data-Dense Dashboard: great for the dashboard, too cold for landing
- Editorial Refined: wrong audience signal
- Soft Consumer: this is a tool for professionals

If you think a different archetype fits better, present the
standard 8 with reasoning per ARCHETYPES.md and I'll choose.
Otherwise lock this in and proceed.

═══════════════════════════════════════════════════════════════
## Phase 3 — Content inventory

Draft a full content inventory per WORKFLOW.md before any code.
I review it as a markdown table and edit before you scaffold.

Cover at minimum:

MARKETING SURFACE
- Landing: hero, problem statement, how it works (3 steps),
  example results screenshot/mock, pricing teaser, FAQ, footer
- Pricing: 3 tiers (Free trial / Pro / Agency)
- How It Works: detailed walkthrough with screenshots
- Auth: Login, Signup (Supabase magic link)

APP SURFACE
- Dashboard: recent searches, hot leads count, "new search" CTA,
  empty state with one-click sample search
- New Search: form (query, location, strict toggle, max results,
  enrich on/off)
- Search Running: 4-phase progress UI (Collecting → Extracting →
  Enriching → Scoring) with live counts via Supabase Realtime
- Results: sortable/filterable table, default sort lead score desc,
  columns include score badge, name, category, tech stack chips,
  email count, social count, last scraped. Sticky score column.
- Lead Detail: full record + AI-generated pitch angle + draft
  outreach email + "Save to list" + "Mark contacted"
- Saved Lists: organized prospects across multiple searches
- Settings: account, billing, API usage, danger zone

═══════════════════════════════════════════════════════════════
## Phase 5 — Build (architecture decisions)

Stack per STACK.md plus these app-specific choices:

1. SCRAPER EXECUTION
   Playwright cannot run on Vercel. The worker is a long-running
   Node service on Railway that polls Supabase for pending jobs.
   - Web writes a row to scrape_jobs (status='pending')
   - Worker polls every 5s, claims a job (status='running'),
     runs the scraper, writes results to businesses table,
     updates phase + progress on the job row throughout
   - Web subscribes to the job row via Supabase Realtime for
     live UI updates

2. SUPABASE SCHEMA (proposed, refine in Phase 3)
   - users                  (managed by Supabase Auth)
   - scrape_jobs            (id, user_id, query, location, options,
                             status, phase, progress_current,
                             progress_total, error, created_at,
                             completed_at)
   - businesses             (id, job_id, name, website, phone,
                             address, rating, reviews, category,
                             unclaimed, enrichment jsonb,
                             lead_score, lead_reasons, created_at)
   - saved_lists            (id, user_id, name, description)
   - saved_list_items       (list_id, business_id, status, notes,
                             contacted_at)
   - lead_pitches           (business_id, pitch_angle,
                             improvement_suggestions, draft_email,
                             generated_at) — AI cache

   RLS: deny-all by default. All writes through server routes
   using service_role key + admin role check. (My standard
   Supabase security pattern.)

3. AI PITCH GENERATION
   When user opens a lead detail, server route calls Claude API
   with the business record and produces:
   - Pitch angle (1 paragraph)
   - 3 specific improvement suggestions tied to enrichment data
     (e.g. "Site is on GoDaddy from 2011, no mobile viewport")
   - Draft outreach email
   Cache by business_id in lead_pitches table. Don't re-run on
   re-view. Use Claude Haiku 4.5 for cost (cheap and fast for
   this use case); offer Sonnet upgrade for Pro tier.

4. REAL-TIME PROGRESS
   Supabase Realtime subscription on the scrape_jobs row.
   Worker updates progress_current as it processes listings.
   The 4-phase progress UI is custom — NOT a generic spinner,
   NOT a generic shadcn progress bar. It's the centerpiece of
   the "scraping is happening" experience and needs to feel
   alive and trustworthy. See COMPONENTS.md for animation hooks.

5. SHARED TYPES
   Define in packages/types and import from both apps:
   - Business, Enrichment, Socials, TechStack, LeadReason
   - ScrapeJob, JobStatus, JobPhase
   - PitchContent
   When scraper output changes, TypeScript breaks the web app
   immediately instead of bugs surfacing in production.

Build order per WORKFLOW.md Phase 5:
1.  Turborepo scaffold + workspace setup
2.  packages/types with all shared interfaces
3.  packages/supabase with client + generated DB types
4.  apps/worker — port scrape-google-maps.js to TS, wire to
    Supabase polling, deploy to Railway
5.  apps/web scaffold per STACK.md
6.  globals.css with Light Clinical tokens
7.  layout.tsx with Supabase provider, fonts, smooth scroll
8.  Marketing nav + landing page hero — STOP for review
    (mandatory LuxWeb checkpoint)
9.  Rest of landing page
10. Auth pages
11. Dashboard shell + empty state
12. New Search form
13. Search Running progress UI (the high-leverage component)
14. Results table (the other high-leverage component)
15. Lead Detail + AI pitch generation
16. Saved Lists
17. Settings
18. Pricing + How It Works marketing pages
19. 404, privacy, terms
20. Stripe integration (Pro / Agency tiers)
21. Final polish + deploy

═══════════════════════════════════════════════════════════════
## Phase 6 — Polish

Run the full LUXWEB.md anti-slop checklist. Specific watch-outs
for ByteBoundless:

- The Results table must NOT look like a stock shadcn DataTable.
  Custom column headers, sticky lead score column with color-graded
  score badges, hover state on rows, expandable row → quick preview
  without leaving the table.
- The Search Running progress component must be a custom 4-phase
  visualization, not a spinner or generic progress bar. This is
  the moment users feel the product working — make it feel alive.
- Empty state on first dashboard visit must include a one-click
  sample search ("Try: lawn care in Buford, GA") so users see
  the magic before manually entering anything.
- Tech stack chips in the results table need a consistent visual
  language (Wix red, WordPress blue, Squarespace black, etc.) so
  users can scan a list and recognize patterns visually.

═══════════════════════════════════════════════════════════════
## Things I will push back on

- Coding before content inventory approval
- Skipping the archetype gate
- Generic shadcn defaults shipped without customization
- Lorem ipsum or placeholder copy in any deliverable
- Estimates that assume traditional dev timelines (Claude Code
  compresses these significantly — don't pad)
- "Just call the API from the browser" — Claude API and Stripe
  always go through server routes
- localStorage for any state that should be in Supabase
- Re-architecting the scraper. It works. We're porting it to TS,
  not rebuilding it.

═══════════════════════════════════════════════════════════════
## My role

- Provide scrape-google-maps.js
- Make all archetype/scope decisions in conversation before code
- Provision Supabase, Vercel, Railway, Resend, Stripe accounts
- Run deployment commands in Phase 7 myself
- Generate marketing imagery via Higgsfield using Phase 4 prompts

═══════════════════════════════════════════════════════════════
## First action

1. Read the LuxWeb files
2. Confirm the proposed Tech Utilitarian → Light Clinical
   selection (or argue for an alternative with reasoning)
3. Move to Phase 3 content inventory
4. Stop and wait for me to approve before any scaffolding

Do not write code until the inventory is approved.