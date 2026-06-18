import type { Department } from "@/lib/sales/static-catalog";

export type WizardStepConfig = {
  id: string;
  label: string;
  showMaterials: boolean;
};

const PHYSICAL_DEPT_STEPS: WizardStepConfig[] = [
  { id: "services", label: "Services", showMaterials: false },
  { id: "materials", label: "Materials & Add-ons", showMaterials: true },
  { id: "delivery", label: "Delivery & Discount", showMaterials: false },
  { id: "payment", label: "Payment & Review", showMaterials: false },
];

const DESIGN_DEPT_STEPS: WizardStepConfig[] = [
  { id: "services", label: "Services", showMaterials: false },
  { id: "delivery", label: "Delivery & Discount", showMaterials: false },
  { id: "payment", label: "Payment & Review", showMaterials: false },
];

const DEV_DEPT_STEPS: WizardStepConfig[] = [
  { id: "services", label: "Services", showMaterials: false },
  { id: "delivery", label: "Delivery & Discount", showMaterials: false },
  { id: "payment", label: "Payment & Review", showMaterials: false },
];

export function getWizardSteps(department: Department): WizardStepConfig[] {
  switch (department) {
    case "physical_dept":
      return PHYSICAL_DEPT_STEPS;
    case "design_dept":
      return DESIGN_DEPT_STEPS;
    case "dev_dept":
      return DEV_DEPT_STEPS;
    default:
      return PHYSICAL_DEPT_STEPS;
  }
}

export function hasMaterialsStep(department: Department): boolean {
  return department === "physical_dept";
}
