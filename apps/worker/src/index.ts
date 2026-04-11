// ByteBoundless Worker — polls Supabase for pending scrape jobs and runs them

// IMPORTANT: Sentry init must come first, before any other imports that
// might throw on load. Its default integrations install Node's uncaught
// exception / unhandled rejection handlers, and anything imported before
// this line won't be covered.
import { Sentry } from "./instrument.js";

import { createClient } from "@supabase/supabase-js";
import { runScrape, runUrlEnrich, type RawBusiness } from "./scraper.js";
import { sendJobCompleteEmail } from "./email.js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const POLL_INTERVAL_MS = 5000;

// Stale-job thresholds.
// - RESET_STALE_AFTER_MS: on worker startup, any 'running' job older than
//   this with no recent heartbeat is assumed to be from a crashed prior
//   worker and gets reset to 'pending' so it can be re-claimed.
// - FAIL_STALE_AFTER_MS: during normal polling, any 'running' job whose
//   heartbeat is this old is assumed to be silently hung and gets marked
//   'failed'. Must be > RESET_STALE_AFTER_MS so we don't fight ourselves.
const RESET_STALE_AFTER_MS = 10 * 60 * 1000; // 10 minutes
const FAIL_STALE_AFTER_MS = 15 * 60 * 1000; // 15 minutes
const STALE_CLEANUP_INTERVAL_MS = 60 * 1000; // check every minute

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
    .update({
      status: "running",
      phase: "collecting",
      heartbeat_at: new Date().toISOString(),
    } as never)
    .eq("id", job.id)
    .eq("status", "pending")
    .select("*")
    .single();

  if (error || !claimed) return null;
  return claimed as Record<string, unknown>;
}

// On worker startup: recover jobs left in 'running' from a previous
// instance that crashed. They get reset to 'pending' so we pick them up.
async function recoverOrphanedJobs() {
  const cutoff = new Date(Date.now() - RESET_STALE_AFTER_MS).toISOString();
  const { data, error } = await supabase
    .from("scrape_jobs")
    .update({ status: "pending", phase: null, heartbeat_at: null } as never)
    .eq("status", "running")
    .or(`heartbeat_at.is.null,heartbeat_at.lt.${cutoff}`)
    .select("id");

  if (error) {
    console.error("[Worker] Failed to recover orphaned jobs:", error);
    Sentry.captureException(error, { tags: { context: "recover_orphaned_jobs" } });
    return;
  }
  if (data && data.length > 0) {
    console.log(`[Worker] Recovered ${data.length} orphaned running job(s) from previous instance`);
  }
}

// Background sweep: any 'running' job with a heartbeat older than the
// fail threshold is assumed silently hung and gets marked 'failed'.
// Different from recovery because (a) we use a longer threshold and
// (b) we mark them failed instead of re-queuing (if they're hanging
// now, re-queuing would likely just hang again).
async function failStaleJobs() {
  const cutoff = new Date(Date.now() - FAIL_STALE_AFTER_MS).toISOString();
  const { data, error } = await supabase
    .from("scrape_jobs")
    .update({
      status: "failed",
      error: "Job timed out — no progress for 15 minutes",
    } as never)
    .eq("status", "running")
    .lt("heartbeat_at", cutoff)
    .select("id");

  if (error) {
    console.error("[Worker] Failed to sweep stale jobs:", error);
    Sentry.captureException(error, { tags: { context: "fail_stale_jobs" } });
    return;
  }
  if (data && data.length > 0) {
    console.log(`[Worker] Marked ${data.length} stale running job(s) as failed`);
    // Tell Sentry about the stuck jobs too — not an exception, but worth
    // tracking so repeated occurrences become visible as a pattern.
    Sentry.captureMessage(
      `Marked ${data.length} stale job(s) as failed`,
      { level: "warning", tags: { context: "stale_job_sweep" } }
    );
  }
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
    .update({
      phase,
      progress_current: current,
      progress_total: total,
      heartbeat_at: new Date().toISOString(),
    } as never)
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
    .update({
      phase,
      progress_current: current,
      progress_total: total,
      heartbeat_at: new Date().toISOString(),
    } as never)
    .eq("id", jobId);
}

