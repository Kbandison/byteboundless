import { createClient as supabaseCreateClient } from "@supabase/supabase-js";
import type { Database } from "./database.types.js";

export function createClient(
  url: string,
  key: string,
  options?: { auth?: { persistSession?: boolean } }
) {
  return supabaseCreateClient<Database>(url, key, {
    auth: {
      persistSession: options?.auth?.persistSession ?? true,
    },
  });
}
