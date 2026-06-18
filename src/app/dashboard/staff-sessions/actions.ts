"use server";

import { revalidatePath } from "next/cache";

import { getAuthorizedUser } from "@/lib/auth/get-authorized-user";
import { isOwner } from "@/lib/auth/roles";
import { createServerClient } from "@/lib/supabase/server";

export type StaffSession = {
  id: string;
  staff_name: string;
  time_in: string;
  time_out: string | null;
  auto_logged_out: boolean;
  created_at: string;
};

export async function clockIn(staffNames: string[]): Promise<{ ok: boolean; errors?: string[] }> {
  const user = await getAuthorizedUser();
  if (!user) return { ok: false, errors: ["Not authenticated."] };

  const supabase = await createServerClient();

  // Get currently active sessions to avoid duplicates
  const { data: active } = await supabase
    .from("staff_sessions")
    .select("staff_name")
    .is("time_out", null);

  const activeNames = new Set((active ?? []).map((s) => s.staff_name));
  const toInsert = staffNames
    .filter((name) => !activeNames.has(name))
    .map((name) => ({ staff_name: name }));

  if (toInsert.length === 0) return { ok: true };

  const { error } = await supabase.from("staff_sessions").insert(toInsert);

  if (error) return { ok: false, errors: [error.message] };

  revalidatePath("/dashboard");
  return { ok: true };
}

export async function clockOut(staffNames: string[]): Promise<{ ok: boolean; errors?: string[] }> {
  const user = await getAuthorizedUser();
  if (!user) return { ok: false, errors: ["Not authenticated."] };

  const supabase = await createServerClient();

  const { error } = await supabase
    .from("staff_sessions")
    .update({ time_out: new Date().toISOString() })
    .is("time_out", null)
    .in("staff_name", staffNames);

  if (error) return { ok: false, errors: [error.message] };

  revalidatePath("/dashboard");
  return { ok: true };
}

export async function getActiveSessions(): Promise<StaffSession[]> {
  const user = await getAuthorizedUser();
  if (!user) return [];

  const supabase = await createServerClient();

  // Close stale sessions from previous days before fetching
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  await supabase
    .from("staff_sessions")
    .update({ time_out: new Date().toISOString(), auto_logged_out: true })
    .is("time_out", null)
    .lt("time_in", today.toISOString());

  const { data, error } = await supabase
    .from("staff_sessions")
    .select("*")
    .is("time_out", null)
    .order("time_in", { ascending: true });

  if (error) return [];
  return (data ?? []) as StaffSession[];
}

export async function getStaffAttendance(
  from?: string,
  to?: string,
): Promise<StaffSession[]> {
  const user = await getAuthorizedUser();
  if (!user || !isOwner(user.role)) return [];

  const supabase = await createServerClient();

  let query = supabase
    .from("staff_sessions")
    .select("*")
    .not("time_out", "is", null)
    .order("time_in", { ascending: false });

  if (from) {
    query = query.gte("time_in", from);
  }
  if (to) {
    query = query.lte("time_in", to);
  }

  const { data, error } = await query;

  if (error) return [];
  return (data ?? []) as StaffSession[];
}
