import type { TransactionListItem } from "@/lib/sales/queries";

export function TransactionHistory({
  transactions,
}: {
  transactions: TransactionListItem[];
}) {
  if (transactions.length === 0) {
    return (
      <section className="panel">
        <p className="muted">No completed or cancelled transactions yet.</p>
      </section>
    );
  }

  const completedTxns = transactions.filter((t) => t.status === "completed");
  const cancelledTxns = transactions.filter((t) => t.status === "cancelled");
  const totalRevenue = completedTxns.reduce(
    (sum, t) => sum + Number(t.final_total),
    0,
  );

  return (
    <>
      <div className="revenueGrid">
        <div className="revenueCard revenueCard--primary">
          <span className="revenueCard__label">Total Revenue</span>
          <span className="revenueCard__value">
            ₱{totalRevenue.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="revenueCard">
          <span className="revenueCard__label">Completed</span>
          <span className="revenueCard__value">{completedTxns.length}</span>
        </div>
        <div className="revenueCard">
          <span className="revenueCard__label">Cancelled</span>
          <span className="revenueCard__value">{cancelledTxns.length}</span>
        </div>
      </div>

    <section className="panel" style={{ padding: 0, overflow: "hidden" }}>
      <table className="txnTable">
        <thead>
          <tr>
            <th>#</th>
            <th>Cashier</th>
            <th>Status</th>
            <th>Total</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((txn) => (
            <tr key={txn.id}>
              <td>
                <strong>{txn.transaction_number}</strong>
              </td>
              <td>{txn.cashier_name}</td>
              <td>
                <span
                  className={
                    txn.status === "completed"
                      ? "badge badge--success"
                      : "badge badge--cancelled"
                  }
                >
                  {txn.status === "completed" ? "Completed" : "Cancelled"}
                </span>
              </td>
              <td>₱{Number(txn.final_total).toFixed(2)}</td>
              <td className="muted">
                {new Date(
                  txn.completed_at ?? txn.cancelled_at ?? txn.created_at,
                ).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
    </>
  );
}
