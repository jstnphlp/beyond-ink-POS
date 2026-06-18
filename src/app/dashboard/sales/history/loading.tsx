export default function HistoryLoading() {
  return (
    <main className="shell">
      <div className="shell__inner">
        <section className="hero">
          <div className="hero__card">
            <p className="eyebrow">Sales</p>
            <div className="loadingSkeleton" style={{ height: "3rem", width: "60%", marginBottom: "16px" }} />
            <div className="loadingSkeleton" style={{ height: "1rem", width: "80%", marginBottom: "16px" }} />
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
