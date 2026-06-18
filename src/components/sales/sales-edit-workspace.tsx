"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { saveDraft } from "@/app/dashboard/sales/actions";
import type { DraftTransactionListItem, SalesSetupData } from "@/lib/sales/queries";
import type { DraftSaleInput, Department } from "@/lib/sales/types";

import { DraftSidebar } from "./draft-sidebar";
import { SalesWizard } from "./sales-wizard";

function saleHasContent(sale: DraftSaleInput): boolean {
  return (
    sale.cashierName.trim() !== "" ||
    sale.serviceLines.length > 0 ||
    sale.delivery.enabled
  );
}

export function SalesEditWorkspace({
  department,
  setupData,
  initialSale,
  initialDrafts,
}: {
  department: Department;
  setupData: SalesSetupData;
  initialSale: DraftSaleInput;
  initialDrafts: DraftTransactionListItem[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function handleSelectDraft(draftId: string) {
    startTransition(async () => {
      try {
        if (initialSale.transactionId !== draftId && saleHasContent(initialSale)) {
          await saveDraft(initialSale);
        }
        router.push(`/dashboard/sales/${draftId}`);
        router.refresh();
      } catch (err) {
        console.error("Failed to auto-save current draft:", err);
        router.push(`/dashboard/sales/${draftId}`);
        router.refresh();
      }
    });
  }

  return (
    <div className="salesLayout">
      <div className="salesLayout__main">
        <SalesWizard
          mode="edit"
          department={department}
          setupData={setupData}
          initialSale={initialSale}
        />
      </div>
      <DraftSidebar
        activeDraftId={initialSale.transactionId}
        drafts={initialDrafts}
        onSelectDraft={handleSelectDraft}
      />
    </div>
  );
}
