"use client";

import type { Department } from "@/lib/sales/static-catalog";
import { getDepartmentLabel, getDepartmentColor } from "@/lib/auth/roles";

export function DepartmentSelector({
  selected,
  onSelect,
}: {
  selected: Department | null;
  onSelect: (dept: Department) => void;
}) {
  const departments: Department[] = ["physical_dept", "design_dept", "dev_dept"];

  return (
    <div className="departmentSelector">
      {departments.map((dept) => (
        <button
          key={dept}
          className={`departmentCard ${selected === dept ? "departmentCard--active" : ""}`}
          style={{ "--dept-color": getDepartmentColor(dept) } as React.CSSProperties}
          type="button"
          onClick={() => onSelect(dept)}
        >
          <span className="departmentCard__name">{getDepartmentLabel(dept)}</span>
          <span className="departmentCard__tag">{dept.replace("_dept", "")}</span>
        </button>
      ))}
    </div>
  );
}
