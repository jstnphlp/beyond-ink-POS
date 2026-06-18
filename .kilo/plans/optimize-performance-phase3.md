# Performance Optimization Plan — Phase 3

## Context

Phase 1 and Phase 2 optimized DB queries, added cookie caching for roles, and parallelized requests. However, pages still take **2–2.5 seconds** to load when switching between routes. Profiling the request lifecycle reveals the primary bottleneck:

**`supabase.auth.getUser()` makes a network round-trip to the Supabase Auth (GoTrue) server on every invocation.** This is NOT a local JWT decode — it's an HTTP call to `https://<project>.supabase.co/auth/v1/user`. It's called **twice** per page load:

1. **Middleware** (line 37): `await supabase.auth.getUser()` — ~200–500ms
2. **Page server component** via `getAuthenticatedUser()` (line 25): `await supabase.auth.getUser()` — ~200–500ms **(REDUNDANT)**

Combined with 2–4 data queries per page (100–300ms each), this produces 600–1600ms of server-side latency, plus network round-trip time, explaining the 2–2.5s page loads.

---

## Root Cause Analysis

### Request lifecycle for a client-side navigation (e.g. clicking "History" link):

```
Browser → RSC data request → Middleware → Page Server Component → Response
                  |                  |                    |
          supabase.auth.getUser()   |   supabase.auth.getUser()  ← REDUNDANT
          (~200-500ms network)      |   (~200-500ms network)
                                    |   getTransactionHistory()  (~100-200ms)
                                    |   Total: 500-1200ms server-side
```

### Key facts:
- `supabase.auth.getUser()` from `@supabase/ssr` calls the GoTrue `/user` endpoint via HTTP — it does NOT just decode the JWT locally
- Middleware already validates the JWT and redirects unauthorized users before the page ever runs
- Every page uses `getAuthenticatedUser()` which calls `getUser()` again — completely redundant
- There are no `loading.tsx` files for sales sub-routes (`/sales`, `/sales/history`, `/sales/drafts`, `/sales/[id]`), so users see no loading indicator during the 2-2.5s wait

---

## Plan

### Change 1: Pass auth data from middleware via request headers (HIGH — eliminates ~200-500ms per page)

**Concept:** The middleware already has `user.id`, `user.email`, and the resolved `role`. Instead of having the page call `getUser()` again, pass this data via request headers that the page reads directly.

**File:** `middleware.ts`

- After the auth check resolves (line ~88, after role is determined), set custom request headers:

```ts
// Set auth headers for server components to read (avoids redundant getUser() call)
const requestHeaders = new Headers(request.headers);
requestHeaders.set("x-user-id", user.id);
requestHeaders.set("x-user-email", user.email);
requestHeaders.set("x-user-role", role);

// Use the modified request for the response
response = NextResponse.next({
  request: { headers: requestHeaders },
});
```

- Also set these headers on redirect responses (for department redirects, physical_dept redirects) so the redirected-to page also benefits
- For the early returns (public routes, static assets, no user), no headers needed

**File:** `src/lib/auth/get-authorized-user.ts`

- Rewrite `getAuthenticatedUser` to read from request headers first, falling back to `getUser()` + DB only when headers are missing (direct URL access edge case):

```ts
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return null;

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
```

**Impact:** Eliminates 1 `getUser()` network call per page load (~200-500ms savings).

**Security note:** The headers are set server-side by middleware and cannot be modified by the client. Middleware already verified the JWT via `getUser()`. This is safe.

---

### Change 2: Remove `createServerClient` import if no longer needed in `getAuthenticatedUser` fallback path

**File:** `src/lib/auth/get-authorized-user.ts`

- After Change 1, the `createServerClient` import is only needed in the fallback path and in `getAuthorizedUser`. Keep the import but ensure the hot path (header read) has zero Supabase client creation overhead.

**Impact:** Minor — avoids creating a Supabase client on the fast path.

---

### Change 3: Add `loading.tsx` skeletons for all sales sub-routes (HIGH — perceived performance)

Currently only `dashboard/loading.tsx` exists. Sales sub-routes have NO loading UI, so users stare at the old page for 2-2.5s before the new page appears.

**Files to create:**

1. `src/app/dashboard/sales/loading.tsx` — skeleton for the New Sale page
2. `src/app/dashboard/sales/history/loading.tsx` — skeleton for the history page
3. `src/app/dashboard/sales/drafts/loading.tsx` — skeleton for the drafts page
4. `src/app/dashboard/sales/[transactionId]/loading.tsx` — skeleton for the edit-draft page

