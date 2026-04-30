import { cache } from "react";

import { createServerClient } from "@/lib/supabase/server";

import { isEmailWhitelisted, normalizeEmail } from "./whitelist";

/**
 * Lightweight auth check — just verifies the Supabase session is valid.
 * The whitelist was already verified at login (callback route).
 * Use this on pages that need fast loads.
 */
export const getAuthenticatedUser = cache(async () => {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return null;
  }

  return {
    email: normalizeEmail(user.email) ?? user.email,
    id: user.id,
  };
});

/**
 * Full auth check — verifies session AND whitelist.
 * Use this only where strict access control is needed (e.g., first login).
 */
export async function getAuthorizedUser() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const email = normalizeEmail(user?.email);

  if (!email) {
    return null;
  }

  const allowed = await isEmailWhitelisted(
    (normalizedEmail) =>
      supabase.from("allowed_users").select("email").eq("email", normalizedEmail).maybeSingle(),
    email,
  );

  if (!allowed) {
    return null;
  }

  return {
    email,
    id: user!.id,
  };
}
