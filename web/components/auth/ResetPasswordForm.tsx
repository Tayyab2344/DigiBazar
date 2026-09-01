"use client";

import React, { useState } from "react";
import { PasswordInput } from "./PasswordInput";
import { PasswordStrength } from "./PasswordStrength";
import { AuthButton } from "./AuthButton";
import { FormError } from "./FormError";
import { FormSuccess } from "./FormSuccess";
import { useSearchParams } from "next/navigation";
import { authApi } from "@/lib/api/auth";
import { validateResetPasswordForm } from "@/lib/auth/validation";

export const ResetPasswordForm: React.FC = () => {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || searchParams.get("reset_token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    const validationErrors = validateResetPasswordForm({
      password,
      confirm_password: confirmPassword,
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (!token) {
      setApiError("Invalid or missing password reset token in URL.");
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      await authApi.resetPassword({
        reset_token: token,
        new_password: password,
        confirm_new_password: confirmPassword,
      });
      setIsSuccess(true);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Unable to reset password. Link may have expired.";
      setApiError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <FormSuccess
        title="Password reset successfully"
        description="Your password has been updated. You can now log into your digiBazar account using your new password."
        actionText="Sign In"
        actionHref="/login"
      />
    );
  }

  return (
    <div className="space-y-4">
      <FormError message={apiError} />

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <PasswordInput
          label="New Password"
          name="password"
          required
          placeholder="Create new password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (errors.password) setErrors((prev) => ({ ...prev, password: "" }));
          }}
          error={errors.password}
        />

        <PasswordStrength password={password} />

        <PasswordInput
          label="Confirm New Password"
          name="confirm_password"
          required
          placeholder="Re-enter new password"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (errors.confirm_password)
              setErrors((prev) => ({ ...prev, confirm_password: "" }));
          }}
          error={errors.confirm_password}
        />

        <div className="pt-2">
          <AuthButton isLoading={isLoading} loadingText="Resetting...">
            Reset Password
          </AuthButton>
        </div>
      </form>
    </div>
  );
};
