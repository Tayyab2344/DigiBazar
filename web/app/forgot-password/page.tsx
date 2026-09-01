import React from "react";
import { Metadata } from "next";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { AuthFooter } from "@/components/auth/AuthFooter";

export const metadata: Metadata = {
  title: "Forgot Password - digiBazar",
  description: "Reset your digiBazar account password.",
};

export default function ForgotPasswordPage() {
  return (
    <AuthLayout>
      <AuthCard>
        <AuthHeader
          title="Forgot password?"
          description="Enter your email address and we'll send you a link to reset your password."
          badge="Account Recovery"
        />
        <ForgotPasswordForm />
        <AuthFooter mode="forgot_password" />
      </AuthCard>
    </AuthLayout>
  );
}
