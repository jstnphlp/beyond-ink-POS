import { cache } from "react";
import { cookies, headers } from "next/headers";

import { createServerClient } from "@/lib/supabase/server";

import { normalizeEmail } from "./whitelist";
import type { UserRole } from "./roles";

export type AuthorizedUser = {
  email: string;
  id: string;
  role: UserRole;
};

/**
 * Lightweight auth check for page server components.
 *
 * Reads user data from request headers set by middleware (x-user-id,
 * x-user-email, x-user-role). This avoids the supabase.auth.getUser()
 * network call since middleware already verified the JWT.
 *
 * Falls back to getUser() + DB query only when headers are missing
 * (e.g. direct URL access that bypasses middleware).
 */
export const getAuthenticatedUser = cache(async (): Promise<AuthorizedUser | null> => {
  const headerStore = await headers();
  const headerUserId = headerStore.get("x-user-id");
  const headerEmail = headerStore.get("x-user-email");
  const headerRole = headerStore.get("x-user-role");

  if (headerUserId && headerEmail && headerRole) {
    const email = normalizeEmail(headerEmail) ?? headerEmail;
    return { email, id: headerUserId, role: headerRole as UserRole };
  }

  // Fallback: full auth check (direct URL access, middleware bypass, etc.)
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
