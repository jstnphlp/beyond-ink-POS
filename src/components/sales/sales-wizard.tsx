"use client";

import type { DraftSaleInput } from "@/lib/sales/types";
import type { SalesSetupData } from "@/lib/sales/queries";

export function SalesWizard({
  mode,
  setupData,
  initialSale,
}: {
  mode: "create" | "edit";
  setupData: SalesSetupData;
  initialSale?: DraftSaleInput | null;
}) {
  return (
    <section className="panel">
      <h2>{mode === "create" ? "New sale" : "Resume draft"}</h2>
      <p className="muted">
        Wizard implementation is next. Active services: {setupData.services.length}.{" "}
        {initialSale ? "Draft data loaded." : "Starting a fresh transaction."}
      </p>
    </section>
  );
}
