import Link from "next/link";
import type { ReactNode } from "react";

export function SalesShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="shell">
      <div className="shell__inner">
        <section className="hero">
          <div className="hero__card">
            <p className="eyebrow">Phase 2 Sales</p>
            <h1 className="headline">{title}</h1>
            <p className="lead">{description}</p>
            <div className="hero__actions">
              <Link className="button" href="/dashboard/sales">
                New sale
              </Link>
              <Link className="buttonSecondary" href="/dashboard/sales/history">
                History
              </Link>
              <Link className="buttonSecondary" href="/dashboard">
                Back to dashboard
              </Link>
            </div>
          </div>
        </section>

        {children}
      </div>
    </main>
  );
}
