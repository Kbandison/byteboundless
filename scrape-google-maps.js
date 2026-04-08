// scrape-google-maps.js
// Lead intelligence scraper: Google Maps + website enrichment + scoring
//
// Usage:
//   node scrape-google-maps.js --query "lawn care" --location "Buford, GA" --strict
//   node scrape-google-maps.js -q "plumbers" -l "Atlanta, GA" --no-enrich
//   node scrape-google-maps.js -q "dentists" -l "Buford, GA" --resume
//
// Requires Node 18+ (built-in fetch)

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ENRICH_CONCURRENCY = 8;
const MAPS_CONCURRENCY = 3;
const FETCH_TIMEOUT_MS = 12000;
const MAX_PAGES_PER_SITE = 4;
const CHECKPOINT_DIR = '.checkpoints';

// ──────────────────────────────────────────────────────────────────
// CLI
// ──────────────────────────────────────────────────────────────────
function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    query: null, location: null, scrolls: 10, strict: false,
    headless: false, output: 'results', enrich: true, resume: false,
    contexts: MAPS_CONCURRENCY,
  };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i], next = args[i + 1];
    switch (arg) {
      case '-q': case '--query': opts.query = next; i++; break;
      case '-l': case '--location': opts.location = next; i++; break;
      case '-s': case '--scrolls': opts.scrolls = parseInt(next, 10); i++; break;
      case '--strict': opts.strict = true; break;
      case '--headless': opts.headless = true; break;
      case '-o': case '--output': opts.output = next; i++; break;
      case '--no-enrich': opts.enrich = false; break;
      case '--resume': opts.resume = true; break;
      case '--contexts': opts.contexts = parseInt(next, 10); i++; break;
      case '-h': case '--help': printHelp(); process.exit(0);
    }
  }
  if (!opts.query || !opts.location) {
    console.error('Error: --query and --location are required\n');
    printHelp(); process.exit(1);
  }
  return opts;
}

function printHelp() {
  console.log(`
Lead Intelligence Scraper

Usage:
  node scrape-google-maps.js -q "lawn care" -l "Buford, GA" [options]

Required:
  -q, --query <string>      Search term
  -l, --location <string>   Location to search

Options:
  -s, --scrolls <n>         Max scroll passes (default: 10)
  --strict                  Only keep results in target city
  --headless                Run browser invisible
  --no-enrich               Skip website enrichment phase
  --resume                  Resume from last checkpoint
  --contexts <n>            Parallel browser contexts (default: 3)
  -o, --output <prefix>     Output filename prefix
  -h, --help                Show this help
`);
}

// ──────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const randomDelay = (min, max) => sleep(Math.floor(Math.random() * (max - min)) + min);

function extractPlaceId(url) {
  if (!url) return null;
  const m = url.match(/0x[a-f0-9]+:0x[a-f0-9]+/i);
  return m ? m[0] : null;
}

function checkpointPath(query, location) {
  if (!fs.existsSync(CHECKPOINT_DIR)) fs.mkdirSync(CHECKPOINT_DIR, { recursive: true });
  const key = `${query}-${location}`.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  return path.join(CHECKPOINT_DIR, `${key}.json`);
}
function loadCheckpoint(q, l) {
  const p = checkpointPath(q, l);
  if (fs.existsSync(p)) { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; } }
  return null;
}
function saveCheckpoint(q, l, data) {
  fs.writeFileSync(checkpointPath(q, l), JSON.stringify(data, null, 2));
}
function clearCheckpoint(q, l) {
  const p = checkpointPath(q, l);
  if (fs.existsSync(p)) fs.unlinkSync(p);
}

async function concurrentMap(items, fn, concurrency, onProgress) {
  const results = new Array(items.length);
  let next = 0, done = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (next < items.length) {
      const idx = next++;
      try { results[idx] = await fn(items[idx], idx); }
      catch (err) { results[idx] = { error: err.message }; }
      done++;
      if (onProgress) onProgress(done, items.length);
    }
  });
  await Promise.all(workers);
  return results;
}

// ──────────────────────────────────────────────────────────────────
// Tech stack detection
// ──────────────────────────────────────────────────────────────────
const TECH_SIGNATURES = {
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
  jQuery: [/jquery[.-]\d/i],
};

