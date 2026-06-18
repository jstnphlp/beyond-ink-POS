import type { TransactionListItem } from "@/lib/sales/queries";
import type { Department } from "@/lib/sales/static-catalog";
import { getDepartmentLabel, getDepartmentColor } from "@/lib/auth/roles";

export function OverviewTab({
  transactions,
}: {
  transactions: TransactionListItem[];
}) {
  const totalRevenue = transactions.reduce(
    (sum, t) => sum + Number(t.final_total),
    0,
  );

  const byDepartment = (["physical_dept", "design_dept", "dev_dept"] as Department[]).map(
    (dept) => {
      const deptTxns = transactions.filter((t) => t.department === dept);
      const deptRevenue = deptTxns.reduce((sum, t) => sum + Number(t.final_total), 0);
      return {
        department: dept,
        label: getDepartmentLabel(dept),
        color: getDepartmentColor(dept),
        count: deptTxns.length,
        revenue: deptRevenue,
      };
    },
  );

  const recentTransactions = transactions.slice(0, 10);

  return (
    <>
      <div className="revenueGrid">
        <div className="revenueCard revenueCard--primary">
          <span className="revenueCard__label">Total Revenue (All Departments)</span>
          <span className="revenueCard__value">
            ₱{totalRevenue.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="revenueCard">
          <span className="revenueCard__label">Total Transactions</span>
          <span className="revenueCard__value">{transactions.length}</span>
        </div>
      </div>

      <section className="panel" style={{ marginTop: "18px" }}>
        <h3>Department Breakdown</h3>
        <div className="revenueGrid" style={{ marginTop: "12px" }}>
          {byDepartment.map((dept) => (
            <div
              key={dept.department}
              className="revenueCard"
              style={{ borderLeft: `4px solid ${dept.color}` }}
            >
              <span className="revenueCard__label">{dept.label}</span>
              <span className="revenueCard__value">
                ₱{dept.revenue.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
              </span>
              <span className="muted" style={{ fontSize: "0.8rem" }}>
                {dept.count} transaction{dept.count !== 1 ? "s" : ""}
              </span>
            </div>
          ))}
        </div>
      </section>

      {recentTransactions.length > 0 && (
        <section className="panel" style={{ marginTop: "18px", padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "16px 16px 0" }}>
            <h3>Recent Transactions</h3>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="txnTable">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Department</th>
                  <th>Cashier</th>
                  <th>Total</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((txn) => (
                  <tr key={txn.id}>
                    <td><strong>{txn.transaction_number}</strong></td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          backgroundColor: getDepartmentColor(txn.department) + "20",
                          color: getDepartmentColor(txn.department),
                        }}
                      >
                        {getDepartmentLabel(txn.department)}
                      </span>
                    </td>
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
    </>
  );
}
