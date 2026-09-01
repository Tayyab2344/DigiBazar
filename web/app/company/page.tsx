import React from "react";
import Link from "next/link";
import { Building2, Store, ArrowRight, ShieldCheck, TrendingUp, Users } from "lucide-react";

export const metadata = {
  title: "Vendor Center | DigiBazar",
  description: "Grow your business on DigiBazar - Pakistan's modern digital marketplace.",
};

export default function CompanyHubPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider">
            <Building2 className="w-4 h-4" /> Vendor Hub
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
            Sell & Scale on <span className="text-blue-500">DigiBazar</span>
          </h1>
          <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto">
            Manage your store, track orders, build promotional campaigns, and process instant payouts with DigiBazar Seller Center.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-8 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 hover:border-slate-700 transition-all">
            <div className="w-12 h-12 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <Store className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Existing Sellers</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Access your seller dashboard to update product inventory, view customer orders, and manage sales campaigns.
            </p>
            <Link
              href="/company/dashboard"
              className="inline-flex items-center gap-2 text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors pt-2"
            >
              Go to Store Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="p-8 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 hover:border-slate-700 transition-all">
            <div className="w-12 h-12 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">New Vendors</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Open your storefront on DigiBazar in minutes. Reach thousands of buyers across the country with low platform commission.
            </p>
            <Link
              href="/register/company"
              className="inline-flex items-center gap-2 text-sm font-bold text-emerald-400 hover:text-emerald-300 transition-colors pt-2"
            >
              Register Your Business <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
