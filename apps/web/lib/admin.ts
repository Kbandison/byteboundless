import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Database } from "@byteboundless/supabase";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

// The root admin is the account that can't be demoted or deleted from
// the admin UI. This is the project owner — other admins they promote
// can be removed normally. Hardcoded here so the protection lives in
// one place; change the value or promote to an env var later if you
// start onboarding a team.
export const ROOT_ADMIN_EMAIL = "kbandison@gmail.com";

export function isRootAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === ROOT_ADMIN_EMAIL.toLowerCase();
}

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