function detectTech(html) {
  const detected = [];
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
  'example.com', 'sentry.io', 'wixpress.com', 'your-email', 'youremail',
  'email@', 'name@', 'domain.com', 'wix.com', '.png', '.jpg', '.jpeg',
  '.gif', '.webp', 'sentry-next', 'filler@', 'you@email', 'mysite.com',
  '@email.com', '@yourdomain', 'test@test', 'noreply@', 'no-reply@',
  'donotreply@', 'placeholder@', 'sample@', 'username@', 'user@email',
  'godaddy.com', 'wsimg.com', 'squarespace.com',
];

const FREE_EMAIL_PROVIDERS = new Set([
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com',
  'icloud.com', 'me.com', 'mac.com', 'live.com', 'msn.com',
  'protonmail.com', 'proton.me', 'gmx.com', 'mail.com', 'yandex.com',
  'comcast.net', 'verizon.net', 'att.net', 'sbcglobal.net', 'bellsouth.net',
]);

function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  // Exactly one @ sign
  if ((email.match(/@/g) || []).length !== 1) return false;
  // Standard email shape
  if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) return false;
  // Blocklist check
  const lower = email.toLowerCase();
  if (EMAIL_BLOCKLIST.some((b) => lower.includes(b))) return false;
  return true;
}

function extractEmails(html) {
  const found = new Set();
  // mailto links — but validate the captured value
  for (const m of html.matchAll(/mailto:([^"'?\s>]+)/gi)) {
    const candidate = m[1].toLowerCase().split('?')[0]; // strip ?subject= etc
    if (isValidEmail(candidate)) found.add(candidate);
  }
  // Plain-text emails in HTML
  for (const e of (html.match(EMAIL_REGEX) || [])) {
    const lower = e.toLowerCase();
    if (isValidEmail(lower)) found.add(lower);
  }
  return [...found].slice(0, 10); // bumped to 10 since we'll split into two buckets
}

function getDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return null;
  }
}

function categorizeEmails(emails, websiteUrl) {
  const websiteDomain = getDomain(websiteUrl);
  const business = [];
  const developer = [];

  for (const email of emails) {
    const emailDomain = email.split('@')[1];
    if (!emailDomain) continue;

    // Match website domain → definitely business
    if (websiteDomain && (emailDomain === websiteDomain || websiteDomain.endsWith(emailDomain) || emailDomain.endsWith(websiteDomain))) {
      business.push(email);
    }
    // Free providers → likely the owner's personal/business email
    else if (FREE_EMAIL_PROVIDERS.has(emailDomain)) {
      business.push(email);
    }
    // Custom domain that doesn't match → likely the dev/agency
    else {
      developer.push(email);
    }
  }
  return { business: business.slice(0, 5), developer: developer.slice(0, 3) };
}

const SOCIAL_PATTERNS = {
  facebook: /https?:\/\/(?:www\.)?facebook\.com\/(?!sharer|share|dialog|tr\?)[a-zA-Z0-9._-]+\/?/i,
  instagram: /https?:\/\/(?:www\.)?instagram\.com\/(?!share|p\/|reel\/)[a-zA-Z0-9._-]+\/?/i,
  linkedin: /https?:\/\/(?:www\.)?linkedin\.com\/(?:company|in)\/[a-zA-Z0-9._-]+\/?/i,
  twitter: /https?:\/\/(?:www\.)?(?:twitter|x)\.com\/(?!share|intent)[a-zA-Z0-9._-]+\/?/i,
  tiktok: /https?:\/\/(?:www\.)?tiktok\.com\/@[a-zA-Z0-9._-]+\/?/i,
  youtube: /https?:\/\/(?:www\.)?youtube\.com\/(?:c|channel|user|@)[a-zA-Z0-9._/-]+\/?/i,
};

function extractSocials(html) {
  const found = {};
  for (const [name, pattern] of Object.entries(SOCIAL_PATTERNS)) {
    const m = html.match(pattern);
    if (m) found[name] = m[0];
  }
  return found;
}

function extractContactPaths(html, baseUrl) {
  const paths = new Set();
  for (const m of html.matchAll(/href=["']([^"']+)["']/gi)) {
    const href = m[1];
    if (/\/(contact|about|contact-us|about-us|get-in-touch)(?:\/|$|\?|#)/i.test(href)) {
      try {
        const abs = new URL(href, baseUrl).href;
        if (abs.startsWith(new URL(baseUrl).origin)) paths.add(abs.split('#')[0]);
      } catch {}
    }
  }
  return [...paths].slice(0, 3);
}

// ──────────────────────────────────────────────────────────────────
// Website enrichment
// ──────────────────────────────────────────────────────────────────
async function fetchPage(url, signal) {
  try {
    const start = Date.now();
    const res = await fetch(url, {
      signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"macOS"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
      },
    });
    const html = await res.text();
    return {
      ok: res.ok, status: res.status, finalUrl: res.url, html,
      loadMs: Date.now() - start, sizeKb: Math.round(html.length / 1024),
    };
  } catch (err) {
    return { ok: false, status: null, error: err.message };
  }
}

async function enrichWebsite(business) {
  if (!business.website) return { ...business, enrichment: { skipped: 'no_website' } };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const home = await fetchPage(business.website, controller.signal);

    // Distinguish "we got blocked" from "site is actually broken"
    if (!home.ok || !home.html) {
      const status = home.status;
      const isBlocked = status === 403 || status === 401 || status === 429 || status === 503;
      const isBroken = status === null || (status >= 500 && status !== 503) || status === 404 || status === 410;

      return {
        ...business,
        enrichment: {
          reachable: false,
          status,
          error: home.error,
          blocked: isBlocked,
          broken: isBroken,
        },
      };
    }

    const html = home.html;
    const rawEmails = new Set(extractEmails(html));
    const socials = extractSocials(html);
    const tech = detectTech(html);

    // Multi-page crawl
    const contactUrls = extractContactPaths(html, home.finalUrl || business.website);
    for (const url of contactUrls.slice(0, MAX_PAGES_PER_SITE - 1)) {
      const sub = await fetchPage(url, controller.signal);
      if (sub.ok && sub.html) {
        for (const e of extractEmails(sub.html)) rawEmails.add(e);
        const more = extractSocials(sub.html);
        for (const [k, v] of Object.entries(more)) if (!socials[k]) socials[k] = v;
      }
    }

    // Categorize emails into business vs developer/agency
    const { business: businessEmails, developer: devEmails } = categorizeEmails(
      [...rawEmails],
      home.finalUrl || business.website
    );

    const hasViewport = /<meta[^>]+name=["']viewport["']/i.test(html);
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
        reachable: true,
        blocked: false,
        broken: false,
        status: home.status,
        finalUrl: home.finalUrl,
        loadMs: home.loadMs,
        sizeKb: home.sizeKb,
        title,
        emails: businessEmails,
        developerContacts: devEmails,
        socials,
        techStack: tech,
        copyrightYear,
        yearsStale,
        hasViewport, hasFavicon, hasOgImage, hasMetaDescription,
        pagesCrawled: 1 + contactUrls.length,
      },
    };
  } catch (err) {
    return { ...business, enrichment: { reachable: false, error: err.message, broken: true } };
  } finally {
    clearTimeout(timer);
  }
}

