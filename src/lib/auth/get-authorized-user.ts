import { cache } from "react";

import { createServerClient } from "@/lib/supabase/server";

import { isEmailWhitelisted, normalizeEmail } from "./whitelist";
import type { UserRole } from "./roles";

export type AuthorizedUser = {
  email: string;
  id: string;
  role: UserRole;
};

/**
 * Lightweight auth check — just verifies the Supabase session is valid.
 * The whitelist was already verified at login (callback route).
 * Returns role from the allowed_users table.
 * Use this on pages that need fast loads.
 */
export const getAuthenticatedUser = cache(async (): Promise<AuthorizedUser | null> => {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return null;
  }

  const email = normalizeEmail(user.email) ?? user.email;

  const { data: allowedUser } = await supabase
    .from("allowed_users")
    .select("role")
    .eq("email", email)
    .maybeSingle();

  return {
    email,
    id: user.id,
    role: (allowedUser?.role as UserRole) ?? "physical_dept",
  };
});

/**
 * Full auth check — verifies session AND whitelist.
 * Use this only where strict access control is needed (e.g., first login).
 */
export async function getAuthorizedUser(): Promise<AuthorizedUser | null> {
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

  const { data: allowedUser } = await supabase
    .from("allowed_users")
    .select("role")
    .eq("email", email)
    .maybeSingle();

  return {
    email,
    id: user!.id,
    role: (allowedUser?.role as UserRole) ?? "physical_dept",
  };
}
