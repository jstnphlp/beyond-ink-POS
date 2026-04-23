import { redirect } from "next/navigation";

import { SignOutButton } from "@/components/sign-out-button";
import { getDashboardAccessCopy } from "@/lib/auth/access-copy";
import { getAuthorizedUser } from "@/lib/auth/get-authorized-user";

export default async function DashboardPage() {
  const authorizedUser = await getAuthorizedUser();
  const accessCopy = getDashboardAccessCopy();

  if (!authorizedUser) {
    redirect("/login");
  }

  return (
    <main className="shell">
      <div className="shell__inner">
        <section className="hero">
          <div className="hero__card">
            <p className="eyebrow">Phase 1 Foundation</p>
            <h1 className="headline">Beyond Ink POS</h1>
            <p className="lead">
              This scaffold wires Next.js, Supabase Auth, a Supabase-backed
              whitelist, and the first protected dashboard so Phase 2 can focus
              on catalog, inventory, and POS workflows instead of foundation
              setup.
            </p>
            <div className="hero__actions">
              <SignOutButton />
            </div>
          </div>
        </section>

        <section className="grid">
          <article className="panel">
            <div className="meta">
              <span className="badge">Signed in</span>
            </div>
            <h2>Access status</h2>
            <p className="muted">{accessCopy}</p>
          </article>

          <article className="panel">
            <div className="meta">
              <span className="badge badge--warning">Next up</span>
            </div>
            <h2>Phase 2 targets</h2>
            <ul className="list">
              <li>Services and add-ons catalog</li>
              <li>Inventory items, stock levels, and supplier purchases</li>
              <li>Stock movement logging and low-stock warnings</li>
            </ul>
          </article>
        </section>

        <section className="grid" style={{ marginTop: "18px" }}>
          <article className="panel">
            <h3>What comes next</h3>
            <ul className="list">
              <li>Service and add-on setup</li>
              <li>Inventory items and stock monitoring</li>
              <li>Supplier purchases and stock movement logs</li>
              <li>POS sales screen and reports</li>
            </ul>
          </article>

          <article className="panel">
            <h3>Current boundaries</h3>
            <div className="stack muted">
              <div>No role system yet. All approved emails see the same UI.</div>
              <div>No offline mode. Transactions are online-first.</div>
              <div>Dashboard is a protected placeholder for the next phases.</div>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
