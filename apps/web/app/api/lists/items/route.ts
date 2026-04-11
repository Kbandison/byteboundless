import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requirePaidPlan } from "@/lib/plan-gate";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const gated = await requirePaidPlan(supabase, user.id);
  if (gated) return gated;

  const body = await request.json();
  const { listId, businessId, businessIds } = body as {
    listId?: string;
    businessId?: string;
    businessIds?: string[];
  };

  if (!listId) {
    return NextResponse.json({ error: "listId required" }, { status: 400 });
  }

  // Bulk insert path
  if (Array.isArray(businessIds) && businessIds.length > 0) {
    const rows = businessIds.map((id) => ({ list_id: listId, business_id: id }));
    const { error } = await supabase
      .from("saved_list_items")
      .upsert(rows as never, { onConflict: "list_id,business_id", ignoreDuplicates: true });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    await supabase
      .from("saved_lists")
      .update({ updated_at: new Date().toISOString() } as never)
      .eq("id", listId);
    return NextResponse.json({ success: true, count: businessIds.length });
  }

  // Single insert path
  if (!businessId) {
    return NextResponse.json({ error: "businessId or businessIds required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("saved_list_items")
    .insert({ list_id: listId, business_id: businessId } as never);

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Already saved to this list" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase
    .from("saved_lists")
    .update({ updated_at: new Date().toISOString() } as never)
    .eq("id", listId);

  return NextResponse.json({ success: true });
}
