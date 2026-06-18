"use client";

import { useState, useRef, useEffect } from "react";

export const CASHIER_NAMES = ["Buknoy", "Mark", "Paul", "Philip"] as const;

export function CashierSelect({
  value,
  onChange,
  preSelected,
}: {
  value: string;
  onChange: (value: string) => void;
  preSelected?: string[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  const selected = value
    ? value.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  // Auto-fill from preSelected on mount if value is empty
  useEffect(() => {
    if (!initialized.current && preSelected && preSelected.length > 0 && !value) {
      initialized.current = true;
      onChange(preSelected.join(", "));
    }
  }, [preSelected, value, onChange]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function toggle(name: string) {
    const next = selected.includes(name)
      ? selected.filter((n) => n !== name)
      : [...selected, name];
    onChange(next.join(", "));
  }

  const displayLabel =
    selected.length === 0
      ? "Select cashier..."
      : selected.length <= 2
        ? selected.join(", ")
        : `${selected[0]}, +${selected.length - 1} more`;

  return (
    <div className="cashierSelect" ref={ref}>
      <button
        className="cashierSelect__trigger"
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span className={selected.length === 0 ? "cashierSelect__placeholder" : ""}>
          {displayLabel}
        </span>
        <span className="cashierSelect__arrow">{isOpen ? "▲" : "▼"}</span>
      </button>

      {isOpen && (
        <div className="cashierSelect__dropdown">
          {CASHIER_NAMES.map((name) => (
            <label key={name} className="cashierSelect__option">
              <input
                type="checkbox"
                checked={selected.includes(name)}
                onChange={() => toggle(name)}
              />
              <span>{name}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
