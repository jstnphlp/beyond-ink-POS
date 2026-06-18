import Link from "next/link";

import type { TransactionListItem, DraftTransactionListItem } from "@/lib/sales/queries";
import type { Department } from "@/lib/sales/static-catalog";
import { getDepartmentLabel, getDepartmentColor } from "@/lib/auth/roles";

export function DepartmentTab({
  department,
  transactions,
  drafts,
}: {
  department: Department;
  transactions: TransactionListItem[];
  drafts: DraftTransactionListItem[];
}) {
  const totalRevenue = transactions.reduce(
    (sum, t) => sum + Number(t.final_total),
    0,
  );

  return (
    <>
      <div className="revenueGrid">
        <div
          className="revenueCard revenueCard--primary"
          style={{ borderLeft: `4px solid ${getDepartmentColor(department)}` }}
        >
          <span className="revenueCard__label">{getDepartmentLabel(department)} Revenue</span>
          <span className="revenueCard__value">
            ₱{totalRevenue.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="revenueCard">
          <span className="revenueCard__label">Completed</span>
          <span className="revenueCard__value">{transactions.length}</span>
        </div>
        <div className="revenueCard">
          <span className="revenueCard__label">Drafts</span>
          <span className="revenueCard__value">{drafts.length}</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: "12px", marginTop: "18px" }}>
        <Link className="button" href={`/dashboard/sales?dept=${department}`}>
          New {getDepartmentLabel(department)} Sale
        </Link>
      </div>

      {drafts.length > 0 && (
        <section className="panel" style={{ marginTop: "18px" }}>
          <h3>Draft Transactions</h3>
          <ul className="list" style={{ marginTop: "8px" }}>
            {drafts.map((draft) => (
              <li key={draft.id}>
                <Link href={`/dashboard/sales/${draft.id}`}>
                  Draft #{draft.transaction_number} — {new Date(draft.created_at).toLocaleDateString()}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {transactions.length > 0 && (
        <section className="panel" style={{ marginTop: "18px", padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "16px 16px 0" }}>
            <h3>Recent Transactions</h3>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="txnTable">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Cashier</th>
                  <th>Total</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 10).map((txn) => (
                  <tr key={txn.id}>
                    <td><strong>{txn.transaction_number}</strong></td>
                    <td>{txn.cashier_name}</td>
                    <td>₱{Number(txn.final_total).toFixed(2)}</td>
                    <td className="muted">
                      {new Date(txn.completed_at || txn.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {transactions.length === 0 && drafts.length === 0 && (
        <section className="panel" style={{ marginTop: "18px" }}>
          <p className="muted">No transactions yet for {getDepartmentLabel(department)}.</p>
        </section>
      )}
    </>
  );
}
