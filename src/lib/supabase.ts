import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

const urlMissing =
  !supabaseUrl ||
  supabaseUrl.includes("your-project-ref") ||
  supabaseUrl.trim() === "";
const keyMissing =
  !supabasePublishableKey ||
  supabasePublishableKey.includes("your-publishable-key");

/**
 * Mock mode: no cloud keys required. UI + WASM runners load specs from
 * `specs/` via Vite glob. Never put Judge0 secrets in VITE_* variables.
 */
export const isMockMode =
  import.meta.env.VITE_MOCK_MODE === "true" || urlMissing || keyMissing;

export const supabase: SupabaseClient = createClient(
  supabaseUrl || "https://mock.napsed.com",
  supabasePublishableKey || "mock-publishable-key",
  {
    auth: {
      persistSession: !isMockMode,
      autoRefreshToken: !isMockMode,
      detectSessionInUrl: !isMockMode,
    },
  },
);
