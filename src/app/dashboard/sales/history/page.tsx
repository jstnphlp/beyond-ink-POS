import { redirect } from "next/navigation";

import { SalesShell } from "@/components/sales/sales-shell";
import { TransactionHistory } from "@/components/sales/transaction-history";
import { getAuthenticatedUser } from "@/lib/auth/get-authorized-user";
import { getTransactionHistory } from "@/lib/sales/queries";

export default async function TransactionHistoryPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  const transactions = await getTransactionHistory();

  return (
    <SalesShell
      title="Transaction History"
      description="View all completed and cancelled transactions."
    >
      <TransactionHistory transactions={transactions} />
    </SalesShell>
  );
}
