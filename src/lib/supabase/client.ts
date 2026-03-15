import { createBrowserClient } from "@supabase/ssr";

/**
 * Creates a Supabase client for use in Browser / Client Components.
 * Call this inside event handlers or useEffect — never at module scope
 * in a Server Component.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
