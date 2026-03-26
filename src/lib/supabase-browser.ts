import 'client-only';

import { createBrowserClient } from '@supabase/ssr';

// Browser client -- used in client components (hooks, interactive UI)
export function createBrowserSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export const createClient = createBrowserSupabaseClient;
