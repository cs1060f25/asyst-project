import { createClient } from "@supabase/supabase-js";

// Public client for browser usage; stores session in localStorage by default
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);
