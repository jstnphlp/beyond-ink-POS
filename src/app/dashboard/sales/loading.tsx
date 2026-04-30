export default function SalesLoading() {
  return (
    <main className="shell">
      <div className="shell__inner">
        <section className="hero">
          <div className="hero__card">
            <p className="eyebrow">Phase 2 Sales</p>
            <div className="loadingSkeleton" style={{ height: "3rem", width: "50%", marginBottom: "16px" }} />
            <div className="loadingSkeleton" style={{ height: "1rem", width: "70%" }} />
          </div>
        </section>
        <div className="salesLayout">
          <div className="loadingSkeleton" style={{ height: "400px", borderRadius: "var(--radius)" }} />
          <div className="loadingSkeleton" style={{ height: "200px", borderRadius: "var(--radius)" }} />
        </div>
      </div>
    </main>
  );
}
