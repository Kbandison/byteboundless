import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import * as Sentry from "@sentry/nextjs";
import { createClient } from "@/lib/supabase/server";
import { isRootAdmin } from "@/lib/admin";
import type { Database } from "@byteboundless/supabase";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

async function isAdmin(supabase: Awaited<ReturnType<typeof createClient>>): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return (data as Profile | null)?.role === "admin";
}

// Read the target profile's email so the route can reject operations
// on the root admin (can't demote them, can't delete them). Returns
// null if the profile doesn't exist.
async function getTargetEmail(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<string | null> {
  const { data } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .single();
  return (data as { email: string } | null)?.email ?? null;
}

export async function PATCH(request: Request) {
  const supabase = await createClient();

  if (!(await isAdmin(supabase))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { userId, action, days, ...updates } = body as {
    userId?: string;
    action?: "grant_beta" | "revoke_beta";
    days?: number;
    role?: string;
    plan?: string;
    searches_limit?: number;
  };

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  // Protect the root admin from being demoted, beta-revoked, or
  // otherwise tampered with via this route. The UI also hides the
  // relevant buttons, but this check is the real enforcement.
  const targetEmail = await getTargetEmail(supabase, userId);
  if (targetEmail && isRootAdmin(targetEmail)) {
    const isDemotion = updates.role === "user";
    const isBetaRevoke = action === "revoke_beta";
    if (isDemotion || isBetaRevoke) {
      return NextResponse.json(
        { error: "Cannot modify the root admin account" },
        { status: 403 }
      );
    }
  }

  // Beta-access actions go through the RPC so the check/mutation is
  // atomic and the admin guard lives in the database (belt + suspenders
  // alongside the route-level isAdmin check).
  if (action === "grant_beta") {
    const { error } = await supabase.rpc("grant_beta_access" as never, {
      p_user_id: userId,
      p_days: days ?? 30,
    } as never);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  }

  if (action === "revoke_beta") {
    const { error } = await supabase.rpc("revoke_beta_access" as never, {
      p_user_id: userId,
    } as never);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  }

  // Fall-through: raw profile update for role/plan edits from the admin UI
  const { error } = await supabase
    .from("profiles")
    .update(updates as never)
    .eq("id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

/**
 * DELETE /api/admin/users?userId=<uuid>
 *
 * Hard-deletes the target user from auth.users. Supabase's FK
 * cascades on profiles / scrape_jobs / saved_lists / etc. take care
 * of their data. Uses the service role client because deleting
 * auth.users requires the admin API, which isn't exposed to regular
 * server clients.
 *
 * Guards:
 *   - Caller must be an admin (by role on their own profile)
 *   - Caller cannot delete their own account via this route
 *   - The root admin (see ROOT_ADMIN_EMAIL) cannot be deleted
 */
export async function DELETE(request: Request) {
  try {
    return await handleDelete(request);
  } catch (err) {
    Sentry.captureException(err, { tags: { route: "api/admin/users", method: "delete" } });
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function handleDelete(request: Request) {
  const supabase = await createClient();

  const { data: { user: caller } } = await supabase.auth.getUser();
  if (!caller) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await isAdmin(supabase))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  if (userId === caller.id) {
    return NextResponse.json(
      { error: "You can't delete your own account from this page" },
      { status: 400 }
    );
  }

  const targetEmail = await getTargetEmail(supabase, userId);
  if (targetEmail && isRootAdmin(targetEmail)) {
    return NextResponse.json(
      { error: "Cannot delete the root admin account" },
      { status: 403 }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
      { error: "Supabase service role not configured" },
      { status: 503 }
    );
  }

  const admin = createAdminClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
