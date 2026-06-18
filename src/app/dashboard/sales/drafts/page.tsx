import { redirect } from "next/navigation";

import { DraftList } from "@/components/sales/draft-list";
import { SalesShell } from "@/components/sales/sales-shell";
import { getAuthenticatedUser } from "@/lib/auth/get-authorized-user";
import { isOwner } from "@/lib/auth/roles";
import { getDraftTransactions } from "@/lib/sales/queries";
import type { Department } from "@/lib/sales/types";

export default async function SalesDraftsPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  const department = isOwner(user.role) ? undefined : (user.role as Department);
  const drafts = await getDraftTransactions(department);

  return (
    <SalesShell
      title="Draft Sales"
      description="Resume any saved draft transaction from the list below."
    >
      <DraftList drafts={drafts} />
    </SalesShell>
  );
}
