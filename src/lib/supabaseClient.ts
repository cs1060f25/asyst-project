import { createBrowserClient } from "@supabase/ssr";

// SSR-compatible browser client that stores session in cookies (not localStorage)
// This allows the server-side API routes to read the session
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);
