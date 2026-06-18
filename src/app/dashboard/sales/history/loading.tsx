import { SalesShell } from "@/components/sales/sales-shell";

export default function HistoryLoading() {
  return (
    <SalesShell
      title="Transaction History"
      description="View all completed and cancelled transactions."
    >
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "16px",
          flexWrap: "wrap",
          alignItems: "flex-end",
        }}
      >
        <label className="salesField">
          <span>From</span>
          <div className="loadingSkeleton" style={{ height: "38px", width: "140px" }} />
        </label>
        <label className="salesField">
          <span>To</span>
          <div className="loadingSkeleton" style={{ height: "38px", width: "140px" }} />
        </label>
        <div className="loadingSkeleton" style={{ height: "40px", width: "80px" }} />
        <div className="loadingSkeleton" style={{ height: "40px", width: "70px" }} />
      </div>

      <div className="revenueGrid">
        <div className="revenueCard revenueCard--primary">
          <span className="revenueCard__label">Total Revenue</span>
          <div className="loadingSkeleton" style={{ height: "2rem", width: "120px" }} />
        </div>
        <div className="revenueCard">
          <span className="revenueCard__label">Transactions</span>
          <div className="loadingSkeleton" style={{ height: "2rem", width: "60px" }} />
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "12px" }}>
        <div className="loadingSkeleton" style={{ height: "32px", width: "140px" }} />
      </div>

      <section className="panel" style={{ padding: 0, overflow: "hidden" }}>
        <table className="txnTable">
          <thead>
            <tr>
              <th>#</th>
              <th>Cashier</th>
              <th>Status</th>
              <th>Total</th>
              <th>Created</th>
              <th>Completed</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 8 }).map((_, i) => (
              <tr key={i}>
                <td><div className="loadingSkeleton" style={{ height: "16px", width: "40px" }} /></td>
                <td><div className="loadingSkeleton" style={{ height: "16px", width: "100px" }} /></td>
                <td><div className="loadingSkeleton" style={{ height: "22px", width: "80px" }} /></td>
                <td><div className="loadingSkeleton" style={{ height: "16px", width: "70px" }} /></td>
                <td><div className="loadingSkeleton" style={{ height: "16px", width: "130px" }} /></td>
                <td><div className="loadingSkeleton" style={{ height: "16px", width: "130px" }} /></td>
                <td><div className="loadingSkeleton" style={{ height: "28px", width: "60px" }} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </SalesShell>
  );
}
