"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { AuthInput } from "./AuthInput";
import { PasswordInput } from "./PasswordInput";
import { AuthButton } from "./AuthButton";
import { FormError } from "./FormError";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { validateLoginForm } from "@/lib/auth/validation";

export const LoginForm: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect");
  const login = useAuthStore((state) => state.login);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    const validationErrors = validateLoginForm({ email, password });
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});

    setIsLoading(true);

    try {
      const user = await login({ email, password });
      if (redirectUrl && redirectUrl.startsWith("/")) {
        router.push(redirectUrl);
      } else if (user.role === "SUPER_ADMIN") {
        router.push("/admin/dashboard");
      } else if (user.role === "COMPANY") {
        router.push("/company/dashboard");
      } else {
        router.push("/");
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Invalid email address or password. Please try again.";
      setApiError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <FormError message={apiError} />

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <AuthInput
          label="Email Address"
          name="email"
          type="email"
          required
          placeholder="name@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
          }}
          error={errors.email}
          autoComplete="email"
          icon={<Mail className="w-4 h-4" />}
        />

        <div className="space-y-1">
          <PasswordInput
            label="Password"
            name="password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors((prev) => ({ ...prev, password: "" }));
            }}
            error={errors.password}
            autoComplete="current-password"
          />

          <div className="flex justify-end pt-0.5">
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-zinc-800 hover:text-black hover:underline transition-colors"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <div className="pt-2">
          <AuthButton isLoading={isLoading} loadingText="Signing In...">
            Sign In
          </AuthButton>
        </div>
      </form>

      {/* Quick Demo Accounts */}
      <div className="pt-3 border-t border-slate-200">
        <p className="text-[11px] font-semibold text-slate-500 mb-2 uppercase tracking-wider text-center">
          Quick Demo Accounts
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              setEmail("admin@commercehub.com");
              setPassword("SuperAdmin123!");
            }}
            className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition-colors flex items-center justify-center gap-1.5"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />
            Super Admin
          </button>
          <button
            type="button"
            onClick={() => {
              setEmail("contact@techstore-official.com");
              setPassword("CompanyPass123!");
            }}
            className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-zinc-100 text-zinc-900 hover:bg-zinc-200 border border-zinc-200 transition-colors flex items-center justify-center gap-1.5"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-900" />
            Company
          </button>
        </div>
      </div>
    </div>
  );
};
