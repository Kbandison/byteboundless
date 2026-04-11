// Ported from scrape-google-maps.js — logic preserved exactly as-is
// Only changes: TypeScript types, removed CLI/file I/O, added progress callback

import { chromium, type Page } from "playwright";

// ──────────────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────────────
const ENRICH_CONCURRENCY = 12;
const FETCH_TIMEOUT_MS = 10000;
const MAX_PAGES_PER_SITE = 3;

// Lighthouse / PageSpeed Insights API tuning.
// Mobile audits normally take 25-40s per request; a 20s timeout aborts
// before Google has a chance to respond. First try generous (45s),
// retry once at 60s for slow sites, then give up and move on. Without
// a GOOGLE_PSI_API_KEY you share the global public rate limit and
// will time out much more aggressively.
const PSI_TIMEOUT_MS = 45_000;
const PSI_RETRY_TIMEOUT_MS = 60_000;
const PSI_DELAY_BETWEEN_MS = 1500;

interface LighthouseScores {
  performance: number;
  seo: number;
  accessibility: number;
}

/**
 * Run a single Lighthouse audit with one retry on timeout. Returns
 * the scores on success, or null on any failure (timeout, HTTP error,
 * malformed response). Never throws — the caller is expected to
 * gracefully skip sites that can't be audited.
 */
