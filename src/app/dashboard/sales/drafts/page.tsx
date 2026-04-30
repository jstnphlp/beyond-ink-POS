import { redirect } from "next/navigation";

import { DraftList } from "@/components/sales/draft-list";
import { SalesShell } from "@/components/sales/sales-shell";
import { getAuthorizedUser } from "@/lib/auth/get-authorized-user";
import { getDraftTransactions } from "@/lib/sales/queries";

export default async function SalesDraftsPage() {
  const user = await getAuthorizedUser();

  if (!user) {
    redirect("/login");
  }

  const drafts = await getDraftTransactions();

  return (
    <SalesShell
      title="Draft Sales"
      description="Resume any saved draft transaction from the list below."
    >
      <DraftList drafts={drafts} />
    </SalesShell>
  );
}
