import React from "react";
import Link from "next/link";

interface AuthFooterProps {
  mode?: "login" | "customer_register" | "company_register" | "forgot_password" | "reset_password";
}

export const AuthFooter: React.FC<AuthFooterProps> = ({ mode = "login" }) => {
  return (
    <div className="pt-5 border-t border-slate-200/80 space-y-3 text-center text-xs">
      {mode === "login" && (
        <div className="space-y-1.5">
          <p className="text-slate-600">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-bold text-zinc-900 hover:text-black underline hover:no-underline"
            >
              Create customer account
            </Link>
          </p>
          <p className="text-slate-500 text-[11px]">
            Are you a business?{" "}
            <Link
              href="/register/company"
              className="font-semibold text-slate-800 hover:text-black hover:underline"
            >
              Register your company
            </Link>
          </p>
        </div>
      )}

      {mode === "customer_register" && (
        <div className="space-y-1.5">
          <p className="text-slate-600">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-bold text-zinc-900 hover:text-black underline hover:no-underline"
            >
              Sign in
            </Link>
          </p>
          <p className="text-slate-500 text-[11px]">
            Are you a business?{" "}
            <Link
              href="/register/company"
              className="font-semibold text-slate-800 hover:text-black hover:underline"
            >
              Register your company
            </Link>
          </p>
        </div>
      )}

      {mode === "company_register" && (
        <div className="space-y-1.5">
          <p className="text-slate-600">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-bold text-zinc-900 hover:text-black underline hover:no-underline"
            >
              Sign in
            </Link>
          </p>
          <p className="text-slate-500 text-[11px]">
            Want to shop on digiBazar?{" "}
            <Link
              href="/register"
              className="font-semibold text-slate-800 hover:text-black hover:underline"
            >
              Create a customer account
            </Link>
          </p>
        </div>
      )}

      {(mode === "forgot_password" || mode === "reset_password") && (
        <p className="text-slate-600">
          Remember your password?{" "}
          <Link
            href="/login"
            className="font-bold text-zinc-900 hover:text-black underline hover:no-underline"
          >
            Sign in
          </Link>
        </p>
      )}

      <p className="text-[11px] text-slate-400 leading-normal pt-1">
        By continuing, you agree to our{" "}
        <Link href="/terms" className="underline hover:text-slate-600">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline hover:text-slate-600">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
};