async function runLighthouseAudit(url: string): Promise<LighthouseScores | null> {
  const psiKey = process.env.GOOGLE_PSI_API_KEY ? `&key=${process.env.GOOGLE_PSI_API_KEY}` : "";
  const psiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&category=performance&category=seo&category=accessibility&strategy=mobile${psiKey}`;

  async function attempt(timeoutMs: number): Promise<LighthouseScores | null | "timeout"> {
    try {
      const psiRes = await fetch(psiUrl, { signal: AbortSignal.timeout(timeoutMs) });
      if (!psiRes.ok) return null;
      const psi = await psiRes.json();
      const cats = psi.lighthouseResult?.categories;
      if (!cats) return null;
      return {
        performance: Math.round((cats.performance?.score ?? 0) * 100),
        seo: Math.round((cats.seo?.score ?? 0) * 100),
        accessibility: Math.round((cats.accessibility?.score ?? 0) * 100),
      };
    } catch (err) {
      // AbortError from the timeout signal — return a sentinel so the
      // caller knows to retry with a longer timeout
      if ((err as Error).name === "TimeoutError" || (err as Error).name === "AbortError") {
        return "timeout";
      }
      return null;
    }
  }

  const first = await attempt(PSI_TIMEOUT_MS);
  if (first === "timeout") {
    const second = await attempt(PSI_RETRY_TIMEOUT_MS);
    return second === "timeout" ? null : second;
  }
  return first;
}

export type SearchRadius = "city" | "nearby" | "region" | "statewide";

export interface ScrapeOptions {
  query: string;
  location: string;
  radius: SearchRadius;
  maxResults: number;
  enrich: boolean;
  /**
   * Whether to run Lighthouse audits during enrichment. Set to false
   * for free-plan users (Lighthouse is a Pro-tier feature per the
   * marketing pricing page). The search API decides this based on
   * the user's plan at job creation time and passes it through.
   *
   * Defaults to true if undefined so existing jobs in the queue from
   * before this flag existed still run as they did.
   */
  runLighthouse?: boolean;
  contexts?: number;
  scrolls?: number;
}

export interface RawBusiness {
  name: string | null;
  website: string | null;
  phone: string | null;
  address: string | null;
  hours: string | null;
  rating: string | null;
  reviews: string | null;
  category: string | null;
  unclaimed: boolean;
  mapsUrl: string;
  enrichment?: Record<string, unknown>;
  leadScore?: number;
  leadReasons?: string[];
}

// Progress callback. The optional `activity` string lets the scraper
// say what it's doing RIGHT NOW (e.g. "Visiting Joe's Plumbing"), which
// the worker writes to scrape_jobs.current_activity for the live
// ticker on the search progress page. Pass undefined for activity to
// leave the field as-is.
export type ProgressCallback = (
  phase: string,
  current: number,
  total: number,
  activity?: string
) => void | Promise<void>;

// Optional batch callback. When provided, the scraper invokes it with
// fully-scored business batches as they complete (every BATCH_SIZE
// businesses), so the worker can write them to the DB incrementally
// instead of waiting for the whole search to finish. The user-facing
// effect: results land in the database mid-search and are visible on
// the results page while the rest of the search continues.
export type BatchCallback = (batch: RawBusiness[]) => void | Promise<void>;

// How many fully-scored businesses we accumulate before flushing.
// 25 is small enough that the user sees the first batch quickly
// during long Lighthouse runs, but large enough to keep DB write
// volume reasonable.
const RESULTS_BATCH_SIZE = 25;

// ──────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const randomDelay = (min: number, max: number) =>
  sleep(Math.floor(Math.random() * (max - min)) + min);

function extractPlaceId(url: string): string | null {
  if (!url) return null;
  const m = url.match(/0x[a-f0-9]+:0x[a-f0-9]+/i);
  return m ? m[0] : null;
}

async function concurrentMap<T, R>(
  items: T[],
  fn: (item: T, idx: number) => Promise<R>,
  concurrency: number,
  onProgress?: (done: number, total: number) => void
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  let done = 0;
  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    async () => {
      while (next < items.length) {
        const idx = next++;
        try {
          results[idx] = await fn(items[idx], idx);
        } catch (err: unknown) {
          results[idx] = { error: (err as Error).message } as unknown as R;
        }
        done++;
        if (onProgress) onProgress(done, items.length);
      }
    }
  );
  await Promise.all(workers);
  return results;
}

// ──────────────────────────────────────────────────────────────────
// Tech stack detection
// ──────────────────────────────────────────────────────────────────
const TECH_SIGNATURES: Record<string, RegExp[]> = {
  Wix: [/static\.wixstatic\.com/i, /<meta\s+name="generator"\s+content="Wix\.com/i],
  Squarespace: [/static1\.squarespace\.com/i, /Static\.SQUARESPACE_CONTEXT/i],
  WordPress: [/wp-content\//i, /wp-includes\//i, /<meta\s+name="generator"\s+content="WordPress/i],
  Shopify: [/cdn\.shopify\.com/i, /Shopify\.theme/i],
  Webflow: [/assets\.website-files\.com/i, /webflow\.js/i, /<meta\s+content="Webflow/i],
  GoDaddyBuilder: [/img1\.wsimg\.com/i],
  Weebly: [/cdn2\.editmysite\.com/i, /weebly/i],
  Duda: [/irp\.cdn-website\.com/i, /dudaone/i],
  NextJS: [/__NEXT_DATA__/i, /\/_next\/static/i],
  React: [/__REACT_DEVTOOLS/i, /react-dom/i],
};

function detectTech(html: string): string[] {
  const detected: string[] = [];
  for (const [name, patterns] of Object.entries(TECH_SIGNATURES)) {
    if (patterns.some((p) => p.test(html))) detected.push(name);
  }
  return detected;
}

// ──────────────────────────────────────────────────────────────────
// Email + social extraction
// ──────────────────────────────────────────────────────────────────
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const EMAIL_BLOCKLIST = [
  "example.com", "sentry.io", "wixpress.com", "your-email", "youremail",
  "email@", "name@", "domain.com", "wix.com", ".png", ".jpg", ".jpeg",
  ".gif", ".webp", "sentry-next", "filler@", "you@email", "mysite.com",
  "@email.com", "@yourdomain", "test@test", "noreply@", "no-reply@",
  "donotreply@", "placeholder@", "sample@", "username@", "user@email",
  "godaddy.com", "wsimg.com", "squarespace.com",
];

const FREE_EMAIL_PROVIDERS = new Set([
  "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "aol.com",
  "icloud.com", "me.com", "mac.com", "live.com", "msn.com",
  "protonmail.com", "proton.me", "gmx.com", "mail.com", "yandex.com",
  "comcast.net", "verizon.net", "att.net", "sbcglobal.net", "bellsouth.net",
]);

function isValidEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  if ((email.match(/@/g) || []).length !== 1) return false;
  if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) return false;
  const lower = email.toLowerCase();
  if (EMAIL_BLOCKLIST.some((b) => lower.includes(b))) return false;
  return true;
}

function extractEmails(html: string): string[] {
  const found = new Set<string>();
  for (const m of html.matchAll(/mailto:([^"'?\s>]+)/gi)) {
    const candidate = m[1].toLowerCase().split("?")[0];
    if (isValidEmail(candidate)) found.add(candidate);
  }
  for (const e of html.match(EMAIL_REGEX) || []) {
    const lower = e.toLowerCase();
    if (isValidEmail(lower)) found.add(lower);
  }
  return [...found].slice(0, 10);
}

function getDomain(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

function categorizeEmails(emails: string[], websiteUrl: string) {
  const websiteDomain = getDomain(websiteUrl);
  const business: string[] = [];
  const developer: string[] = [];

  for (const email of emails) {
    const emailDomain = email.split("@")[1];
    if (!emailDomain) continue;
    if (websiteDomain && (emailDomain === websiteDomain || websiteDomain.endsWith(emailDomain) || emailDomain.endsWith(websiteDomain))) {
      business.push(email);
    } else if (FREE_EMAIL_PROVIDERS.has(emailDomain)) {
      business.push(email);
    } else {
      developer.push(email);
    }
  }
  return { business: business.slice(0, 5), developer: developer.slice(0, 3) };
}

const SOCIAL_PATTERNS: Record<string, RegExp> = {
  facebook: /https?:\/\/(?:www\.)?facebook\.com\/(?!sharer|share|dialog|tr\?)[a-zA-Z0-9._-]+\/?/i,
  instagram: /https?:\/\/(?:www\.)?instagram\.com\/(?!share|p\/|reel\/)[a-zA-Z0-9._-]+\/?/i,
  linkedin: /https?:\/\/(?:www\.)?linkedin\.com\/(?:company|in)\/[a-zA-Z0-9._-]+\/?/i,
  twitter: /https?:\/\/(?:www\.)?(?:twitter|x)\.com\/(?!share|intent)[a-zA-Z0-9._-]+\/?/i,
  tiktok: /https?:\/\/(?:www\.)?tiktok\.com\/@[a-zA-Z0-9._-]+\/?/i,
  youtube: /https?:\/\/(?:www\.)?youtube\.com\/(?:c|channel|user|@)[a-zA-Z0-9._/-]+\/?/i,
};

function extractSocials(html: string): Record<string, string> {
  const found: Record<string, string> = {};
  for (const [name, pattern] of Object.entries(SOCIAL_PATTERNS)) {
    const m = html.match(pattern);
    if (m) found[name] = m[0];
  }
  return found;
}

function extractContactPaths(html: string, baseUrl: string): string[] {
  const paths = new Set<string>();
  for (const m of html.matchAll(/href=["']([^"']+)["']/gi)) {
    const href = m[1];
    if (/\/(contact|about|contact-us|about-us|get-in-touch)(?:\/|$|\?|#)/i.test(href)) {
      try {
        const abs = new URL(href, baseUrl).href;
        if (abs.startsWith(new URL(baseUrl).origin)) paths.add(abs.split("#")[0]);
      } catch { /* skip */ }
    }
  }
  return [...paths].slice(0, 3);
}

// ──────────────────────────────────────────────────────────────────
// Website enrichment
// ──────────────────────────────────────────────────────────────────
async function fetchPage(url: string, signal: AbortSignal) {
  try {
    const start = Date.now();
    const res = await fetch(url, {
      signal,
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    const html = await res.text();
    return { ok: res.ok, status: res.status, finalUrl: res.url, html, loadMs: Date.now() - start, sizeKb: Math.round(html.length / 1024) };
  } catch (err: unknown) {
    return { ok: false, status: null, error: (err as Error).message, html: undefined, finalUrl: undefined, loadMs: undefined, sizeKb: undefined };
  }
}

async function enrichWebsite(business: RawBusiness): Promise<RawBusiness> {
  if (!business.website) return { ...business, enrichment: { skipped: "no_website" } };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const home = await fetchPage(business.website, controller.signal);

    if (!home.ok || !home.html) {
      const status = home.status;
      const isBlocked = status === 403 || status === 401 || status === 429 || status === 503;
      const isBroken = status === null || (status >= 500 && status !== 503) || status === 404 || status === 410;
      return { ...business, enrichment: { reachable: false, status, error: home.error, blocked: isBlocked, broken: isBroken } };
    }

    const html = home.html;
    const rawEmails = new Set(extractEmails(html));
    const socials = extractSocials(html);
    const tech = detectTech(html);

    const contactUrls = extractContactPaths(html, home.finalUrl || business.website);
    for (const url of contactUrls.slice(0, MAX_PAGES_PER_SITE - 1)) {
      const sub = await fetchPage(url, controller.signal);
      if (sub.ok && sub.html) {
        for (const e of extractEmails(sub.html)) rawEmails.add(e);
        const more = extractSocials(sub.html);
        for (const [k, v] of Object.entries(more)) if (!socials[k]) socials[k] = v;
      }
    }

    const { business: businessEmails, developer: devEmails } = categorizeEmails([...rawEmails], home.finalUrl || business.website);

    // Check for viewport meta tag — also check without quotes and with spaces
    const hasViewportMeta =
      /<meta[^>]+name\s*=\s*["']?viewport["']?/i.test(html) ||
      /<meta[^>]+content\s*=\s*["'][^"']*width\s*=/i.test(html);

    // Platforms that are responsive by default — viewport is injected via JS at runtime
    // and won't appear in the raw HTML fetch
    const RESPONSIVE_PLATFORMS = ["Wix", "Squarespace", "Shopify", "Webflow", "Duda", "NextJS", "React"];
    const isResponsivePlatform = tech.some((t) => RESPONSIVE_PLATFORMS.includes(t));

    const hasViewport = hasViewportMeta || isResponsivePlatform;
    const hasFavicon = /<link[^>]+rel=["'](?:icon|shortcut icon)["']/i.test(html);
    const hasOgImage = /<meta[^>]+property=["']og:image["']/i.test(html);
    const hasMetaDescription = /<meta[^>]+name=["']description["']/i.test(html);
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim().slice(0, 200) : null;
    const yearMatch = html.match(/(?:©|&copy;|copyright)[^\d]{0,10}(20\d{2})/i);
    const copyrightYear = yearMatch ? parseInt(yearMatch[1], 10) : null;
    const yearsStale = copyrightYear ? new Date().getFullYear() - copyrightYear : null;

    return {
      ...business,
      enrichment: {
        reachable: true, blocked: false, broken: false, status: home.status,
        finalUrl: home.finalUrl, loadMs: home.loadMs, sizeKb: home.sizeKb, title,
        emails: businessEmails, developerContacts: devEmails, socials, techStack: tech,
        copyrightYear, yearsStale, hasViewport, hasFavicon, hasOgImage, hasMetaDescription,
        pagesCrawled: 1 + contactUrls.length,
      },
    };
  } catch (err: unknown) {
    return { ...business, enrichment: { reachable: false, error: (err as Error).message, broken: true } };
  } finally {
    clearTimeout(timer);
  }
}

// ──────────────────────────────────────────────────────────────────
// Lead scoring
// ──────────────────────────────────────────────────────────────────
function computeLeadScore(business: RawBusiness): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  if (!business.website) return { score: 100, reasons: ["no website"] };
  if (/facebook\.com/.test(business.website)) return { score: 95, reasons: ["Facebook page as website"] };
  const e = business.enrichment as Record<string, unknown> | undefined;
  if (!e) return { score: 50, reasons: ["no enrichment data"] };
  if (e.broken) return { score: 90, reasons: ["website broken / unreachable"] };
  if (e.blocked) return { score: 50, reasons: ["site blocked scanner — manual review"] };
  if (!e.reachable) return { score: 50, reasons: ["unable to reach site"] };

  let score = 30;
  const tech = (e.techStack as string[]) || [];
  if (tech.includes("Wix")) { score += 30; reasons.push("Wix"); }
  if (tech.includes("Squarespace")) { score += 25; reasons.push("Squarespace"); }
  if (tech.includes("GoDaddyBuilder")) { score += 30; reasons.push("GoDaddy builder"); }
  if (tech.includes("Weebly")) { score += 30; reasons.push("Weebly"); }
  if (tech.includes("Duda")) { score += 25; reasons.push("Duda"); }
  if (tech.includes("WordPress")) { score += 10; reasons.push("WordPress"); }
  if (tech.includes("NextJS")) { score -= 25; reasons.push("modern Next.js"); }

  const yearsStale = e.yearsStale as number | null;
  if (yearsStale != null) {
    if (yearsStale >= 5) { score += 20; reasons.push(`${yearsStale}y stale`); }
    else if (yearsStale >= 3) { score += 10; reasons.push(`${yearsStale}y stale`); }
  }
  if (!e.hasViewport) { score += 15; reasons.push("not mobile-ready"); }
  if (!e.hasMetaDescription) { score += 5; reasons.push("no meta desc"); }
  if (!e.hasOgImage) { score += 3; reasons.push("no og:image"); }
  if ((e.loadMs as number) > 5000) { score += 10; reasons.push("slow load"); }
  if ((e.sizeKb as number) > 3000) { score += 5; reasons.push("heavy page"); }
  if (business.unclaimed) { score += 15; reasons.push("unclaimed listing"); }

  // Lighthouse signals
  const lh = e.lighthouse as { performance: number; seo: number; accessibility: number } | null;
  if (lh) {
    if (lh.performance < 50) { score += 10; reasons.push(`poor performance (${lh.performance}/100)`); }
    if (lh.seo < 70) { score += 5; reasons.push(`weak SEO (${lh.seo}/100)`); }
    if (lh.accessibility < 60) { score += 5; reasons.push(`accessibility issues (${lh.accessibility}/100)`); }
  }

  return { score: Math.min(100, Math.max(0, score)), reasons };
}

// ──────────────────────────────────────────────────────────────────
// Phase 1: Collect listing URLs
// ──────────────────────────────────────────────────────────────────
async function collectListingUrls(opts: ScrapeOptions): Promise<{ url: string; name: string | null }[]> {
  const browser = await chromium.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  });
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    viewport: { width: 1400, height: 900 },
  });
  const page = await context.newPage();

  // Build search query based on radius
  let searchTerm: string;
  let scrolls: number;

  const city = opts.location.split(",")[0].trim();
  const state = (opts.location.split(",")[1] || "").trim();

  switch (opts.radius) {
    case "city":
      searchTerm = `${opts.query} in ${opts.location}`;
      scrolls = opts.scrolls ?? 8;
      break;
    case "nearby":
      searchTerm = `${opts.query} near ${opts.location}`;
      scrolls = opts.scrolls ?? 12;
      break;
    case "region":
      // Use metro area phrasing for wider coverage
      searchTerm = `${opts.query} in ${city} area${state ? `, ${state}` : ""}`;
      scrolls = opts.scrolls ?? 18;
      break;
    case "statewide":
      searchTerm = `${opts.query} in ${state || opts.location}`;
      scrolls = opts.scrolls ?? 25;
      break;
    default:
      searchTerm = `${opts.query} in ${opts.location}`;
      scrolls = opts.scrolls ?? 10;
  }

  const url = `https://www.google.com/maps/search/${encodeURIComponent(searchTerm)}`;

  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('div[role="feed"]', { timeout: 15000 });

  let prev = 0;
  let stable = 0;
  for (let i = 0; i < scrolls; i++) {
    const h = await page.evaluate(() => {
      const f = document.querySelector('div[role="feed"]');
      if (f) f.scrollTop = f.scrollHeight;
      return f ? f.scrollHeight : 0;
    });
    if (h === prev) { stable++; if (stable >= 2) break; } else stable = 0;
    prev = h;
    await randomDelay(800, 1400);
  }

  const urls = await page.$$eval('div[role="feed"] a.hfpxzc', (els) =>
    els.map((el) => ({ url: (el as HTMLAnchorElement).href, name: el.getAttribute("aria-label") }))
  );

  await browser.close();
  return urls.slice(0, opts.maxResults);
}