// ──────────────────────────────────────────────────────────────────
// Lead scoring
// ──────────────────────────────────────────────────────────────────
function computeLeadScore(business) {
  const reasons = [];
  if (!business.website) return { score: 100, reasons: ['no website'] };
  if (/facebook\.com/.test(business.website)) {
    return { score: 95, reasons: ['Facebook page as website'] };
  }
  const e = business.enrichment;
  if (!e) return { score: 50, reasons: ['no enrichment data'] };

  // Genuinely broken site = strong signal
  if (e.broken) return { score: 90, reasons: ['website broken / unreachable'] };

  // Site blocked us — we can't assess. Park in middle, flag for manual review.
  if (e.blocked) return { score: 50, reasons: ['site blocked scanner — manual review'] };

  if (!e.reachable) return { score: 50, reasons: ['unable to reach site'] };

  // Normal scoring path
  let score = 30;
  const tech = e.techStack || [];
  if (tech.includes('Wix')) { score += 30; reasons.push('Wix'); }
  if (tech.includes('Squarespace')) { score += 25; reasons.push('Squarespace'); }
  if (tech.includes('GoDaddyBuilder')) { score += 30; reasons.push('GoDaddy builder'); }
  if (tech.includes('Weebly')) { score += 30; reasons.push('Weebly'); }
  if (tech.includes('Duda')) { score += 25; reasons.push('Duda'); }
  if (tech.includes('WordPress')) { score += 10; reasons.push('WordPress'); }
  if (tech.includes('NextJS')) { score -= 25; reasons.push('modern Next.js'); }

  if (e.yearsStale != null) {
    if (e.yearsStale >= 5) { score += 20; reasons.push(`${e.yearsStale}y stale`); }
    else if (e.yearsStale >= 3) { score += 10; reasons.push(`${e.yearsStale}y stale`); }
  }
  if (!e.hasViewport) { score += 15; reasons.push('not mobile-ready'); }
  if (!e.hasMetaDescription) { score += 5; reasons.push('no meta desc'); }
  if (!e.hasOgImage) { score += 3; reasons.push('no og:image'); }
  if (e.loadMs > 5000) { score += 10; reasons.push('slow load'); }
  if (e.sizeKb > 3000) { score += 5; reasons.push('heavy page'); }
  if (business.unclaimed) { score += 15; reasons.push('unclaimed listing'); }

  return { score: Math.min(100, Math.max(0, score)), reasons };
}

