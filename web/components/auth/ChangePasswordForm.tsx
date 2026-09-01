"use client";

import React, { useState } from "react";
import { PasswordInput } from "./PasswordInput";
import { PasswordStrength } from "./PasswordStrength";
import { AuthButton } from "./AuthButton";
import { FormError } from "./FormError";
import { authApi } from "@/lib/api/auth";
import { CheckCircle2 } from "lucide-react";

export const ChangePasswordForm: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!currentPassword) {
      errs.currentPassword = "Current password is required";
    }
    if (!newPassword) {
      errs.newPassword = "New password is required";
    } else if (newPassword.length < 8) {
      errs.newPassword = "New password must be at least 8 characters";
    }

    if (newPassword !== confirmNewPassword) {
      errs.confirmNewPassword = "Passwords do not match";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setSuccessMessage(null);

    if (!validate()) return;

    setIsLoading(true);
    try {
      const res = await authApi.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_new_password: confirmNewPassword,
      });

      setSuccessMessage(res.message || "Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update password. Please try again.";
      setApiError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md w-full bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Change Password</h2>
        <p className="text-xs text-slate-500 mt-1">
          Ensure your account is using a long, random password to stay secure.
        </p>
      </div>

      <FormError message={apiError} />

      {successMessage && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <PasswordInput
        label="Current Password"
        required
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        error={errors.currentPassword}
        autoComplete="current-password"
      />

      <div className="space-y-1">
        <PasswordInput
          label="New Password"
          required
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          error={errors.newPassword}
          autoComplete="new-password"
        />
        <PasswordStrength password={newPassword} />
      </div>

      <PasswordInput
        label="Confirm New Password"
        required
        value={confirmNewPassword}
        onChange={(e) => setConfirmNewPassword(e.target.value)}
        error={errors.confirmNewPassword}
        autoComplete="new-password"
      />

      <div className="pt-2">
        <AuthButton isLoading={isLoading} loadingText="Updating Password...">
          Update Password
        </AuthButton>
      </div>
    </form>
  );
};
