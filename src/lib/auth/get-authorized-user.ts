import { createServerClient } from "@/lib/supabase/server";

import { isEmailWhitelisted, normalizeEmail } from "./whitelist";

export async function getAuthorizedUser() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const email = normalizeEmail(user?.email);

  if (!email) {
    return null;
  }

  const allowed = await isEmailWhitelisted(supabase, email);

  if (!allowed) {
    return null;
  }

  return {
    email,
    id: user!.id,
  };
}
