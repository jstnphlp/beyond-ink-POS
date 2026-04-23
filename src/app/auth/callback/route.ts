import { NextResponse } from "next/server";

import { buildUnauthorizedUrl } from "@/lib/auth/access-copy";
import { isEmailWhitelisted, normalizeEmail } from "@/lib/auth/whitelist";
import { createRouteHandlerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;
  const loginUrl = new URL("/login", origin);
  const dashboardUrl = new URL("/dashboard", origin);
  const unauthorizedUrl = buildUnauthorizedUrl(origin);

  if (!code) {
    loginUrl.searchParams.set("message", "Missing auth code");
    return NextResponse.redirect(loginUrl);
  }

  const supabase = await createRouteHandlerClient();
  const exchangeResult = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeResult.error) {
    loginUrl.searchParams.set("message", exchangeResult.error.message);
    return NextResponse.redirect(loginUrl);
  }

  const email = normalizeEmail(exchangeResult.data.user.email);

  if (!email) {
    await supabase.auth.signOut();
    loginUrl.searchParams.set("message", "Email not available from Google");
    return NextResponse.redirect(loginUrl);
  }

  const allowed = await isEmailWhitelisted(supabase, email);

  if (!allowed) {
    await supabase.auth.signOut();
    return NextResponse.redirect(unauthorizedUrl);
  }

  return NextResponse.redirect(dashboardUrl);
}
