"use client";

import { useState } from "react";

import type { TransactionListItem, DraftTransactionListItem } from "@/lib/sales/queries";
import type { Department } from "@/lib/sales/static-catalog";
import type { AllowedUser } from "@/app/dashboard/actions";
import { ALL_DEPARTMENTS, getDepartmentLabel } from "@/lib/auth/roles";

import { OverviewTab } from "./overview-tab";
import { DepartmentTab } from "./department-tab";
import { DepartmentSelector } from "./department-selector";
import { UserManagement } from "./user-management";

type TabId = "overview" | Department | "users";

export function OwnerDashboard({
  allTransactions,
  departmentTransactions,
  departmentDrafts,
  allowedUsers,
}: {
  allTransactions: TransactionListItem[];
  departmentTransactions: Record<Department, TransactionListItem[]>;
  departmentDrafts: Record<Department, DraftTransactionListItem[]>;
  allowedUsers: AllowedUser[];
}) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const tabs: { id: TabId; label: string }[] = [
    { id: "overview", label: "Overview" },
    ...ALL_DEPARTMENTS.map((dept) => ({
      id: dept as TabId,
      label: getDepartmentLabel(dept),
    })),
    { id: "users", label: "Users" },
  ];

  return (
    <>
      <div className="salesStepper" style={{ marginBottom: "18px" }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className="salesStepBadge"
            data-active={activeTab === tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
          >
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <OverviewTab transactions={allTransactions} />
      )}

      {ALL_DEPARTMENTS.map((dept) =>
        activeTab === dept ? (
          <DepartmentTab
            key={dept}
            department={dept}
            transactions={departmentTransactions[dept]}
            drafts={departmentDrafts[dept]}
          />
        ) : null,
      )}

      {activeTab === "users" && (
        <UserManagement initialUsers={allowedUsers} />
      )}
    </>
  );
}

export { DepartmentSelector };