// ──────────────────────────────────────────────────────────────────
// Phase 2: Parallel detail extraction
// ──────────────────────────────────────────────────────────────────
async function extractPlaceDetails(page: Page, listingUrl: string) {
  await page.goto(listingUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
  await page.waitForSelector("h1.DUwDvf, h1.lfPIob", { timeout: 8000 });
  await sleep(300);

  return await page.evaluate(() => {
    const h1 = document.querySelector("h1.DUwDvf, h1.lfPIob");
    const name = h1 ? h1.textContent?.trim() ?? null : null;
    const websiteEl = document.querySelector('a[data-item-id="authority"]') as HTMLAnchorElement | null;
    const website = websiteEl ? websiteEl.href : null;
    const phoneEl = document.querySelector('button[data-item-id^="phone:tel:"]');
    const phone = phoneEl ? phoneEl.getAttribute("data-item-id")?.replace("phone:tel:", "") ?? null : null;
    const addrEl = document.querySelector('button[data-item-id="address"]');
    const address = addrEl ? (addrEl.getAttribute("aria-label") || "").replace(/^Address:\s*/, "").trim() : null;
    const hoursEl = document.querySelector('div[aria-label*="hours"]');
    const hours = hoursEl ? (hoursEl.getAttribute("aria-label") || "").slice(0, 200) : null;
    let rating: string | null = null;
    let reviews: string | null = null;
    const ratingBlock = document.querySelector("div.F7nice");
    if (ratingBlock) {
      const rs = ratingBlock.querySelector('span[aria-hidden="true"]');
      rating = rs ? rs.textContent?.trim() ?? null : null;
      const rvs = ratingBlock.querySelector('span[aria-label*="review"]');
      if (rvs) { const m = rvs.getAttribute("aria-label")?.match(/[\d,]+/); reviews = m ? m[0].replace(/,/g, "") : null; }
    }
    const categoryEl = document.querySelector('button[jsaction*="category"]');
    const category = categoryEl ? categoryEl.textContent?.trim() ?? null : null;
    const claimEl = Array.from(document.querySelectorAll("button, a")).find((el) => /claim this business/i.test((el as HTMLElement).textContent || ""));
    const unclaimed = !!claimEl;
    return { name, website, phone, address, hours, rating, reviews, category, unclaimed };
  });
}

async function scrapeDetailsParallel(
  listings: { url: string; name: string | null }[],
  opts: ScrapeOptions,
  onProgress: ProgressCallback
): Promise<RawBusiness[]> {
  const browser = await chromium.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  });
  const businesses: RawBusiness[] = [];
  const seenIds = new Set<string>();
  const contexts = opts.contexts ?? 3;
  const targetCity = opts.location.split(",")[0].trim().toLowerCase();
  const targetState = (opts.location.split(",")[1] || "").trim().toLowerCase();

  // Single context to avoid Google rate limiting (fewer stuck pages = actually faster)
  const actualContexts = 1;
  let cursor = 0;
  const workers = Array.from({ length: Math.min(actualContexts, listings.length) }, async () => {
    const context = await browser.newContext({
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      viewport: { width: 1400, height: 900 },
    });
    const page = await context.newPage();

    while (cursor < listings.length) {
      const idx = cursor++;
      const listing = listings[idx];

      // Hard 25s timeout per listing to prevent hanging
      const listingTimeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 25000));

      const result = await Promise.race([
        (async () => {
          for (let attempt = 0; attempt < 2; attempt++) {
            try {
              const details = await extractPlaceDetails(page, listing.url);
              const placeId = extractPlaceId(listing.url);
              if (placeId && seenIds.has(placeId)) return null;

              if (opts.radius === "city" && details.address) {
                const parts = details.address.split(",").map((s: string) => s.trim());
                const city = parts.length >= 2 ? parts[parts.length - 2].toLowerCase() : "";
                const stateZip = parts.length >= 1 ? parts[parts.length - 1].toLowerCase() : "";
                if (city !== targetCity || (targetState && !stateZip.includes(targetState))) return null;
              }

              return details;
            } catch {
              if (attempt === 0) { await sleep(1500); continue; }
            }
          }
          return null;
        })(),
        listingTimeout,
      ]);

      if (result) {
        const placeId = extractPlaceId(listing.url);
        if (placeId) seenIds.add(placeId);
        businesses.push({ ...result, mapsUrl: listing.url });
      }
      // Activity ticker — what we just extracted. Falls back to the
      // listing URL if the result didn't have a name (rare).
      const activity = result?.name
        ? `Extracting ${result.name}${result.address ? ` (${result.address.split(",")[0]})` : ""}`
        : `Extracting listing ${idx + 1}`;
      onProgress("extracting", idx + 1, listings.length, activity);

      // Small delay between listings to avoid rate limiting
      await sleep(300);
    }
    await context.close();
  });

  await Promise.all(workers);
  await browser.close();
  return businesses;
}

