export default function HistoryLoading() {
  return (
    <main className="shell">
      <div className="shell__inner">
        <section className="hero">
          <div className="hero__card">
            <p className="eyebrow">Sales</p>
            <div className="loadingSkeleton" style={{ height: "3rem", width: "50%", marginBottom: "16px" }} />
            <div className="loadingSkeleton" style={{ height: "1rem", width: "70%" }} />
          </div>
        </section>

        <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
          <div className="loadingSkeleton" style={{ height: "40px", width: "140px", borderRadius: "var(--radius)" }} />
          <div className="loadingSkeleton" style={{ height: "40px", width: "140px", borderRadius: "var(--radius)" }} />
          <div className="loadingSkeleton" style={{ height: "40px", width: "80px", borderRadius: "var(--radius)" }} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "16px" }}>
          <div className="loadingSkeleton" style={{ height: "72px", borderRadius: "var(--radius)" }} />
          <div className="loadingSkeleton" style={{ height: "72px", borderRadius: "var(--radius)" }} />
        </div>

        <div className="loadingSkeleton" style={{ height: "400px", borderRadius: "var(--radius)" }} />
      </div>
    </main>
  );
}