Each should show a `SalesShell`-like skeleton with the hero section and a content placeholder matching the respective page layout. Reuse the same skeleton pattern from `dashboard/loading.tsx`.

**Example for history/loading.tsx:**
```tsx
export default function HistoryLoading() {
  return (
    <main className="shell">
      <div className="shell__inner">
        <section className="hero">
          <div className="hero__card">
            <p className="eyebrow">Sales</p>
            <h1 className="headline">Transaction History</h1>
            <p className="lead">View all completed and cancelled transactions.</p>
            <div className="hero__actions">
              <div className="loadingSkeleton" style={{ width: "80px", height: "36px", borderRadius: "6px" }} />
              <div className="loadingSkeleton" style={{ width: "60px", height: "36px", borderRadius: "6px" }} />
              <div className="loadingSkeleton" style={{ width: "60px", height: "36px", borderRadius: "6px" }} />
              <div className="loadingSkeleton" style={{ width: "80px", height: "36px", borderRadius: "6px" }} />
            </div>
          </div>
        </section>
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
          <div className="loadingSkeleton" style={{ width: "140px", height: "56px", borderRadius: "6px" }} />
          <div className="loadingSkeleton" style={{ width: "140px", height: "56px", borderRadius: "6px" }} />
        </div>
        <div className="loadingSkeleton" style={{ height: "400px", borderRadius: "var(--radius)" }} />
      </div>
    </main>
  );
}
```

**Impact:** Instant visual feedback on navigation. Users see a skeleton within ~50ms instead of staring at the old page for 2-2.5s. Combined with Next.js `<Link>` prefetching, this makes navigation feel near-instant.

---

### Change 4: Cache `createServerClient()` per request with React `cache()` (MEDIUM)

**File:** `src/lib/supabase/server.ts`

Currently `createServerClient()` creates a NEW Supabase client on every call. Each page calls it 3-4 times (once in `getAuthenticatedUser`, once per query function). Wrapping it in React's `cache()` ensures one client instance per request.

```ts
import { cache } from "react";
import { createServerClient as createSupabaseServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const createServerClient = cache(async () => {
  const cookieStore = await cookies();

  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Ignore cookie writes in contexts where Next.js blocks mutation.
          }
        },
      },
    },
  );
});
```

**Impact:** Reduces client creation overhead and ensures shared auth state across queries within a request. Minor but compounds with other optimizations.

**Risk:** Shared client means shared auth state. If one query triggers a token refresh, all subsequent queries see the refreshed token. This is actually desirable behavior. The Supabase client is designed to be reused.

---

### Change 5: Remove redundant `cookies()` call in `getAuthenticatedUser` (LOW)

After Change 1, the hot path reads headers directly. The fallback path still reads cookies for the role. But we can simplify by removing the standalone `cookies()` import if the fallback uses `createServerClient()` (which already reads cookies internally) plus the cookie store for the role.

Actually, after Change 1 the fallback path still needs `cookies()` for the role cookie. Keep it but ensure it's only used in the fallback.

---

## File Changes Summary

### Modified files:
- `middleware.ts` — set `x-user-id`, `x-user-email`, `x-user-role` request headers
- `src/lib/auth/get-authorized-user.ts` — read headers in `getAuthenticatedUser` hot path
- `src/lib/supabase/server.ts` — wrap `createServerClient` in React `cache()`

### New files:
- `src/app/dashboard/sales/loading.tsx`
- `src/app/dashboard/sales/history/loading.tsx`
- `src/app/dashboard/sales/drafts/loading.tsx`
- `src/app/dashboard/sales/[transactionId]/loading.tsx`

---

## Expected Impact

| Change | Estimated Improvement |
|---|---|
| Header-based auth (eliminate `getUser()` network call) | **-200-500ms per page** |
| `loading.tsx` skeletons (perceived performance) | **Instant loading feedback** (~50ms to skeleton) |
| Cache `createServerClient()` | **-minor overhead**, shared auth state |
| **Combined** | **~500-1000ms faster page loads, instant perceived navigation** |

---

## Security Considerations

- Request headers (`x-user-id`, etc.) are set by middleware server-side. The client **cannot** modify them.
- Middleware still calls `getUser()` (GoTrue verification) on every request — this is the security gate.
- `getAuthorizedUser()` (used in server actions for writes) still calls `getUser()` — write operations remain fully verified.
- The header approach only affects page reads (`getAuthenticatedUser`), not mutations.
