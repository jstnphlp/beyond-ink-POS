"use client";

import { useState } from "react";

export function NumericInput({
  value,
  onChange,
  className,
  ...rest
}: {
  value: number;
  onChange: (value: number) => void;
  className?: string;
} & Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "type"
>) {
  const [editingValue, setEditingValue] = useState<string | null>(null);

  return (
    <input
      {...rest}
      type="text"
      inputMode="decimal"
      className={className}
      value={editingValue ?? String(value)}
      onChange={(e) => {
        const v = e.target.value;
        if (/^\d*\.?\d*$/.test(v)) {
          setEditingValue(v);
          if (v !== "" && v !== ".") {
            onChange(Number(v));
          }
        }
      }}
      onBlur={() => {
        if (editingValue !== null) {
          const num = Number(editingValue);
          onChange(editingValue === "" || isNaN(num) ? 0 : num);
          setEditingValue(null);
        }
      }}
    />
  );
}
