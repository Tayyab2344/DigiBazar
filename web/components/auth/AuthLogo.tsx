import React from "react";
import Link from "next/link";
import { Logo } from "@/components/common/Logo";

interface AuthLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const AuthLogo: React.FC<AuthLogoProps> = ({
  className = "",
  size = "md",
}) => {
  return (
    <Link
      href="/"
      className={`inline-flex items-center transition-opacity hover:opacity-90 ${className}`}
    >
      <Logo size={size} />
    </Link>
  );
};
