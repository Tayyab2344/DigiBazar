import React from "react";
import Link from "next/link";
import { Store, ShieldCheck, ShoppingBag, Users, Zap, Award } from "lucide-react";

export const metadata = {
  title: "About Us | DigiBazar",
  description: "Learn about DigiBazar, Pakistan's leading multi-vendor digital marketplace.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <Store className="w-4 h-4" /> About DigiBazar
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-4">
            Empowering Modern <span className="text-blue-500">Commerce</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            DigiBazar is a next-generation multi-vendor e-commerce platform bringing together verified sellers, buyers, and creators in one seamless digital ecosystem.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
            <div className="w-12 h-12 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center mb-4">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Curated Marketplace</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Discover thousands of quality products from trusted local and international vendors with instant digital checkout.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
            <div className="w-12 h-12 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Secure Transactions</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Bank-grade security and encrypted payment gateways protect every transaction from cart to delivery.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
            <div className="w-12 h-12 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center mb-4">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Vendor Empowerment</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Comprehensive merchant analytics, automated payouts, and promotional tools for modern business owners.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="p-8 rounded-3xl bg-gradient-to-r from-blue-900/40 via-slate-900 to-indigo-900/40 border border-blue-500/30 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Ready to Join the Marketplace?</h2>
          <p className="text-slate-300 text-sm mb-6 max-w-xl mx-auto">
            Whether you want to shop online or scale your retail business, DigiBazar provides the technology you need.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/search"
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-600/25"
            >
              Start Shopping
            </Link>
            <Link
              href="/register/company"
              className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-sm transition-all"
            >
              Become a Seller
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