// ──────────────────────────────────────────────────────────────────
// Phase 1: Collect listing URLs
// ──────────────────────────────────────────────────────────────────
async function collectListingUrls(opts) {
  const browser = await chromium.launch({ headless: opts.headless });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1400, height: 900 },
  });
  const page = await context.newPage();
  const searchTerm = `${opts.query} in ${opts.location}`;
  const url = `https://www.google.com/maps/search/${encodeURIComponent(searchTerm)}`;

  console.log(`\n🔍 Phase 1: Collecting listings for "${searchTerm}"`);
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('div[role="feed"]', { timeout: 15000 });

  let prev = 0, stable = 0;
  for (let i = 0; i < opts.scrolls; i++) {
    const h = await page.evaluate(() => {
      const f = document.querySelector('div[role="feed"]');
      if (f) f.scrollTop = f.scrollHeight;
      return f ? f.scrollHeight : 0;
    });
    if (h === prev) { stable++; if (stable >= 2) break; } else stable = 0;
    prev = h;
    await randomDelay(1200, 2000);
  }

  const urls = await page.$$eval('div[role="feed"] a.hfpxzc', (els) =>
    els.map((el) => ({ url: el.href, name: el.getAttribute('aria-label') }))
  );

  await browser.close();
  console.log(`   Collected ${urls.length} listing URLs\n`);
  return urls;
}

