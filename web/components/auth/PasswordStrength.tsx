"use client";

import React from "react";
import { Check } from "lucide-react";
import { PASSWORD_REQUIREMENTS } from "@/lib/auth/constants";

interface PasswordStrengthProps {
  password: string;
}

export const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password }) => {
  if (!password) return null;

  const passedRequirements = PASSWORD_REQUIREMENTS.map((req) => ({
    ...req,
    isMet: req.regex.test(password),
  }));

  const passedCount = passedRequirements.filter((r) => r.isMet).length;

  const getStrengthInfo = () => {
    switch (passedCount) {
      case 0:
      case 1:
        return { label: "Weak", color: "bg-red-500", text: "text-red-600", width: "w-1/4" };
      case 2:
        return { label: "Fair", color: "bg-amber-500", text: "text-amber-600", width: "w-2/4" };
      case 3:
        return { label: "Good", color: "bg-blue-500", text: "text-blue-600", width: "w-3/4" };
      case 4:
        return { label: "Strong", color: "bg-emerald-500", text: "text-emerald-600", width: "w-full" };
      default:
        return { label: "Weak", color: "bg-slate-200", text: "text-slate-500", width: "w-0" };
    }
  };

  const strength = getStrengthInfo();

  return (
    <div className="space-y-2 pt-1">
      {/* Strength Bar */}
      <div className="flex items-center justify-between text-[11px] font-semibold">
        <span className="text-slate-600">Password strength</span>
        <span className={strength.text}>{strength.label}</span>
      </div>

      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${strength.color} ${strength.width}`}
        />
      </div>

      {/* Requirement Badges Grid */}
      <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-1 text-[11px]">
        {passedRequirements.map((req) => (
          <div
            key={req.id}
            className={`flex items-center gap-1.5 transition-colors ${
              req.isMet ? "text-emerald-700 font-medium" : "text-slate-500"
            }`}
          >
            {req.isMet ? (
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 ml-1 mr-1 shrink-0" />
            )}
            <span>{req.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
