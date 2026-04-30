import { redirect } from "next/navigation";

import { SalesShell } from "@/components/sales/sales-shell";
import { SalesWizard } from "@/components/sales/sales-wizard";
import { getAuthorizedUser } from "@/lib/auth/get-authorized-user";
import { getSalesSetupData } from "@/lib/sales/queries";

export default async function SalesPage() {
  const user = await getAuthorizedUser();

  if (!user) {
    redirect("/login");
  }

  const setupData = await getSalesSetupData();

  return (
    <SalesShell
      title="New Sale"
      description="Create a draft or complete a transaction with services, materials, add-ons, delivery, and payment."
    >
      <SalesWizard mode="create" setupData={setupData} />
    </SalesShell>
  );
}
