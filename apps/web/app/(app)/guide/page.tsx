import {
  Search, Globe, Sparkles, Target, Phone, Command,
  Bookmark, CheckCircle2, Download, Filter, ArrowRight, Zap,
  TrendingUp, Shield, Smartphone, Clock, BarChart3, Gauge,
  CheckSquare, Bell, Crown,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

function Section({ id, icon: Icon, title, children }: {
  id: string;
  icon: typeof Search;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-[var(--color-accent)]" />
        </div>
        <h2 className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight">{title}</h2>
      </div>
      <div className="text-sm text-[var(--color-text-secondary)] leading-relaxed space-y-4 ml-0 md:ml-[52px]">
        {children}
      </div>
    </section>
  );
}

function ScoreExample({ score, label, color }: { score: number; label: string; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className={cn("inline-flex items-center justify-center w-10 h-7 rounded text-xs font-bold font-[family-name:var(--font-mono)] border shrink-0", color)}>
        {score}
      </span>
      <span>{label}</span>
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="font-[family-name:var(--font-mono)] text-[10px] px-1.5 py-0.5 rounded border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
      {children}
    </kbd>
  );
}

const TOC = [
  { id: "getting-started", label: "Getting Started" },
  { id: "searching", label: "Running a Search" },
  { id: "url-import", label: "URL Import Mode" },
  { id: "scores", label: "Lead Scores" },
  { id: "results", label: "Results Table" },
  { id: "enrichment", label: "Enrichment Data" },
  { id: "lighthouse", label: "Lighthouse Audits" },
  { id: "pitches", label: "AI Pitches" },
  { id: "pipeline", label: "Outreach Pipeline" },
  { id: "lists", label: "Saved Lists" },
  { id: "bulk", label: "Bulk Actions" },
  { id: "filters", label: "Filters & Sort" },
  { id: "shortcuts", label: "Keyboard Shortcuts" },
  { id: "notifications", label: "Notifications" },
  { id: "plans", label: "Plans & Billing" },
  { id: "tips", label: "Tips for Success" },
];

export default function GuidePage() {
  return (
    <div className="max-w-4xl mx-auto px-6 md:px-8 py-12">
      <div className="mb-12">
        <p className="text-xs uppercase tracking-[0.15em] text-[var(--color-accent)] font-medium font-[family-name:var(--font-mono)] mb-2">
          Guide
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
          How to Use ByteBoundless
        </h1>
        <p className="text-[var(--color-text-secondary)] mt-2">
          Everything you need to find, qualify, track, and pitch local businesses that need better websites.
        </p>
      </div>

      {/* Table of contents */}
      <nav className="mb-12 p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-tertiary)]">
        <p className="text-xs uppercase tracking-wider text-[var(--color-text-dim)] font-medium mb-3">Contents</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {TOC.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors flex items-center gap-2"
            >
              <ArrowRight className="w-3 h-3 shrink-0" />
              {item.label}
            </a>
          ))}
        </div>
      </nav>

      <div className="space-y-16">
        <Section id="getting-started" icon={Zap} title="Getting Started">
          <p>ByteBoundless helps freelance web developers find local businesses that need better websites. Here&apos;s the loop:</p>
          <ol className="list-decimal pl-5 space-y-2">
            <li><strong>Search</strong> — Enter a business type and location, pick your radius, and we scrape Google Maps for every matching business.</li>
            <li><strong>Enrich</strong> — We visit each website, detect their tech stack, pull emails and socials, run a Lighthouse audit, and look for staleness signals.</li>
            <li><strong>Score</strong> — Each business gets a 0&ndash;100 lead score based on how likely they need a website rebuild.</li>
            <li><strong>Pitch</strong> — Click any lead to get an AI-generated pitch angle, improvement suggestions, and a draft outreach email personalized with your profile info.</li>
            <li><strong>Track</strong> — Save leads to lists and move them through the pipeline (contacted &rarr; replied &rarr; quoted &rarr; signed).</li>
          </ol>
          <p>Start by <Link href="/search/new" className="text-[var(--color-accent)] hover:underline">running your first search</Link>, or browse the sections below to learn about specific features.</p>
        </Section>

        <Section id="searching" icon={Search} title="Running a Search">
          <p>Head to <Link href="/search/new" className="text-[var(--color-accent)] hover:underline">New Search</Link> and fill in the form.</p>
          <p><strong>Business type:</strong> What kind of business you&apos;re targeting. Examples: &ldquo;dentist&rdquo;, &ldquo;lawn care&rdquo;, &ldquo;plumber&rdquo;, &ldquo;restaurant&rdquo;. Be specific — &ldquo;emergency plumber&rdquo; returns cleaner results than &ldquo;plumbing&rdquo;.</p>
          <p><strong>Location:</strong> City and state, like &ldquo;Austin, TX&rdquo;. The autocomplete helps you pick a valid format.</p>
          <p><strong>Search area (radius):</strong> how wide to look around the city.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>City</strong> — Only businesses registered to that exact city. Fastest, cleanest.</li>
            <li><strong>Nearby (~25mi)</strong> — Includes surrounding towns. Good default for most outreach.</li>
            <li><strong>Region (~50mi)</strong> — Wider metro area. Takes longer but catches adjacent markets.</li>
            <li><strong>Statewide</strong> — Entire state. Significantly longer — use when you want volume.</li>
          </ul>
          <p><strong>Max results:</strong> how many listings to scrape. Higher caps are gated by your plan (Free: 50, Pro: 500, Agency: 1,000). More results = longer scrape, more enrichment work.</p>
          <p><strong>Enrich toggle:</strong> when on (default), we visit each site to collect tech stack, emails, socials, Lighthouse scores, and staleness signals. Turn it off for a fast-but-shallow scrape — useful when you just want names and addresses.</p>
        </Section>

        <Section id="url-import" icon={Globe} title="URL Import Mode">
          <p>Already have a list of business websites — from a referral, a directory, a previous campaign? You can enrich them directly without scraping Google Maps.</p>
          <p>On the New Search page, switch to <strong>URL Import</strong> mode and paste your URLs (one per line). ByteBoundless runs the same enrichment, lead scoring, and AI pitch generation on them. Every result goes into your regular results table.</p>
          <p>URL Import counts the same as a search against your monthly quota. Max URLs per import follows your plan&apos;s max results cap.</p>
        </Section>

        <Section id="scores" icon={BarChart3} title="Lead Scores">
          <p>Every business gets a <strong>lead score from 0 to 100</strong>. Higher = more likely to need your services. Here&apos;s what the ranges mean:</p>
          <div className="space-y-3 my-4">
            <ScoreExample score={85} label="Hot lead — outdated builder, missing mobile, stale content. Reach out." color="bg-emerald-500/15 text-emerald-700 border-emerald-500/30" />
            <ScoreExample score={65} label="Warm lead — some issues found, worth investigating further." color="bg-amber-500/15 text-amber-700 border-amber-500/30" />
            <ScoreExample score={35} label="Cold — modern site, low rebuild opportunity. Skip unless niche." color="bg-neutral-400/15 text-neutral-500 border-neutral-400/30" />
          </div>
          <p><strong>What raises the score:</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li>No website at all (score: 100)</li>
            <li>Facebook page used as website (score: 95)</li>
            <li>Website broken or unreachable (score: 90)</li>
            <li>Built on Wix, GoDaddy Builder, or Weebly (+30 points)</li>
            <li>Low Lighthouse performance, SEO, or accessibility scores (+5–15 each)</li>
            <li>No mobile viewport (+15 points)</li>
            <li>Copyright year 5+ years old (+20 points)</li>
            <li>Unclaimed Google Business listing (+15 points)</li>
          </ul>
          <p><strong>What lowers the score:</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Built on Next.js or React (&minus;25 points — they already have a modern site)</li>
            <li>High Lighthouse scores across the board (&minus;10 points)</li>
            <li>Site blocked our scanner (score: 50 — needs manual review)</li>
          </ul>
        </Section>

        <Section id="results" icon={Target} title="Results Table">
          <p>The results page shows every business from your search, sorted by score. Here&apos;s what you can do there:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Click any row</strong> to see the lead detail with full enrichment, Lighthouse scores, AI pitch, and pipeline controls.</li>
            <li><strong>Sort any column</strong> — click the column header. Click again to reverse direction. Score is the default.</li>
            <li><strong>Status badges</strong> next to business names: <CheckCircle2 className="w-3 h-3 text-emerald-500 inline" /> means contacted (or further), <Bookmark className="w-3 h-3 text-[var(--color-accent)] inline" /> means saved to a list.</li>
            <li><strong>Tech column</strong> — color-coded chip showing the platform detected (Wix, WordPress, etc.) or &ldquo;No site&rdquo; in red.</li>
            <li><strong>Phone column</strong> — green <Phone className="w-3 h-3 text-emerald-500 inline" /> means a phone number was found.</li>
            <li><strong>Checkbox column</strong> — select rows for bulk actions (see below).</li>
          </ul>
        </Section>

        <Section id="enrichment" icon={Globe} title="Enrichment Data">
          <p>When you click into a lead, you see the full enrichment data our scanner collected:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Tech Stack</strong> — Wix, Squarespace, WordPress, GoDaddy, Weebly, Duda, Webflow, Shopify, Next.js, or React.</li>
            <li><strong>Emails</strong> — Categorized as &ldquo;business&rdquo; (matches the website domain or is a free provider) or &ldquo;developer&rdquo; (likely the agency that built the site).</li>
            <li><strong>Social Profiles</strong> — Facebook, Instagram, LinkedIn, Twitter/X, TikTok, YouTube.</li>
            <li><strong>Mobile Viewport</strong> <Smartphone className="w-3 h-3 text-[var(--color-text-dim)] inline" /> — Whether the site has a mobile viewport tag. &ldquo;Missing&rdquo; means not mobile-responsive.</li>
            <li><strong>Copyright Year</strong> <Clock className="w-3 h-3 text-[var(--color-text-dim)] inline" /> — The year in the copyright notice. &ldquo;2019&rdquo; means years of neglect.</li>
            <li><strong>Reachable</strong> <Shield className="w-3 h-3 text-[var(--color-text-dim)] inline" /> — Whether our scanner could access the site.</li>
          </ul>
        </Section>

        <Section id="lighthouse" icon={Gauge} title="Lighthouse Audits">
          <p>On every reachable site we run a <strong>Google Lighthouse audit</strong> covering Performance, SEO, and Accessibility. The three scores (0&ndash;100) appear on the lead detail page.</p>
          <p><strong>How to use them:</strong></p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Performance &lt; 50</strong> — Site is slow. Pitch angle: &ldquo;Your site takes 6+ seconds to load on mobile. That&apos;s losing you customers.&rdquo;</li>
            <li><strong>SEO &lt; 70</strong> — Missing meta tags, poor structure. Pitch angle: &ldquo;You&apos;re not showing up for local searches because the SEO basics aren&apos;t in place.&rdquo;</li>
            <li><strong>Accessibility &lt; 80</strong> — Color contrast issues, missing alt text, keyboard nav broken. Pitch angle: &ldquo;You&apos;re excluding customers with vision or motor impairments.&rdquo;</li>
          </ul>
          <p>The AI pitch generator reads these scores and automatically references specific low numbers in the draft email. Concrete numbers convert better than vague claims.</p>
        </Section>

        <Section id="pitches" icon={Sparkles} title="AI Pitches">
          <p>When you open a lead, our AI analyzes the enrichment data and generates three things:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Pitch Angle</strong> — A paragraph explaining why this specific business needs a new website, citing real data points (their tech stack, missing mobile support, low Lighthouse scores, stale content, etc.).</li>
            <li><strong>3 Improvement Suggestions</strong> — Specific, actionable things you could do for them, tied to the enrichment data.</li>
            <li><strong>Draft Outreach Email</strong> — A personalized cold email referencing their specific website issues. Uses your name, company, and services from your profile.</li>
          </ul>
          <p><strong>Pro tip:</strong> Fill out your <Link href="/settings" className="text-[var(--color-accent)] hover:underline">profile settings</Link> (name, company, services, years of experience) so the AI generates pitches that sound like you, not a template. A pitch signed by &ldquo;John at Smith Web Design with 8 years of experience&rdquo; converts better than &ldquo;[Your Name]&rdquo;.</p>
          <p>Pitches are cached — reopening a lead doesn&apos;t regenerate. Use <strong>Regenerate</strong> if you want a fresh version (costs one pitch against your monthly quota).</p>
        </Section>

        <Section id="pipeline" icon={TrendingUp} title="Outreach Pipeline">
          <p>Every lead you save lands in your built-in pipeline. From the lead detail page you can mark their status:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-4">
            <div className="p-3 rounded-lg border border-[var(--color-accent)]/20 bg-[var(--color-accent)]/5 text-xs">
              <strong className="text-[var(--color-accent)]">Saved</strong> — parked for later, no outreach yet
            </div>
            <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/5 text-xs">
              <strong className="text-amber-700">Contacted</strong> — email sent, waiting for a reply
            </div>
            <div className="p-3 rounded-lg border border-violet-500/30 bg-violet-500/5 text-xs">
              <strong className="text-violet-700">Replied</strong> — they responded, conversation active
            </div>
            <div className="p-3 rounded-lg border border-blue-500/30 bg-blue-500/5 text-xs">
              <strong className="text-blue-700">Quoted</strong> — you sent a proposal or estimate
            </div>
            <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 text-xs">
              <strong className="text-emerald-700">Signed</strong> — closed the deal. Log the amount.
            </div>
            <div className="p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-xs">
              <strong>Lost</strong> — they went another direction
            </div>
          </div>
          <p>When you mark a lead as Signed, you can enter the <strong>deal amount</strong> — so you can see which campaigns actually pay off.</p>
          <p>The pipeline is just status labels on saved leads — you don&apos;t need a separate CRM. Filter your results table by status to see who you&apos;ve already touched and who needs a follow-up.</p>
        </Section>

        <Section id="lists" icon={Bookmark} title="Saved Lists">
          <p>Organize your best leads into lists for different campaigns. Create lists from the <Link href="/lists" className="text-[var(--color-accent)] hover:underline">Saved Lists page</Link> or directly from a lead detail page.</p>
          <p><strong>Ideas for lists:</strong> &ldquo;Hot Dentists Austin&rdquo;, &ldquo;Wix sites I can undercut&rdquo;, &ldquo;No website — cold call this week&rdquo;, &ldquo;Q2 follow-ups&rdquo;.</p>
          <p>Deleting a list (or removing an item from one) gives you a 5-second undo window — no &ldquo;are you sure?&rdquo; dialog to click through. If you hit delete by accident, there&apos;s a toast at the bottom with an Undo button.</p>
        </Section>

        <Section id="bulk" icon={CheckSquare} title="Bulk Actions">
          <p>On the results table, use the <strong>checkbox column</strong> to select multiple leads at once. Select individual rows, or click the header checkbox to select everything currently visible (respects your active filters).</p>
          <p>As soon as you select one row, a <strong>floating action bar</strong> appears at the bottom with bulk actions:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Save to list</strong> — Add every selected lead to any list. Create a new list inline if you don&apos;t have one yet.</li>
            <li><strong>Mark contacted</strong> — Move every selected lead into the Contacted stage of the pipeline in one click.</li>
            <li><strong>Export</strong> — Download a CSV of only the selected rows (not the whole table).</li>
          </ul>
          <p>Bulk actions are built for outreach at scale — if you find yourself selecting 50 leads at a time, you&apos;re using the product right.</p>
        </Section>

        <Section id="filters" icon={Filter} title="Filters & Sort">
          <p>On the results page, click <strong>Filters</strong> (or press <Kbd>F</Kbd>) to narrow down your leads:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Minimum Score</strong> — Slider to show only leads above a threshold.</li>
            <li><strong>Has Phone / Email / Website</strong> — Filter by contact info availability.</li>
            <li><strong>Saved / Contacted</strong> — Filter by pipeline status.</li>
            <li><strong>Tech Stack</strong> — Filter by specific platforms (Wix, WordPress, etc.).</li>
          </ul>
          <p>Combine them to find exactly the slice you want: &ldquo;hot leads on Wix with a phone number that I haven&apos;t contacted yet&rdquo; in three clicks.</p>
          <p><strong>Export CSV</strong> <Download className="w-3 h-3 text-[var(--color-text-dim)] inline" /> — Downloads your current filtered results as a spreadsheet with all columns including phones and emails. Pro and Agency plans.</p>
        </Section>

        <Section id="shortcuts" icon={Command} title="Keyboard Shortcuts">
          <p>ByteBoundless is built for developers. Everything you do regularly has a keyboard shortcut.</p>
          <p><strong>Global:</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li><Kbd>⌘</Kbd> <Kbd>K</Kbd> — Open the command palette. Search leads, lists, past searches, and app pages from one box.</li>
            <li><Kbd>N</Kbd> — Start a new search</li>
            <li><Kbd>G</Kbd> <Kbd>D</Kbd> — Go to Dashboard</li>
            <li><Kbd>G</Kbd> <Kbd>L</Kbd> — Go to Lists</li>
            <li><Kbd>G</Kbd> <Kbd>S</Kbd> — Go to Settings</li>
            <li><Kbd>/</Kbd> — Focus the in-page search input, or open the command palette if there isn&apos;t one</li>
            <li><Kbd>?</Kbd> — Show the shortcuts overlay (everything listed here)</li>
            <li><Kbd>ESC</Kbd> — Close any modal, dropdown, or overlay</li>
          </ul>
          <p><strong>Results page:</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li><Kbd>F</Kbd> — Toggle the filters panel</li>
          </ul>
          <p>The <Kbd>?</Kbd> shortcut opens a reference overlay any time you forget — no need to bookmark this section.</p>
        </Section>

        <Section id="notifications" icon={Bell} title="Notifications">
          <p>Long searches can take a few minutes — especially large Statewide scrapes with enrichment enabled. You don&apos;t have to sit on the tab.</p>
          <p>By default, ByteBoundless sends you an email when a search finishes, with the result count and hot lead count. Click <strong>View Results</strong> in the email to jump straight to the results page.</p>
          <p>You can toggle this off under <Link href="/settings#notifications" className="text-[var(--color-accent)] hover:underline">Settings &rarr; Notifications</Link> if you don&apos;t want the email. In-app progress is always visible regardless.</p>
        </Section>

        <Section id="plans" icon={Crown} title="Plans & Billing">
          <p>ByteBoundless has three plans:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Free</strong> — 3 searches/month, 50 results each, 10 AI pitches/month. No saved lists or CSV export. Great for trying it out.</li>
            <li><strong>Pro ($29/mo)</strong> — 50 searches/month, 500 results each, 200 AI pitches/month, saved lists + outcome tracking, CSV export, Lighthouse audits.</li>
            <li><strong>Agency ($79/mo)</strong> — 200 searches/month, 1,000 results each, unlimited AI pitches, priority scraping.</li>
          </ul>
          <p><strong>Quotas reset on a rolling 30 days</strong> — not the calendar month. So if you signed up on the 10th, your quota resets on the 10th of next month.</p>
          <p><strong>Running out of a quota mid-month?</strong> You can buy <strong>overage credits</strong> — 200 extra results for $4 — from <Link href="/settings#billing" className="text-[var(--color-accent)] hover:underline">Settings &rarr; Billing</Link>. Overage credits apply to future searches and don&apos;t expire with your monthly reset.</p>
          <p><strong>Upgrade any time</strong> from Settings &rarr; Billing. Changes take effect immediately and Stripe prorates the difference.</p>
        </Section>

        <Section id="tips" icon={TrendingUp} title="Tips for Success">
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
              <p className="font-semibold text-[var(--color-text-primary)] mb-1">Start specific, not broad</p>
              <p>&ldquo;Emergency plumbers in Austin, TX&rdquo; beats &ldquo;businesses in Texas&rdquo;. Smaller searches give you higher-quality, more relevant leads.</p>
            </div>
            <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
              <p className="font-semibold text-[var(--color-text-primary)] mb-1">Prioritize scores 80+</p>
              <p>Use the score filter to hide everything below 80 and work the top of the list first. A Wix site from 2018 with no mobile viewport is a much easier sell than a WordPress site that just needs a refresh.</p>
            </div>
            <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
              <p className="font-semibold text-[var(--color-text-primary)] mb-1">Work leads in batches</p>
              <p>Select 20 leads with the checkboxes, mark them all contacted, and bulk-save them to a campaign list. Then batch your outreach in one sitting instead of clicking through one at a time.</p>
            </div>
            <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
              <p className="font-semibold text-[var(--color-text-primary)] mb-1">Use Lighthouse scores in your pitch</p>
              <p>Concrete numbers convert better than vague claims. &ldquo;Your site scores 34 on Lighthouse performance&rdquo; is more persuasive than &ldquo;your site is slow&rdquo;. The AI pitch does this automatically — lean into it.</p>
            </div>
            <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
              <p className="font-semibold text-[var(--color-text-primary)] mb-1">Use the AI pitch as a starting point</p>
              <p>The draft email is data-backed but generic in tone. Add your personality, mention a specific page on their site, or reference something local to make it feel human.</p>
            </div>
            <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
              <p className="font-semibold text-[var(--color-text-primary)] mb-1">Look for &ldquo;no website&rdquo; leads</p>
              <p>Businesses with no web presence at all (score: 100) are often the easiest to convert. They know they need a website — they just haven&apos;t found someone to build it.</p>
            </div>
            <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
              <p className="font-semibold text-[var(--color-text-primary)] mb-1">Track what closes</p>
              <p>When you sign a client, log the deal amount. Over time this tells you which categories, tech stacks, and score ranges actually pay off — so you can double down on what works.</p>
            </div>
            <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
              <p className="font-semibold text-[var(--color-text-primary)] mb-1">Fill out your profile</p>
              <p>Your name, company, services, and experience all get woven into AI-generated pitches. A pitch from &ldquo;John at Smith Web Design with 5+ years of experience&rdquo; converts better than one from &ldquo;[Your Name]&rdquo;.</p>
            </div>
          </div>
        </Section>
      </div>

      {/* CTA */}
      <div className="mt-16 text-center p-8 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-tertiary)]">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight mb-2">
          Ready to find your next client?
        </h2>
        <p className="text-sm text-[var(--color-text-secondary)] mb-6">
          Your first 3 searches are free. No credit card required.
        </p>
        <Link
          href="/search/new"
          className="inline-flex items-center gap-2 bg-[var(--color-accent)] text-white px-7 py-3 rounded-lg text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-all"
        >
          Start Searching <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
