import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createClient } from "@/lib/supabase/server";

const VALID_STATUSES = new Set(["new", "in_progress", "resolved", "closed"]);

/**
 * PATCH /api/admin/feedback
 *
 * Body: { feedbackId, status }
 *
 * Admin-only. Flips the status of a feedback row. The RLS policy on
 * the feedback table enforces admin-only writes, so this endpoint is
 * a thin wrapper around the update that also stamps resolved_at
 * when the status transitions to 'resolved' or 'closed'.
 */
export async function PATCH(request: Request) {
  try {
    return await handleUpdate(request);
  } catch (err) {
    Sentry.captureException(err, { tags: { route: "api/admin/feedback" } });
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function handleUpdate(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if ((profile as { role: string } | null)?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const feedbackId = String(body.feedbackId ?? "").trim();
  const status = String(body.status ?? "").trim();

  if (!feedbackId) {
    return NextResponse.json({ error: "feedbackId is required" }, { status: 400 });
  }
  if (!VALID_STATUSES.has(status)) {
    return NextResponse.json(
      { error: "Invalid status" },
      { status: 400 }
    );
  }

  const updates: Record<string, unknown> = { status };
  if (status === "resolved" || status === "closed") {
    updates.resolved_at = new Date().toISOString();
  } else {
    updates.resolved_at = null;
  }

  const { error } = await supabase
    .from("feedback")
    .update(updates as never)
    .eq("id", feedbackId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