// ──────────────────────────────────────────────────────────────────
// Reverse mode: enrich a list of URLs directly (skip Google Maps)
// ──────────────────────────────────────────────────────────────────
export async function runUrlEnrich(
  urls: string[],
  onProgress: ProgressCallback,
  runLighthouse = true,
  onBatch?: BatchCallback
): Promise<RawBusiness[]> {
  // Build minimal business records from URLs
  const businesses: RawBusiness[] = urls.map((url) => {
    // Extract a readable name from the URL
    let name: string;
    try {
      const hostname = new URL(url.startsWith("http") ? url : `https://${url}`).hostname;
      name = hostname.replace(/^www\./, "").split(".")[0].replace(/-/g, " ");
      name = name.charAt(0).toUpperCase() + name.slice(1);
    } catch {
      name = url;
    }
    return {
      name,
      website: url.startsWith("http") ? url : `https://${url}`,
      phone: null, address: null, hours: null, rating: null,
      reviews: null, category: null, unclaimed: false,
      mapsUrl: "",
    };
  });

  // Phase: Enrich
  onProgress("enriching", 0, businesses.length);
  const enriched = await concurrentMap(
    businesses,
    async (b) => enrichWebsite(b),
    ENRICH_CONCURRENCY,
    (done, total) => onProgress("enriching", done, total)
  );

  // Lighthouse + score + batched flush in one fused loop. Same
  // pattern as runScrape() — see that function for the rationale.
  // Gated behind `runLighthouse` so free-plan users skip Lighthouse
  // (Pro+ feature) but still get scored and flushed incrementally.
  const scored: RawBusiness[] = [];
  const batchBuffer: RawBusiness[] = [];

  for (let i = 0; i < enriched.length; i++) {
    const b = enriched[i];

    if (runLighthouse) {
      const e = b.enrichment as Record<string, unknown> | undefined;
      const url = (e?.finalUrl as string) || b.website;
      if (url && e?.reachable) {
        const lh = await runLighthouseAudit(url);
        if (lh) (e as Record<string, unknown>).lighthouse = lh;
        await sleep(PSI_DELAY_BETWEEN_MS);
      }
    }

    // Score + buffer + flush
    const { score, reasons } = computeLeadScore(b);
    const scoredBusiness = { ...b, leadScore: score, leadReasons: reasons };
    scored.push(scoredBusiness);
    batchBuffer.push(scoredBusiness);

    const activity = `Scoring ${b.name}`;
    await onProgress("scoring", i + 1, enriched.length, activity);

    if (onBatch && batchBuffer.length >= RESULTS_BATCH_SIZE) {
      const batch = batchBuffer.splice(0);
      console.log(`[Scraper/url] Flushing batch of ${batch.length} (${i + 1}/${enriched.length} done)`);
      await onBatch(batch);
    }
  }

  // Final flush
  if (onBatch && batchBuffer.length > 0) {
    const batch = batchBuffer.splice(0);
    console.log(`[Scraper/url] Flushing final batch of ${batch.length}`);
    await onBatch(batch);
  }

  scored.sort((a, b) => (b.leadScore || 0) - (a.leadScore || 0));
  await onProgress("done", scored.length, scored.length, undefined);
  return scored;
}

