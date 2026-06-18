import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const ROLE_COOKIE = "user-role";
const ROLE_COOKIE_MAX_AGE = 300; // 5 minutes
const STAFF_COOKIE = "staff-on-shift";
const STAFF_COOKIE_MAX_AGE = 60; // 1 minute

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Allow public routes
  const publicRoutes = ["/login", "/unauthorized", "/auth/callback"];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  if (isPublicRoute) {
    return response;
  }

  // Allow static assets and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.match(/\.(?:svg|png|jpg|jpeg|gif|webp|ico)$/)
  ) {
    return response;
  }

  // If no user, redirect to login
  if (!user?.email) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // --- Role lookup with cookie caching ---
  let role: string;
  const cachedRole = request.cookies.get(ROLE_COOKIE)?.value;

  if (cachedRole) {
    role = cachedRole;
  } else {
    const { data: allowedUser } = await supabase
      .from("allowed_users")
      .select("role")
      .eq("email", user.email.toLowerCase())
      .maybeSingle();

    if (!allowedUser) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    role = allowedUser.role as string;
    response.cookies.set(ROLE_COOKIE, role, {
      maxAge: ROLE_COOKIE_MAX_AGE,
      path: "/",
      sameSite: "lax",
      httpOnly: true,
    });
  }

  // Owners can access everything
  if (role === "owner") {
    return response;
  }

  // Department users: redirect /dashboard root to /dashboard/sales
  // (except physical_dept who need the staff shift panel on /dashboard)
  if (pathname === "/dashboard" && role !== "physical_dept") {
    return NextResponse.redirect(new URL("/dashboard/sales", request.url));
  }

  // Physical dept: force to /dashboard when no staff is clocked in
  if (role === "physical_dept" && pathname !== "/dashboard") {
    const cachedStaff = request.cookies.get(STAFF_COOKIE)?.value;
    let hasActiveStaff = cachedStaff === "1";

    if (cachedStaff === undefined) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: activeSessions } = await supabase
        .from("staff_sessions")
        .select("id")
        .is("time_out", null)
        .gte("time_in", today.toISOString())
        .limit(1);

      hasActiveStaff = !!(activeSessions && activeSessions.length > 0);
      response.cookies.set(STAFF_COOKIE, hasActiveStaff ? "1" : "0", {
        maxAge: STAFF_COOKIE_MAX_AGE,
        path: "/",
        sameSite: "lax",
        httpOnly: true,
      });
    }

    if (!hasActiveStaff) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // Department users: block access to owner-only routes
  if (pathname.startsWith("/dashboard/settings")) {
    return NextResponse.redirect(new URL("/dashboard/sales", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
