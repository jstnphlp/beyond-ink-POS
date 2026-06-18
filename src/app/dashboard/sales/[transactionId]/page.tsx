import { notFound, redirect } from "next/navigation";

import { SalesShell } from "@/components/sales/sales-shell";
import { SalesEditWorkspace } from "@/components/sales/sales-edit-workspace";
import { getAuthenticatedUser } from "@/lib/auth/get-authorized-user";
import { getDraftTransactionById, getDraftTransactions, getSalesSetupData } from "@/lib/sales/queries";
import type { Department } from "@/lib/sales/types";

export default async function DraftTransactionPage({
  params,
}: {
  params: Promise<{ transactionId: string }>;
}) {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  const { transactionId } = await params;
  const initialSale = await getDraftTransactionById(transactionId);

  if (!initialSale) {
    notFound();
  }

  // Use the transaction's department for fetching setup data
  const department = initialSale.department as Department;

  const [setupData, drafts] = await Promise.all([
    getSalesSetupData(department),
    getDraftTransactions(department),
  ]);

  return (
    <SalesShell
      title="Resume Draft"
      description="Continue editing a saved draft transaction."
    >
      <SalesEditWorkspace
        department={department}
        setupData={setupData}
        initialSale={initialSale}
        initialDrafts={drafts}
      />
    </SalesShell>
  );
}
