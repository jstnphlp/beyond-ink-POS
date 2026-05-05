"use client";

import { useTransition } from "react";
import { revalidateSetupData } from "@/app/dashboard/sales/actions";

export function RefreshSettingsButton() {
  const [isPending, startTransition] = useTransition();

  function handleRefresh() {
    startTransition(async () => {
      try {
        await revalidateSetupData();
        alert("Settings refreshed successfully!");
      } catch (err) {
        console.error("Failed to refresh settings:", err);
        alert("Failed to refresh settings.");
      }
    });
  }

  return (
    <button
      className="buttonSecondary"
      disabled={isPending}
      onClick={handleRefresh}
      title="Refresh inventory stock levels from the database"
    >
      {isPending ? "Refreshing..." : "Refresh Inventory"}
    </button>
  );
}
