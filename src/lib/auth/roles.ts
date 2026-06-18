import type { Department } from "@/lib/sales/static-catalog";

export type UserRole = "owner" | "design_dept" | "physical_dept" | "dev_dept";

export function isOwner(role: UserRole): boolean {
  return role === "owner";
}

export function canAccessDepartment(role: UserRole, department: Department): boolean {
  if (role === "owner") return true;
  return role === department;
}

export function getDepartmentLabel(dept: string): string {
  switch (dept) {
    case "design_dept":
      return "Design";
    case "physical_dept":
      return "Physical";
    case "dev_dept":
      return "Development";
    default:
      return dept;
  }
}

export function getDepartmentColor(dept: string): string {
  switch (dept) {
    case "design_dept":
      return "#8b5cf6";
    case "physical_dept":
      return "#3b82f6";
    case "dev_dept":
      return "#10b981";
    default:
      return "#6b7280";
  }
}

export function getDefaultRouteForRole(role: UserRole): string {
  if (role === "owner") return "/dashboard";
  return "/dashboard/sales";
}

export function getDepartmentsForRole(role: UserRole): Department[] {
  if (role === "owner") return ["physical_dept", "design_dept", "dev_dept"];
  return [role as Department];
}

export const ALL_DEPARTMENTS: Department[] = ["physical_dept", "design_dept", "dev_dept"];
