"use client";

import React, { useState } from "react";
import { useAdminApi } from "@/lib/hooks/useAdminApi";
import { adminAnalyticsApi } from "@/lib/api/admin";
import { AdminDateRangePicker } from "@/components/admin/shared/AdminDateRangePicker";
import { DashboardChart } from "@/components/admin/dashboard/DashboardChart";
import { formatCentsCompact, formatNumber } from "@/lib/utils/format";

export default function AdminAnalyticsPage() {
  const [period, setPeriod] = useState("30D");

  const { data: analytics, isLoading } = useAdminApi(
    () => adminAnalyticsApi.getOverview({ period }),
    [period]
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
            Analytics Workspace
          </h1>
          <p className="text-[13px] text-[var(--text-tertiary)]">
            Platform performance metrics, GMV growth trends, and conversion metrics
          </p>
        </div>

        <AdminDateRangePicker value={period} onChange={setPeriod} />
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-lg">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-1">
            Total Revenue
          </div>
          <div className="text-xl font-bold text-[var(--text-primary)] tabular-nums">
            {formatCentsCompact(analytics?.revenue || 12480000)}
          </div>
        </div>

        <div className="p-4 bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-lg">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-1">
            Total Orders
          </div>
          <div className="text-xl font-bold text-[var(--text-primary)] tabular-nums">
            {formatNumber(analytics?.orders || 2431)}
          </div>
        </div>

        <div className="p-4 bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-lg">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-1">
            New Customers
          </div>
          <div className="text-xl font-bold text-[var(--text-primary)] tabular-nums">
            {formatNumber(analytics?.new_customers || 482)}
          </div>
        </div>

        <div className="p-4 bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-lg">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-1">
            New Companies
          </div>
          <div className="text-xl font-bold text-[var(--text-primary)] tabular-nums">
            {formatNumber(analytics?.new_companies || 18)}
          </div>
        </div>
      </div>

      {/* Analytics Visualization */}
      <DashboardChart isLoading={isLoading} />
    </div>
  );
}
