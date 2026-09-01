"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CompanyShell } from "@/components/company/CompanyShell";
import { companyApi } from "@/lib/api/company";
import type { CompanyOrderRead } from "@/types/company";
import {
  ShoppingBag,
  Search,
  Eye,
  Filter,
  CheckCircle2,
  Clock,
  RefreshCw,
  Truck,
  XCircle,
} from "lucide-react";

function CompanyOrdersContent() {
  const searchParams = useSearchParams();
  const statusParam = searchParams.get("status");

  const [orders, setOrders] = useState<CompanyOrderRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(statusParam?.toLowerCase() || "all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (statusParam) {
      setActiveTab(statusParam.toLowerCase());
    } else {
      setActiveTab("all");
    }
  }, [statusParam]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await companyApi.listOrders({ page: 1, page_size: 50 });
      setOrders(res.items);
    } catch (err) {
      console.error("Failed to load orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const formatPKR = (cents: number) => `PKR ${(cents / 100).toLocaleString("en-PK", { minimumFractionDigits: 2 })}`;

  const filteredOrders = orders.filter((o) => {
    if (activeTab !== "all" && o.order_status !== activeTab) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchId = o.id.toLowerCase().includes(q);
      const matchCust = o.customer_name?.toLowerCase().includes(q) || o.customer_email?.toLowerCase().includes(q);
      return matchId || matchCust;
    }
    return true;
  });

  return (
    <CompanyShell>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Orders & Fulfillment</h1>
          <p className="text-xs text-slate-500 mt-1">Manage customer orders, track package shipments, and update order statuses.</p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search order ID, customer name, email..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500 text-slate-900"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            {["all", "pending", "processing", "shipped", "delivered", "cancelled"].map((st) => (
              <button
                key={st}
                onClick={() => setActiveTab(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase transition-all ${
                  activeTab === st
                    ? "bg-amber-500 text-slate-950 font-black shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 font-semibold">
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Items Count</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Order Status</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">#{o.id.slice(0, 8)}</td>
                    <td className="py-3 px-4 font-medium text-slate-900">
                      <div>
                        <span className="block font-bold">{o.customer_name || "Merchant Customer"}</span>
                        <span className="block text-[11px] text-slate-400">{o.customer_email || "N/A"}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700">{o.items.length} items</td>
                    <td className="py-3 px-4 font-extrabold text-slate-900">{formatPKR(o.total)}</td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {o.payment_status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-50 text-amber-900 border border-amber-200/80">
                        {o.order_status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{new Date(o.created_at).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/company/orders/${o.id}`}
                        className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 font-bold hover:bg-amber-100 transition-colors inline-flex items-center gap-1 border border-amber-200/60"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Manage</span>
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No orders matching selected status filter.
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

export default function CompanyOrdersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-slate-400">Loading orders...</div>}>
      <CompanyOrdersContent />
    </Suspense>
  );
}
