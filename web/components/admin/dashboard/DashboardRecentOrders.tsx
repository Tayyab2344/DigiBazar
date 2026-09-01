"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatCents, formatOrderId, formatRelativeTime } from "@/lib/utils/format";
import { AdminStatusBadge } from "../shared/AdminStatusBadge";
import type { RecentOrderRead } from "@/types/admin";

interface DashboardRecentOrdersProps {
  orders: RecentOrderRead[];
  isLoading: boolean;
}

export function DashboardRecentOrders({ orders, isLoading }: DashboardRecentOrdersProps) {
  return (
    <div className="bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-lg">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-primary)]">
        <h3 className="text-[13px] font-semibold text-[var(--text-primary)]">
          Recent Orders
        </h3>
        <Link
          href="/admin/orders"
          className="flex items-center gap-1 text-[12px] font-medium text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
        >
          View all
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="divide-y divide-[var(--border-primary)]">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-3 space-y-2">
              <div className="skeleton h-4 w-28" />
              <div className="skeleton h-3 w-40" />
            </div>
          ))
        ) : orders.length === 0 ? (
          <div className="py-8 text-center text-[13px] text-[var(--text-tertiary)]">
            No recent orders
          </div>
        ) : (
          orders.map((order) => (
            <Link
              key={order.id}
              href={`/admin/orders/${order.id}`}
              className="flex items-center justify-between p-3 hover:bg-[var(--surface-secondary)] transition-colors block group"
            >
              <div className="space-y-0.5 min-w-0 pr-2">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-medium text-[var(--text-primary)] group-hover:underline">
                    {formatOrderId(order.id)}
                  </span>
                  <span className="text-[12px] text-[var(--text-tertiary)] truncate">
                    {order.company_name}
                  </span>
                </div>
                <div className="text-[12px] text-[var(--text-quaternary)] truncate">
                  {order.customer_email} • {formatRelativeTime(order.created_at)}
                </div>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0 text-right">
                <div className="text-[13px] font-semibold text-[var(--text-primary)] tabular-nums">
                  {formatCents(order.total)}
                </div>
                <AdminStatusBadge status={order.order_status} />
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
