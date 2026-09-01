import React from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { AuthButton } from "./AuthButton";

interface FormSuccessProps {
  title: string;
  description: string;
  actionText?: string;
  actionHref?: string;
  onActionClick?: () => void;
}

export const FormSuccess: React.FC<FormSuccessProps> = ({
  title,
  description,
  actionText = "Continue",
  actionHref,
  onActionClick,
}) => {
  return (
    <div className="text-center py-4 space-y-5">
      <div className="w-12 h-12 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-600 mx-auto shadow-2xs">
        <CheckCircle2 className="w-6 h-6" />
      </div>

      <div className="space-y-1.5">
        <h3 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
          {description}
        </p>
      </div>

      <div className="pt-2">
        {actionHref ? (
          <Link href={actionHref} className="block w-full">
            <AuthButton type="button">{actionText}</AuthButton>
          </Link>
        ) : (
          <AuthButton type="button" onClick={onActionClick}>
            {actionText}
          </AuthButton>
        )}
      </div>
    </div>
  );
};
