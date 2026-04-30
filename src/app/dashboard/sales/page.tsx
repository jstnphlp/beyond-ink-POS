import { redirect } from "next/navigation";

import { SalesShell } from "@/components/sales/sales-shell";
import { SalesWorkspace } from "@/components/sales/sales-workspace";
import { getAuthenticatedUser } from "@/lib/auth/get-authorized-user";
import { getDraftTransactions, getSalesSetupData } from "@/lib/sales/queries";

export default async function SalesPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  let setupData;
  let drafts;
  try {
    [setupData, drafts] = await Promise.all([
      getSalesSetupData(),
      getDraftTransactions(),
    ]);
  } catch (err: unknown) {
    const message =
      err && typeof err === "object" && "message" in err
        ? String((err as { message: string }).message)
        : "Unknown error loading sales data";
    const code =
      err && typeof err === "object" && "code" in err
        ? String((err as { code: string }).code)
        : undefined;

    console.error("[SalesPage] Failed to load data:", err);

    return (
      <SalesShell
        title="New Sale"
        description="Create a draft or complete a transaction with services, materials, add-ons, delivery, and payment."
      >
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <h2 style={{ color: "var(--color-danger, #e74c3c)", marginBottom: "0.5rem" }}>
            Failed to load sales data
          </h2>
          <p style={{ color: "var(--color-muted, #888)" }}>
            {code ? `[${code}] ` : ""}
            {message}
          </p>
          <p style={{ color: "var(--color-muted, #888)", marginTop: "1rem", fontSize: "0.875rem" }}>
            Check that your Supabase tables exist and RLS policies allow access for authenticated
            users.
          </p>
        </div>
      </SalesShell>
    );
  }

  return (
    <SalesShell
      title="New Sale"
      description="Create a draft or complete a transaction with services, materials, add-ons, delivery, and payment."
    >
      <SalesWorkspace setupData={setupData} initialDrafts={drafts} />
    </SalesShell>
  );
}
