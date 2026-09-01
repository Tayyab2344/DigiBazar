"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { CompanyShell } from "@/components/company/CompanyShell";
import { companyApi } from "@/lib/api/company";
import type { CompanyDashboardStats, CompanyOrderRead, CompanyProductRead, CompanyProfileRead } from "@/types/company";
import {
  DollarSign,
  ShoppingBag,
  Users,
  Package,
  TrendingUp,
  CreditCard,
  Plus,
  ExternalLink,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  ChevronRight,
  Eye,
  RefreshCw,
  Sparkles,
} from "lucide-react";

export default function CompanyDashboardPage() {
  const [profile, setProfile] = useState<CompanyProfileRead | null>(null);
  const [stats, setStats] = useState<CompanyDashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<CompanyOrderRead[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<CompanyProductRead[]>([]);
  const [topProducts, setTopProducts] = useState<CompanyProductRead[]>([]);
  const [loading, setLoading] = useState(true);

  const [timeFilter, setTimeFilter] = useState<"7d" | "30d" | "3m" | "12m">("30d");
  const [chartMetric, setChartMetric] = useState<"revenue" | "orders">("revenue");

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        const [profileData, statsData, ordersRes, productsRes] = await Promise.all([
          companyApi.getProfile().catch(() => null),
          companyApi.getDashboardStats().catch(() => null),
          companyApi.listOrders({ page: 1, page_size: 5 }).catch(() => ({ items: [], total: 0 })),
          companyApi.listProducts({ page: 1, page_size: 20 }).catch(() => ({ items: [], total: 0 })),
        ]);

        if (profileData) setProfile(profileData);
        if (statsData) setStats(statsData);
        if (ordersRes) setRecentOrders(ordersRes.items);
        if (productsRes) {
          const prods = productsRes.items;
          setTopProducts(prods.slice(0, 5));
          setLowStockProducts(prods.filter((p) => p.stock <= (p.low_stock_threshold || 5)));
        }
      } catch (err) {
        console.error("Failed to load dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  const formatPKR = (cents: number) => {
    return `PKR ${(cents / 100).toLocaleString("en-PK", { minimumFractionDigits: 2 })}`;
  };

  const storeName = profile?.name || "Merchant Store";
  const storeSlug = profile?.slug ? `/store/${profile.slug}` : "/";
  const avgOrderVal = stats && stats.total_orders > 0 ? Math.round(stats.gross_revenue / stats.total_orders) : 0;
  const conversionRate = stats && stats.total_customers > 0 
    ? ((stats.total_orders / stats.total_customers) * 10).toFixed(1) 
    : "0.0";

  return (
    <CompanyShell>
      {/* Header Greeting & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200/80 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            Merchant Operating Dashboard
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Good morning, {storeName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Here&apos;s what&apos;s happening with your storefront performance today.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={storeSlug}
            target="_blank"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
          >
            <ExternalLink className="w-4 h-4 text-slate-500" />
            <span>View Store</span>
          </Link>
          <Link
            href="/company/products/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black text-slate-950 bg-amber-500 hover:bg-amber-600 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>Add Product</span>
          </Link>
        </div>
      </div>

      {/* 6 KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* KPI 1: Total Sales */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Sales</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-extrabold text-slate-900 block truncate">
              {stats ? formatPKR(stats.gross_revenue) : "PKR 0.00"}
            </span>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 mt-1">
              <span>Gross sales revenue</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Orders */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Orders</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-extrabold text-slate-900 block">
              {stats ? stats.total_orders.toLocaleString() : "0"}
            </span>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 mt-1">
              <span>{stats?.pending_orders || 0} pending fulfillment</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Customers */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Customers</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-extrabold text-slate-900 block">
              {stats ? stats.total_customers.toLocaleString() : "0"}
            </span>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 mt-1">
              <span>Unique buyers</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Products */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Products</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-extrabold text-slate-900 block">
              {stats ? stats.total_products.toLocaleString() : "0"}
            </span>
            <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500 mt-1">
              <span>{stats?.active_products || 0} active in catalog</span>
            </div>
          </div>
        </div>

        {/* KPI 5: Conversion Rate */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Conversion Rate</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-extrabold text-slate-900 block">
              {conversionRate}%
            </span>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 mt-1">
              <span>Customer order ratio</span>
            </div>
          </div>
        </div>

        {/* KPI 6: Average Order Value */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Avg Order Value</span>
            <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-extrabold text-slate-900 block truncate">
              {formatPKR(avgOrderVal)}
            </span>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 mt-1">
              <span>Average cart size</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sales Performance Interactive Chart Workspace */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Sales Performance</h2>
            <p className="text-xs text-slate-500">Gross store revenue and order fulfillment trends over time.</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Metric Toggle */}
            <div className="p-1 bg-slate-100 rounded-lg flex items-center gap-1 text-xs">
              <button
                onClick={() => setChartMetric("revenue")}
                className={`px-3 py-1 rounded-md font-semibold transition-all ${
                  chartMetric === "revenue" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Revenue
              </button>
              <button
                onClick={() => setChartMetric("orders")}
                className={`px-3 py-1 rounded-md font-semibold transition-all ${
                  chartMetric === "orders" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Orders
              </button>
            </div>

            {/* Time Filter Buttons */}
            <div className="p-1 bg-slate-100 rounded-lg flex items-center gap-1 text-xs">
              {(["7d", "30d", "3m", "12m"] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeFilter(tf)}
                  className={`px-2.5 py-1 rounded-md font-semibold uppercase transition-all ${
                    timeFilter === tf ? "bg-amber-500 text-slate-950 font-black shadow-2xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Professional SVG Area Chart */}
        <div className="h-64 w-full pt-4">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 800 240" fill="none">
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            {/* Gridlines */}
            <line x1="0" y1="40" x2="800" y2="40" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="0" y1="100" x2="800" y2="100" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="0" y1="160" x2="800" y2="160" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="0" y1="220" x2="800" y2="220" stroke="#E2E8F0" strokeWidth="1.5" />

            {/* Smooth Spline Path */}
            <path
              d="M 0 190 Q 100 130, 200 160 T 400 90 T 600 110 T 800 50 L 800 220 L 0 220 Z"
              fill="url(#revenueGrad)"
            />
            <path
              d="M 0 190 Q 100 130, 200 160 T 400 90 T 600 110 T 800 50"
              stroke="#F59E0B"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            {/* Data Point Circles */}
            <circle cx="200" cy="160" r="5" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="2.5" />
            <circle cx="400" cy="90" r="5" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="2.5" />
            <circle cx="600" cy="110" r="5" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="2.5" />
            <circle cx="800" cy="50" r="5" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="2.5" />
          </svg>
        </div>
      </div>

      {/* Two Column Grid: Recent Orders & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recent Orders</h2>
              <p className="text-xs text-slate-500">Latest transactions from your storefront.</p>
            </div>
            <Link
              href="/company/orders"
              className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 font-semibold">
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {recentOrders.length > 0 ? (
                  recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        #{order.id.slice(0, 8)}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {order.customer_name || "Merchant Customer"}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {formatPKR(order.total)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {order.order_status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/company/orders/${order.id}`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-700 hover:bg-amber-50 transition-colors inline-flex"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No orders recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Products (1 col) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Top Selling Products</h2>
            <Link href="/company/products" className="text-xs font-bold text-amber-700 hover:text-amber-800">
              View Catalog
            </Link>
          </div>

          <div className="space-y-3">
            {topProducts.length > 0 ? (
              topProducts.map((product) => (
                <div
                  key={product.id}
                  className="p-3 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-slate-200 shrink-0 overflow-hidden border border-slate-200">
                      {product.images[0] ? (
                        <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-5 h-5 text-slate-400 m-auto" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="block text-xs font-bold text-slate-900 truncate">
                        {product.name}
                      </span>
                      <span className="block text-[11px] text-slate-500 font-medium">
                        {formatPKR(product.price)} &bull; {product.stock} in stock
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-emerald-600 shrink-0">
                    {product.sales_count || 0} sales
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 text-center py-6">No products found in catalog.</p>
            )}
          </div>
        </div>
      </div>

      {/* Low Stock Attention Warning */}
      <div className="bg-white rounded-2xl border border-amber-200 shadow-2xs overflow-hidden">
        <div className="p-5 bg-amber-50/50 border-b border-amber-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900">Low Stock Attention Required</h2>
              <p className="text-xs text-slate-600">Products approaching or below low-stock threshold.</p>
            </div>
          </div>
          <Link
            href="/company/inventory"
            className="text-xs font-black px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-600 transition-colors shadow-2xs"
          >
            Manage Inventory
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 font-semibold">
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Current Stock</th>
                <th className="py-3 px-4">Threshold</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {lowStockProducts.length > 0 ? (
                lowStockProducts.map((p) => (
                  <tr key={p.id}>
                    <td className="py-3 px-4 font-bold text-slate-900">{p.name}</td>
                    <td className="py-3 px-4 font-extrabold text-amber-600">{p.stock} units</td>
                    <td className="py-3 px-4 text-slate-500">{p.low_stock_threshold || 5} units</td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
                        Low Stock
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href="/company/inventory"
                        className="text-xs font-bold text-amber-700 hover:text-amber-800 hover:underline"
                      >
                        Restock Now
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">
                    All inventory levels are healthy. Zero low-stock alerts.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </CompanyShell>
  );
}
