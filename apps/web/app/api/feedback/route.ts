import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createClient } from "@/lib/supabase/server";
import {
  sendFeedbackToSupport,
  sendFeedbackConfirmation,
} from "@/lib/email";

const VALID_CATEGORIES = new Set(["bug", "feature", "question", "other"]);

/**
 * POST /api/feedback
 *
 * Body: { category, subject, message }
 *
 * Inserts a feedback row for the authenticated user, then fires two
 * emails via Resend:
 *   1. Admin notification to support@byteboundless.io (reply-to the user)
 *   2. Confirmation receipt to the user
 *
 * Email failures are swallowed (logged to Sentry) so the user still
 * gets a 200 as long as the row was persisted — we can resend from
 * the admin view later if needed.
 */
export async function POST(request: Request) {
  try {
    return await handleSubmit(request);
  } catch (err) {
    Sentry.captureException(err, { tags: { route: "api/feedback" } });
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function handleSubmit(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const category = String(body.category ?? "").trim();
  const subject = String(body.subject ?? "").trim();
  const message = String(body.message ?? "").trim();

  if (!VALID_CATEGORIES.has(category)) {
    return NextResponse.json(
      { error: "Category must be bug, feature, question, or other" },
      { status: 400 }
    );
  }
  if (!subject || subject.length > 200) {
    return NextResponse.json(
      { error: "Subject is required (max 200 chars)" },
      { status: 400 }
    );
  }
  if (!message || message.length > 5000) {
    return NextResponse.json(
      { error: "Message is required (max 5000 chars)" },
      { status: 400 }
    );
  }

  // Pull the user's email from their profile rather than the auth
  // user object — profiles.email is what the rest of the app uses
  // as the canonical address.
  const { data: profileRaw } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", user.id)
    .single();
  const profileEmail = (profileRaw as { email: string } | null)?.email;
  const email = profileEmail ?? user.email ?? "";

  const { data: inserted, error } = await supabase
    .from("feedback")
    .insert({
      user_id: user.id,
      email,
      category,
      subject,
      message,
    } as never)
    .select("id, created_at, status")
    .single();

  if (error) {
    Sentry.captureMessage("Feedback insert failed", {
      level: "error",
      tags: { route: "api/feedback" },
      extra: { message: error.message },
    });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const row = inserted as { id: string; created_at: string; status: string };

  // Fire the two notification emails in parallel. Failures are
  // non-fatal — the row is already persisted so the admin can see
  // and respond to it from /admin/feedback even if Resend hiccups.
  await Promise.allSettled([
    sendFeedbackToSupport({
      userId: user.id,
      userEmail: email,
      category,
      subject,
      message,
      feedbackId: row.id,
    }),
    email
      ? sendFeedbackConfirmation({
          userId: user.id,
          email,
          category,
          subject,
          message,
        })
      : Promise.resolve(false),
  ]);

  return NextResponse.json({
    feedback: {
      id: row.id,
      category,
      subject,
      message,
      status: row.status,
      created_at: row.created_at,
    },
  });
}
