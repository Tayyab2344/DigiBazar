"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CompanyShell } from "@/components/company/CompanyShell";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { Settings, Shield, Bell, DollarSign, Save } from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"account" | "notifications" | "store">("account");

  // Notifications state
  const [notifyNewOrder, setNotifyNewOrder] = useState(true);
  const [notifyLowStock, setNotifyLowStock] = useState(true);

  // Store settings
  const [currency, setCurrency] = useState("PKR");
  const [taxRate, setTaxRate] = useState("0");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Settings updated successfully!");
  };

  return (
    <CompanyShell>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Company Settings</h1>
          <p className="text-xs text-slate-500 mt-1">Configure workspace account, security, store notifications, and tax settings.</p>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("account")}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === "account" ? "bg-amber-500 text-slate-950 font-black shadow-2xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Account & Security
          </button>
          <button
            onClick={() => setActiveTab("notifications")}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === "notifications" ? "bg-amber-500 text-slate-950 font-black shadow-2xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Notifications
          </button>
          <button
            onClick={() => setActiveTab("store")}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === "store" ? "bg-amber-500 text-slate-950 font-black shadow-2xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Store Preferences
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6 text-xs">
        {activeTab === "account" && (
          <div className="space-y-4 max-w-lg">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">Account Details</h2>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">User Name</label>
              <input
                type="text"
                disabled
                value={`${user?.first_name || ""} ${user?.last_name || ""}`}
                className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-bold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                disabled
                value={user?.email || ""}
                className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-bold"
              />
            </div>
            <div className="pt-2">
              <Link
                href="/account/change-password"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition-colors"
              >
                <Shield className="w-4 h-4 text-slate-500" />
                <span>Change Password</span>
              </Link>
            </div>
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="space-y-4 max-w-lg">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">Notification Rules</h2>
            <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <span className="font-bold text-slate-900 block">New Order Notifications</span>
                <span className="text-slate-500 text-[11px]">Receive immediate alerts when customers place orders.</span>
              </div>
              <input
                type="checkbox"
                checked={notifyNewOrder}
                onChange={(e) => setNotifyNewOrder(e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <span className="font-bold text-slate-900 block">Low Stock Alerts</span>
                <span className="text-slate-500 text-[11px]">Get alerted when item inventory drops below threshold.</span>
              </div>
              <input
                type="checkbox"
                checked={notifyLowStock}
                onChange={(e) => setNotifyLowStock(e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded"
              />
            </label>
          </div>
        )}

        {activeTab === "store" && (
          <div className="space-y-4 max-w-lg">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">Currency & Tax</h2>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Store Currency</label>
              <input
                type="text"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Default Tax Rate (%)</label>
              <input
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
              />
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl text-xs font-black text-slate-950 bg-amber-500 hover:bg-amber-600 transition-colors shadow-2xs inline-flex items-center gap-2"
          >
            <Save className="w-4 h-4 text-slate-950" />
            <span>Save Preferences</span>
          </button>
        </div>
      </form>
    </CompanyShell>
  );
}
