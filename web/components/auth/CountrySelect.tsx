"use client";

import React from "react";
import { ChevronDown } from "lucide-react";

export const COUNTRIES = [
  "Pakistan",
  "United States",
  "United Kingdom",
  "United Arab Emirates",
  "Saudi Arabia",
  "Canada",
  "Australia",
  "Germany",
  "France",
  "China",
  "Other",
];

interface CountrySelectProps {
  label: string;
  value: string;
  onChange: (country: string) => void;
  error?: string;
  required?: boolean;
}

export function CountrySelect({
  label,
  value = "Pakistan",
  onChange,
  error,
  required = false,
}: CountrySelectProps) {
  return (
    <div className="space-y-1.5 relative">
      <label className="block text-xs font-semibold text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full h-[48px] px-3.5 pr-8 appearance-none rounded-lg border bg-white text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 font-medium ${
            error ? "border-red-500" : "border-slate-300"
          }`}
        >
          {COUNTRIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>
      {error && <p className="text-xs text-red-600 font-medium mt-1">{error}</p>}
    </div>
  );
}
