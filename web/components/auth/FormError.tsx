import React from "react";
import { AlertCircle } from "lucide-react";

interface FormErrorProps {
  message?: string | null;
  className?: string;
}

export const FormError: React.FC<FormErrorProps> = ({ message, className = "" }) => {
  if (!message) return null;

  return (
    <div
      className={`p-3.5 rounded-lg bg-red-50 border border-red-200/90 text-red-700 text-xs font-medium flex items-start gap-2.5 shadow-2xs ${className}`}
      role="alert"
    >
      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
      <div className="flex-1 leading-snug">{message}</div>
    </div>
  );
};
