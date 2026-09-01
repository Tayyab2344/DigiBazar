import React from "react";
import { FileCheck, ShieldAlert, Scale, CreditCard } from "lucide-react";

export const metadata = {
  title: "Terms & Conditions | DigiBazar",
  description: "Terms & Conditions governing the use of DigiBazar.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <FileCheck className="w-4 h-4" /> Legal Agreement
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Terms & Conditions</h1>
          <p className="text-slate-400 text-sm mt-2">Last updated: January 2026</p>
        </div>

        <div className="space-y-6 text-slate-300 text-sm leading-relaxed border-t border-slate-900 pt-8">
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Scale className="w-5 h-5 text-blue-400" /> 1. Marketplace Usage
            </h2>
            <p>
              By accessing DigiBazar, you agree to comply with all applicable local and international laws. Users must be at least 18 years old or under parental supervision to place orders or register as a store owner.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-400" /> 2. Pricing & Payments
            </h2>
            <p>
              All prices are displayed in PKR or USD as indicated. Prices are set directly by individual marketplace vendors. Verified digital coupons or discount codes are validated server-side during checkout.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" /> 3. Vendor Responsibilities
            </h2>
            <p>
              Sellers on DigiBazar are responsible for the quality, accuracy, and fulfillment of their product listings. Platform admins reserve the right to suspend non-compliant store accounts.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
