"use client";

import React from "react";
import { Phone } from "lucide-react";

interface PhoneInputProps {
  label?: string;
  name?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  countryCode?: string;
  onCountryCodeChange?: (code: string) => void;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
}

const COUNTRY_CODES = [
  { code: "+92", label: "PK (+92)", flag: "🇵🇰" },
  { code: "+1", label: "US/CA (+1)", flag: "🇺🇸" },
  { code: "+44", label: "UK (+44)", flag: "🇬🇧" },
  { code: "+971", label: "UAE (+971)", flag: "🇦🇪" },
  { code: "+966", label: "KSA (+966)", flag: "🇸🇦" },
];

export const PhoneInput: React.FC<PhoneInputProps> = ({
  label = "Phone Number",
  name = "phone",
  value,
  onChange,
  countryCode = "+92",
  onCountryCodeChange,
  required = false,
  error,
  disabled = false,
  placeholder = "300 1234567",
}) => {
  return (
    <div className="w-full space-y-1.5">
      <div className="flex justify-between items-center text-xs">
        <label
          htmlFor={name}
          className="font-medium text-slate-700 select-none flex items-center gap-1"
        >
          {label}
          {required && <span className="text-red-500 font-bold">*</span>}
        </label>
      </div>

      <div className="flex rounded-lg shadow-2xs">
        {/* Country Code Select */}
        <div className="relative shrink-0">
          <select
            value={countryCode}
            onChange={(e) => onCountryCodeChange && onCountryCodeChange(e.target.value)}
            disabled={disabled}
            className="h-full bg-slate-50 border border-r-0 border-slate-300 rounded-l-lg text-xs font-semibold text-slate-700 pl-3 pr-2 py-2.5 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-colors disabled:opacity-75"
          >
            {COUNTRY_CODES.map((item) => (
              <option key={item.code} value={item.code}>
                {item.flag} {item.code}
              </option>
            ))}
          </select>
        </div>

        {/* Main Phone Number Input */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Phone className="w-4 h-4" />
          </div>
          <input
            id={name}
            name={name}
            type="tel"
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            className={`w-full text-sm rounded-r-lg border bg-white pl-9 pr-3 py-2.5 text-slate-900 placeholder:text-slate-400 transition-all focus:outline-none ${
              error
                ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                : "border-slate-300 hover:border-slate-400 focus:border-black focus:ring-2 focus:ring-zinc-200"
            } ${
              disabled ? "bg-slate-100 text-slate-500 cursor-not-allowed opacity-75" : ""
            }`}
          />
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-600 font-medium flex items-center gap-1 mt-1">
          {error}
        </p>
      )}
    </div>
  );
};