// ──────────────────────────────────────────────────────────────────
// Phase 2: Parallel detail extraction
// ──────────────────────────────────────────────────────────────────
async function extractPlaceDetails(page, listingUrl) {
  await page.goto(listingUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForSelector('h1.DUwDvf, h1.lfPIob', { timeout: 10000 });
  await sleep(400);

  return await page.evaluate(() => {
    const h1 = document.querySelector('h1.DUwDvf, h1.lfPIob');
    const name = h1 ? h1.innerText.trim() : null;

    const websiteEl = document.querySelector('a[data-item-id="authority"]');
    const website = websiteEl ? websiteEl.href : null;

    const phoneEl = document.querySelector('button[data-item-id^="phone:tel:"]');
    const phone = phoneEl ? phoneEl.getAttribute('data-item-id').replace('phone:tel:', '') : null;

    const addrEl = document.querySelector('button[data-item-id="address"]');
    const address = addrEl ? (addrEl.getAttribute('aria-label') || '').replace(/^Address:\s*/, '').trim() : null;

    const hoursEl = document.querySelector('div[aria-label*="hours"]');
    const hours = hoursEl ? (hoursEl.getAttribute('aria-label') || '').slice(0, 200) : null;

    let rating = null, reviews = null;
    const ratingBlock = document.querySelector('div.F7nice');
    if (ratingBlock) {
      const rs = ratingBlock.querySelector('span[aria-hidden="true"]');
      rating = rs ? rs.innerText.trim() : null;
      const rvs = ratingBlock.querySelector('span[aria-label*="review"]');
      if (rvs) {
        const m = rvs.getAttribute('aria-label').match(/[\d,]+/);
        reviews = m ? m[0].replace(/,/g, '') : null;
      }
    }

    const categoryEl = document.querySelector('button[jsaction*="category"]');
    const category = categoryEl ? categoryEl.innerText.trim() : null;

    const claimEl = Array.from(document.querySelectorAll('button, a')).find(
      (el) => /claim this business/i.test(el.innerText || '')
    );
    const unclaimed = !!claimEl;

    return { name, website, phone, address, hours, rating, reviews, category, unclaimed };
  });
}

async function scrapeDetailsParallel(listings, opts, existing = []) {
  const browser = await chromium.launch({ headless: opts.headless });
  const seenIds = new Set(existing.map((r) => extractPlaceId(r.mapsUrl)).filter(Boolean));
  const businesses = [...existing];
  let skipped = 0, failed = 0, processed = existing.length;

  const remaining = listings.filter((l) => {
    const id = extractPlaceId(l.url);
    return !id || !seenIds.has(id);
  });

  console.log(`📋 Phase 2: Extracting details for ${remaining.length} listings via ${opts.contexts} parallel browsers\n`);

  const targetCity = opts.location.split(',')[0].trim().toLowerCase();
  const targetState = (opts.location.split(',')[1] || '').trim().toLowerCase();

  let cursor = 0;
  const workers = Array.from({ length: opts.contexts }, async () => {
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1400, height: 900 },
    });
    const page = await context.newPage();

    while (cursor < remaining.length) {
      const idx = cursor++;
      const listing = remaining[idx];
      const tag = `[${String(idx + 1).padStart(3, ' ')}/${remaining.length}]`;

      let success = false;
      for (let attempt = 0; attempt < 2 && !success; attempt++) {
        try {
          const details = await extractPlaceDetails(page, listing.url);
          const placeId = extractPlaceId(listing.url);

          if (placeId && seenIds.has(placeId)) {
            console.log(`${tag} ⊘ ${details.name || listing.name} (duplicate)`);
            skipped++; success = true; break;
          }

          if (opts.strict && details.address) {
            const parts = details.address.split(',').map((s) => s.trim());
            const city = parts.length >= 2 ? parts[parts.length - 2].toLowerCase() : '';
            const stateZip = parts.length >= 1 ? parts[parts.length - 1].toLowerCase() : '';
            if (city !== targetCity || (targetState && !stateZip.includes(targetState))) {
              console.log(`${tag} ⊘ ${details.name} (outside ${opts.location})`);
              skipped++; success = true; break;
            }
          }

          if (placeId) seenIds.add(placeId);
          businesses.push({ ...details, mapsUrl: listing.url });
          processed++;

          if (processed % 5 === 0) {
            saveCheckpoint(opts.query, opts.location, { phase: 'maps', listingUrls: listings, businesses });
          }

          const flag = details.website ? '🌐' : '🔥';
          const claimTag = details.unclaimed ? ' 🏷️' : '';
          console.log(`${tag} ${flag}${claimTag} ${details.name}`);
          success = true;
        } catch (err) {
          if (attempt === 0) { await sleep(1500); continue; }
          console.log(`${tag} ✗ Failed: ${err.message.split('\n')[0]}`);
          failed++;
        }
      }
    }
    await context.close();
  });

  await Promise.all(workers);
  await browser.close();
  saveCheckpoint(opts.query, opts.location, { phase: 'maps', listingUrls: listings, businesses });
  return { businesses, skipped, failed };
}

