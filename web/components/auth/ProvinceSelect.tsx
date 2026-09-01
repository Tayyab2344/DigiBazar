"use client";

import React from "react";
import { ChevronDown } from "lucide-react";

export const PAKISTAN_PROVINCES = [
  "Punjab",
  "Sindh",
  "Khyber Pakhtunkhwa",
  "Balochistan",
  "Islamabad Capital Territory",
  "Gilgit-Baltistan",
  "Azad Jammu and Kashmir",
];

interface ProvinceSelectProps {
  label: string;
  value: string;
  onChange: (province: string) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
}

export function ProvinceSelect({
  label,
  value,
  onChange,
  error,
  required = false,
  placeholder = "Select province",
}: ProvinceSelectProps) {
  return (
    <div className="space-y-1.5 relative">
      <label className="block text-xs font-semibold text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full h-[48px] px-3.5 pr-8 appearance-none rounded-lg border bg-white text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 ${
            value ? "text-slate-900 font-medium" : "text-slate-400"
          } ${error ? "border-red-500" : "border-slate-300"}`}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {PAKISTAN_PROVINCES.map((prov) => (
            <option key={prov} value={prov} className="text-slate-900">
              {prov}
            </option>
          ))}
          <option value="Other / State" className="text-slate-900">
            Other / State / Territory
          </option>
        </select>
        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>
      {error && <p className="text-xs text-red-600 font-medium mt-1">{error}</p>}
    </div>
  );
}
