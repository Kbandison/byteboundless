import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { listId, businessId } = await request.json();
  if (!listId || !businessId) {
    return NextResponse.json({ error: "listId and businessId required" }, { status: 400 });
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

  // Update list's updated_at
  await supabase
    .from("saved_lists")
    .update({ updated_at: new Date().toISOString() } as never)
    .eq("id", listId);

  return NextResponse.json({ success: true });
}
