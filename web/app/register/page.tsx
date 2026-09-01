import React from "react";
import { Metadata } from "next";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { CustomerRegistrationForm } from "@/components/auth/CustomerRegistrationForm";
import { AuthFooter } from "@/components/auth/AuthFooter";

export const metadata: Metadata = {
  title: "Create Customer Account - digiBazar",
  description: "Register for a free customer account on digiBazar marketplace.",
};

export default function RegisterPage() {
  return (
    <AuthLayout>
      <AuthCard maxWidthClassName="max-w-[580px]">
        <AuthHeader
          title="Create customer account"
          description="Join digiBazar to explore products from thousands of verified sellers."
          badge="Customer Registration"
        />
        <CustomerRegistrationForm />
        <AuthFooter mode="customer_register" />
      </AuthCard>
    </AuthLayout>
  );
}
