import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function NotFound() {
  let isLoggedIn = false;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    isLoggedIn = !!user;
  } catch { /* not logged in */ }

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center text-center px-6">
      <h1 className="font-[family-name:var(--font-display)] text-8xl font-bold text-[var(--color-accent)] mb-4">
        404
      </h1>
      <p className="text-lg text-[var(--color-text-secondary)] mb-8">
        This page doesn&apos;t exist.
      </p>
      <Link
        href={isLoggedIn ? "/dashboard" : "/"}
        className="inline-flex items-center gap-2 bg-[var(--color-accent)] text-white px-8 py-3.5 rounded-lg text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-all duration-300"
      >
        {isLoggedIn ? "Back to dashboard" : "Back to home"}
      </Link>
    </div>
  );
}
