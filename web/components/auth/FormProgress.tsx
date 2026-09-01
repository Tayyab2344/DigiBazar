"use client";

import React from "react";
import { Check } from "lucide-react";

interface Step {
  id: number;
  title: string;
}

const STEPS: Step[] = [
  { id: 1, title: "Company Info" },
  { id: 2, title: "Business Address" },
  { id: 3, title: "Account Owner" },
  { id: 4, title: "Security" },
];

interface FormProgressProps {
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export function FormProgress({ currentStep, onStepClick }: FormProgressProps) {
  return (
    <div className="w-full mb-6">
      <div className="flex items-center justify-between relative">
        {/* Progress connecting line */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 -translate-y-1/2 z-0" />
        <div
          className="absolute top-1/2 left-0 h-0.5 bg-emerald-600 -translate-y-1/2 z-0 transition-all duration-300"
          style={{
            width: `${((Math.min(currentStep, 4) - 1) / (STEPS.length - 1)) * 100}%`,
          }}
        />

        {STEPS.map((step) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          const isClickable = onStepClick && step.id < currentStep;

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center">
              <button
                type="button"
                onClick={() => isClickable && onStepClick(step.id)}
                disabled={!isClickable}
                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-sm ${
                  isCompleted
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : isCurrent
                    ? "bg-emerald-600 text-white ring-4 ring-emerald-100"
                    : "bg-white border-2 border-slate-300 text-slate-400 cursor-not-allowed"
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : step.id}
              </button>
              <span
                className={`text-[11px] font-semibold mt-1.5 hidden sm:block ${
                  isCurrent ? "text-emerald-700" : isCompleted ? "text-slate-700" : "text-slate-400"
                }`}
              >
                {step.title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
