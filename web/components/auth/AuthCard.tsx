import React from "react";

interface AuthCardProps {
  children: React.ReactNode;
  className?: string;
  maxWidthClassName?: string;
}

export const AuthCard: React.FC<AuthCardProps> = ({
  children,
  className = "",
  maxWidthClassName = "max-w-[460px]",
}) => {
  return (
    <div
      className={`w-full ${maxWidthClassName} bg-white rounded-xl border border-slate-200/90 shadow-sm p-6 sm:p-8 transition-all ${className}`}
    >
      {children}
    </div>
  );
};
