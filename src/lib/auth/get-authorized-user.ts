import { cache } from "react";
import { cookies } from "next/headers";

import { createServerClient } from "@/lib/supabase/server";

import { normalizeEmail } from "./whitelist";
import type { UserRole } from "./roles";

export type AuthorizedUser = {
  email: string;
  id: string;
  role: UserRole;
};

/**
 * Lightweight auth check — just verifies the Supabase session is valid.
 * The whitelist was already verified at login (callback route).
 * Reads role from the `user-role` cookie set by middleware; falls back to DB.
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

  const cookieStore = await cookies();
  const cachedRole = cookieStore.get("user-role")?.value;

  if (cachedRole) {
    return { email, id: user.id, role: cachedRole as UserRole };
  }

  // Fallback: query DB (cookie expired or missing)
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
 * Full auth check — verifies session AND whitelist in a single query.
 * Use this only where strict access control is needed (e.g., server actions).
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

  const { data: allowedUser } = await supabase
    .from("allowed_users")
    .select("email, role")
    .eq("email", email)
    .maybeSingle();

  if (!allowedUser) {
    return null;
  }

  return {
    email,
    id: user!.id,
    role: (allowedUser.role as UserRole) ?? "physical_dept",
  };
}
