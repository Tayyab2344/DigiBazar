"use client";

import React from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AuthenticatedMenu } from "@/components/auth/AuthenticatedMenu";
import { AuthLogo } from "@/components/auth/AuthLogo";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";

export default function AccountChangePasswordPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {/* Navigation Bar */}
        <header className="bg-white border-b border-slate-200 px-4 sm:px-8 py-3 flex items-center justify-between shadow-sm">
          <AuthLogo size="md" />
          <div className="flex items-center gap-4">
            <AuthenticatedMenu />
          </div>
        </header>

        {/* Form Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex items-center justify-center">
          <ChangePasswordForm />
        </main>
      </div>
    </ProtectedRoute>
  );
}
