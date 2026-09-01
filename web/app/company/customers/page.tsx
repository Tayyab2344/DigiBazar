"use client";

import React, { useState, useEffect } from "react";
import { CompanyShell } from "@/components/company/CompanyShell";
import { companyApi } from "@/lib/api/company";
import type { CompanyCustomerRead } from "@/types/company";
import { Users, Search, Mail, Phone, Calendar, ShoppingBag, CreditCard } from "lucide-react";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CompanyCustomerRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadCustomers() {
      try {
        setLoading(true);
        const res = await companyApi.listCustomers({ page: 1, page_size: 50 });
        const list = Array.isArray(res) ? res : ((res as any)?.items || []);
        setCustomers(list);
      } catch (err) {
        console.error("Failed to load customers:", err);
        setCustomers([]);
      } finally {
        setLoading(false);
      }
    }
    loadCustomers();
  }, []);

  const formatPKR = (cents: number) => `PKR ${((cents || 0) / 100).toLocaleString("en-PK", { minimumFractionDigits: 2 })}`;

  const filtered = (customers || []).filter(
    (c) =>
      (c.first_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.last_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.email || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <CompanyShell>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customer Directory</h1>
          <p className="text-xs text-slate-500 mt-1">Customers who have purchased products from your storefront.</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers by name or email..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500 text-slate-900"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 font-semibold">
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Orders Count</th>
                <th className="py-3 px-4">Total Spent</th>
                <th className="py-3 px-4">Customer Since</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.length > 0 ? (
                filtered.map((c) => {
                  const count = c.orders_count ?? c.total_orders ?? 0;
                  const spent = c.total_spent ?? c.total_spending ?? 0;
                  const rawDate = c.created_at || c.first_order_at || c.last_order_at;
                  const dateStr = rawDate ? new Date(rawDate).toLocaleDateString() : "Recent Customer";

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {c.first_name} {c.last_name}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{c.email}</td>
                      <td className="py-3 px-4 font-bold text-amber-700">{count} {count === 1 ? "order" : "orders"}</td>
                      <td className="py-3 px-4 font-extrabold text-slate-900">{formatPKR(spent)}</td>
                      <td className="py-3 px-4 text-slate-500">{dateStr}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No customer records found.
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
