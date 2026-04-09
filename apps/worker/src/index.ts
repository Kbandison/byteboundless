// ByteBoundless Worker — polls Supabase for pending scrape jobs and runs them

import { createClient } from "@supabase/supabase-js";
import { runScrape, type RawBusiness } from "./scraper.js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const POLL_INTERVAL_MS = 5000;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

async function claimJob() {
  const { data: jobs } = await supabase
    .from("scrape_jobs")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(1);

  if (!jobs || jobs.length === 0) return null;

  const job = jobs[0];
  const { data: claimed, error } = await supabase
    .from("scrape_jobs")
    .update({ status: "running", phase: "collecting" } as never)
    .eq("id", job.id)
    .eq("status", "pending")
    .select("*")
    .single();

  if (error || !claimed) return null;
  return claimed as Record<string, unknown>;
}

// Throttled progress updater — avoids hammering Supabase with rapid updates
let lastProgressUpdate = 0;
let pendingProgress: { jobId: string; phase: string; current: number; total: number } | null = null;
let progressTimer: ReturnType<typeof setTimeout> | null = null;

async function flushProgress() {
  if (!pendingProgress) return;
  const { jobId, phase, current, total } = pendingProgress;
  pendingProgress = null;
  lastProgressUpdate = Date.now();
  await supabase
    .from("scrape_jobs")
    .update({ phase, progress_current: current, progress_total: total } as never)
    .eq("id", jobId);
}

function updateProgress(jobId: string, phase: string, current: number, total: number) {
  pendingProgress = { jobId, phase, current, total };

  // Always flush phase changes immediately
  const timeSinceLast = Date.now() - lastProgressUpdate;
  if (timeSinceLast > 1500) {
    flushProgress();
  } else if (!progressTimer) {
    progressTimer = setTimeout(() => {
      progressTimer = null;
      flushProgress();
    }, 1500 - timeSinceLast);
  }
}

// Force flush (for phase transitions)
async function forceFlush(jobId: string, phase: string, current: number, total: number) {
  pendingProgress = null;
  if (progressTimer) { clearTimeout(progressTimer); progressTimer = null; }
  lastProgressUpdate = Date.now();
  await supabase
    .from("scrape_jobs")
    .update({ phase, progress_current: current, progress_total: total } as never)
    .eq("id", jobId);
}

async function writeBusinessBatch(jobId: string, businesses: RawBusiness[]) {
  const rows = businesses.map((biz) => {
    const enrichment = biz.enrichment || null;
    const leadReasons = (biz.leadReasons || []).map((r) =>
      typeof r === "string" ? { signal: r, weight: 0, detail: r } : r
    );
    return {
      job_id: jobId,
      name: biz.name || "Unknown",
      website: biz.website,
      phone: biz.phone,
      address: biz.address,
      rating: biz.rating ? parseFloat(biz.rating) : null,
      reviews: biz.reviews ? parseInt(biz.reviews, 10) : null,
      category: biz.category,
      unclaimed: biz.unclaimed,
      enrichment,
      lead_score: biz.leadScore ?? 0,
      lead_reasons: leadReasons,
    };
  });

  // Insert in batches of 25
  for (let i = 0; i < rows.length; i += 25) {
    const batch = rows.slice(i, i + 25);
    await supabase.from("businesses").insert(batch as never);
  }
}

async function completeJob(jobId: string) {
  await flushProgress();
  await supabase
    .from("scrape_jobs")
    .update({
      status: "completed",
      phase: "done",
      completed_at: new Date().toISOString(),
    } as never)
    .eq("id", jobId);
}

async function failJob(jobId: string, error: string) {
  await supabase
    .from("scrape_jobs")
    .update({ status: "failed", error: error.slice(0, 500) } as never)
    .eq("id", jobId);
}

async function processJob(job: Record<string, unknown>) {
  const jobId = job.id as string;
  const options = job.options as { radius?: string; strict?: boolean; maxResults: number; enrich: boolean };
  // Support both old (strict) and new (radius) option formats
  const radius = (options.radius || (options.strict ? "city" : "nearby")) as "city" | "nearby" | "region" | "statewide";

  console.log(`[Worker] Processing job ${jobId}: "${job.query}" in "${job.location}" (radius: ${radius})`);

  try {
    const results = await runScrape(
      {
        query: job.query as string,
        location: job.location as string,
        radius,
        maxResults: options.maxResults,
        enrich: options.enrich,
      },
      async (phase, current, total) => {
        // Force flush on phase transitions
        if (phase === "enriching" && current === 0) {
          console.log(`[Worker] Phase: enriching (${total} businesses)`);
          await forceFlush(jobId, phase, current, total);
        } else if (phase === "scoring" && current === 0) {
          console.log(`[Worker] Phase: scoring (${total} businesses)`);
          await forceFlush(jobId, phase, current, total);
        } else if (phase === "collecting" || phase === "done") {
          await forceFlush(jobId, phase, current, total);
        } else {
          updateProgress(jobId, phase, current, total);
        }
      }
    );

    console.log(`[Worker] Writing ${results.length} businesses to DB`);
    await writeBusinessBatch(jobId, results);

    await completeJob(jobId);
    console.log(`[Worker] Job ${jobId} completed — ${results.length} results`);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[Worker] Job ${jobId} failed:`, message);
    await failJob(jobId, message);
  }
}

async function poll() {
  console.log("[Worker] ByteBoundless worker started. Polling for jobs...");

  while (true) {
    try {
      const job = await claimJob();
      if (job) {
        await processJob(job);
      }
    } catch (err) {
      console.error("[Worker] Poll error:", err);
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
}

poll();
