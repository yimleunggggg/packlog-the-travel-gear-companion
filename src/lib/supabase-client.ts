import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

function readEnv(name: string): string | undefined {
  if (typeof import.meta === "undefined") return undefined;
  return (import.meta.env as Record<string, string | undefined>)[name];
}

/** Same anon-key client as data layer; browser singleton shares session with auth. */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  const url = readEnv("VITE_SUPABASE_URL");
  const anonKey = readEnv("VITE_SUPABASE_ANON_KEY");
  if (!url || !anonKey) return null;

  if (typeof window === "undefined") {
    return createClient(url, anonKey);
  }

  if (!browserClient) {
    browserClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return browserClient;
}

export function hasSupabaseBrowserConfig(): boolean {
  return !!(readEnv("VITE_SUPABASE_URL") && readEnv("VITE_SUPABASE_ANON_KEY"));
}
