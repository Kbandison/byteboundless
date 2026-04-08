import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@byteboundless/supabase";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options as Record<string, unknown>)
            );
          } catch {
            // Can't set cookies in Server Components — this is expected
            // when called from a Server Component (not a Route Handler or Server Action)
          }
        },
      },
    }
  );
}