async function writeBusinessBatch(jobId: string, businesses: RawBusiness[]): Promise<void> {
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

  // Insert in batches of 25. Throw on error so the outer processJob catch
  // marks the job failed — we'd rather surface a DB problem than silently
  // return a partial result set.
  for (let i = 0; i < rows.length; i += 25) {
    const batch = rows.slice(i, i + 25);
    const { error } = await supabase.from("businesses").insert(batch as never);
    if (error) {
      throw new Error(
        `Failed to write business batch (rows ${i}-${i + batch.length}): ${error.message}`
      );
    }
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
      heartbeat_at: new Date().toISOString(),
    } as never)
    .eq("id", jobId);
}

async function failJob(jobId: string, error: string) {
  await supabase
    .from("scrape_jobs")
    .update({ status: "failed", error: error.slice(0, 500) } as never)
    .eq("id", jobId);
}

const progressCallback = (jobId: string) => async (phase: string, current: number, total: number) => {
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
};

async function processJob(job: Record<string, unknown>) {
  const jobId = job.id as string;
  const options = job.options as { radius?: string; strict?: boolean; maxResults: number; enrich: boolean; mode?: string; urls?: string[] };
  const isUrlMode = options.mode === "urls" && Array.isArray(options.urls) && options.urls.length > 0;

  if (isUrlMode) {
    console.log(`[Worker] Processing URL import job ${jobId}: ${options.urls!.length} URLs`);
  } else {
    const radius = (options.radius || (options.strict ? "city" : "nearby")) as "city" | "nearby" | "region" | "statewide";
    console.log(`[Worker] Processing job ${jobId}: "${job.query}" in "${job.location}" (radius: ${radius})`);
  }

  try {
    let results: RawBusiness[];

    if (isUrlMode) {
      // Reverse mode: skip Google Maps, go straight to enrichment
      results = await runUrlEnrich(options.urls!, progressCallback(jobId));
    } else {
      const radius = (options.radius || (options.strict ? "city" : "nearby")) as "city" | "nearby" | "region" | "statewide";
      results = await runScrape(
        {
          query: job.query as string,
          location: job.location as string,
          radius,
          maxResults: options.maxResults,
          enrich: options.enrich,
        },
        progressCallback(jobId)
      );
    }

    console.log(`[Worker] Writing ${results.length} businesses to DB`);
    await writeBusinessBatch(jobId, results);

    await completeJob(jobId);
    console.log(`[Worker] Job ${jobId} completed — ${results.length} results`);

    // Fire the completion email. Runs after completeJob so the job is
    // already marked done in the DB — if the email send stalls, the user
    // can still see their results immediately by navigating to the page.
    // We check notify_on_complete here so opted-out users don't get spammed.
    try {
      const { data: userRow } = await supabase
        .from("profiles")
        .select("email, notify_on_complete")
        .eq("id", job.user_id as string)
        .single();
      const profile = userRow as { email: string; notify_on_complete: boolean } | null;

      if (profile && profile.notify_on_complete) {
        const hotCount = results.filter((b) => (b.leadScore ?? 0) >= 80).length;
        await sendJobCompleteEmail({
          userId: job.user_id as string,
          email: profile.email,
          query: job.query as string,
          location: job.location as string,
          jobId,
          resultCount: results.length,
          hotCount,
          mode: isUrlMode ? "urls" : undefined,
        });
      }
    } catch (emailErr) {
      // Never fail the job because of email issues
      console.error("[Worker] Post-completion email step failed:", emailErr);
      Sentry.captureException(emailErr, {
        tags: { context: "post_completion_email" },
        extra: { jobId },
      });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[Worker] Job ${jobId} failed:`, message);
    Sentry.captureException(err, {
      tags: { context: "process_job", job_id: jobId },
      extra: {
        query: job.query,
        location: job.location,
        options: job.options,
      },
    });
    await failJob(jobId, message);
  }
}

async function poll() {
  console.log("[Worker] ByteBoundless worker started. Polling for jobs...");

  // Recover any orphaned 'running' jobs from a previous crashed instance
  await recoverOrphanedJobs();

  // Periodic stale-job sweep runs independent of the main loop so it
  // still fires even while processJob is busy on a long-running job.
  setInterval(() => {
    failStaleJobs().catch((e) => {
      console.error("[Worker] Stale sweep error:", e);
      Sentry.captureException(e, { tags: { context: "stale_sweep_interval" } });
    });
  }, STALE_CLEANUP_INTERVAL_MS);

  while (true) {
    try {
      const job = await claimJob();
      if (job) {
        await processJob(job);
      }
    } catch (err) {
      console.error("[Worker] Poll error:", err);
      Sentry.captureException(err, { tags: { context: "poll_loop" } });
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
}

poll();
