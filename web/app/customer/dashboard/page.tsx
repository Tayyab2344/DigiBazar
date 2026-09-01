"use client";

import React from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AuthenticatedMenu } from "@/components/auth/AuthenticatedMenu";
import { AuthLogo } from "@/components/auth/AuthLogo";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { ShoppingBag, Heart, Clock } from "lucide-react";
import Link from "next/link";

export default function CustomerDashboardPage() {
  const user = useAuthStore((state) => state.user);

  return (
    <ProtectedRoute allowedRoles={["CUSTOMER"]}>
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {/* Navigation Bar */}
        <header className="bg-white border-b border-slate-200 px-4 sm:px-8 py-3 flex items-center justify-between shadow-sm">
          <AuthLogo size="md" />
          <div className="flex items-center gap-4">
            <AuthenticatedMenu />
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Customer Portal
              </span>
              <h1 className="text-2xl font-bold text-slate-900 mt-2">
                Hello, {user?.first_name}!
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Welcome back to your digiBazar customer dashboard.
              </p>
            </div>
            <Link
              href="/account/change-password"
              className="text-xs font-semibold px-3.5 py-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors"
            >
              Change Password
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
              <div className="p-2.5 w-fit rounded-lg bg-blue-50 text-blue-600">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">My Orders</h3>
              <p className="text-xs text-slate-500">Track current purchases across vendors.</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
              <div className="p-2.5 w-fit rounded-lg bg-rose-50 text-rose-600">
                <Heart className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Wishlist</h3>
              <p className="text-xs text-slate-500">Save products to buy later.</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
              <div className="p-2.5 w-fit rounded-lg bg-indigo-50 text-indigo-600">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Recent Activity</h3>
              <p className="text-xs text-slate-500">View recently viewed items & coupons.</p>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
