import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Database } from "@byteboundless/supabase";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export async function requireAdmin(): Promise<Profile> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const profile = data as Profile | null;

  if (!profile || profile.role !== "admin") {
    redirect("/dashboard");
  }

  return profile;
}
