import React from "react";
import { ShieldCheck, Lock, Eye, FileText } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | DigiBazar",
  description: "DigiBazar Privacy Policy and data protection practices.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <ShieldCheck className="w-4 h-4" /> Data Protection
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Privacy Policy</h1>
          <p className="text-slate-400 text-sm mt-2">Last updated: January 2026</p>
        </div>

        <div className="space-y-6 text-slate-300 text-sm leading-relaxed border-t border-slate-900 pt-8">
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-blue-400" /> 1. Information We Collect
            </h2>
            <p>
              We collect information you provide directly to us when creating an account, making a purchase, subscribing to marketing, or registering as a vendor. This includes your name, email address, phone number, shipping address, and payment information processed securely via Stripe.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Eye className="w-5 h-5 text-purple-400" /> 2. How We Use Your Information
            </h2>
            <p>
              Your data is used to fulfill orders, process payments, prevent fraudulent transactions, communicate order updates, and improve marketplace usability.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-400" /> 3. Data Sharing & Security
            </h2>
            <p>
              We do not sell your personal data. We share necessary details (such as delivery addresses) only with verified vendors and logistics partners required to complete your order. All traffic is encrypted via TLS 1.3 protocols.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
