import { redirect } from "next/navigation";

import { SalesShell } from "@/components/sales/sales-shell";
import { TransactionHistory } from "@/components/sales/transaction-history";
import { getAuthenticatedUser } from "@/lib/auth/get-authorized-user";
import { isOwner } from "@/lib/auth/roles";
import { getTransactionHistory } from "@/lib/sales/queries";
import type { Department } from "@/lib/sales/types";

const PAGE_LIMIT = 50;

export default async function TransactionHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ limit?: string }>;
}) {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  const { limit: limitParam } = await searchParams;
  const limit = Math.min(Math.max(Number(limitParam) || PAGE_LIMIT, PAGE_LIMIT), 500);

  // Owners see all transactions; department users see only their department
  const department = isOwner(user.role) ? undefined : (user.role as Department);
  const transactions = await getTransactionHistory(department, limit);

  return (
    <SalesShell
      title="Transaction History"
      description="View all completed and cancelled transactions."
    >
      <TransactionHistory
        transactions={transactions}
        showDepartment={isOwner(user.role)}
        isOwner={isOwner(user.role)}
        currentLimit={limit}
        hasMore={transactions.length >= limit}
      />
    </SalesShell>
  );
}
