import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const VALID_STATUSES = ["saved", "contacted", "replied", "quoted", "signed", "lost"];

// Get outcome status for a business
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const businessId = searchParams.get("businessId");
  if (!businessId) return NextResponse.json({ status: null });

  // Find the most advanced status across all lists
  const { data } = await supabase
    .from("saved_list_items")
    .select("status, deal_amount, contacted_at, replied_at, quoted_at, signed_at")
    .eq("business_id", businessId);

  if (!data || (data as unknown[]).length === 0) return NextResponse.json({ status: null });

  // Return the most advanced status
  const items = data as { status: string; deal_amount: number | null }[];
  const priority = ["signed", "quoted", "replied", "contacted", "lost", "saved"];
  let best = items[0];
  for (const item of items) {
    if (priority.indexOf(item.status) < priority.indexOf(best.status)) {
      best = item;
    }
  }

  return NextResponse.json({ status: best.status, deal_amount: best.deal_amount });
}

// Update outcome status for a business
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { businessId, status, dealAmount } = await request.json();
  if (!businessId) return NextResponse.json({ error: "businessId required" }, { status: 400 });
  if (status && !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const targetStatus = status || "contacted";

  // Get or create a "Pipeline" list for this user
  let { data: list } = await supabase
    .from("saved_lists")
    .select("id")
    .eq("user_id", user.id)
    .eq("name", "Pipeline")
    .single();

  if (!list) {
    const { data: newList } = await supabase
      .from("saved_lists")
      .insert({ user_id: user.id, name: "Pipeline", description: "Your outreach pipeline" } as never)
      .select("id")
      .single();
    list = newList;
  }

  if (!list) return NextResponse.json({ error: "Failed to create list" }, { status: 500 });

  const listId = (list as { id: string }).id;
  const now = new Date().toISOString();

  const updateData: Record<string, unknown> = {
    list_id: listId,
    business_id: businessId,
    status: targetStatus,
  };

  if (targetStatus === "contacted") updateData.contacted_at = now;
  if (targetStatus === "replied") updateData.replied_at = now;
  if (targetStatus === "quoted") updateData.quoted_at = now;
  if (targetStatus === "signed") { updateData.signed_at = now; updateData.deal_amount = dealAmount || null; }

  await supabase.from("saved_list_items").upsert(
    updateData as never,
    { onConflict: "list_id,business_id" }
  );

  return NextResponse.json({ success: true, status: targetStatus });
}
