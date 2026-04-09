import {
  Search, MapPin, Globe, Sparkles, Target, Star, Mail, Phone,
  Bookmark, CheckCircle2, Download, Filter, ArrowRight, Zap,
  TrendingUp, Users, Shield, Smartphone, Clock, BarChart3,
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
      <div className="text-sm text-[var(--color-text-secondary)] leading-relaxed space-y-4 ml-[52px]">
        {children}
      </div>
    </section>
  );
}

function ScoreExample({ score, label, color }: { score: number; label: string; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className={cn("inline-flex items-center justify-center w-10 h-7 rounded text-xs font-bold font-[family-name:var(--font-mono)] border", color)}>
        {score}
      </span>
      <span>{label}</span>
    </div>
  );
}

const TOC = [
  { id: "getting-started", label: "Getting Started" },
  { id: "searching", label: "Running a Search" },
  { id: "scores", label: "Understanding Lead Scores" },
  { id: "results", label: "Reading Results" },
  { id: "enrichment", label: "Enrichment Data" },
  { id: "pitches", label: "AI Pitches" },
  { id: "lists", label: "Saved Lists" },
  { id: "filters", label: "Filters & Export" },
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
          Everything you need to find, qualify, and pitch local businesses that need better websites.
        </p>
      </div>

      {/* Table of contents */}
      <nav className="mb-12 p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-tertiary)]">
        <p className="text-xs uppercase tracking-wider text-[var(--color-text-dim)] font-medium mb-3">Contents</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {TOC.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors flex items-center gap-2"
            >
              <ArrowRight className="w-3 h-3" />
              {item.label}
            </a>
          ))}
        </div>
      </nav>

      <div className="space-y-16">
        <Section id="getting-started" icon={Zap} title="Getting Started">
          <p>ByteBoundless helps freelance web developers find local businesses that need better websites. Here&apos;s the flow:</p>
          <ol className="list-decimal pl-5 space-y-2">
            <li><strong>Search</strong> — Enter a business type and location. We scrape Google Maps for every matching business.</li>
            <li><strong>Enrich</strong> — We visit each website, detect their tech stack, find emails, check if it&apos;s mobile-friendly, and look for staleness signals.</li>
            <li><strong>Score</strong> — Each business gets a 0-100 lead score based on how likely they need a website rebuild.</li>
            <li><strong>Pitch</strong> — Click any lead to get an AI-generated pitch angle, improvement suggestions, and a draft outreach email personalized with your profile info.</li>
          </ol>
          <p>Start by <Link href="/search/new" className="text-[var(--color-accent)] hover:underline">running your first search</Link>.</p>
        </Section>

        <Section id="searching" icon={Search} title="Running a Search">
          <p><strong>Business type:</strong> What kind of business are you looking for? Examples: &quot;dentist&quot;, &quot;lawn care&quot;, &quot;plumber&quot;, &quot;restaurant&quot;. The more specific, the better.</p>
          <p><strong>Location:</strong> City and state. Examples: &quot;Buford, GA&quot;, &quot;Austin, TX&quot;. Results are pulled from Google Maps for that area.</p>
          <p><strong>Options:</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Strict mode</strong> — Only returns businesses with a physical address in the target city. Filters out businesses that show up in Maps but are actually in neighboring cities.</li>
            <li><strong>Max results</strong> — How many listings to collect (25, 50, 100, or 200). More results = longer scrape time.</li>
            <li><strong>Enrich</strong> — When on, we visit each business&apos;s website to collect tech stack, emails, socials, and more. Turn off for a faster but less detailed search.</li>
          </ul>
        </Section>

        <Section id="scores" icon={BarChart3} title="Understanding Lead Scores">
          <p>Every business gets a <strong>lead score from 0 to 100</strong>. Higher = more likely to need your services. Here&apos;s what the ranges mean:</p>
          <div className="space-y-3 my-4">
            <ScoreExample score={85} label="Hot lead — outdated site builder, missing mobile, stale content. Reach out." color="bg-emerald-500/15 text-emerald-700 border-emerald-500/30" />
            <ScoreExample score={65} label="Warm lead — some issues found, worth investigating further." color="bg-amber-500/15 text-amber-700 border-amber-500/30" />
            <ScoreExample score={35} label="Cold — modern site, low rebuild opportunity. Skip unless niche." color="bg-neutral-400/15 text-neutral-500 border-neutral-400/30" />
          </div>
          <p><strong>What raises the score:</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li>No website at all (score: 100)</li>
            <li>Facebook page used as website (score: 95)</li>
            <li>Website broken or unreachable (score: 90)</li>
            <li>Built on Wix, GoDaddy Builder, or Weebly (+30 points)</li>
            <li>No mobile viewport (+15 points)</li>
            <li>Copyright year 5+ years old (+20 points)</li>
            <li>Unclaimed Google Business listing (+15 points)</li>
            <li>Slow page load (+10 points)</li>
          </ul>
          <p><strong>What lowers the score:</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Built on Next.js or React (-25 points — they already have a modern site)</li>
            <li>Site blocked our scanner (score: 50 — needs manual review)</li>
          </ul>
        </Section>

        <Section id="results" icon={Target} title="Reading Results">
          <p>The results table shows every business from your search, sorted by lead score (highest first). Here&apos;s what each column means:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Score</strong> — The 0-100 lead score. Green = hot, yellow = warm, gray = cold.</li>
            <li><strong>Business</strong> — Name, category, and address. A <CheckCircle2 className="w-3 h-3 text-emerald-500 inline" /> means you&apos;ve marked them as contacted. A <Bookmark className="w-3 h-3 text-[var(--color-accent)] inline" /> means they&apos;re saved to a list.</li>
            <li><strong>Tech</strong> — The platform their website is built on (Wix, WordPress, Squarespace, etc.). Color-coded for quick scanning.</li>
            <li><strong>Phone</strong> — Green <Phone className="w-3 h-3 text-emerald-500 inline" /> means a phone number was found.</li>
            <li><strong>Email</strong> — How many email addresses were found on their website.</li>
            <li><strong>Social</strong> — How many social media profiles were found.</li>
            <li><strong>Rating</strong> — Their Google Maps rating and review count.</li>
          </ul>
        </Section>

        <Section id="enrichment" icon={Globe} title="Enrichment Data">
          <p>When you click into a lead, you see the full enrichment data our scanner collected:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Tech Stack</strong> — The platform detected: Wix, Squarespace, WordPress, GoDaddy, Weebly, Duda, Webflow, Shopify, Next.js, or React.</li>
            <li><strong>Emails</strong> — Categorized as &quot;business&quot; (matches the website domain or is a free provider like Gmail) or &quot;developer&quot; (custom domain that doesn&apos;t match — likely the agency that built the site).</li>
            <li><strong>Social Profiles</strong> — Links to Facebook, Instagram, LinkedIn, Twitter/X, TikTok, and YouTube if found.</li>
            <li><strong>Mobile Viewport</strong> <Smartphone className="w-3 h-3 text-[var(--color-text-dim)] inline" /> — Whether the site has a mobile viewport meta tag. &quot;Missing&quot; means the site isn&apos;t mobile-responsive.</li>
            <li><strong>Copyright Year</strong> <Clock className="w-3 h-3 text-[var(--color-text-dim)] inline" /> — The year found in the copyright notice. 2019 means the site hasn&apos;t been updated in years.</li>
            <li><strong>Reachable</strong> <Shield className="w-3 h-3 text-[var(--color-text-dim)] inline" /> — Whether our scanner could access the site. &quot;No&quot; means the site is broken or blocked our request.</li>
          </ul>
        </Section>

        <Section id="pitches" icon={Sparkles} title="AI Pitches">
          <p>When you open a lead, our AI analyzes their enrichment data and generates:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Pitch Angle</strong> — A paragraph explaining why this specific business needs a new website, citing real data points (their tech stack, missing mobile support, stale content, etc.).</li>
            <li><strong>3 Improvement Suggestions</strong> — Specific, actionable things you could do for them, tied to their enrichment data.</li>
            <li><strong>Draft Outreach Email</strong> — A personalized cold email referencing their specific website issues. Uses your name, company, and services from your profile.</li>
          </ul>
          <p><strong>Pro tip:</strong> Fill out your <Link href="/settings" className="text-[var(--color-accent)] hover:underline">profile settings</Link> (name, company, services, experience) so the AI generates pitches that sound like you, not a template.</p>
          <p>Pitches are cached — reopening a lead doesn&apos;t regenerate. Use &quot;Regenerate&quot; if you want a fresh version.</p>
        </Section>

        <Section id="lists" icon={Bookmark} title="Saved Lists">
          <p>Organize your best leads into lists for different campaigns:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Create lists from the <Link href="/lists" className="text-[var(--color-accent)] hover:underline">Saved Lists page</Link> or directly from a lead detail page.</li>
            <li>Save a business to any list by clicking &quot;Save to List&quot; on their detail page.</li>
            <li>Mark businesses as &quot;Contacted&quot; to track your outreach progress.</li>
            <li>A <CheckCircle2 className="w-3 h-3 text-emerald-500 inline" /> appears next to contacted businesses in the results table.</li>
          </ul>
          <p><strong>Ideas for lists:</strong> &quot;Hot Leads - Dentists&quot;, &quot;Follow Up This Week&quot;, &quot;No Website - Cold Call&quot;, &quot;Wix Sites - Austin&quot;.</p>
        </Section>

        <Section id="filters" icon={Filter} title="Filters & Export">
          <p>On the results page, click <strong>Filters</strong> to narrow down your leads:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Minimum Score</strong> — Slider to show only leads above a threshold.</li>
            <li><strong>Has Phone / Has Email / Has Website</strong> — Filter by contact info availability.</li>
            <li><strong>Saved / Contacted</strong> — Show only leads you&apos;ve saved or reached out to.</li>
            <li><strong>Tech Stack</strong> — Filter by specific platforms (Wix, WordPress, etc.).</li>
          </ul>
          <p><strong>Export CSV</strong> <Download className="w-3 h-3 text-[var(--color-text-dim)] inline" /> — Downloads your current filtered results as a spreadsheet with all columns including phone numbers and email addresses.</p>
        </Section>

        <Section id="tips" icon={TrendingUp} title="Tips for Success">
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
              <p className="font-semibold text-[var(--color-text-primary)] mb-1">Start specific, not broad</p>
              <p>&quot;Dentists in Buford, GA&quot; beats &quot;businesses in Georgia&quot;. Smaller searches give you higher-quality, more relevant leads.</p>
            </div>
            <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
              <p className="font-semibold text-[var(--color-text-primary)] mb-1">Prioritize scores 80+</p>
              <p>These businesses have the clearest need. A Wix site from 2018 with no mobile viewport is a much easier sell than a WordPress site that just needs a refresh.</p>
            </div>
            <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
              <p className="font-semibold text-[var(--color-text-primary)] mb-1">Use the AI pitch as a starting point</p>
              <p>The draft email is data-backed but generic in tone. Add your personality, mention a specific page on their site, or reference something local to make it feel human.</p>
            </div>
            <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
              <p className="font-semibold text-[var(--color-text-primary)] mb-1">Look for &quot;no website&quot; leads</p>
              <p>Businesses with no web presence at all (score: 100) are often the easiest to convert. They know they need a website — they just haven&apos;t found someone to build it.</p>
            </div>
            <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
              <p className="font-semibold text-[var(--color-text-primary)] mb-1">Track your outreach</p>
              <p>Use &quot;Mark Contacted&quot; and saved lists to keep track of who you&apos;ve reached out to. This prevents duplicate emails and helps you follow up systematically.</p>
            </div>
            <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
              <p className="font-semibold text-[var(--color-text-primary)] mb-1">Fill out your profile</p>
              <p>Your name, company, services, and experience all get woven into AI-generated pitches. A pitch from &quot;John at Smith Web Design with 5+ years of experience&quot; converts better than one from &quot;[Your Name]&quot;.</p>
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
