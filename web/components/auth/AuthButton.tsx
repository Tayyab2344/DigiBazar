import React, { ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";

export interface AuthButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  variant?: "primary" | "secondary" | "outline";
  fullWidth?: boolean;
}

export const AuthButton: React.FC<AuthButtonProps> = ({
  children,
  isLoading = false,
  loadingText,
  variant = "primary",
  fullWidth = true,
  disabled = false,
  className = "",
  type = "submit",
  ...props
}) => {
  const baseClasses =
    "relative inline-flex items-center justify-center text-sm font-semibold rounded-lg px-4 py-2.5 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-65 active:scale-[0.99]";

  const variantClasses = {
    primary:
      "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-2xs focus:ring-blue-500 border border-transparent",
    secondary:
      "bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white shadow-2xs focus:ring-slate-800 border border-transparent",
    outline:
      "bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 focus:ring-blue-500 shadow-2xs",
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={`${baseClasses} ${variantClasses[variant]} ${
        fullWidth ? "w-full" : ""
      } ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>{loadingText || "Please wait..."}</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};
