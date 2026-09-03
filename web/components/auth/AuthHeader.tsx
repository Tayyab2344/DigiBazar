import React from "react";

interface AuthHeaderProps {
  title: string;
  description: string;
  badge?: string;
  className?: string;
}

export const AuthHeader: React.FC<AuthHeaderProps> = ({
  title,
  description,
  badge,
  className = "",
}) => {
  return (
    <div className={`mb-6 space-y-1.5 ${className}`}>
      {badge && (
        <span className="inline-block px-2.5 py-0.5 mb-1 rounded-full text-[11px] font-semibold bg-zinc-100 text-zinc-900 border border-zinc-200 uppercase tracking-wider">
          {badge}
        </span>
      )}
      <h2 className="text-2xl font-bold tracking-tight text-slate-900">
        {title}
      </h2>
      <p className="text-sm text-slate-500 leading-relaxed">
        {description}
      </p>
    </div>
  );
};
