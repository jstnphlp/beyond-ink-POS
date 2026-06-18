import Link from "next/link";
import { redirect } from "next/navigation";

import { SignOutButton } from "@/components/sign-out-button";
import { OwnerDashboard } from "@/components/owner/owner-dashboard";
import { getDashboardAccessCopy } from "@/lib/auth/access-copy";
import { getAuthenticatedUser } from "@/lib/auth/get-authorized-user";
import { isOwner, getDepartmentLabel } from "@/lib/auth/roles";
import {
  getAllTransactionsWithDepartment,
  getDraftTransactions,
} from "@/lib/sales/queries";
import type { Department } from "@/lib/sales/types";
import { ALL_DEPARTMENTS } from "@/lib/auth/roles";

import type { TransactionListItem, DraftTransactionListItem } from "@/lib/sales/queries";

export default async function DashboardPage() {
  const authorizedUser = await getAuthenticatedUser();
  const accessCopy = getDashboardAccessCopy();

  if (!authorizedUser) {
    redirect("/login");
  }

  if (isOwner(authorizedUser.role)) {
    // Owner dashboard: overview + per-department tabs
    const allTransactions = await getAllTransactionsWithDepartment();

    const departmentTransactions: Record<Department, TransactionListItem[]> = {
      physical_dept: [],
      design_dept: [],
      dev_dept: [],
    };
    const departmentDrafts: Record<Department, DraftTransactionListItem[]> = {
      physical_dept: [],
      design_dept: [],
      dev_dept: [],
    };

    for (const dept of ALL_DEPARTMENTS) {
      departmentTransactions[dept] = allTransactions.filter((t) => t.department === dept);
      departmentDrafts[dept] = await getDraftTransactions(dept);
    }

    return (
      <main className="shell">
        <div className="shell__inner">
          <section className="hero">
            <div className="hero__card">
              <p className="eyebrow">Owner Dashboard</p>
              <h1 className="headline">Beyond Ink POS</h1>
              <p className="lead">
                Overview of all departments. Select a department tab below or create a new sale.
              </p>
              <div className="hero__actions">
                <Link className="button" href="/dashboard/sales">
                  New sale
                </Link>
                <Link className="buttonSecondary" href="/dashboard/sales/history">
                  History
                </Link>
                <SignOutButton />
              </div>
            </div>
          </section>

          <OwnerDashboard
            allTransactions={allTransactions}
            departmentTransactions={departmentTransactions}
            departmentDrafts={departmentDrafts}
          />
        </div>
      </main>
    );
  }

  // Department user dashboard: simple view
  const dept = authorizedUser.role as Department;

  return (
    <main className="shell">
      <div className="shell__inner">
        <section className="hero">
          <div className="hero__card">
            <p className="eyebrow">{getDepartmentLabel(dept)} Department</p>
            <h1 className="headline">Beyond Ink POS</h1>
            <p className="lead">
              Welcome back, {authorizedUser.email}. You are signed in to the {getDepartmentLabel(dept)} department.
            </p>
            <div className="hero__actions">
              <Link className="button" href="/dashboard/sales">
                New sale
              </Link>
              <Link className="buttonSecondary" href="/dashboard/sales/drafts">
                Drafts
              </Link>
              <Link className="buttonSecondary" href="/dashboard/sales/history">
                History
              </Link>
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
            <p className="muted" style={{ marginTop: "8px" }}>
              Department: <strong>{getDepartmentLabel(dept)}</strong>
            </p>
          </article>
        </section>
      </div>
    </main>
  );
}
