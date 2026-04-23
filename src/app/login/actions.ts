"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createServerClient } from "@/lib/supabase/server";

export async function signInWithGoogle() {
  const supabase = await createServerClient();
  const headerStore = await headers();
  const origin =
    headerStore.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    redirect(`/login?message=${encodeURIComponent(error.message)}`);
  }

  redirect(data.url);
}
