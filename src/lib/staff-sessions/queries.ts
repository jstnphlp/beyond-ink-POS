import { createServerClient } from "@/lib/supabase/server";

export type StaffSession = {
  id: string;
  staff_name: string;
  time_in: string;
  time_out: string | null;
  auto_logged_out: boolean;
  created_at: string;
};

export async function getActiveSessionsForToday(): Promise<StaffSession[]> {
  const supabase = await createServerClient();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("staff_sessions")
    .select("*")
    .is("time_out", null)
    .gte("time_in", today.toISOString())
    .order("time_in", { ascending: true });

  if (error) return [];
  return (data ?? []) as StaffSession[];
}

export async function getAttendanceLog(
  from: string,
  to: string,
): Promise<StaffSession[]> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("staff_sessions")
    .select("*")
    .not("time_out", "is", null)
    .gte("time_in", from)
    .lte("time_in", to)
    .order("time_in", { ascending: false });

  if (error) return [];
  return (data ?? []) as StaffSession[];
}
