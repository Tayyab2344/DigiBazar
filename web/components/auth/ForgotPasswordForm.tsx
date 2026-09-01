"use client";

import React, { useState } from "react";
import { Mail } from "lucide-react";
import { AuthInput } from "./AuthInput";
import { AuthButton } from "./AuthButton";
import { FormError } from "./FormError";
import { FormSuccess } from "./FormSuccess";
import { authApi } from "@/lib/api/auth";
import { validateForgotPasswordForm } from "@/lib/auth/validation";

export const ForgotPasswordForm: React.FC = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    const validationErrors = validateForgotPasswordForm({ email });
    if (validationErrors.email) {
      setError(validationErrors.email);
      return;
    }
    setError("");

    setIsLoading(true);

    try {
      await authApi.forgotPassword({ email });
      setIsSuccess(true);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Unable to process password reset. Please try again.";
      setApiError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <FormSuccess
        title="Check your email"
        description={`We've sent a password reset link to ${email}. Please check your inbox and follow the instructions to reset your password.`}
        actionText="Back to Sign In"
        actionHref="/login"
      />
    );
  }

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
            if (error) setError("");
          }}
          error={error}
          autoComplete="email"
          icon={<Mail className="w-4 h-4" />}
          helperText="We will send a secure password reset link to this email."
        />

        <div className="pt-2">
          <AuthButton isLoading={isLoading} loadingText="Sending...">
            Send Reset Link
          </AuthButton>
        </div>
      </form>
    </div>
  );
};
