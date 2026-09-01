import React, { Suspense } from "react";
import { Metadata } from "next";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { LoginForm } from "@/components/auth/LoginForm";
import { AuthFooter } from "@/components/auth/AuthFooter";

export const metadata: Metadata = {
  title: "Sign In - digiBazar Marketplace",
  description: "Sign in to your digiBazar customer or vendor account.",
};

export default function LoginPage() {
  return (
    <AuthLayout>
      <AuthCard>
        <AuthHeader
          title="Welcome back"
          description="Sign in to continue to digiBazar."
          badge="Account Login"
        />
        <Suspense fallback={<div className="py-8 text-center text-slate-400 text-xs">Loading form...</div>}>
          <LoginForm />
        </Suspense>
        <AuthFooter mode="login" />
      </AuthCard>
    </AuthLayout>
  );
}

