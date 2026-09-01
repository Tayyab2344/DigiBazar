"use client";

import React from "react";

interface AdminDateRangePickerProps {
  value: string;
  onChange: (value: string) => void;
}

const OPTIONS = [
  { label: "Today", value: "today" },
  { label: "7D", value: "7D" },
  { label: "30D", value: "30D" },
  { label: "90D", value: "90D" },
];

export function AdminDateRangePicker({ value, onChange }: AdminDateRangePickerProps) {
  return (
    <div className="flex items-center p-0.5 bg-[var(--surface-secondary)] border border-[var(--border-primary)] rounded-md text-[12px] font-medium">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1 rounded transition-colors ${
            value === opt.value
              ? "bg-[var(--surface-primary)] text-[var(--text-primary)] shadow-xs font-semibold"
              : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