// ──────────────────────────────────────────────────────────────────
// CSV export
// ──────────────────────────────────────────────────────────────────
function toCSV(rows) {
  if (rows.length === 0) return '';
  const flat = rows.map((r) => ({
  leadScore: r.leadScore,
  name: r.name,
  website: r.website,
  phone: r.phone,
  emails: r.enrichment?.emails?.join('; '),
  developerContacts: r.enrichment?.developerContacts?.join('; '),
  address: r.address,
  rating: r.rating,
  reviews: r.reviews,
  category: r.category,
  unclaimed: r.unclaimed,
  techStack: r.enrichment?.techStack?.join('; '),
  copyrightYear: r.enrichment?.copyrightYear,
  yearsStale: r.enrichment?.yearsStale,
  hasViewport: r.enrichment?.hasViewport,
  loadMs: r.enrichment?.loadMs,
  sizeKb: r.enrichment?.sizeKb,
  reachable: r.enrichment?.reachable,
  blocked: r.enrichment?.blocked,
  broken: r.enrichment?.broken,
  facebook: r.enrichment?.socials?.facebook,
  instagram: r.enrichment?.socials?.instagram,
  linkedin: r.enrichment?.socials?.linkedin,
  twitter: r.enrichment?.socials?.twitter,
  tiktok: r.enrichment?.socials?.tiktok,
  youtube: r.enrichment?.socials?.youtube,
  leadReasons: r.leadReasons?.join('; '),
  mapsUrl: r.mapsUrl,
}));
  const headers = Object.keys(flat[0]);
  const escape = (v) => {
    if (v == null) return '';
    const s = String(v).replace(/"/g, '""');
    return /[",\n]/.test(s) ? `"${s}"` : s;
  };
  return [headers.join(','), ...flat.map((row) => headers.map((h) => escape(row[h])).join(','))].join('\n');
}

// ──────────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────────
async function main() {
  const opts = parseArgs();
  let existing = [];
  let listingUrls = null;

  if (opts.resume) {
    const cp = loadCheckpoint(opts.query, opts.location);
    if (cp) {
      console.log(`⏯  Resuming from checkpoint (${cp.businesses?.length || 0} results)`);
      existing = cp.businesses || [];
      listingUrls = cp.listingUrls || null;
    } else {
      console.log('⏯  No checkpoint found, starting fresh');
    }
  } else {
    clearCheckpoint(opts.query, opts.location);
  }

  if (!listingUrls) {
    listingUrls = await collectListingUrls(opts);
    saveCheckpoint(opts.query, opts.location, { phase: 'collected', listingUrls, businesses: existing });
  }

  const { businesses, skipped, failed } = await scrapeDetailsParallel(listingUrls, opts, existing);

  let enriched = businesses;
  if (opts.enrich) {
    console.log(`\n🌐 Phase 3: Enriching ${businesses.length} websites concurrently (${ENRICH_CONCURRENCY} at a time)\n`);
    enriched = await concurrentMap(
      businesses,
      async (b, i) => {
        const result = await enrichWebsite(b);
        const e = result.enrichment;
        const status = !b.website ? '∅ no site'
          : !e?.reachable ? '✗ unreachable'
          : `${(e.emails || []).length}📧 ${Object.keys(e.socials || {}).length}🔗 ${(e.techStack || []).join(',') || '?'}`;
        console.log(`  [${String(i + 1).padStart(3, ' ')}/${businesses.length}] ${b.name} → ${status}`);
        return result;
      },
      ENRICH_CONCURRENCY
    );
  }

  console.log(`\n🎯 Phase 4: Scoring leads`);
  enriched = enriched.map((b) => {
    const { score, reasons } = computeLeadScore(b);
    return { ...b, leadScore: score, leadReasons: reasons };
  });
  enriched.sort((a, b) => (b.leadScore || 0) - (a.leadScore || 0));

  const slug = opts.query.replace(/\s+/g, '-').toLowerCase();
  const stamp = Date.now();
  const jsonFile = `${opts.output}-${slug}-${stamp}.json`;
  const csvFile = `${opts.output}-${slug}-${stamp}.csv`;
  fs.writeFileSync(jsonFile, JSON.stringify(enriched, null, 2));
  fs.writeFileSync(csvFile, toCSV(enriched));

  const noWebsite = enriched.filter((b) => !b.website).length;
const broken = enriched.filter((b) => b.enrichment?.broken).length;
const blocked = enriched.filter((b) => b.enrichment?.blocked).length;
const builderSites = enriched.filter((b) =>
  b.enrichment?.techStack?.some((t) => ['Wix', 'Squarespace', 'GoDaddyBuilder', 'Weebly', 'Duda'].includes(t))
).length;
const withEmails = enriched.filter((b) => b.enrichment?.emails?.length > 0).length;
const withDevContacts = enriched.filter((b) => b.enrichment?.developerContacts?.length > 0).length;
const withSocials = enriched.filter((b) => Object.keys(b.enrichment?.socials || {}).length > 0).length;
const unclaimed = enriched.filter((b) => b.unclaimed).length;
const hotLeads = enriched.filter((b) => (b.leadScore || 0) >= 75).length;

console.log(`\n${'═'.repeat(56)}`);
console.log(`✅ Scrape complete`);
console.log(`${'═'.repeat(56)}`);
console.log(`   Total enriched:        ${enriched.length}`);
console.log(`   Skipped:               ${skipped}`);
console.log(`   Failed:                ${failed}`);
console.log(`   No website:            ${noWebsite}`);
console.log(`   Site broken:           ${broken}`);
console.log(`   Site blocked scanner:  ${blocked}  (manual review)`);
console.log(`   Site builder (Wix+):   ${builderSites}`);
console.log(`   Unclaimed listings:    ${unclaimed}`);
console.log(`   With business email:   ${withEmails}`);
console.log(`   With dev contacts:     ${withDevContacts}  (likely site builders)`);
console.log(`   With social captured:  ${withSocials}`);
console.log(`   🔥 Hot leads (≥75):    ${hotLeads}`);
console.log(`${'═'.repeat(56)}\n`);

  clearCheckpoint(opts.query, opts.location);
}

main().catch((err) => {
  console.error('\n❌ Fatal error:', err);
  console.error('   Run with --resume to continue from last checkpoint.');
  process.exit(1);
});