import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Check if a business is marked as contacted
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const businessId = searchParams.get("businessId");
  if (!businessId) return NextResponse.json({ contacted: false });

  const { data } = await supabase
    .from("saved_list_items")
    .select("id")
    .eq("business_id", businessId)
    .eq("status", "contacted")
    .limit(1);

  return NextResponse.json({ contacted: (data ?? []).length > 0 });
}

// Mark a business as contacted
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { businessId } = await request.json();
  if (!businessId) return NextResponse.json({ error: "businessId required" }, { status: 400 });

  // Get or create a "Contacted" list for this user
  let { data: list } = await supabase
    .from("saved_lists")
    .select("id")
    .eq("user_id", user.id)
    .eq("name", "Contacted")
    .single();

  if (!list) {
    const { data: newList } = await supabase
      .from("saved_lists")
      .insert({ user_id: user.id, name: "Contacted", description: "Businesses you've reached out to" } as never)
      .select("id")
      .single();
    list = newList;
  }

  if (!list) return NextResponse.json({ error: "Failed to create list" }, { status: 500 });

  // Upsert the item
  await supabase.from("saved_list_items").upsert(
    {
      list_id: (list as { id: string }).id,
      business_id: businessId,
      status: "contacted",
      contacted_at: new Date().toISOString(),
    } as never,
    { onConflict: "list_id,business_id" }
  );

  return NextResponse.json({ success: true });
}
