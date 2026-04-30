export default function DashboardLoading() {
  return (
    <main className="shell">
      <div className="shell__inner">
        <section className="hero">
          <div className="hero__card">
            <p className="eyebrow">Phase 2 Sales</p>
            <div className="loadingSkeleton" style={{ height: "3rem", width: "60%", marginBottom: "16px" }} />
            <div className="loadingSkeleton" style={{ height: "1rem", width: "80%" }} />
          </div>
        </section>
        <div className="loadingSkeleton" style={{ height: "300px", borderRadius: "var(--radius)" }} />
      </div>
    </main>
  );
}
