"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { saveDraft } from "@/app/dashboard/sales/actions";
import type { DraftTransactionListItem, SalesSetupData } from "@/lib/sales/queries";
import type { DraftSaleInput, Department } from "@/lib/sales/types";

import { DraftSidebar } from "./draft-sidebar";
import { RefreshSettingsButton } from "./refresh-settings-button";
import { SalesWizard } from "./sales-wizard";

function buildEmptySale(department: Department): DraftSaleInput {
  return {
    department,
    cashierName: "",
    status: "draft",
    serviceLines: [],
    discount: null,
    delivery: {
      enabled: false,
      customerName: "",
      address: "",
      dropOffLocation: "",
      deliveryFee: 0,
    },
    payment: null,
  };
}

function saleHasContent(sale: DraftSaleInput): boolean {
  return (
    sale.cashierName.trim() !== "" ||
    sale.serviceLines.length > 0 ||
    sale.delivery.enabled
  );
}

export function SalesWorkspace({
  department,
  setupData,
  initialDrafts,
  activeStaff,
}: {
  department: Department;
  setupData: SalesSetupData;
  initialDrafts: DraftTransactionListItem[];
  activeStaff?: string[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [sale, setSale] = useState<DraftSaleInput>(buildEmptySale(department));

  async function handleSelectDraft(draftId: string) {
    // If current sale has content, auto-save it as a draft first
    startTransition(async () => {
      try {
        if (saleHasContent(sale) && sale.status !== "completed") {
          await saveDraft(sale);
        }

        // Navigate to the draft edit page; this triggers a server fetch of the draft data
        router.push(`/dashboard/sales/${draftId}`);
        router.refresh();
      } catch (err) {
        console.error("Failed to auto-save current draft:", err);
        // Still navigate even if save fails
        router.push(`/dashboard/sales/${draftId}`);
        router.refresh();
      }
    });
  }

  return (
    <div className="salesLayout">
      <div className="salesLayout__main">
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "8px" }}>
          <RefreshSettingsButton />
        </div>
        <SalesWizard
          mode="create"
          department={department}
          setupData={setupData}
          sale={sale}
          onSaleChange={setSale}
          activeStaff={activeStaff}
        />
      </div>
      <DraftSidebar
        activeDraftId={sale.transactionId}
        drafts={initialDrafts}
        onSelectDraft={handleSelectDraft}
      />
    </div>
  );
}
