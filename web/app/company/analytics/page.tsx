"use client";

import React, { useState, useEffect } from "react";
import { CompanyShell } from "@/components/company/CompanyShell";
import { companyApi } from "@/lib/api/company";
import type { CompanyDashboardStats, CompanyProductRead } from "@/types/company";
import { Download } from "lucide-react";

export default function AnalyticsPage() {
  const [range, setRange] = useState("30d");
  const [stats, setStats] = useState<CompanyDashboardStats | null>(null);
  const [products, setProducts] = useState<CompanyProductRead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        setLoading(true);
        const [statsData, prodsRes] = await Promise.all([
          companyApi.getDashboardStats().catch(() => null),
          companyApi.listProducts({ page: 1, page_size: 100 }).catch(() => ({ items: [], total: 0 })),
        ]);
        if (statsData) setStats(statsData);
        if (prodsRes) setProducts(prodsRes.items);
      } catch (err) {
        console.error("Failed to load analytics:", err);
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, [range]);

  const formatPKR = (cents: number) => `PKR ${(cents / 100).toLocaleString("en-PK", { minimumFractionDigits: 2 })}`;

  const totalOrders = stats?.total_orders || 0;
  const totalCustomers = stats?.total_customers || 0;
  const totalProducts = stats?.total_products || 0;
  const grossRevenue = stats?.gross_revenue || 0;

  // Compute category / product revenue shares dynamically
  const productShares = products.slice(0, 4).map((p) => {
    const revenueCents = p.sales_count * p.price;
    const pct = grossRevenue > 0 ? Math.round((revenueCents / grossRevenue) * 100) : 0;
    return { name: p.name, revenueCents, pct };
  });

  return (
    <CompanyShell>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sales & Commerce Analytics</h1>
          <p className="text-xs text-slate-500 mt-1">Deep operational insights, conversion funnel, and product category breakdowns.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-1 bg-slate-100 rounded-xl flex items-center gap-1 text-xs">
            {["7d", "30d", "90d"].map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-lg font-semibold uppercase transition-all ${
                  range === r ? "bg-amber-500 text-slate-950 font-bold shadow-2xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <button className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors">
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Conversion Funnel Visualization */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <h2 className="text-base font-bold text-slate-900">Store Conversion Funnel</h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Step 1</span>
            <span className="block font-bold text-slate-900 text-sm">Product Listings</span>
            <span className="text-xl font-extrabold text-amber-600">{totalProducts}</span>
            <span className="block text-[11px] text-slate-500">Active catalog items</span>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Step 2</span>
            <span className="block font-bold text-slate-900 text-sm">Engaged Buyers</span>
            <span className="text-xl font-extrabold text-indigo-600">{totalCustomers}</span>
            <span className="block text-[11px] text-emerald-600 font-semibold">Unique customers</span>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Step 3</span>
            <span className="block font-bold text-slate-900 text-sm">Completed Orders</span>
            <span className="text-xl font-extrabold text-purple-600">{totalOrders}</span>
            <span className="block text-[11px] text-emerald-600 font-semibold">Fulfillable orders</span>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Step 4</span>
            <span className="block font-bold text-slate-900 text-sm">Gross Sales</span>
            <span className="text-xl font-extrabold text-emerald-600">{formatPKR(grossRevenue)}</span>
            <span className="block text-[11px] text-emerald-600 font-semibold">Confirmed revenue</span>
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Order Status Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <h2 className="text-base font-bold text-slate-900">Fulfillment Status Breakdown</h2>
          <div className="space-y-3 pt-2">
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-900 mb-1">
                <span>Pending Orders</span>
                <span>{stats?.pending_orders || 0}</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: `${totalOrders > 0 ? Math.round(((stats?.pending_orders || 0) / totalOrders) * 100) : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-900 mb-1">
                <span>Processing / Shipped</span>
                <span>{(stats?.processing_orders || 0) + (stats?.shipped_orders || 0)}</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: `${totalOrders > 0 ? Math.round((((stats?.processing_orders || 0) + (stats?.shipped_orders || 0)) / totalOrders) * 100) : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-900 mb-1">
                <span>Delivered Orders</span>
                <span>{stats?.delivered_orders || 0}</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full"
                  style={{ width: `${totalOrders > 0 ? Math.round(((stats?.delivered_orders || 0) / totalOrders) * 100) : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Chart 2: Product Performance Revenue Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <h2 className="text-base font-bold text-slate-900">Catalog Product Revenue Share</h2>
          <div className="space-y-3 pt-2">
            {productShares.length > 0 ? (
              productShares.map((item, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-xs font-bold text-slate-900 mb-1">
                    <span className="truncate max-w-[200px]">{item.name}</span>
                    <span>{formatPKR(item.revenueCents)} ({item.pct}%)</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full"
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 text-center py-6">No product revenue items recorded yet.</p>
            )}
          </div>
        </div>
      </div>
    </CompanyShell>
  );
}