// ──────────────────────────────────────────────────────────────────
// Main scrape pipeline — called by the polling loop
// ──────────────────────────────────────────────────────────────────
export async function runScrape(
  opts: ScrapeOptions,
  onProgress: ProgressCallback,
  onBatch?: BatchCallback
): Promise<RawBusiness[]> {
  // Phase 1: Collect
  onProgress("collecting", 0, 0);
  const listingUrls = await collectListingUrls(opts);
  onProgress("collecting", listingUrls.length, listingUrls.length);

  // Phase 2: Extract
  onProgress("extracting", 0, listingUrls.length);
  const businesses = await scrapeDetailsParallel(listingUrls, opts, onProgress);

  // Phase 3: Enrich
  let enriched = businesses;
  if (opts.enrich) {
    onProgress("enriching", 0, businesses.length);
    enriched = await concurrentMap(
      businesses,
      async (b) => enrichWebsite(b),
      ENRICH_CONCURRENCY,
      (done, total) => onProgress("enriching", done, total)
    );
  }

  // Phase 3.5 + 4 fused: Lighthouse + score + flush in batches.
  // Previously this was two separate passes (Lighthouse loop, then a
  // separate scoring map at the end), which meant results only landed
  // in the DB after EVERY business finished its Lighthouse audit.
  // Lighthouse can take 10+ minutes for a 200-result search, so the
  // user saw nothing until the very end.
  //
  // Now each business is fully scored as soon as its Lighthouse audit
  // completes, and we flush in batches of RESULTS_BATCH_SIZE so the
  // user sees results land mid-search. The first batch typically
  // arrives within ~2 minutes of search start.
  const shouldRunLighthouse = opts.enrich && opts.runLighthouse !== false;
  const reachableCount = enriched.filter(
    (b) => (b.enrichment as Record<string, unknown> | undefined)?.reachable
  ).length;
  if (shouldRunLighthouse) {
    const hasKey = Boolean(process.env.GOOGLE_PSI_API_KEY);
    console.log(
      `[Scraper] Running Lighthouse audits for ${reachableCount} reachable sites${hasKey ? "" : " (no GOOGLE_PSI_API_KEY — using public rate limit)"}`
    );
  }

  const scored: RawBusiness[] = [];
  const batchBuffer: RawBusiness[] = [];
  let lhSucceeded = 0;
  let lhFailed = 0;

  for (let i = 0; i < enriched.length; i++) {
    const b = enriched[i];

    // Lighthouse pass (if enabled and reachable)
    if (shouldRunLighthouse) {
      const e = b.enrichment as Record<string, unknown> | undefined;
      const url = (e?.finalUrl as string) || b.website;
      if (url && e?.reachable) {
        const lh = await runLighthouseAudit(url);
        if (lh) {
          (b.enrichment as Record<string, unknown>).lighthouse = lh;
          lhSucceeded++;
          console.log(`[Lighthouse] ${b.name}: perf=${lh.performance} seo=${lh.seo} a11y=${lh.accessibility}`);
        } else {
          lhFailed++;
          console.log(`[Lighthouse] ${b.name}: failed (timeout or API error)`);
        }
        await sleep(PSI_DELAY_BETWEEN_MS);
      }
    }

    // Score this business now that it has all its enrichment data
    const { score, reasons } = computeLeadScore(b);
    const scoredBusiness = { ...b, leadScore: score, leadReasons: reasons };
    scored.push(scoredBusiness);
    batchBuffer.push(scoredBusiness);

    // Activity ticker — what the worker is currently working on. The
    // throttler in the worker decides how often this actually hits
    // the DB.
    const activity = `Scoring ${b.name}${b.address ? ` (${b.address.split(",")[0]})` : ""}`;
    await onProgress("scoring", i + 1, enriched.length, activity);

    // Flush full batches as we go
    if (onBatch && batchBuffer.length >= RESULTS_BATCH_SIZE) {
      const batch = batchBuffer.splice(0);
      console.log(`[Scraper] Flushing batch of ${batch.length} (${i + 1}/${enriched.length} done)`);
      await onBatch(batch);
    }
  }

  // Final flush — anything left in the buffer that didn't fill a full
  // batch goes to the DB now.
  if (onBatch && batchBuffer.length > 0) {
    const batch = batchBuffer.splice(0);
    console.log(`[Scraper] Flushing final batch of ${batch.length}`);
    await onBatch(batch);
  }

  if (shouldRunLighthouse) {
    console.log(`[Scraper] Lighthouse pass done: ${lhSucceeded} succeeded, ${lhFailed} failed`);
  }

  // Sort the in-memory copy by score for the return value (so logs
  // and any non-batched callers still see the sorted list). The
  // already-flushed DB rows are NOT re-ordered — the results page
  // sorts on display anyway.
  scored.sort((a, b) => (b.leadScore || 0) - (a.leadScore || 0));

  await onProgress("done", scored.length, scored.length, undefined);
  return scored;
}
