"use client";

import React, { useState } from "react";
import { useAdminApi } from "@/lib/hooks/useAdminApi";
import { adminDashboardApi, adminAuditLogsApi } from "@/lib/api/admin";
import { DashboardOverview } from "@/components/admin/dashboard/DashboardOverview";
import { DashboardChart } from "@/components/admin/dashboard/DashboardChart";
import { DashboardHealth } from "@/components/admin/dashboard/DashboardHealth";
import { DashboardRecentOrders } from "@/components/admin/dashboard/DashboardRecentOrders";
import { DashboardActivity } from "@/components/admin/dashboard/DashboardActivity";
import { AdminDateRangePicker } from "@/components/admin/shared/AdminDateRangePicker";

export default function AdminDashboardPage() {
  const [dateRange, setDateRange] = useState("30D");

  const { data: stats, isLoading: statsLoading } = useAdminApi(
    adminDashboardApi.getStats
  );

  const { data: auditData, isLoading: auditLoading } = useAdminApi(
    () => adminAuditLogsApi.list({ page_size: 10 })
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* Header / Date selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
            Marketplace Overview
          </h1>
          <p className="text-[13px] text-[var(--text-tertiary)]">
            Real-time platform operations and financial metrics
          </p>
        </div>

        <AdminDateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      {/* Primary Metrics */}
      <DashboardOverview stats={stats} isLoading={statsLoading} />

      {/* Revenue / GMV Visualization */}
      <DashboardChart stats={stats} isLoading={statsLoading} />

      {/* Two Column Layout: Health + Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardHealth stats={stats} isLoading={statsLoading} />
        <DashboardRecentOrders
          orders={stats?.recent_orders || []}
          isLoading={statsLoading}
        />
      </div>

      {/* Activity Stream */}
      <DashboardActivity
        logs={auditData?.items || []}
        isLoading={auditLoading}
      />
    </div>
  );
}
