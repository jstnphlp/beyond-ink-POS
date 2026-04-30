import { notFound, redirect } from "next/navigation";

import { SalesShell } from "@/components/sales/sales-shell";
import { SalesWizard } from "@/components/sales/sales-wizard";
import { getAuthorizedUser } from "@/lib/auth/get-authorized-user";
import { getDraftTransactionById, getSalesSetupData } from "@/lib/sales/queries";

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
  const [setupData, initialSale] = await Promise.all([
    getSalesSetupData(),
    getDraftTransactionById(transactionId),
  ]);

  if (!initialSale) {
    notFound();
  }

  return (
    <SalesShell
      title="Resume Draft"
      description="Continue editing a saved draft transaction."
    >
      <SalesWizard mode="edit" setupData={setupData} initialSale={initialSale} />
    </SalesShell>
  );
}
