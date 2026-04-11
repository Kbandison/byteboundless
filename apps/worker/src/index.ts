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

// Concurrency configuration. WORKER_CONCURRENCY controls how many jobs
// run simultaneously in this worker process. WORKER_MAX_CONCURRENCY is
// a safety cap so a misconfigured env var can't accidentally spawn 50
// browser contexts and OOM the container.
//
// Both are env-tunable so the operator can dial them from the Railway
// dashboard without redeploying code.
const WORKER_MAX_CONCURRENCY = Math.max(
  1,
  parseInt(process.env.WORKER_MAX_CONCURRENCY || "10", 10)
);
const REQUESTED_CONCURRENCY = Math.max(
  1,
  parseInt(process.env.WORKER_CONCURRENCY || "5", 10)
);
const WORKER_CONCURRENCY = Math.min(
  REQUESTED_CONCURRENCY,
  WORKER_MAX_CONCURRENCY
);

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

// Atomic concurrent job claim via the claim_next_job() RPC. The
// function uses Postgres FOR UPDATE SKIP LOCKED so multiple worker
// loops can call it simultaneously without ever claiming the same
// row, AND it applies per-user fairness so one user submitting many
// searches at once doesn't hog all the worker slots.
//
// See supabase/018_claim_next_job.sql for the function definition.
async function claimJob(): Promise<Record<string, unknown> | null> {
  const { data, error } = await supabase.rpc("claim_next_job" as never);
  if (error) {
    console.error("[Worker] claim_next_job RPC error:", error);
    Sentry.captureException(error, { tags: { context: "claim_next_job" } });
    return null;
  }
  if (!data) return null;
  // RPC returns SETOF scrape_jobs which arrives as an array.
  const rows = data as Record<string, unknown>[];
  if (!Array.isArray(rows) || rows.length === 0) return null;
  return rows[0];
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

// Per-job progress tracker. Previously this was a single set of module-
// level globals (lastProgressUpdate, pendingProgress, progressTimer)
// shared across all jobs — fine when only one job ran at a time, but
// catastrophically broken with concurrency because two jobs would
// stomp on each other's pending state.
//
// Now each call to processJob spins up its own tracker via this
// factory, so every job has its own throttle window and pending
// state. The state is closed over by the returned functions.
function createProgressTracker(jobId: string) {
  // Pending state now includes the optional `activity` string that
  // drives the live ticker on the search progress page. The activity
  // string is overwritten on every update — there's no history.
  let pending: {
    phase: string;
    current: number;
    total: number;
    activity?: string;
  } | null = null;
  let lastUpdate = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;

  async function flush() {
    if (!pending) return;
    const { phase, current, total, activity } = pending;
    pending = null;
    lastUpdate = Date.now();
    // current_activity is only included in the update payload when
    // the latest pending state actually had one — otherwise we leave
    // whatever was there alone (don't blank it out on an unrelated
    // progress tick).
    const update: Record<string, unknown> = {
      phase,
      progress_current: current,
      progress_total: total,
      heartbeat_at: new Date().toISOString(),
    };
    if (activity !== undefined) {
      update.current_activity = activity;
    }
    await supabase
      .from("scrape_jobs")
      .update(update as never)
      .eq("id", jobId);
  }

  function update(
    phase: string,
    current: number,
    total: number,
    activity?: string
  ) {
    pending = { phase, current, total, activity };
    const sinceLast = Date.now() - lastUpdate;
    if (sinceLast > 1500) {
      flush();
    } else if (!timer) {
      timer = setTimeout(() => {
        timer = null;
        flush();
      }, 1500 - sinceLast);
    }
  }

  // Force-flush is used at phase transitions where we want the UI to
  // see the new phase immediately, not wait out the throttle window.
  async function forceFlush(
    phase: string,
    current: number,
    total: number,
    activity?: string
  ) {
    pending = null;
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    lastUpdate = Date.now();
    const update: Record<string, unknown> = {
      phase,
      progress_current: current,
      progress_total: total,
      heartbeat_at: new Date().toISOString(),
    };
    if (activity !== undefined) {
      update.current_activity = activity;
    }
    await supabase
      .from("scrape_jobs")
      .update(update as never)
      .eq("id", jobId);
  }

  return { update, forceFlush, flush };
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

async function processJob(job: Record<string, unknown>) {
  const jobId = job.id as string;
  const tracker = createProgressTracker(jobId);

  // Build the progress callback for THIS job. Closures capture the
  // per-job tracker so concurrent jobs don't share progress state.
  // The optional `activity` string is forwarded to the tracker so
  // the live ticker on the search progress page sees the latest
  // operation (e.g. "Extracting Joe's Plumbing").
  const progressCallback = async (
    phase: string,
    current: number,
    total: number,
    activity?: string
  ) => {
    if (phase === "enriching" && current === 0) {
      console.log(`[Worker] Job ${jobId} phase: enriching (${total} businesses)`);
      await tracker.forceFlush(phase, current, total, activity);
    } else if (phase === "scoring" && current === 0) {
      console.log(`[Worker] Job ${jobId} phase: scoring (${total} businesses)`);
      await tracker.forceFlush(phase, current, total, activity);
    } else if (phase === "collecting" || phase === "done") {
      await tracker.forceFlush(phase, current, total, activity);
    } else {
      tracker.update(phase, current, total, activity);
    }
  };

  // Batch flush callback. The scraper invokes this with batches of
  // fully-scored businesses as they complete (every RESULTS_BATCH_SIZE
  // businesses). Each batch lands in the businesses table immediately
  // so the user can see results on /search/[id]/results while the
  // rest of the search continues. The results page subscribes to
  // realtime INSERTs and renders new rows as they appear.
  const onBatch = async (batch: RawBusiness[]) => {
    await writeBusinessBatch(jobId, batch);
  };

  const options = job.options as {
    radius?: string;
    strict?: boolean;
    maxResults: number;
    enrich: boolean;
    runLighthouse?: boolean;
    mode?: string;
    urls?: string[];
  };
  const isUrlMode = options.mode === "urls" && Array.isArray(options.urls) && options.urls.length > 0;
  // Default to true when undefined so older jobs in the queue still
  // behave as they did before this flag existed.
  const runLighthouse = options.runLighthouse !== false;

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
      results = await runUrlEnrich(
        options.urls!,
        progressCallback,
        runLighthouse,
        onBatch
      );
    } else {
      const radius = (options.radius || (options.strict ? "city" : "nearby")) as "city" | "nearby" | "region" | "statewide";
      results = await runScrape(
        {
          query: job.query as string,
          location: job.location as string,
          radius,
          maxResults: options.maxResults,
          enrich: options.enrich,
          runLighthouse,
        },
        progressCallback,
        onBatch
      );
    }

    // The scraper already wrote results in batches via onBatch as
    // they completed scoring — no final writeBusinessBatch needed.
    // Just flush the throttled progress state so the UI sees the
    // final phase before we mark the job complete.
    await tracker.flush();
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

// Single worker loop. Each loop independently claims and processes
// jobs in a tight cycle. Multiple loops run in parallel to give the
// worker process its concurrency. claim_next_job's FOR UPDATE SKIP
// LOCKED ensures two loops never claim the same row.
async function workerLoop(workerIndex: number) {
  while (true) {
    try {
      const job = await claimJob();
      if (job) {
        const jobId = job.id as string;
        console.log(`[Worker-${workerIndex}] Claimed job ${jobId}`);
        await processJob(job);
      } else {
        // Queue is empty (or every visible job is locked by another
        // loop). Sleep before checking again.
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      }
    } catch (err) {
      console.error(`[Worker-${workerIndex}] Loop error:`, err);
      Sentry.captureException(err, {
        tags: { context: "worker_loop", worker_index: String(workerIndex) },
      });
      // Pause briefly on error before retrying so we don't tight-loop
      // against a broken queue or DB connection.
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    }
  }
}

async function start() {
  console.log(
    `[Worker] ByteBoundless worker started — concurrency=${WORKER_CONCURRENCY} (max=${WORKER_MAX_CONCURRENCY})`
  );

  // Recover any orphaned 'running' jobs from a previous crashed instance.
  // Runs once at boot before the worker loops start claiming new work.
  await recoverOrphanedJobs();

  // Periodic stale-job sweep runs independent of the worker loops so
  // it still fires even when every loop is busy on a long-running job.
  setInterval(() => {
    failStaleJobs().catch((e) => {
      console.error("[Worker] Stale sweep error:", e);
      Sentry.captureException(e, { tags: { context: "stale_sweep_interval" } });
    });
  }, STALE_CLEANUP_INTERVAL_MS);

  // Spawn N concurrent worker loops. They never resolve under normal
  // operation — Promise.all just keeps the process alive and surfaces
  // any unhandled error from a loop.
  const loops: Promise<void>[] = [];
  for (let i = 0; i < WORKER_CONCURRENCY; i++) {
    loops.push(workerLoop(i));
  }
  await Promise.all(loops);
}

start();
