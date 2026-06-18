"use client";

import { useState } from "react";

export function NumericInput({
  value,
  onChange,
  className,
  placeholder,
  ...rest
}: {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  placeholder?: string;
} & Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "type"
>) {
  const [editingValue, setEditingValue] = useState<string | null>(null);

  const isEmpty = value === 0;
  const displayValue = editingValue ?? (isEmpty ? "" : String(value));

  return (
    <input
      {...rest}
      type="text"
      inputMode="decimal"
      className={className}
      placeholder={placeholder ?? "0"}
      value={displayValue}
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
