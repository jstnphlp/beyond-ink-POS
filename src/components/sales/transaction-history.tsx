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

  return (
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
  );
}
