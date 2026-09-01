"use client";

import React, { useState } from "react";
import Link from "next/link";
import { User, Lock, Mail, Phone, ShieldCheck, KeyRound, Bell, Save } from "lucide-react";

export default function AccountSettingsPage() {
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "Customer",
    lastName: "User",
    email: "customer@example.com",
    phone: "+92 300 1234567",
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Account Settings</h1>
          <p className="text-slate-400 text-sm mt-1">Manage your personal profile, credentials, and notification preferences.</p>
        </div>

        {saved && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-semibold flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" /> Account preferences updated successfully!
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Navigation Sidebar */}
          <div className="space-y-2">
            <Link
              href="/account/settings"
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-600/20 text-blue-400 font-bold border border-blue-500/30 text-sm"
            >
              <User className="w-4 h-4" /> Personal Profile
            </Link>
            <Link
              href="/account/change-password"
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-all font-medium text-sm border border-slate-800"
            >
              <KeyRound className="w-4 h-4" /> Security & Password
            </Link>
            <Link
              href="/customer/orders"
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-all font-medium text-sm border border-slate-800"
            >
              <Bell className="w-4 h-4" /> Order History
            </Link>
          </div>

          {/* Settings Form */}
          <div className="md:col-span-2 p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6">
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">First Name</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Last Name</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all shadow-lg shadow-blue-600/20"
                >
                  <Save className="w-4 h-4" /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
