import React, { Suspense } from "react";
import { Metadata } from "next";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { AuthFooter } from "@/components/auth/AuthFooter";

export const metadata: Metadata = {
  title: "Reset Password - digiBazar",
  description: "Set a new password for your digiBazar account.",
};

export default function ResetPasswordPage() {
  return (
    <AuthLayout>
      <AuthCard>
        <AuthHeader
          title="Reset your password"
          description="Create a new password to access your digiBazar account."
          badge="Security Update"
        />
        <Suspense fallback={<div className="py-8 text-center text-xs text-slate-500">Loading form...</div>}>
          <ResetPasswordForm />
        </Suspense>
        <AuthFooter mode="reset_password" />
      </AuthCard>
    </AuthLayout>
  );
}
