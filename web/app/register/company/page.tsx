import React from "react";
import { Metadata } from "next";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { CompanyRegistrationForm } from "@/components/auth/CompanyRegistrationForm";
import { AuthFooter } from "@/components/auth/AuthFooter";

export const metadata: Metadata = {
  title: "Sell on digiBazar - Company Registration",
  description: "Create your company vendor account and build your storefront on digiBazar.",
};

export default function RegisterCompanyPage() {
  return (
    <AuthLayout>
      <AuthCard maxWidthClassName="max-w-[640px]">
        <AuthHeader
          title="Start selling on digiBazar"
          description="Create your company account and start building your store."
          badge="Business Registration"
        />
        <CompanyRegistrationForm />
        <AuthFooter mode="company_register" />
      </AuthCard>
    </AuthLayout>
  );
}
