import React from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl" | number;
  showText?: boolean;
  className?: string;
  textClassName?: string;
  variant?: "full" | "icon-only";
}

export const Logo: React.FC<LogoProps> = ({
  size = "md",
  showText = true,
  className = "",
  textClassName = "",
  variant = "full",
}) => {
  const getDimension = () => {
    if (typeof size === "number") return size;
    switch (size) {
      case "sm":
        return 28;
      case "md":
        return 36;
      case "lg":
        return 48;
      case "xl":
        return 64;
      default:
        return 36;
    }
  };

  const dim = getDimension();

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* CommerceHub Brand Logo SVG */}
      <div
        className="relative flex-shrink-0 flex items-center justify-center transition-transform hover:scale-105"
        style={{ width: `${dim}px`, height: `${dim}px` }}
      >
        <img
          src="/logo.svg"
          alt="DigiBazar Logo"
          className="w-full h-full object-contain drop-shadow-sm"
        />
      </div>

      {/* Brand Text */}
      {showText && variant === "full" && (
        <div className="flex flex-col leading-none">
          <span className={`font-bold tracking-tight text-current ${textClassName || "text-lg"}`}>
            digi<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-sky-400 to-amber-500">Bazar</span>
          </span>
          <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-400 mt-0.5">
            Marketplace
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
