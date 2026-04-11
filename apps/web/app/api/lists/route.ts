import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requirePaidPlan } from "@/lib/plan-gate";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const gated = await requirePaidPlan(supabase, user.id);
  if (gated) return gated;

  const { data } = await supabase
    .from("saved_lists")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  return NextResponse.json({ lists: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const gated = await requirePaidPlan(supabase, user.id);
  if (gated) return gated;

  const { name, description } = await request.json();
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const { data, error } = await supabase
    .from("saved_lists")
    .insert({ user_id: user.id, name, description: description || null } as never)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ list: data });
}
