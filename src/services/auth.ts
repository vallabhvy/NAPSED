import { supabase } from "../lib/supabase";
import type { Role } from "../types";

const ROLE_PREFERENCE_KEY = "devproof_role_preference";

/**
 * Initiates GitHub OAuth login flow via Supabase
 */
export async function signInWithGithub(role: Role) {
  sessionStorage.setItem(ROLE_PREFERENCE_KEY, role);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: `${window.location.origin}`,
    },
  });

  if (error) {
    console.error("GitHub OAuth Error:", error.message);
    throw error;
  }

  return data;
}

export function getAndClearRolePreference(): Role {
  const role = sessionStorage.getItem(ROLE_PREFERENCE_KEY);
  sessionStorage.removeItem(ROLE_PREFERENCE_KEY);
  return role === "JUNIOR" ? "JUNIOR" : "SENIOR";
}

/**
 * Signs out current user session
 */
export async function signOutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("Sign Out Error:", error.message);
    throw error;
  }
}
