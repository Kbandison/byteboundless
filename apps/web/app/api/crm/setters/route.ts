import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { canPushToCrm, fetchCrmSetters } from "@/lib/crm";

/**
 * Who a pushed batch can be assigned to, proxied from the CRM.
 *
 * Goes through the server rather than letting the browser call the CRM
 * directly — the ingest key must never reach the client.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("profiles")
    .select("email, role")
    .eq("id", user.id)
    .single();
  const profile = data as { email: string; role: string } | null;

  if (!canPushToCrm(profile?.email, profile?.role)) {
    return NextResponse.json({ error: "Not available" }, { status: 403 });
  }

  try {
    return NextResponse.json({ setters: await fetchCrmSetters() });
  } catch {
    // An unreachable CRM shouldn't break the dialog — it falls back to
    // assigning the batch to whoever is pushing.
    return NextResponse.json({ setters: [] });
  }
}
