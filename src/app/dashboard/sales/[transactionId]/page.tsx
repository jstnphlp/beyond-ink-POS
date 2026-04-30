import { notFound, redirect } from "next/navigation";

import { SalesShell } from "@/components/sales/sales-shell";
import { SalesEditWorkspace } from "@/components/sales/sales-edit-workspace";
import { getAuthorizedUser } from "@/lib/auth/get-authorized-user";
import { getDraftTransactionById, getDraftTransactions, getSalesSetupData } from "@/lib/sales/queries";

export default async function DraftTransactionPage({
  params,
}: {
  params: Promise<{ transactionId: string }>;
}) {
  const user = await getAuthorizedUser();

  if (!user) {
    redirect("/login");
  }

  const { transactionId } = await params;
  const [setupData, initialSale, drafts] = await Promise.all([
    getSalesSetupData(),
    getDraftTransactionById(transactionId),
    getDraftTransactions(),
  ]);

  if (!initialSale) {
    notFound();
  }

  return (
    <SalesShell
      title="Resume Draft"
      description="Continue editing a saved draft transaction."
    >
      <SalesEditWorkspace
        setupData={setupData}
        initialSale={initialSale}
        initialDrafts={drafts}
      />
    </SalesShell>
  );
}
