"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { UserRole } from "@/lib/auth/roles";
import { isOwner, canAccessDepartment, getDepartmentsForRole } from "@/lib/auth/roles";
import type { Department } from "@/lib/sales/static-catalog";

type RoleContextValue = {
  role: UserRole;
  email: string;
  isOwner: boolean;
  canAccessDepartment: (department: Department) => boolean;
  departments: Department[];
};

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({
  role,
  email,
  children,
}: {
  role: UserRole;
  email: string;
  children: ReactNode;
}) {
  const value: RoleContextValue = {
    role,
    email,
    isOwner: isOwner(role),
    canAccessDepartment: (dept: Department) => canAccessDepartment(role, dept),
    departments: getDepartmentsForRole(role),
  };

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole(): RoleContextValue {
  const ctx = useContext(RoleContext);
  if (!ctx) {
    throw new Error("useRole must be used within a RoleProvider");
  }
  return ctx;
}
