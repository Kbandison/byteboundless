import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@byteboundless/supabase";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

async function isAdmin(supabase: Awaited<ReturnType<typeof createClient>>): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return (data as Profile | null)?.role === "admin";
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
  };

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
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
