"use server";

import { revalidatePath } from "next/cache";

import { getAuthorizedUser } from "@/lib/auth/get-authorized-user";
import { isOwner } from "@/lib/auth/roles";
import { normalizeEmail } from "@/lib/auth/whitelist";
import { createServerClient } from "@/lib/supabase/server";

import type { UserRole } from "@/lib/auth/roles";

export type AllowedUser = {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
};

async function requireOwner() {
  const user = await getAuthorizedUser();
  if (!user || !isOwner(user.role)) {
    throw new Error("Only owners can manage users.");
  }
  return user;
}

export async function getAllowedUsers(): Promise<AllowedUser[]> {
  await requireOwner();

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("allowed_users")
    .select("id, email, role, created_at")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as AllowedUser[];
}

export async function addUser(email: string, role: UserRole): Promise<{ ok: boolean; error?: string }> {
  await requireOwner();

  const normalized = normalizeEmail(email);
  if (!normalized) {
    return { ok: false, error: "Invalid email address." };
  }

  const supabase = await createServerClient();

  const { data: existing } = await supabase
    .from("allowed_users")
    .select("id")
    .eq("email", normalized)
    .maybeSingle();

  if (existing) {
    return { ok: false, error: "This email is already in the allowlist." };
  }

  const { error } = await supabase
    .from("allowed_users")
    .insert({ email: normalized, role });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/dashboard");
  return { ok: true };
}

export async function updateUserRole(userId: string, role: UserRole): Promise<{ ok: boolean; error?: string }> {
  await requireOwner();

  const supabase = await createServerClient();

  const { error } = await supabase
    .from("allowed_users")
    .update({ role })
    .eq("id", userId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/dashboard");
  return { ok: true };
}

export async function removeUser(userId: string): Promise<{ ok: boolean; error?: string }> {
  await requireOwner();

  const supabase = await createServerClient();

  const { error } = await supabase
    .from("allowed_users")
    .delete()
    .eq("id", userId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/dashboard");
  return { ok: true };
}
